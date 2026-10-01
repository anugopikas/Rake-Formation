export default function KPICard({ title, value, change, description, icon: Icon, tone = 'primary' }) {
  return (
    <div className="kpi-card">
      <div className="kpi-card__top">
        <div className={`kpi-icon kpi-icon--${tone}`}>
          <Icon size={18} />
        </div>
        <span className="trend-pill">{change}</span>
      </div>
      <div className="kpi-card__body">
        <p>{title}</p>
        <h3>{value}</h3>
        <small>{description}</small>
      </div>
    </div>
  );
}
