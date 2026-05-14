import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import ProductList from '../views/ProductList.vue'
import OrderList from '../views/OrderList.vue'
import StressTest from '../views/StressTest.vue'

const routes = [
  { path: '/login', component: Login, meta: { noAuth: true } },
  { path: '/', component: ProductList },
  { path: '/orders', component: OrderList },
  { path: '/stress', component: StressTest }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.noAuth) {
    next()
  } else if (!token) {
    next('/login')
  } else {
    next()
  }
})

export default router
