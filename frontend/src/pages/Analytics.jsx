import { useEffect, useState } from 'react'
import StatCard from '../components/StatCard.jsx'
import {
  getActivities,
  getStatistics,
  getRecommendations,
} from '../services/api.js'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const APPLICATION_COLORS = ['#8966d8', '#73a2dc', '#d18db4', '#8f82b8', '#d3a45b', '#65a89d']

function toFiniteNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.activities)) return value.activities
  if (Array.isArray(value?.recommendations)) return value.recommendations
  return []
}

function getActivityDate(activity) {
  const value = activity?.created_at ?? activity?.timestamp ?? activity?.started_at ?? activity?.date
  if (typeof value !== 'string' && typeof value !== 'number') return null

  const dateOnly = typeof value === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

function getActivityDurationSeconds(activity) {
  if (activity?.duration_seconds != null) return toFiniteNumber(activity.duration_seconds)
  if (activity?.total_duration_seconds != null) return toFiniteNumber(activity.total_duration_seconds)
  if (activity?.duration_minutes != null) return toFiniteNumber(activity.duration_minutes) * 60
  return toFiniteNumber(activity?.duration) * 60
}

function getWeeklyActivity(activities) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    return {
      date,
      day: DAY_LABELS[date.getDay()],
      hours: 0,
    }
  })

  normalizeArray(activities).forEach((activity) => {
    const activityDate = getActivityDate(activity)
    if (!activityDate) return
    activityDate.setHours(0, 0, 0, 0)

    const day = normalizeArray(days).find((item) => item.date.getTime() === activityDate.getTime())
    if (day) day.hours += getActivityDurationSeconds(activity) / 3600
  })

  return days
}

function formatHours(seconds) {
  return `${(seconds / 3600).toFixed(1)}h`
}

