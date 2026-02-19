import axios from 'axios';
import { getConfig } from './config.js';

const BASE_URL = 'https://api.agco-ats.com';

// ============================================================
// API Client
// ============================================================

async function getAuthHeaders() {
  const apiKey = getConfig('apiKey');
  const token = getConfig('token');

  if (!apiKey && !token) {
    throw new Error('AGCO ATS credentials not configured. Run: agcoats config set --api-key <key>');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
    headers['X-API-Key'] = apiKey;
  }

  return headers;
}

async function apiRequest(method, path, body = null, params = null) {
  const headers = await getAuthHeaders();

  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${path}`,
      headers,
      data: body || undefined,
      params: params || undefined
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

function handleApiError(error) {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    if (status === 401) throw new Error('Authentication failed. Check your API key or token.');
    if (status === 403) throw new Error('Access forbidden. You do not have permission to access this resource.');
    if (status === 404) throw new Error('Resource not found.');
    if (status === 429) throw new Error('Rate limit exceeded. Please wait before retrying.');
    const message = data?.message || data?.error || data?.detail || JSON.stringify(data);
    throw new Error(`API Error (${status}): ${message}`);
  } else if (error.request) {
    throw new Error('No response from AGCO ATS API. Check your internet connection.');
  } else {
    throw error;
  }
}

// ============================================================
// EQUIPMENT
// ============================================================

export async function listEquipment({ page = 1, pageSize = 20, type, status } = {}) {
  const params = { page, pageSize };
  if (type) params.type = type;
  if (status) params.status = status;
  const data = await apiRequest('GET', '/v1/equipment', null, params);
  return data.items || data.equipment || data || [];
}

export async function getEquipment(equipmentId) {
  return await apiRequest('GET', `/v1/equipment/${encodeURIComponent(equipmentId)}`);
}

export async function registerEquipment({ serialNumber, model, type, manufacturerDate, ownerId }) {
  const body = { serialNumber, model, type };
  if (manufacturerDate) body.manufacturerDate = manufacturerDate;
  if (ownerId) body.ownerId = ownerId;
  return await apiRequest('POST', '/v1/equipment', body);
}

export async function updateEquipment(equipmentId, updates) {
  return await apiRequest('PUT', `/v1/equipment/${encodeURIComponent(equipmentId)}`, updates);
}

// ============================================================
// FIELDS
// ============================================================

export async function listFields({ page = 1, pageSize = 20, farmId } = {}) {
  const params = { page, pageSize };
  if (farmId) params.farmId = farmId;
  const data = await apiRequest('GET', '/v1/fields', null, params);
  return data.items || data.fields || data || [];
}

export async function getField(fieldId) {
  return await apiRequest('GET', `/v1/fields/${encodeURIComponent(fieldId)}`);
}

export async function createField({ name, area, areaUnit = 'hectares', farmId, boundaries, cropType }) {
  const body = { name, area, areaUnit };
  if (farmId) body.farmId = farmId;
  if (boundaries) body.boundaries = boundaries;
  if (cropType) body.cropType = cropType;
  return await apiRequest('POST', '/v1/fields', body);
}

export async function updateField(fieldId, updates) {
  return await apiRequest('PUT', `/v1/fields/${encodeURIComponent(fieldId)}`, updates);
}

// ============================================================
// SENSORS
// ============================================================

export async function listSensors({ page = 1, pageSize = 20, equipmentId, fieldId, type } = {}) {
  const params = { page, pageSize };
  if (equipmentId) params.equipmentId = equipmentId;
  if (fieldId) params.fieldId = fieldId;
  if (type) params.type = type;
  const data = await apiRequest('GET', '/v1/sensors', null, params);
  return data.items || data.sensors || data || [];
}

export async function getSensor(sensorId) {
  return await apiRequest('GET', `/v1/sensors/${encodeURIComponent(sensorId)}`);
}

export async function getSensorReadings(sensorId, { startDate, endDate, limit = 100 } = {}) {
  const params = { limit };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const data = await apiRequest('GET', `/v1/sensors/${encodeURIComponent(sensorId)}/readings`, null, params);
  return data.items || data.readings || data || [];
}

export async function getLatestReading(sensorId) {
  return await apiRequest('GET', `/v1/sensors/${encodeURIComponent(sensorId)}/readings/latest`);
}
