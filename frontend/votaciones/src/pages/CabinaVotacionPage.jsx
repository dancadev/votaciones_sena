import React, { useState, useEffect } from 'react';
import { CardCandidato } from '../components/votacion/CardCandidato';
import { getCandidatos, registrarVoto, getEstadoJornada } from '../services/api';

export const CabinaVotacionPage = () => {
  const [candidatos, setCandidatos] = useState([]);
  const [jornadaActiva, setJornadaActiva] = useState(true);
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState(null);
  const [votoEnviado, setVotoEnviado] = useState(false);

  useEffect(() => {
    // Cargar estado de la elección y lista de candidatos
    getEstadoJornada().then(res => setJornadaActiva(res.data.is_activa));
    getCandidatos().then(res => setCandidatos(res.data));
  }, []);

  const handleVotar = async () => {
    if (!candidatoSeleccionado) return;
    try {
      await registrarVoto(candidatoSeleccionado.id);
      setVotoEnviado(true);
      setCandidatoSeleccionado(null);
    } catch (error) {
      alert("Error al registrar el voto");
    }
  };

  if (!jornadaActiva) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sena-bg p-4 text-center">
        <div className="rounded-2xl bg-white p-8 shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-sena-navy">Votaciones Cerradas</h2>
          <p className="mt-2 text-slate-600">La jornada electoral ha finalizado. Consulta el módulo de resultados.</p>
        </div>
      </div>
    );
  }

  if (votoEnviado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sena-bg p-4 text-center">
        <div className="rounded-2xl bg-white p-8 shadow-lg max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sena-green/10 text-sena-green text-3xl">✓</div>
          <h2 className="mt-4 text-2xl font-bold text-sena-navy">¡Voto Registrado Exitosamente!</h2>
          <button 
            onClick={() => setVotoEnviado(false)} 
            className="mt-6 rounded-xl bg-sena-green px-6 py-2.5 font-semibold text-white hover:opacity-90"
          >
            Siguiente Votante
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sena-bg py-8 px-4 sm:px-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-sena-navy sm:text-4xl">Tarjetón Electoral SENA</h1>
        <p className="mt-2 text-slate-600">Selecciona el candidato de tu preferencia o el voto en blanco</p>
      </header>

      <div className="mx-auto max-w-5xl grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {candidatos.map((cand) => (
          <CardCandidato 
            key={cand.id} 
            candidato={cand} 
            onSeleccionar={(cand) => setCandidatoSeleccionado(cand)} 
          />
        ))}
      </div>

      {/* Modal de Confirmación */}
      {candidatoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-sena-navy">Confirmar Voto</h3>
            <p className="mt-2 text-slate-600">
              ¿Estás seguro de votar por <strong className="text-sena-navy">{candidatoSeleccionado.nombre}</strong>?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setCandidatoSeleccionado(null)} 
                className="rounded-xl px-4 py-2 font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button 
                onClick={handleVotar} 
                className="rounded-xl bg-sena-green px-5 py-2 font-semibold text-white hover:opacity-90"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};