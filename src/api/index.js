import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

const api = axios.create({
  baseURL: '/api'
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => {
    if (res.data?.code !== 200) {
      const error = new Error(res.data?.message || '请求失败')
      error.response = res
      return Promise.reject(error)
    }
    return res
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
      ElMessage.error('登录已过期，请重新登录')
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data)
}

export const productApi = {
  list: () => api.get('/products'),
  get: (id) => api.get(`/products/${id}`)
}

export const orderApi = {
  create: (data) => api.post('/orders', data),
  get: (id) => api.get(`/orders/${id}`),
  getMyOrders: (params) => api.get('/orders/user/me', { params }),
  getMyOrderStats: () => api.get('/orders/user/me/stats'),
  updateStatus: (id, status) => api.put(`/orders/${id}/status?status=${status}`),
  deleteOrder: (id) => api.delete(`/orders/${id}`),
  batchDelete: (ids) => api.post('/orders/batch-delete', { ids })
}

export const stressApi = {
  run: (data) => api.post('/stress/run', data),
  getTask: (taskId) => api.get(`/stress/tasks/${taskId}`),
  resetStock: () => api.post('/stress/reset')
}

export default api
