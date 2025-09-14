<template>
  <div class="container py-4">
    <h1 class="mb-3">Program Rating</h1>

    <!-- 当前条目 -->
    <p class="text-muted mb-2">
      Item: <code>{{ itemId }}</code>
    </p>

    <!-- 评分汇总 -->
    <div class="d-flex align-items-center gap-2 mb-2">
      <div class="fs-5">Average: {{ avg.toFixed(1) }}</div>
      <span class="badge text-bg-secondary">{{ count }} ratings</span>
    </div>

    <!-- 星级控件：未登录禁用 -->
    <div class="d-flex align-items-center gap-1 mb-3" role="radiogroup" aria-label="Star rating">
      <button
        v-for="i in 5"
        :key="i"
        class="btn btn-link p-0 fs-3"
        :aria-label="`Rate ${i}`"
        :disabled="!isAuthed || saving"
        @click="setRating(i)"
      >
        <span :class="{ 'fw-bold': i <= myRating }">{{ i <= myRating ? '★' : '☆' }}</span>
      </button>

      <span class="ms-2 small text-muted" v-if="isAuthed">
        Your rating: <strong>{{ myRating || '—' }}</strong> (click to change)
      </span>
      <span class="ms-2 small text-muted" v-else>
        Please <router-link to="/login">sign in</router-link> to rate.
      </span>
    </div>

    <!-- 错误/提示 -->
    <div v-if="errorMsg" class="alert alert-warning py-2">{{ errorMsg }}</div>

    <hr class="my-4" />

    <p class="small text-muted mb-0">
      Notes: Ratings are per user per item. Updating your stars replaces your previous rating.
    </p>
  </div>
</template>

<script setup>
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

// 1) 读取路由参数中的 itemId，或使用一个示例 ID
const route = useRoute()
const itemId = computed(() => route.params.itemId || 'program:p1')

// 2) 登录状态
const isAuthed = ref(false)
const uid = ref(null)
const userEmail = ref('')

// 3) 本人评分 + 汇总
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
  // 监听登录状态
  unsubAuth = onAuthStateChanged(auth, (u) => {
    isAuthed.value = !!u
    uid.value = u?.uid || null
    userEmail.value = u?.email || ''
    // 登录变化后，重新计算本人评分（由汇总订阅统一更新）
  })

  // 订阅该 item 的所有评分文档
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
        if (docSnap.id === uid.value) {
          mine = s
        }
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

// 4) 写入/更新评分（需登录）
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
    // onSnapshot 会自动刷新 myRating / avg / count
  } catch (e) {
    errorMsg.value = `Could not save rating: ${e.message}`
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
/* Minimal styling; relies on Bootstrap if present */
.container {
  max-width: 800px;
}
</style>
