<template>
  <router-view v-if="isLoginPage" />
  <el-container v-else style="min-height: 100vh">
    <el-aside width="220px" class="app-aside">
      <div class="app-logo">
        <el-icon :size="24"><Management /></el-icon>
        <span>订单管理系统</span>
      </div>
      <el-menu :router="true" :default-active="route.path" background-color="#001529" text-color="#fff" active-text-color="#409eff">
        <el-menu-item index="/">
          <el-icon><Goods /></el-icon>
          <span>商品列表</span>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><List /></el-icon>
          <span>我的订单</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="app-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="route.path === '/' ? '/' : '/'">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.path === '/orders'">我的订单</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" style="background-color: #409eff">
                {{ store.nickname?.[0] || 'U' }}
              </el-avatar>
              <span class="user-name">{{ store.nickname || '用户' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-item command="logout">
                <el-icon><SwitchButton /></el-icon>退出登录
              </el-dropdown-item>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Management, Goods, List, ArrowDown, SwitchButton } from '@element-plus/icons-vue'
import { useAuthStore } from '@/store'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const store = useAuthStore()

const isLoginPage = computed(() => route.path === '/login')

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
      .then(() => {
        store.logout()
        router.push('/login')
      })
      .catch(() => {})
  }
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f0f2f5; }
</style>

<style scoped>
.app-aside {
  background: #001529;
  overflow: hidden;
}
.app-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.app-header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  z-index: 10;
}
.header-left { display: flex; align-items: center; }
.header-right { display: flex; align-items: center; }
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.user-name { font-size: 14px; color: #303133; }
.app-main {
  background: #f0f2f5;
  padding: 20px;
}
</style>
