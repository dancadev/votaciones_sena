import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

/**
 * Ingreso del administrador con usuario y contraseña de Django.
 *
 * Es la única puerta a las secciones restringidas: monitor en vivo, resultados
 * y cierre de jornada.
 */
export const LoginAdminPage = () => {
  const { iniciarSesion, esAdministrador, cargandoSesion } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (!cargandoSesion && esAdministrador) {
    return <Navigate to={ubicacion.state?.desde || '/monitor'} replace />;
  }

  const enviar = async (evento) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await iniciarSesion(username.trim(), password);
      navegar(ubicacion.state?.desde || '/monitor', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar sesión. Verifica el servidor.');
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sena-bg px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-sena-navy"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="bg-sena-navy px-6 py-6 text-white">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sena-green">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold">Acceso del administrador</h1>
            <p className="mt-1 text-sm text-slate-300">
              Sección restringida: monitor en vivo, cierre de jornada y publicación de resultados.
            </p>
          </div>

          <form onSubmit={enviar} className="p-6">
            <label className="block text-sm font-semibold text-sena-navy" htmlFor="username">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(evento) => setUsername(evento.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 focus:border-sena-green focus:outline-none focus:ring-2 focus:ring-sena-green/20"
              placeholder="Usuario de Django"
            />

            <label className="mt-4 block text-sm font-semibold text-sena-navy" htmlFor="password">
              Contraseña
            </label>
            <div className="relative mt-2">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(evento) => setPassword(evento.target.value)}
                className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-slate-800 focus:border-sena-green focus:outline-none focus:ring-2 focus:ring-sena-green/20"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="mt-6 w-full rounded-xl bg-sena-green py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {enviando ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Los votantes no necesitan usuario: el administrador valida su cédula en el módulo de
          ingreso para habilitar la cabina de votación.
        </p>
      </div>
    </div>
  );
};
