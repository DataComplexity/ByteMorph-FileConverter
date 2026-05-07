import './Formats.css';
import { FORMATS } from '../constants';

export default function Formats({ activeTab, setActiveTab }) {
  return (
    <section id="formats" className="formats-section">
      <div className="formats-inner">

        <div className="formats-header">
          <h2 className="formats-title">
            55+ Formats.{' '}
            <span className="bm-heading-gradient">7 Categories.</span>
          </h2>
          <p className="formats-subtitle">From documents to compression — ByteMorph has you covered.</p>
        </div>

        {/* Category tabs */}
        <div className="formats-tabs">
          {Object.entries(FORMATS).map(([cat, data]) => (
            <button
              key={cat}
              className={`formats-tab ${activeTab === cat ? 'formats-tab--active' : ''}`}
              style={activeTab === cat ? { '--tab-color': data.color } : {}}
              onClick={() => setActiveTab(cat)}
            >
              <span className="formats-tab__dot" />
              {cat}
              <span className="formats-tab__count">{data.formats.length}</span>
            </button>
          ))}
        </div>

        {/* Format cards */}
        <div className="formats-grid" style={{ '--tab-color': FORMATS[activeTab].color }}>
          {FORMATS[activeTab].formats.map(f => (
            <div
              key={f}
              className="formats-card"
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = FORMATS[activeTab].color + '50';
                e.currentTarget.style.background  = FORMATS[activeTab].color + '0D';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '';
                e.currentTarget.style.background  = '';
              }}
            >
              <div className="formats-card__name">{f}</div>
              <div className="formats-card__cat">{activeTab.slice(0, 3).toLowerCase()}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
