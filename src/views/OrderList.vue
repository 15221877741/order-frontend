<template>
  <div class="order-list">
    <h2>我的订单</h2>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="orders.length === 0" class="empty">暂无订单</div>
    <div v-else class="order-table">
      <table>
        <thead>
          <tr>
            <th>订单号</th>
            <th>金额</th>
            <th>状态</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td>{{ order.orderNo }}</td>
            <td>¥{{ order.totalAmount }}</td>
            <td><span :class="'status-' + order.status">{{ statusText(order.status) }}</span></td>
            <td>{{ formatTime(order.createTime) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <button @click="loadOrders" class="refresh-btn">刷新</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { orderApi } from '@/api'
import { useOrderStore } from '@/store'

const store = useOrderStore()
const orders = ref([])
const loading = ref(false)
const error = ref('')

const statusText = (status) => ['待处理', '已完成', '已取消'][status] || '未知'

const formatTime = (time) => time ? new Date(time).toLocaleString() : '-'

const loadOrders = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await orderApi.getByUser(store.userId)
    orders.value = res.data
  } catch (e) {
    error.value = '加载订单失败: ' + e.message
  } finally {
    loading.value = false
  }
}

onMounted(loadOrders)
</script>

<style scoped>
.order-table { background: white; border-radius: 8px; overflow: hidden; margin-top: 20px; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px; text-align: left; border-bottom: 1px solid #f0f0f0; }
th { background: #fafafa; font-weight: 500; }
.status-0 { color: #faad14; }
.status-1 { color: #52c41a; }
.status-2 { color: #ff4d4f; }
.refresh-btn { margin-top: 20px; padding: 10px 20px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer; }
.loading, .error, .empty { text-align: center; padding: 40px; }
.error { color: #f5222d; }
</style>