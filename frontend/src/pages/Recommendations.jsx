import { useEffect, useMemo, useState } from 'react'
import RecommendationCard from '../components/RecommendationCard.jsx'
import { getRecommendations } from '../services/api.js'

function normalizeRecommendations(response) {
  if (!Array.isArray(response)) {
    throw new Error('Recommendations response must be an array.')
  }

  return response
    .filter((item) => item !== null && typeof item === 'object' && !Array.isArray(item))
    .map((item, index) => ({
      ...item,
      id: item.id ?? `recommendation-${index}`,
      appIcon: typeof item.appIcon === 'string' ? item.appIcon : '✳',
      application: typeof item.application === 'string' ? item.application : '',
      activity: typeof item.activity === 'string' ? item.activity : '',
      priority: typeof item.priority === 'string' || typeof item.priority === 'number'
        ? String(item.priority)
        : '',
      timeLost: typeof item.timeLost === 'string' ? item.timeLost : '',
      timeSaved: typeof item.timeSaved === 'string' ? item.timeSaved : '',
      suggestion: typeof item.suggestion === 'string' ? item.suggestion : '',
      category: typeof item.category === 'string' ? item.category : '',
    }))
}

function Recommendations() {
  const [recommendations, setRecommendations] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All ideas')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    getRecommendations()
      .then((response) => {
        const items = normalizeRecommendations(response)
        if (isMounted) setRecommendations(items)
      })
      .catch(() => {
        if (isMounted) {
          setError('We couldn’t load recommendations. Please try again.')
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const filteredRecommendations = useMemo(() => {
    const items = Array.isArray(recommendations) ? recommendations : []
    const normalizedSearch = typeof search === 'string' ? search.trim().toLowerCase() : ''

    return items.filter((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return false

      const searchableText = [item.application, item.activity, item.suggestion]
        .filter((value) => typeof value === 'string')
        .join(' ')
        .toLowerCase()
      const matchesFilter = filter === 'All ideas' || item.category === filter
      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch)

      return matchesFilter && matchesSearch
    })
  }, [filter, recommendations, search])

  function dismissRecommendation(id) {
    setRecommendations((current) =>
      (Array.isArray(current) ? current : []).filter((item) => item?.id !== id),
    )
  }

  const hasRecommendations = Array.isArray(recommendations) && recommendations.length > 0

  return (
    <div className="page-stack">
      <section className="page-heading-row recommendations-heading">
        <div>
          <p className="eyebrow">Practical ways to work more efficiently</p>
          <h1>Recommendations</h1>
          <p className="page-lede">
            Ideas to simplify repeated work and make more time for what matters.
          </p>
        </div>
        <div className="opportunity-summary">
          <span className="summary-spark">✳</span>
          <div>
            <strong>
              {error
                ? 'Unavailable'
                : isLoading
                  ? 'Loading…'
                  : `${recommendations.length} recommendations`}
            </strong>
            <small>from your Efficiency Log</small>
          </div>
        </div>
      </section>

      <section className="recommendation-toolbar">
        <label className="search-field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m16 16 4 4" />
          </svg>
          <span className="sr-only">Search recommendations</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search recommendations…"
          />
        </label>
        <label className="filter-select">
          <span className="sr-only">Filter recommendations</span>
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option>All ideas</option>
            <option>Automation</option>
            <option>Workflow</option>
          </select>
        </label>
      </section>

      {error && <p className="inline-error" role="alert">{error}</p>}

      <div className="recommendation-grid">
        {(Array.isArray(filteredRecommendations) ? filteredRecommendations : []).map(
          (recommendation, index) => (
            <RecommendationCard
              key={recommendation.id ?? `recommendation-${index}`}
              recommendation={recommendation}
              onDismiss={dismissRecommendation}
            />
          ),
        )}
      </div>

      {!isLoading && !error && filteredRecommendations.length === 0 && (
        <div className="empty-state recommendation-empty">
          <span>✳</span>
          <strong>
            {hasRecommendations
              ? 'No recommendations match your search'
              : 'Recommendations will appear here'}
          </strong>
          <p>
            {hasRecommendations
              ? 'Try another search or filter to see more opportunities.'
              : 'Add opportunities to your Efficiency Log. Recommendations appear after repeated opportunities are detected.'}
          </p>
        </div>
      )}

      {isLoading && !error && (
        <p className="chart-empty">Loading recommendations…</p>
      )}

      <p className="recommendation-disclaimer">
        Recommendations highlight productivity opportunities and practical
        efficiency improvements. You choose which ideas to try.
      </p>
    </div>
  )
}

export default Recommendations
