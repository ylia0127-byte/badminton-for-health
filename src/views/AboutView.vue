<template>
  <div class="container py-6">
    <!-- About Us -->
    <section class="content max-w-3xl mx-auto" aria-labelledby="about-title">
      <h1 id="about-title" class="mb-3">About Us</h1>
      <p>
        <strong>Badminton for Health</strong> is a not-for-profit initiative that uses simple, smart
        technology to help people move more and feel better. We make it easier to discover
        badminton, book courts without clashes, and join community health activities—all in one
        place.
      </p>
      <p>
        We partner with local councils, schools, and health organisations to improve court
        utilisation and reduce booking conflicts, so more people can play with less friction. Beyond
        scheduling, we communicate the health benefits of badminton—supporting physical fitness,
        mental balance, and social connection.
      </p>
      <p>
        Our platform is inclusive by design: accessible to beginners and regular players alike,
        mobile-friendly, keyboard navigable, and built with WCAG 2.1 AA practices. Everyone deserves
        the chance to move, play, and thrive—technology should make that easier, not harder.
      </p>

      <h2 class="mt-4">Vision</h2>
      <p>
        A community where everyone can easily access badminton facilities, enjoy healthy exercise,
        and experience the joy of shared activity.
      </p>

      <h2 class="mt-4">Mission</h2>
      <ul>
        <li>Promote health and well-being through accessible badminton participation.</li>
        <li>Reduce court booking conflicts and improve venue utilisation with digital tools.</li>
        <li>
          Invite people of all ages to join health events and learn the benefits of active living.
        </li>
        <li>Connect people and communities through the spirit of sport.</li>
      </ul>
    </section>

    <!-- Contact Us -->
    <section class="content max-w-3xl mx-auto mt-10" aria-labelledby="contact-title">
      <h2 id="contact-title" class="mb-3">Contact Us</h2>
      <p class="mb-4">
        Questions, partnerships, or volunteering? Send us a message. You can also attach a file
        (e.g., brochure, proposal). We’ll get back to you via email.
      </p>

      <form @submit.prevent="onSubmit" novalidate aria-describedby="form-status">
        <!-- Name -->
        <div class="form-row">
          <label for="name">Full Name</label>
          <input
            id="name"
            type="text"
            v-model.trim="form.name"
            required
            :aria-invalid="errors.name ? 'true' : 'false'"
            :aria-describedby="errors.name ? 'error-name' : undefined"
            autocomplete="name"
          />
          <p v-if="errors.name" id="error-name" class="error">{{ errors.name }}</p>
        </div>

        <!-- Email -->
        <div class="form-row">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            v-model.trim="form.email"
            required
            inputmode="email"
            autocomplete="email"
            :aria-invalid="errors.email ? 'true' : 'false'"
            :aria-describedby="errors.email ? 'error-email' : undefined"
          />
          <p v-if="errors.email" id="error-email" class="error">{{ errors.email }}</p>
        </div>

        <!-- Subject -->
        <div class="form-row">
          <label for="subject">Subject</label>
          <input
            id="subject"
            type="text"
            v-model.trim="form.subject"
            required
            :aria-invalid="errors.subject ? 'true' : 'false'"
            :aria-describedby="errors.subject ? 'error-subject' : undefined"
          />
          <p v-if="errors.subject" id="error-subject" class="error">{{ errors.subject }}</p>
        </div>

        <!-- Message -->
        <div class="form-row">
          <label for="message">Message</label>
          <textarea
            id="message"
            v-model.trim="form.message"
            rows="6"
            required
            :aria-invalid="errors.message ? 'true' : 'false'"
            :aria-describedby="errors.message ? 'error-message' : undefined"
          ></textarea>
          <p v-if="errors.message" id="error-message" class="error">{{ errors.message }}</p>
        </div>

        <!-- Attachment -->
        <div class="form-row">
          <label for="attachment">Attachment (optional)</label>
          <input
            id="attachment"
            type="file"
            @change="onFile"
            :aria-describedby="'attachment-help'"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          />
          <small id="attachment-help" class="help">
            Accepted: PDF, DOC, DOCX, PNG, JPG (max 5 MB).
          </small>
          <p v-if="errors.attachment" class="error">{{ errors.attachment }}</p>
        </div>

        <!-- Consent -->
        <div class="form-row checkbox">
          <input
            id="consent"
            type="checkbox"
            v-model="form.consent"
            :aria-invalid="errors.consent ? 'true' : 'false'"
            :aria-describedby="errors.consent ? 'error-consent' : undefined"
            required
          />
          <label for="consent">I consent to be contacted about my enquiry.</label>
        </div>
        <p v-if="errors.consent" id="error-consent" class="error">{{ errors.consent }}</p>

        <!-- Submit -->
        <div class="actions">
          <button
            class="btn"
            type="submit"
            :disabled="submitting"
            :aria-busy="submitting ? 'true' : 'false'"
          >
            {{ submitting ? 'Sending…' : 'Send Message' }}
          </button>
        </div>

        <!-- Status (aria-live for screen readers) -->
        <p
          id="form-status"
          class="status"
          role="status"
          aria-live="polite"
          :class="{ success: status.type === 'success', error: status.type === 'error' }"
          v-if="status.message"
        >
          {{ status.message }}
        </p>
      </form>

      <!-- Fallback contact -->
      <p class="fallback" v-if="status.type === 'success'">
        Prefer email? Reach us at
        <a href="mailto:hello@badmintonforhealth.example">hello@badmintonforhealth.example</a>
      </p>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import axios from 'axios'

