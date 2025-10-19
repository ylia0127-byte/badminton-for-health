<template>
  <div class="container py-4">
    <h1 class="page-title">Ranking</h1>

    <!-- ========== Fitness Ranking ========== -->
    <section class="mb-5 section-card" aria-labelledby="fitness-title">
      <header class="section-head">
        <div>
          <h2 id="fitness-title" class="section-title">Fitness Ranking</h2>
          <p class="section-sub">
            Default ranking: Duration (minutes). Switch to Highest Rally. Top 10 only.
          </p>
        </div>
        <div class="section-actions">
          <input
            v-model.trim="fitnessSearch"
            type="search"
            class="form-control control-sm"
            placeholder="Search by name/nickname"
          />
          <button class="btn btn-outline-secondary control-sm" @click="exportFitnessCsv">
            Export CSV
          </button>
        </div>
      </header>

      <!-- Filters -->
      <div class="filter-bar">
        <div class="row g-3 align-items-end">
          <div class="col-12 col-md-4">
            <label class="form-label">Gender</label>
            <select v-model="fitnessGender" class="form-select">
              <option value="all">All</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="col-12 col-md-8">
            <label class="form-label d-block">Ranking Metric</label>
            <div class="btn-group metric-group" role="group" aria-label="rank-metric">
              <input
                type="radio"
                class="btn-check"
                id="f-rank-duration"
                value="duration"
                v-model="fitnessRankBy"
              />
              <label
                class="btn btn-switch"
                :class="{ active: fitnessRankBy === 'duration' }"
                for="f-rank-duration"
                >Duration</label
              >

              <input
                type="radio"
                class="btn-check"
                id="f-rank-rally"
                value="rally"
                v-model="fitnessRankBy"
              />
              <label
                class="btn btn-switch"
                :class="{ active: fitnessRankBy === 'rally' }"
                for="f-rank-rally"
                >Rally Record</label
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="table-wrap">
        <table class="table align-middle table-modern">
          <thead>
            <tr>
              <th class="w-rank">Rank</th>
              <th>Name/Nickname</th>
              <th class="w-gender">Gender</th>
              <th class="w-num">Duration (min)</th>
              <th class="w-num">Rally Record</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, idx) in fitnessTop10" :key="`f-${r.userId}`">
              <td>
                <span class="rank-pill" :data-rank="idx + 1">{{ rankBadge(idx + 1) }}</span>
              </td>
              <td>{{ r.name }}</td>
              <td class="text-capitalize">{{ labelGender(r.gender) }}</td>
              <td class="mono">{{ r.durationMinutes }}</td>
              <td class="mono">{{ r.rallyRecord }}</td>
            </tr>
            <tr v-if="fitnessTop10.length === 0">
              <td colspan="5">
                <div class="empty">No data yet. Be the first to upload!</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ========== Match Ranking ========== -->
    <section class="mb-5 section-card" aria-labelledby="match-title">
      <header class="section-head">
        <div>
          <h2 id="match-title" class="section-title">Match Ranking</h2>
          <p class="section-sub">Default ranking: Wins. Switch to Total Matches. Top 10 only.</p>
        </div>
        <div class="section-actions">
          <input
            v-model.trim="matchSearch"
            type="search"
            class="form-control control-sm"
            placeholder="Search by name/nickname"
          />
          <button class="btn btn-outline-secondary control-sm" @click="exportMatchCsv">
            Export CSV
          </button>
        </div>
      </header>

      <!-- Filters -->
      <div class="filter-bar">
        <div class="row g-3 align-items-end">
          <div class="col-12 col-md-4">
            <label class="form-label">Gender</label>
            <select v-model="matchGender" class="form-select">
              <option value="all">All</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="col-12 col-md-8">
            <label class="form-label d-block">Ranking Metric</label>
            <div class="btn-group metric-group" role="group" aria-label="rank-metric">
              <input
                type="radio"
                class="btn-check"
                id="m-rank-wins"
                value="wins"
                v-model="matchRankBy"
              />
              <label
                class="btn btn-switch"
                :class="{ active: matchRankBy === 'wins' }"
                for="m-rank-wins"
                >Wins</label
              >

              <input
                type="radio"
                class="btn-check"
                id="m-rank-total"
                value="total"
                v-model="matchRankBy"
              />
              <label
                class="btn btn-switch"
                :class="{ active: matchRankBy === 'total' }"
                for="m-rank-total"
                >Total Matches</label
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="table-wrap">
        <table class="table align-middle table-modern">
          <thead>
            <tr>
              <th class="w-rank">Rank</th>
              <th>Name/Nickname</th>
              <th class="w-gender">Gender</th>
              <th class="w-num">Wins</th>
              <th class="w-num">Total Matches</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, idx) in matchTop10" :key="`m-${r.userId}`">
              <td>
                <span class="rank-pill" :data-rank="idx + 1">{{ rankBadge(idx + 1) }}</span>
              </td>
              <td>{{ r.name }}</td>
              <td class="text-capitalize">{{ labelGender(r.gender) }}</td>
              <td class="mono">{{ r.wins }}</td>
              <td class="mono">{{ r.totalMatches }}</td>
            </tr>
            <tr v-if="matchTop10.length === 0">
              <td colspan="5">
                <div class="empty">No data yet. Be the first to upload!</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ========== Upload Section ========== -->
    <section class="section-card" aria-labelledby="upload-title">
      <header class="section-head solo">
        <h2 id="upload-title" class="section-title">Upload / Replace My Data</h2>
        <p class="section-sub">Login required · One record per user per board</p>
      </header>
      <div class="row g-4">
        <!-- Fitness Upload -->
        <div class="col-12 col-lg-6">
          <div class="card soft-card h-100">
            <div class="card-body">
              <h3 class="h6 mb-1">Fitness Data</h3>
              <p class="text-muted small mb-3">
                Required: Name/Nickname, Gender, Duration (min), Rally Record
              </p>

              <form @submit.prevent="submitFitness">
                <div class="row g-3">
                  <div class="col-12">
                    <label class="form-label">Name/Nickname</label>
                    <input
                      v-model.trim="fitnessForm.name"
                      type="text"
                      required
                      class="form-control"
                      maxlength="50"
                    />
                  </div>
                  <div class="col-6">
                    <label class="form-label">Gender</label>
                    <select v-model="fitnessForm.gender" class="form-select" required>
                      <option value="" disabled>Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div class="col-6">
                    <label class="form-label">Duration (min)</label>
                    <input
                      v-model.number="fitnessForm.durationMinutes"
                      type="number"
                      min="0"
                      step="1"
                      required
                      class="form-control"
                    />
                  </div>
                  <div class="col-12">
                    <label class="form-label">Rally Record</label>
                    <input
                      v-model.number="fitnessForm.rallyRecord"
                      type="number"
                      min="0"
                      step="1"
                      required
                      class="form-control"
                    />
                  </div>
                </div>
                <div class="mt-3 d-flex gap-2">
                  <button :disabled="uploadingFitness" class="btn btn-primary" type="submit">
                    <span v-if="!uploadingFitness">Upload / Replace</span>
                    <span v-else>Uploading…</span>
                  </button>
                  <button class="btn btn-outline-secondary" type="button" @click="resetFitnessForm">
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Match Upload -->
        <div class="col-12 col-lg-6">
          <div class="card soft-card h-100">
            <div class="card-body">
              <h3 class="h6 mb-1">Match Data</h3>
              <p class="text-muted small mb-3">
                Required: Name/Nickname, Gender, Wins, Total Matches
              </p>

              <form @submit.prevent="submitMatch">
                <div class="row g-3">
                  <div class="col-12">
                    <label class="form-label">Name/Nickname</label>
                    <input
                      v-model.trim="matchForm.name"
                      type="text"
                      required
                      class="form-control"
                      maxlength="50"
                    />
                  </div>
                  <div class="col-6">
                    <label class="form-label">Gender</label>
                    <select v-model="matchForm.gender" class="form-select" required>
                      <option value="" disabled>Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div class="col-3">
                    <label class="form-label">Wins</label>
                    <input
                      v-model.number="matchForm.wins"
                      type="number"
                      min="0"
                      step="1"
                      required
                      class="form-control"
                    />
                  </div>
                  <div class="col-3">
                    <label class="form-label">Total Matches</label>
                    <input
                      v-model.number="matchForm.totalMatches"
                      type="number"
                      min="0"
                      step="1"
                      required
                      class="form-control"
                    />
                  </div>
                </div>
                <div class="mt-3 d-flex gap-2">
                  <button :disabled="uploadingMatch" class="btn btn-success" type="submit">
                    <span v-if="!uploadingMatch">Upload / Replace</span>
                    <span v-else>Uploading…</span>
                  </button>
                  <button class="btn btn-outline-secondary" type="button" @click="resetMatchForm">
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <p class="text-muted small mt-3">
        Login required. Each user can have only one record per board. Re-uploading will replace the
        old data.
      </p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { auth, db } from '@/firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, doc, onSnapshot, query, setDoc, Timestamp } from 'firebase/firestore'

