export default function LoadingState({ title = 'Loading data', subtitle = 'Please wait while we retrieve the latest operational information.' }) {
  return (
    <div className="loading-panel">
      <div className="spinner" aria-label="Loading" />
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}
