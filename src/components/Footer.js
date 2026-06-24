/**
 * Footer Component
 *
 * Displays branding, links, copyright, and attribution.
 * Matches the Stitch design screenshot.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-inner">
        {/* Brand */}
        <div className="footer-brand">
          <span className="gradient-text">Zomato</span> AI
        </div>

        {/* Links */}
        <nav className="footer-links" aria-label="Footer navigation">
          <a href="#privacy" id="footer-privacy">
            Privacy Policy
          </a>
          <a href="#terms" id="footer-terms">
            Terms of Service
          </a>
          <a href="#data" id="footer-data">
            Data Sources
          </a>
        </nav>

        {/* Right */}
        <div className="footer-right">
          <p>&copy; {year} Zomato AI.</p>
          <p className="footer-attribution">
            Powered by <strong>Groq AI</strong> &bull; Data from{' '}
            <strong>Hugging Face</strong>
          </p>
        </div>
      </div>
    </footer>
  );
}
