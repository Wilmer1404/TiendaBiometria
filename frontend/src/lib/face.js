// src/lib/face.js

// Modelos EXACTOS para face-api.js@0.22.2 (CDN)
const MODELS_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';

// Espera robusta a que window.faceapi exista (evita carreras con Vite)
async function ensureFaceApiReady() {
  let fa = window.faceapi;
  if (fa) return fa;

  if (document.readyState !== 'complete') {
    await new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
  }
  fa = window.faceapi;
  if (!fa) {
    console.error('[face] window.faceapi sigue undefined tras window.load. Revisa index.html y el script UMD (face-api.min.js@0.22.2).');
    throw new Error('faceapi no está disponible');
  }
  return fa;
}

// Singleton para evitar cargas duplicadas
let loadPromise = null;

export async function loadFaceModels() {
  const faceapi = await ensureFaceApiReady();

  // Ya cargados
  if (faceapi.nets?.tinyFaceDetector?.params) {
    console.log('[face] Modelos ya estaban cargados, continuo.');
    return;
  }
  // Carga en curso
  if (loadPromise) {
    console.log('[face] Esperando carga de modelos en curso…');
    return loadPromise;
  }

  console.time('[face] carga de modelos');
  console.log('[face] Cargando modelos desde:', MODELS_URL);

  loadPromise = Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
  ])
    .then(async () => {
      console.timeEnd('[face] carga de modelos');
      console.log('[face] Modelos cargados OK ✅');
      // Warm-up ligero para evitar lag en la primera inferencia
      try {
        const off = document.createElement('canvas');
        off.width = 64; off.height = 64;
        await faceapi.detectSingleFace(off, new faceapi.TinyFaceDetectorOptions());
        console.log('[face] warm-up completado');
      } catch { }
    })
    .catch((e) => {
      loadPromise = null; // permitir reintentos
      console.error('[face] Falló la carga de modelos:', e);
      throw e;
    });

  return loadPromise;
}

export async function getBestEmbedding(videoEl) {
  const faceapi = await ensureFaceApiReady();
  if (!videoEl) {
    console.warn('[face] getBestEmbedding: videoEl no existe todavía');
    return null;
  }

  const opts = new faceapi.TinyFaceDetectorOptions({
    inputSize: 320,        // 160|224|320|416|512…
    scoreThreshold: 0.5    // sensibilidad de detección
  });

  const det = await faceapi
    .detectSingleFace(videoEl, opts)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!det) {
    console.log('[face] No se detectó rostro en el frame actual');
    return null;
  }

  const emb = Array.from(det.descriptor); // Float32Array(128) -> Array
  console.log('[face] Embedding capturado (primeros 6):', emb.slice(0, 6), '… len=', emb.length);
  return emb;
}
