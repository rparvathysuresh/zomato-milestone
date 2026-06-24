'use client';

import { useState } from 'react';
import { SUPPORTED_CITIES, BUDGET_TIERS, BUDGET_LABELS } from '@/utils/constants';

/**
 * Capitalize a location name for display.
 * e.g. "koramangala 5th block" → "Koramangala 5th Block"
 */
function capitalizeLocation(loc) {
  return loc
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Popular cuisines shown as chip toggles */
const POPULAR_CUISINES = [
  'North Indian',
  'South Indian',
  'Chinese',
  'Italian',
  'Pan Asian',
  'Continental',
  'Biryani',
  'Fast Food',
  'Cafe',
  'Desserts',
  'Street Food',
  'Mexican',
];

/**
 * PreferenceForm Component
 *
 * Inputs: Location dropdown, Budget pills, Cuisine chips,
 * Min-rating slider, and a submit button.
 *
 * @param {Object} props
 * @param {(prefs: object) => void} props.onSubmit
 * @param {boolean} props.loading
 */
export default function PreferenceForm({ onSubmit, loading }) {
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [minRating, setMinRating] = useState(3.5);
  const [errors, setErrors] = useState({});

  const toggleCuisine = (cuisine) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
  };

  const validate = () => {
    const newErrors = {};
    if (!location) newErrors.location = 'Please select a neighborhood';
    if (!budget) newErrors.budget = 'Please select a budget';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate() || loading) return;

    const prefs = {
      location,
      budget,
      minRating: Number(minRating),
    };

    // Send first selected cuisine (API expects a single string)
    if (selectedCuisines.length > 0) {
      prefs.cuisine = selectedCuisines[0];
    }

    onSubmit(prefs);
  };

  return (
    <form
      className="preference-form glass-card-elevated"
      onSubmit={handleSubmit}
      noValidate
      id="preference-form"
    >
      {/* ── Location Dropdown ──────────────────────────────────────────── */}
      <div className="form-group">
        <label className="form-label" htmlFor="location-select">
          Neighborhood
        </label>
        <div className="form-select-wrapper">
          <span className="select-icon" aria-hidden="true">
            📍
          </span>
          <select
            id="location-select"
            className="form-select"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              if (errors.location) setErrors((prev) => ({ ...prev, location: '' }));
            }}
          >
            <option value="">Select a neighborhood…</option>
            {SUPPORTED_CITIES.map((city) => (
              <option key={city} value={city}>
                {capitalizeLocation(city)}
              </option>
            ))}
          </select>
          <span className="chevron-icon" aria-hidden="true">
            ▾
          </span>
        </div>
        {errors.location && (
          <span className="validation-error" role="alert">
            ⚠ {errors.location}
          </span>
        )}
      </div>

      {/* ── Budget Pills ───────────────────────────────────────────────── */}
      <div className="form-group">
        <label className="form-label">Budget for Two</label>
        <div className="budget-pills" role="radiogroup" aria-label="Budget for two">
          {BUDGET_TIERS.map((tier) => (
            <button
              key={tier}
              type="button"
              role="radio"
              aria-checked={budget === tier}
              className={`budget-pill${budget === tier ? ' active' : ''}`}
              onClick={() => {
                setBudget(tier);
                if (errors.budget) setErrors((prev) => ({ ...prev, budget: '' }));
              }}
              id={`budget-${tier}`}
            >
              {tier === 'low' ? '₹' : tier === 'medium' ? '₹₹' : '₹₹₹'} (
              {tier.charAt(0).toUpperCase() + tier.slice(1)})
            </button>
          ))}
        </div>
        {errors.budget && (
          <span className="validation-error" role="alert">
            ⚠ {errors.budget}
          </span>
        )}
      </div>

      {/* ── Cuisine Chips ──────────────────────────────────────────────── */}
      <div className="form-group">
        <label className="form-label">Cuisine (Select Multiple)</label>
        <div className="cuisine-chips" role="group" aria-label="Cuisine selection">
          {POPULAR_CUISINES.map((cuisine) => (
            <button
              key={cuisine}
              type="button"
              className={`cuisine-chip${selectedCuisines.includes(cuisine) ? ' active' : ''}`}
              onClick={() => toggleCuisine(cuisine)}
              aria-pressed={selectedCuisines.includes(cuisine)}
              id={`cuisine-${cuisine.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {cuisine}
            </button>
          ))}
        </div>
      </div>

      {/* ── Minimum Rating Slider ──────────────────────────────────────── */}
      <div className="form-group">
        <div className="rating-row">
          <label className="form-label" htmlFor="rating-slider" style={{ marginBottom: 0 }}>
            Minimum Rating
          </label>
          <span className="rating-value">
            {Number(minRating).toFixed(1)}+ <span>★</span>
          </span>
        </div>
        <input
          type="range"
          id="rating-slider"
          className="rating-slider"
          min="3.0"
          max="5.0"
          step="0.1"
          value={minRating}
          onChange={(e) => setMinRating(e.target.value)}
          style={{
            background: `linear-gradient(to right, var(--primary) ${((minRating - 3) / 2) * 100}%, var(--surface-container-highest) ${((minRating - 3) / 2) * 100}%)`,
          }}
        />
      </div>

      {/* ── Submit ─────────────────────────────────────────────────────── */}
      <button
        type="submit"
        className="submit-btn"
        disabled={loading}
        id="btn-get-recommendations"
      >
        {loading ? 'Searching…' : 'Get Recommendations'}
      </button>
    </form>
  );
}
