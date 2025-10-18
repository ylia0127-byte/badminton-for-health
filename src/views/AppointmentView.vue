<template>
  <section class="container py-4" aria-labelledby="title">
    <h1 id="title" class="h4 mb-3">场地预约 · 周视图（4 时段）</h1>

    <!-- 场地 + 周切换 -->
    <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
      <label class="form-label m-0">场地</label>
      <select v-model="selectedCourt" class="form-select" style="max-width: 220px">
        <option v-for="c in courts" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>

      <div class="ms-auto d-flex align-items-center gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="prevWeek" aria-label="上一周">
          ‹
        </button>
        <div class="fw-semibold">{{ weekRangeLabel }}</div>
        <button class="btn btn-outline-secondary btn-sm" @click="nextWeek" aria-label="下一周">
          ›
        </button>
        <button class="btn btn-outline-secondary btn-sm" @click="goThisWeek">本周</button>
      </div>
    </div>

    <!-- 图例 -->
    <div class="d-flex align-items-center gap-3 small text-muted mb-2">
      <span><span class="legend legend-free"></span> 可预约</span>
      <span><span class="legend legend-mine"></span> 我的预约</span>
      <span><span class="legend legend-busy"></span> 他人已占</span>
      <span><span class="legend legend-past"></span> 已过期</span>
      <span><span class="legend legend-selected"></span> 当前选择</span>
    </div>

    <!-- 4×7 网格 -->
    <div class="scheduler" role="grid" aria-label="四时段周视图">
      <div class="grid-head"></div>
      <div v-for="d in 7" :key="'h' + d" class="grid-head day">
        {{ weekdayLabel(d - 1) }}<br />
        <span class="date">{{ dayISO(d - 1) }}</span>
      </div>

      <template v-for="(slot, si) in SLOT_DEFS" :key="'row' + si">
        <div class="time-cell">{{ slot.label }}</div>
        <template v-for="d in 7" :key="'cell-' + si + '-' + d">
          <button
            class="slot"
            :class="slotClass(d - 1, si)"
            :disabled="!isSlotInteractive(d - 1, si)"
            :aria-label="ariaLabel(d - 1, si)"
            @click="handleClick(d - 1, si)"
          />
        </template>
      </template>
    </div>

    <!-- 预约确认 -->
    <div v-if="pendingCreate" class="confirm card border-0 shadow-sm mt-3">
      <div class="card-body d-flex flex-wrap align-items-center gap-3">
        <div>
          <div class="fw-semibold">确认预约</div>
          <div class="small text-muted">
            {{ courtsMap[selectedCourt].name }} · {{ formatDT(pendingCreate.start) }} —
            {{ formatDT(pendingCreate.end) }}
          </div>
        </div>
        <div class="ms-auto d-flex gap-2">
          <button class="btn btn-light" @click="pendingCreate = null">取消</button>
          <button class="btn btn-dark" :disabled="loading" @click="confirmBooking">
            <span v-if="!loading">确认</span>
            <span v-else class="d-inline-flex align-items-center gap-2">
              <span
                class="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
              提交中…
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- 取消确认（仅我的预约） -->
    <div v-if="pendingCancel" class="confirm card border-0 shadow-sm mt-3">
      <div class="card-body d-flex flex-wrap align-items-center gap-3">
        <div>
          <div class="fw-semibold">取消预约</div>
          <div class="small text-muted">
            {{ courtsMap[selectedCourt].name }} · {{ formatDT(pendingCancel.start) }} —
            {{ formatDT(pendingCancel.end) }}
          </div>
        </div>
        <div class="ms-auto d-flex gap-2">
          <button class="btn btn-light" @click="pendingCancel = null">返回</button>
          <button class="btn btn-danger" :disabled="loading" @click="confirmCancel">
            <span v-if="!loading">取消预约</span>
            <span v-else class="d-inline-flex align-items-center gap-2">
              <span
                class="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
              提交中…
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- 状态提示 -->
    <p class="mt-2 small" :class="statusClass" role="status" aria-live="polite">{{ status }}</p>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

