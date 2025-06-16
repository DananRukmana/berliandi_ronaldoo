import { getAccessToken } from '../utils/auth';
import { BASE_URL } from '../config';

const ENDPOINTS = {
  REGISTER: `${BASE_URL}/register`,
  LOGIN: `${BASE_URL}/login`,
  MY_USER_INFO: `${BASE_URL}/users/me`,

  REPORT_LIST: `${BASE_URL}/stories`,
  REPORT_DETAIL: (id) => `${BASE_URL}/stories/${id}`,
  STORE_NEW_REPORT: `${BASE_URL}/stories`,

  SUBSCRIBE: `${BASE_URL}/notifications/subscribe`,
  UNSUBSCRIBE: `${BASE_URL}/notifications/subscribe`,
};

async function apiRequest(url, options = {}) {
  // Skip caching for non-GET requests (POST, PUT, DELETE)
  if (options.method && options.method !== 'GET') {
    return fetchWithErrorHandling(url, options);
  }

  try {
    // Network-first strategy for API calls
    const fetchResponse = await fetch(url, options);
    if (fetchResponse.ok) {
      // Cache the response if it's successful
      if ('caches' in window) {
        const cache = await caches.open('story-app');
        await cache.put(url, fetchResponse.clone());
      }
      return await fetchResponse.json();
    }
    throw new Error(`HTTP error! status: ${fetchResponse.status}`);
  } catch (error) {
    console.warn('Network request failed, falling back to cache:', error);
    // Fallback to cache if network fails
    if ('caches' in window) {
      const cache = await caches.open('story-app');
      const cachedResponse = await cache.match(url);
      if (cachedResponse) {
        return await cachedResponse.json();
      }
    }
    return {
      error: 'Gagal menghubungi server. Anda sedang offline dan data tidak tersedia di cache.',
      ok: false,
    };
  }
}

// Helper for non-cacheable requests
async function fetchWithErrorHandling(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { ...data, ok: response.ok };
  } catch (error) {
    console.error('Request failed:', error);
    return { error: 'Gagal menghubungi server', ok: false };
  }
}

// ====================== API Functions ======================
// Auth API
export const getRegistered = async ({ name, email, password }) =>
  fetchWithErrorHandling(ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

export const getLogin = async ({ email, password }) =>
  fetchWithErrorHandling(ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

// User API (GET requests - cached)
export const getMyUserInfo = async () =>
  apiRequest(ENDPOINTS.MY_USER_INFO, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });

// Reports API
export const getAllReports = async () =>
  apiRequest(ENDPOINTS.REPORT_LIST, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });

export const getReportById = async (id) =>
  apiRequest(ENDPOINTS.REPORT_DETAIL(id), {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });

export const AddNewStory = async ({ description, photo, lat, lon }) => {
  const formData = new FormData();
  formData.append('description', description);
  formData.append('photo', photo);
  if (lat !== undefined) formData.append('lat', lat);
  if (lon !== undefined) formData.append('lon', lon);

  return fetchWithErrorHandling(ENDPOINTS.STORE_NEW_REPORT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    body: formData,
  });
};

// Push Notification API (non-cacheable)
export const subscribePushNotification = async ({ endpoint, keys: { p256dh, auth } }) =>
  fetchWithErrorHandling(ENDPOINTS.SUBSCRIBE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify({ endpoint, keys: { p256dh, auth } }),
  });

export const unsubscribePushNotification = async ({ endpoint }) =>
  fetchWithErrorHandling(ENDPOINTS.UNSUBSCRIBE, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify({ endpoint }),
  });
