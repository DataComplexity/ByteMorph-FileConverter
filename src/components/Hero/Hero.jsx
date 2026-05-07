import './Hero.css';
import Navbar from '../Navbar/Navbar';
import ThreeBackground from '../ThreeBackground/ThreeBackground';
import { PILL_TAGS } from '../constants';

export default function Hero({ user, onLogin, onSignup, onLogout }) {
  return (
    <div className="bm-hero">
      <ThreeBackground />

      <div className="bm-hero__overlay-radial" />
      <div className="bm-hero__overlay-linear" />

      <Navbar user={user} onLogin={onLogin} onSignup={onSignup} onLogout={onLogout} />

      <div className="bm-hero__content">

        <div className="bm-hero__badge">
          <span className="bm-hero__badge-dot" />
          55 FORMATS &nbsp;·&nbsp; ZERO LIMITS
        </div>

        <h1 className="bm-hero__title">
          <span className="bm-hero__title-white">Files don't</span>
          <span className="bm-hero__title-gradient bm-heading-gradient">morph themselves.</span>
        </h1>

        <p className="bm-hero__subtitle">
          Drop any file. Pick a format. Done in seconds.<br />
          55+ formats across 7 categories — including compression.
        </p>

        <div className="bm-hero__ctas">
          <button
            className="bm-btn bm-hero__btn-primary"
            onClick={() => document.getElementById('converter')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Start Converting →
          </button>
          <button
            className="bm-btn bm-hero__btn-secondary"
            onClick={() => document.getElementById('formats')?.scrollIntoView({ behavior: 'smooth' })}
          >
            View All Formats
          </button>
        </div>

        {/* Floating pills — position & animation-delay are data-driven, stay inline */}
        {PILL_TAGS.map(({ f, c, pos, dur, delay }) => (
          <div
            key={f}
            className="bm-hero__pill"
            style={{ ...pos, animation: `bm-drift ${dur} ease-in-out infinite`, animationDelay: delay }}
          >
            <div
              className="bm-hero__pill-tag"
              style={{ color: c, background: c + '18', border: `1px solid ${c}40` }}
            >
              {f}
            </div>
          </div>
        ))}

        <div className="bm-hero__stats">
          {[['55+', 'Formats'], ['7', 'Categories'], ['∞', 'Files']].map(([n, l]) => (
            <div key={l} className="bm-hero__stat">
              <div className="bm-hero__stat-num bm-heading-gradient">{n}</div>
              <div className="bm-hero__stat-label">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
