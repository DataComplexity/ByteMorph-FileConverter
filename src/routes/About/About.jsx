import './About.css';

const STEPS = [
  { n: '01', t: 'Drop Your File',    d: 'Any format, any size. Drag & drop or click to browse.', c: '#22D3EE' },
  { n: '02', t: 'Smart Detection',   d: 'Auto-detects your format and shows only compatible outputs.', c: '#A78BFA' },
  { n: '03', t: 'Hub & Spoke Engine',d: 'Converts via universal intermediate for maximum quality.', c: '#F472B6' },
  { n: '04', t: 'Instant Download',  d: 'File ready in seconds. No account, no watermark, no limits.', c: '#34D399' },
];

export default function About() {
  return (
    <section id="about" className="about-section">
      <div className="about-inner">
        <h2 className="about-title">How ByteMorph Works</h2>
        <div className="about-grid">
          {STEPS.map(({ n, t, d, c }) => (
            <div key={n} className="about-card" style={{ '--accent': c }}>
              <div className="about-card__num-bg">{n}</div>
              <div className="about-card__badge">{n}</div>
              <div className="about-card__title">{t}</div>
              <div className="about-card__desc">{d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
