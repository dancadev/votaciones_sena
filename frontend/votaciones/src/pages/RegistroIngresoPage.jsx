import React, { useState } from 'react';
import { buscarVotante, registrarIngresoVotante } from '../services/api';

export const RegistroIngresoPage = () => {
  const [documento, setDocumento] = useState('');
  const [votante, setVotante] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const handleBuscar = async (e) => {
    e.preventDefault();
    if (!documento.trim()) return;

    setCargando(true);
    setError(null);
    setMensaje(null);
    setVotante(null);

    try {
      const response = await buscarVotante(documento.trim());
      setVotante(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Votante no encontrado');
    } finally {
      setCargando(false);
    }
  };

  const handleConfirmarIngreso = async () => {
    if (!votante) return;
    setCargando(true);
    setError(null);
    setMensaje(null);

    try {
      const response = await registrarIngresoVotante(votante.documento);
      setMensaje(response.data.mensaje);
      setVotante(response.data.votante);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar el ingreso');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-sena-bg py-10 px-4">
      <div className="mx-auto max-w-xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-sena-navy">Control de Ingreso a Votación</h1>
          <p className="mt-2 text-slate-600">Verifica el documento antes de permitir el acceso al tarjetón</p>
        </header>

        {/* Formulario de Búsqueda */}
        <div className="rounded-2xl bg-white p-6 shadow-md border border-slate-100">
          <form onSubmit={handleBuscar} className="flex gap-3">
            <input
              type="text"
              placeholder="Número de Cédula o Documento"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-sena-green focus:outline-none focus:ring-2 focus:ring-sena-green/20"
            />
            <button
              type="submit"
              disabled={cargando}
              className="rounded-xl bg-sena-navy px-6 py-3 font-semibold text-white shadow-sm hover:bg-sena-green transition-colors disabled:opacity-50"
            >
              Buscar
            </button>
          </form>
        </div>

        {/* Mensajes de Alerta */}
        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-4 border border-red-200 text-red-700 font-medium">
            ⚠️ {error}
          </div>
        )}

        {mensaje && (
          <div className="mt-4 rounded-xl bg-green-50 p-4 border border-sena-green/30 text-sena-green font-medium">
            ✓ {mensaje}
          </div>
        )}

        {/* Card Resultado del Votante */}
        {votante && (
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-lg border-2 border-slate-100">
            <h3 className="text-lg font-bold text-sena-navy">Información del Votante</h3>
            <div className="mt-4 space-y-2 text-slate-700">
              <p><strong>Nombre:</strong> {votante.nombre_completo}</p>
              <p><strong>Documento:</strong> {votante.documento}</p>
              <p><strong>Programa/Área:</strong> {votante.programa_o_dependencia || 'N/A'}</p>
              <p>
                <strong>Estado de Ingreso:</strong>{' '}
                {votante.ingreso_registrado ? (
                  <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    Ingreso Ya Registrado
                  </span>
                ) : (
                  <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    Habilitado para Ingresar
                  </span>
                )}
              </p>
            </div>

            {!votante.ingreso_registrado ? (
              <button
                onClick={handleConfirmarIngreso}
                disabled={cargando}
                className="mt-6 w-full rounded-xl bg-sena-green py-3 font-semibold text-white shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Registrar Ingreso de Votante
              </button>
            ) : (
              <div className="mt-6 rounded-xl bg-slate-100 p-3 text-center text-sm text-slate-500 font-medium">
                Este usuario ya ingresó a la mesa de votación.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};