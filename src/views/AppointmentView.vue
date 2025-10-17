<template>
  <section class="container py-4" aria-labelledby="title">
    <h1 id="title" class="h4 mb-3">场地预约 · 周视图（4 时段）｜Weekly Booking (4 time blocks)</h1>

    <!-- 控件：周切换 + 场地选择 -->
    <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
      <label class="form-label m-0">场地｜Court</label>
      <select v-model="selectedCourt" class="form-select" style="max-width: 220px">
        <option v-for="c in courts" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>

      <div class="ms-auto d-flex align-items-center gap-2">
        <button
          class="btn btn-outline-secondary btn-sm"
          @click="prevWeek"
          aria-label="上一周｜Previous week"
        >
          ‹
        </button>
        <div class="fw-semibold">{{ weekRangeLabel }}</div>
        <button
          class="btn btn-outline-secondary btn-sm"
          @click="nextWeek"
          aria-label="下一周｜Next week"
        >
          ›
        </button>
        <button class="btn btn-outline-secondary btn-sm" @click="goThisWeek">
          本周｜This week
        </button>
      </div>
    </div>

    <!-- 图例 -->
    <div class="d-flex align-items-center gap-3 small text-muted mb-2">
      <span><span class="legend legend-free"></span> 可预约｜Free</span>
      <span><span class="legend legend-busy"></span> 已占用｜Booked</span>
      <span><span class="legend legend-past"></span> 已过期｜Past</span>
    </div>

    <!-- 4×7 网格（行=时段，列=星期） -->
    <div class="scheduler" role="grid" aria-label="四时段周视图｜4-block weekly grid">
      <!-- 左上角空白 -->
      <div class="grid-head"></div>
      <!-- 星期标题 -->
      <div v-for="d in 7" :key="'h' + d" class="grid-head day">
        {{ weekdayLabel(d - 1) }}<br />
        <span class="date">{{ dayISO(d - 1) }}</span>
      </div>

      <!-- 每个时段一行 -->
      <template v-for="(slot, si) in SLOT_DEFS" :key="'row' + si">
        <!-- 左侧：时段标签 -->
        <div class="time-cell">{{ slot.label }}</div>
        <!-- 7 天对应格子 -->
        <template v-for="d in 7" :key="'cell-' + si + '-' + d">
          <button
            class="slot"
            :class="slotClass(d - 1, si)"
            :disabled="!isSlotClickable(d - 1, si)"
            :aria-label="ariaLabel(d - 1, si)"
            @click="selectSlot(d - 1, si)"
          >
            <!-- 用视觉标签提示状态 -->
            <span class="visually-hidden">
              {{ ariaLabel(d - 1, si) }}
            </span>
          </button>
        </template>
      </template>
    </div>

    <!-- 待确认条 -->
    <div v-if="pending" class="confirm card border-0 shadow-sm mt-3">
      <div class="card-body d-flex flex-wrap align-items-center gap-3">
        <div>
          <div class="fw-semibold">准备预约｜Ready to book</div>
          <div class="small text-muted">
            {{ courtsMap[selectedCourt].name }} · {{ formatDT(pending.start) }} —
            {{ formatDT(pending.end) }}
          </div>
        </div>
        <div class="ms-auto d-flex gap-2">
          <button class="btn btn-light" @click="pending = null">取消｜Cancel</button>
          <button class="btn btn-dark" :disabled="loading" @click="confirmBooking">
            <span v-if="!loading">确认预约｜Confirm</span>
            <span v-else class="d-inline-flex align-items-center gap-2">
              <span
                class="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
              提交中…｜Submitting…
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
import { ref, computed, onMounted } from 'vue'
import { getFunctions, httpsCallable } from 'firebase/functions'

/** =====================
 * 1) 固定时段定义 / Slot defs
 * ===================== */
const SLOT_DEFS = [
  { label: '08:00–10:00', startH: 8, startM: 0, endH: 10, endM: 0 },
  { label: '10:00–12:00', startH: 10, startM: 0, endH: 12, endM: 0 },
  { label: '13:00–15:00', startH: 13, startM: 0, endH: 15, endM: 0 },
  { label: '15:00–17:00', startH: 15, startM: 0, endH: 17, endM: 0 },
]
// 你可以在此加入/调整时段；渲染与冲突检测会自动适配
// You can add/change blocks here; grid & conflict logic adapts automatically.

/** =====================
 * 2) 基本配置 / Courts & Week
 * ===================== */
const courts = [
  { id: 'court-a', name: 'A 号场地' },
  { id: 'court-b', name: 'B 号场地' },
  { id: 'court-c', name: 'C 号场地' },
]
const courtsMap = Object.fromEntries(courts.map((c) => [c.id, c]))
const selectedCourt = ref(courts[0].id)

// 当周周一 00:00 / Monday as week start
function startOfWeek(dt) {
  const d = new Date(dt)
  const day = (d.getDay() + 6) % 7 // Monday=0
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - day)
  return d
}
const weekStart = ref(startOfWeek(new Date()))
function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
function weekdayLabel(i) {
  return ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i]
}
function dayISO(i) {
  return addDays(weekStart.value, i).toISOString().slice(0, 10)
}
const weekRangeLabel = computed(() => {
  const s = addDays(weekStart.value, 0).toISOString().slice(0, 10)
  const e = addDays(weekStart.value, 6).toISOString().slice(0, 10)
  return `${s} ~ ${e}`
})
function prevWeek() {
  weekStart.value = addDays(weekStart.value, -7)
}
function nextWeek() {
  weekStart.value = addDays(weekStart.value, 7)
}
function goThisWeek() {
  weekStart.value = startOfWeek(new Date())
}

