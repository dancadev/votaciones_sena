import { Link } from 'react-router-dom';
import { BarChart3, Clock, LayoutGrid, ShieldCheck, Vote } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useEstadoJornada } from '../hooks/useEstadoJornada';

/**
 * Página de inicio.
 *
 * Separa con claridad los componentes de cada perfil: lo público (propuestas),
 * el acceso del votante a la cabina y el acceso del administrador al panel.
 */
export const InicioPage = () => {
  const { esAdministrador, administrador } = useAuth();
  const { estado, resultadosHabilitados } = useEstadoJornada();

  const hora = estado?.hora_cierre_votacion
    ? String(estado.hora_cierre_votacion).slice(0, 5)
    : null;

  return (
    <div className="min-h-screen bg-sena-bg py-10 px-4 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="text-center">
          <span className="inline-block rounded-full bg-sena-green/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-sena-green">
            Elecciones SENA
          </span>
          <h1 className="mt-3 text-4xl font-extrabold text-sena-navy sm:text-5xl">
            Votaciones SENA
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            Consulta las propuestas de los candidatos, vota en la cabina y sigue el escrutinio
            cuando el administrador publique los resultados.
          </p>

          <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 text-sm">
            <span
              className={`rounded-full px-3 py-1 font-semibold ${
                estado?.jornada_activa
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {estado?.jornada_activa ? '● Votación abierta' : '● Votación cerrada'}
            </span>
            {hora && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-semibold text-slate-600 shadow-sm">
                <Clock className="h-3.5 w-3.5" />
                Cierre previsto {hora}
              </span>
            )}
            {resultadosHabilitados && (
              <span className="rounded-full bg-sena-navy px-3 py-1 font-semibold text-white">
                Resultados publicados
              </span>
            )}
          </div>
        </header>

        {/* Componentes públicos */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <Link
            to="/propuestas"
            className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:border-sena-green hover:shadow-xl"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sena-green/10 text-sena-green">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-sena-navy group-hover:text-sena-green">
              Propuestas de los candidatos
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Módulo siempre disponible. Entra al micrositio de cada candidato para conocer su perfil
              y sus propuestas.
            </p>
          </Link>

          <Link
            to="/cabina"
            className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:border-sena-green hover:shadow-xl"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sena-blue/10 text-sena-blue">
              <Vote className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-sena-navy group-hover:text-sena-green">
              Cabina de votación
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Para votar, el administrador debe validar tu cédula en el módulo de ingreso. Aquí
              confirmas tu documento y emites tu voto.
            </p>
          </Link>
        </div>

        {/* Resultados, si ya se publicaron */}
        {resultadosHabilitados && (
          <Link
            to="/resultados"
            className="group mt-5 flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:border-sena-green hover:shadow-xl"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sena-navy text-white">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-sena-navy group-hover:text-sena-green">
                Resultados publicados
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                El administrador ya habilitó el escrutinio para administradores y votantes.
              </p>
            </div>
          </Link>
        )}

        {/* Componentes del administrador */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sena-navy text-sena-green">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-sena-navy">Perfil administrador</h2>
              {esAdministrador ? (
                <>
                  <p className="mt-1 text-sm text-slate-600">
                    Sesión iniciada como{' '}
                    <strong className="text-sena-navy">
                      {administrador?.nombre_completo || administrador?.username}
                    </strong>
                    . Tienes acceso al monitor en vivo, a la validación de ingresos y al cierre de la
                    jornada.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      to="/monitor"
                      className="rounded-xl bg-sena-green px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      Monitor en vivo
                    </Link>
                    <Link
                      to="/admin/ingreso"
                      className="rounded-xl bg-sena-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sena-green"
                    >
                      Validar ingreso
                    </Link>
                    <Link
                      to="/resultados"
                      className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      Resultados
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm text-slate-600">
                    El monitor en vivo, la validación de ingresos y el cierre de la jornada son
                    exclusivos del administrador.
                  </p>
                  <Link
                    to="/admin/login"
                    className="mt-4 inline-block rounded-xl bg-sena-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sena-green"
                  >
                    Iniciar sesión como administrador
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
