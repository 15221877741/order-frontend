import axios from 'axios'

const api = axios.create({
  baseURL: '/api'
})

export const productApi = {
  list: () => api.get('/products'),
  get: (id) => api.get(`/products/${id}`)
}

export const orderApi = {
  create: (data) => api.post('/orders', data),
  get: (id) => api.get(`/orders/${id}`),
  getByUser: (userId) => api.get(`/orders/user/${userId}`)
}

export default api