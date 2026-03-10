/**
 * Backend API client (frontend-only).
 *
 * Projects API (VITE_API_URL, default localhost:3000):
 *   GET /api/projects → { projects: Array<{ id, name, description, link?, tags? }> }
 *
 * Stem Separation API (VITE_SEPARATE_API_URL, default localhost:8000):
 *   GET / → { message, models: { stems, vocals } }
 *   POST /separate?model=stems|vocals → multipart file, returns application/zip
 */

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const separateApiURL = import.meta.env.VITE_SEPARATE_API_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  const url = `${baseURL.replace(/\/$/, '')}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function getProjects() {
  return request('/api/projects')
}

export async function getSeparateApiInfo() {
  const url = `${separateApiURL.replace(/\/$/, '')}/separate/info`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function separateAudio(file, model = 'stems') {
  const formData = new FormData()
  formData.append('file', file)
  const url = `${separateApiURL.replace(/\/$/, '')}/separate?model=${encodeURIComponent(model)}`
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  const blob = await res.blob()
  const disposition = res.headers.get('Content-Disposition')
  const filenameMatch = disposition?.match(/filename="?([^";\n]+)"?/)
  const filename = filenameMatch?.[1] ?? `${file.name.replace(/\.[^.]+$/, '')}_stems.zip`
  return { blob, filename }
}

/**
 * Start a separation job; returns { job_id }. Use subscribeSeparateProgress(jobId, onEvent) for SSE progress, then getSeparateResult(jobId) for the ZIP.
 */
export async function startSeparateJob(file, model = 'stems') {
  const formData = new FormData()
  formData.append('file', file)
  const url = `${separateApiURL.replace(/\/$/, '')}/separate/start?model=${encodeURIComponent(model)}`
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

/**
 * SSE progress URL for a job. Use with EventSource or fetch for streaming.
 */
export function getSeparateProgressURL(jobId) {
  return `${separateApiURL.replace(/\/$/, '')}/separate/progress/${encodeURIComponent(jobId)}`
}

/**
 * Direct download URL for the result ZIP.
 * Prefer navigating/clicking this URL to get native browser download UI.
 */
export function getSeparateResultURL(jobId) {
  return `${separateApiURL.replace(/\/$/, '')}/separate/result/${encodeURIComponent(jobId)}`
}

/**
 * Fetch the result ZIP when the job is done. Returns { blob, filename }. 202 = still processing.
 */
export async function getSeparateResult(jobId) {
  const { response, filename } = await getSeparateResultResponse(jobId)
  const blob = await response.blob()
  return { blob, filename }
}

/**
 * Get the raw response for the result ZIP (body unconsumed). Use for streaming via File System Access API.
 * Caller must consume response.body (e.g. pipeTo) or call response.blob().
 */
export async function getSeparateResultResponse(jobId) {
  const url = `${separateApiURL.replace(/\/$/, '')}/separate/result/${encodeURIComponent(jobId)}`
  const response = await fetch(url)
  if (response.status === 202) throw new Error('Still processing')
  if (response.status === 404) throw new Error('Job not found')
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `HTTP ${response.status}`)
  }
  const disposition = response.headers.get('Content-Disposition')
  const filenameMatch = disposition?.match(/filename="?([^";\n]+)"?/)
  const filename = filenameMatch?.[1] ?? 'stems.zip'
  return { response, filename }
}

/**
 * Same as separateAudio but streams the response and calls onProgress(loaded, total)
 * with bytes received and total (total is null if Content-Length is missing).
 */
export async function separateAudioWithProgress(file, model, onProgress) {
  const formData = new FormData()
  formData.append('file', file)
  const url = `${separateApiURL.replace(/\/$/, '')}/separate?model=${encodeURIComponent(model)}`
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  const total = res.headers.get('Content-Length')
  const totalBytes = total ? parseInt(total, 10) : null
  const reader = res.body.getReader()
  const chunks = []
  let loaded = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    loaded += value.length
    if (onProgress) onProgress(loaded, totalBytes)
  }
  const blob = new Blob(chunks)
  const disposition = res.headers.get('Content-Disposition')
  const filenameMatch = disposition?.match(/filename="?([^";\n]+)"?/)
  const filename = filenameMatch?.[1] ?? `${file.name.replace(/\.[^.]+$/, '')}_stems.zip`
  return { blob, filename }
}
