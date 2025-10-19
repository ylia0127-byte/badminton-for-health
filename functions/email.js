// functions/email.js  (ESM)
/* eslint-env node */
/* global Buffer, process */

import { onRequest } from 'firebase-functions/v2/https'
import logger from 'firebase-functions/logger'
import admin from 'firebase-admin'
import Busboy from 'busboy'
import sgMail from '@sendgrid/mail'

if (!admin.apps.length) admin.initializeApp()

function escapeHtml(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    try {
      const busboy = Busboy({
        headers: req.headers,
        limits: { fileSize: 5 * 1024 * 1024 },
      })

      const fields = {}
      let file = null

      busboy.on('field', (name, val) => {
        fields[name] = val
      })

      busboy.on('file', (_name, stream, info) => {
        const { filename, mimeType } = info
        const chunks = []
        stream.on('data', (d) => chunks.push(d))
        stream.on('limit', () => reject(new Error('File too large')))
        stream.on('end', () => {
          file = { buffer: Buffer.concat(chunks), filename, mimeType }
        })
      })

      busboy.on('error', reject)
      busboy.on('finish', () => resolve({ fields, file }))

      // ✅ 关键：在 Gen2/HTTP onRequest 中优先使用 rawBody
      if (req.rawBody && req.rawBody.length) {
        busboy.end(req.rawBody)
      } else {
        // 兼容本地或其他环境
        req.pipe(busboy)
      }
    } catch (e) {
      reject(e)
    }
  })
}

export const sendContactEmail = onRequest(
  {
    region: 'australia-southeast1',
    cors: true,
    secrets: ['SENDGRID_API_KEY', 'CONTACT_INBOX', 'MAIL_FROM'],
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (req, res) => {
    if (req.method === 'OPTIONS') return res.status(204).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
    try {
      const { fields, file } = await parseMultipart(req)
      const { name, email, subject, message } = fields || {}
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'Missing required fields.' })
      }

      sgMail.setApiKey(process.env.SENDGRID_API_KEY)
      const to = process.env.CONTACT_INBOX || 'admin@your-nfp.org'
      const from = process.env.MAIL_FROM || 'no-reply@your-nfp.org'

      const msg = {
        to,
        from,
        replyTo: email,
        subject: `[Contact] ${subject}`,
        text: `From: ${name} <${email}>\n\n${message}`,
        html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
               <p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
        attachments:
          file && file.buffer
            ? [
                {
                  content: file.buffer.toString('base64'),
                  filename: file.filename,
                  type: file.mimeType || 'application/octet-stream',
                  disposition: 'attachment',
                },
              ]
            : undefined,
      }

      await sgMail.send(msg)
      return res.json({ ok: true })
    } catch (err) {
      logger.error('sendContactEmail failed:', err)
      return res.status(500).json({ error: 'Failed to send email.' })
    }
  },
)
