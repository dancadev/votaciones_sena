import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
const PantallaCargando = () => (
  <div className="flex min-h-screen items-center justify-center bg-sena-bg">
    <p className="font-semibold text-sena-navy">Verificando sesión…</p>
  </div>
);

/**
 * Envoltorio de las secciones exclusivas del administrador (login, monitor en
 * vivo, resultados y cierre de jornada). Si no hay sesión, redirige al login
 * recordando la ruta solicitada.
 */
export const RutaAdministrador = () => {
  const { esAdministrador, cargandoSesion } = useAuth();
  const ubicacion = useLocation();

  if (cargandoSesion) return <PantallaCargando />;

  if (!esAdministrador) {
    return <Navigate to="/admin/login" replace state={{ desde: ubicacion.pathname }} />;
  }

  return <Outlet />;
};

/**
 * Envoltorio de la cabina de votación. Solo se entra con la cédula validada
 * previamente por el administrador en el módulo de ingreso.
 */
export const RutaVotante = () => {
  const { votante, cargandoSesion } = useAuth();

  if (cargandoSesion) return <PantallaCargando />;

  if (!votante) {
    return <Navigate to="/cabina" replace />;
  }

  return <Outlet />;
};
