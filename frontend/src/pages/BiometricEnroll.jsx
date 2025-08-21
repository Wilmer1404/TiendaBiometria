import { useEffect, useRef, useState } from 'react';
import CameraSelect from '../components/CameraSelect';
import VideoFeed from '../components/VideoFeed';
import FaceButtons from '../components/FaceButtons';
import { loadFaceModels } from '../lib/face';
import { apiEnroll } from '../lib/api';

export default function BiometricEnroll({ userId, onEnrollmentComplete }) {
  const [deviceId, setDeviceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [step, setStep] = useState(1);
  const videoRef = useRef(null);

  // 1) carga modelos al montar el componente
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        setStatus('Cargando modelos de reconocimiento facial...');
        await loadFaceModels();
        setStatus('Modelos cargados exitosamente ✅');
        setIsLoading(false);
      } catch (e) {
        console.error('[enroll] Error cargando modelos:', e);
        setStatus('Error cargando modelos. Revisa la consola.');
        setIsLoading(false);
      }
    })();
  }, []);

  // 2) aplicar clase visual al <video> cuando exista
  useEffect(() => {
    if (videoRef.current) videoRef.current.className = 'video-el';
  });

  async function onEnroll(embedding, setStatus) {
    if (!userId) {
      setStatus('Error: No hay usuario seleccionado');
      return;
    }

    try {
      setStatus('Enviando datos biométricos a la base de datos...');
      const resp = await apiEnroll(userId, embedding);
      if (resp.ok) {
        console.log('[enroll] templateId:', resp.templateId);
        setStatus('Enrolamiento biométrico exitoso ✅');
        setStep(3);
        if (onEnrollmentComplete) {
          setTimeout(() => onEnrollmentComplete(), 2000);
        }
      } else {
        console.error('[enroll] fallo:', resp);
        setStatus('Error al enrolar: ' + (resp.error || 'desconocido'));
      }
    } catch (e) {
      console.error('[enroll] excepción:', e);
      setStatus('Error de red/servidor');
    }
  }

  async function onVerify() {}

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
          {/* Header con pasos */}
          <div className="text-center mb-5">
            <h2 className="display-6 fw-bold text-primary mb-3">
              <i className="bi bi-shield-check me-3"></i>
              Enrolamiento Biométrico
            </h2>
            <div className="d-flex justify-content-center align-items-center">
              <div className={`step-indicator ${step >= 1 ? 'active' : ''}`}>
                <span className="step-number">1</span>
                <span className="step-label">Configuración</span>
              </div>
              <div className="step-connector"></div>
              <div className={`step-indicator ${step >= 2 ? 'active' : ''}`}>
                <span className="step-number">2</span>
                <span className="step-label">Captura</span>
              </div>
              <div className="step-connector"></div>
              <div className={`step-indicator ${step >= 3 ? 'active' : ''}`}>
                <span className="step-number">3</span>
                <span className="step-label">Completado</span>
              </div>
            </div>
          </div>

          {step === 1 && (
            <div className="card shadow-lg border-0">
              <div className="card-header bg-gradient-primary text-white py-4">
                <h4 className="mb-0">
                  <i className="bi bi-camera-video me-2"></i>
                  Paso 1: Configuración de Cámara
                </h4>
              </div>
              <div className="card-body p-4">
                <div className="row">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-camera me-2 text-primary"></i>
                      Selecciona tu cámara
                    </label>
                    <CameraSelect value={deviceId} onChange={setDeviceId} />
                    
                    <div className="mt-4">
                      <h6 className="fw-bold text-primary">
                        <i className="bi bi-lightbulb me-2"></i>
                        Consejos para un buen enrolamiento:
                      </h6>
                      <ul className="list-unstyled">
                        <li className="mb-2">
                          <i className="bi bi-check-circle text-success me-2"></i>
                          Busca un lugar bien iluminado
                        </li>
                        <li className="mb-2">
                          <i className="bi bi-check-circle text-success me-2"></i>
                          Mira directamente a la cámara
                        </li>
                        <li className="mb-2">
                          <i className="bi bi-check-circle text-success me-2"></i>
                          Mantén una expresión neutra
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="video-wrapper">
                      <VideoFeed deviceId={deviceId} ref={videoRef} />
                    </div>
                  </div>
                </div>
                
                <div className="text-center mt-4">
                  <button 
                    className="btn btn-primary btn-lg px-5"
                    onClick={() => setStep(2)}
                    disabled={!deviceId}
                  >
                    <i className="bi bi-arrow-right me-2"></i>
                    Continuar al Enrolamiento
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="card shadow-lg border-0">
              <div className="card-header bg-gradient-success text-white py-4">
                <h4 className="mb-0">
                  <i className="bi bi-person-check me-2"></i>
                  Paso 2: Captura Biométrica
                </h4>
              </div>
              <div className="card-body p-4">
                <div className="row">
                  <div className="col-lg-7">
                    <div className="video-wrapper">
                      <VideoFeed deviceId={deviceId} ref={videoRef} />
                    </div>
                    
                    <div className="mt-3">
                      <FaceButtons videoRef={videoRef} onEnroll={onEnroll} onVerify={onVerify} />
                    </div>
                  </div>
                  
                  <div className="col-lg-5">
                    <div className="alert alert-info">
                      <h6 className="fw-bold">
                        <i className="bi bi-info-circle me-2"></i>
                        Estado del Enrolamiento
                      </h6>
                      <p className="mb-2">{status || 'Listo para capturar tu rostro'}</p>
                    </div>
                    
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6 className="fw-bold text-primary">
                          <i className="bi bi-shield-lock me-2"></i>
                          ¿Qué se guarda?
                        </h6>
                        <p className="small text-muted mb-0">
                          Solo se almacena un vector matemático de 128 dimensiones que representa 
                          las características únicas de tu rostro. No se guardan fotos ni imágenes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="card shadow-lg border-0">
              <div className="card-header bg-gradient-success text-white py-4 text-center">
                <h4 className="mb-0">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  ¡Enrolamiento Completado!
                </h4>
              </div>
              <div className="card-body text-center py-5">
                <div className="display-1 text-success mb-4">
                  <i className="bi bi-shield-check"></i>
                </div>
                <h3 className="text-success mb-3">Tu rostro ha sido registrado exitosamente</h3>
                <p className="text-muted mb-4">
                  Ahora puedes acceder a la tienda usando autenticación biométrica
                </p>
                <div className="alert alert-success d-inline-block">
                  <i className="bi bi-lightbulb me-2"></i>
                  <strong>Próximo paso:</strong> Ve a "Autenticar" para acceder a la tienda
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
