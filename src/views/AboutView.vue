<template>
  <div class="container py-6">
    <!-- About Us -->
    <section class="content max-w-3xl mx-auto" aria-labelledby="about-title">
      <h1 id="about-title" class="mb-3">About Us</h1>
      <p>
        <strong>Badminton for Health</strong> is a not-for-profit initiative that uses simple, smart
        technology to help people move more and feel better. We make it easier to discover
        badminton, book courts without clashes, and join community health activities—all in one
        place.
      </p>
      <p>
        We partner with local councils, schools, and health organisations to improve court
        utilisation and reduce booking conflicts, so more people can play with less friction. Beyond
        scheduling, we communicate the health benefits of badminton—supporting physical fitness,
        mental balance, and social connection.
      </p>
      <p>
        Our platform is inclusive by design: accessible to beginners and regular players alike,
        mobile-friendly, keyboard navigable, and built with WCAG 2.1 AA practices. Everyone deserves
        the chance to move, play, and thrive—technology should make that easier, not harder.
      </p>

      <h2 class="mt-4">Vision</h2>
      <p>
        A community where everyone can easily access badminton facilities, enjoy healthy exercise,
        and experience the joy of shared activity.
      </p>

      <h2 class="mt-4">Mission</h2>
      <ul>
        <li>Promote health and well-being through accessible badminton participation.</li>
        <li>Reduce court booking conflicts and improve venue utilisation with digital tools.</li>
        <li>
          Invite people of all ages to join health events and learn the benefits of active living.
        </li>
        <li>Connect people and communities through the spirit of sport.</li>
      </ul>
    </section>
  </div>
</template>

<script setup>
// intentionally empty
</script>

<style scoped>
/* Layout */
.container {
  padding-inline: 1rem;
}
.max-w-3xl {
  max-width: 56rem;
}
.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
.py-6 {
  padding-block: 2rem;
}
.mt-4 {
  margin-top: 1rem;
}
.mb-3 {
  margin-bottom: 0.75rem;
}

/* Typography */
h1,
h2 {
  line-height: 1.25;
}
h1 {
  font-size: 1.75rem;
}
h2 {
  font-size: 1.25rem;
  margin-top: 1.25rem;
}
p,
li,
small,
label {
  line-height: 1.6;
}

/* Content block */
.content {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
</style>
