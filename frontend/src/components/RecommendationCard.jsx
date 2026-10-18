function RecommendationCard({ recommendation, onDismiss, compact = false }) {
  return (
    <article className={`recommendation-card${compact ? ' compact' : ''}`}>
      <div className="recommendation-card-top">
        <div className="app-badge" aria-hidden="true">{recommendation.appIcon}</div>
        <div className="recommendation-heading">
          <div className="recommendation-app-row">
            <span className="recommendation-app">{recommendation.application}</span>
            <span className={`priority-pill ${recommendation.priority.toLowerCase()}`}>{recommendation.priority}</span>
          </div>
          <p className="recommendation-activity">{recommendation.activity}</p>
        </div>
        {onDismiss && (
          <button className="icon-button dismiss-button" type="button" onClick={() => onDismiss(recommendation.id)} aria-label={`Dismiss recommendation for ${recommendation.application}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>
          </button>
        )}
      </div>

      <div className="recommendation-metrics">
        <div><span className="metric-number">{recommendation.repetitions}</span><span className="metric-caption">repeats / week</span></div>
        <div className="metric-divider" />
        <div><span className="metric-number">{recommendation.timeLost}</span><span className="metric-caption">time spent</span></div>
        <div className="savings-chip"><span>↗</span> Save {recommendation.timeSaved}</div>
      </div>

      <div className="suggestion-box">
        <span className="suggestion-spark" aria-hidden="true">✳</span>
        <div><span className="suggestion-label">A smarter way</span><p>{recommendation.suggestion}</p></div>
      </div>
    </article>
  )
}

export default RecommendationCard
