import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CircleUserRound, Vote } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useEstadoJornada } from '../hooks/useEstadoJornada';
import { getCandidato } from '../services/api';
import { getFotoUrl } from '../utils/candidatos';

/**
 * Micrositio del candidato.
 *
 * Muestra el perfil (foto, número de tarjetón, nombre y dependencia) y las
 * propuestas completas. Es informativo: el sufragio se emite en la cabina de
 * votación, después de que el administrador valide la cédula.
 */
export const CandidatoDetallePage = () => {
  const { id } = useParams();
  const { votante } = useAuth();
  const { jornadaActiva, estado } = useEstadoJornada();

  const [candidato, setCandidato] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const { data } = await getCandidato(id);
      setCandidato(data.candidato);
    } catch (err) {
      setErrorCarga(
        err.response?.status === 404
          ? 'El candidato no existe o ya no está disponible en el tarjetón.'
          : 'No se pudo cargar el perfil. Verifica que el servidor esté activo.',
      );
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    queueMicrotask(cargar);
  }, [cargar]);

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sena-bg">
        <p className="font-semibold text-sena-navy">Cargando perfil…</p>
      </div>
    );
  }

  if (errorCarga || !candidato) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sena-bg p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="text-4xl">🔍</div>
          <h2 className="mt-3 text-2xl font-bold text-sena-navy">Perfil no disponible</h2>
          <p className="mt-2 text-slate-600">{errorCarga}</p>
          <Link
            to="/propuestas"
            className="mt-6 inline-block rounded-xl bg-sena-navy px-6 py-2.5 font-semibold text-white transition-colors hover:bg-sena-green"
          >
            Volver a las propuestas
          </Link>
        </div>
      </div>
    );
  }

  const propuesta = candidato.propuesta?.trim();

  return (
    <div className="min-h-screen bg-sena-bg py-8 px-4 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/propuestas"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-sena-navy"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a las propuestas
        </Link>

        <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-xl">
          {/* Encabezado con el perfil del candidato */}
          <div className="bg-gradient-to-r from-sena-navy to-sena-blue p-6 text-white sm:p-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end">
              {candidato.foto ? (
                <img
                  src={getFotoUrl(candidato.foto)}
                  alt={candidato.nombre}
                  className="h-40 w-40 rounded-2xl object-cover ring-4 ring-white/30"
                />
              ) : (
                <div className="flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-2xl bg-white/10 ring-4 ring-white/20">
                  <CircleUserRound className="h-14 w-14" strokeWidth={1.2} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Sin foto</span>
                </div>
              )}

              <div className="text-center sm:pb-2 sm:text-left">
                <span className="inline-flex items-center rounded-full bg-sena-green px-4 py-1 text-xs font-bold uppercase tracking-wider">
                  Tarjetón #{candidato.numero_tarjeton}
                </span>
                <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{candidato.nombre}</h1>
                <p className="mt-1 text-sm text-slate-200">Candidato al tarjetón electoral SENA</p>
              </div>
            </div>
          </div>

          {/* Propuestas */}
          <div className="p-6 sm:p-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-sena-blue">
              Propuestas
            </h2>

            {propuesta ? (
              <div className="mt-4 space-y-4">
                {propuesta.split('\n').filter(Boolean).map((parrafo, indice) => (
                  <p key={indice} className="text-base leading-relaxed text-slate-700">
                    {parrafo}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm italic text-slate-400">
                Este candidato aún no ha registrado su propuesta.
              </p>
            )}

            {/* Cómo votar por este candidato */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-sena-bg p-5">
              {!jornadaActiva ? (
                <p className="text-sm font-medium text-slate-600">
                  La jornada de votación está cerrada. Puedes seguir consultando las propuestas.
                </p>
              ) : votante ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-600">
                    Tu cédula ya está validada. Puedes emitir tu voto en la cabina.
                  </p>
                  <Link
                    to="/cabina"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-sena-green px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    <Vote className="h-4 w-4" />
                    Ir a votar
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-600">
                    Para votar, el administrador debe validar tu cédula en el módulo de ingreso y
                    luego debes abrir la cabina de votación
                    {estado?.hora_cierre_votacion
                      ? ` (votación hasta las ${String(estado.hora_cierre_votacion).slice(0, 5)})`
                      : ''}
                    .
                  </p>
                  <Link
                    to="/cabina"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-sena-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sena-green"
                  >
                    <Vote className="h-4 w-4" />
                    Abrir cabina
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