const currentUser = ref(null)
const unsubAuth = ref(null)

onMounted(() => {
  unsubAuth.value = onAuthStateChanged(auth, (u) => {
    currentUser.value = u || null
  })
})

onBeforeUnmount(() => {
  if (unsubAuth.value) unsubAuth.value()
  if (unsubFitness.value) unsubFitness.value()
  if (unsubMatch.value) unsubMatch.value()
})

// Collections
const fitnessCol = collection(db, 'fitnessRankings')
const matchCol = collection(db, 'matchRankings')

const fitnessRaw = ref([])
const matchRaw = ref([])

const unsubFitness = ref(null)
const unsubMatch = ref(null)

function startSnapshots() {
  unsubFitness.value = onSnapshot(query(fitnessCol), (snap) => {
    fitnessRaw.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  })
  unsubMatch.value = onSnapshot(query(matchCol), (snap) => {
    matchRaw.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  })
}
startSnapshots()

// -------- Fitness Ranking --------
const fitnessSearch = ref('')
const fitnessGender = ref('all')
const fitnessRankBy = ref('duration')

const fitnessFiltered = computed(() => {
  const kw = fitnessSearch.value.trim().toLowerCase()
  return fitnessRaw.value
    .filter((r) => !!r && typeof r === 'object')
    .map((r) => ({
      userId: r.userId || r.id,
      name: r.name || '',
      gender: r.gender || 'other',
      durationMinutes: Number(r.durationMinutes ?? 0),
      rallyRecord: Number(r.rallyRecord ?? 0),
      updatedAt: r.updatedAt || null,
    }))
    .filter((r) => (kw ? r.name.toLowerCase().includes(kw) : true))
    .filter((r) => (fitnessGender.value === 'all' ? true : r.gender === fitnessGender.value))
})

