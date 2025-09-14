<!-- src/views/ProfileView.vue -->
<template>
  <div class="container py-4">
    <div class="col-12 col-md-8 col-lg-6 mx-auto">
      <div class="card shadow-sm border-0 rounded-4">
        <div class="card-body p-4">
          <h1 class="h4 mb-3">Your Profile</h1>

          <!-- 加载状态 -->
          <div v-if="loading" class="alert alert-info py-2">Loading…</div>

          <!-- 已登录信息 -->
          <div v-else>
            <p class="mb-1">
              <span class="text-muted">Email:</span>
              <strong>{{ email || '—' }}</strong>
            </p>
            <p class="mb-3">
              <span class="text-muted">UID:</span>
              <code class="small">{{ uid }}</code>
            </p>

            <div class="d-flex gap-2">
              <button class="btn btn-danger" @click="logout" :disabled="signingOut">
                <span v-if="!signingOut">Logout</span>
                <span v-else class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                <span v-if="signingOut" class="ms-2">Signing out…</span>
              </button>
              <router-link to="/" class="btn btn-outline-secondary">Back home</router-link>
            </div>

            <div v-if="errorMsg" class="alert alert-warning mt-3 py-2">
              {{ errorMsg }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'

const router = useRouter()
const auth = getAuth()

const loading = ref(true)
const signingOut = ref(false)
const email = ref('')
const uid = ref('')
const errorMsg = ref('')

let unsub = null

onMounted(() => {
  // 监听登录状态；未登录则回登录页
  unsub = onAuthStateChanged(auth, (u) => {
    loading.value = false
    if (!u) {
      router.replace('/Firelogin') // 注意与路由大小写一致
      return
    }
    email.value = u.email || ''
    uid.value = u.uid || ''
  })
})

onUnmounted(() => {
  unsub && unsub()
})

async function logout() {
  errorMsg.value = ''
  signingOut.value = true
  try {
    await signOut(auth)
    router.replace('/Firelogin') // 或改成你的登录路径
  } catch (e) {
    errorMsg.value = e.code || e.message
  } finally {
    signingOut.value = false
  }
}
</script>

<style scoped>
/* minimal polish */
</style>
