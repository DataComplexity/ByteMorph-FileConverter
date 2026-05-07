import './Converter.css';
import { FORMATS, stripExt } from '../../components/constants';

export default function Converter({
  step, dragOver, setDragOver, handleDrop, handleInput,
  fileInfo, targetFormat, setTargetFormat, startConversion, progress, reset, downloadUrl
}) {
  // Derive color and compatible formats from the first file
  const firstFile = fileInfo && fileInfo.length > 0 ? fileInfo[0] : null;
  const catColor = firstFile ? FORMATS[firstFile.category]?.color : '#22D3EE';
  const compatible = firstFile ? FORMATS[firstFile.category]?.formats.filter(f => f !== firstFile.format) : [];

  // Returns step state string for class suffix
  const stepState = (n) => step > n ? 'done' : step === n ? 'active' : 'pending';

  return (
    <section id="converter" className="cv-section">
      {/* --accent makes catColor available to all child CSS */}
      <div className="bm-glass cv-card" style={{ '--accent': catColor }}>

        {/* Step indicator */}
        <div className="cv-steps">
          {[['1', 'Upload'], ['2', 'Format'], ['3', 'Convert'], ['4', 'Download']].map(([n, l]) => (
            <div key={n} className={`cv-step-item cv-step-item--${stepState(+n)}`}>
              <span className={`cv-step-bubble cv-step-bubble--${stepState(+n)}`}>
                {step > +n ? '✓' : n}
              </span>
              {l}
            </div>
          ))}
        </div>

        <div className="cv-body">

          {/* STEP 1 — Drop zone */}
          {step === 1 && (
            <div
              className={`bm-drop cv-drop ${dragOver ? 'drag-over' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('bm-file').click()}
            >
              <div className="cv-drop-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div className="cv-drop-title">Drop your file here</div>
              <div className="cv-drop-sub">or click to browse &nbsp;·&nbsp; any format accepted</div>
              <div className="cv-drop-tags">
                {['PDF', 'MP4', 'PNG', 'MP3', 'JSON', 'ZIP', '+49 more'].map(f => (
                  <span key={f} className="cv-drop-tag">{f}</span>
                ))}
              </div>
              <input id="bm-file" type="file" multiple style={{ display: 'none' }} onChange={handleInput} />
            </div>
          )}

          {/* STEP 2 — Format select */}
          {step === 2 && fileInfo && (
            <div className="cv-step2-enter">

              <div className="cv-file-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {fileInfo.map((fi, idx) => (
                  <div key={idx} className="cv-file-card" style={{ marginBottom: 0 }}>
                    <div className="cv-file-badge">{fi.format}</div>
                    <div className="cv-file-info">
                      <div className="cv-file-name">{fi.name}</div>
                      <div className="cv-file-meta">{fi.category} &nbsp;·&nbsp; {(fi.file.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    {idx === 0 && <button className="cv-file-reset" onClick={reset}>×</button>}
                  </div>
                ))}
              </div>

              <div className="cv-label-sm">CONVERT TO</div>

              <div className="cv-format-grid">
                {compatible.map(f => (
                  <span
                    key={f}
                    className={`bm-badge cv-format-badge ${targetFormat === f ? 'cv-format-badge--active' : ''}`}
                    onClick={() => setTargetFormat(f)}
                  >
                    {f}
                  </span>
                ))}
              </div>

              <button
                className={`bm-btn cv-convert-btn ${targetFormat ? 'cv-convert-btn--ready' : ''}`}
                onClick={startConversion}
                disabled={!targetFormat}
              >
                {targetFormat ? `Convert ${fileInfo.length} file(s) → ${targetFormat}` : 'Select a target format above'}
              </button>
            </div>
          )}

          {/* STEP 3 — Converting */}
          {step === 3 && (
            <div className="cv-converting">
              <div className="cv-spinner" />
              <div className="cv-converting-title">
                Converting &nbsp;<span className="cv-accent">{firstFile?.format}</span>&nbsp; → &nbsp;<span className="cv-cyan">{targetFormat}</span>
                {fileInfo?.length > 1 && <span style={{fontSize: '0.8em', opacity: 0.8}}><br/>(and {fileInfo.length - 1} more)</span>}
              </div>
              <div className="cv-converting-sub">ByteMorph engine processing via hub&amp;spoke pipeline...</div>
              <div className="cv-progress-bar">
                <div className="cv-progress-fill" style={{ width: `${Math.round(progress)}%` }} />
              </div>
              <div className="cv-progress-pct">{Math.round(progress)}%</div>
            </div>
          )}

          {/* STEP 4 — Done */}
          {step === 4 && (
            <div className="cv-done">
              <div className="cv-done-check">✓</div>
              <div className="cv-done-title">Conversion Complete</div>
              <div className="cv-done-meta">
                <span className="cv-accent">{fileInfo?.length} file(s)</span> → <span className="cv-cyan">{targetFormat}</span> &nbsp;·&nbsp; Ready to download
              </div>
              <div className="cv-done-btns">
                <a 
                  href={downloadUrl} 
                  download={fileInfo?.length > 1 ? 'bytemorph_converted.zip' : `${stripExt(firstFile?.name || 'file')}.${targetFormat?.toLowerCase()}`}
                  className="bm-btn cv-btn-download"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ↓ Download .{targetFormat?.toLowerCase()}
                </a>
                <button className="bm-btn cv-btn-reset" onClick={reset}>Convert Another</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
