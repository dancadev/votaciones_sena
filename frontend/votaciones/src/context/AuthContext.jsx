import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  EVENTO_SESION_EXPIRADA,
  cerrarSesionVotante as apiCerrarSesionVotante,
  getSesionVotante,
  getTokenAdmin,
  getUsuarioActual,
  guardarTokenAdmin,
  guardarTokenVotante,
  loginAdmin,
} from '../services/api';

const AuthContext = createContext(null);

/** Identificador del contexto; el hook que lo consume vive en `hooks/useAuth`. */
export const AuthContexto = AuthContext;

/**
 * Administra los dos perfiles del sistema.
 *
 * * **Administrador**: sesión con token; se restaura al recargar consultando
 *   `/auth/yo/`, que falla si el token ya no sirve.
 * * **Votante**: sesión temporal que la cabina obtiene al validar la cédula y
 *   que se descarta al votar o al salir.
 */
export const AuthProvider = ({ children }) => {
  const [administrador, setAdministrador] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [votante, setVotante] = useState(null);

  const cerrarSesionAdmin = useCallback(() => {
    guardarTokenAdmin(null);
    setAdministrador(null);
  }, []);

  // Restaura la sesión del administrador al montar la aplicación.
  useEffect(() => {
    const restaurar = async () => {
      if (!getTokenAdmin()) {
        setCargandoSesion(false);
        return;
      }
      try {
        const { data } = await getUsuarioActual();
        setAdministrador(data.usuario);
      } catch {
        guardarTokenAdmin(null);
        setAdministrador(null);
      } finally {
        setCargandoSesion(false);
      }
    };
    queueMicrotask(restaurar);
  }, []);

  // Si el token caduca durante el uso, se cierra la sesión sola.
  useEffect(() => {
    const alExpirar = () => setAdministrador(null);
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, []);

  const iniciarSesion = useCallback(async (username, password) => {
    const { data } = await loginAdmin(username, password);
    guardarTokenAdmin(data.token);
    setAdministrador(data.usuario);
    return data.usuario;
  }, []);

  const registrarSesionVotante = useCallback((token, datosVotante) => {
    guardarTokenVotante(token);
    setVotante(datosVotante);
  }, []);

  const cerrarSesionVotante = useCallback(async () => {
    try {
      await apiCerrarSesionVotante();
    } catch {
      // Aunque el servidor no responda, la cabina se limpia en el navegador.
    }
    guardarTokenVotante(null);
    setVotante(null);
  }, []);

  // La cabina restaura al votante si recarga la página a mitad del proceso.
  const restaurarVotante = useCallback(async () => {
    try {
      const { data } = await getSesionVotante();
      setVotante(data.votante);
      return data;
    } catch {
      guardarTokenVotante(null);
      setVotante(null);
      return null;
    }
  }, []);

  const valor = useMemo(
    () => ({
      administrador,
      esAdministrador: Boolean(administrador?.es_administrador),
      cargandoSesion,
      iniciarSesion,
      cerrarSesionAdmin,
      votante,
      registrarSesionVotante,
      cerrarSesionVotante,
      restaurarVotante,
      setVotante,
    }),
    [
      administrador,
      cargandoSesion,
      iniciarSesion,
      cerrarSesionAdmin,
      votante,
      registrarSesionVotante,
      cerrarSesionVotante,
      restaurarVotante,
    ],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
};
