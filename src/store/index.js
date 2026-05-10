import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useOrderStore = defineStore('order', () => {
  const userId = ref(1)
  const setUserId = (id) => { userId.value = id }

  return { userId, setUserId }
})