import { createRouter, createWebHistory } from 'vue-router'
import ProductList from '../views/ProductList.vue'
import OrderList from '../views/OrderList.vue'

const routes = [
  { path: '/', component: ProductList },
  { path: '/orders', component: OrderList }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router