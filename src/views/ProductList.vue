<template>
  <div class="product-list">
    <el-card shadow="never" class="search-bar">
      <el-row :gutter="12" align="middle">
        <el-col :xs="24" :sm="24" :md="8">
          <el-input v-model="searchQuery" placeholder="搜索商品名称" clearable :prefix-icon="Search" @input="handleSearch" />
        </el-col>
        <el-col :xs="24" :sm="24" :md="4">
          <el-button type="primary" :icon="Search" @click="loadProducts" style="width: 100%">搜索</el-button>
        </el-col>
      </el-row>
    </el-card>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>

    <div v-else-if="error" class="error-container">
      <el-result icon="error" title="加载失败" :sub-title="error">
        <template #extra>
          <el-button type="primary" @click="loadProducts">重新加载</el-button>
        </template>
      </el-result>
    </div>

    <div v-else-if="filteredProducts.length === 0" class="error-container">
      <el-empty description="暂无商品" />
    </div>

    <el-row v-else :gutter="16">
      <el-col v-for="product in filteredProducts" :key="product.id" :xs="24" :sm="12" :md="8" :lg="6" style="margin-bottom: 16px">
        <el-card shadow="hover" class="product-card">
          <div class="product-img">
            <el-icon :size="48"><Goods /></el-icon>
          </div>
          <h3 class="product-name">{{ product.name }}</h3>
          <div class="product-meta">
            <span class="product-price">¥{{ product.price }}</span>
            <span class="product-stock">库存: {{ product.stock }}</span>
          </div>
          <div class="product-action">
            <el-input-number v-model="quantities[product.id]" :min="1" :max="Math.max(product.stock, 1)" size="small" />
            <el-button type="danger" size="small" :disabled="product.stock === 0" :icon="ShoppingCart" @click="buyProduct(product)">
              购买
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Goods, ShoppingCart } from '@element-plus/icons-vue'
import { productApi, orderApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const products = ref([])
const quantities = ref({})
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')

const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value
  const q = searchQuery.value.toLowerCase()
  return products.value.filter(p => p.name.toLowerCase().includes(q))
})

const loadProducts = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await productApi.list()
    products.value = res.data.data
    products.value.forEach(p => { quantities.value[p.id] = 1 })
  } catch (e) {
    error.value = e.response?.data?.message || e.message || '加载商品失败'
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {}

const buyProduct = async (product) => {
  const qty = quantities.value[product.id] || 1
  try {
    await ElMessageBox.confirm(
      `确定购买「${product.name}」x ${qty}，合计 ¥${(product.price * qty).toFixed(2)}？`,
      '确认下单',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' }
    )
    await orderApi.create({
      productIds: [product.id],
      quantities: [qty]
    })
    ElMessage.success('下单成功!')
    loadProducts()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.response?.data?.message || e.message || '下单失败')
      loadProducts()
    }
  }
}

onMounted(loadProducts)
</script>

<style scoped>
.search-bar {
  margin-bottom: 16px;
}
.loading-container, .error-container {
  margin-top: 40px;
}
.product-card {
  text-align: center;
  transition: transform 0.2s;
}
.product-card:hover {
  transform: translateY(-4px);
}
.product-img {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
  margin-bottom: 12px;
}
.product-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}
.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.product-price {
  color: #f5222d;
  font-size: 20px;
  font-weight: bold;
}
.product-stock {
  color: #909399;
  font-size: 13px;
}
.product-action {
  display: flex;
  gap: 8px;
  justify-content: center;
}

@media (max-width: 767px) {
  .search-bar { margin-bottom: 12px; }
  .product-img { height: 60px; margin-bottom: 8px; }
  .product-name { font-size: 14px; }
  .product-price { font-size: 18px; }
  .product-meta { margin-bottom: 8px; }
}
</style>
