import axios from 'axios';

const API_BASE = 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const register = (email: string, password: string, name: string) =>
  api.post('/auth/register', { email, password, name });

export const getProfile = () => api.get('/user/profile');
export const updateProfile = (data: { name: string; email: string }) =>
  api.put('/user/profile', data);
export const changePassword = (data: { old_password: string; new_password: string }) =>
  api.put('/user/password', data);
export const deleteAccount = () => api.delete('/user');
export const getUserStats = () => api.get('/user/stats');

// Stats
export const getStats = () => api.get('/stats');

// Shops
export const getShops = () => api.get('/stores');
export const getNearbyShops = (lat: number, lng: number, radius?: number) =>
  api.get('/stores/nearby', { params: { lat, lng, radius } });
export const searchShops = (query: string) =>
  api.get('/stores/search', { params: { q: query } });
export const compareShops = (products: string[]) =>
  api.post('/stores/compare', { products });

// Products
export const getProducts = () => api.get('/products');
export const getProduct = (id: number) => api.get(`/products/${id}`);
export const getIdenticalProducts = (id: number) =>
  api.get(`/products/${id}/identical`);

export const addIdenticalProduct = (id: number, identicalProductNameId: number) =>
  api.post(`/products/${id}/identical`, { identical_product_name_id: identicalProductNameId });

// Categories
export const getCategories = () => api.get('/categories');

// Templates
export const getTemplates = () => api.get('/templates');
export const getDefaultTemplates = () => api.get('/templates/default');
export const getUserTemplates = () => api.get('/templates/user');
// Templates - update these
export const createTemplate = (data: { 
  name: string; 
  products: { product_name_id: number; amount_or_weight: number }[] 
}) => api.post('/templates', data);

export const updateTemplate = (id: number, data: { 
  name: string; 
  products: { product_name_id: number; amount_or_weight: number }[] 
}) => api.put(`/templates/${id}`, data);
export const deleteTemplate = (id: number) => api.delete(`/templates/${id}`);
export const copyTemplate = (id: number, name: string) =>
  api.post(`/templates/${id}/copy`, { name });
export const getTemplateWithProducts = (id: number) =>
  api.get(`/templates/${id}/products`);

// Upload
export const uploadCheck = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getLiveFeed = (limit?: number) =>
  api.get('/feed', { params: { limit } });