/* eslint-env node */
import * as functions from 'firebase-functions'
import admin from 'firebase-admin'

admin.initializeApp()
const db = admin.firestore()

// 固定 4 个时段（与前端 SLOT_DEFS 保持一致）
const SLOT_DEFS = [
  { startH: 8, endH: 10 }, // 08:00–10:00
  { startH: 10, endH: 12 }, // 10:00–12:00
  { startH: 13, endH: 15 }, // 13:00–15:00
  { startH: 15, endH: 17 }, // 15:00–17:00
]

// 生成确定性文档 ID：避免并发重叠
function bookingIdOf(courtId, day, slotIndex) {
  return `${courtId}_${day}_${slotIndex}`
}

// 校验输入
function assertBookingPayload(data) {
  const { courtId, day, slotIndex, startISO, endISO } = data || {}
  if (!courtId || !day || typeof slotIndex !== 'number') {
    throw new functions.https.HttpsError('invalid-argument', '缺少字段 courtId/day/slotIndex')
  }
  if (slotIndex < 0 || slotIndex >= SLOT_DEFS.length) {
    throw new functions.https.HttpsError('invalid-argument', 'slotIndex 无效')
  }
  const start = new Date(startISO)
  const end = new Date(endISO)
  if (!isFinite(start.getTime()) || !isFinite(end.getTime()) || end <= start) {
    throw new functions.https.HttpsError('invalid-argument', '时间范围无效')
  }
  // 避免时区细节引发误报，只校验两小时长度
  const minutes = Math.round((end - start) / 60000)
  if (minutes !== 120) {
    throw new functions.https.HttpsError('invalid-argument', '时段必须为两小时')
  }
  return { start, end }
}

// 创建预约
export const createBooking = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid
  if (!uid) throw new functions.https.HttpsError('unauthenticated', '请先登录')

  const { courtId, day, slotIndex } = data || {}
  const { start, end } = assertBookingPayload(data)

  const id = bookingIdOf(courtId, day, slotIndex)
  const ref = db.collection('bookings').doc(id)

  try {
    await ref.create({
      courtId,
      day,
      slotIndex,
      start: admin.firestore.Timestamp.fromDate(start),
      end: admin.firestore.Timestamp.fromDate(end),
      userId: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    return { id }
  } catch (e) {
    const msg = e?.message || String(e)
    if (/ALREADY_EXISTS/i.test(msg) || e?.code === 6) {
      throw new functions.https.HttpsError('already-exists', '该时段已被占用')
    }
    throw new functions.https.HttpsError('unknown', msg)
  }
})

// 按周读取预约
export const listBookings = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid
  if (!uid) throw new functions.https.HttpsError('unauthenticated', '请先登录')

  const { courtId, weekStartISO, weekEndISO } = data || {}
  if (!courtId || !weekStartISO || !weekEndISO) {
    throw new functions.https.HttpsError('invalid-argument', '缺少参数')
  }

  const ws = new Date(weekStartISO)
  const we = new Date(weekEndISO)
  if (!isFinite(ws.getTime()) || !isFinite(we.getTime()) || we <= ws) {
    throw new functions.https.HttpsError('invalid-argument', '时间范围无效')
  }

  // 需要复合索引：courtId + start(ASC)
  const snap = await db
    .collection('bookings')
    .where('courtId', '==', courtId)
    .where('start', '>=', admin.firestore.Timestamp.fromDate(ws))
    .where('start', '<', admin.firestore.Timestamp.fromDate(we))
    .get()

  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return { rows }
})

// 取消预约（仅预约本人）
export const deleteBooking = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid
  if (!uid) throw new functions.https.HttpsError('unauthenticated', '请先登录')

  const { bookingId } = data || {}
  if (!bookingId) throw new functions.https.HttpsError('invalid-argument', '缺少 bookingId')

  const ref = db.collection('bookings').doc(bookingId)
  const snap = await ref.get()
  if (!snap.exists) {
    throw new functions.https.HttpsError('not-found', '预约不存在')
  }

  const row = snap.data()
  if (row.userId !== uid) {
    throw new functions.https.HttpsError('permission-denied', '不能取消他人的预约')
  }

  await ref.delete()
  return { ok: true }
})
