import { forwardRef, useEffect } from 'react';
import { startCamera } from '../lib/camera';

const VideoFeed = forwardRef(function VideoFeed({ deviceId, className }, ref) {
  useEffect(() => {
    if (!ref?.current) return;
    let cancelled = false;

    (async () => {
      try {
        await startCamera(ref.current, deviceId);
        // Espera a que tenga tamaño (algunos navegadores tardan un frame)
        ref.current.oncanplay = () => {
          if (!cancelled) ref.current.play().catch(()=>{});
        };
      } catch (e) {
        alert('No se pudo abrir la cámara. Revisa permisos y selecciona otro dispositivo.');
      }
    })();

    return () => { cancelled = true; };
  }, [deviceId, ref]);

  return <video ref={ref} autoPlay muted playsInline className={className || 'video-el'} />;
});

export default VideoFeed;
