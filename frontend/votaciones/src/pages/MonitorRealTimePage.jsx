import React, { useState, useEffect } from 'react';
import { getTotalVotosRealtime } from '../services/api';

export const MonitorRealTimePage = () => {
  const [totalVotos, setTotalVotos] = useState(0);

  useEffect(() => {
    const fetchTotal = async () => {
      try {
        const response = await getTotalVotosRealtime();
        setTotalVotos(response.data.total_votos);
      } catch (error) {
        console.error('Error al obtener total de votos:', error);
      }
    };

    fetchTotal();
    const interval = setInterval(fetchTotal, 3000); // Actualiza cada 3 segundos
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-sena-bg py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-xl text-center">
        <header className="mb-8">
          <span className="inline-block rounded-full bg-sena-green/10 px-4 py-1.5 text-xs font-bold text-sena-green tracking-wide uppercase">
            ● Transmisión en Vivo
          </span>
          <h1 className="mt-3 text-3xl font-extrabold text-sena-navy sm:text-4xl">
            Monitor de Participación Electoral
          </h1>
          <p className="mt-2 text-slate-600">
            Cifra total de sufragios depositados hasta el momento
          </p>
        </header>

        <div className="rounded-3xl bg-white p-10 shadow-xl border border-slate-100">
          <div className="text-7xl font-black text-sena-navy tracking-tight sm:text-8xl">
            {totalVotos}
          </div>
          <p className="mt-4 font-semibold text-slate-500 uppercase tracking-widest text-sm">
            Votos Registrados en la Jornada
          </p>
        </div>
      </div>
    </div>
  );
};