const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
  file: null,
  consent: false,
})

const errors = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
  attachment: '',
  consent: '',
})

const status = reactive({
  type: '', // '', 'success', 'error'
  message: '',
})

const submitting = ref(false)

function validateEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function clearErrors() {
  Object.keys(errors).forEach((k) => (errors[k] = ''))
}

function onFile(e) {
  errors.attachment = ''
  const f = e.target.files?.[0]
  if (!f) {
    form.file = null
    return
  }
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
  ]
  if (!allowed.includes(f.type)) {
    errors.attachment = 'Unsupported file type.'
    e.target.value = ''
    return
  }
  if (f.size > 5 * 1024 * 1024) {
    errors.attachment = 'File exceeds 5 MB.'
    e.target.value = ''
    return
  }
  form.file = f
}

function validate() {
  clearErrors()
  let ok = true
  if (!form.name) {
    errors.name = 'Full name is required.'
    ok = false
  }
  if (!form.email) {
    errors.email = 'Email is required.'
    ok = false
  } else if (!validateEmail(form.email)) {
    errors.email = 'Please enter a valid email address.'
    ok = false
  }
  if (!form.subject) {
    errors.subject = 'Subject is required.'
    ok = false
  }
  if (!form.message) {
    errors.message = 'Message cannot be empty.'
    ok = false
  }
  if (!form.consent) {
    errors.consent = 'Please provide consent to be contacted.'
    ok = false
  }
  return ok
}

/**
 * Submits the contact form to a backend endpoint.
 * Expected backend: an HTTPS endpoint (e.g., Firebase Cloud Functions onRequest)
 * that accepts multipart/form-data with fields: name, email, subject, message, and (optional) file.
 *
 * Configure your endpoint URL via Vite env:
 *   VITE_FUNCTIONS_URL=https://<region>-<project>.cloudfunctions.net
 * Then create a route such as:  POST ${VITE_FUNCTIONS_URL}/sendContactEmail
 */
async function onSubmit() {
  status.type = ''
  status.message = ''
  if (!validate()) return

  submitting.value = true
  try {
    // Try to attach Firebase ID token if available (optional but recommended)
    let idToken = null
    try {
      const authMod = await import('firebase/auth')
      const auth = authMod.getAuth?.()
      if (auth?.currentUser) {
        idToken = await authMod.getIdToken(auth.currentUser, true)
      }
    } catch {
      // Firebase not configured on this page; proceed without token
    }

    const endpoint = 'https://sendcontactemail-edhvttfqwq-ts.a.run.app'

    const data = new FormData()
    data.append('name', form.name)
    data.append('email', form.email)
    data.append('subject', form.subject)
    data.append('message', form.message)
    if (form.file) data.append('attachment', form.file, form.file.name)

    const headers = {}
    if (idToken) headers['Authorization'] = `Bearer ${idToken}`

    await axios.post(endpoint, data, { headers })

    status.type = 'success'
    status.message = 'Your message was sent successfully. We will reply via email.'
    // Reset form (keep consent checked for convenience)
    form.name = ''
    form.email = ''
    form.subject = ''
    form.message = ''
    form.file = null
  } catch (err) {
    status.type = 'error'
    status.message =
      (err?.response?.data?.error && String(err.response.data.error)) ||
      'Message failed to send. Please try again later.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* Layout */
.container {
  padding-inline: 1rem;
}
.max-w-3xl {
  max-width: 56rem;
}
.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
.py-6 {
  padding-block: 2rem;
}
.mt-10 {
  margin-top: 2.5rem;
}
.mt-4 {
  margin-top: 1rem;
}
.mb-3 {
  margin-bottom: 0.75rem;
}
.mb-4 {
  margin-bottom: 1rem;
}

/* Typography */
h1,
h2 {
  line-height: 1.25;
}
h1 {
  font-size: 1.75rem;
}
h2 {
  font-size: 1.25rem;
  margin-top: 1.25rem;
}
p,
li,
small,
label {
  line-height: 1.6;
}

/* Content blocks */
.content {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

/* Form */
form {
  display: grid;
  gap: 1rem;
}
.form-row {
  display: grid;
  gap: 0.375rem;
}
.form-row.checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
label {
  font-weight: 600;
}
input[type='text'],
input[type='email'],
input[type='file'],
textarea {
  width: 100%;
  border: 1px solid #cfcfcf;
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  font: inherit;
}
input:focus,
textarea:focus {
  outline: 3px solid rgba(0, 120, 212, 0.2);
  border-color: #0078d4;
}
.help {
  color: #555;
  font-size: 0.875rem;
}
.error {
  color: #a40000;
  font-size: 0.875rem;
}

/* Buttons */
.actions {
  margin-top: 0.25rem;
}
.btn {
  display: inline-block;
  padding: 0.65rem 1rem;
  border: 1px solid #0b5ed7;
  background: #0d6efd;
  color: #fff;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
}
.btn[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Status messages */
.status {
  margin-top: 0.5rem;
  font-weight: 600;
}
.status.success {
  color: #0a7a2f;
}
.status.error {
  color: #a40000;
}

/* Fallback contact */
.fallback {
  margin-top: 0.75rem;
}
.fallback a {
  color: #0d6efd;
  text-decoration: underline;
}
</style>
