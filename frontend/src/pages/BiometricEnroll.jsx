import { useEffect, useRef, useState } from 'react';
import CameraSelect from '../components/CameraSelect';
import VideoFeed from '../components/VideoFeed';
import FaceButtons from '../components/FaceButtons';
import { loadFaceModels } from '../lib/face';
import { apiEnroll } from '../lib/api';

export default function BiometricEnroll() {
  const [deviceId, setDeviceId] = useState('');
  const videoRef = useRef(null);

  // 1) carga modelos al montar el componente
  useEffect(() => {
    (async () => {
      try {
        await loadFaceModels();
      } catch (e) {
        console.error('[enroll] Error cargando modelos:', e);
        alert('No se pudieron cargar los modelos. Revisa la consola.');
      }
    })();
  }, []);

  // 2) aplicar clase visual al <video> cuando exista
  useEffect(() => {
    if (videoRef.current) videoRef.current.className = 'video-el';
  });

  async function onEnroll(embedding, setStatus) {
    const userId = prompt('Pega el UUID del usuario a enrolar (desde pgAdmin, tabla users.id)');
    if (!userId) { setStatus('Enrolamiento cancelado'); return; }

    try {
      setStatus('Enviando a la base de datos…');
      const resp = await apiEnroll(userId, embedding);
      if (resp.ok) {
        console.log('[enroll] templateId:', resp.templateId);
        setStatus('Enrolamiento exitoso ✅');
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

  return (
    <div className="container py-4">
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card card-soft">
            <div className="card-body p-4">
              <h2 className="title-strong h3 mb-3">Enrolamiento Biométrico</h2>
              <label className="form-label fw-semibold">Cámara</label>
              <CameraSelect value={deviceId} onChange={setDeviceId} />

              <div className="video-wrapper mt-3">
                <VideoFeed deviceId={deviceId} ref={videoRef} />
              </div>

              <FaceButtons videoRef={videoRef} onEnroll={onEnroll} onVerify={onVerify} />
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card card-soft">
            <div className="card-body">
              <h6 className="fw-bold"><i className="bi bi-info-circle me-2 text-primary"></i>¿Qué guardamos?</h6>
              <p className="small text-muted mb-0">
                El vector de 128 dimensiones en <code>face_templates</code>. No almacenamos fotos crudas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
