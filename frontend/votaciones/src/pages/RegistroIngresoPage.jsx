import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Search, ShieldCheck } from 'lucide-react';
import { buscarVotante, registrarIngresoVotante } from '../services/api';

/**
 * Módulo de ingreso (check-in).
 *
 * Sección exclusiva del administrador: aquí valida la cédula del votante en el
 * padrón y habilita su paso a la cabina de votación. El votante no tiene
 * usuario ni contraseña; esta validación es la que le da acceso.
 */
export const RegistroIngresoPage = () => {
  const [documento, setDocumento] = useState('');
  const [votante, setVotante] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const limpiarMensajes = () => {
    setError(null);
    setMensaje(null);
  };

  const handleBuscar = async (evento) => {
    evento.preventDefault();
    if (!documento.trim()) return;

    setCargando(true);
    limpiarMensajes();
    setVotante(null);

    try {
      const { data } = await buscarVotante(documento.trim());
      setVotante(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Votante no encontrado');
    } finally {
      setCargando(false);
    }
  };

  const handleConfirmarIngreso = async () => {
    if (!votante) return;
    setCargando(true);
    limpiarMensajes();

    try {
      const { data } = await registrarIngresoVotante(votante.documento);
      setMensaje(data.mensaje);
      setVotante(data.votante);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo validar el ingreso');
    } finally {
      setCargando(false);
    }
  };

  const nuevoRegistro = () => {
    setDocumento('');
    setVotante(null);
    limpiarMensajes();
  };

  return (
    <div className="min-h-screen bg-sena-bg py-10 px-4">
      <div className="mx-auto max-w-xl">
        <Link
          to="/monitor"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-sena-navy"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al monitor
        </Link>

        <header className="mb-8 mt-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-sena-navy px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
            <ShieldCheck className="h-3.5 w-3.5 text-sena-green" />
            Módulo del administrador
          </span>
          <h1 className="mt-3 text-3xl font-extrabold text-sena-navy">Validación de ingreso</h1>
          <p className="mt-2 text-slate-600">
            Verifica la cédula en el padrón y habilita al votante para pasar a la cabina.
          </p>
        </header>

        {/* Formulario de búsqueda */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md">
          <form onSubmit={handleBuscar} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Número de cédula o documento"
              value={documento}
              onChange={(evento) => setDocumento(evento.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-sena-green focus:outline-none focus:ring-2 focus:ring-sena-green/20"
            />
            <button
              type="submit"
              disabled={cargando}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-sena-navy px-6 py-3 font-semibold text-white transition-colors hover:bg-sena-green disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              Buscar
            </button>
          </form>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 font-medium text-red-700">
            ⚠️ {error}
          </div>
        )}

        {mensaje && (
          <div className="mt-4 rounded-xl border border-sena-green/30 bg-green-50 p-4 font-medium text-sena-green">
            ✓ {mensaje}
          </div>
        )}

        {/* Resultado de la consulta */}
        {votante && (
          <div className="mt-6 rounded-2xl border-2 border-slate-100 bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold text-sena-navy">Información del votante</h3>
            <div className="mt-4 space-y-2 text-slate-700">
              <p>
                <strong>Nombre:</strong> {votante.nombre_completo}
              </p>
              <p>
                <strong>Documento:</strong>{' '}
                {votante.tipo_documento ? `${votante.tipo_documento} ` : ''}
                {votante.documento}
              </p>
              <p>
                <strong>Programa de formación:</strong>{' '}
                {votante.programa_o_dependencia || 'N/A'}
              </p>
              <p>
                <strong>Ficha:</strong> {votante.ficha || 'N/A'}
                {votante.nivel_de_formacion ? ` · ${votante.nivel_de_formacion}` : ''}
              </p>
              <p className="flex flex-wrap items-center gap-2">
                <strong>Estado:</strong>{' '}
                {votante.ya_voto ? (
                  <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
                    Ya sufragó
                  </span>
                ) : votante.ingreso_registrado ? (
                  <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    Ingreso validado · puede votar
                  </span>
                ) : (
                  <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    Pendiente de validar
                  </span>
                )}
              </p>
            </div>

            {votante.ya_voto ? (
              <div className="mt-6 rounded-xl bg-slate-100 p-3 text-center text-sm font-medium text-slate-500">
                Esta cédula ya registró un voto: no puede volver a votar.
              </div>
            ) : votante.ingreso_registrado ? (
              <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Puede pasar a la cabina de votación.
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConfirmarIngreso}
                disabled={cargando}
                className="mt-6 w-full rounded-xl bg-sena-green py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {cargando ? 'Validando…' : 'Validar ingreso y habilitar voto'}
              </button>
            )}

            <button
              type="button"
              onClick={nuevoRegistro}
              className="mt-3 w-full rounded-xl py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100"
            >
              Buscar otra cédula
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
