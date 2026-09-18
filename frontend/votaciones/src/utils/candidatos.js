const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Los cupos del tarjetón que todavía no tienen candidato registrado llegan
 * desde la API sin nombre, sin propuesta y sin foto.
 */
export const esCupoDisponible = (candidato) =>
  candidato?.esta_configurado === false ||
  (!candidato?.es_voto_blanco && !candidato?.nombre?.trim());

export const getFotoUrl = (fotoPath) => {
  if (!fotoPath) return null;
  if (fotoPath.startsWith('http')) return fotoPath;
  return `${API_BASE_URL}${fotoPath}`;
};

/** Texto que identifica al tarjetón: "VB" para el voto en blanco, "#5" para el resto. */
export const getEtiquetaTarjeton = (candidato) =>
  candidato?.es_voto_blanco ? 'VB' : `#${candidato?.numero_tarjeton}`;

/** Nombre listo para mostrar, con respaldo para los cupos todavía vacíos. */
export const getNombreVisible = (candidato) =>
  candidato?.nombre?.trim() || `Cupo #${candidato?.numero_tarjeton} disponible`;
