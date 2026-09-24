import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Clock,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Vote,
} from 'lucide-react';
import { cerrarJornada, getTotalVotosRealtime, reabrirJornada } from '../services/api';

/**
 * Monitor en vivo: **exclusivo del administrador**.
 *
 * Muestra el avance de la jornada y concentra las acciones de cierre. A partir
 * de la hora límite (4:00 p.m. por defecto) se habilita el botón que cierra la
 * votación y publica los resultados para administradores y votantes.
 */
export const MonitorRealTimePage = () => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const { data } = await getTotalVotosRealtime();
      setDatos(data);
    } catch {
      setError('No se pudieron obtener las cifras de la jornada.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(cargar);
    // El monitor se refresca solo cada 5 segundos.
    const intervalo = setInterval(cargar, 5000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  const ejecutar = async (accion) => {
    setProcesando(true);
    setError(null);
    setMensaje(null);
    try {
      const { data } = await accion();
      setMensaje(data.mensaje);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo completar la acción.');
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sena-bg">
        <p className="font-semibold text-sena-navy">Cargando el monitor…</p>
      </div>
    );
  }

  const hora = datos?.hora_cierre_votacion ? String(datos.hora_cierre_votacion).slice(0, 5) : null;
  const puedeCerrar = Boolean(datos?.puede_cerrar_jornada);
  const jornadaActiva = Boolean(datos?.jornada_activa);

  return (
    <div className="min-h-screen bg-sena-bg py-8 px-4 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-sena-navy px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
            <ShieldCheck className="h-3.5 w-3.5 text-sena-green" />
            Panel del administrador
          </span>
          <h1 className="mt-3 text-3xl font-extrabold text-sena-navy sm:text-4xl">
            Monitor de la Jornada Electoral
          </h1>
          <p className="mt-2 text-slate-600">Avance de la votación en tiempo real</p>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 font-medium text-red-700">
            ⚠️ {error}
          </div>
        )}

        {mensaje && (
          <div className="mb-6 rounded-xl border border-sena-green/30 bg-green-50 p-4 font-medium text-sena-green">
            ✓ {mensaje}
          </div>
        )}

        {/* Cifras principales */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-md">
            <Vote className="mx-auto h-6 w-6 text-sena-green" />
            <div className="mt-2 text-5xl font-black tracking-tight text-sena-navy">
              {datos?.total_votos ?? 0}
            </div>
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Votos registrados
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-md">
            <UserCheck className="mx-auto h-6 w-6 text-sena-blue" />
            <div className="mt-2 text-5xl font-black tracking-tight text-sena-navy">
              {datos?.votantes_habilitados ?? 0}
            </div>
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Cédulas validadas
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-md">
            <Clock className="mx-auto h-6 w-6 text-amber-500" />
            <div className="mt-2 text-5xl font-black tracking-tight text-sena-navy">
              {datos?.votantes_pendientes ?? 0}
            </div>
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Validados sin votar
            </p>
          </div>
        </div>

        {/* Estado de la jornada y acciones */}
        <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-sena-navy">Estado de la jornada</h2>
              <p className="mt-1 text-sm text-slate-600">
                {jornadaActiva
                  ? `Votación abierta${hora ? ` · cierre previsto a las ${hora}` : ''}`
                  : 'Votación cerrada'}
                {' · '}
                {datos?.resultados_publicos
                  ? 'resultados publicados para los votantes'
                  : 'resultados aún no publicados'}
              </p>
            </div>
            <button
              type="button"
              onClick={cargar}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
          </div>

          {jornadaActiva ? (
            <div className="mt-5 rounded-xl bg-sena-bg p-4">
              {puedeCerrar ? (
                <>
                  <p className="text-sm text-slate-600">
                    Ya pasó la hora límite de votación. Al cerrar la jornada, los resultados se
                    publican de inmediato para administradores y votantes.
                  </p>
                  <button
                    type="button"
                    onClick={() => ejecutar(() => cerrarJornada(false))}
                    disabled={procesando}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-sena-green px-5 py-2.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    <BarChart3 className="h-4 w-4" />
                    {procesando ? 'Cerrando…' : 'Cerrar jornada y publicar resultados'}
                  </button>
                </>
              ) : (
                <>
                  <p className="flex items-start gap-2 text-sm text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    Todavía no se alcanza la hora límite
                    {hora ? ` (${hora})` : ''}. Espera a que termine la fila para cerrar y publicar
                    los resultados; también puedes forzar el cierre si ya no queda nadie votando.
                  </p>
                  <button
                    type="button"
                    onClick={() => ejecutar(() => cerrarJornada(true))}
                    disabled={procesando}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-amber-400 bg-white px-5 py-2.5 font-semibold text-amber-800 transition-colors hover:bg-amber-50 disabled:opacity-60"
                  >
                    {procesando ? 'Cerrando…' : 'Forzar cierre y publicar ahora'}
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="mt-5 rounded-xl bg-sena-bg p-4">
              <p className="text-sm text-slate-600">
                La jornada está cerrada y los resultados publicados. Si aún queda gente en la fila,
                puedes reabrir la votación: al hacerlo los resultados se ocultan de nuevo.
              </p>
              <button
                type="button"
                onClick={() => ejecutar(reabrirJornada)}
                disabled={procesando}
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60"
              >
                {procesando ? 'Reabriendo…' : 'Reabrir votación'}
              </button>
            </div>
          )}
        </div>

        {/* Accesos del administrador */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link
            to="/admin/ingreso"
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-md transition-colors hover:border-sena-green"
          >
            <UserCheck className="h-6 w-6 text-sena-green" />
            <div>
              <p className="font-bold text-sena-navy">Validar ingreso</p>
              <p className="text-sm text-slate-500">Habilita la cédula para la cabina</p>
            </div>
          </Link>

          <Link
            to="/resultados"
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-md transition-colors hover:border-sena-green"
          >
            <BarChart3 className="h-6 w-6 text-sena-blue" />
            <div>
              <p className="font-bold text-sena-navy">Resultados</p>
              <p className="text-sm text-slate-500">Escrutinio de la jornada</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