const fitnessSorted = computed(() => {
  const by = fitnessRankBy.value
  const key = by === 'duration' ? 'durationMinutes' : 'rallyRecord'
  return [...fitnessFiltered.value].sort((a, b) => {
    if (b[key] !== a[key]) return b[key] - a[key]
    const ta = a.updatedAt && a.updatedAt.toMillis ? a.updatedAt.toMillis() : 0
    const tb = b.updatedAt && b.updatedAt.toMillis ? b.updatedAt.toMillis() : 0
    if (tb !== ta) return tb - ta
    return a.name.localeCompare(b.name)
  })
})

const fitnessTop10 = computed(() => fitnessSorted.value.slice(0, 10))

// -------- Match Ranking --------
const matchSearch = ref('')
const matchGender = ref('all')
const matchRankBy = ref('wins')

const matchFiltered = computed(() => {
  const kw = matchSearch.value.trim().toLowerCase()
  return matchRaw.value
    .filter((r) => !!r && typeof r === 'object')
    .map((r) => ({
      userId: r.userId || r.id,
      name: r.name || '',
      gender: r.gender || 'other',
      wins: Number(r.wins ?? 0),
      totalMatches: Number(r.totalMatches ?? 0),
      updatedAt: r.updatedAt || null,
    }))
    .filter((r) => (kw ? r.name.toLowerCase().includes(kw) : true))
    .filter((r) => (matchGender.value === 'all' ? true : r.gender === matchGender.value))
})

