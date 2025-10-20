<template>
  <div class="container py-4">
    <div class="col-12 col-lg-8 mx-auto">
      <div class="card shadow-sm border-0 rounded-4">
        <div class="card-body p-4">
          <h1 class="display-6 mb-1">Web Application Rating</h1>
          <p class="text-muted mb-4">
            Rate this web app. Your rating is per user and can be updated anytime.
          </p>

          <!-- Summary -->
          <div class="d-flex align-items-center gap-3 mb-3">
            <div class="fs-5 fw-semibold">Average: {{ avg.toFixed(1) }}</div>
            <span class="badge rounded-pill text-bg-secondary">{{ count }} ratings</span>
          </div>

          <!-- Stars: disabled when not authed -->
          <div
            class="rating-wrap d-flex align-items-center gap-2 mb-2"
            role="radiogroup"
            aria-label="Star rating"
          >
            <button
              v-for="i in 5"
              :key="i"
              class="star-btn"
              :aria-label="`Rate ${i}`"
              :disabled="!isAuthed || saving"
              @click="setRating(i)"
            >
              <span :class="{ active: i <= myRating }">{{ i <= myRating ? '★' : '☆' }}</span>
            </button>

            <span class="ms-2 small text-muted" v-if="isAuthed">
              Your rating: <strong>{{ myRating || '—' }}</strong> (click to change)
            </span>
            <span class="ms-2 small text-muted" v-else>
              Please <router-link to="/login">sign in</router-link> to rate.
            </span>
          </div>

          <div v-if="errorMsg" class="alert alert-warning py-2 mt-2">{{ errorMsg }}</div>

          <hr class="my-4" />

          <p class="small text-muted mb-0">
            Notes: Ratings are one per user. Updating your stars replaces your previous rating.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Web Application Rating
 * - Title changed to "Web Application Rating"
 * - Removed the visible "Item: program:p1" line
 * - Kept route param to select the rated item, but it is not shown in the UI
 * - Light visual polish for stars and layout
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'

// Item identifier (from route) – still used for Firestore paths, just not displayed
const route = useRoute()
const itemId = computed(() => route.params.itemId || 'program:p1')

const isAuthed = ref(false)
const uid = ref(null)
const userEmail = ref('')

const myRating = ref(0)
const avg = ref(0)
const count = ref(0)
const saving = ref(false)
const errorMsg = ref('')

const auth = getAuth()
const db = getFirestore()

let unsubScores = null
let unsubAuth = null

onMounted(() => {
  unsubAuth = onAuthStateChanged(auth, (u) => {
    isAuthed.value = !!u
    uid.value = u?.uid || null
    userEmail.value = u?.email || ''
  })

  const scoresCol = collection(db, 'ratings', itemId.value, 'scores')
  unsubScores = onSnapshot(
    scoresCol,
    (snap) => {
      let sum = 0
      let n = 0
      let mine = 0
      snap.forEach((docSnap) => {
        const d = docSnap.data()
        const s = Number(d?.stars || 0)
        if (s >= 1 && s <= 5) {
          sum += s
          n += 1
        }
        if (docSnap.id === uid.value) mine = s
      })
      avg.value = n ? sum / n : 0
      count.value = n
      myRating.value = mine
    },
    (err) => {
      errorMsg.value = `Failed to load ratings: ${err.message}`
    },
  )
})

onUnmounted(() => {
  unsubScores && unsubScores()
  unsubAuth && unsubAuth()
})

async function setRating(stars) {
  errorMsg.value = ''
  if (!isAuthed.value || !uid.value) {
    errorMsg.value = 'Please sign in to rate.'
    return
  }
  const s = Number(stars)
  if (s < 1 || s > 5) {
    errorMsg.value = 'Rating must be between 1 and 5.'
    return
  }
  try {
    saving.value = true
    const ref = doc(db, 'ratings', itemId.value, 'scores', uid.value)
    await setDoc(
      ref,
      {
        stars: s,
        updatedAt: serverTimestamp(),
        user: { uid: uid.value, email: userEmail.value || null },
      },
      { merge: true },
    )
    // onSnapshot updates avg/myRating/count
  } catch (e) {
    errorMsg.value = `Could not save rating: ${e.message}`
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.container {
  max-width: 880px;
}

/* Stars */
.rating-wrap {
  user-select: none;
}
.star-btn {
  border: none;
  background: transparent;
  padding: 0 2px;
  line-height: 1;
  cursor: pointer;
}
.star-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}
.star-btn span {
  font-size: 2rem; /* bigger, easier to click */
  display: inline-block;
  transform: translateY(-1px);
  color: #6c8cff; /* outline color for empty star */
  text-shadow: 0 0 0 currentColor;
}
.star-btn span.active {
  color: #2f6bff; /* filled star color */
}
.star-btn:hover span,
.star-btn:focus span {
  filter: brightness(0.9);
  outline: none;
}
</style>
