import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

export const buscarVotante = (documento) => API.post('/votantes/buscar/', { documento });
export const registrarIngresoVotante = (documento) => API.post('/votantes/ingreso/', { documento });
export const getCandidatos = () => API.get('/elecciones/candidatos/');
export const getPropuestas = () => API.get('/elecciones/propuestas/');
export const registrarVoto = (candidatoId) => API.post('/elecciones/votar/', { candidato_id: candidatoId });
export const getEstadoJornada = () => API.get('/elecciones/estado/');
export const getTotalVotosRealtime = () => API.get('/elecciones/total-realtime/');
export const getResultadosFinales = () => API.get('/elecciones/resultados/');