import { useEffect, useRef, useState } from 'react';
import CameraSelect from '../components/CameraSelect';
import VideoFeed from '../components/VideoFeed';
import { loadFaceModels, getBestEmbedding } from '../lib/face';
import { apiVerify } from '../lib/api';

export default function BiometricLogin({ onAuthenticated }) {
  const [deviceId, setDeviceId] = useState('');
  const [status, setStatus] = useState('Listo');
  const [badge, setBadge] = useState({ text:'Listo', type:'secondary' });
  const videoRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        await loadFaceModels();
      } catch (e) {
        console.error('[login] Error cargando modelos:', e);
        alert('No se pudieron cargar los modelos. Revisa la consola.');
      }
    })();
  }, []);

  useEffect(() => {
    if (videoRef.current) videoRef.current.className = 'video-el';
  });

  async function verify() {
    setStatus('Buscando rostro…'); setBadge({ text:'Procesando', type:'warning' });

    const emb = await getBestEmbedding(videoRef.current);
    if (!emb) {
      setStatus('No se detectó rostro. Acércate y mira de frente.');
      setBadge({ text:'Sin rostro', type:'danger' });
      return;
    }

    try {
      const resp = await apiVerify(emb);
      console.log('[login] verify resp:', resp);
      if (resp.match) {
        setStatus(`Autenticado ✅ (score ${resp.score.toFixed(3)})`);
        setBadge({ text:'Autenticado', type:'success' });
        onAuthenticated?.(resp.userId);
      } else {
        setStatus(`No coincide ❌ (score ${(resp.score||0).toFixed(3)})`);
        setBadge({ text:'Rechazado', type:'danger' });
      }
    } catch (e) {
      console.error('[login] excepción:', e);
      setStatus('Error de red/servidor');
      setBadge({ text:'Error', type:'danger' });
    }
  }

  return (
    <div className="container py-4">
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card card-soft">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <h2 className="title-strong h3 mb-0">Autenticación Biométrica</h2>
                <span className={`badge text-bg-${badge.type}`} aria-live="polite">{badge.text}</span>
              </div>

              <div className="mt-3">
                <label className="form-label fw-semibold">Cámara</label>
                <CameraSelect value={deviceId} onChange={setDeviceId} />
              </div>

              <div className="video-wrapper mt-3">
                <VideoFeed deviceId={deviceId} ref={videoRef} />
              </div>

              <div className="d-flex align-items-center gap-2 mt-3">
                <button className="btn btn-success btn-lg px-4" onClick={verify}>
                  <i className="bi bi-shield-lock me-2"></i> Autenticar
                </button>
                <span className="text-muted small" aria-live="polite">{status}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card card-soft">
            <div className="card-body">
              <h5 className="fw-bold mb-2"><i className="bi bi-lightbulb me-2 text-warning"></i>Consejos</h5>
              <ul className="mb-0 small text-muted">
                <li>Mira de frente y céntrate en el encuadre.</li>
                <li>Evita contraluz; usa luz frontal.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
