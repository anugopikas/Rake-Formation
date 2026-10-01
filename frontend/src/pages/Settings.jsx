import { ShieldCheck, Bell, UserCog, SlidersHorizontal } from 'lucide-react';

const sections = [
  { title: 'Profile', icon: UserCog },
  { title: 'Security', icon: ShieldCheck },
  { title: 'Notifications', icon: Bell },
  { title: 'Preferences', icon: SlidersHorizontal },
];

function Settings() {
  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">System</p>
          <h1>Profile and Settings</h1>
        </div>
      </div>

      <div className="settings-grid">
        {sections.map(({ title, icon: Icon }) => (
          <div key={title} className="detail-card">
            <div className="detail-card__top">
              <div className="settings-icon"><Icon size={18} /></div>
              <h3>{title}</h3>
            </div>
            <ul className="info-list">
              <li><span>Name</span><strong>Operations Manager</strong></li>
              <li><span>Email</span><strong>ops.manager@rakeformation.com</strong></li>
              <li><span>Role</span><strong>Operations Manager</strong></li>
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Settings;
