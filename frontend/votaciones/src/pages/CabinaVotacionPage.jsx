import { useCallback, useEffect, useState } from 'react';
import { CardCandidato } from '../components/votacion/CardCandidato';
import { ModalConfirmacionVoto } from '../components/votacion/ModalConfirmacionVoto';
import { getCandidatos, getEstadoJornada } from '../services/api';

export const CabinaVotacionPage = () => {
  const [candidatos, setCandidatos] = useState([]);
  const [jornadaActiva, setJornadaActiva] = useState(true);
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState(null);
  const [votoEnviado, setVotoEnviado] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      const [estado, lista] = await Promise.all([getEstadoJornada(), getCandidatos()]);
      setJornadaActiva(estado.data.is_activa);
      setCandidatos(lista.data);
    } catch {
      // La cabina mantiene su estado por defecto y el error se reporta al votar.
    }
  }, []);

  useEffect(() => {
    // Se difiere el arranque para no actualizar estado de forma sincrónica
    // dentro del propio efecto.
    queueMicrotask(cargarDatos);
  }, [cargarDatos]);

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

      <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-6">
        {candidatos.map((cand) => (
          <CardCandidato 
            key={cand.id} 
            candidato={cand} 
            onSeleccionar={setCandidatoSeleccionado} 
          />
        ))}
      </div>

      <ModalConfirmacionVoto
        candidato={candidatoSeleccionado}
        onCerrar={() => setCandidatoSeleccionado(null)}
        onRegistrado={() => {
          setCandidatoSeleccionado(null);
          setVotoEnviado(true);
        }}
      />
    </div>
  );
};