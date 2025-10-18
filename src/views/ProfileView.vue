<!-- src/views/ProfileView.vue -->
<template>
  <div class="container py-4">
    <div class="col-12 col-md-8 col-lg-6 mx-auto">
      <div class="card shadow-sm border-0 rounded-4">
        <div class="card-body p-4">
          <h1 class="h4 mb-3">Your Profile</h1>

          <!-- 加载登录信息 -->
          <div v-if="loading" class="alert alert-info py-2">Loading…</div>

          <!-- 已登录信息 -->
          <div v-else>
            <p class="mb-1">
              <span class="text-muted">Email:</span>
              <strong>{{ email || '—' }}</strong>
            </p>
            <p class="mb-3">
              <span class="text-muted">UID:</span>
              <code class="small">{{ uid }}</code>
            </p>

            <div class="d-flex gap-2">
              <button class="btn btn-danger" @click="logout" :disabled="signingOut">
                <span v-if="!signingOut">Logout</span>
                <span v-else class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                <span v-if="signingOut" class="ms-2">Signing out…</span>
              </button>
              <router-link to="/" class="btn btn-outline-secondary">Back home</router-link>
            </div>

            <div v-if="errorMsg" class="alert alert-warning mt-3 py-2">
              {{ errorMsg }}
            </div>
          </div>
        </div>
      </div>

      <!-- 我的预约 -->
      <div class="card shadow-sm border-0 rounded-4 mt-4">
        <div class="card-body p-4">
          <div class="d-flex align-items-center gap-2 mb-2">
            <h2 class="h5 m-0">我的预约（未来 60 天）</h2>
            <button
              class="btn btn-sm btn-outline-secondary ms-auto"
              @click="refreshMyBookings"
              :disabled="myLoading"
            >
              <span v-if="!myLoading">刷新</span>
              <span v-else class="spinner-border spinner-border-sm" aria-hidden="true"></span>
            </button>
          </div>

          <!-- 提示条 -->
          <p class="small text-muted mb-3">时间以本地时区显示；取消会立即释放名额。</p>

          <!-- 加载/错误/空态 -->
          <div v-if="myLoading" class="alert alert-info py-2">正在加载我的预约…</div>
          <div v-else-if="myError" class="alert alert-danger py-2">{{ myError }}</div>
          <div v-else-if="myBookings.length === 0" class="alert alert-secondary py-2">暂无预约</div>

          <!-- 列表 -->
          <ul v-else class="list-group list-group-flush">
            <li
              v-for="b in myBookings"
              :key="b.bookingId"
              class="list-group-item d-flex flex-wrap align-items-center gap-2 px-0"
            >
              <div class="flex-grow-1">
                <div class="fw-semibold">{{ b.courtName }} · {{ slotLabel(b.slotIndex) }}</div>
                <div class="small text-muted">
                  {{ b.day }}（{{ weekdayLabel(new Date(b.day).getDay()) }}） ·
                  {{ formatDT(b.startISO) }} — {{ formatDT(b.endISO) }}
                </div>
                <div class="small text-muted">
                  预约ID：<code>{{ b.bookingId }}</code>
                </div>
              </div>
              <button
                class="btn btn-sm btn-outline-danger"
                :disabled="cancelLoadingId === b.bookingId"
                @click="cancelBooking(b)"
              >
                <span v-if="cancelLoadingId !== b.bookingId">取消</span>
                <span v-else class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                <span v-if="cancelLoadingId === b.bookingId" class="ms-2">取消中…</span>
              </button>
            </li>
          </ul>

          <!-- 操作状态 -->
          <p class="mt-3 small" :class="myStatusClass" role="status" aria-live="polite">
            {{ myStatus }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'
import axios from 'axios'

/** ========== 你现有的鉴权与资料展示 ========== */
const router = useRouter()
const auth = getAuth()

const loading = ref(true)
const signingOut = ref(false)
const email = ref('')
const uid = ref('')
const errorMsg = ref('')

let unsub = null

onMounted(() => {
  // 监听登录状态；未登录则回登录页
  unsub = onAuthStateChanged(auth, async (u) => {
    loading.value = false
    if (!u) {
      router.replace('/Firelogin') // 注意与路由大小写一致
      return
    }
    email.value = u.email || ''
    uid.value = u.uid || ''

    // 登录后加载“我的预约”
    await refreshMyBookings()
  })
})

onUnmounted(() => {
  unsub && unsub()
})

async function logout() {
  errorMsg.value = ''
  signingOut.value = true
  try {
    await signOut(auth)
    router.replace('/Firelogin') // 或改成你的登录路径
  } catch (e) {
    errorMsg.value = e.code || e.message
  } finally {
    signingOut.value = false
  }
}

/** ========== 新增：我的预约 ========== */

/** 三个 HTTP 触发器 URL（与你预约页保持一致） */
const FUNCTION_URL_LIST = 'https://listbookings-edhvttfqwq-uc.a.run.app'
const FUNCTION_URL_DELETE = 'https://deletebooking-edhvttfqwq-uc.a.run.app'

/** Axios 实例 + 错误提取 */
const http = axios.create({ timeout: 10000 })
function pickError(err) {
  return err?.response?.data?.error || err?.response?.statusText || err?.message || 'Network Error'
}

/** 4 个固定时段（与预约页一致） */
const SLOT_DEFS = [
  { label: '08:00–10:00', startH: 8, startM: 0, endH: 10, endM: 0 },
  { label: '10:00–12:00', startH: 10, startM: 0, endH: 12, endM: 0 },
  { label: '13:00–15:00', startH: 13, startM: 0, endH: 15, endM: 0 },
  { label: '15:00–17:00', startH: 15, startM: 0, endH: 17, endM: 0 },
]
function slotLabel(i) {
  const s = SLOT_DEFS[Number(i)]
  return s ? s.label : `Slot ${i}`
}

/** 场地清单（与预约页一致） */
const courts = [
  { id: 'court-a', name: 'A 号场地' },
  { id: 'court-b', name: 'B 号场地' },
  { id: 'court-c', name: 'C 号场地' },
]
const courtsMap = Object.fromEntries(courts.map((c) => [c.id, c]))

/** 认证头（强制登录） */
async function authHeadersRequired() {
  const user = auth.currentUser
  if (!user) throw new Error('请先登录后再查看预约')
  const token = await user.getIdToken()
  return { Authorization: `Bearer ${token}` }
}

/** 本地 yyyy-mm-dd */
function ymdLocal(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function startOfTodayLocal() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
function formatDT(iso) {
  // 仅用于可读显示
  try {
    const d = new Date(iso)
    return d.toISOString().slice(0, 16).replace('T', ' ')
  } catch {
    return iso
  }
}
function weekdayLabel(i) {
  return ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][i] || ''
}

/** 列表状态 */
const myLoading = ref(false)
const myError = ref('')
const myStatus = ref('')
const myStatusClass = ref('text-muted')
const myBookings = ref([]) // 归一化：{bookingId,courtId,courtName,day,slotIndex,startISO,endISO,userId}

async function refreshMyBookings() {
  myLoading.value = true
  myError.value = ''
  myStatus.value = ''
  myStatusClass.value = 'text-muted'
  myBookings.value = []

  try {
    const headers = await authHeadersRequired()
    const from = startOfTodayLocal()
    const to = addDays(from, 60) // 未来 60 天
    const weekStartMS = from.getTime()
    const weekEndMS = to.getTime()

    // 拉全量：每个场地一次
    const all = []
    for (const c of courts) {
      const res = await http.post(
        FUNCTION_URL_LIST,
        { courtId: c.id, weekStartMS, weekEndMS },
        { headers },
      )
      const rows = Array.isArray(res?.data?.rows) ? res.data.rows : []
      // 归一化、标注场地名
      for (const r of rows) {
        // 只保留“我的”
        if (r?.userId !== uid.value) continue
        all.push({
          bookingId: r.id || `${r.courtId}_${r.day}_${r.slotIndex}`,
          courtId: r.courtId,
          courtName: courtsMap[r.courtId]?.name || r.courtId,
          day: r.day || ymdLocal(r.startISO || from),
          slotIndex: Number(r.slotIndex),
          startISO: r.startISO,
          endISO: r.endISO,
          userId: r.userId,
        })
      }
    }

    // 排序：按日期→slotIndex
    all.sort((a, b) => {
      if (a.day !== b.day) return a.day.localeCompare(b.day)
      return a.slotIndex - b.slotIndex
    })

    myBookings.value = all
    myStatus.value = all.length ? `共 ${all.length} 条预约` : '没有即将到来的预约'
    myStatusClass.value = 'text-success'
  } catch (e) {
    console.error('refreshMyBookings error:', e)
    myError.value = pickError(e)
    myStatus.value = ''
  } finally {
    myLoading.value = false
  }
}

/** 取消预约（调用 deletebooking） */
const cancelLoadingId = ref(null)
async function cancelBooking(b) {
  if (!b?.bookingId) return
  cancelLoadingId.value = b.bookingId
  myStatus.value = ''
  myStatusClass.value = 'text-muted'
  try {
    const headers = await authHeadersRequired()
    await http.post(FUNCTION_URL_DELETE, { bookingId: b.bookingId }, { headers })
    // 本地移除 + 提示
    myBookings.value = myBookings.value.filter((x) => x.bookingId !== b.bookingId)
    myStatus.value = '已取消预约'
    myStatusClass.value = 'text-success'
  } catch (e) {
    console.error('cancelBooking error:', e)
    myStatus.value = pickError(e)
    myStatusClass.value = 'text-danger'
  } finally {
    cancelLoadingId.value = null
  }
}
</script>

<style scoped>
/* minimal polish */
.list-group-item {
  background: transparent;
}
</style>
