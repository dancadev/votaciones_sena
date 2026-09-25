import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Download, Lock, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { descargarResultadosPdf, getResultadosFinales } from '../services/api';

/** Extrae el nombre del archivo que el servidor envía en Content-Disposition. */
const nombreDelArchivo = (encabezado) => {
  if (!encabezado) return null;
  const coincidencia = encabezado.match(/filename="?([^";]+)"?/i);
  return coincidencia?.[1] ?? null;
};

/**
 * Resultados del escrutinio.
 *
 * Visibles para administradores y votantes **solo** cuando el administrador
 * cerró la jornada y habilitó la publicación, después de la hora límite.
 * Mientras la votación siga abierta, el backend responde 403 y aquí se explica
 * por qué.
 *
 * El administrador puede descargar el acta en PDF en cualquier momento; los
 * votantes solo consultan los resultados en pantalla.
 */
export const ResultadosElectoralesPage = () => {
  const { esAdministrador } = useAuth();
  const [datos, setDatos] = useState(null);
  const [bloqueado, setBloqueado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [descargando, setDescargando] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await getResultadosFinales();
      setDatos(data);
      setBloqueado(null);
    } catch (err) {
      if (err.response?.status === 403) {
        setBloqueado(err.response.data?.error || 'Resultados aún no disponibles');
      } else {
        setBloqueado('No se pudieron cargar los resultados. Verifica que el servidor esté activo.');
      }
    } finally {
      setCargando(false);
    }
  }, []);

  const descargarPdf = async () => {
    setDescargando(true);
    setErrorDescarga(null);
    try {
      const respuesta = await descargarResultadosPdf();
      const archivo = nombreDelArchivo(respuesta.headers['content-disposition'])
        || 'resultados-representante-aprendices.pdf';

      const url = URL.createObjectURL(new Blob([respuesta.data], { type: 'application/pdf' }));
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = archivo;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
    } catch {
      setErrorDescarga('No se pudo generar el PDF de resultados. Inténtalo de nuevo.');
    } finally {
      setDescargando(false);
    }
  };

  useEffect(() => {
    queueMicrotask(cargar);
  }, [cargar]);

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sena-bg">
        <p className="font-semibold text-sena-navy">Cargando el escrutinio…</p>
      </div>
    );
  }

  if (bloqueado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sena-bg p-4 text-center">
        <div className="max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-sena-navy">Resultados no disponibles</h2>
          <p className="mt-2 text-slate-600">{bloqueado}</p>
          <p className="mt-2 text-sm text-slate-500">
            Los resultados se publican cuando el administrador cierra la jornada, después de las
            4:00 p. m.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={cargar}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-600 transition-colors hover:bg-slate-100"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </button>
            <Link
              to="/propuestas"
              className="rounded-xl bg-sena-navy px-5 py-2.5 font-semibold text-white transition-colors hover:bg-sena-green"
            >
              Ver propuestas
            </Link>
          </div>
          {esAdministrador && (
            <>
              {/* El administrador puede descargar el acta aunque aún no esté publicada. */}
              <button
                type="button"
                onClick={descargarPdf}
                disabled={descargando}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sena-green px-5 py-2.5 font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {descargando ? 'Generando PDF…' : 'Descargar resultados en PDF'}
              </button>
              {errorDescarga && (
                <p className="mt-2 text-sm font-medium text-red-700">⚠️ {errorDescarga}</p>
              )}
              <Link
                to="/monitor"
                className="mt-4 block text-sm font-semibold text-sena-green hover:underline"
              >
                Ir al monitor para cerrar la jornada
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  const resultados = datos?.resultados ?? [];
  const totalVotos = datos?.total_votos ?? 0;
  const maximo = Math.max(...resultados.map((item) => item.votos), 1);

  return (
    <div className="min-h-screen bg-sena-bg py-10 px-4 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 text-center">
          <span className="inline-block rounded-full bg-sena-green/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-sena-green">
            Jornada finalizada
          </span>
          <h1 className="mt-3 text-3xl font-extrabold text-sena-navy sm:text-4xl">
            Resultados Oficiales del Escrutinio
          </h1>
          <p className="mt-2 text-slate-600">
            Total de votos registrados: <strong className="text-sena-navy">{totalVotos}</strong>
          </p>

          {/* El acta en PDF es exclusiva del administrador. */}
          {esAdministrador && (
            <div className="mt-5">
              <button
                type="button"
                onClick={descargarPdf}
                disabled={descargando}
                className="inline-flex items-center gap-2 rounded-xl bg-sena-navy px-5 py-2.5 font-semibold text-white shadow-md transition-colors hover:bg-sena-green disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {descargando ? 'Generando PDF…' : 'Descargar resultados en PDF'}
              </button>
              {errorDescarga && (
                <p className="mt-2 text-sm font-medium text-red-700">⚠️ {errorDescarga}</p>
              )}
            </div>
          )}
        </header>

        {datos?.ganador && (
          <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-sena-navy to-sena-blue p-8 text-white shadow-xl">
            <span className="rounded-full bg-sena-green px-4 py-1 text-xs font-bold uppercase tracking-wider">
              🏆 Mayor votación
            </span>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">{datos.ganador.nombre}</h2>
            <p className="mt-2 text-slate-200">
              Tarjetón #{datos.ganador.numero_tarjeton} ·{' '}
              <strong className="text-white underline">{datos.ganador.votos} votos</strong>
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md">
          <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-sena-navy">
            <BarChart3 className="h-5 w-5 text-sena-blue" />
            Detalle de la votación
          </h3>

          <div className="space-y-5">
            {resultados.map((item) => (
              <div key={item.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-sena-navy">
                      {item.es_voto_blanco ? 'VB' : `#${item.numero_tarjeton}`}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {item.nombre || 'Cupo sin candidato'}
                    </span>
                    {!item.activo && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                        fuera del tarjetón
                      </span>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-lg font-bold text-sena-navy">{item.votos}</span>
                    <span className="ml-1 text-sm text-slate-500">votos</span>
                  </div>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      item.es_voto_blanco ? 'bg-slate-400' : 'bg-sena-green'
                    }`}
                    style={{ width: `${Math.round((item.votos / maximo) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          El voto es secreto: el sistema cuenta los sufragios sin asociarlos a cada votante.
        </p>
      </div>
    </div>
  );
};
