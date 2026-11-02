import {
  DUMMY_ANNOUNCEMENTS,
  DUMMY_LOCATION_SUGGESTIONS,
  DUMMY_PASSWORD_VALUE,
  DUMMY_QUEUE,
  DUMMY_USERS,
} from './dummy-data'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const APP_KEY = process.env.NEXT_PUBLIC_DOSWALL_APP_KEY || 'DOEGUSAPPACCESSCORS'

// Use the backend by default; client-side dummy data is opt-in for local demos.
export const USE_DUMMY = process.env.NEXT_PUBLIC_USE_DUMMY?.trim().toLowerCase() === 'true'

// ─── Shared types ─────────────────────────────────────────────────────────────

export type DoswallUser = {
  user_id?: string | number
  email?: string
  password?: string
  name?: string
  role?: 'user' | 'admin' | 'superadmin' | string
  status?: number
  geotag?: string
  notes?: string
  last_update?: string
  created_at?: string
  token?: string
  [key: string]: unknown
}

export type LoginResult = {
  token?: string
  user?: DoswallUser
  data?: DoswallUser
  [key: string]: unknown
}

export type Announcement = {
  announcement_id?: string | number
  title?: string
  content?: string
  user_id?: string | number
  created_at?: string
  creator_name?: string
  [key: string]: unknown
}

export type QueueItem = {
  order?: number
  duration?: string
  announcement_id?: string | number
  created_at?: string
  title?: string
  content?: string
  [key: string]: unknown
}

export type LocationSuggestion = {
  name: string
  distance: number
  [key: string]: unknown
}

// ─── Core request (token always in BODY per PRD FR-1.2) ──────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.error || payload?.message || 'Request failed')
  return payload as T
}

// Helper: simulates async API delay
function dummyResolve<T>(data: T, ms = 200): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(data), ms))
}

function findDummyUserByEmail(email: string) {
  const normalized = String(email || '').trim().toLowerCase()
  return DUMMY_USERS.find(user => String(user.email || '').trim().toLowerCase() === normalized)
}

function findDummyUserById(userId: string | number) {
  return DUMMY_USERS.find(user => String(user.user_id) === String(userId))
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── API FUNCTIONS ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Health ───────────────────────────────────────────────────────────────────

export function checkBackend() {
  if (USE_DUMMY) return dummyResolve({ success: true, server_status: 'online (dummy)', timestamp: new Date().toISOString() })
  return request<{ success: boolean; server_status: string; timestamp?: string }>('/health')
}

export function getApiUrl() { return API_URL }

// ─── Auth / Session ───────────────────────────────────────────────────────────

export function login(email: string, password: string) {
  if (USE_DUMMY) {
    const user = findDummyUserByEmail(email)
    const credentialsValid = !!user && String(user.password || DUMMY_PASSWORD_VALUE) === String(password)
    if (!credentialsValid) return Promise.reject(new Error('Email atau kata sandi salah.'))
    const { password: _password, ...safeUser } = user
    return dummyResolve<LoginResult>({ user: safeUser })
  }
  return request<LoginResult>(process.env.NEXT_PUBLIC_DOSWALL_LOGIN_PATH || '/appkey/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, appkey: APP_KEY }),
  })
}

export function requestPasswordReset(email: string) {
  if (USE_DUMMY) {
    const user = findDummyUserByEmail(email)
    if (!user) return Promise.reject(new Error('Email tidak ditemukan.'))
    return dummyResolve({ success: true, message: `PIN sent (dummy mode) to ${user.email}.` })
  }
  return request<{ success?: boolean; message?: string }>(
    process.env.NEXT_PUBLIC_DOSWALL_RESET_PATH || '/appkey/password/mailpw',
    { method: 'POST', body: JSON.stringify({ email, appkey: APP_KEY }) },
  )
}

export function checkTokenStatus(userId: string | number, token: string) {
  if (USE_DUMMY) {
    const user = findDummyUserById(userId)
    return dummyResolve({ tokenStatus: !!user && String(user.token || '') === String(token) })
  }
  return request<{ tokenStatus: boolean }>('/appkey/checktokenstatus', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, token, appkey: APP_KEY }),
  })
}

// ─── User status (FR-3) ───────────────────────────────────────────────────────

export function getMyStatus(userId: string | number, token: string) {
  if (USE_DUMMY) {
    const user = DUMMY_USERS.find(u => String(u.user_id) === String(userId))
    return dummyResolve({ data: user })
  }
  return request<{ data?: DoswallUser; user?: DoswallUser }>(`/api/clients/get/${userId}`, {
    method: 'POST',
    body: JSON.stringify({ _id: userId, token, appkey: APP_KEY }),
  })
}

export function updateMyStatus(
  userId: string | number,
  token: string,
  payload: { status?: number; notes?: string; geotag?: string },
) {
  if (USE_DUMMY) {
    const idx = DUMMY_USERS.findIndex(u => String(u.user_id) === String(userId))
    if (idx !== -1) Object.assign(DUMMY_USERS[idx], payload)
    return dummyResolve({ success: true })
  }
  return request<{ success: boolean; message?: string }>('/api/clients/update', {
    method: 'PUT',
    body: JSON.stringify({ _id: userId, token, appkey: APP_KEY, ...payload }),
  })
}

