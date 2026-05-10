<template>
  <div class="order-list">
    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat-item">
            <div class="stat-label">全部订单</div>
            <div class="stat-value" style="color: #1890ff">{{ total }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <el-tabs v-model="activeTab" class="order-tabs" @tab-change="handleTabChange">
            <el-tab-pane label="全部" name="" />
            <el-tab-pane label="待处理" name="0" />
            <el-tab-pane label="已完成" name="1" />
            <el-tab-pane label="已取消" name="2" />
          </el-tabs>
          <el-button :icon="Refresh" @click="loadOrders">刷新</el-button>
        </div>
      </template>

      <div v-if="loading" style="padding: 40px; text-align: center">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="error" style="padding: 40px; text-align: center">
        <el-result icon="error" title="加载失败" :sub-title="error">
          <template #extra>
            <el-button type="primary" @click="loadOrders">重新加载</el-button>
          </template>
        </el-result>
      </div>

      <template v-else-if="orders.length === 0">
        <el-empty description="暂无订单" />
      </template>

      <template v-else>
        <div style="overflow-x: auto">
        <el-table :data="orders" style="width: 100%" @selection-change="onSelectionChange">
          <el-table-column type="selection" width="50" :selectable="(row) => row.status === 2" />
          <el-table-column prop="orderNo" label="订单号" width="160" show-overflow-tooltip />
          <el-table-column label="商品名称" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.productNames || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="商品数量" width="80">
            <template #default="{ row }">
              {{ row.totalQuantity ?? '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="totalAmount" label="金额" width="120">
            <template #default="{ row }">
              <span style="color: #f5222d; font-weight: bold">¥{{ row.totalAmount }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" size="small">
                {{ statusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="下单时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="200">
            <template #default="{ row }">
              <el-button v-if="row.status === 0" type="success" size="small" @click="updateStatus(row.id, 1)">完成</el-button>
              <el-button v-if="row.status === 0" type="warning" size="small" @click="updateStatus(row.id, 2)">取消</el-button>
              <el-popconfirm v-if="row.status === 2" title="确定要删除该订单吗？" @confirm="deleteSingleOrder(row.id)">
                <template #reference>
                  <el-button type="danger" size="small">删除</el-button>
                </template>
              </el-popconfirm>
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
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadOrders"
            @current-change="loadOrders"
          />
        </div>
      </template>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { orderApi } from '@/api'
import { ElMessage } from 'element-plus'

const orders = ref([])
const selectedIds = ref([])
const loading = ref(false)
const error = ref('')
const activeTab = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const statusMap = { 0: '待处理', 1: '已完成', 2: '已取消' }
const statusText = (status) => statusMap[status] || '未知'
const statusType = (status) => {
  if (status === 0) return 'warning'
  if (status === 1) return 'success'
  if (status === 2) return 'danger'
  return 'info'
}

const formatTime = (time) => time ? new Date(time).toLocaleString() : '-'

const handleTabChange = () => {
  page.value = 1
  loadOrders()
}

const onSelectionChange = (rows) => {
  selectedIds.value = rows.map(r => r.id)
}

const loadOrders = async () => {
  loading.value = true
  error.value = ''
  selectedIds.value = []
  try {
    const res = await orderApi.getMyOrders({
      page: page.value,
      size: pageSize.value,
      status: activeTab.value || undefined
    })
    if (res.data.code === 200 && res.data.data) {
      orders.value = res.data.data.list || []
      total.value = res.data.data.total || 0
    } else {
      throw new Error(res.data.message || '加载订单失败')
    }
  } catch (e) {
    error.value = e.response?.data?.message || e.message || '加载订单失败'
  } finally {
    loading.value = false
  }
}

const updateStatus = async (id, status) => {
  try {
    await orderApi.updateStatus(id, status)
    ElMessage.success('操作成功')
    loadOrders()
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
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.order-tabs {
  flex: 1;
}
.stat-item {
  text-align: center;
  padding: 8px 0;
}
.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
}
.pagination-bar {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
:deep(.el-checkbox__inner) {
  background-color: #fff;
  border-color: #409eff;
}
:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #409eff;
  border-color: #409eff;
}
</style>
