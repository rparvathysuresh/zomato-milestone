'use client';

import { useState } from 'react';

/**
 * RecommendationCard Component
 *
 * Glassmorphism card displaying a single restaurant recommendation
 * with rank badge, rating, cost, cuisine tags, and AI explanation.
 *
 * @param {Object} props
 * @param {number} props.rank
 * @param {string} props.name
 * @param {string|string[]} props.cuisine
 * @param {number} props.rating
 * @param {string} props.estimatedCost
 * @param {string} props.explanation
 * @param {number} props.index - For staggered animation delay
 */
export default function RecommendationCard({
  rank,
  name,
  cuisine,
  rating,
  estimatedCost,
  explanation,
  index = 0,
}) {
  const [expanded, setExpanded] = useState(false);

  // Parse cuisine into an array for tag rendering
  const cuisineTags = Array.isArray(cuisine)
    ? cuisine
    : typeof cuisine === 'string'
      ? cuisine.split(',').map((c) => c.trim()).filter(Boolean)
      : [];

  // Truncate long explanations
  const MAX_EXPLANATION_LENGTH = 180;
  const isLong = explanation && explanation.length > MAX_EXPLANATION_LENGTH;
  const displayExplanation = expanded
    ? explanation
    : isLong
      ? explanation.slice(0, MAX_EXPLANATION_LENGTH) + '…'
      : explanation;

  // Generate star display
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.25;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <article
      className={`rec-card glass-card stagger-${Math.min(index + 1, 5)}`}
      id={`rec-card-${rank}`}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="rec-card-header">
        {/* Rank Badge */}
        <div className="rec-rank-badge" aria-label={`Rank ${rank}`}>
          {rank}
        </div>

        {/* Info */}
        <div className="rec-card-info">
          <h3 className="rec-card-name">{name}</h3>

          <div className="rec-card-meta">
            {/* Stars */}
            <span className="rec-rating" aria-label={`Rating ${rating} out of 5`}>
              {Array.from({ length: fullStars }, (_, i) => (
                <span key={`full-${i}`} className="star">★</span>
              ))}
              {hasHalf && <span className="star">★</span>}
              {Array.from({ length: emptyStars }, (_, i) => (
                <span key={`empty-${i}`} className="star" style={{ opacity: 0.25 }}>★</span>
              ))}
              <span style={{ marginLeft: '4px' }}>{rating}</span>
            </span>

            {/* Cost */}
            <span className="rec-cost-pill">{estimatedCost}</span>
          </div>

          {/* Cuisine Tags */}
          {cuisineTags.length > 0 && (
            <div className="rec-cuisine-tags">
              {cuisineTags.map((tag) => (
                <span key={tag} className="rec-cuisine-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Explanation */}
      {explanation && (
        <div className="rec-explanation">
          <p>{displayExplanation}</p>
          {isLong && (
            <button
              type="button"
              className="rec-explanation-toggle"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
            >
              {expanded ? '← Show less' : 'Read more →'}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
