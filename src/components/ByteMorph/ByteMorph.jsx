import { useState, useEffect } from 'react';
import './ByteMorph.css';
import { detectCategory } from '../constants';
import Hero from '../Hero/Hero';
import Formats from '../Formats/Formats';
import Converter from '../../routes/Converter/Converter';
import Compression from '../../routes/Compress/Compression';
import Features from '../Features/Features';
import About from '../../routes/About/About';
import Footer from '../../routes/Footer/Footer';
import AuthModal from '../AuthModal/AuthModal';

export default function ByteMorph() {
  const [activeTab, setActiveTab] = useState('Images');
  const [dragOver, setDragOver] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [targetFormat, setTargetFormat] = useState(null);
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);

  // Auth State
  const [user, setUser] = useState(null);
  const [authModal, setAuthModal] = useState(null); // 'login' | 'signup' | null

  useEffect(() => {
    const savedUser = localStorage.getItem('bm_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('bm_token');
    localStorage.removeItem('bm_user');
    setUser(null);
  };

  const applyFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const newFilesList = Array.from(fileList);

    setFileInfo(prev => {
      const currentFiles = prev || [];
      const updatedList = [...currentFiles];

      for (const file of newFilesList) {
        if (updatedList.length >= 3) break;
        // Avoid duplicates
        if (updatedList.some(f => f.name === file.name && f.file.size === file.size)) continue;

        updatedList.push({
          file,
          name: file.name,
          ...detectCategory(file.name)
        });
      }
      return updatedList;
    });

    setTargetFormat(null);
    setError(null);
    setStep(2);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    applyFiles(e.dataTransfer?.files);
  };

  const handleInput = (e) => applyFiles(e.target.files);

  const startConversion = async () => {
    if (!fileInfo || !targetFormat) return;

    setStep(3);
    setProgress(10);
    setError(null);

    const formData = new FormData();
    formData.append('targetFormat', targetFormat.toLowerCase());
    fileInfo.forEach(f => {
      formData.append('files', f.file);
    });

    const cat = fileInfo[0].category.toLowerCase();
    const routeMap = {
      documents: 'document',
      images: 'image',
      archives: 'archive'
    };
    const routeName = routeMap[cat] || cat;
    const url = `/api/convert/${routeName}`;// Relative path via Vite proxy

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Conversion failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      setDownloadUrl(downloadUrl);
      setProgress(100);
      setStep(4);
    } catch (err) {
      console.error('Conversion error:', err);
      setError(err.message);
      setStep(2); // Go back to format selection
      alert(`Error: ${err.message}`);
    }
  };

  const reset = () => {
    if (downloadUrl) window.URL.revokeObjectURL(downloadUrl);
    setFileInfo(null);
    setTargetFormat(null);
    setStep(1);
    setProgress(0);
    setError(null);
    setDownloadUrl(null);
  };

  return (
    <div className="byte-morph-container">
      <Hero
        user={user}
        onLogin={() => setAuthModal('login')}
        onSignup={() => setAuthModal('signup')}
        onLogout={handleLogout}
      />
      <Converter
        step={step}
        dragOver={dragOver}
        setDragOver={setDragOver}
        handleDrop={handleDrop}
        handleInput={handleInput}
        fileInfo={fileInfo}
        targetFormat={targetFormat}
        setTargetFormat={setTargetFormat}
        startConversion={startConversion}
        progress={progress}
        reset={reset}
        downloadUrl={downloadUrl}
      />
      <Compression />
      <Features />
      <Formats activeTab={activeTab} setActiveTab={setActiveTab} />
      <About />
      <Footer />

      {authModal && (
        <AuthModal
          type={authModal}
          onClose={() => setAuthModal(null)}
          onAuthSuccess={(u) => setUser(u)}
        />
      )}
    </div>
  );
}
