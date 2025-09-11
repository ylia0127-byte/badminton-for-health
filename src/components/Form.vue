<template>
  <div class="d-flex align-items-center justify-content-center vh-100">
    <div class="col-md-6 col-lg-4">
      <h2 class="text-center mb-4">User Login</h2>
      <form @submit.prevent="validateForm">
        <!-- Username -->
        <div class="mb-3">
          <label for="username" class="form-label">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            class="form-control"
            placeholder="Enter username"
            @blur="validateUsername"
          />
          <div v-if="errors.username" class="text-danger small mt-1">
            {{ errors.username }}
          </div>
        </div>

        <!-- Password -->
        <div class="mb-3">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-control"
            placeholder="Enter password"
            @blur="validatePassword(true)"
          />
          <div v-if="errors.password" class="text-danger small mt-1">
            {{ errors.password }}
          </div>
        </div>

        <!-- Login Button -->
        <button class="btn btn-primary w-100" type="submit">Log In</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const username = ref('')
const password = ref('')
const errors = ref({ username: null, password: null })

const validateUsername = () => {
  if (!username.value.trim()) {
    errors.value.username = 'Username cannot be empty.'
  } else {
    errors.value.username = null
  }
}

const validatePassword = (blur = false) => {
  const value = password.value
  const hasUppercase = /[A-Z]/.test(value)
  const hasLowercase = /[a-z]/.test(value)
  const hasNumber = /[0-9]/.test(value)

  if (!hasUppercase) {
    if (blur) errors.value.password = 'Password must contain at least one uppercase letter.'
  } else if (!hasLowercase) {
    if (blur) errors.value.password = 'Password must contain at least one lowercase letter.'
  } else if (!hasNumber) {
    if (blur) errors.value.password = 'Password must contain at least one number.'
  } else {
    errors.value.password = null
  }
}

const validateForm = () => {
  validateUsername()
  validatePassword(true)

  if (!errors.value.username && !errors.value.password) {
    console.log('Form is valid, ready for backend.')
  }
}
</script>

<style scoped>
.vh-100 {
  height: 100vh;
}
</style>
