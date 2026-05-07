import React from 'react';
import './Features.css';

export default function Features() {
  return (
    <section className="bm-features-wrapper" id="features">
      <div className="bm-features-header">
        <h2 className="bm-heading-gradient">Engineered for Perfection</h2>
        <p>ByteMorph combines lightning-fast local processing with a hyper-intelligent routing engine to guarantee your files stay safe and convert instantly.</p>
      </div>

      <div className="bm-bento-grid">
        
        {/* Card 1 */}
        <div className="bm-bento-card bm-glass bm-span-2">
          <div>
            <div className="bm-bento-icon">⚡</div>
            <h3 className="bm-bento-title">Ultra-Fast Execution</h3>
            <p className="bm-bento-text">
              We ditched slow cloud queues. ByteMorph executes heavy conversions, like rendering high-definition videos, locally on the processing node faster than you can blink.
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bm-bento-card bm-glass">
          <div>
            <div className="bm-bento-icon">🔒</div>
            <h3 className="bm-bento-title">Absolute Privacy</h3>
            <p className="bm-bento-text">
              Your files never leak. Once a document converting stream finishes, the binary is instantly wiped. Nothing is saved.
            </p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bm-bento-card bm-glass">
          <div>
            <div className="bm-bento-icon">🗂️</div>
            <h3 className="bm-bento-title">Zero-Loss Batching</h3>
            <p className="bm-bento-text">
              Throw up to 3 files at once into the morpher. We automatically compress them into a flawless ZIP stream on the way out.
            </p>
          </div>
        </div>

        {/* Card 4 - The PDF Callout */}
        <div className="bm-bento-card bm-glass bm-pdf-callout bm-span-2">
          <div>
            <div className="bm-bento-icon">🛡️</div>
            <h3 className="bm-bento-title">Intelligent Routing</h3>
            <p className="bm-bento-text">
              The Traffic Cop isolates logic into dedicated native engines.
              <br /><br />
              <strong>The PDF Reality:</strong> Because a PDF is literally a flat "picture" of text rather than a flowable document, it is mathematically dangerous to extract into a DOCX format. ByteMorph intercepts these impossible traps automatically to prevent critical server crashes, while still exclusively allowing fast PDF-to-Text data ripping!
            </p>
          </div>
        </div>

        {/* Card 5 */}
        <div className="bm-bento-card bm-glass">
          <div>
            <div className="bm-bento-icon">🗜️</div>
            <h3 className="bm-bento-title">Extreme Compression</h3>
            <p className="bm-bento-text">
              Transform gigabytes of raw media into megabytes instantly without seriously degrading audio or visual fidelity.
            </p>
          </div>
        </div>

        {/* Card 6 */}
        <div className="bm-bento-card bm-glass">
          <div>
            <div className="bm-bento-icon">💎</div>
            <h3 className="bm-bento-title">Zero Watermarks</h3>
            <p className="bm-bento-text">
              100% Free. No annoying watermarks stamped on your converted PDFs or videos. You get your exact file, completely untouched.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
