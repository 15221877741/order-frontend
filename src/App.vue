<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-brand">订单系统</div>
      <div class="nav-links">
        <router-link to="/">商品列表</router-link>
        <router-link to="/orders">我的订单</router-link>
      </div>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
.navbar { background: #1890ff; color: white; padding: 0 20px; height: 50px; display: flex; align-items: center; justify-content: space-between; }
.nav-brand { font-size: 18px; font-weight: bold; }
.nav-links a { color: white; text-decoration: none; margin-left: 20px; }
.nav-links a.router-link-active { font-weight: bold; }
.main-content { padding: 20px; max-width: 1200px; margin: 0 auto; }
</style>