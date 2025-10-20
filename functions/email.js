/* eslint-env node */
/* global process, Buffer */

import { onDocumentCreated, onDocumentDeleted } from 'firebase-functions/v2/firestore'
import { defineSecret } from 'firebase-functions/params'
import logger from 'firebase-functions/logger'
import admin from 'firebase-admin'
import axios from 'axios'

if (!admin.apps.length) admin.initializeApp()

//  Secret configuration + ordinary env vars
const BREVO_API_KEY = defineSecret('BREVO_API_KEY') // Secret Manager injection

const MAIL_FROM = process.env.MAIL_FROM || 'ylia0127@student.monash.edu'
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || 'Badminton for Health'
const MAIL_SUBJECT_CREATED = process.env.MAIL_SUBJECT_CREATED || 'Your court booking is confirmed'
const MAIL_SUBJECT_CANCELLED =
  process.env.MAIL_SUBJECT_CANCELLED || 'Your court booking has been cancelled'

//  Utility functions
function safe(v, f = '—') {
  return v == null ? f : String(v)
}

function fmt(iso) {
  try {
    const d = new Date(iso)
    return `${d.toISOString().slice(0, 16).replace('T', ' ')} (UTC)`
  } catch {
    return safe(iso)
  }
}

function buildTxt({ action, bookingId, data }) {
  return [
    `Action: ${action}`,
    `Booking ID: ${safe(bookingId)}`,
    `Court: ${safe(data?.courtId)}`,
    `Day: ${safe(data?.day)}`,
    `Slot Index: ${safe(data?.slotIndex)}`,
    `Start: ${fmt(data?.startISO)}`,
    `End: ${fmt(data?.endISO)}`,
    `User ID: ${safe(data?.userId)}`,
    `Generated At: ${new Date().toISOString()}`,
  ].join('\n')
}

async function resolveRecipientEmail({ data }) {
  if (data?.email) return data.email
  if (data?.userId) {
    try {
      const u = await admin.auth().getUser(String(data.userId))
      return u?.email || null
    } catch (e) {
      logger.warn('Auth lookup failed for userId:', data?.userId, e)
    }
  }
  return null
}

//  Send email via Brevo API (with TXT attachment)
async function sendEmail({ to, subject, txtContent, eventId, apiKey }) {
  const url = 'https://api.brevo.com/v3/smtp/email'
  const payload = {
    sender: { name: MAIL_FROM_NAME, email: MAIL_FROM },
    to: [{ email: to }],
    subject,

    htmlContent: `<pre>${txtContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
    textContent: txtContent,

    attachment: [
      {
        content: Buffer.from(txtContent, 'utf8').toString('base64'),
        name: 'booking.txt',
        contentType: 'text/plain',
      },
    ],
    headers: { 'X-Cloud-Event-Id': eventId },
  }

  const headers = {
    'api-key': apiKey,
    'Content-Type': 'application/json',
  }

  try {
    const res = await axios.post(url, payload, { headers })
    logger.info('Brevo response:', res.data)
    return res.status
  } catch (e) {
    logger.error('Brevo send error:', e.response?.data || e.message)
    throw e
  }
}

//  Firestore triggers
export const onBookingCreated = onDocumentCreated(
  {
    region: 'us-central1',
    document: 'bookings/{bookingId}',
    secrets: [BREVO_API_KEY],
  },
  async (event) => {
    const bookingId = event.params.bookingId
    const data = event.data?.data()
    if (!data) return logger.error('No booking data on create')

    const to = await resolveRecipientEmail({ data })
    if (!to) return logger.warn('No recipient email for booking:', bookingId)

    const txt = buildTxt({ action: 'CREATED', bookingId, data })
    try {
      const status = await sendEmail({
        to,
        subject: MAIL_SUBJECT_CREATED,
        txtContent: txt,
        eventId: event.id,
        apiKey: BREVO_API_KEY.value(),
      })
      logger.info('Email sent (created):', { bookingId, to, status })
    } catch (e) {
      logger.error('Brevo send error (create):', e)
    }
  },
)

export const onBookingDeleted = onDocumentDeleted(
  {
    region: 'us-central1',
    document: 'bookings/{bookingId}',
    secrets: [BREVO_API_KEY],
  },
  async (event) => {
    const bookingId = event.params.bookingId
    const data = event.data?.data()
    if (!data) return logger.warn('No booking data on delete')

    const to = await resolveRecipientEmail({ data })
    if (!to) return logger.warn('No recipient email for deleted booking:', bookingId)

    const txt = buildTxt({ action: 'CANCELLED', bookingId, data })
    try {
      const status = await sendEmail({
        to,
        subject: MAIL_SUBJECT_CANCELLED,
        txtContent: txt,
        eventId: event.id,
        apiKey: BREVO_API_KEY.value(),
      })
      logger.info('Email sent (cancelled):', { bookingId, to, status })
    } catch (e) {
      logger.error('Brevo send error (delete):', e)
    }
  },
)
