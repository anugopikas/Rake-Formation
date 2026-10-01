import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useState } from 'react';

export default function PageLayout({ user, onLogout, searchValue, onSearchChange }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      <div className="content-shell">
        <Header user={user} onLogout={onLogout} searchValue={searchValue} onSearchChange={onSearchChange} compact={false} />
        <main className="main-panel">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
