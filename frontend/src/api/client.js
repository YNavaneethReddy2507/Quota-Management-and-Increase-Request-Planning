/**
 * Centralized API Client Module with Axios Interceptors
 * Quota Management and Increase Request Planning Control Plane
 */

import axios from 'axios';
import { toast } from 'react-hot-toast';

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Current active role for RBAC header injection
let currentRole = 'Admin';

export const setClientUserRole = (role) => {
  currentRole = role;
};

// Request Interceptor: Attach headers and auth mocks
apiClient.interceptors.request.use(
  (config) => {
    config.headers['X-User-Role'] = currentRole;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Unified error handling and response unwrapping
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response ? error.response.status : null;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Network communication failed';

    if (status === 403) {
      toast.error(`Forbidden (403): ${message}`);
    } else if (status === 404) {
      toast.error(`Not Found (404): ${message}`);
    } else if (status >= 500) {
      toast.error(`Server Error (${status}): ${message}`);
    }

    return Promise.reject(error);
  }
);

// Typed and documented service methods
export const api = {
  health: {
    check: () => apiClient.get('/health'),
  },
  projects: {
    list: () => apiClient.get('/projects'),
    getById: (id) => apiClient.get(`/projects/${id}`),
  },
  quotas: {
    list: (params = {}) => apiClient.get('/quotas', { params }),
    getById: (id) => apiClient.get(`/quotas/${id}`),
  },
  requests: {
    list: (params = {}) => apiClient.get('/requests', { params }),
    getById: (id) => apiClient.get(`/requests/${id}`),
    create: (data) => apiClient.post('/requests', data),
    approve: (id, comments = '') =>
      apiClient.patch(`/requests/${id}/approve`, { admin_comments: comments }),
    reject: (id, comments) =>
      apiClient.patch(`/requests/${id}/reject`, { admin_comments: comments }),
  },
  settings: {
    get: () => apiClient.get('/settings'),
    update: (data) => apiClient.patch('/settings', data),
    getAudit: () => apiClient.get('/settings/audit'),
  },
};

export default apiClient;
