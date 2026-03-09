import { useState, useEffect, useRef } from 'react'
import { startSeparateJob, getSeparateProgressURL, getSeparateResult, getSeparateResultResponse } from '../../app/api'

const sectionStyle = {
  marginBottom: '2rem',
}

const labelStyle = {
  display: 'block',
  marginBottom: '0.5rem',
  fontWeight: 500,
  color: 'var(--color-main)',
}

const selectStyle = {
  width: '100%',
  maxWidth: 320,
  padding: '0.5rem 0.75rem',
  border: '1px solid var(--color-lighter)',
  borderRadius: 6,
  fontSize: '1rem',
  backgroundColor: 'var(--color-base)',
  color: 'var(--color-dark)',
}

const uploadZoneStyle = {
  border: '2px dashed var(--color-lighter)',
  borderRadius: 8,
  padding: '2rem',
  textAlign: 'center',
  backgroundColor: 'var(--color-base)',
  color: 'var(--color-lighter)',
  cursor: 'pointer',
  transition: 'border-color 0.2s, background-color 0.2s',
}

const uploadZoneHoverStyle = {
  ...uploadZoneStyle,
  borderColor: 'var(--color-accent)',
  backgroundColor: 'rgba(147, 198, 131, 0.08)',
  color: 'var(--color-dark)',
}

const buttonStyle = {
  padding: '0.5rem 1.25rem',
  backgroundColor: 'var(--color-main)',
  color: 'var(--color-base)',
  border: 'none',
  borderRadius: 6,
  fontSize: '1rem',
  fontWeight: 500,
}

const buttonDisabledStyle = {
  ...buttonStyle,
  opacity: 0.6,
  cursor: 'not-allowed',
}

const progressWrapStyle = {
  marginTop: '1rem',
  marginBottom: '1rem',
}

const progressBarStyle = {
  width: '100%',
  height: 8,
  borderRadius: 4,
  backgroundColor: 'var(--color-lighter)',
  overflow: 'hidden',
}

const progressFillStyle = {
  height: '100%',
  backgroundColor: 'var(--color-accent)',
  transition: 'width 0.15s ease-out',
}

const MODELS = [
  { id: 'stems', name: 'Stems (vocals, drums, bass, other)' },
  { id: 'vocals', name: 'Vocals (vocals + accompaniment)' },
]

function downloadBlob(blob, filename) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

/**
 * Stream the result to a user-chosen file (File System Access API) or fall back to blob download.
 */
async function saveResultStreaming(jobId, onProgress) {
  const { response, filename } = await getSeparateResultResponse(jobId)
  if (typeof window.showSaveFilePicker === 'function') {
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [{ description: 'ZIP archive', accept: { 'application/zip': ['.zip'] } }],
    })
    const writable = await handle.createWritable()
    await response.body.pipeTo(writable)
    if (onProgress) onProgress(100)
    return
  }
  if (onProgress) onProgress(-1)
  const blob = await response.blob()
  if (onProgress) onProgress(100)
  downloadBlob(blob, filename)
}

export default function VocalIsolationPage() {
  const [selectedModel, setSelectedModel] = useState('stems')
  const [file, setFile] = useState(null)
  const [uploadHover, setUploadHover] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [phase, setPhase] = useState('idle') // 'idle' | 'processing' | 'downloading'
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingMessage, setProcessingMessage] = useState('')
  const [downloadProgress, setDownloadProgress] = useState(null)
  const [dots, setDots] = useState(0)
  const eventSourceRef = useRef(null)

  useEffect(() => {
    if (phase !== 'downloading' && downloadProgress == null) return
    const id = setInterval(() => setDots((d) => (d + 1) % 4), 400)
    return () => clearInterval(id)
  }, [phase, downloadProgress])

  const handleFileChange = (e) => {
    const chosen = e.target.files?.[0]
    if (chosen) {
      setFile(chosen)
      setError(null)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setUploadHover(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped && dropped.type.startsWith('audio/')) {
      setFile(dropped)
      setError(null)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setUploadHover(true)
  }

  const handleDragLeave = () => setUploadHover(false)

  const handleProcess = async () => {
    if (!file) return
    setProcessing(true)
    setError(null)
    setProcessingProgress(0)
    setProcessingMessage('')
    setDownloadProgress(null)
    setPhase('processing')
    try {
      const { job_id } = await startSeparateJob(file, selectedModel)
      setProcessingMessage('Separating...')

      await new Promise((resolve, reject) => {
        const url = getSeparateProgressURL(job_id)
        const es = new EventSource(url)
        eventSourceRef.current = es

        es.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data)
            if (data.error) {
              es.close()
              reject(new Error(data.error))
              return
            }
            if (data.progress != null) setProcessingProgress(data.progress)
            if (data.message) setProcessingMessage(data.message)
            if (data.done || data.progress >= 100) {
              es.close()
              eventSourceRef.current = null
              resolve()
            }
          } catch (_) {}
        }
        es.onerror = () => {
          es.close()
          eventSourceRef.current = null
          reject(new Error('Progress connection failed'))
        }
      })

      setPhase('downloading')
      setDownloadProgress(-1)
      await saveResultStreaming(job_id, (p) => setDownloadProgress(p))
      setDownloadProgress(100)
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message || 'Processing failed')
    } finally {
      setProcessing(false)
      setPhase('idle')
      setProcessingProgress(0)
      setProcessingMessage('')
      setDownloadProgress(null)
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }

  return (
    <section>
      <h1>Vocal Isolation</h1>

      <div style={sectionStyle}>
        <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Overview</h2>
        <p style={{ color: 'var(--color-dark)', margin: 0 }}>
          Separate stems from mixed audio. Choose a model, upload a file (WAV, MP3, FLAC, OGG, or M4A),
          and download a ZIP of the separated tracks.
        </p>
      </div>

      <div style={sectionStyle}>
        <label htmlFor="model-select" style={labelStyle}>
          Model
        </label>
        <select
          id="model-select"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          style={selectStyle}
          disabled={processing}
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div style={sectionStyle}>
        <span style={labelStyle}>Upload audio</span>
        <label
          style={uploadHover ? uploadZoneHoverStyle : uploadZoneStyle}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            accept="audio/*,.wav,.mp3,.flac,.ogg,.m4a"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            disabled={processing}
          />
          {file ? (
            <span style={{ color: 'var(--color-dark)' }}>{file.name}</span>
          ) : (
            'Drop an audio file here or click to browse'
          )}
        </label>
      </div>

      {error && (
        <p style={{ color: 'var(--color-dark)', marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      {(phase === 'processing' || (phase === 'downloading' && downloadProgress != null)) && (
        <div style={progressWrapStyle}>
          <div style={progressBarStyle}>
            <div
              style={{
                ...progressFillStyle,
                width:
                  phase === 'processing'
                    ? (processingProgress < 0 ? '30%' : `${Math.min(processingProgress, 99)}%`)
                    : downloadProgress < 0
                      ? '30%'
                      : `${downloadProgress}%`,
              }}
            />
          </div>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-lighter)' }}>
            {phase === 'processing'
              ? `${processingMessage || 'Processing'}${'.'.repeat(dots)}`
              : `Downloading${'.'.repeat(dots)}${downloadProgress >= 0 ? ` ${downloadProgress}%` : ''}`}
          </p>
        </div>
      )}

      <button
        type="button"
        style={processing || !file ? buttonDisabledStyle : buttonStyle}
        onClick={handleProcess}
        disabled={processing || !file}
      >
        {processing ? 'Processing…' : 'Separate & download'}
      </button>
    </section>
  )
}
