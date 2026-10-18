function RecommendationCard({ recommendation, onDismiss, compact = false }) {
  const item = recommendation && typeof recommendation === 'object' && !Array.isArray(recommendation)
    ? recommendation
    : {}
  const application = typeof item.application === 'string' && item.application.trim()
    ? item.application
    : 'Application unavailable'
  const activity = typeof item.activity === 'string' && item.activity.trim()
    ? item.activity
    : 'Repeated opportunity details are not available.'
  const suggestion = typeof item.suggestion === 'string' && item.suggestion.trim()
    ? item.suggestion
    : 'Review this repeated opportunity to find a simpler, more efficient approach.'
  const priority = (typeof item.priority === 'string' || typeof item.priority === 'number') && String(item.priority).trim()
    ? String(item.priority)
    : 'Recommendation'
  const repetitions = item.repetitions != null &&
    item.repetitions !== '' &&
    Number.isFinite(Number(item.repetitions))
    ? Number(item.repetitions)
    : null
  const timeLost = typeof item.timeLost === 'string' && item.timeLost.trim()
    ? item.timeLost
    : 'Not available'
  const timeSaved = typeof item.timeSaved === 'string' && item.timeSaved.trim()
    ? item.timeSaved
    : 'Estimate unavailable'
  const priorityClass = priority.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const canDismiss = typeof onDismiss === 'function' && item.id != null

  return (
    <article className={`recommendation-card${compact ? ' compact' : ''}`}>
      <div className="recommendation-card-top">
        <div className="app-badge" aria-hidden="true">{typeof item.appIcon === 'string' ? item.appIcon : '✳'}</div>
        <div className="recommendation-heading">
          <div className="recommendation-app-row">
            <span className="recommendation-app">{application}</span>
            <span className={`priority-pill ${priorityClass}`}>{priority}</span>
          </div>
          <p className="recommendation-activity">{activity}</p>
        </div>
        {canDismiss && (
          <button className="icon-button dismiss-button" type="button" onClick={() => onDismiss(item.id)} aria-label={`Dismiss recommendation for ${application}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>
          </button>
        )}
      </div>

      <div className="recommendation-metrics">
        <div><span className="metric-number">{repetitions ?? '—'}</span><span className="metric-caption">repeats / week</span></div>
        <div className="metric-divider" />
        <div><span className="metric-number">{timeLost}</span><span className="metric-caption">time spent</span></div>
        <div className="savings-chip"><span>↗</span> {timeSaved}</div>
      </div>

      <div className="suggestion-box">
        <span className="suggestion-spark" aria-hidden="true">✳</span>
        <div><span className="suggestion-label">A smarter way</span><p>{suggestion}</p></div>
      </div>
    </article>
  )
}

export default RecommendationCard
