<template>
  <div class="login-wrapper">
    <el-card class="login-card" shadow="always">
      <h2 class="login-title">急速订单系统</h2>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" size="large" @keyup.enter="handleLogin">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width: 100%" :loading="loading" @click="handleLogin">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-footer">
        <span>还没有账号？</span>
        <el-button link type="primary" @click="handleRegister">立即注册</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { authApi } from '@/api'
import { useAuthStore } from '@/store'
import { ElMessage } from 'element-plus'

const router = useRouter()
const store = useAuthStore()
const formRef = ref(null)
const loading = ref(false)
const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const res = await authApi.login(form)
    if (res.data.code === 200) {
      const { token, userId, username, nickname } = res.data.data
      store.setAuth(token, { userId, username, nickname })
      ElMessage.success('登录成功')
      router.push('/')
    } else {
      ElMessage.error(res.data.message || '登录失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || e.message || '登录失败')
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  if (!form.username || !form.password) {
    ElMessage.warning('请先输入用户名和密码')
    return
  }
  loading.value = true
  try {
    const res = await authApi.register(form)
    if (res.data.code === 200) {
      const { token, userId, username, nickname } = res.data.data
      store.setAuth(token, { userId, username, nickname })
      ElMessage.success('注册成功')
      router.push('/')
    } else {
      ElMessage.error(res.data.message || '注册失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || e.message || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  width: 400px;
  padding: 20px;
}
.login-title {
  text-align: center;
  margin-bottom: 24px;
  color: #303133;
}
.login-footer {
  text-align: center;
  color: #909399;
  font-size: 14px;
}
</style>
