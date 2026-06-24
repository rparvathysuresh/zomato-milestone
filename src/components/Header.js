/**
 * Header Component
 *
 * Sticky glassmorphism header with logo, navigation, and sign-in button.
 * Matches the Stitch design screenshot.
 */
export default function Header() {
  return (
    <header className="site-header" role="banner">
      <div className="header-inner">
        {/* Logo */}
        <div className="header-logo">
          <span className="gradient-text">Zomato</span>{' '}
          <span style={{ color: 'var(--on-surface)' }}>AI</span>
        </div>

        {/* Navigation */}
        <nav className="header-nav" aria-label="Main navigation">
          <a href="#discover" className="active" id="nav-discover">
            Discover
          </a>
          <a href="#history" id="nav-history">
            History
          </a>
          <a href="#favorites" id="nav-favorites">
            Favorites
          </a>
        </nav>

        {/* Sign In */}
        <button className="header-signin" id="btn-signin" type="button">
          Sign In
        </button>
      </div>
    </header>
  );
}