/** 三个 HTTP 触发器 URL（已替换为你的实际地址） */
const FUNCTION_URL_LIST = 'https://listbookings-edhvttfqwq-uc.a.run.app'
const FUNCTION_URL_CREATE = 'https://createbooking-edhvttfqwq-uc.a.run.app'
const FUNCTION_URL_DELETE = 'https://deletebooking-edhvttfqwq-uc.a.run.app'

/** Axios 实例 + 错误提取 */
const http = axios.create({ timeout: 10000 })
function pickError(err) {
  return err?.response?.data?.error || err?.response?.statusText || err?.message || 'Network Error'
}

/** 固定时段定义：四个区块 */
const SLOT_DEFS = [
  { label: '08:00–10:00', startH: 8, startM: 0, endH: 10, endM: 0 },
  { label: '10:00–12:00', startH: 10, startM: 0, endH: 12, endM: 0 },
  { label: '13:00–15:00', startH: 13, startM: 0, endH: 15, endM: 0 },
  { label: '15:00–17:00', startH: 15, startM: 0, endH: 17, endM: 0 },
]

/** 场地与周时间 */
const courts = [
  { id: 'court-a', name: 'A 号场地' },
  { id: 'court-b', name: 'B 号场地' },
  { id: 'court-c', name: 'C 号场地' },
]
const courtsMap = Object.fromEntries(courts.map((c) => [c.id, c]))
const selectedCourt = ref(courts[0].id)

