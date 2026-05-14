<template>
  <router-view v-if="isLoginPage" />
  <el-container v-else style="height: 100vh; overflow: hidden">
    <el-aside :width="isMobile ? '0' : (asideCollapsed ? '64px' : '220px')" class="app-aside" :class="{ 'aside-collapsed': asideCollapsed }">
      <template v-if="!isMobile">
        <div class="app-logo" :class="{ 'logo-collapsed': asideCollapsed }">
          <el-icon :size="24"><Management /></el-icon>
          <span v-show="!asideCollapsed">急速订单系统</span>
        </div>
        <el-menu :router="true" :default-active="route.path" :collapse="asideCollapsed" background-color="#001529" text-color="#fff" active-text-color="#409eff" collapse-transition>
          <el-menu-item index="/">
            <el-icon><Goods /></el-icon>
            <span>商品列表</span>
          </el-menu-item>
          <el-menu-item index="/orders">
            <el-icon><List /></el-icon>
            <span>我的订单</span>
          </el-menu-item>
        </el-menu>
      </template>
    </el-aside>

    <el-drawer v-model="drawerVisible" direction="ltr" size="220px" :with-header="false" v-if="isMobile">
      <div class="app-logo">
        <el-icon :size="24"><Management /></el-icon>
        <span>急速订单系统</span>
      </div>
      <el-menu :router="true" :default-active="route.path" background-color="#001529" text-color="#fff" active-text-color="#409eff" @select="drawerVisible = false">
        <el-menu-item index="/">
          <el-icon><Goods /></el-icon>
          <span>商品列表</span>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><List /></el-icon>
          <span>我的订单</span>
        </el-menu-item>
      </el-menu>
    </el-drawer>

    <el-container>
      <el-header class="app-header">
        <div class="header-left">
          <el-button class="menu-btn" :icon="menuIcon" @click="toggleMenu" text />
          <el-breadcrumb separator="/" class="breadcrumb">
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
              <span class="user-name" v-show="!isMobile">{{ store.nickname || '用户' }}</span>
              <el-icon v-show="!isMobile"><ArrowDown /></el-icon>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Management, Goods, List, ArrowDown, SwitchButton, Fold, Expand } from '@element-plus/icons-vue'
import { useAuthStore } from '@/store'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const store = useAuthStore()

const isMobile = ref(window.innerWidth < 768)
const asideCollapsed = ref(false)
const drawerVisible = ref(false)

const menuIcon = computed(() => {
  if (isMobile.value) return Fold
  return asideCollapsed.value ? Expand : Fold
})

const isLoginPage = computed(() => route.path === '/login')

const toggleMenu = () => {
  if (isMobile.value) {
    drawerVisible.value = true
  } else {
    asideCollapsed.value = !asideCollapsed.value
  }
}

const handleResize = () => {
  isMobile.value = window.innerWidth < 768
  if (!isMobile.value) drawerVisible.value = false
}

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

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f0f2f5; }
</style>

<style scoped>
.app-aside {
  background: #001529;
  overflow: hidden;
  transition: width 0.25s ease;
  flex-shrink: 0;
}
.app-aside.aside-collapsed {
  width: 64px !important;
  min-width: 64px !important;
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
  white-space: nowrap;
  overflow: hidden;
}
.app-logo.logo-collapsed {
  gap: 0;
  justify-content: center;
}
.app-header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  z-index: 10;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.header-right { display: flex; align-items: center; }
.menu-btn { font-size: 20px; flex-shrink: 0; }
.breadcrumb { min-width: 0; }
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.user-name { font-size: 14px; color: #303133; }
.app-main {
  background: #f0f2f5;
  padding: 16px;
  height: calc(100vh - 60px);
  overflow-y: auto;
}

:deep(.el-drawer__body) {
  padding: 0;
  background: #001529;
}

@media (max-width: 767px) {
  .app-main { padding: 12px; }
  .breadcrumb { display: none; }
}
</style>
