/**
 * LoadingSpinner Component
 *
 * Displays skeleton cards with shimmer animation while
 * the API request is in progress.
 */
export default function LoadingSpinner() {
  return (
    <section className="loading-section" aria-busy="true" aria-label="Loading recommendations">
      <p className="loading-text">Finding your perfect restaurants…</p>
      <div className="skeleton-cards">
        <div className="skeleton-card" />
        <div className="skeleton-card" style={{ animationDelay: '0.2s' }} />
        <div className="skeleton-card" style={{ animationDelay: '0.4s' }} />
      </div>
    </section>
  );
}