function Analytics() {
  const [activities, setActivities] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    Promise.all([
      getActivities(),
      getStatistics(),
      getRecommendations(),
    ])
      .then(([activitiesData, statisticsData, recommendationsData]) => {
        if (!isMounted) return

        const normalizedActivities = normalizeArray(activitiesData)
        const normalizedRecommendations = normalizeArray(recommendationsData)
        const validStatistics = statisticsData &&
          typeof statisticsData === 'object' &&
          !Array.isArray(statisticsData)

        setActivities(normalizedActivities)
        setStatistics(validStatistics ? statisticsData : null)
        setRecommendations(normalizedRecommendations)
      })
      .catch(() => {
        if (isMounted) setError('Analytics are unavailable right now. Please try again.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const applicationStats = normalizeArray(normalizeArray(statistics?.applications))
    .filter((application) => application && typeof application === 'object')
    .map((application, index) => ({
      name: typeof application.application === 'string' && application.application.trim()
        ? application.application
        : 'Unknown application',
      activityCount: toFiniteNumber(application.activity_count),
      durationSeconds: Math.max(0, toFiniteNumber(application.total_duration_seconds)),
      color: APPLICATION_COLORS[index % APPLICATION_COLORS.length],
    }))

  const applicationDurationTotal = normalizeArray(applicationStats).reduce(
    (total, application) => total + application.durationSeconds,
    0,
  )
  const activityCount = statistics?.total_activities != null
    ? toFiniteNumber(statistics.total_activities)
    : normalizeArray(activities).length
  const trackedDurationSeconds = Math.max(
    0,
    statistics?.total_duration_seconds != null
      ? toFiniteNumber(statistics.total_duration_seconds)
      : applicationDurationTotal,
  )
  const safeActivities = normalizeArray(activities)
  const safeRecommendations = normalizeArray(recommendations)
  const weeklyActivity = getWeeklyActivity(safeActivities)
  const maxWeeklyHours = Math.max(8, ...normalizeArray(weeklyActivity).map((item) => item.hours))
  const hasWeeklyData = normalizeArray(weeklyActivity).some((item) => item.hours > 0)
  const breakdownWeightTotal = normalizeArray(applicationStats).reduce(
    (total, application) => total + (applicationDurationTotal > 0
      ? application.durationSeconds
      : application.activityCount),
    0,
  )

  let breakdownStart = 0
  const breakdownGradient = breakdownWeightTotal > 0
    ? normalizeArray(applicationStats).map((application) => {
      const weight = applicationDurationTotal > 0
        ? application.durationSeconds
        : application.activityCount
      const end = breakdownStart + (weight / breakdownWeightTotal) * 100
      const segment = `${application.color} ${breakdownStart.toFixed(2)}% ${end.toFixed(2)}%`
      breakdownStart = end
      return segment
    }).join(', ')
    : '#dcd8e6 0% 100%'

  const summary = {
    trackedTime: formatHours(trackedDurationSeconds),
    activities: activityCount,
    recommendations: safeRecommendations.length,
  }

  return (
    <div className="page-stack">
      <section className="page-heading-row">
        <div>
          <p className="eyebrow">Understand your work</p>
          <h1>Analytics</h1>
          <p className="page-lede">See where your time goes and where it could go instead.</p>
        </div>
        <button className="button button-secondary" type="button">
          Last 7 days <span className="button-chevron">⌄</span>
        </button>
      </section>

      {error && <p className="inline-error" role="alert">{error}</p>}

      <section className="stat-grid analytics-stat-grid">
        <StatCard label="Opportunity time" value={isLoading || error ? '—' : summary.trackedTime} detail="Across all applications" icon="◷" />
        <StatCard label="Opportunities" value={isLoading || error ? '—' : summary.activities} detail="In your Efficiency Log" icon="↗" tone="blue" />
        <StatCard label="Recommendations" value={isLoading || error ? '—' : summary.recommendations} detail="Ideas to improve your workflow" icon="⟳" tone="pink" />
        <StatCard label="Applications" value={isLoading || error ? '—' : applicationStats.length} detail="Included in your opportunity data" icon="✳" tone="amber" />
      </section>

      <section className="analytics-grid">
        <article className="section-panel chart-panel">
          <div className="section-heading">
            <div><p className="eyebrow">At a glance</p><h2>Opportunity Summary</h2></div>
            <span className="chart-unit">Hours tracked</span>
          </div>
          {isLoading ? (
            <div className="chart-empty">Preparing your opportunity summary…</div>
          ) : error ? (
            <div className="chart-empty">Your opportunity summary is unavailable until the connection is restored.</div>
          ) : hasWeeklyData ? (
            <div className="bar-chart" role="img" aria-label="Bar chart showing opportunity hours from the last seven days">
              <div className="chart-y-labels">
                <span>{maxWeeklyHours.toFixed(0)}h</span>
                <span>{(maxWeeklyHours * 0.75).toFixed(0)}h</span>
                <span>{(maxWeeklyHours * 0.5).toFixed(0)}h</span>
                <span>{(maxWeeklyHours * 0.25).toFixed(0)}h</span>
                <span>0</span>
              </div>
              <div className="chart-plot">
                <div className="chart-gridlines"><i /><i /><i /><i /><i /></div>
                <div className="chart-bars">
                  {normalizeArray(weeklyActivity).map((item, index) => (
                    <div className="chart-column" key={`${item.day}-${index}`}>
                      <div className="chart-bar-wrap">
                        <span
                          className="chart-bar"
                          style={{ height: `${(item.hours / maxWeeklyHours) * 100}%` }}
                          title={`${item.hours.toFixed(1)} hours`}
                        />
                      </div>
                      <span className="chart-day">{item.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="chart-empty">
              {safeActivities.length
                ? 'No dated opportunities with time details were found in the last seven days.'
                : 'Your opportunity summary will appear here after you add entries to the Efficiency Log.'}
            </div>
          )}
          <div className="chart-note"><span className="note-indicator" /> Opportunity Tracked <span className="chart-note-muted">· 7 day overview</span></div>
        </article>

        <article className="section-panel breakdown-panel">
          <div className="section-heading">
            <div><p className="eyebrow">Where you spend time</p><h2>Application breakdown</h2></div>
          </div>
          {isLoading ? (
            <div className="chart-empty">Loading application insights…</div>
          ) : error ? (
            <div className="chart-empty">Application insights are unavailable until the connection is restored.</div>
          ) : applicationStats.length ? (
            <>
              <div className="breakdown-visual">
                <div
                  className="donut-chart"
                  role="img"
                  aria-label="Application time breakdown"
                  style={{ background: `conic-gradient(${breakdownGradient})` }}
                />
                <div className="donut-center"><strong>{summary.trackedTime}</strong><span>total time</span></div>
              </div>
              <div className="breakdown-list">
                {normalizeArray(applicationStats).map((application, index) => {
                  const shareBasis = applicationDurationTotal > 0
                    ? application.durationSeconds
                    : application.activityCount
                  const share = breakdownWeightTotal > 0
                    ? Math.round((shareBasis / breakdownWeightTotal) * 100)
                    : 0

                  return (
                    <div className="breakdown-row" key={`${application.name}-${index}`}>
                      <span className="legend-dot" style={{ background: application.color }} />
                      <span className="breakdown-name">{application.name}</span>
                      <span className="breakdown-hours">{formatHours(application.durationSeconds)}</span>
                      <span className="breakdown-share">{share}%</span>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="chart-empty">Application insights will appear as opportunities are added to your Efficiency Log.</div>
          )}
        </article>
      </section>

      <section className="placeholder-note">
        <span className="note-spark">✳</span>
        <div>
          <strong>More insight is on the way</strong>
          <p>Detailed trends and app-by-app comparisons will help highlight where your time could be used more efficiently.</p>
        </div>
        <span className="coming-soon">COMING SOON</span>
      </section>
    </div>
  )
}

export default Analytics
