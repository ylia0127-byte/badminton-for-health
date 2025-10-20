/* eslint-env node */
/**
 * Badminton Booking – HTTP APIs (onRequest + ID Token)
 * - firebase-functions v2
 * - Unified outer CORS handler + Promise-based response
 * - Three endpoints:
 *   POST /createBooking
 *   POST /listBookings
 *   POST /deleteBooking
 */
import { onRequest } from 'firebase-functions/v2/https'
import admin from 'firebase-admin'
import corsLib from 'cors'

admin.initializeApp()
const db = admin.firestore()

// Allow all origins; for production, replace with your domain whitelist.
const cors = corsLib({ origin: true })

/**
 * Wrapper for onRequest handlers:
 * - Handles CORS and OPTIONS preflight
 * - Wraps in a Promise to ensure response completion
 * - Catches and logs uncaught exceptions to prevent hanging
 */
function wrap(handler) {
  return (req, res) =>
    new Promise((resolve) => {
      cors(req, res, async () => {
        try {
          if (req.method === 'OPTIONS') {
            res.status(204).send()
            return resolve()
          }
          await handler(req, res)
        } catch (e) {
          // Catch any unhandled exceptions to avoid hanging
          console.error('UNCAUGHT:', e)
          try {
            res.status(500).json({ error: e?.message || String(e) })
          } catch {
            // ignore double-send errors
          }
        } finally {
          resolve()
        }
      })
    })
}

// Fixed 4 time slots (must match frontend definition)
const SLOT_DEFS = [
  { startH: 8, endH: 10 },
  { startH: 10, endH: 12 },
  { startH: 13, endH: 15 },
  { startH: 15, endH: 17 },
]

// Helper: unified JSON response
function send(res, code, payload) {
  res.status(code).json(payload)
}

// Validate Authorization: Bearer <ID_TOKEN> and return uid
async function requireUid(req, res) {
  const auth = req.headers.authorization || ''
  const m = auth.match(/^Bearer\s+(.+)$/i)
  if (!m) {
    send(res, 401, { error: 'unauthenticated: missing Authorization Bearer token' })
    throw new Error('unauthenticated')
  }
  try {
    const decoded = await admin.auth().verifyIdToken(m[1])
    return decoded.uid
  } catch (e) {
    send(res, 401, { error: 'unauthenticated: invalid token' })
    throw new Error('unauthenticated')
  }
}

// Deterministic booking document ID to prevent duplicates
function bookingIdOf(courtId, day, slotIndex) {
  return `${courtId}_${day}_${slotIndex}`
}

// Validate request body for createBooking
function assertCreatePayload(body) {
  const { courtId, day, slotIndex, startISO, endISO } = body || {}
  if (!courtId || !day || typeof slotIndex !== 'number' || !startISO || !endISO) {
    return 'missing fields: courtId/day/slotIndex/startISO/endISO'
  }
  if (slotIndex < 0 || slotIndex >= SLOT_DEFS.length) return 'slotIndex out of range'

  const start = new Date(startISO)
  const end = new Date(endISO)
  if (!isFinite(start.getTime()) || !isFinite(end.getTime()) || end <= start) {
    return 'invalid time'
  }
  const minutes = Math.round((end - start) / 60000)
  if (minutes !== 120) return 'duration must be 120 minutes'

  return { courtId, day, slotIndex, start, end }
}

/* ----------------------------- API Handlers ---------------------------------- */

// POST /createBooking
export const createBooking = onRequest(
  wrap(async (req, res) => {
    if (req.method !== 'POST') return send(res, 405, { error: 'method not allowed' })

    const uid = await requireUid(req, res) // 401 handled if invalid

    const parsed = assertCreatePayload(req.body)
    if (typeof parsed === 'string') return send(res, 400, { error: parsed })

    const { courtId, day, slotIndex, start, end } = parsed
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
      return send(res, 200, { id })
    } catch (e) {
      const msg = e?.message || String(e)
      // Firestore create() conflict: ALREADY_EXISTS (code 6)
      if (/ALREADY_EXISTS/i.test(msg) || e?.code === 6) {
        return send(res, 409, { error: 'slot already booked' })
      }
      console.error('createBooking error:', e)
      return send(res, 500, { error: msg })
    }
  }),
)

// POST /listBookings
export const listBookings = onRequest(
  wrap(async (req, res) => {
    if (req.method !== 'POST') return send(res, 405, { error: 'method not allowed' })
    await requireUid(req, res)

    const { courtId, weekStartMS, weekEndMS } = req.body || {}
    if (!courtId || !weekStartMS || !weekEndMS) {
      return send(res, 400, { error: 'missing courtId/weekStartMS/weekEndMS' })
    }
    const ws = new Date(Number(weekStartMS))
    const we = new Date(Number(weekEndMS))
    if (!isFinite(ws.getTime()) || !isFinite(we.getTime()) || we <= ws) {
      return send(res, 400, { error: 'invalid range' })
    }

    try {
      const snap = await db
        .collection('bookings')
        .where('courtId', '==', courtId)
        .where('start', '>=', admin.firestore.Timestamp.fromDate(ws))
        .where('start', '<', admin.firestore.Timestamp.fromDate(we))
        .get()

      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      return send(res, 200, { rows })
    } catch (e) {
      console.error('listBookings error:', e)
      return send(res, 500, { error: e?.message || String(e) })
    }
  }),
)

// POST /deleteBooking
export const deleteBooking = onRequest(
  wrap(async (req, res) => {
    if (req.method !== 'POST') return send(res, 405, { error: 'method not allowed' })

    const uid = await requireUid(req, res)

    const { bookingId } = req.body || {}
    if (!bookingId) return send(res, 400, { error: 'missing bookingId' })

    try {
      const ref = db.collection('bookings').doc(bookingId)
      const snap = await ref.get()
      if (!snap.exists) return send(res, 404, { error: 'booking not found' })

      const row = snap.data()
      if (row.userId !== uid) return send(res, 403, { error: 'not your booking' })

      await ref.delete()
      return send(res, 200, { ok: true })
    } catch (e) {
      console.error('deleteBooking error:', e)
      return send(res, 500, { error: e?.message || String(e) })
    }
  }),
)
