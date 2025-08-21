// src/lib/api.js

// Configuración de la API - URL directa al backend
const API_BASE_URL = 'http://localhost:3000';

// Función helper para hacer peticiones
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

export async function apiGetProducts() {
  return apiRequest('/api/products');
}

export async function apiCreateUser(userData) {
  return apiRequest('/api/users', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

export async function apiGetUser(userId) {
  return apiRequest(`/api/user/${userId}`);
}

export async function apiGetUserAuthStats(userId) {
  return apiRequest(`/api/user/${userId}/auth-stats`);
}

export async function apiGetUserTransactions(userId) {
  return apiRequest(`/api/user/${userId}/transactions`);
}

export async function apiEnroll(userId, embedding, quality = 0.9) {
  return apiRequest('/api/enroll', {
    method: 'POST',
    body: JSON.stringify({ userId, embedding, quality })
  });
}

export async function apiVerify(embedding) {
  return apiRequest('/api/verify', {
    method: 'POST',
    body: JSON.stringify({ embedding })
  });
}

export async function apiCheckout(userId, items) {
  return apiRequest('/api/checkout', {
    method: 'POST',
    body: JSON.stringify({ userId, items })
  });
}