/** =====================
 * 3) 占用数据 / Busy bookings
 * ===================== */
// busy: { id, courtId, start: ISO, end: ISO }
const busy = ref([])

onMounted(async () => {
  // TODO: 替换为云函数 listBookings（按周/场地拉取）
  busy.value = demoBookings()
})

function demoBookings() {
  // 随机生成几条占用（仅用于演示）
  const arr = []
  for (let i = 0; i < 4; i++) {
    const d = Math.floor(Math.random() * 7)
    const sdef = SLOT_DEFS[Math.floor(Math.random() * SLOT_DEFS.length)]
    const s = slotStartDate(d, sdef)
    const e = slotEndDate(d, sdef)
    arr.push({
      id: crypto.randomUUID(),
      courtId: 'court-a',
      start: s.toISOString(),
      end: e.toISOString(),
    })
  }
  return arr
}

/** =====================
 * 4) 时段/冲突判断 / Block logic
 * ===================== */
function slotStartDate(dIndex, sdef) {
  const base = addDays(weekStart.value, dIndex)
  const start = new Date(base)
  start.setHours(sdef.startH, sdef.startM, 0, 0)
  return start
}
function slotEndDate(dIndex, sdef) {
  const base = addDays(weekStart.value, dIndex)
  const end = new Date(base)
  end.setHours(sdef.endH, sdef.endM, 0, 0)
  return end
}
function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd
}

const now = ref(new Date())
setInterval(() => (now.value = new Date()), 60 * 1000)

function isBusy(dIndex, sIndex) {
  const sdef = SLOT_DEFS[sIndex]
  const s = slotStartDate(dIndex, sdef)
  const e = slotEndDate(dIndex, sdef)
  return busy.value.some(
    (b) => b.courtId === selectedCourt.value && overlaps(s, e, new Date(b.start), new Date(b.end)),
  )
}
function isPast(dIndex, sIndex) {
  const s = slotStartDate(dIndex, SLOT_DEFS[sIndex])
  return s < now.value
}
function isSlotClickable(dIndex, sIndex) {
  return !isBusy(dIndex, sIndex) && !isPast(dIndex, sIndex)
}
function slotClass(dIndex, sIndex) {
  return {
    busy: isBusy(dIndex, sIndex),
    past: isPast(dIndex, sIndex) && !isBusy(dIndex, sIndex),
    free: !isBusy(dIndex, sIndex) && !isPast(dIndex, sIndex),
  }
}
function ariaLabel(dIndex, sIndex) {
  const day = weekdayLabel(dIndex)
  const label = SLOT_DEFS[sIndex].label
  const state = isBusy(dIndex, sIndex)
    ? '已占用｜Booked'
    : isPast(dIndex, sIndex)
      ? '已过期｜Past'
      : '可预约｜Free'
  return `${day} ${label}，${state}`
}

/** =====================
 * 5) 预约流程 / Booking flow
 * ===================== */
const pending = ref(null)
const loading = ref(false)
const status = ref('')
const statusClass = ref('text-muted')

function selectSlot(dIndex, sIndex) {
  const sdef = SLOT_DEFS[sIndex]
  const start = slotStartDate(dIndex, sdef)
  const end = slotEndDate(dIndex, sdef)
  // 冲突再检（双保险）
  if (isBusy(dIndex, sIndex)) {
    status.value = '该时段已被占用｜Block already booked'
    statusClass.value = 'text-danger'
    return
  }
  if (isPast(dIndex, sIndex)) {
    status.value = '该时段已过期｜Block in the past'
    statusClass.value = 'text-danger'
    return
  }
  pending.value = { courtId: selectedCourt.value, start, end }
  status.value = ''
  statusClass.value = 'text-muted'
}

function formatDT(d) {
  const x = new Date(d)
  return x.toISOString().slice(0, 16).replace('T', ' ')
}

async function confirmBooking() {
  if (!pending.value) return
  loading.value = true
  try {
    // 真实后端（示例）：createBooking
    // const fn = httpsCallable(getFunctions(), 'createBooking')
    // const res = await fn({
    //   courtId: pending.value.courtId,
    //   start: pending.value.start.toISOString(),
    //   end: pending.value.end.toISOString()
    // })
    // const id = res.data.id

    // Demo：直接写入本地 busy
    const id = crypto.randomUUID()
    busy.value.push({
      id,
      courtId: pending.value.courtId,
      start: pending.value.start.toISOString(),
      end: pending.value.end.toISOString(),
    })
    status.value = '预约成功｜Booked successfully'
    statusClass.value = 'text-success'
    pending.value = null
  } catch (e) {
    console.error(e)
    status.value = '预约失败｜Booking failed'
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

/* 图例 Legend */
.legend {
  display: inline-block;
  width: 16px;
  height: 10px;
  border-radius: 3px;
  margin-right: 6px;
  vertical-align: middle;
}
.legend-free {
  background: #2ecc71;
}
.legend-busy {
  background: #e74c3c;
}
.legend-past {
  background: #bdc3c7;
}

/* 4×7 网格 */
.scheduler {
  display: grid;
  grid-template-columns: 140px repeat(7, 1fr); /* 左列:时段标签 + 七天 */
  grid-auto-rows: 64px; /* 行高更大，视觉清晰 */
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

/* 可点格子 */
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

/* 待确认条样式 */
.confirm .card-body {
  border-left: 5px solid #28a745;
  border-radius: 8px;
}
</style>
