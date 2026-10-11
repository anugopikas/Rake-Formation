import { AlertTriangle, CircleAlert, Info, PackageCheck, TrainFront } from 'lucide-react';
import { Link } from 'react-router-dom';

const severityDetails = {
  CRITICAL: { label: 'Critical', icon: CircleAlert },
  HIGH: { label: 'High Priority', icon: AlertTriangle },
  WARNING: { label: 'Warning', icon: AlertTriangle },
  INFO: { label: 'Info', icon: Info },
};

const actionIcons = {
  '/inventory': PackageCheck,
  '/rake-plans': TrainFront,
  '/orders': CircleAlert,
};

export default function OperationalAlerts({ alerts, loading = false, notice = '' }) {
  return (
    <div className="panel-card operational-alerts">
      <div className="section-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h3>Operational Alerts</h3>
        </div>
      </div>
      {notice ? <p className="dashboard-data-notice">{notice}</p> : null}
      {loading ? (
        <div className="alerts-loading" role="status" aria-label="Loading operational alerts">
          <span />
          <span />
          <span />
        </div>
      ) : (
        <div className="operational-alert-list">
          {alerts.map((alert) => {
            const severity = String(alert.severity || 'INFO').toUpperCase();
            const details = severityDetails[severity] || severityDetails.INFO;
            const SeverityIcon = details.icon;
            const ActionIcon = actionIcons[alert.action_url] || CircleAlert;

            return (
              <article className={`operational-alert operational-alert--${severity.toLowerCase()}`} key={alert.id}>
                <span className="operational-alert__icon" aria-hidden="true">
                  <SeverityIcon size={18} />
                </span>
                <div className="operational-alert__body">
                  <div className="operational-alert__heading">
                    <h4>{alert.title}</h4>
                    <span className={`operational-alert__badge operational-alert__badge--${severity.toLowerCase()}`}>
                      {details.label}
                    </span>
                  </div>
                  <p>{alert.message}</p>
                  <div className="operational-alert__meta">
                    <time>{alert.time}</time>
                    {alert.action_url ? (
                      <Link className="operational-alert__action" to={alert.action_url}>
                        <ActionIcon size={14} />
                        {alert.action_label || 'View details'}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
