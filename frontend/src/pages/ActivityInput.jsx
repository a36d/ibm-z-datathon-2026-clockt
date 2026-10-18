import { useEffect, useState } from 'react'
import { analyzeActivities, getActivities } from '../services/api.js'

function ActivityInput() {
  const [activities, setActivities] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [application, setApplication] = useState('')
  const [activity, setActivity] = useState('')
  const [duration, setDuration] = useState('')
  const [message, setMessage] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    getActivities()
      .then((items) => { if (isMounted) setActivities(items) })
      .catch(() => { if (isMounted) setError('We couldn’t load your activity log. Please try again.') })
      .finally(() => { if (isMounted) setIsLoading(false) })
    return () => { isMounted = false }
  }, [])

  function addActivity(event) {
    event.preventDefault()
    const minutes = Number(duration)
    if (!application || !activity.trim() || !Number.isFinite(minutes) || minutes <= 0) {
      setError('Choose an application, describe the activity, and enter a duration greater than zero.')
      return
    }
    setActivities((current) => [{
      id: `${Date.now()}`,
      application,
      activity: activity.trim(),
      duration: minutes,
      date: 'Just now',
    }, ...current])
    setApplication('')
    setActivity('')
    setDuration('')
    setMessage('Activity added to your log.')
    setError('')
  }

  function deleteSelected() {
    if (!selectedIds.length) {
      setError('Select at least one activity to delete.')
      return
    }
    setActivities((current) => current.filter((item) => !selectedIds.includes(item.id)))
    setSelectedIds([])
    setMessage('Selected activities deleted.')
    setError('')
  }

  async function runAnalysis() {
    setIsAnalyzing(true)
    setError('')
    setMessage('')
    try {
      const result = await analyzeActivities(activities)
      setMessage(`Analysis complete — ${result.activitiesAnalyzed} activities reviewed and ${result.repeatedActivities} repeated patterns identified.`)
    } catch {
      setError('We couldn’t analyze these activities. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  function toggleSelected(id) {
    setSelectedIds((current) => current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id])
  }

  return (
    <div className="page-stack">
      <section className="page-heading-row">
        <div><p className="eyebrow">Capture the everyday</p><h1>Activity log</h1><p className="page-lede">Add a few examples of how your time is spent. We’ll look for patterns.</p></div>
        <div className="tracked-badge"><span className="status-dot" /> Manual entry mode</div>
      </section>
      <section className="section-panel entry-panel">
        <div className="section-heading"><div><p className="eyebrow">A quick note is all it takes</p><h2>Add an activity</h2></div></div>
        <form className="activity-form" onSubmit={addActivity}>
          <label className="field-group"><span>Application</span><select value={application} onChange={(event) => setApplication(event.target.value)} required><option value="" disabled>Select an app</option><option>Google Sheets</option><option>Slack</option><option>Notion</option><option>Email</option><option>Other</option></select></label>
          <label className="field-group activity-field"><span>What did you do?</span><input value={activity} onChange={(event) => setActivity(event.target.value)} placeholder="e.g. Copy weekly report data" required /></label>
          <label className="field-group duration-field"><span>Duration</span><div className="input-with-suffix"><input type="number" min="1" step="1" value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="15" required /><span>min</span></div></label>
          <button className="button button-primary form-add-button" type="submit"><span className="button-plus">+</span> Add activity</button>
        </form>
        <p className="form-helper">Your activity stays private and is only used to find helpful patterns.</p>
        {error && <p className="inline-error" role="alert">{error}</p>}
        {message && <p className="inline-success" role="status">{message}</p>}
      </section>
      <section className="section-panel log-panel">
        <div className="section-heading">
          <div><p className="eyebrow">Your workspace</p><h2>Recent entries <span className="heading-count">{activities.length}</span></h2></div>
          <div className="log-actions"><button className="button button-delete" type="button" onClick={deleteSelected}>Delete selected</button><button className="button button-primary" type="button" onClick={runAnalysis} disabled={isAnalyzing}>{isAnalyzing ? 'Analyzing…' : '✳ Analyze activities'}</button></div>
        </div>
        <div className="activity-table-wrap">
          <table className="activity-table">
            <thead><tr><th className="check-cell"><span className="sr-only">Select</span></th><th>Activity</th><th>Application</th><th>Duration</th><th>Added</th></tr></thead>
            <tbody>{activities.map((item) => (
              <tr key={item.id}>
                <td className="check-cell"><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelected(item.id)} aria-label={`Select ${item.activity}`} /></td>
                <td><strong>{item.activity}</strong></td><td>{item.application}</td><td>{item.duration} min</td><td className="table-date">{item.date}</td>
              </tr>
            ))}</tbody>
          </table>
          {!activities.length && <div className="empty-state"><span>◷</span><strong>{isLoading ? 'Loading activity…' : 'No activities yet'}</strong><p>{isLoading ? 'Your recent entries will appear here.' : 'Add an activity above to start spotting patterns.'}</p></div>}
        </div>
      </section>
    </div>
  )
}

export default ActivityInput