export function getLocationSuggestions(userId: string | number, token: string, lat: number, lng: number) {
  if (USE_DUMMY) return dummyResolve({ data: DUMMY_LOCATION_SUGGESTIONS })
  return request<{ data?: LocationSuggestion[] }>('/api/clients/getlocationlists', {
    method: 'POST',
    body: JSON.stringify({ _id: userId, token, appkey: APP_KEY, lat, long: lng }),
  })
}

// ─── Admin — users (FR-2) ─────────────────────────────────────────────────────

export function getAllUsers(userId: string | number, token: string) {
  if (USE_DUMMY) return dummyResolve({ data: [...DUMMY_USERS] })
  return request<{ data?: DoswallUser[] }>('/api/admin/getclients', {
    method: 'POST',
    body: JSON.stringify({ _id: userId, token, appkey: APP_KEY }),
  })
}

export function createUser(
  adminId: string | number,
  token: string,
  payload: { name: string; email: string; password: string; role?: string },
) {
  if (USE_DUMMY) {
    const newUser: DoswallUser = {
      user_id: `USR${String(DUMMY_USERS.length + 1).padStart(3, '0')}`,
      ...payload, status: 0, geotag: '', notes: '',
      last_update: new Date().toISOString(), created_at: new Date().toISOString(),
    }
    DUMMY_USERS.push(newUser)
    return dummyResolve({ success: true })
  }
  return request<{ success: boolean; message?: string }>('/api/admin/create', {
    method: 'POST',
    body: JSON.stringify({ _id: adminId, token, appkey: APP_KEY, ...payload }),
  })
}

export function updateUser(
  adminId: string | number,
  token: string,
  targetId: string | number,
  payload: Partial<{ name: string; email: string; password: string; geotag: string; status: number; role: string; notes: string }>,
) {
  if (USE_DUMMY) {
    const idx = DUMMY_USERS.findIndex(u => String(u.user_id) === String(targetId))
    if (idx !== -1) Object.assign(DUMMY_USERS[idx], payload)
    return dummyResolve({ success: true })
  }
  return request<{ success: boolean; message?: string }>(`/api/admin/updateclients/${targetId}`, {
    method: 'PUT',
    body: JSON.stringify({ _id: adminId, token, appkey: APP_KEY, ...payload }),
  })
}

export function deleteUser(adminId: string | number, token: string, targetId: string | number) {
  if (USE_DUMMY) {
    const idx = DUMMY_USERS.findIndex(u => String(u.user_id) === String(targetId))
    if (idx !== -1) DUMMY_USERS.splice(idx, 1)
    return dummyResolve({ success: true })
  }
  return request<{ success: boolean; message?: string }>(`/api/admin/delete/${targetId}`, {
    method: 'POST',
    body: JSON.stringify({ _id: adminId, token, appkey: APP_KEY }),
  })
}

// ─── Restrict display (FR-7) ──────────────────────────────────────────────────

const _dummyRestricted = new Set<string>()

export function getRestrictList(adminId: string | number, token: string) {
  if (USE_DUMMY) {
    const data = DUMMY_USERS
      .filter(u => _dummyRestricted.has(String(u.user_id)))
      .map(u => ({ user_id: String(u.user_id), email: String(u.email) }))
    return dummyResolve({ data })
  }
  return request<{ data?: { user_id: string; email: string }[] }>('/api/admin/getrestrict', {
    method: 'POST',
    body: JSON.stringify({ _id: adminId, token, appkey: APP_KEY }),
  })
}

export function toggleRestrict(adminId: string | number, token: string, targetId: string | number) {
  if (USE_DUMMY) {
    const sid = String(targetId)
    _dummyRestricted.has(sid) ? _dummyRestricted.delete(sid) : _dummyRestricted.add(sid)
    return dummyResolve({ success: true })
  }
  return request<{ success: boolean; message?: string }>('/api/admin/editrestrict', {
    method: 'POST',
    body: JSON.stringify({ _id: adminId, token, appkey: APP_KEY, user_id: targetId }),
  })
}

// ─── Announcements (FR-5) ─────────────────────────────────────────────────────

export function getAnnouncements(userId: string | number, token: string) {
  if (USE_DUMMY) return dummyResolve({ data: [...DUMMY_ANNOUNCEMENTS] })
  return request<{ data?: Announcement[] }>('/api/announcements/get', {
    method: 'POST',
    body: JSON.stringify({ _id: userId, token, appkey: APP_KEY }),
  })
}

export function getMyAnnouncements(userId: string | number, token: string) {
  if (USE_DUMMY) {
    const data = DUMMY_ANNOUNCEMENTS.filter(a => String(a.user_id) === String(userId))
    return dummyResolve({ data })
  }
  return request<{ data?: Announcement[] }>('/api/announcements/getbyuser', {
    method: 'POST',
    body: JSON.stringify({ _id: userId, token, appkey: APP_KEY }),
  })
}

