import { useEffect, useState } from 'react'
import StatCard from '../components/StatCard.jsx'
import { getAnalytics } from '../services/api.js'

function Analytics() {
  const [analytics, setAnalytics] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    getAnalytics()
      .then((data) => { if (isMounted) setAnalytics(data) })
      .catch(() => { if (isMounted) setError('Analytics are unavailable right now. Please try again.') })
    return () => { isMounted = false }
  }, [])

  const summary = analytics?.summary

  return (
    <div className="page-stack">
      <section className="page-heading-row">
        <div><p className="eyebrow">Understand your work</p><h1>Analytics</h1><p className="page-lede">See where your time goes and where it could go instead.</p></div>
        <button className="button button-secondary" type="button">Last 7 days <span className="button-chevron">⌄</span></button>
      </section>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <section className="stat-grid analytics-stat-grid">
        <StatCard label="Tracked time" value={summary ? `${summary.trackedHours}h` : '—'} detail="Across all applications" icon="◷" />
        <StatCard label="Activities" value={summary?.activities ?? '—'} detail="In the last 7 days" icon="↗" tone="blue" />
        <StatCard label="Repeated tasks" value={summary?.repeatedTasks ?? '—'} detail="Patterns identified" icon="⟳" tone="pink" />
        <StatCard label="Potential savings" value={summary?.potentialSavings ?? '—'} detail="Time you could get back" icon="✳" tone="amber" />
      </section>
      <section className="analytics-grid">
        <article className="section-panel chart-panel">
          <div className="section-heading"><div><p className="eyebrow">At a glance</p><h2>Activity summary</h2></div><span className="chart-unit">Hours tracked</span></div>
          {analytics ? (
            <div className="bar-chart" role="img" aria-label="Bar chart showing activity hours from Monday to Sunday">
              <div className="chart-y-labels"><span>8h</span><span>6h</span><span>4h</span><span>2h</span><span>0</span></div>
              <div className="chart-plot">
                <div className="chart-gridlines"><i /><i /><i /><i /><i /></div>
                <div className="chart-bars">{analytics.weeklyActivity.map((item) => (
                  <div className="chart-column" key={item.day}>
                    <div className="chart-bar-wrap"><span className="chart-bar" style={{ height: `${(item.hours / 8) * 100}%` }} title={`${item.hours} hours`} /></div>
                    <span className="chart-day">{item.day}</span>
                  </div>
                ))}</div>
              </div>
            </div>
          ) : <div className="chart-empty">Preparing your activity summary…</div>}
          <div className="chart-note"><span className="note-indicator" /> Activity tracked <span className="chart-note-muted">· 7 day overview</span></div>
        </article>
        <article className="section-panel breakdown-panel">
          <div className="section-heading"><div><p className="eyebrow">Where you spend time</p><h2>Application breakdown</h2></div></div>
          {analytics ? (
            <>
              <div className="breakdown-visual"><div className="donut-chart" role="img" aria-label="Application time breakdown" /><div className="donut-center"><strong>{summary.trackedHours}h</strong><span>total time</span></div></div>
              <div className="breakdown-list">{analytics.applications.map((app) => (
                <div className="breakdown-row" key={app.name}>
                  <span className={`legend-dot ${app.color}`} /><span className="breakdown-name">{app.name}</span><span className="breakdown-hours">{app.hours}h</span><span className="breakdown-share">{app.share}%</span>
                </div>
              ))}</div>
            </>
          ) : <div className="chart-empty">Loading app usage…</div>}
        </article>
      </section>
      <section className="placeholder-note"><span className="note-spark">✳</span><div><strong>More insight is on the way</strong><p>Detailed trends and app-by-app comparisons will appear here as Clockt learns your work patterns.</p></div><span className="coming-soon">COMING SOON</span></section>
    </div>
  )
}

export default Analytics