import { useState } from 'react'
import { useClockt } from '../contexts/clocktContext.js'

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} bytes`
  return `${(bytes / 1024).toFixed(1)} KB`
}

function Settings() {
  const { workspace, clock, updateSettings, clearHistory, cleanExpired, getStorageBytes } = useClockt()
  const [notice, setNotice] = useState('')
  const { settings } = workspace
  const dataSize = getStorageBytes()
  const pendingCleanup = workspace.tips.filter((tip) => tip.expiresAt && clock && new Date(tip.expiresAt).getTime() <= clock).length
  const interactedTips = workspace.tips.filter((tip) => tip.status === 'interacted' || tip.status === 'dismissed').length

  function cleanData() {
    if (!window.confirm('Remove expired preview suggestions and clear all saved conversation previews?')) return
    cleanExpired()
    clearHistory()
    setNotice('Expired preview suggestions and conversation previews were cleared. Your active suggestions and preferences were kept.')
  }

  function toggleGoal(goal) {
    const goals = settings.goals.includes(goal)
      ? settings.goals.filter((item) => item !== goal)
      : [...settings.goals, goal]
    updateSettings({ goals })
  }

  return (
    <div className="page-stack settings-page">
      <section className="page-heading-row">
        <div><p className="eyebrow">Make Clockt yours</p><h1>Settings</h1><p className="page-lede">Personalize your AI suggestions and choose how your data is managed.</p></div>
        <div className="privacy-badge"><span>◈</span> Your data stays yours</div>
      </section>
      {notice && <p className="inline-success settings-notice" role="status">{notice}</p>}
      <div className="settings-layout">
        <aside className="settings-nav" aria-label="Settings sections"><a href="#personalize">Personalize</a><a href="#ai-settings">AI preferences</a><a href="#privacy">Privacy & data</a><a href="#storage">Storage & cleanup</a></aside>
        <div className="settings-sections">
          <section className="section-panel settings-card" id="personalize">
            <div className="settings-card-heading"><div className="settings-icon purple">✦</div><div><h2>Personalize your account</h2><p>Give Clockt a little context to make its ideas more relevant.</p></div></div>
            <div className="personalization-grid">
              <label className="field-group"><span>Your role</span><select value={settings.workRole} onChange={(event) => updateSettings({ workRole: event.target.value })}><option value="">Choose a role</option><option>Operations</option><option>Engineering</option><option>Design</option><option>Marketing</option><option>Sales</option><option>Student</option><option>Other</option></select></label>
              <label className="field-group"><span>How do you work?</span><select value={settings.workStyle} onChange={(event) => updateSettings({ workStyle: event.target.value })}><option value="">Choose a work style</option><option>Mostly independent</option><option>Highly collaborative</option><option>Meeting-heavy</option><option>Deep-focus blocks</option><option>A mix of everything</option></select></label>
            </div>
            <fieldset className="goal-options">
              <legend>What would you like more time for?</legend>
              {['Focused work', 'Creative thinking', 'Time with my team', 'Learning'].map((goal) => <label key={goal}><input type="checkbox" checked={settings.goals.includes(goal)} onChange={() => toggleGoal(goal)} />{goal}</label>)}
            </fieldset>
            <p className="settings-helper">Preview controls · Preferences are saved locally and do not yet change live recommendations.</p>
          </section>

          <section className="section-panel settings-card" id="ai-settings">
            <div className="settings-card-heading"><div className="settings-icon pink">✳</div><div><h2>AI suggestion preferences · Preview</h2><p>Preview controls for prioritizing and displaying improvement ideas.</p></div></div>
            <label className="range-setting"><span><strong>Suggestion sensitivity</strong><small>Higher sensitivity prioritizes more productivity opportunities.</small></span><span className="range-value">{settings.sensitivity}%</span><input type="range" min="0" max="100" value={settings.sensitivity} onChange={(event) => updateSettings({ sensitivity: Number(event.target.value) })} /></label>
            <label className="settings-row max-recommendations"><span><strong>Maximum recommendations at a time</strong><p>Preview setting for how many ideas appear in the priority queue.</p></span><select value={settings.maxRecommendations} onChange={(event) => updateSettings({ maxRecommendations: Number(event.target.value) })}><option value="3">3 recommendations</option><option value="4">4 recommendations</option><option value="6">6 recommendations</option><option value="10">10 recommendations</option></select></label>
          </section>

          <section className="section-panel settings-card" id="privacy">
            <div className="settings-card-heading"><div className="settings-icon blue">◇</div><div><h2>Privacy & data</h2><p>Understand what Clockt stores and how it is used.</p></div></div>
            <div className="privacy-explanation"><strong>Data handling in this preview</strong><p>Opportunity entries are sent to your configured API service. Preferences and conversation previews are saved locally in this browser. Passwords are never stored here.</p></div>
            <label className="cleanup-toggle"><span><strong>Automatically remove expired suggestions · Preview</strong><small>Remove unaccepted preview suggestions 24 hours after you interact with them.</small></span><input type="checkbox" checked={settings.autoClean} onChange={(event) => updateSettings({ autoClean: event.target.checked })} /></label>
          </section>

          <section className="section-panel settings-card" id="storage">
            <div className="settings-card-heading"><div className="settings-icon amber">▤</div><div><h2>Storage & cleanup</h2><p>Review and manage the data saved by this workspace.</p></div></div>
            <div className="storage-summary">
              <div><span>Workspace data</span><strong>{formatBytes(dataSize)}</strong></div>
              <div><span>Conversation previews</span><strong>{workspace.conversations.length}</strong></div>
              <div><span>Unaccepted preview suggestions</span><strong>{interactedTips}</strong></div>
              <div><span>Expired, awaiting cleanup</span><strong>{pendingCleanup}</strong></div>
              <div className="storage-progress"><span style={{ width: `${Math.min(100, Math.max(4, (dataSize / (1024 * 1024)) * 100))}%` }} /></div>
              <small>Approximate size of Clockt workspace preferences and suggestion history on this device.</small>
            </div>
            <div className="settings-row storage-clean-row"><div><strong>Clean local preview data</strong><p>Remove expired preview suggestions and saved conversation previews. Your active suggestions and preferences remain.</p></div><button className="button button-delete" type="button" onClick={cleanData}>Clean now</button></div>
          </section>
          <p className="settings-footnote">Clockt desktop preview <span>·</span> Workspace data stays on this device.</p>
        </div>
      </div>
    </div>
  )
}

export default Settings
