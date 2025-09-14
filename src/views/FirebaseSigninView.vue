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
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '@/firebase/config'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const router = useRouter()

const signin = async () => {
  try {
    // 1) sign in
    const cred = await signInWithEmailAndPassword(auth, email.value, password.value)
    console.log('Firebase Login Successful!')

    // 2) Read roles from Firestore（users/{uid}.role）
    const snap = await getDoc(doc(db, 'users', cred.user.uid))
    const role = snap.exists() ? snap.data().role || 'user' : 'user'
    console.log('role =', role)

    // 3) Jump by role
    if (role === 'admin') {
      router.push('/admin') // Make sure there is/admin in your router
    } else {
      router.push('/') // Ordinary users return to the homepage or your dashboard
    }

    // Debugging: Current user
    console.log(auth.currentUser)
  } catch (error) {
    console.log(error.code)
  }
}
</script>

<style scoped>
/* Subtle polish without changing behavior */
.card {
  backdrop-filter: blur(3px);
}
</style>
