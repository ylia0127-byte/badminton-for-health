// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import AboutView from '@/views/AboutView.vue'
import FirebaseSigninView from '@/views/FirebaseSigninView.vue'
import FirebaseRegisterView from '@/views/FirebaseRegisterView.vue'
import RatingView from '@/views/RatingView.vue'
import ProfileView from '../views/ProfileView.vue'

// Firebase Auth + Firestore for role checks
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase/config'

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/about', name: 'About', component: AboutView },

  // guest-only pages
  {
    path: '/Firelogin',
    name: 'Firelogin',
    component: FirebaseSigninView,
    meta: { guestOnly: true },
  },
  {
    path: '/FireRegister',
    name: 'FireRegister',
    component: FirebaseRegisterView,
    meta: { guestOnly: true },
  },

  // protected: must be signed in and have allowed role
  {
    path: '/Rating',
    name: 'Rating',
    component: RatingView,
    meta: { requiresAuth: true, roles: ['user', 'admin'] },
  },

  // Optional: If you have an administrator page, untangle the comments below and ensure that there is a corresponding AdminView-vue
  // { path: '/admin', name: 'Admin', component: () => import('@/views/AdminView.vue'),
  //   meta: { requiresAuth: true, roles: ['admin'] } },

  { path: '/:pathMatch(.*)*', redirect: '/' }, // fallback
  { path: '/profile', name: 'profile', component: ProfileView, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

/** ---------- Global auth/role guard ---------- **/

// simple in-memory cache for role
let cachedUid = null
let cachedRole = null

function getCurrentUser() {
  return new Promise((resolve) => {
    const stop = onAuthStateChanged(auth, (user) => {
      stop()
      resolve(user)
    })
  })
}

async function getUserRole(user) {
  if (!user) return null
  if (cachedUid === user.uid && cachedRole) return cachedRole
  const snap = await getDoc(doc(db, 'users', user.uid))
  cachedRole = snap.exists() ? snap.data().role || 'user' : 'user'
  cachedUid = user.uid
  return cachedRole
}

router.beforeEach(async (to) => {
  const user = await getCurrentUser()

  // block logged-in users from guest-only routes
  if (to.meta?.guestOnly && user) return { path: '/' }

  // require auth when needed
  if (to.meta?.requiresAuth && !user) {
    return { path: '/Firelogin', query: { redirect: to.fullPath } }
  }

  // role check (if route defines roles)
  if (to.meta?.roles?.length) {
    const role = await getUserRole(user)
    if (!role || !to.meta.roles.includes(role)) {
      return { path: '/' }
    }
  }

  return true
})

export default router
