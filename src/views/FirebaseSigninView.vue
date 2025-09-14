<template>
  <!-- Full-height center layout -->
  <div class="container min-vh-100 d-flex align-items-center justify-content-center py-5">
    <div class="col-12 col-md-8 col-lg-5">
      <div class="card shadow-lg border-0 rounded-4">
        <div class="card-body p-4 p-md-5">
          <h1 class="h3 text-center mb-1">Sign in</h1>
          <p class="text-muted text-center mb-4">Welcome back — sign in to continue</p>

          <!-- Keep exact behavior: call signin()  -->
          <form @submit.prevent="signin" novalidate>
            <div class="mb-3">
              <label for="email" class="form-label">Email</label>
              <input
                id="email"
                type="email"
                class="form-control form-control-lg"
                placeholder="you@example.com"
                v-model="email"
                autocomplete="email"
                required
              />
            </div>

            <div class="mb-2">
              <label for="password" class="form-label d-flex justify-content-between">
                <span>Password</span>
                <router-link to="/register" class="small">Create account</router-link>
              </label>
              <input
                id="password"
                type="password"
                class="form-control form-control-lg"
                placeholder="••••••••"
                v-model="password"
                autocomplete="current-password"
                required
              />
            </div>

            <button type="submit" class="btn btn-primary btn-lg w-100 mt-3">
              Sign in via Firebase
            </button>
          </form>
        </div>
      </div>

      <!-- Optional footer text -->
      <p class="text-center small text-muted mt-3 mb-0">
        By continuing you agree to our community guidelines.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const router = useRouter()
const auth = getAuth()

const signin = () => {
  signInWithEmailAndPassword(getAuth(), email.value, password.value)
    .then((data) => {
      console.log('Firebase Register Successful!')
      router.push('/')
      console.log(auth.currentUser) // To check the current User signed in
    })
    .catch((error) => {
      console.log(error.code)
    })
}
</script>

<style scoped>
/* Subtle polish without changing behavior */
.card {
  backdrop-filter: blur(3px);
}
</style>
