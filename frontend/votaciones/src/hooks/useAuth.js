import { useContext } from 'react';
import { AuthContexto } from '../context/AuthContext';

/**
 * Acceso al perfil autenticado (administrador o votante).
 *
 * Vive aparte del contexto para que el proveedor pueda recargarse en caliente
 * sin perder el estado durante el desarrollo.
 */
export const useAuth = () => {
  const contexto = useContext(AuthContexto);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return contexto;
};
