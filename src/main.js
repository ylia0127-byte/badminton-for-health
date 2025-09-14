import 'bootstrap/dist/css/bootstrap.min.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'

import { initializeApp } from 'firebase/app'

const firebaseConfig = {
  apiKey: 'AIzaSyDA0vxcYJjwYQRjPxwvnzVFSCL6U47Zfj4',
  authDomain: 'ycl-badminton-for-health.firebaseapp.com',
  projectId: 'ycl-badminton-for-health',
  storageBucket: 'ycl-badminton-for-health.firebasestorage.app',
  messagingSenderId: '3287198331',
  appId: '1:3287198331:web:f9d8b5d85cc13cc2b990de',
}

initializeApp(firebaseConfig)

const app = createApp(App)
app.use(PrimeVue, { theme: { preset: Aura } })
app.use(router)
app.mount('#app')
