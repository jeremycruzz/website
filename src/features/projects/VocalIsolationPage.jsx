import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getSeparateApiInfo, startSeparateJob, getSeparateProgressURL, getSeparateResultURL } from '../../app/api'
import {
  setJobStarted,
  setProgress,
  setPhase,
  setDownloadProgress,
  setError,
  clearError,
  reset,
} from './vocalIsolationSlice'

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
  marginTop: '1.75rem',
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

function startBrowserDownload(url) {
  // Use a direct navigation/click so the browser shows native download UI.
  const a = document.createElement('a')
  a.href = url
  a.download = ''
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export default function VocalIsolationPage() {
  const dispatch = useDispatch()
  const { jobId, phase, progress: processingProgress, message: processingMessage, error, downloadProgress } =
    useSelector((state) => state.vocalIsolation)
  const processing = phase !== 'idle'

  const [models, setModels] = useState([])
  const [modelsError, setModelsError] = useState(null)
  const [selectedModel, setSelectedModel] = useState('')
  const [file, setFile] = useState(null)
  const [uploadHover, setUploadHover] = useState(false)
  const [dots, setDots] = useState(0)
  const eventSourceRef = useRef(null)

  useEffect(() => {
    getSeparateApiInfo()
      .then((data) => {
        const list = Array.isArray(data.models)
          ? data.models
          : Object.entries(data.models || {}).map(([id, desc]) => ({
              id,
              name: typeof desc === 'string' ? desc : id,
              description: typeof desc === 'string' ? desc : '',
            }))
        setModels(list)
        if (list.length) setSelectedModel(list[0].id)
      })
      .catch((err) => setModelsError(err.message))
  }, [])

  useEffect(() => {
    if (phase !== 'downloading' && downloadProgress == null) return
    const id = setInterval(() => setDots((d) => (d + 1) % 4), 400)
    return () => clearInterval(id)
  }, [phase, downloadProgress])

  // Confirm before leaving (tab close, refresh) while processing or downloading
  useEffect(() => {
    if (!processing) return
    const handleBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [processing])

  // Subscribe to progress (when starting a job or when returning to the page with an active job)
  useEffect(() => {
    if (!jobId || phase !== 'processing') return
    const url = getSeparateProgressURL(jobId)
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.error) {
          es.close()
          dispatch(setError('Processing failed. Please try again.'))
          return
        }
        if (data.progress != null || data.message != null) {
          dispatch(setProgress({ progress: data.progress, message: data.message }))
        }
        if (data.done || data.progress >= 100) {
          es.close()
          eventSourceRef.current = null
          dispatch(setPhase('downloading'))
        }
      } catch (_) {}
    }
    es.onerror = () => {
      es.close()
      eventSourceRef.current = null
      dispatch(setError('Progress connection failed'))
    }

    return () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [jobId, phase, dispatch])

  // When phase is downloading, run the download (initial or after returning to the page)
  useEffect(() => {
    if (phase !== 'downloading' || !jobId) return
    let cancelled = false
    dispatch(setDownloadProgress(-1))
    try {
      const url = getSeparateResultURL(jobId)
      startBrowserDownload(url)
      dispatch(setDownloadProgress(100))
      const t = setTimeout(() => {
        if (!cancelled) dispatch(reset())
      }, 1500)
      return () => {
        cancelled = true
        clearTimeout(t)
      }
    } catch {
      if (!cancelled) dispatch(setError('Download failed. Please try again.'))
      return () => { cancelled = true }
    }
  }, [phase, jobId, dispatch])

  const handleFileChange = (e) => {
    const chosen = e.target.files?.[0]
    if (chosen) {
      setFile(chosen)
      dispatch(clearError())
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setUploadHover(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped && dropped.type.startsWith('audio/')) {
      setFile(dropped)
      dispatch(clearError())
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setUploadHover(true)
  }

  const handleDragLeave = () => setUploadHover(false)

  const handleProcess = async () => {
    if (!file) return
    try {
      const { job_id } = await startSeparateJob(file, selectedModel)
      dispatch(setJobStarted(job_id))
    } catch (err) {
      if (err.name === 'AbortError') return
      dispatch(setError('Processing failed. Please try again.'))
    }
  }

  const selectedModelInfo = models.find((m) => m.id === selectedModel)

  return (
    <section>
      <h1>Vocal Isolation</h1>

      <div style={sectionStyle}>
        <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Overview</h2>
        <p style={{ color: 'var(--color-dark)', margin: 0 }}>
          Separate stems from mixed audio. Choose a model, upload a file (WAV, MP3, FLAC, OGG, or M4A),
          and download a ZIP of the separated tracks.
        </p>
        <p style={{ marginTop: '0.75rem', marginBottom: 0 }}>
          <a href="/vocal_isolation.pdf" target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', fontSize: '0.9375rem' }}>
            Technical details (PDF)
          </a>
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>About the models</h2>
        <p style={{ color: 'var(--color-dark)', margin: 0 }}>
          Models are compared using <strong>SDR</strong> (Source-to-Distortion Ratio): a standard metric for source separation.
          Higher SDR means the isolated vocal (or instrument) is closer to the true source and has less bleed from the rest of the mix.
        </p>
        <p style={{ color: 'var(--color-dark)', margin: '0.5rem 0 0' }}>
          <strong>What to expect:</strong> Quality depends on the mix: clean, well-balanced recordings with clear vocals tend to separate best.
          Dense or heavily processed material may show more artifacts. Processing time will be around 5-10 minutes.
        </p>
      </div>

      {modelsError && (
        <p style={{ color: 'var(--color-dark)', marginBottom: '1rem' }}>
          Could not load models: {modelsError}
        </p>
      )}

      <div style={sectionStyle}>
        <label htmlFor="model-select" style={labelStyle}>
          Model
        </label>
        <select
          id="model-select"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          style={selectStyle}
          disabled={processing || !models.length}
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        {selectedModelInfo?.description && (
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--color-lighter)' }}>
            {selectedModelInfo.description}
          </p>
        )}
      </div>

      <div style={{ ...sectionStyle, marginBottom: '2.5rem' }}>
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
              : downloadProgress === 100
                ? 'Done!'
                : `Downloading${'.'.repeat(dots)}${downloadProgress >= 0 ? ` ${downloadProgress}%` : ''}`}
          </p>
        </div>
      )}

      <button
        type="button"
        style={{
          ...(processing || !file || !selectedModel ? buttonDisabledStyle : buttonStyle),
          marginTop: '1.5rem',
        }}
        onClick={handleProcess}
        disabled={processing || !file || !selectedModel}
      >
        {processing ? 'Processing…' : 'Separate & download'}
      </button>
    </section>
  )
}
