<template>
  <header class="app-header">
    <nav class="container d-flex align-items-center justify-content-between py-3">
      <!-- main menu -->
      <ul class="nav gap-2 gap-md-3">
        <li class="nav-item">
          <router-link to="/" class="nav-link" exact>Home</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/about" class="nav-link">About</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/Rating" class="nav-link">Rating</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/ranking" class="nav-link">Ranking</router-link>
        </li>
        <li class="nav-item" v-if="isAuthed">
          <router-link to="/appointment" class="nav-link">Appointment</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/map" class="nav-link">Map</router-link>
        </li>
      </ul>

      <!-- account area -->
      <ul class="nav gap-2 gap-md-3">
        <template v-if="!isAuthed">
          <li class="nav-item">
            <router-link to="/Firelogin" class="nav-link">Login</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/FireRegister" class="nav-link">Register</router-link>
          </li>
        </template>
        <template v-else>
          <li class="nav-item">
            <router-link to="/profile" class="nav-link">Profile</router-link>
          </li>
        </template>
      </ul>
    </nav>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const isAuthed = ref(false)

onMounted(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, (user) => {
    isAuthed.value = !!user
  })
})
</script>

<style scoped>
/* import Google font */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

.app-header {
  background-color: #28a745; /* Bootstrap green */
  width: 100%;
  color: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  font-family:
    'Inter',
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    'Noto Sans',
    sans-serif;
}

/* Navigation link style */
.nav-link {
  color: white !important;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 0.6rem;
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
  letter-spacing: 0.2px;
}

/* Hover state */
.nav-link:hover,
.nav-link:focus {
  background-color: rgba(255, 255, 255, 0.18);
  text-decoration: none;
}

/* Active link (current page) */
.router-link-active,
.router-link-exact-active {
  background-color: rgba(255, 255, 255, 0.28);
}

/* Responsive layout for small screens */
@media (max-width: 576px) {
  .container {
    flex-direction: column;
    gap: 0.5rem;
  }
  .nav {
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>
