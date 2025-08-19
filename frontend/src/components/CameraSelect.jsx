import { useEffect, useState } from 'react';
import { listVideoInputs } from '../lib/camera';

function preferPhoneLabel(label = '') {
  const l = label.toLowerCase();
  // Prioriza Iriun, DroidCam, IP Webcam, etc.
  return l.includes('iriun') || l.includes('droidcam') || l.includes('ip webcam') || l.includes('phone');
}

export default function CameraSelect({ value, onChange }) {
  const [cams, setCams] = useState([]);

  async function refresh() {
    try {
      // pedir permiso para que los labels aparezcan
      await navigator.mediaDevices.getUserMedia({ video: true });
    } catch { }
    const list = await listVideoInputs();
    setCams(list);

    if (!value && list.length) {
      const phone = list.find(d => preferPhoneLabel(d.label));
      onChange(phone ? phone.deviceId : list[0].deviceId);
    }
  }

  useEffect(() => {
    refresh();
    // refresca cuando se conectan/desconectan dispositivos
    const handler = () => refresh();
    navigator.mediaDevices?.addEventListener?.('devicechange', handler);
    return () => navigator.mediaDevices?.removeEventListener?.('devicechange', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <select className="form-select" value={value || ''} onChange={e => onChange(e.target.value)}>
      {cams.map((c, i) => (
        <option key={c.deviceId} value={c.deviceId}>
          {c.label || `Cámara ${i + 1}`}
        </option>
      ))}
    </select>
  );
}
