import { useMemo } from "react";

function PageShell({ title, subtitle, rightAction, children, error }) {
  const header = useMemo(() => ({ title, subtitle }), [title, subtitle]);

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>{header.title}</h1>
          <p>{header.subtitle}</p>
        </div>
        {rightAction ? <div>{rightAction}</div> : null}
      </div>

      {error ? <div className="error-box">⚠️ {error}</div> : null}
      {children}
    </div>
  );
}

export default PageShell;