function startOfWeek(dt) {
  const d = new Date(dt)
  const w = d.getDay() // 以周一为一周开始
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - w)
  return d
}
function ymdLocal(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}` // 本地时区的 yyyy-mm-dd
}
const weekStart = ref(startOfWeek(new Date()))

function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
function weekdayLabel(i) {
  return ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][i]
} // 按你原样保留
function dayISO(i) {
  return ymdLocal(addDays(weekStart.value, i))
}
const weekRangeLabel = computed(() => `${dayISO(0)} ~ ${dayISO(6)}`)
function prevWeek() {
  weekStart.value = addDays(weekStart.value, -7)
}
function nextWeek() {
  weekStart.value = addDays(weekStart.value, 7)
}
function goThisWeek() {
  weekStart.value = startOfWeek(new Date())
}

/** 登录用户（用于“我的预约”与鉴权） */
const uid = ref(null)
const auth = getAuth()
onMounted(() => {
  onAuthStateChanged(auth, async (u) => {
    uid.value = u?.uid || null
    await fetchWeek() // 用户切换后刷新
  })
})

/** 获取带 ID Token 的 headers；未登录直接抛错（避免莫名其妙的 Network Error） */
async function authHeadersRequired() {
  const user = auth.currentUser
  if (!user) throw new Error('请先登录再进行预约或查看数据')
  const token = await user.getIdToken()
  return { Authorization: `Bearer ${token}` }
}

/** 已占用数据 */
const busy = ref([]) // [{id,courtId,day,slotIndex,start,end,userId}]
async function fetchWeek() {
  try {
    const headers = await authHeadersRequired()
    const weekStartMS = weekStart.value.getTime()
    const weekEndMS = addDays(weekStart.value, 7).getTime()
    const res = await http.post(
      FUNCTION_URL_LIST,
      {
        courtId: selectedCourt.value,
        weekStartMS,
        weekEndMS, // ← 用毫秒值
      },
      { headers },
    )
    busy.value = res?.data?.rows || []
    status.value = ''
  } catch (e) {
    console.error('listBookings error:', e)
    status.value = pickError(e)
    statusClass.value = 'text-danger'
    busy.value = []
  }
}
watch([weekStart, selectedCourt], fetchWeek, { immediate: true })

/** 网格状态与交互 */
const now = ref(new Date())
setInterval(() => (now.value = new Date()), 60 * 1000)

function slotStartDate(dIndex, sdef) {
  const base = addDays(weekStart.value, dIndex)
  const dt = new Date(base)
  dt.setHours(sdef.startH, sdef.startM ?? 0, 0, 0)
  return dt
}
function slotEndDate(dIndex, sdef) {
  const base = addDays(weekStart.value, dIndex)
  const dt = new Date(base)
  dt.setHours(sdef.endH, sdef.endM ?? 0, 0, 0)
  return dt
}
function findBooking(dIndex, sIndex) {
  const day = dayISO(dIndex)
  return (
    busy.value.find(
      (b) =>
        b.courtId === selectedCourt.value &&
        b.day === day &&
        Number(b.slotIndex) === Number(sIndex),
    ) || null
  )
}
function isPast(dIndex, sIndex) {
  return slotStartDate(dIndex, SLOT_DEFS[sIndex]) < now.value
}
function isMine(dIndex, sIndex) {
  const b = findBooking(dIndex, sIndex)
  return b && b.userId === uid.value
}
function isBusyOther(dIndex, sIndex) {
  const b = findBooking(dIndex, sIndex)
  return b && b.userId !== uid.value
}
function isFree(dIndex, sIndex) {
  return !findBooking(dIndex, sIndex) && !isPast(dIndex, sIndex)
}

const pendingCreate = ref(null) // {courtId,start,end}
const pendingCancel = ref(null) // {bookingId,courtId,start,end}
const loading = ref(false)
const status = ref('')
const statusClass = ref('text-muted')

function slotClass(dIndex, sIndex) {
  const selectedCreate =
    !!pendingCreate.value &&
    pendingCreate.value.start?.toISOString?.().slice(0, 16) ===
      slotStartDate(dIndex, SLOT_DEFS[sIndex]).toISOString().slice(0, 16)
  const selectedCancel =
    !!pendingCancel.value &&
    pendingCancel.value.start?.toISOString?.().slice(0, 16) ===
      slotStartDate(dIndex, SLOT_DEFS[sIndex]).toISOString().slice(0, 16)

  return {
    free: isFree(dIndex, sIndex),
    mine: isMine(dIndex, sIndex),
    busy: isBusyOther(dIndex, sIndex),
    past: isPast(dIndex, sIndex),
    selected: selectedCreate || selectedCancel,
  }
}
function isSlotInteractive(dIndex, sIndex) {
  return isFree(dIndex, sIndex) || isMine(dIndex, sIndex)
}
function ariaLabel(dIndex, sIndex) {
  const day = weekdayLabel(dIndex)
  const block = SLOT_DEFS[sIndex].label
  if (isMine(dIndex, sIndex)) return `${day} ${block}，我的预约，可取消`
  if (isBusyOther(dIndex, sIndex)) return `${day} ${block}，他人已占用`
  if (isPast(dIndex, sIndex)) return `${day} ${block}，已过期`
  return `${day} ${block}，可预约`
}
function handleClick(dIndex, sIndex) {
  status.value = ''
  statusClass.value = 'text-muted'
  const day = dayISO(dIndex)
  const sdef = SLOT_DEFS[sIndex]
  const start = slotStartDate(dIndex, sdef)
  const end = slotEndDate(dIndex, sdef)

  if (isMine(dIndex, sIndex)) {
    const bookingId = `${selectedCourt.value}_${day}_${sIndex}` // 确定性 ID
    pendingCancel.value = { bookingId, courtId: selectedCourt.value, start, end }
    pendingCreate.value = null
    return
  }
  if (isFree(dIndex, sIndex)) {
    pendingCreate.value = { courtId: selectedCourt.value, start, end }
    pendingCancel.value = null
  }
}

/** 提交/取消 */
function formatDT(d) {
  return new Date(d).toISOString().slice(0, 16).replace('T', ' ')
}

async function confirmBooking() {
  if (!pendingCreate.value) return
  loading.value = true
  try {
    const headers = await authHeadersRequired()
    const { courtId, start, end } = pendingCreate.value
    const day = ymdLocal(start) // ← 替换原来的 start.toISOString().slice(0,10)
    const sIndex = SLOT_DEFS.findIndex(
      (s) => s.startH === start.getHours() && s.endH === end.getHours(),
    )
    await http.post(
      FUNCTION_URL_CREATE,
      {
        courtId,
        day,
        slotIndex: sIndex,
        startISO: start.toISOString(),
        endISO: end.toISOString(),
      },
      { headers },
    )
    await fetchWeek()
    status.value = '预约成功'
    statusClass.value = 'text-success'
    pendingCreate.value = null
  } catch (e) {
    console.error('createBooking error:', e)
    status.value = pickError(e)
    statusClass.value = 'text-danger'
  } finally {
    loading.value = false
  }
}

async function confirmCancel() {
  if (!pendingCancel.value) return
  loading.value = true
  try {
    const headers = await authHeadersRequired()
    await http.post(FUNCTION_URL_DELETE, { bookingId: pendingCancel.value.bookingId }, { headers })
    await fetchWeek()
    status.value = '已取消预约'
    statusClass.value = 'text-success'
    pendingCancel.value = null
  } catch (e) {
    console.error('deleteBooking error:', e)
    status.value = pickError(e)
    statusClass.value = 'text-danger'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
* {
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

/* 图例 */
.legend {
  display: inline-block;
  width: 16px;
  height: 10px;
  border-radius: 3px;
  margin-right: 6px;
  vertical-align: middle;
}
.legend-free {
  background: #eafaf0;
  border: 1px solid #cfe9d7;
}
.legend-mine {
  background: #ffe08a;
  border: 1px solid #ffd166;
}
.legend-busy {
  background: repeating-linear-gradient(45deg, #ffe5e5, #ffe5e5 6px, #ffd6d6 6px, #ffd6d6 12px);
  border: 1px solid #f1b0b7;
}
.legend-past {
  background: #f1f3f5;
  border: 1px solid #e9ecef;
}
.legend-selected {
  background: #fff3bf;
  border: 1px dashed #ffd43b;
}

/* 网格 */
.scheduler {
  display: grid;
  grid-template-columns: 140px repeat(7, 1fr);
  grid-auto-rows: 64px;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
}
.grid-head {
  background: #f8f9fa;
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  border-right: 1px solid #e9ecef;
}
.grid-head.day {
  text-align: center;
  padding: 8px 6px;
  line-height: 1.2;
  border-left: 1px solid #e9ecef;
}
.grid-head .date,
.day .date {
  font-size: 0.8rem;
  color: #6c757d;
}

.time-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #495057;
  background: #fcfcfc;
  border-top: 1px solid #f1f3f5;
  border-right: 1px solid #e9ecef;
}

/* 单元格 */
.slot {
  border: 1px solid #f1f3f5;
  background: white;
  width: 100%;
  height: 100%;
  cursor: pointer;
  transition:
    background 0.15s ease,
    outline 0.1s;
}
.slot.free:hover,
.slot.free:focus {
  background: #eafaf0;
  outline: 2px solid #28a74555;
}
.slot.busy {
  background: repeating-linear-gradient(45deg, #ffe5e5, #ffe5e5 6px, #ffd6d6 6px, #ffd6d6 12px);
  cursor: not-allowed;
}
.slot.past {
  background: #f6f7f9;
  cursor: not-allowed;
}
.slot.mine {
  background: #ffe08a;
  border-color: #ffd166;
} /* 我的预约：黄色高亮 */
.slot.selected {
  outline: 2px dashed #ffd43b;
  outline-offset: -3px;
} /* 当前选择：虚线强调 */

/* 确认条 */
.confirm .card-body {
  border-left: 5px solid #28a745;
  border-radius: 8px;
}
</style>
