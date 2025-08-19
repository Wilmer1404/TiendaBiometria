// src/lib/api.js
export async function apiGetProducts() {
  const r = await fetch('/api/products');
  if (!r.ok) throw new Error('No se pudieron cargar productos');
  return r.json();
}
export async function apiEnroll(userId, embedding, quality = 0.9) {
  const r = await fetch('/api/enroll', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ userId, embedding, quality })
  });
  return r.json();
}
export async function apiVerify(embedding) {
  const r = await fetch('/api/verify', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ embedding })
  });
  return r.json();
}
export async function apiCheckout(userId, items) {
  const r = await fetch('/api/checkout', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ userId, items })
  });
  return r.json();
}
