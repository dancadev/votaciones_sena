import React, { useState, useEffect } from 'react';
import { getResultadosFinales } from '../services/api';

export const ResultadosElectoralesPage = () => {
  const [resultados, setResultados] = useState([]);
  const [ganador, setGanador] = useState(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getResultadosFinales()
      .then((res) => {
        setResultados(res.data.resultados);
        setGanador(res.data.ganador);
      })
      .catch((err) => {
        if (err.response?.status === 403) {
          setBloqueado(true);
        }
      })
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return (
      <div className="min-h-screen bg-sena-bg flex items-center justify-center">
        <p className="text-sena-navy font-semibold">Cargando escrutinio...</p>
      </div>
    );
  }

  if (bloqueado) {
    return (
      <div className="min-h-screen bg-sena-bg flex items-center justify-center p-4 text-center">
        <div className="max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-2xl font-bold text-sena-navy">Resultados Bloqueados</h2>
          <p className="mt-2 text-slate-600">
            La jornada de votación continúa activa. Los resultados oficiales se revelarán una vez finalizada la contienda electoral.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sena-bg py-10 px-4 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-sena-navy">Resultados Oficiales del Escrutinio</h1>
          <p className="mt-2 text-slate-600">Jornada electoral finalizada</p>
        </header>

        {/* Tarjeta del Ganador */}
        {ganador && (
          <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-sena-navy to-sena-blue p-8 text-white shadow-xl">
            <span className="rounded-full bg-sena-green px-4 py-1 text-xs font-bold uppercase tracking-wider">
              🏆 Candidato Ganador
            </span>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">{ganador.nombre}</h2>
            <p className="mt-2 text-slate-200">
              Obtuvo un total de <strong className="text-white underline">{ganador.votos} votos</strong>.
            </p>
          </div>
        )}

        {/* Tabla / Lista de Votaciones */}
        <div className="rounded-2xl bg-white p-6 shadow-md border border-slate-100">
          <h3 className="text-lg font-bold text-sena-navy mb-4">Detalle de la Votación</h3>
          <div className="space-y-4">
            {resultados.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-sena-navy text-sm">
                    {item.es_voto_blanco ? 'VB' : `#${item.numero_tarjeton}`}
                  </span>
                  <span className="font-semibold text-slate-800">{item.nombre}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-sena-navy">{item.votos}</span>
                  <span className="ml-1 text-sm text-slate-500">votos</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};