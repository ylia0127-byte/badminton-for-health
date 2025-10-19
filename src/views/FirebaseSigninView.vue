<template>
  <!-- Full-height center layout -->
  <div class="container min-vh-100 d-flex align-items-center justify-content-center py-5">
    <div class="col-12 col-md-8 col-lg-5">
      <div class="card shadow-lg border-0 rounded-4">
        <div class="card-body p-4 p-md-5">
          <h1 class="h3 text-center mb-1">Sign in</h1>
          <p class="text-muted text-center mb-4">
            Welcome back — sign in to continue<br />
            <span class="small">Welcome back</span>
          </p>

          <!-- OAuth: Google -->
          <button
            type="button"
            class="btn btn-outline-dark btn-lg w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
            @click="signinWithGoogle"
            :disabled="loading"
            aria-label="Continue with Google"
          >
            <!-- Google G Icon (SVG) -->
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
              <path
                d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 3l6-6C34.1 5 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.2-2.7-.5-4z"
              />
              <path
                d="M6.3 14.7l7 5.1C15.2 16.2 19.2 13 24 13c3.1 0 5.9 1.1 8.1 3l6-6C34.1 5 29.3 3 24 3 16 3 9 7.6 6.3 14.7z"
                fill="#FFC107"
              />
              <path
                d="M24 45c5.9 0 10.9-1.9 14.5-5.2l-6.7-5.5C29.7 36.2 27.1 37 24 37c-6.1 0-10.7-3.9-12.5-9.3l-7 5.4C7.1 40.4 14.7 45 24 45z"
                fill="#4CAF50"
              />
              <path
                d="M44.5 20H24v8.5h11.8c-1 3-3.2 5.5-6 7.2l6.7 5.5C39.6 43 45 38 45 24c0-1.3-.2-2.7-.5-4z"
                fill="#1976D2"
              />
              <path
                d="M11.5 27.7c-.4-1.2-.5-2.5-.5-3.7s.2-2.5.5-3.7l-7-5.4C3.5 17 3 20.4 3 24s.5 7 1.5 9.8l7-6.1z"
                fill="#FF3D00"
              />
            </svg>
            <span>{{ loading ? 'Connecting…' : 'Continue with Google' }}</span>
          </button>

          <!-- Divider -->
          <div class="text-center text-muted small mb-3">or</div>

          <!-- Email/Password form -->
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
                :disabled="loading"
                required
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
                autocomplete="current-password"
                :disabled="loading"
                required
              />
            </div>

            <button type="submit" class="btn btn-primary btn-lg w-100 mt-3" :disabled="loading">
              {{ loading ? 'Signing in…' : 'Sign in via Firebase' }}
            </button>
          </form>

          <!-- Error message -->
          <p v-if="errMsg" class="text-danger small mt-3 mb-0" role="alert">
            {{ errMsg }}
          </p>
        </div>
      </div>

      <!-- Optional footer text -->
      <p class="text-center small text-muted mt-3 mb-0">
        By continuing you agree to our community guidelines.<br />
        <span class="small">By continuing you agree to our community guidelines</span>
      </p>
    </div>
  </div>
</template>

<script setup>
// Email/Password + Google 登录；首次登录建档到 /users/{uid}
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth, db } from '@/firebase/config'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

const email = ref('')
const password = ref('')
const loading = ref(false)
const errMsg = ref('')
const router = useRouter()

/**
 * After login, ensure /users/{uid} exists with { role:'user', email, createdAt }.
 * 登录后确保 /users/{uid} 存在（若不存在则创建默认文档）。
 */
const finishLoginAndRoute = async (uid, emailAddr = null) => {
  const userRef = doc(db, 'users', uid)
  const snap = await getDoc(userRef)

  if (!snap.exists()) {
    await setDoc(
      userRef,
      {
        role: 'user',
        email: emailAddr,
        createdAt: serverTimestamp(),
      },
      { merge: true },
    )
  }

  const data = (await getDoc(userRef)).data() || {}
  const role = data.role || 'user'
  role === 'admin' ? router.push('/admin') : router.push('/')
}

/** Email/Password sign-in / 邮箱密码登录 */
const signin = async () => {
  loading.value = true
  errMsg.value = ''
  try {
    const cred = await signInWithEmailAndPassword(auth, email.value, password.value)
    await finishLoginAndRoute(cred.user.uid, email.value) // 传入输入邮箱
  } catch (error) {
    const map = {
      'auth/invalid-email': 'Invalid email address. / 邮箱格式不正确',
      'auth/user-disabled': 'This account has been disabled. / 帐号已被禁用',
      'auth/user-not-found': 'No user with this email. / 用户不存在',
      'auth/wrong-password': 'Incorrect password. / 密码错误',
      'auth/too-many-requests': 'Too many attempts, try later. / 尝试过多，请稍后再试',
    }
    errMsg.value = map[error.code] || error.message || 'Login failed. / 登录失败'
    console.error(error)
  } finally {
    loading.value = false
  }
}

/** Google sign-in (default role=user) / Google 外部登录（默认角色 user） */
const signinWithGoogle = async () => {
  loading.value = true
  errMsg.value = ''
  try {
    const provider = new GoogleAuthProvider()
    // provider.addScope('email') // 可选：添加 scope
    const result = await signInWithPopup(auth, provider)
    await finishLoginAndRoute(result.user.uid, result.user.email) // 传入 Google 返回的邮箱
  } catch (error) {
    const map = {
      'auth/popup-closed-by-user': 'Popup closed before completing sign in. / 弹窗在完成前被关闭',
      'auth/popup-blocked': 'Popup was blocked by the browser. / 弹窗被浏览器拦截',
      'auth/account-exists-with-different-credential':
        'Account exists with different sign-in method. / 该邮箱已绑定其它登录方式',
    }
    errMsg.value = map[error.code] || error.message || 'Google sign-in failed. / Google 登录失败'
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.card {
  backdrop-filter: blur(3px);
}
</style>
