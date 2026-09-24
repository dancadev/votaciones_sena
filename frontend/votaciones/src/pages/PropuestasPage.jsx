import { useCallback, useEffect, useMemo, useState } from 'react';
import { Info, Search } from 'lucide-react';
import { CardCandidatoFicha } from '../components/votacion/CardCandidatoFicha';
import { getPropuestas } from '../services/api';

/**
 * Módulo de propuestas: **siempre habilitado**.
 *
 * No depende del estado de la jornada (se consulta antes, durante y después de
 * la votación), no incluye el voto en blanco y no tiene botones de votar: al
 * hacer clic en un candidato se abre su micrositio con el perfil y las
 * propuestas.
 */
export const PropuestasPage = () => {
  const [candidatos, setCandidatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const { data } = await getPropuestas();
      setCandidatos(data.propuestas ?? []);
    } catch {
      setErrorCarga('No se pudieron cargar las propuestas. Verifica que el servidor esté activo.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(cargar);
  }, [cargar]);

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return candidatos;

    return candidatos.filter(
      (candidato) =>
        candidato.nombre?.toLowerCase().includes(termino) ||
        candidato.propuesta?.toLowerCase().includes(termino) ||
        `#${candidato.numero_tarjeton}`.includes(termino),
    );
  }, [candidatos, busqueda]);

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
            onClick={cargar}
            className="mt-6 rounded-xl bg-sena-navy px-6 py-2.5 font-semibold text-white transition-colors hover:bg-sena-green"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sena-bg py-8 px-4 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 text-center">
          <span className="inline-block rounded-full bg-sena-green/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-sena-green">
            Módulo siempre disponible
          </span>
          <h1 className="mt-3 text-3xl font-extrabold text-sena-navy sm:text-4xl">
            Propuestas de los Candidatos
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-slate-600">
            Haz clic en un candidato para abrir su micrositio y conocer su perfil y sus propuestas
            completas.
          </p>
        </header>

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
            <strong className="font-bold text-sena-navy">{filtrados.length}</strong>{' '}
            {filtrados.length === 1 ? 'candidato' : 'candidatos'}
          </p>
        </div>

        {filtrados.length === 0 ? (
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-sena-blue" />
            <p className="text-sm">No se encontraron candidatos con ese criterio de búsqueda.</p>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
            {filtrados.map((candidato) => (
              <CardCandidatoFicha key={candidato.id} candidato={candidato} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
