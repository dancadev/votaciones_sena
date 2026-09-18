import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { RegistroIngresoPage } from './pages/RegistroIngresoPage';
import { CabinaVotacionPage } from './pages/CabinaVotacionPage';
import { PropuestasPage } from './pages/PropuestasPage';
import { MonitorRealTimePage } from './pages/MonitorRealTimePage';
import { ResultadosElectoralesPage } from './pages/ResultadosElectoralesPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-sena-bg flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<RegistroIngresoPage />} />
            <Route path="/votacion" element={<CabinaVotacionPage />} />
            <Route path="/propuestas" element={<PropuestasPage />} />
            <Route path="/monitor" element={<MonitorRealTimePage />} />
            <Route path="/resultados" element={<ResultadosElectoralesPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;