const matchSorted = computed(() => {
  const by = matchRankBy.value
  const key = by === 'wins' ? 'wins' : 'totalMatches'
  return [...matchFiltered.value].sort((a, b) => {
    if (b[key] !== a[key]) return b[key] - a[key]
    const ta = a.updatedAt && a.updatedAt.toMillis ? a.updatedAt.toMillis() : 0
    const tb = b.updatedAt && b.updatedAt.toMillis ? b.updatedAt.toMillis() : 0
    if (tb !== ta) return tb - ta
    return a.name.localeCompare(b.name)
  })
})

const matchTop10 = computed(() => matchSorted.value.slice(0, 10))

// -------- Upload (one per user, replace) --------
const uploadingFitness = ref(false)
const uploadingMatch = ref(false)

const fitnessForm = ref({
  name: '',
  gender: '',
  durationMinutes: undefined,
  rallyRecord: undefined,
})
const matchForm = ref({ name: '', gender: '', wins: undefined, totalMatches: undefined })

function ensureAuthed() {
  if (!currentUser.value) {
    alert('Please login first.')
    return false
  }
  return true
}

function sanitizeName(s) {
  return String(s || '')
    .trim()
    .slice(0, 50)
}

async function submitFitness() {
  if (!ensureAuthed()) return
  const uid = currentUser.value.uid
  const { name, gender, durationMinutes, rallyRecord } = fitnessForm.value
  if (!name || !gender || durationMinutes == null || rallyRecord == null) {
    alert('Please complete all required fields.')
    return
  }
  const payload = {
    userId: uid,
    name: sanitizeName(name),
    gender,
    durationMinutes: Number(durationMinutes),
    rallyRecord: Number(rallyRecord),
    updatedAt: Timestamp.now(),
  }
  try {
    uploadingFitness.value = true
    await setDoc(doc(fitnessCol, uid), payload, { merge: false })
    alert('Fitness data uploaded and replaced.')
  } catch (e) {
    console.error(e)
    alert('Upload failed. Please retry.')
  } finally {
    uploadingFitness.value = false
  }
}

async function submitMatch() {
  if (!ensureAuthed()) return
  const uid = currentUser.value.uid
  const { name, gender, wins, totalMatches } = matchForm.value
  if (!name || !gender || wins == null || totalMatches == null) {
    alert('Please complete all required fields.')
    return
  }
  if (Number(totalMatches) < Number(wins)) {
    alert('Total Matches cannot be less than Wins.')
    return
  }
  const payload = {
    userId: uid,
    name: sanitizeName(name),
    gender,
    wins: Number(wins),
    totalMatches: Number(totalMatches),
    updatedAt: Timestamp.now(),
  }
  try {
    uploadingMatch.value = true
    await setDoc(doc(matchCol, uid), payload, { merge: false })
    alert('Match data uploaded and replaced.')
  } catch (e) {
    console.error(e)
    alert('Upload failed. Please retry.')
  } finally {
    uploadingMatch.value = false
  }
}

function resetFitnessForm() {
  fitnessForm.value = { name: '', gender: '', durationMinutes: undefined, rallyRecord: undefined }
}
function resetMatchForm() {
  matchForm.value = { name: '', gender: '', wins: undefined, totalMatches: undefined }
}

// CSV export
function toCsv(rows, headers) {
  const esc = (v) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const head = headers.map(esc).join(',')
  const body = rows.map((r) => headers.map((h) => esc(r[h])).join(','))
  return [head, ...body].join('\n')
}
function download(filename, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
function exportFitnessCsv() {
  const headers = ['rank', 'name', 'gender', 'durationMinutes', 'rallyRecord']
  const rows = fitnessTop10.value.map((r, i) => ({
    rank: i + 1,
    name: r.name,
    gender: labelGender(r.gender),
    durationMinutes: r.durationMinutes,
    rallyRecord: r.rallyRecord,
  }))
  download('fitness_top10.csv', toCsv(rows, headers))
}
function exportMatchCsv() {
  const headers = ['rank', 'name', 'gender', 'wins', 'totalMatches']
  const rows = matchTop10.value.map((r, i) => ({
    rank: i + 1,
    name: r.name,
    gender: labelGender(r.gender),
    wins: r.wins,
    totalMatches: r.totalMatches,
  }))
  download('match_top10.csv', toCsv(rows, headers))
}

// helpers
function labelGender(g) {
  if (g === 'male') return 'Male'
  if (g === 'female') return 'Female'
  return 'Other'
}

function rankBadge(rank) {
  if (rank === 1) return '🥇 1'
  if (rank === 2) return '🥈 2'
  if (rank === 3) return '🥉 3'
  return String(rank)
}
</script>

<style scoped>
/* ===== CSS Variables for quick theme tweaks ===== */
:root {
  --surface: #ffffff;
  --soft: #f7f9fc;
  --border: #e8eef6;
  --text: #1f2937;
  --muted: #6b7280;
  --brand: #2563eb; /* blue-600 */
  --brand-2: #0ea5e9; /* sky-500 */
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--text);
}

