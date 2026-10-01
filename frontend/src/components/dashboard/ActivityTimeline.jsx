export default function ActivityTimeline({ items = [] }) {
  return (
    <div className="panel-card">
      <div className="section-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h3>Recent Activity</h3>
        </div>
      </div>

      <div className="timeline">
        {items.length ? items.map((item) => (
          <div key={item.id} className="timeline-item">
            <div className="timeline-dot" />
            <div className="timeline-content">
              <div className="timeline-topline">
                <strong>{item.action}</strong>
                <span>{item.status}</span>
              </div>
              <p>{item.user}</p>
              <small>{item.time}</small>
            </div>
          </div>
        )) : (
          <div className="empty-inline">No recent activity available.</div>
        )}
      </div>
    </div>
  );
}
