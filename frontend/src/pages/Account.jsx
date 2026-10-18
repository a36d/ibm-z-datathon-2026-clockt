import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useClockt } from '../contexts/clocktContext.js'

function Account() {
  const { workspace, updateProfile } = useClockt()
  const [mode, setMode] = useState('signup')
  const [fullName, setFullName] = useState(workspace.profile.fullName)
  const [email, setEmail] = useState(workspace.profile.email)
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState('')

  function submit(event) {
    event.preventDefault()
    if (mode === 'signup' && !fullName.trim()) {
      setNotice('Enter your full name to create a profile.')
      return
    }
    updateProfile({ fullName: mode === 'signup' ? fullName.trim() : workspace.profile.fullName, email: email.trim() })
    setPassword('')
    setNotice('Preview profile updated. Authentication is not enabled yet, so your password was not saved.')
  }

  return (
    <div className="account-page">
      <section className="account-card">
        <Link to="/" className="account-brand"><span className="brand-mark"><span /></span> clockt<span>.</span></Link>
        <span className="dashboard-kicker">Your time, thoughtfully managed</span>
        <h1>{mode === 'signup' ? 'Make room for what matters.' : 'Welcome back.'}</h1>
        <p className="account-lede">Create a Clockt preview profile to personalize the ideas you see.</p>
        <div className="account-tabs" role="tablist" aria-label="Account access">
          <button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setNotice('') }}>Create account</button>
          <button hidden type="button" role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'active' : ''} onClick={() => { setMode('signin'); setNotice('') }}>Sign in</button>
        </div>
        <form className="account-form" onSubmit={submit}>
          {mode === 'signup' && <label className="field-group"><span>Full name</span><input autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" required /></label>}
          <label className="field-group"><span>Email address</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
          <label className="field-group"><span>Password</span><input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength="8" placeholder="At least 8 characters" required /></label>
          <button className="button button-primary account-submit" type="submit">{mode === 'signup' ? 'Create preview profile' : 'Continue in preview'} <span>→</span></button>
        </form>
        {notice && <p className="account-notice" role="status">{notice}</p>}
        <p className="account-safety">Preview only · Credentials are not sent to a service or stored on this device.</p>
      </section>
    </div>
  )
}

export default Account
