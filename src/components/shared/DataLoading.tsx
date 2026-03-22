/** Small inline loading indicator — reuses the existing loading-dot animation. */
export default function DataLoading() {
  return (
    <div className="data-loading">
      <span className="loading-dot" />
      <span className="loading-dot" />
      <span className="loading-dot" />
    </div>
  );
}
