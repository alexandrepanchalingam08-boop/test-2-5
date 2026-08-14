import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/global.css';
import { SessionsProvider } from './lib/SessionsContext.jsx';
import TasteTestApp from './pages/TasteTestApp/TasteTestApp.jsx';
import Inscription from './pages/Inscription/Inscription.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SessionsProvider>
        <Routes>
          <Route path="/" element={<TasteTestApp />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/inscription/:sessionId" element={<Inscription />} />
        </Routes>
      </SessionsProvider>
    </BrowserRouter>
  </StrictMode>,
);
