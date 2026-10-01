export default function BrandLogo({ compact = false, dark = false }) {
  return (
    <div className={`brand-logo ${compact ? 'brand-logo--compact' : ''} ${dark ? 'brand-logo--dark' : ''}`} aria-label="RAKE FORMATION">
      <svg className="brand-logo__mark" viewBox="0 0 48 48" role="img" aria-hidden="true">
        <path d="M9 37V11h12.5a8.5 8.5 0 0 1 0 17H9m10-10 12 19M27 11h12M30 20h8M31 29h7" />
        <path className="brand-logo__rail" d="M6 41h36M6 45h36" />
        <circle cx="12" cy="41" r="2" />
        <circle cx="36" cy="41" r="2" />
      </svg>
      {!compact ? (
        <span className="brand-logo__copy">
          <strong>RAKE</strong>
          <small>FORMATION</small>
        </span>
      ) : null}
    </div>
  );
}
