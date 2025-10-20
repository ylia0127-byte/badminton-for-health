<template>
  <div class="page-wrapper py-5">
    <div class="container bg-white shadow-sm rounded-4 p-4">
      <section>
        <h1 class="mb-3 text-center">🏸 Badminton for Health — Melbourne</h1>
        <p class="lead text-center mb-5">
          Welcome to <strong>Badminton for Health — Melbourne</strong>, a community not-for-profit
          improving wellbeing through badminton. We make it easy to get active—affordably,
          inclusively, close to home, and at a relaxed, friendly pace—so everyone can feel better in
          body, mind, and community.
        </p>

        <h2>1. Benefits of Badminton</h2>
        <p>
          <strong>Cardiovascular and Endurance Improvement:</strong> Continuous movement and jumping
          raise heart rate, improving cardiovascular efficiency and lowering heart disease risk.
        </p>
        <p>
          <strong>Coordination and Reflexes:</strong> The fast pace trains eye–hand–foot
          coordination and sharpens reaction speed.
        </p>
        <p>
          <strong>Lower-Body and Core Strength:</strong> Lunges, jumps, and quick steps strengthen
          the quads, glutes, hamstrings, and core.
        </p>
        <p>
          <strong>Fat Burning and Weight Control:</strong> One hour of play can burn 400–600 kcal,
          ideal for maintaining a healthy weight.
        </p>
        <p>
          <strong>Focus and Social Connection:</strong> Badminton improves concentration and offers
          social enjoyment that reduces stress and lifts mood.
        </p>

        <h2 class="mt-5">2. Proper Training Approaches</h2>
        <p>
          <strong>Warm-up and Mobility:</strong> Jog and stretch for 5–10 minutes to prevent
          injuries.
        </p>
        <p>
          <strong>Footwork Drills:</strong> Stay low and light; practice six-point shuttle drills to
          boost court coverage.
        </p>
        <p>
          <strong>Stroke Practice:</strong> Train clears, smashes, drops, and drives to enhance
          precision and consistency.
        </p>
        <p>
          <strong>Strength and Conditioning:</strong> Do 1–2 sessions per week focusing on squats,
          lunges, and planks for power and balance.
        </p>
        <p>
          <strong>Rest and Recovery:</strong> Stretch, hydrate, and sleep well; avoid consecutive
          intense matches to prevent overuse injuries.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
// intentionally empty
</script>

<style scoped>
/* Overall layout */
.page-wrapper {
  background-color: #f5f7f6;
  min-height: 100vh;
}

/* Main container */
.container {
  max-width: 900px;
  line-height: 1.7;
  font-size: 1.05rem;
}

/* Headings */
h1 {
  color: #1b5e20;
  font-size: 2rem;
  font-weight: 700;
}
h2 {
  color: #2e7d32;
  margin-top: 2rem;
  font-size: 1.5rem;
  border-left: 4px solid #81c784;
  padding-left: 10px;
}
p {
  margin-bottom: 1rem;
}
strong {
  color: #2e7d32;
}

/* Visual touches */
.bg-white {
  background-color: #ffffff;
}
.shadow-sm {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.rounded-4 {
  border-radius: 1rem;
}
.lead {
  font-size: 1.1rem;
  color: #444;
}
.text-center {
  text-align: center;
}
@media (max-width: 768px) {
  .container {
    padding: 1.5rem;
  }
  h1 {
    font-size: 1.6rem;
  }
  h2 {
    font-size: 1.3rem;
  }
}
</style>
