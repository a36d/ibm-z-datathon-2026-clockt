import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useClockt } from '../contexts/clocktContext.js'

function timeAgo(date, now) {
  if (!now) return 'recent'
  const minutes = Math.max(1, Math.floor((now - new Date(date).getTime()) / 60_000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function expiresIn(date, now) {
  if (!now) return '24 hours'
  const remaining = Math.max(0, new Date(date).getTime() - now)
  const hours = Math.floor(remaining / 3_600_000)
  const minutes = Math.floor((remaining % 3_600_000) / 60_000)
  return `${hours}h ${minutes}m left`
}

function savedHours(tips) {
  return tips.reduce((total, tip) => {
    const hours = tip.timeSaved.match(/([\d.]+)\s*hr/i)
    const minutes = tip.timeSaved.match(/([\d.]+)\s*min/i)
    return total + Number(hours?.[1] ?? 0) + Number(minutes?.[1] ?? 0) / 60
  }, 0)
}

function Dashboard() {
  const { workspace, storageError, clock, engageTip, resolveTip, engageConversation } = useClockt()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const activeTips = workspace.tips
    .filter((tip) => ['new', 'interacted'].includes(tip.status) && (!tip.expiresAt || !clock || new Date(tip.expiresAt).getTime() > clock))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, workspace.settings.maxRecommendations)
  const filteredTips = activeTips.filter((tip) => `${tip.application} ${tip.title} ${tip.activity} ${tip.suggestion}`.toLowerCase().includes(search.trim().toLowerCase()))
  const conversations = [...workspace.conversations].sort((a, b) => new Date(b.lastEngaged).getTime() - new Date(a.lastEngaged).getTime())
  const potentialHours = savedHours(activeTips)

  function openTip(tip) {
    engageTip(tip.id)
    setSelected({ type: 'tip', item: tip })
  }

  function acceptTip(tip) {
    engageTip(tip.id)
    resolveTip(tip.id, 'accepted')
    setSelected(null)
  }

  function openConversation(conversation) {
    engageConversation(conversation.id)
    setSelected({ type: 'conversation', item: conversation })
  }

  return (
    <div className="dashboard-stage">
      <header className="dashboard-brandbar">
        <Link to="/recommendations" className="dashboard-mode-link">AI suggestions</Link>
        <Link to="/" className="dashboard-wordmark">CLOCKT<span>✳</span></Link>
        <Link to="/settings" className="dashboard-preferences-link" aria-label="Open settings">✦</Link>
      </header>

      <div className="dashboard-body">
        <aside className="dashboard-rail">
          <label className="tip-search">
            <span>Tip search</span>
            <span className="tip-search-input"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></svg><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find an idea" /></span>
          </label>
          <div className="rail-feature"><span className="rail-feature-icon">✳</span><span>AI is learning your work patterns</span></div>
          <div className="rail-stat"><span>Tips found</span><strong>{activeTips.length}</strong><small>Prioritized for your workday</small></div>
          <div className="rail-stat rail-stat-saved"><span>Potential time back</span><strong>{potentialHours.toFixed(1)}<small> hrs</small></strong><small>Each week from these ideas</small></div>
          <div className="rail-foot"><span className="rail-live-dot" />Suggestions refresh as patterns emerge</div>
        </aside>

        <main className="dashboard-feed">
          <div className="feed-heading">
            <div><span className="dashboard-kicker">A little time back</span><h1>Ideas for a smoother day</h1><p>Small changes, chosen around the way you work.</p></div>
            <div className="ai-capacity"><span>AI PRIORITY QUEUE</span><strong>{activeTips.length} <i>/</i> {workspace.settings.maxRecommendations}</strong></div>
          </div>

          {storageError && <p className="dashboard-storage-error" role="alert">{storageError}</p>}

          <section className="tip-grid" aria-label="AI suggestions">
            {filteredTips.map((tip, index) => (
              <article className={`tip-card${tip.status === 'interacted' ? ' tip-card-engaged' : ''}`} key={tip.id}>
                <div className="tip-card-topline">
                  <div className="tip-app"><span className={`tip-app-mark tip-app-${index % 3}`}>{tip.appIcon}</span><span>{tip.application}</span></div>
                  <span className={`tip-priority${tip.priority >= 90 ? ' priority-high' : ''}`}>{tip.priority >= 90 ? 'HIGH IMPACT' : tip.category.toUpperCase()}</span>
                </div>
                <h2>{tip.title}</h2>
                <p className="tip-activity">{tip.activity}</p>
                <p className="tip-description">{tip.suggestion}</p>
                <div className="tip-card-meta"><span>{tip.repetitions} repeats</span><span className="tip-saved">↗ {tip.timeSaved} / week</span></div>
                {tip.expiresAt &&                 <p className="tip-expiry">Not accepted · removed in {expiresIn(tip.expiresAt, clock)}</p>}
                <div className="tip-actions">
                  <button className="tip-explore" type="button" onClick={() => openTip(tip)}>Explore with AI <span>→</span></button>
                  <button className="tip-dismiss" type="button" onClick={() => resolveTip(tip.id, 'dismissed')}>Not for me</button>
                </div>
              </article>
            ))}
            {!filteredTips.length && <div className="tip-empty"><span>✳</span><strong>{search ? 'No matching tips' : 'You’re all caught up'}</strong><p>{search ? 'Try another search phrase.' : 'Clockt will add new suggestions as it spots useful patterns.'}</p></div>}
          </section>

          <div className="past-conversations-heading"><div><span className="dashboard-kicker">Pick up where you left off</span><h2>Past conversations</h2></div><span className="conversation-sort">Sorted by recent engagement ↓</span></div>
          <section className="conversation-grid" aria-label="Past conversations">
            {conversations.slice(0, 4).map((conversation) => (
              <button className="conversation-card" type="button" key={conversation.id} onClick={() => openConversation(conversation)}>
                <span className="conversation-app">{conversation.application.slice(0, 1)}</span>
                <span className="conversation-copy"><strong>{conversation.title}</strong><small>{conversation.lastMessage}</small></span>
                <span className="conversation-time">{timeAgo(conversation.lastEngaged, clock)} <b>→</b></span>
              </button>
            ))}
            {!conversations.length && <p className="conversation-empty">Your AI conversations will show up here.</p>}
          </section>
          <div className="dashboard-bottom-note">Unaccepted tips you interact with are kept for 24 hours, then cleaned up automatically.</div>
        </main>
      </div>

      {selected && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}>
          <section className="conversation-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <button className="dialog-close" type="button" onClick={() => setSelected(null)} aria-label="Close dialog">×</button>
            <span className="dialog-spark">✳</span>
            <span className="dashboard-kicker">{selected.type === 'tip' ? 'AI suggestion' : selected.item.application}</span>
            <h2 id="dialog-title">{selected.item.title}</h2>
            <p>{selected.type === 'tip' ? selected.item.suggestion : selected.item.lastMessage}</p>
            <div className="dialog-preview-note">Conversation preview · Connect Clockt to your AI service to continue chatting.</div>
            {selected.type === 'tip' && selected.item.status !== 'accepted' && <button className="button button-primary dialog-accept" type="button" onClick={() => acceptTip(selected.item)}>I’ll try this</button>}
          </section>
        </div>
      )}
    </div>
  )
}

export default Dashboard
