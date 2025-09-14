<template>
  <div class="container py-4">
    <h1>Badminton for Health — Melbourne</h1>
    <p class="lead">
      Welcome to Badminton for Health — Melbourne, a community not-for-profit improving wellbeing
      through badminton. We make it easy to get active—affordably, inclusively, close to home, and
      at a relaxed, friendly pace—so everyone can feel better in body, mind, and community.
    </p>

    <div class="d-flex flex-wrap gap-2 mt-3">
      <router-link to="/programs" class="btn btn-primary">Browse Programs</router-link>
      <router-link to="/about" class="btn btn-outline-secondary">About Us</router-link>
      <router-link to="/register" class="btn btn-success">Create an Account</router-link>
    </div>
  </div>
</template>

<script setup>
// intentionally empty
</script>

<style scoped>
/* minimal, mobile-first */
.container {
  max-width: 960px;
}
</style>
