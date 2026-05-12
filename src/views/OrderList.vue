<template>
  <div class="order-list">
    <el-row :gutter="12" class="stats-row">
      <el-col :xs="12" :sm="12" :md="6" v-for="stat in statCards" :key="stat.label">
        <el-card shadow="never">
          <div class="stat-item">
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <el-tabs v-model="activeTab" class="order-tabs" @tab-change="handleTabChange">
            <el-tab-pane label="全部" name="" />
            <el-tab-pane label="待处理" name="0" />
            <el-tab-pane label="已完成" name="1" />
            <el-tab-pane label="已取消" name="2" />
          </el-tabs>
          <el-button :icon="Refresh" @click="loadOrders" :size="isMobile ? 'small' : 'default'">刷新</el-button>
        </div>
      </template>

      <div class="table-body">
        <div v-if="loading" class="table-state">
          <el-skeleton :rows="5" animated />
        </div>

        <div v-else-if="error" class="table-state">
          <el-result icon="error" title="加载失败" :sub-title="error">
            <template #extra>
              <el-button type="primary" @click="loadOrders">重新加载</el-button>
            </template>
          </el-result>
        </div>

        <template v-else-if="orders.length === 0">
          <div class="table-state">
            <el-empty description="暂无订单" />
          </div>
        </template>

        <template v-else>
          <div class="table-scroll">
            <el-table :data="orders" style="width: 100%" @selection-change="onSelectionChange" :size="isMobile ? 'small' : 'default'">
              <el-table-column type="selection" width="50" :selectable="(row) => row.status === 2" />
              <el-table-column label="订单号" min-width="80">
                <template #default="{ row }">
                  {{ isMobile ? row.orderNo.slice(0, 3) + '..' : row.orderNo }}
                </template>
              </el-table-column>
              <el-table-column label="商品名称" min-width="70" show-overflow-tooltip>
                <template #default="{ row }">
                  {{ row.productNames || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="数量" width="50">
                <template #default="{ row }">
                  {{ row.totalQuantity ?? '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="totalAmount" label="金额" width="70">
                <template #default="{ row }">
                  <span style="color: #f5222d; font-weight: bold">¥{{ row.totalAmount }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="60">
                <template #default="{ row }">
                  <el-tag :type="statusType(row.status)" size="small">
                    {{ statusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="下单时间" min-width="70">
                <template #default="{ row }">
                  {{ isMobile ? shortTime(row.createTime) : formatTime(row.createTime) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" min-width="100">
                <template #default="{ row }">
                  <div class="op-btns">
                    <el-button v-if="row.status === 0" type="success" size="small" @click="updateStatus(row.id, 1)">完成</el-button>
                    <el-button v-if="row.status === 0" type="warning" size="small" @click="updateStatus(row.id, 2)">取消</el-button>
                    <el-popconfirm v-if="row.status === 2" title="确定要删除该订单吗？" @confirm="deleteSingleOrder(row.id)">
                      <template #reference>
                        <el-button type="danger" size="small">删除</el-button>
                      </template>
                    </el-popconfirm>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="pagination-bar">
            <div v-if="selectedIds.length > 0">
              <el-popconfirm title="确定要批量删除选中的订单吗？" @confirm="batchDeleteOrders">
                <template #reference>
                  <el-button type="danger" size="small">
                    批量删除 ({{ selectedIds.length }})
                  </el-button>
                </template>
              </el-popconfirm>
            </div>
            <el-pagination
              v-if="total > 0"
              v-model:current-page="page"
              v-model:page-size="pageSize"
              :total="total"
              :page-sizes="[5, 10, 20, 50]"
              :layout="paginationLayout"
              size="small"
              @size-change="loadOrders"
              @current-change="loadOrders"
            />
          </div>
        </template>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { orderApi } from '@/api'
import { ElMessage } from 'element-plus'

const isMobile = ref(window.innerWidth < 768)
const handleResize = () => { isMobile.value = window.innerWidth < 768 }
onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))

const paginationLayout = computed(() => isMobile.value ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next, jumper')

const statCards = computed(() => [
  { label: '全部订单', value: stats.value.total, color: '#1890ff' },
  { label: '待处理', value: stats.value.pending, color: '#faad14' },
  { label: '已完成', value: stats.value.completed, color: '#52c41a' },
  { label: '已取消', value: stats.value.cancelled, color: '#f5222d' }
])

const orders = ref([])
const selectedIds = ref([])
const loading = ref(false)
const error = ref('')
const activeTab = ref('')
const page = ref(1)
const pageSize = ref(5)
const total = ref(0)
const stats = ref({ total: 0, pending: 0, completed: 0, cancelled: 0 })

const statusMap = { 0: '待处理', 1: '已完成', 2: '已取消' }
const statusText = (status) => statusMap[status] || '未知'
const statusType = (status) => {
  if (status === 0) return 'warning'
  if (status === 1) return 'success'
  if (status === 2) return 'danger'
  return 'info'
}

const formatTime = (time) => time ? new Date(time).toLocaleString() : '-'
const shortTime = (time) => time ? new Date(time).toLocaleString().slice(5, 16) : '-'

const handleTabChange = () => {
  page.value = 1
  loadOrders()
}

const onSelectionChange = (rows) => {
  selectedIds.value = rows.map(r => r.id)
}

const loadStats = async () => {
  try {
    const res = await orderApi.getMyOrderStats()
    if (res.data.code === 200 && res.data.data) {
      stats.value = res.data.data
    }
  } catch (e) {}
}

const loadOrders = async () => {
  const scrollEl = document.querySelector('.table-scroll')
  const savedScroll = scrollEl?.scrollTop || 0
  loading.value = true
  error.value = ''
  selectedIds.value = []
  try {
    const [ordersRes] = await Promise.all([
      orderApi.getMyOrders({
        page: page.value,
        size: pageSize.value,
        status: activeTab.value || undefined
      }),
      loadStats()
    ])
    if (ordersRes.data.code === 200 && ordersRes.data.data) {
      orders.value = ordersRes.data.data.list || []
      total.value = ordersRes.data.data.total || 0
    } else {
      throw new Error(ordersRes.data.message || '加载订单失败')
    }
  } catch (e) {
    error.value = e.response?.data?.message || e.message || '加载订单失败'
  } finally {
    loading.value = false
    nextTick(() => scrollEl?.scrollTo({ top: savedScroll }))
  }
}

const updateStatus = async (id, status) => {
  try {
    await orderApi.updateStatus(id, status)
    const order = orders.value.find(o => o.id === id)
    if (order) {
      const old = order.status
      if (old === 0 && status === 1) { stats.value.pending--; stats.value.completed++ }
      else if (old === 0 && status === 2) { stats.value.pending--; stats.value.cancelled++ }
      order.status = status
    }
    ElMessage.success('操作成功')
  } catch (e) {
    ElMessage.error(e.response?.data?.message || e.message || '操作失败')
  }
}

const deleteSingleOrder = async (id) => {
  try {
    await orderApi.deleteOrder(id)
    ElMessage.success('删除成功')
    loadOrders()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || e.message || '删除失败')
  }
}

const batchDeleteOrders = async () => {
  try {
    await orderApi.batchDelete(selectedIds.value)
    ElMessage.success('批量删除成功')
    loadOrders()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || e.message || '批量删除失败')
  }
}

onMounted(loadOrders)
</script>

<style scoped>
.order-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.stats-row {
  flex-shrink: 0;
  margin-bottom: 12px;
}
.stat-item {
  text-align: center;
  padding: 4px 0;
}
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}
.stat-value {
  font-size: 22px;
  font-weight: bold;
}
.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.table-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-top: 0;
}
.table-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.table-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}
.op-btns {
  display: flex;
  gap: 4px;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
}
.table-scroll {
  flex: 1;
  overflow: auto;
}
.pagination-bar {
  flex-shrink: 0;
  padding: 12px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
:deep(.el-checkbox__inner) {
  background-color: #fff;
  border-color: #409eff;
}
:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #409eff;
  border-color: #409eff;
}

@media (max-width: 767px) {
  .stat-value { font-size: 18px; }
  .stat-label { font-size: 12px; }
  .table-scroll :deep(.el-table .cell) { padding-left: 4px; padding-right: 4px; }
  .table-scroll :deep(.el-table th.el-table__cell) { padding: 4px 0; }
}
</style>