export function addAnnouncement(userId: string | number, token: string, title: string, content: string) {
  if (USE_DUMMY) {
    const newAnn: Announcement = {
      announcement_id: `ANN${String(DUMMY_ANNOUNCEMENTS.length + 1).padStart(3, '0')}`,
      title, content, user_id: userId, creator_name: 'Me',
      created_at: new Date().toLocaleString('id-ID'),
    }
    DUMMY_ANNOUNCEMENTS.unshift(newAnn)
    return dummyResolve({ success: true, data: newAnn })
  }
  return request<{ success: boolean; message?: string; data?: Announcement }>('/api/announcements/add', {
    method: 'POST',
    body: JSON.stringify({ _id: userId, token, appkey: APP_KEY, title, content }),
  })
}

export function updateAnnouncement(
  userId: string | number,
  token: string,
  announcementId: string | number,
  payload: { title?: string; content?: string },
) {
  if (USE_DUMMY) {
    const idx = DUMMY_ANNOUNCEMENTS.findIndex(a => String(a.announcement_id) === String(announcementId))
    if (idx !== -1) Object.assign(DUMMY_ANNOUNCEMENTS[idx], payload)
    return dummyResolve({ success: true })
  }
  return request<{ success: boolean; message?: string }>(`/api/announcements/update/${announcementId}`, {
    method: 'PUT',
    body: JSON.stringify({ _id: userId, token, appkey: APP_KEY, ...payload }),
  })
}

export function deleteAnnouncement(userId: string | number, token: string, announcementId: string | number) {
  if (USE_DUMMY) {
    const idx = DUMMY_ANNOUNCEMENTS.findIndex(a => String(a.announcement_id) === String(announcementId))
    if (idx !== -1) DUMMY_ANNOUNCEMENTS.splice(idx, 1)
    return dummyResolve({ success: true })
  }
  return request<{ success: boolean; message?: string }>(`/api/announcements/delete/${announcementId}`, {
    method: 'POST',
    body: JSON.stringify({ _id: userId, token, appkey: APP_KEY }),
  })
}

// ─── Announcement queue (FR-6) ────────────────────────────────────────────────

export function getQueue(userId: string | number, token: string) {
  if (USE_DUMMY) return dummyResolve({ data: [...DUMMY_QUEUE] })
  return request<{ data?: QueueItem[] }>('/api/announcements/getqueue', {
    method: 'POST',
    body: JSON.stringify({ _id: userId, token, appkey: APP_KEY }),
  })
}

export function addToQueue(
  userId: string | number,
  token: string,
  announcementId: string | number,
  order: number,
  duration: string,
) {
  if (USE_DUMMY) {
    const ann = DUMMY_ANNOUNCEMENTS.find(a => String(a.announcement_id) === String(announcementId))
    DUMMY_QUEUE.push({ order, duration, announcement_id: announcementId, title: ann?.title, content: ann?.content })
    DUMMY_QUEUE.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    return dummyResolve({ success: true })
  }
  return request<{ success: boolean; message?: string }>('/api/announcements/createqueue', {
    method: 'POST',
    body: JSON.stringify({ _id: userId, token, appkey: APP_KEY, announcement_id: announcementId, order, duration }),
  })
}

export function updateQueueItem(
  userId: string | number,
  token: string,
  queueId: string | number,
  payload: { order?: number; duration?: string },
) {
  if (USE_DUMMY) {
    const idx = DUMMY_QUEUE.findIndex(q => q.order === queueId)
    if (idx !== -1) Object.assign(DUMMY_QUEUE[idx], payload)
    return dummyResolve({ success: true })
  }
  return request<{ success: boolean; message?: string }>(`/api/announcements/updatequeue/${queueId}`, {
    method: 'POST',
    body: JSON.stringify({ _id: userId, token, appkey: APP_KEY, ...payload }),
  })
}

export function removeFromQueue(userId: string | number, token: string, queueId: string | number) {
  if (USE_DUMMY) {
    const idx = DUMMY_QUEUE.findIndex(q => q.order === Number(queueId))
    if (idx !== -1) DUMMY_QUEUE.splice(idx, 1)
    return dummyResolve({ success: true })
  }
  return request<{ success: boolean; message?: string }>(`/api/announcements/deletequeue/${queueId}`, {
    method: 'POST',
    body: JSON.stringify({ _id: userId, token, appkey: APP_KEY }),
  })
}

// ─── Password (FR-8) ──────────────────────────────────────────────────────────

export function changePassword(
  userId: string | number,
  token: string,
  oldPassword: string,
  newPassword: string,
) {
  if (USE_DUMMY) return dummyResolve({ success: true, message: 'Password changed (dummy).' })
  return request<{ success: boolean; message?: string }>('/api/password/update', {
    method: 'PUT',
    body: JSON.stringify({ _id: userId, token, appkey: APP_KEY, old_password: oldPassword, new_password: newPassword }),
  })
}
