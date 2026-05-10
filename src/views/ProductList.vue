<template>
  <div class="product-list">
    <h2>商品列表</h2>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="product-grid">
      <div v-for="product in products" :key="product.id" class="product-card">
        <h3>{{ product.name }}</h3>
        <p class="price">¥{{ product.price }}</p>
        <p class="stock">库存: {{ product.stock }}</p>
        <div class="action">
          <input v-model="quantities[product.id]" type="number" min="1" value="1" />
          <button @click="buyProduct(product)" :disabled="product.stock === 0">购买</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { productApi, orderApi } from '@/api'
import { useOrderStore } from '@/store'

const store = useOrderStore()
const products = ref([])
const quantities = ref({})
const loading = ref(false)
const error = ref('')

const loadProducts = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await productApi.list()
    console.log('加载商品数据:', res.data)
    products.value = res.data
    products.value.forEach(p => { quantities.value[p.id] = 1 })
  } catch (e) {
    error.value = '加载商品失败: ' + e.message
  } finally {
    loading.value = false
  }
}

const buyProduct = async (product) => {
  const qty = quantities.value[product.id] || 1
  try {
    await orderApi.create({
      userId: store.userId,
      productIds: [product.id],
      quantities: [qty]
    })
    alert('下单成功!')
    loadProducts()
  } catch (e) {
    alert('下单失败: ' + e.message)
  }
}

onMounted(loadProducts)
</script>

<style scoped>
.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; margin-top: 20px; }
.product-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.product-card h3 { margin-bottom: 10px; }
.price { color: #f5222d; font-size: 20px; font-weight: bold; }
.stock { color: #888; margin: 10px 0; }
.action { display: flex; gap: 10px; }
.action input { width: 60px; padding: 4px; }
.action button { flex: 1; background: #1890ff; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer; }
.action button:disabled { background: #ccc; }
.loading, .error { text-align: center; padding: 40px; }
.error { color: #f5222d; }
</style>