import { useEffect, useState } from 'react'
import {
  analyzeActivities,
  createActivity,
  deleteActivity,
  getActivities,
} from '../services/api.js'

function normalizeActivities(value) {
  const items = Array.isArray(value)
    ? value
    : Array.isArray(value?.items)
      ? value.items
      : Array.isArray(value?.activities)
        ? value.activities
        : []

  return items?.filter((item) => item && typeof item === 'object') ?? null
}

function displayText(value, fallback) {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function ActivityInput() {
  const [activities, setActivities] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [application, setApplication] = useState('')
  const [activity, setActivity] = useState('')
  const [duration, setDuration] = useState('')
  const [message, setMessage] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  async function refreshActivities() {
    const items = await getActivities()
    const normalized = normalizeActivities(items)
    if (!normalized) throw new Error('Efficiency log response has an unexpected format.')
    setActivities(normalized)
  }

  useEffect(() => {
    let isMounted = true

    getActivities()
      .then((items) => {
        const normalized = normalizeActivities(items)
        if (!normalized) throw new Error('Efficiency log response has an unexpected format.')
        if (isMounted) setActivities(normalized)
      })
      .catch(() => {
        if (isMounted) {
          setError('We couldn’t load your efficiency log. Please try again.')
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function addActivity(event) {
    event.preventDefault()

    const minutes = Number(duration)

    if (
      !application ||
      !activity.trim() ||
      !Number.isFinite(minutes) ||
      minutes <= 0
    ) {
      setError(
        'Choose an application, describe the opportunity, and enter a time greater than zero.'
      )
      return
    }

    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      await createActivity({
      timestamp: new Date().toISOString(),
      application,
      action: activity.trim(),
      duration_seconds: minutes * 60,
      })

      await refreshActivities()

      setApplication('')
      setActivity('')
      setDuration('')
      setMessage('Opportunity saved successfully.')
    } catch {
      setError('We couldn’t save your opportunity. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteSelected() {
    if (!selectedIds.length) {
      setError('Select at least one opportunity to delete.')
      return
    }

    setIsDeleting(true)
    setError('')
    setMessage('')

    try {
      await Promise.all(
        selectedIds.map((id) => deleteActivity(id))
      )

      await refreshActivities()

      setSelectedIds([])
      setMessage('Selected opportunities deleted.')
    } catch {
      try {
        await refreshActivities()
      } catch {
        // Preserve the current list if refreshing fails.
      }

      setError(
        'Some opportunities may not have been deleted. Please check the list and try again.'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  async function runAnalysis() {
    setIsAnalyzing(true)
    setError('')
    setMessage('')

    try {
      const result = await analyzeActivities(activities)
      const reviewed = Number(result?.activitiesAnalyzed)
      const improvements = Number(result?.repeatedActivities)
      const hasCounts = Number.isFinite(reviewed) && Number.isFinite(improvements)

      setMessage(
        hasCounts
          ? `Improvements found — ${reviewed} opportunities reviewed and ${improvements} repeated opportunities identified.`
          : 'Improvement review complete. Check Recommendations for ideas based on repeated opportunities.'
      )
    } catch {
      setError('We couldn’t analyze these opportunities. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  function toggleSelected(id) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    )
  }

  function formatDate(timestamp) {
    if (!timestamp || typeof timestamp !== 'string' && typeof timestamp !== 'number') {
      return 'Date unavailable'
    }

    const date = new Date(timestamp)

    if (Number.isNaN(date.getTime())) return 'Date unavailable'

    return date.toLocaleString()
  }

  function formatDuration(seconds) {
    if (seconds == null || seconds === '') return 'Time unavailable'
    const minutes = Number(seconds) / 60

    if (!Number.isFinite(minutes)) {
      return 'Time unavailable'
    }

    return `${Number(minutes.toFixed(2))} min`
  }

  return (
    <div className="page-stack">
      <section className="page-heading-row">
        <div>
          <p className="eyebrow">Spot what slows you down</p>
          <h1>Efficiency log</h1>
          <p className="page-lede">
            Log repetitive tasks, frustrating workflows, or other time eaters.
            Clockt helps you find opportunities to work more efficiently.
          </p>
        </div>
        <div className="tracked-badge">
          <span className="status-dot" /> Manual entry mode
        </div>
      </section>

      <section className="section-panel entry-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Every improvement starts somewhere</p>
            <h2>Add an opportunity</h2>
          </div>
        </div>

        <form className="activity-form" onSubmit={addActivity}>
          <label className="field-group">
            <span>Application</span>
            <select
              value={application}
              onChange={(event) => setApplication(event.target.value)}
              required
            >
              <option value="" disabled>Select an app</option>
              <option>Google Sheets</option>
              <option>Slack</option>
              <option>Notion</option>
              <option>Email</option>
              <option>Excel</option>
              <option>Chrome</option>
              <option>Other</option>
            </select>
          </label>

          <label className="field-group activity-field">
            <span>What’s slowing you down?</span>
            <input
              value={activity}
              onChange={(event) => setActivity(event.target.value)}
              placeholder="e.g. Repeatedly copy weekly report data"
              required
            />
          </label>

          <label className="field-group duration-field">
            <span>Time spent on this task</span>
            <div className="input-with-suffix">
              <input
                type="number"
                min="1"
                step="1"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                placeholder="15"
                required
              />
              <span>min</span>
            </div>
          </label>

          <button
            className="button button-primary form-add-button"
            type="submit"
            disabled={isSaving}
          >
            <span className="button-plus">+</span>
            {isSaving ? 'Saving…' : 'Add opportunity'}
          </button>
        </form>

        <p className="form-helper">
          Opportunities are sent to your configured API service to identify
          repeated work and suggest practical improvements.
        </p>

        {error && (
          <p className="inline-error" role="alert">{error}</p>
        )}

        {message && (
          <p className="inline-success" role="status">{message}</p>
        )}
      </section>

      <section className="section-panel log-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Your history</p>
            <h2>
              Efficiency Log{' '}
              <span className="heading-count">
                {activities.length}
              </span>
            </h2>
          </div>

          <div className="log-actions">
            <button
              className="button button-delete"
              type="button"
              onClick={deleteSelected}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete selected'}
            </button>

            <button
              className="button button-primary"
              type="button"
              onClick={runAnalysis}
              disabled={isAnalyzing}
            >
              {isAnalyzing
                ? 'Finding improvements…'
                : '✳ Find improvements'}
            </button>
          </div>
        </div>

        <div className="activity-table-wrap">
          <table className="activity-table">
            <thead>
              <tr>
                <th className="check-cell">
                  <span className="sr-only">Select</span>
                </th>
                <th>Opportunity</th>
                <th>Application</th>
                <th>Time spent</th>
                <th>Added</th>
              </tr>
            </thead>

            <tbody>
              {activities.map((item) => (
                <tr key={item.id ?? `${item.application ?? 'opportunity'}-${item.timestamp ?? ''}`}>
                  <td className="check-cell">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelected(item.id)}
                      aria-label={`Select ${displayText(item.action, 'opportunity')}`}
                    />
                  </td>

                  <td>
                    <strong>{displayText(item.action, 'Opportunity details unavailable')}</strong>
                  </td>

                  <td>{displayText(item.application, 'Application unavailable')}</td>

                  <td>
                    {formatDuration(item.duration_seconds)}
                  </td>

                  <td className="table-date">
                    {formatDate(item.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!activities.length && (
            <div className="empty-state">
              <span>◷</span>
              <strong>
                {isLoading
                  ? 'Loading opportunities…'
                  : error
                    ? 'Efficiency Log unavailable'
                    : 'Your Efficiency Log is ready'}
              </strong>
              <p>
                {isLoading
                  ? 'Your saved opportunities will appear here.'
                  : error
                    ? 'Your saved opportunities could not be loaded. Check your connection and try again.'
                    : 'Add your first opportunity above to uncover practical ways to work more efficiently.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default ActivityInput