.section-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 1rem;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 12px 24px -12px rgba(37, 99, 235, 0.08);
}

.section-head {
  display: flex;
  gap: 1rem;
  align-items: end;
  justify-content: space-between;
  padding: 1rem 1rem 0.5rem 1rem;
  background: linear-gradient(180deg, rgba(37, 99, 235, 0.06), transparent);
  border-radius: 1rem 1rem 0 0;
}
.section-head.solo {
  background: none;
  padding-bottom: 0.25rem;
}
.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
  color: var(--text);
}
.section-sub {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
}
.section-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.filter-bar {
  padding: 1rem;
  border-top: 1px dashed var(--border);
}

.control-sm {
  max-width: 260px;
}

/* Switch-like metric buttons */
.metric-group .btn-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem 0.9rem;
  font-weight: 700;
  letter-spacing: 0.1px;
  border-radius: 999px;
  border: 2px solid var(--border);
  background: transparent !important; /* transparent center */
  color: var(--text);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.1s ease;
  box-shadow: none; /* remove white glow */
}
.metric-group .btn-switch:hover {
  border-color: var(--brand);
}
.metric-group .btn-switch.active {
  border-color: var(--brand);
  color: var(--brand);
  background: transparent !important; /* keep transparent when active */
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); /* edge glow only */
}

/* Table aesthetics */
.table-wrap {
  padding: 0 1rem 1rem 1rem;
}
.table-modern {
  border-collapse: separate;
  border-spacing: 0 8px;
}
.table-modern thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #fff;
  border: 0;
  font-size: 0.85rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.table-modern tbody tr {
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease;
}
.table-modern tbody tr:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px -12px rgba(0, 0, 0, 0.2);
}
.table-modern tbody td {
  background: #fff;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.table-modern tbody td:first-child {
  border-left: 1px solid var(--border);
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
}
.table-modern tbody td:last-child {
  border-right: 1px solid var(--border);
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
}

.w-rank {
  width: 84px;
}
.w-gender {
  width: 120px;
}
.w-num {
  width: 160px;
  text-align: right;
}
.mono {
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.rank-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  background: var(--soft);
  border: 1px solid var(--border);
  font-weight: 700;
}
.rank-pill[data-rank='1'] {
  background: #fff7ed;
  border-color: #fdba74;
}
.rank-pill[data-rank='2'] {
  background: #eff6ff;
  border-color: #93c5fd;
}
.rank-pill[data-rank='3'] {
  background: #f0fdf4;
  border-color: #86efac;
}

.empty {
  text-align: center;
  color: var(--muted);
  padding: 0.75rem;
  border: 1px dashed var(--border);
  border-radius: 0.75rem;
  background: var(--soft);
}

/* Upload cards */
.soft-card {
  border: 1px solid var(--border);
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 6px 24px -16px rgba(2, 6, 23, 0.15);
}
.soft-card .form-control,
.soft-card .form-select {
  border-radius: 0.6rem;
}

/* Small screens polish */
@media (max-width: 576px) {
  .section-head {
    align-items: start;
  }
  .section-actions {
    width: 100%;
  }
  .control-sm {
    width: 100%;
    max-width: none;
  }
  .w-num {
    width: 120px;
  }
}
.metric-group {
  display: inline-flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
/* Ensure radio inputs used as button toggles are visually hidden (Bootstrap-like) */
.btn-check {
  position: absolute;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 1px;
  height: 1px;
  margin: 0;
  padding: 0;
  border: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
