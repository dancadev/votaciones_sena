import React from 'react';
import { NavLink } from 'react-router-dom';

export const Navbar = () => {
  const linkStyles = ({ isActive }) =>
    `px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-sena-green text-white shadow-sm'
        : 'text-slate-300 hover:text-white hover:bg-sena-blue/40'
    }`;

  return (
    <nav className="bg-sena-navy px-4 py-3 shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        {/* Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-sena-green flex items-center justify-center font-black text-white text-xs">
            SENA
          </div>
          <span className="font-bold text-white text-lg tracking-tight">
            Votaciones SENA
          </span>
        </div>

        {/* Enlaces de Rutas */}
        <div className="flex flex-wrap justify-end gap-2">
          <NavLink to="/" className={linkStyles}>
            Ingreso
          </NavLink>
          <NavLink to="/votacion" className={linkStyles}>
            Cabina de Voto
          </NavLink>
          <NavLink to="/propuestas" className={linkStyles}>
            Propuestas
          </NavLink>
          <NavLink to="/monitor" className={linkStyles}>
            En Vivo
          </NavLink>
          <NavLink to="/resultados" className={linkStyles}>
            Resultados
          </NavLink>
        </div>
      </div>
    </nav>
  );
};