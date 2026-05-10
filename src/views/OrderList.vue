<template>
  <div class="order-list">
    <h2>我的订单</h2>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="orders.length === 0" class="empty">暂无订单</div>
    <div v-else>
      <div class="order-table">
        <table>
          <thead>
            <tr>
              <th><input type="checkbox" @change="toggleSelectAll" :checked="isAllSelected" /></th>
              <th>订单号</th>
              <th>金额</th>
              <th>状态</th>
              <th>时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td><input type="checkbox" :value="order.id" v-model="selectedIds" /></td>
              <td>{{ order.orderNo }}</td>
              <td>¥{{ order.totalAmount }}</td>
              <td><span :class="'status-' + order.status">{{ statusText(order.status) }}</span></td>
              <td>{{ formatTime(order.createTime) }}</td>
              <td>
                <button v-if="order.status === 0" @click="updateStatus(order.id, 1)" class="btn-complete">完成</button>
                <button v-if="order.status === 0" @click="updateStatus(order.id, 2)" class="btn-cancel">取消</button>
                <button v-if="order.status === 2" @click="deleteSingleOrder(order.id)" class="btn-delete">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="batch-actions">
        <button v-if="selectedIds.length > 0" @click="batchDeleteOrders" class="btn-batch-delete">批量删除 ({{ selectedIds.length }})</button>
        <button @click="loadOrders" class="refresh-btn">刷新</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { orderApi } from '@/api'
import { useOrderStore } from '@/store'

const store = useOrderStore()
const orders = ref([])
const selectedIds = ref([])
const loading = ref(false)
const error = ref('')

const statusText = (status) => ['待处理', '已完成', '已取消'][status] || '未知'

const formatTime = (time) => time ? new Date(time).toLocaleString() : '-'

const isAllSelected = computed(() => {
  return orders.value.length > 0 && selectedIds.value.length === orders.value.length
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = orders.value.map(o => o.id)
  }
}

const loadOrders = async () => {
  loading.value = true
  error.value = ''
  selectedIds.value = []
  try {
    const res = await orderApi.getByUser(store.userId)
    orders.value = res.data
  } catch (e) {
    error.value = '加载订单失败: ' + e.message
  } finally {
    loading.value = false
  }
}

const updateStatus = async (id, status) => {
  try {
    await orderApi.updateStatus(id, status)
    loadOrders()
  } catch (e) {
    alert('操作失败: ' + e.message)
  }
}

const deleteSingleOrder = async (id) => {
  if (confirm('确定要删除该订单吗？')) {
    try {
      await orderApi.deleteOrder(id, store.userId)
      loadOrders()
    } catch (e) {
      alert('删除失败: ' + e.message)
    }
  }
}

const batchDeleteOrders = async () => {
  if (confirm(`确定要删除选中的 ${selectedIds.value.length} 个订单吗？`)) {
    try {
      await orderApi.batchDelete(selectedIds.value, store.userId)
      loadOrders()
    } catch (e) {
      alert('批量删除失败: ' + e.message)
    }
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
.btn-complete, .btn-cancel, .btn-delete { padding: 4px 8px; border: none; border-radius: 4px; cursor: pointer; margin-right: 8px; font-size: 12px; }
.btn-complete { background: #52c41a; color: white; }
.btn-cancel { background: #ff4d4f; color: white; }
.btn-delete { background: #888; color: white; }
.batch-actions { margin-top: 16px; display: flex; gap: 12px; align-items: center; }
.btn-batch-delete { padding: 8px 16px; background: #ff4d4f; color: white; border: none; border-radius: 4px; cursor: pointer; }
.refresh-btn { padding: 8px 16px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer; }
.loading, .error, .empty { text-align: center; padding: 40px; }
.error { color: #f5222d; }
</style>