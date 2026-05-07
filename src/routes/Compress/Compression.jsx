import './Compression.css';
import { useState } from 'react';

const COMPRESSIBLE = {
  Images:    { color: '#22D3EE', formats: ['JPG', 'PNG', 'WEBP', 'AVIF', 'GIF', 'TIFF', 'BMP'] },
  Video:     { color: '#F472B6', formats: ['MP4', 'MKV', 'MOV', 'AVI', 'WEBM'] },
  Audio:     { color: '#34D399', formats: ['MP3', 'WAV', 'FLAC', 'AAC', 'OGG', 'M4A'] },
  Documents: { color: '#A78BFA', formats: ['PDF', 'DOCX', 'PPTX', 'XLSX'] },
  Archives:  { color: '#60A5FA', formats: ['ZIP', 'RAR', '7Z', 'TAR'] },
};

const LEVELS = [
  { id: 'low',    label: 'Low',    desc: 'Minimal quality loss',  reduction: '~20%' },
  { id: 'medium', label: 'Medium', desc: 'Balanced quality/size', reduction: '~45%' },
  { id: 'high',   label: 'High',   desc: 'Maximum compression',   reduction: '~70%' },
];

function detectType(filename) {
  const ext = filename.split('.').pop().toUpperCase();
  for (const [cat, data] of Object.entries(COMPRESSIBLE)) {
    if (data.formats.includes(ext)) return { category: cat, format: ext, color: data.color };
  }
  return { category: 'Documents', format: ext, color: '#A78BFA' };
}

const fmtBytes = (b) => b < 1024 * 1024
  ? `${(b / 1024).toFixed(1)} KB`
  : `${(b / (1024 * 1024)).toFixed(2)} MB`;

