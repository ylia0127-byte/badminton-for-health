<template>
  <header class="custom-header">
    <div class="container d-flex justify-content-center py-3">
      <ul class="nav">
        <li class="nav-item">
          <router-link to="/" class="nav-link">Home</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/about" class="nav-link">About</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/Firelogin" class="nav-link">Firebase Login</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/FireRegister" class="nav-link">Firebase Register</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/Rating" class="nav-link">Rating</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/profile" class="nav-link">Profile</router-link>
        </li>
      </ul>
    </div>
  </header>
</template>

<style scoped>
.custom-header {
  background-color: #28a745; /* Bootstrap的绿色 (success) */
  width: 100%;
  color: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

/* 导航链接样式 */
.nav-link {
  color: white !important;
  font-weight: 500;
  padding: 0.5rem 1rem;
  transition:
    background-color 0.3s,
    color 0.3s;
}

/* 悬停与激活状态 */
.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
}

.router-link-active {
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
}
</style>
