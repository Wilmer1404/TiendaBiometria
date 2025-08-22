import { useEffect, useRef, useState } from 'react';
import CameraSelect from '../components/CameraSelect';
import VideoFeed from '../components/VideoFeed';
import { loadFaceModels, getBestEmbedding } from '../lib/face';
import { apiVerify, apiGetUser } from '../lib/api';

export default function BiometricLogin({ onAuthenticated }) {
  const [deviceId, setDeviceId] = useState('');
  const [status, setStatus] = useState('Listo para autenticarte');
  const [badge, setBadge] = useState({ text:'Listo', type:'secondary' });
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        setStatus('Cargando modelos de reconocimiento facial...');
        await loadFaceModels();
        setStatus('Listo para autenticarte');
        setIsLoading(false);
      } catch (e) {
        console.error('[login] Error cargando modelos:', e);
        setStatus('Error cargando modelos. Revisa la consola.');
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (videoRef.current) videoRef.current.className = 'video-el';
  });

  async function verify() {
    setStatus('Buscando rostro en la imagen...'); 
    setBadge({ text:'Procesando', type:'warning' });

    const emb = await getBestEmbedding(videoRef.current);
    if (!emb) {
      setStatus('No se detectó rostro. Acércate y mira de frente.');
      setBadge({ text:'Sin rostro', type:'danger' });
      return;
    }

    try {
      setStatus('Verificando identidad...');
      const resp = await apiVerify(emb);
      console.log('[login] verify resp:', resp);
      
      if (resp.match) {
        setStatus(`¡Autenticación exitosa! ✅ (confianza: ${(resp.score * 100).toFixed(1)}%)`);
        setBadge({ text:'Autenticado', type:'success' });
        // Obtener información del usuario
        try {
          const userResp = await apiGetUser(resp.userId);
          if (userResp.ok) {
            setUserInfo(userResp.user);
            setStatus(`Confirma tu identidad: ${userResp.user.full_name}`);
          }
        } catch (e) {
          console.error('Error obteniendo datos del usuario:', e);
        }
        // No llamar a onAuthenticated todavía, esperar confirmación visual
      } else {
        setStatus(`No coincide ❌ (confianza: ${((resp.score||0) * 100).toFixed(1)}%)`);
        setBadge({ text:'Rechazado', type:'danger' });
      }
    } catch (e) {
      console.error('[login] excepción:', e);
      setStatus('Error de red/servidor');
      setBadge({ text:'Error', type:'danger' });
    }
  }

  if (isLoading) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-lg border-0">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status" style={{width: '3rem', height: '3rem'}}>
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <h4 className="text-muted">{status}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          {/* Header */}
          <div className="text-center mb-5">
            <h2 className="display-6 fw-bold text-primary mb-3">
              <i className="bi bi-shield-lock me-3"></i>
              Autenticación Biométrica
            </h2>
            <p className="lead text-muted">
              Accede a la tienda de forma segura con tu rostro
            </p>
          </div>

          <div className="row g-4">
            <div className="col-lg-7">
              <div className="card shadow-lg border-0">
                <div className="card-header bg-gradient-primary text-white py-4">
                  <div className="d-flex align-items-center justify-content-between">
                    <h4 className="mb-0">
                      <i className="bi bi-camera-video me-2"></i>
                      Verificación de Identidad
                    </h4>
                    <span className={`badge fs-6 text-bg-${badge.type}`} aria-live="polite">
                      {badge.text}
                    </span>
                  </div>
                </div>
                
                <div className="card-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-camera me-2 text-primary"></i>
                      Selecciona tu cámara
                    </label>
                    <CameraSelect value={deviceId} onChange={setDeviceId} />
                  </div>

                  <div className="video-wrapper mt-3">
                    <VideoFeed deviceId={deviceId} ref={videoRef} />
                  </div>

                  <div className="text-center mt-4">
                    <button 
                      className="btn btn-success btn-lg px-5" 
                      onClick={verify}
                      disabled={!deviceId}
                    >
                      <i className="bi bi-shield-lock me-2"></i> 
                      Autenticar con Rostro
                    </button>
                    
                    <div className="mt-3">
                      <span className="text-muted" aria-live="polite">{status}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              {/* Información del usuario autenticado */}
              {userInfo && (
                <div className="card shadow-lg border-0 mb-4">
                  <div className="card-header bg-gradient-success text-white py-3">
                    <h5 className="mb-0">
                      <i className="bi bi-person-check me-2"></i>
                      Confirma tu identidad
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="text-center mb-3">
                      <div className="display-4 text-success mb-2">
                        <i className="bi bi-person-circle"></i>
                      </div>
                      <h5 className="fw-bold">{userInfo.full_name}</h5>
                      <p className="text-muted mb-2">Código: {userInfo.student_id}</p>
                      <p className="text-muted mb-0">{userInfo.email}</p>
                    </div>
                    <div className="alert alert-success text-center mb-3">
                      <i className="bi bi-wallet2 me-2"></i>
                      <strong>Saldo disponible:</strong> S/ {userInfo.balance_pen}
                    </div>
                    <button className="btn btn-primary w-100" onClick={() => onAuthenticated?.(userInfo.id)}>
                      Sí, soy yo. Acceder a la tienda
                    </button>
                  </div>
                </div>
              )}

              {/* Consejos */}
              <div className="card shadow-lg border-0">
                <div className="card-header bg-gradient-info text-white py-3">
                  <h5 className="mb-0">
                    <i className="bi bi-lightbulb me-2"></i>
                    Consejos para una mejor autenticación
                  </h5>
                </div>
                <div className="card-body">
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      Mira de frente y céntrate en el encuadre
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      Evita contraluz; usa luz frontal
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      Mantén una distancia adecuada
                    </li>
                    <li className="mb-0">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      Asegúrate de que tu rostro esté bien iluminado
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