export default function Compression() {
  const [dragOver, setDragOver] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [level, setLevel]       = useState('medium');
  const [step, setStep]         = useState(1);
  const [progress, setProgress] = useState(0);
  const [error, setError]       = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [compressedSize, setCompressedSize] = useState(0);

  const applyFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    
    const newFilesList = Array.from(fileList);

    setFileInfo(prev => {
      const currentFiles = prev || [];
      const updatedList = [...currentFiles];

      for (const file of newFilesList) {
        if (updatedList.length >= 3) break;
        if (updatedList.some(f => f.name === file.name && f.size === file.size)) continue;

        updatedList.push({
          file,
          name: file.name,
          size: file.size,
          ...detectType(file.name)
        });
      }
      return updatedList;
    });

    setStep(2);
    setError(null);
  };

  const handleDrop  = (e) => { e.preventDefault(); setDragOver(false); applyFiles(e.dataTransfer?.files); };
  const handleInput = (e) => applyFiles(e.target.files);

  const startCompression = async () => {
    if (!fileInfo) return;

    setStep(3);
    setProgress(15);
    setError(null);

    const formData = new FormData();
    formData.append('level', level);
    fileInfo.forEach(f => {
      formData.append('files', f.file);
    });

    try {
      const response = await fetch('/api/compress', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Compression failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      setDownloadUrl(url);
      setCompressedSize(blob.size);
      setProgress(100);
      setStep(4);
    } catch (err) {
      console.error('Compression error:', err);
      setError(err.message);
      setStep(2);
      alert(`Error: ${err.message}`);
    }
  };

  const reset = () => { 
    if (downloadUrl) window.URL.revokeObjectURL(downloadUrl);
    setFileInfo(null); 
    setLevel('medium'); 
    setStep(1); 
    setProgress(0); 
    setError(null);
    setDownloadUrl(null);
  };

  const reductionPct = LEVELS.find(l => l.id === level)?.reduction ?? '~45%';
  const stepState = (n) => step > n ? 'done' : step === n ? 'active' : 'pending';

  const firstFile = fileInfo && fileInfo.length > 0 ? fileInfo[0] : null;
  const totalOriginalSize = fileInfo ? fileInfo.reduce((acc, f) => acc + f.size, 0) : 0;

  return (
    <section id="compress" className="compress-section">
      {/* --accent exposes dynamic file color to CSS */}
      <div className="bm-glass compress-card" style={{ '--accent': firstFile?.color ?? '#22D3EE' }}>

        <div className="compress-header">
          <div className="compress-header__icon">⚡</div>
          <div>
            <h2 className="compress-header__title">Smart Compression</h2>
            <p className="compress-header__sub">Shrink files without sacrificing quality</p>
          </div>
        </div>

        <div className="compress-steps">
          {[['1','Upload'],['2','Options'],['3','Compress'],['4','Download']].map(([n, l]) => (
            <div key={n} className={`cv-step-item cv-step-item--${stepState(+n)}`} style={{ flex: 1, justifyContent: 'center' }}>
              <span className={`cv-step-bubble cv-step-bubble--${stepState(+n)}`}>
                {step > +n ? '✓' : n}
              </span>
              {l}
            </div>
          ))}
        </div>

        <div className="compress-body">

          {/* STEP 1 — Drop */}
          {step === 1 && (
            <div
              className={`bm-drop ${dragOver ? 'drag-over' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('bm-compress-file').click()}
              style={{ border: '2px dashed rgba(34,211,238,.28)', borderRadius: 14, padding: '56px 32px', textAlign: 'center', cursor: 'pointer', background: 'transparent' }}
            >
              <div className="compress-drop-icon">⚡</div>
              <div className="compress-drop-title">Drop a file to compress</div>
              <div className="compress-drop-sub">Images · Video · Audio · PDF — all supported</div>
              <div className="compress-drop-tags">
                {['JPG', 'PNG', 'MP4', 'MP3', 'PDF', '+more'].map(f => (
                  <span key={f} className="compress-drop-tag">{f}</span>
                ))}
              </div>
              <input id="bm-compress-file" type="file" multiple style={{ display: 'none' }} onChange={handleInput} />
            </div>
          )}

          {/* STEP 2 — Options */}
          {step === 2 && fileInfo && (
            <div className="cv-step2-enter">
              <div className="cv-file-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {fileInfo.map((fi, idx) => (
                  <div key={idx} className="compress-file-card" style={{ marginBottom: 0 }}>
                    <div className="compress-file-badge">{fi.format}</div>
                    <div className="compress-file-info">
                      <div className="compress-file-name">{fi.name}</div>
                      <div className="compress-file-meta">{fi.category} · {fmtBytes(fi.size)}</div>
                    </div>
                    {idx === 0 && <button className="compress-file-reset" onClick={reset}>×</button>}
                  </div>
                ))}
              </div>

              <div className="compress-level-label">COMPRESSION LEVEL</div>
              <div className="compress-level-row">
                {LEVELS.map(lv => (
                  <div
                    key={lv.id}
                    className={`compress-level-card ${level === lv.id ? 'compress-level-card--active' : ''}`}
                    onClick={() => setLevel(lv.id)}
                  >
                    <div className="compress-level-name">{lv.label}</div>
                    <div className="compress-level-desc">{lv.desc}</div>
                    <div className="compress-level-reduction">{lv.reduction}</div>
                  </div>
                ))}
              </div>

              <div className="compress-estimate">
                <span className="compress-estimate__label">Estimated output size</span>
                <span className="compress-estimate__value">
                  {fmtBytes(totalOriginalSize * (1 - parseInt(reductionPct) / 100))}
                  <span className="compress-estimate__sub">({reductionPct} smaller)</span>
                </span>
              </div>

              <button className="bm-btn compress-btn" onClick={startCompression}>
                Compress {fileInfo.length} file(s) →
              </button>
            </div>
          )}

          {/* STEP 3 — Compressing */}
          {step === 3 && (
            <div className="compress-converting">
              <div className="compress-spinner" />
              <div className="compress-converting__title">Compressing file...</div>
              <div className="compress-converting__sub">
                Applying <span className="cv-cyan">{LEVELS.find(l => l.id === level)?.label}</span> compression
              </div>
              <div className="compress-progress-bar">
                <div className="compress-progress-fill" style={{ width: `${Math.round(progress)}%` }} />
              </div>
              <div className="compress-pct">{Math.round(progress)}%</div>
            </div>
          )}

          {/* STEP 4 — Done */}
          {step === 4 && fileInfo && (
            <div className="compress-done">
              <div className="compress-done__check">✓</div>
              <div className="compress-done__title">Compression Complete</div>

              <div className="compress-ba">
                <div className="compress-ba__item">
                  <div className="compress-ba__label">Original</div>
                  <div className="compress-ba__value">{fmtBytes(totalOriginalSize)}</div>
                </div>
                <div className="compress-ba__item compress-ba__item--highlight">
                  <div className="compress-ba__label">Compressed</div>
                  <div className="compress-ba__value">{fmtBytes(compressedSize)}</div>
                </div>
              </div>

              <div className="compress-done__btns">
                <a 
                  href={downloadUrl} 
                  download={fileInfo.length > 1 ? 'bytemorph_compressed.zip' : `${firstFile.name.split('.')[0]}_compressed.${firstFile.format.toLowerCase()}`}
                  className="bm-btn compress-btn-download"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ↓ Download compressed file
                </a>
                <button className="bm-btn compress-btn-reset" onClick={reset}>Compress Another</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
