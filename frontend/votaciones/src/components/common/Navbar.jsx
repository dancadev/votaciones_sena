import { NavLink } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useEstadoJornada } from '../../hooks/useEstadoJornada';

const Enlace = ({ to, children }) => {
  const linkStyles = ({ isActive }) =>
    `px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-sena-green text-white shadow-sm'
        : 'text-slate-300 hover:text-white hover:bg-sena-blue/40'
    }`;

  return (
    <NavLink to={to} className={linkStyles}>
      {children}
    </NavLink>
  );
};

/**
 * Barra de navegación por perfil.
 *
 * * Cualquiera ve **Propuestas** (módulo siempre habilitado).
 * * Los resultados solo aparecen cuando el administrador los publicó.
 * * Las secciones del administrador (ingreso, monitor y cierre) se muestran
 *   únicamente con sesión de administrador iniciada.
 */
export const Navbar = () => {
  const { esAdministrador, administrador, cerrarSesionAdmin } = useAuth();
  const { resultadosHabilitados } = useEstadoJornada();

  return (
    <nav className="bg-sena-navy px-4 py-3 shadow-lg">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <NavLink to="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sena-green text-xs font-black text-white">
            SENA
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Votaciones SENA</span>
        </NavLink>

        <div className="flex flex-wrap items-center justify-end gap-1">
          <Enlace to="/">Inicio</Enlace>
          <Enlace to="/propuestas">Propuestas</Enlace>
          <Enlace to="/cabina">Cabina de Votación</Enlace>

          {resultadosHabilitados && <Enlace to="/resultados">Resultados</Enlace>}

          {esAdministrador && (
            <>
              <span className="mx-1 hidden h-6 w-px bg-white/20 sm:block" />
              <span className="hidden items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white sm:flex">
                <ShieldCheck className="h-3.5 w-3.5 text-sena-green" />
                {administrador?.nombre_completo || 'Administrador'}
              </span>
              <Enlace to="/admin/ingreso">Ingreso</Enlace>
              <Enlace to="/monitor">En Vivo</Enlace>
              {!resultadosHabilitados && <Enlace to="/resultados">Resultados</Enlace>}
              <button
                type="button"
                onClick={cerrarSesionAdmin}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-red-500/20 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
