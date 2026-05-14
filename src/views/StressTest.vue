<template>
  <div class="stress-test">
    <el-card shadow="never" class="config-card">
      <template #header>
        <span style="font-weight: 600; font-size: 16px;">
          <el-icon style="vertical-align: middle; margin-right: 6px;"><Lightning /></el-icon>
          压力测试配置
        </span>
      </template>
      <el-form :model="form" label-width="100px" :disabled="running">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="并发线程数">
              <el-input-number v-model="form.concurrency" :min="1" :max="200" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="测试商品">
              <el-select v-model="form.productId" placeholder="请选择商品" style="width: 100%">
                <el-option v-for="p in products" :key="p.id" :label="p.name + ' (库存: ' + p.stock + ')'" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="购买数量">
              <el-input-number v-model="form.quantity" :min="1" :max="999" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="总请求数">
              <el-input-number v-model="form.totalRequests" :min="1" :max="100000" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="24" style="margin-top: 8px;">
            <el-button type="primary" :icon="VideoPlay" :loading="running" @click="startTest" :disabled="!form.productId">
              {{ running ? '测试中...' : '开始测试' }}
            </el-button>
            <el-button :icon="Refresh" @click="resetStock" :disabled="running">重置库存</el-button>
            <el-button :icon="RefreshRight" @click="loadProducts" :disabled="running">刷新商品</el-button>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card v-if="running" shadow="never" class="progress-card">
      <template #header>
        <span style="font-weight: 600;">
          <el-icon style="vertical-align: middle; margin-right: 6px;"><Loading /></el-icon>
          测试进度
        </span>
      </template>
      <el-progress :percentage="progress" :status="progress === 100 ? 'success' : undefined" :stroke-width="20" :text-inside="true" />
      <div class="progress-info">
        <span>已完成: {{ completedRequests }} / {{ form.totalRequests }}</span>
        <span>成功: {{ successCount }}</span>
        <span>失败: {{ failCount }}</span>
      </div>
    </el-card>

    <el-card v-if="result" shadow="never" class="result-card">
      <template #header>
        <span style="font-weight: 600; color: #67c23a;">
          <el-icon style="vertical-align: middle; margin-right: 6px;"><CircleCheck /></el-icon>
          测试结果
        </span>
        <el-button type="danger" :icon="Delete" size="small" text @click="clearResult">清除历史</el-button>
      </template>
      <el-row :gutter="16">
        <el-col :xs="12" :sm="6" v-for="stat in stats" :key="stat.label">
          <div class="stat-item">
            <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </el-col>
      </el-row>
      <el-divider />
      <div v-if="result.errors && result.errors.length > 0">
        <div style="font-weight: 600; margin-bottom: 8px; color: #f56c6c;">
          <el-icon style="vertical-align: middle; margin-right: 4px;"><WarningFilled /></el-icon>
          错误详情（前 {{ result.errors.length }} 条）
        </div>
        <el-table :data="errorList" size="small" stripe>
          <el-table-column type="index" label="#" width="50" />
          <el-table-column prop="message" label="错误信息" show-overflow-tooltip />
        </el-table>
      </div>
      <div v-else style="color: #67c23a;">
        <el-icon style="vertical-align: middle; margin-right: 4px;"><CircleCheck /></el-icon>
        无错误，全部成功！
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { Lightning, VideoPlay, Refresh, RefreshRight, Loading, CircleCheck, WarningFilled, Delete } from '@element-plus/icons-vue'
import { productApi, stressApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const products = ref([])
const running = ref(false)
const progress = ref(0)
const successCount = ref(0)
const failCount = ref(0)
const completedRequests = ref(0)
const result = ref(null)
let pollTimer = null

const form = reactive({
  concurrency: 10,
  productId: null,
  quantity: 1,
  totalRequests: 100
})

const errorList = computed(() => {
  if (!result.value?.errors) return []
  return result.value.errors.map(msg => ({ message: msg }))
})

const stats = computed(() => {
  if (!result.value) return []
  return [
    { label: '总请求数', value: result.value.totalRequests, color: '#303133' },
    { label: '成功', value: result.value.successCount, color: '#67c23a' },
    { label: '失败', value: result.value.failCount, color: result.value.failCount > 0 ? '#f56c6c' : '#67c23a' },
    { label: '总耗时 (s)', value: (result.value.totalTimeMs / 1000).toFixed(2), color: '#409eff' },
    { label: '平均响应 (ms)', value: result.value.avgResponseTimeMs, color: '#909399' },
    { label: 'TPS', value: result.value.tps, color: '#e6a23c' }
  ]
})

const loadProducts = async () => {
  try {
    const res = await productApi.list()
    products.value = res.data.data
    if (products.value.length > 0 && !form.productId) {
      form.productId = products.value[0].id
    }
  } catch (e) {
    ElMessage.error('加载商品列表失败')
  }
}

const startTest = async () => {
  if (!form.productId) {
    ElMessage.warning('请选择测试商品')
    return
  }
  try {
    await ElMessageBox.confirm(
      `即将发起压测：${form.concurrency} 并发，${form.totalRequests} 次请求。确定开始？`,
      '确认启动',
      { confirmButtonText: '开始', cancelButtonText: '取消', type: 'info' }
    )
  } catch {
    return
  }

  running.value = true
  result.value = null
  progress.value = 0
  successCount.value = 0
  failCount.value = 0
  completedRequests.value = 0

  try {
    const res = await stressApi.run({
      concurrency: form.concurrency,
      productId: form.productId,
      quantity: form.quantity,
      totalRequests: form.totalRequests
    })
    const taskId = res.data.data.taskId
    pollTimer = setInterval(() => pollTask(taskId), 1000)
  } catch (e) {
    ElMessage.error(e.response?.data?.message || e.message || '启动压测失败')
    running.value = false
  }
}

const pollTask = async (taskId) => {
  try {
    const res = await stressApi.getTask(taskId)
    const data = res.data.data
    progress.value = data.progress || 0
    successCount.value = data.successCount || 0
    failCount.value = data.failCount || 0
    completedRequests.value = data.completedRequests || 0

    if (data.status === 2 || data.status === 3) {
      clearInterval(pollTimer)
      pollTimer = null
      running.value = false
      result.value = data
      saveResult(data)
      if (data.status === 3) {
        ElMessage.error('压测任务执行异常')
      } else if (data.failCount > 0) {
        ElMessage.warning(`压测完成，${data.failCount} 次请求失败`)
      } else {
        ElMessage.success('压测完成，全部成功！')
      }
    }
  } catch (e) {
    clearInterval(pollTimer)
    pollTimer = null
    running.value = false
    ElMessage.error('查询任务状态失败')
  }
}

const loadHistoryResult = () => {
  const saved = localStorage.getItem('pressure_test_result')
  if (saved) {
    try {
      result.value = JSON.parse(saved)
    } catch { /* ignore */ }
  }
}

const saveResult = (data) => {
  localStorage.setItem('pressure_test_result', JSON.stringify(data))
}

const clearResult = () => {
  localStorage.removeItem('pressure_test_result')
  result.value = null
}

const resetStock = async () => {
  try {
    await ElMessageBox.confirm('确定要重置所有商品库存为初始值？', '确认重置', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    })
    await stressApi.resetStock()
    ElMessage.success('库存已重置')
    loadProducts()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.response?.data?.message || e.message || '重置失败')
    }
  }
}

onMounted(() => {
  loadProducts()
  loadHistoryResult()
})

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})
</script>

<style scoped>
.stress-test {
  max-width: 1000px;
  margin: 0 auto;
}
.config-card,
.progress-card,
.result-card {
  margin-bottom: 16px;
}
.progress-info {
  display: flex;
  gap: 24px;
  margin-top: 12px;
  font-size: 14px;
  color: #606266;
}
.stat-item {
  text-align: center;
  padding: 12px 0;
  background: #fafafa;
  border-radius: 8px;
}
.stat-value {
  font-size: 24px;
  font-weight: bold;
}
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}
</style>
