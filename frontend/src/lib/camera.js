// src/lib/camera.js

export async function listVideoInputs() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(d => d.kind === 'videoinput');
}

export async function startCamera(videoEl, deviceId, { width = 1280, height = 720 } = {}) {
  // Cierra stream previo
  if (videoEl.srcObject) {
    videoEl.srcObject.getTracks().forEach(t => t.stop());
  }

  const base = {
    width: { ideal: width },
    height: { ideal: height },
    facingMode: { ideal: 'user' }
  };

  const constraints = deviceId
    ? { video: { ...base, deviceId: { exact: deviceId } }, audio: false }
    : { video: base, audio: false };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.srcObject = stream;
    await videoEl.play().catch(() => { });
    return stream;
  } catch (err) {
    console.error('[camera] getUserMedia error:', err, 'constraints:', constraints);
    throw err;
  }
}
