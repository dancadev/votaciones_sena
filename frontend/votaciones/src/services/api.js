import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

/** Claves donde se guardan los dos tipos de sesión, que nunca se mezclan. */
export const CLAVE_TOKEN_ADMIN = 'votaciones.tokenAdmin';
export const CLAVE_TOKEN_VOTANTE = 'votaciones.tokenVotante';

export const getTokenAdmin = () => localStorage.getItem(CLAVE_TOKEN_ADMIN);
export const getTokenVotante = () => localStorage.getItem(CLAVE_TOKEN_VOTANTE);

export const guardarTokenAdmin = (token) => {
  if (token) localStorage.setItem(CLAVE_TOKEN_ADMIN, token);
  else localStorage.removeItem(CLAVE_TOKEN_ADMIN);
};

export const guardarTokenVotante = (token) => {
  if (token) localStorage.setItem(CLAVE_TOKEN_VOTANTE, token);
  else localStorage.removeItem(CLAVE_TOKEN_VOTANTE);
};

const API = axios.create({ baseURL: `${API_BASE_URL}/api` });

// El administrador viaja como token de DRF; el votante en su propia cabecera.
API.interceptors.request.use((config) => {
  const tokenAdmin = getTokenAdmin();
  if (tokenAdmin) {
    config.headers.Authorization = `Token ${tokenAdmin}`;
  }

  const tokenVotante = getTokenVotante();
  if (tokenVotante) {
    config.headers['X-Votante-Token'] = tokenVotante;
  }

  return config;
});

/** Se avisa al contexto de autenticación cuando el token del administrador caduca. */
export const EVENTO_SESION_EXPIRADA = 'votaciones:sesion-expirada';

API.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const esRutaDeLogin = error.config?.url?.includes('/auth/login/');
    if (error.response?.status === 401 && getTokenAdmin() && !esRutaDeLogin) {
      guardarTokenAdmin(null);
      window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    }
    return Promise.reject(error);
  },
);

// --------------------------------------------------------------------------- //
// Autenticación del administrador
// --------------------------------------------------------------------------- //
export const loginAdmin = (username, password) =>
  API.post('/auth/login/', { username, password });
export const logoutAdmin = () => API.post('/auth/logout/');
export const getUsuarioActual = () => API.get('/auth/yo/');

// --------------------------------------------------------------------------- //
// Público: propuestas y micrositios (siempre habilitados)
// --------------------------------------------------------------------------- //
export const getPropuestas = () => API.get('/elecciones/propuestas/');
export const getTarjeton = () => API.get('/elecciones/tarjeton/');
export const getCandidato = (id) => API.get(`/elecciones/candidatos/${id}/`);
export const getPlanTrabajo = (id) => API.get(`/elecciones/candidatos/${id}/plan/`);
export const getCandidatos = () => API.get('/elecciones/candidatos/');
export const getEstadoJornada = () => API.get('/elecciones/estado/');

// --------------------------------------------------------------------------- //
// Cabina de votación (votante)
// --------------------------------------------------------------------------- //
export const validarCedula = (documento) => API.post('/votantes/validar/', { documento });
export const getSesionVotante = () => API.get('/votantes/sesion/');
export const cerrarSesionVotante = () => API.post('/votantes/cerrar-sesion/');
export const registrarVoto = (candidatoId) =>
  API.post('/elecciones/votar/', { candidato_id: candidatoId });

// --------------------------------------------------------------------------- //
// Módulo de ingreso (solo administrador)
// --------------------------------------------------------------------------- //
export const buscarVotante = (documento) => API.post('/votantes/buscar/', { documento });
export const registrarIngresoVotante = (documento) => API.post('/votantes/ingreso/', { documento });

// --------------------------------------------------------------------------- //
// Administrador: monitor, configuración y resultados
// --------------------------------------------------------------------------- //
export const getTotalVotosRealtime = () => API.get('/elecciones/total-realtime/');
export const getConfiguracionJornada = () => API.get('/elecciones/configuracion/');
export const actualizarConfiguracionJornada = (datos) =>
  API.patch('/elecciones/configuracion/', datos);
export const cerrarJornada = (forzar = false) =>
  API.post('/elecciones/cerrar-jornada/', forzar ? { forzar: true } : {});
export const reabrirJornada = () => API.post('/elecciones/reabrir-jornada/');
export const getResultadosFinales = () => API.get('/elecciones/resultados/');

/** Descarga el acta de resultados en PDF (solo administrador). */
export const descargarResultadosPdf = () =>
  API.get('/elecciones/resultados/pdf/', { responseType: 'blob' });

export default API;
