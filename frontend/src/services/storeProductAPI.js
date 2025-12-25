import api from './api';

const storeProductAPI = {
    getAll: () => api.get('/store-products'),
    create: (productData) => api.post('/store-products', productData),
    update: (id, productData) => api.put(`/store-products/${id}`, productData),
    delete: (id) => api.delete(`/store-products/${id}`),
    search: (query) => api.get('/store-products/search', { params: { query } }),
    adjustStock: (id, adjustmentData) => api.post(`/store-products/${id}/adjust`, adjustmentData),
    getHistory: () => api.get('/store-history'),
    getProductHistory: (id) => api.get(`/store-history/product/${id}`)
};

export default storeProductAPI;
