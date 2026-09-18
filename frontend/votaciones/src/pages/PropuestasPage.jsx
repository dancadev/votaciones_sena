import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Info, Lock, Search } from 'lucide-react';
import { CardPropuesta } from '../components/votacion/CardPropuesta';
import { ModalConfirmacionVoto } from '../components/votacion/ModalConfirmacionVoto';
import { getPropuestas } from '../services/api';

/**
 * Módulo de propuestas y votación.
 *
 * Reúne en un solo lugar la propuesta de cada candidato y el sufragio: cada
 * tarjeta muestra la foto del candidato con su botón "Votar" encima.
 */
export const PropuestasPage = () => {
  const [candidatos, setCandidatos] = useState([]);
  const [jornadaActiva, setJornadaActiva] = useState(true);
  const [cuposDisponibles, setCuposDisponibles] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState(null);
  const [votoRegistrado, setVotoRegistrado] = useState(false);

  const cargarPropuestas = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const { data } = await getPropuestas();
      setCandidatos(data.propuestas ?? []);
      setJornadaActiva(data.jornada_activa ?? true);
      setCuposDisponibles(data.cupos_disponibles ?? 0);
    } catch {
      setErrorCarga('No se pudieron cargar las propuestas. Verifica que el servidor esté activo.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    // Se difiere el arranque para no actualizar estado de forma sincrónica
    // dentro del propio efecto.
    queueMicrotask(cargarPropuestas);
  }, [cargarPropuestas]);

  const candidatosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return candidatos;

    return candidatos.filter((candidato) => {
      // El voto en blanco no tiene nombre: se mantiene siempre como opción.
      if (candidato.es_voto_blanco) return true;
      return (
        candidato.nombre?.toLowerCase().includes(termino) ||
        candidato.propuesta?.toLowerCase().includes(termino) ||
        `#${candidato.numero_tarjeton}`.includes(termino)
      );
    });
  }, [candidatos, busqueda]);

  const registrarVotoExitoso = () => {
    setCandidatoSeleccionado(null);
    setVotoRegistrado(true);
  };

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sena-bg">
        <p className="font-semibold text-sena-navy">Cargando propuestas…</p>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sena-bg p-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
          <div className="text-4xl">⚠️</div>
          <h2 className="mt-3 text-2xl font-bold text-sena-navy">Sin conexión</h2>
          <p className="mt-2 text-slate-600">{errorCarga}</p>
          <button
            type="button"
            onClick={cargarPropuestas}
            className="mt-6 rounded-xl bg-sena-navy px-6 py-2.5 font-semibold text-white transition-colors hover:bg-sena-green"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (votoRegistrado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sena-bg p-4 text-center">
        <div className="max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sena-green/10 text-sena-green">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-sena-navy">¡Voto Registrado Exitosamente!</h2>
          <p className="mt-2 text-slate-600">
            Tu sufragio quedó guardado en el escrutinio de la jornada electoral.
          </p>
          <button
            type="button"
            onClick={() => {
              setVotoRegistrado(false);
              setBusqueda('');
            }}
            className="mt-6 rounded-xl bg-sena-green px-6 py-2.5 font-semibold text-white transition-opacity hover:opacity-90"
          >
            {jornadaActiva ? 'Siguiente Votante' : 'Volver a las propuestas'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sena-bg py-8 px-4 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 text-center">
          <span
            className={`inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${
              jornadaActiva ? 'bg-sena-green/10 text-sena-green' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {jornadaActiva ? '● Jornada activa' : '● Jornada cerrada'}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold text-sena-navy sm:text-4xl">
            Propuestas de los Candidatos
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-slate-600">
            Lee las propuestas de cada candidato y emite tu voto con el botón{' '}
            <strong className="font-semibold text-sena-navy">Votar</strong> ubicado sobre cada imagen.
          </p>
        </header>

        {/* Aviso de jornada cerrada */}
        {!jornadaActiva && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-600">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
            <p className="text-sm">
              La jornada electoral ya finalizó: las propuestas siguen disponibles para consulta, pero
              no es posible registrar nuevos votos.
            </p>
          </div>
        )}

        {/* Buscador y conteo */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar candidato, número o tema…"
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-sena-green focus:outline-none focus:ring-2 focus:ring-sena-green/20"
            />
          </div>
          <p className="text-sm text-slate-500">
            <strong className="font-bold text-sena-navy">{candidatosFiltrados.length}</strong>{' '}
            {candidatosFiltrados.length === 1 ? 'opción en el tarjetón' : 'opciones en el tarjetón'}
            {cuposDisponibles > 0 && (
              <>
                {' · '}
                <span className="font-medium text-slate-400">
                  {cuposDisponibles} {cuposDisponibles === 1 ? 'cupo pendiente' : 'cupos pendientes'} por asignar
                </span>
              </>
            )}
          </p>
        </div>

        {/* Tarjetas de propuestas */}
        {candidatosFiltrados.length === 0 ? (
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-sena-blue" />
            <p className="text-sm">No se encontraron candidatos con ese criterio de búsqueda.</p>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
            {candidatosFiltrados.map((candidato) => (
              <CardPropuesta
                key={candidato.id}
                candidato={candidato}
                votacionHabilitada={jornadaActiva}
                onVotar={setCandidatoSeleccionado}
              />
            ))}
          </div>
        )}
      </div>

      <ModalConfirmacionVoto
        candidato={candidatoSeleccionado}
        onCerrar={() => setCandidatoSeleccionado(null)}
        onRegistrado={registrarVotoExitoso}
      />
    </div>
  );
};
