import RecommendationCard from './RecommendationCard';

/**
 * RecommendationList Component
 *
 * Renders the AI summary banner and a list of recommendation cards.
 * Shows an empty state when no results match.
 *
 * @param {Object} props
 * @param {Array} props.recommendations
 * @param {string} props.summary
 * @param {number} props.totalFiltered
 * @param {string} [props.warning] - Fallback warning when LLM is unavailable
 */
export default function RecommendationList({
  recommendations = [],
  summary = '',
  totalFiltered = 0,
  warning = '',
}) {
  // Empty state
  if (recommendations.length === 0) {
    return (
      <section className="results-section" aria-label="No results">
        <div className="empty-state">
          <div className="empty-state-icon">🍽️</div>
          <h2 className="empty-state-title">No restaurants found</h2>
          <p className="empty-state-text">
            No restaurants matched your preferences. Try selecting a different neighborhood,
            adjusting your budget, or broadening your cuisine filters.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="results-section" aria-label="Restaurant recommendations">
      {/* Header */}
      <div className="results-header">
        <h2 className="results-title">
          <span className="gradient-text">Top Picks</span> for You
        </h2>
        <p className="results-count">
          {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''} from{' '}
          {totalFiltered} matching restaurant{totalFiltered !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Fallback warning */}
      {warning && (
        <div className="ai-summary-banner" role="alert" style={{ borderColor: 'rgba(255, 180, 171, 0.2)', background: 'rgba(255, 180, 171, 0.05)' }}>
          <p className="ai-summary-text" style={{ color: 'var(--error)' }}>
            ⚠️ {warning}
          </p>
        </div>
      )}

      {/* AI Summary */}
      {summary && !warning && (
        <div className="ai-summary-banner">
          <div className="ai-summary-label">
            <span>✨</span> AI Summary
          </div>
          <p className="ai-summary-text">{summary}</p>
        </div>
      )}

      {/* Cards */}
      <div className="rec-cards-list">
        {recommendations.map((rec, idx) => (
          <RecommendationCard
            key={rec.rank || idx}
            rank={rec.rank}
            name={rec.name}
            cuisine={rec.cuisine}
            rating={rec.rating}
            estimatedCost={rec.estimatedCost}
            explanation={rec.explanation}
            index={idx}
          />
        ))}
      </div>
    </section>
  );
}
