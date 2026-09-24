import { useCallback, useEffect, useState } from 'react';
import { getEstadoJornada } from '../services/api';

/**
 * Estado de la jornada compartido por la barra de navegación y las páginas.
 *
 * Devuelve, entre otros datos:
 *  - `jornadaActiva`: si todavía se puede votar.
 *  - `resultadosHabilitados`: si el administrador ya publicó los resultados.
 */
export const useEstadoJornada = () => {
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    try {
      const { data } = await getEstadoJornada();
      setEstado(data);
      return data;
    } catch {
      setEstado(null);
      return null;
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(recargar);
  }, [recargar]);

  return {
    estado,
    cargando,
    recargar,
    jornadaActiva: estado?.jornada_activa ?? true,
    resultadosHabilitados: estado?.resultados_habilitados ?? false,
  };
};
