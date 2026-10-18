
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useClockt } from '../contexts/clocktContext.js'
import { getRecommendations } from '../services/api.js'

function timeAgo(date, now) {
  if (!now) return 'recent'
  const timestamp = new Date(date).getTime()
  if (!Number.isFinite(timestamp)) return 'recent'
  const minutes = Math.max(
    1,
    Math.floor((now - timestamp) / 60_000)
  )
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function savedHours(tips) {
  let hasEstimate = false
  const total = tips.reduce((sum, tip) => {
    const value = String(tip.timeSaved || '')
    const hours = value.match(/([\d.]+)\s*(?:hrs?|hours?)/i)
    const minutes = value.match(/([\d.]+)\s*(?:mins?|minutes?)/i)
    if (hours || minutes) hasEstimate = true
    return sum + Number(hours?.[1] ?? 0) + Number(minutes?.[1] ?? 0) / 60
  }, 0)
  return hasEstimate ? total : null
}

function displayText(value, fallback) {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function normalizeRecommendation(item, index) {
  const source = item && typeof item === 'object' ? item : {}
  const priorityValue = typeof source.priority === 'number'
    ? source.priority
    : String(source.priority ?? '').toLowerCase() === 'high' ? 90 : 50
  const repetitions = source.repetitions != null &&
    source.repetitions !== '' &&
    Number.isFinite(Number(source.repetitions))
    ? Number(source.repetitions)
    : null

  return {
    ...source,
    id: source.id ?? `recommendation-${index}`,
    application: displayText(source.application, 'Application'),
    appIcon: displayText(source.appIcon, '✳'),
    activity: displayText(source.activity, 'A repeated opportunity was identified.'),
    title: displayText(source.activity, 'A repeated opportunity was identified.'),
    suggestion: displayText(source.suggestion, 'Review this opportunity for a simpler, more efficient approach.'),
    category: displayText(source.category, 'Recommendation'),
    repetitions,
    timeSaved: displayText(source.timeSaved, ''),
    priority: Number.isFinite(priorityValue) ? priorityValue : 50,
    status: 'new',
    source: 'backend',
  }
}

function Dashboard() {
  const {
    workspace,
    storageError,
    clock,
    engageConversation,
  } = useClockt()

  const [selected, setSelected] = useState(null)
  const [isScanActive, setIsScanActive] = useState(false)
  const [recommendations, setRecommendations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [dismissedIds, setDismissedIds] = useState([])

  useEffect(() => {
    let mounted = true

    getRecommendations()
      .then((items) => {
        if (!mounted) return
        const recommendations = Array.isArray(items)
          ? items
          : Array.isArray(items?.items)
            ? items.items
            : Array.isArray(items?.recommendations)
              ? items.recommendations
              : null
        if (!recommendations) throw new Error('Invalid recommendations response')
        setRecommendations(
          recommendations
            .filter((item) => item && typeof item === 'object')
            .map(normalizeRecommendation),
        )
        setApiError('')
      })
      .catch(() => {
        if (mounted) {
          setApiError(
            'Recommendations are unavailable right now. Please try again shortly.'
          )
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const maxRecommendations = Number.isFinite(Number(workspace?.settings?.maxRecommendations))
    ? Math.max(0, Number(workspace.settings.maxRecommendations))
    : 6
  const activeTips = recommendations
    .filter((tip) => !dismissedIds.includes(tip.id))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxRecommendations)

  const conversations = (Array.isArray(workspace?.conversations) ? workspace.conversations : [])
    .filter((conversation) => conversation && typeof conversation === 'object')
    .map((conversation, index) => ({
      ...conversation,
      id: conversation.id ?? `conversation-${index}`,
      title: displayText(conversation.title, 'Previous conversation'),
      application: displayText(conversation.application, 'Clockt'),
      lastMessage: displayText(conversation.lastMessage, 'Continue exploring this efficiency idea.'),
      lastEngaged: conversation.lastEngaged ?? '',
    }))
    .sort(
    (a, b) =>
      new Date(b.lastEngaged).getTime() -
      new Date(a.lastEngaged).getTime()
  )

  const potentialHours = savedHours(activeTips)

  function openTip(tip) {
    setSelected({ type: 'tip', item: tip })
  }

  function acceptTip(tip) {
    setDismissedIds((current) => [...current, tip.id])
    setSelected(null)
  }

  function dismissTip(tip) {
    setDismissedIds((current) => [...current, tip.id])
    setSelected(null)
  }

  function openConversation(conversation) {
    engageConversation(conversation.id)
    setSelected({ type: 'conversation', item: conversation })
  }

  return (
    <div className="dashboard-stage">
      <header className="dashboard-brandbar">
        <Link to="/" className="dashboard-wordmark">
          CLOCKT
        </Link>
      </header>

      <div className="dashboard-body">
        <aside className="dashboard-rail">
          <div className="watcher-section">
            <span className="watcher-label">Tip search · Preview</span>
            <button
              className="ai-watch-button"
              type="button"
              aria-pressed={isScanActive}
              aria-label={`Toggle advanced scan preview, ${
                isScanActive ? 'active' : 'inactive'
              }`}
              title="Preview control only; background opportunity detection is not available yet."
              onClick={() => setIsScanActive((active) => !active)}
            >
              <span
                className={`watcher-icon-wrap${
                  isScanActive ? ' active' : ''
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
              </span>
              <span className="watcher-status">Advanced scan</span>
              <span className="watcher-button-state">
                {isScanActive ? 'Active' : 'Inactive'}
              </span>
            </button>
          </div>

          <div className="rail-stat">
            <span>Recommendations</span>
            <strong>{isLoading || apiError ? '—' : activeTips.length}</strong>
          </div>

          <div className="rail-stat rail-stat-saved">
            <span>Potential time back</span>
            <strong>
              {potentialHours === null ? '—' : potentialHours.toFixed(1)}
              {potentialHours !== null && <small> hrs</small>}
            </strong>
          </div>
        </aside>

        <main className="dashboard-feed">
          <div className="feed-heading">
            <div>
              <span className="dashboard-kicker">
                Inefficiencies, made actionable
              </span>
              <h1>Work smarter with practical recommendations</h1>
              <p>
                Clockt highlights repeated opportunities and suggests practical
                ways to improve efficiency.
              </p>
            </div>

            <div className="ai-capacity">
              <span>AI PRIORITY QUEUE</span>
              <strong>
                {isLoading || apiError ? '—' : activeTips.length} <i>/</i>{' '}
                {maxRecommendations}
              </strong>
            </div>
          </div>

          {storageError && (
            <p className="dashboard-storage-error" role="alert">
              {storageError}
            </p>
          )}

          {apiError && (
            <p className="dashboard-storage-error" role="alert">
              {apiError}
            </p>
          )}

          <section className="tip-grid" aria-label="Efficiency recommendations">
            {activeTips.map((tip, index) => (
              <article className="tip-card" key={tip.id}>
                <div className="tip-card-topline">
                  <div className="tip-app">
                    <span
                      className={`tip-app-mark tip-app-${index % 3}`}
                    >
                      {tip.appIcon}
                    </span>
                    <span>{tip.application}</span>
                  </div>

                  <span
                    className={`tip-priority${
                      tip.priority >= 90 ? ' priority-high' : ''
                    }`}
                  >
                    {tip.priority >= 90
                      ? 'HIGH IMPACT'
                      : tip.category.toUpperCase()}
                  </span>
                </div>

                <h2>{tip.title}</h2>
                <p className="tip-activity">{tip.activity}</p>
                <p className="tip-description">{tip.suggestion}</p>

                <div className="tip-card-meta">
                  <span>{tip.repetitions === null ? 'Repeated opportunity' : `${tip.repetitions} repeats`}</span>
                  <span className="tip-saved">
                    {tip.timeSaved ? `↗ ${tip.timeSaved}` : 'Efficiency opportunity'}
                  </span>
                </div>

                <div className="tip-actions">
                  <button
                    className="tip-explore"
                    type="button"
                    onClick={() => openTip(tip)}
                  >
                    Explore suggestion <span>→</span>
                  </button>

                  <button
                    className="tip-dismiss"
                    type="button"
                    onClick={() => dismissTip(tip)}
                  >
                    Not for me
                  </button>
                </div>
              </article>
            ))}

            {!activeTips.length && !isLoading && !apiError && (
              <div className="tip-empty">
                <span>✳</span>
                <strong>No recommendations yet</strong>
                <p>
                  Add opportunities to your Efficiency Log. Recommendations appear after repeated opportunities are detected.
                </p>
              </div>
            )}
            {isLoading && !activeTips.length && (
              <div className="tip-empty">
                <span>✳</span>
                <strong>Loading recommendations…</strong>
                <p>Checking for efficiency improvements.</p>
              </div>
            )}
          </section>

          <div className="past-conversations-heading">
            <div>
              <span className="dashboard-kicker">
                Pick up where you left off · Preview
              </span>
              <h2>Past conversations</h2>
            </div>
            <span className="conversation-sort">
              Sorted by recent engagement ↓
            </span>
          </div>

          <section
            className="conversation-grid"
            aria-label="Past conversations"
          >
            {conversations.slice(0, 4).map((conversation) => (
              <button
                className="conversation-card"
                type="button"
                key={conversation.id}
                onClick={() => openConversation(conversation)}
              >
                <span className="conversation-app">
                  {conversation.application.slice(0, 1)}
                </span>
                <span className="conversation-copy">
                  <strong>{conversation.title}</strong>
                  <small>{conversation.lastMessage}</small>
                </span>
                <span className="conversation-time">
                  {timeAgo(conversation.lastEngaged, clock)}
                  <b>→</b>
                </span>
              </button>
            ))}

            {!conversations.length && (
              <p className="conversation-empty">
                Your saved conversation previews will appear here.
              </p>
            )}
          </section>

          <div className="dashboard-bottom-note">
            Recommendations are based on efficiency opportunities from your Efficiency Log.
            Time-saving estimates are approximate.
          </div>
        </main>
      </div>

      {selected && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelected(null)
            }
          }}
        >
          <section
            className="conversation-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
          >
            <button
              className="dialog-close"
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close dialog"
            >
              ×
            </button>

            <span className="dialog-spark">✳</span>

            <span className="dashboard-kicker">
              {selected.type === 'tip'
                ? 'AI suggestion'
                : selected.item.application}
            </span>

            <h2 id="dialog-title">{selected.item.title}</h2>

            <p>
              {selected.type === 'tip'
                ? selected.item.suggestion
                : selected.item.lastMessage}
            </p>

            <div className="dialog-preview-note">
              Preview · AI conversations are not connected yet.
            </div>

            {selected.type === 'tip' && (
              <button
                className="button button-primary dialog-accept"
                type="button"
                onClick={() => acceptTip(selected.item)}
              >
                I’ll try this
              </button>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default Dashboard
