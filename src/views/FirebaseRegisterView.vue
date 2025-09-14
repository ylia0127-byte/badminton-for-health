<template>
  <!-- Centered card layout -->
  <div class="container min-vh-100 d-flex align-items-center justify-content-center py-5">
    <div class="col-12 col-md-8 col-lg-5">
      <div class="card shadow-lg border-0 rounded-4">
        <div class="card-body p-4 p-md-5">
          <h1 class="h3 text-center mb-1">Create an Account</h1>
          <p class="text-muted text-center mb-4">Join our community badminton programs</p>

          <!-- call register() -->
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
                required
              />
            </div>

            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <input
                id="password"
                type="password"
                class="form-control form-control-lg"
                placeholder="At least 6 characters"
                v-model="password"
                autocomplete="new-password"
                minlength="6"
                required
              />
            </div>

            <div class="mb-3">
              <label class="form-label">Role</label>
              <div class="d-flex gap-3">
                <label class="form-check">
                  <input type="radio" class="form-check-input" value="user" v-model="role" /> User
                </label>
                <label class="form-check">
                  <input type="radio" class="form-check-input" value="admin" v-model="role" /> Admin
                </label>
              </div>
            </div>

            <button type="submit" class="btn btn-success btn-lg w-100 mt-2">Register</button>
          </form>

          <div v-if="errorMsg" class="alert alert-warning mt-3 py-2">{{ errorMsg }}</div>
        </div>
      </div>

      <p class="text-center small text-muted mt-3 mb-0">
        By creating an account you agree to our community guidelines.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase/config'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const role = ref('user')
const errorMsg = ref('')

const router = useRouter()

const register = async () => {
  errorMsg.value = ''
  try {
    // 1) create account
    const cred = await createUserWithEmailAndPassword(auth, email.value, password.value)

    // 2) Write the character to Firestore
    await setDoc(
      doc(db, 'users', cred.user.uid),
      {
        email: email.value,
        role: role.value,
        createdAt: new Date().toISOString(),
      },
      { merge: true },
    )

    // 3) Jump to the login page
    router.push('/FireLogin')
  } catch (e) {
    const map = {
      'auth/invalid-email': 'Invalid email address.',
      'auth/email-already-in-use': 'Email already in use.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/operation-not-allowed': 'Email/password sign-in is not enabled.',
    }
    errorMsg.value = map[e.code] || e.code
    console.log(e.code)
  }
}
</script>

<style scoped>
.card {
  backdrop-filter: blur(3px);
}
</style>
