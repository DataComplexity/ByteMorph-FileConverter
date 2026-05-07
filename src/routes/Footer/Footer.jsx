import './Footer.css';

export default function Footer() {
  return (
    <footer className="bm-footer">
      <div className="bm-footer__brand">
        <div className="bm-footer__logo">B</div>
        <span className="bm-footer__name">ByteMorph</span>
      </div>
      <div className="bm-footer__info">
        55 formats &nbsp;·&nbsp; FFmpeg + Sharp + Pandoc &nbsp;·&nbsp; All Rights Reserved 2026
      </div>
      <div className="bm-footer__credit">Built with React + Three.js</div>
    </footer>
  );
}
