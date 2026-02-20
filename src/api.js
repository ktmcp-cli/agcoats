import { getConfig } from './config.js';

async function request(endpoint, method = 'GET', body = null) {
  const config = getConfig();
  
  const url = `${config.baseUrl}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json'
  };

  if (config.token) {
    headers['Authorization'] = `Bearer ${config.token}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error: ${response.status} ${text}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

export async function checkConnectivity() {
  return request('/AftermarketServices/Hello');
}

export async function authenticate(username, password) {
  return request('/Authentication', 'POST', { username, password });
}

export async function getEngineIQACodes(serialNumber) {
  return request(`/AftermarketServices/Engines/${serialNumber}/IQACodes`);
}

export async function getEngineProductionData(serialNumber) {
  return request(`/AftermarketServices/Engines/${serialNumber}/ProductionData`);
}

export async function getCertificates() {
  return request('/AftermarketServices/Certificates');
}

export async function getBrands() {
  return request('/Brands');
}

export async function getCurrentUser() {
  return request('/Users/Current');
}
