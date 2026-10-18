import { useEffect, useMemo, useState } from 'react'
import RecommendationCard from '../components/RecommendationCard.jsx'
import { getRecommendations } from '../services/api.js'

function Recommendations() {
  const [recommendations, setRecommendations] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All ideas')
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    getRecommendations()
      .then((items) => { if (isMounted) setRecommendations(items) })
      .catch(() => { if (isMounted) setError('We couldn’t load recommendations. Please try again.') })
    return () => { isMounted = false }
  }, [])

  const filteredRecommendations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return recommendations.filter((item) => {
      const matchesFilter = filter === 'All ideas' || item.category === filter
      const matchesSearch = !normalizedSearch || `${item.application} ${item.activity} ${item.suggestion}`.toLowerCase().includes(normalizedSearch)
      return matchesFilter && matchesSearch
    })
  }, [filter, recommendations, search])

  function dismissRecommendation(id) {
    setRecommendations((current) => current.filter((item) => item.id !== id))
  }

  return (
    <div className="page-stack">
      <section className="page-heading-row recommendations-heading">
        <div><p className="eyebrow">Good work, made a little easier</p><h1>Your opportunities</h1><p className="page-lede">Thoughtful suggestions based on the patterns in your workday.</p></div>
        <div className="opportunity-summary"><span className="summary-spark">✳</span><div><strong>{recommendations.length} ideas</strong><small>could give you time back</small></div></div>
      </section>
      <section className="recommendation-toolbar">
        <label className="search-field"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></svg><span className="sr-only">Search recommendations</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search recommendations…" /></label>
        <label className="filter-select"><span className="sr-only">Filter recommendations</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option>All ideas</option><option>Automation</option><option>Workflow</option></select></label>
      </section>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <div className="recommendation-grid">
        {filteredRecommendations.map((recommendation) => <RecommendationCard key={recommendation.id} recommendation={recommendation} onDismiss={dismissRecommendation} />)}
      </div>
      {!filteredRecommendations.length && !error && <div className="empty-state recommendation-empty"><span>✳</span><strong>No ideas found</strong><p>Try a different search, or update your filters.</p></div>}
      <p className="recommendation-disclaimer">Clockt suggestions are generated from activity patterns. You’re always in control of which ideas to try.</p>
    </div>
  )
}

export default Recommendations