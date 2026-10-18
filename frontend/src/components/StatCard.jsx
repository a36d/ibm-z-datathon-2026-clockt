function StatCard({ label, value, detail, icon, tone = 'violet' }) {
  return (
    <article className="stat-card">
      <div className="stat-topline">
        <span className="stat-label">{label}</span>
        <span className={`stat-icon ${tone}`} aria-hidden="true">{icon}</span>
      </div>
      <div className="stat-value">{value}</div>
      <p className="stat-detail">{detail}</p>
    </article>
  )
}

export default StatCard
