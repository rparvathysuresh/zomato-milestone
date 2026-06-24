'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PreferenceForm from '@/components/PreferenceForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import RecommendationList from '@/components/RecommendationList';

// Lazy-load the WebGL shader to avoid SSR issues
const ShaderBackground = dynamic(() => import('@/components/ShaderBackground'), {
  ssr: false,
});

/** Slow-response threshold in milliseconds */
const SLOW_THRESHOLD_MS = 5000;

export default function Home() {
  const [recommendations, setRecommendations] = useState(null);
  const [summary, setSummary] = useState('');
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSlow, setShowSlow] = useState(false);

  // Keep a ref to the last submitted prefs for retry
  const lastPrefsRef = useRef(null);
  const slowTimerRef = useRef(null);
  const resultsRef = useRef(null);

  // Clean up slow timer on unmount
  useEffect(() => {
    return () => {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    };
  }, []);

  const fetchRecommendations = async (prefs) => {
    lastPrefsRef.current = prefs;
    setLoading(true);
    setError('');
    setRecommendations(null);
    setSummary('');
    setWarning('');
    setShowSlow(false);

    // Start slow-response timer
    slowTimerRef.current = setTimeout(() => {
      setShowSlow(true);
    }, SLOW_THRESHOLD_MS);

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });

      const data = await res.json();

      if (!res.ok) {
        // 503 with fallback data
        if (res.status === 503 && data.recommendations) {
          setRecommendations(data.recommendations);
          setSummary(data.summary || '');
          setTotalFiltered(data.totalFiltered || 0);
          setWarning(data.warning || 'AI ranking unavailable — showing results by rating.');
        } else {
          throw new Error(
            data.error?.message || `Request failed with status ${res.status}`
          );
        }
      } else {
        setRecommendations(data.recommendations || []);
        setSummary(data.summary || '');
        setTotalFiltered(data.totalFiltered || 0);
        setWarning('');
      }
    } catch (err) {
      console.error('[Home] Fetch error:', err);
      setError(
        err.message === 'Failed to fetch'
          ? 'Network error — please check your connection and try again.'
          : err.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
      setShowSlow(false);
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current);
        slowTimerRef.current = null;
      }

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const handleRetry = () => {
    if (lastPrefsRef.current) {
      fetchRecommendations(lastPrefsRef.current);
    }
  };

  return (
    <>
      <ShaderBackground />

      <main className="main-content">
        {/* ── Hero Section ──────────────────────────────────────────── */}
        <section className="hero-section" id="discover">
          <h1
            className="hero-title"
            style={{ fontFamily: 'var(--font-outfit), Outfit, sans-serif' }}
          >
            <span className="gradient-text">Discover Your Perfect</span>
          </h1>
          <p className="hero-subtitle">
            Powered by culinary intelligence. Tell us what you crave, and our AI
            will curate the perfect dining experience in Bangalore.
          </p>
        </section>

        {/* ── Preference Form ──────────────────────────────────────── */}
        <PreferenceForm onSubmit={fetchRecommendations} loading={loading} />

        {/* ── Loading State ────────────────────────────────────────── */}
        <div ref={resultsRef}>
          {loading && (
            <>
              <LoadingSpinner />
              {showSlow && (
                <p className="slow-warning">Still searching… this is taking longer than usual.</p>
              )}
            </>
          )}

          {/* ── Error State ──────────────────────────────────────────── */}
          {error && !loading && (
            <div className="error-banner" role="alert">
              <p className="error-text">{error}</p>
              <button
                type="button"
                className="error-retry-btn"
                onClick={handleRetry}
                id="btn-retry"
              >
                Try Again
              </button>
            </div>
          )}

          {/* ── Results ──────────────────────────────────────────────── */}
          {recommendations && !loading && !error && (
            <RecommendationList
              recommendations={recommendations}
              summary={summary}
              totalFiltered={totalFiltered}
              warning={warning}
            />
          )}
        </div>
      </main>
    </>
  );
}
