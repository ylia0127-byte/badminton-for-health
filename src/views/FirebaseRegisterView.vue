<template>
  <!-- Centered card layout -->
  <div class="container min-vh-100 d-flex align-items-center justify-content-center py-5">
    <div class="col-12 col-md-8 col-lg-5">
      <div class="card shadow-lg border-0 rounded-4">
        <div class="card-body p-4 p-md-5">
          <h1 class="h3 text-center mb-1">Create an Account</h1>
          <p class="text-muted text-center mb-4">Join our community badminton programs</p>

          <!-- Keep exact behavior: call register() -->
          <form @submit.prevent="register" novalidate>
            <div class="mb-3">
              <label for="email" class="form-label">Email</label>
              <input
                id="email"
                type="email"
                class="form-control form-control-lg"
                placeholder="you@example.com"
                v-model="email"
                autocomplete="email"
              />
            </div>

            <div class="mb-2">
              <label for="password" class="form-label">Password</label>
              <input
                id="password"
                type="password"
                class="form-control form-control-lg"
                placeholder="••••••••"
                v-model="password"
                autocomplete="new-password"
              />
            </div>

            <button type="submit" class="btn btn-success btn-lg w-100 mt-3">Register</button>
          </form>
        </div>
      </div>

      <!-- Optional helper text -->
      <p class="text-center small text-muted mt-3 mb-0">
        By creating an account you agree to our community guidelines.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const router = useRouter()
const auth = getAuth()

const register = () => {
  createUserWithEmailAndPassword(auth, email.value, password.value)
    .then(() => {
      console.log('Firebase Register Successful!')
      router.push('/FireLogin') // 保持原有跳转路径
    })
    .catch((error) => {
      console.log(error.code)
    })
}
</script>

<style scoped>
/* Subtle visual polish only */
.card {
  backdrop-filter: blur(3px);
}
</style>
