import { useState } from 'react';
import { getBestEmbedding } from '../lib/face';

export default function FaceButtons({ videoRef, onEnroll, onVerify }) {
  const [status, setStatus] = useState('');

  async function capture(kind) {
    setStatus(kind === 'enroll' ? 'Enrolando…' : 'Autenticando…');
    const emb = await getBestEmbedding(videoRef.current);
    if (!emb) { setStatus('No se detectó rostro.'); return; }
    if (kind === 'enroll') await onEnroll(emb, setStatus);
    else await onVerify(emb, setStatus);
  }

  return (
    <div className="d-flex gap-2 mt-2 align-items-center">
      <button className="btn btn-primary" onClick={() => capture('enroll')}>Enrolar</button>
      <button className="btn btn-success" onClick={() => capture('verify')}>Autenticar</button>
      <span className="small ms-2" aria-live="polite">{status}</span>
    </div>
  );
}
