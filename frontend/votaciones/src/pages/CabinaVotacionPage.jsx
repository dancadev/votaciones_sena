import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Lock, Search, ShieldCheck } from 'lucide-react';
import { CardCandidato } from '../components/votacion/CardCandidato';
import { ModalConfirmacionVoto } from '../components/votacion/ModalConfirmacionVoto';
import { useAuth } from '../hooks/useAuth';
import { useEstadoJornada } from '../hooks/useEstadoJornada';
import { getTarjeton, validarCedula } from '../services/api';

/**
 * Cabina de votación.
 *
 * El votante no tiene usuario ni contraseña: el administrador validó su cédula
 * en el módulo de ingreso y aquí solo la confirma para recibir su token de
 * voto. El sufragio se emite directamente en la tarjeta del candidato y es
 * secreto: el sistema marca a la persona como "ya votó" pero no guarda por
 * quién votó.
 */
export const CabinaVotacionPage = () => {
  const { votante, registrarSesionVotante, cerrarSesionVotante, restaurarVotante, setVotante } =
    useAuth();
  const { jornadaActiva, estado, cargando: cargandoEstado } = useEstadoJornada();

  const [documento, setDocumento] = useState('');
  const [candidatos, setCandidatos] = useState([]);
  const [votoBlanco, setVotoBlanco] = useState(null);
  const [error, setError] = useState(null);
  const [validando, setValidando] = useState(false);
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState(null);
  const [votoEnviado, setVotoEnviado] = useState(false);

  const cargarTarjeton = useCallback(async () => {
    try {
      const { data } = await getTarjeton();
      setCandidatos(data.candidatos ?? []);
      setVotoBlanco(data.voto_en_blanco ?? null);
    } catch {
      setError('No se pudo cargar el tarjetón. Verifica que el servidor esté activo.');
    }
  }, []);

  // Si la página se recarga a mitad del proceso, se recupera la sesión del votante.
  useEffect(() => {
    const preparar = async () => {
      await cargarTarjeton();
      await restaurarVotante();
    };
    queueMicrotask(preparar);
  }, [cargarTarjeton, restaurarVotante]);

  const validar = async (evento) => {
    evento.preventDefault();
    const cedula = documento.trim();
    if (!cedula) return;

    setValidando(true);
    setError(null);
    try {
      const { data } = await validarCedula(cedula);
      registrarSesionVotante(data.token_votante, data.votante);
      setDocumento('');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo validar la cédula.');
    } finally {
      setValidando(false);
    }
  };

  const salirDeCabina = async () => {
    await cerrarSesionVotante();
    setVotoEnviado(false);
    setError(null);
  };

  if (cargandoEstado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sena-bg">
        <p className="font-semibold text-sena-navy">Verificando la jornada…</p>
      </div>
    );
  }

  // La jornada cerrada no impide consultar propuestas, pero sí votar.
  if (!jornadaActiva) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sena-bg p-4 text-center">
        <div className="max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-sena-navy">Votación cerrada</h2>
          <p className="mt-2 text-slate-600">
            La jornada electoral finalizó. Puedes seguir consultando las propuestas de los
            candidatos.
          </p>
        </div>
      </div>
    );
  }

  if (votoEnviado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sena-bg p-4 text-center">
        <div className="max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sena-green/10 text-sena-green">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-sena-navy">¡Voto Registrado Exitosamente!</h2>
          <p className="mt-2 text-slate-600">
            Gracias por participar. Tu voto es secreto y ya quedó en el escrutinio.
          </p>
          <button
            type="button"
            onClick={salirDeCabina}
            className="mt-6 rounded-xl bg-sena-green px-6 py-2.5 font-semibold text-white transition-opacity hover:opacity-90"
          >
            Siguiente votante
          </button>
        </div>
      </div>
    );
  }

  // Paso 1: la cédula que el administrador dejó autorizada.
  if (!votante) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sena-bg px-4 py-10">
        <div className="w-full max-w-lg">
          <header className="mb-6 text-center">
            <span className="inline-block rounded-full bg-sena-green/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-sena-green">
              Cabina de votación
            </span>
            <h1 className="mt-3 text-3xl font-extrabold text-sena-navy">
              Confirma tu cédula para votar
            </h1>
            <p className="mt-2 text-slate-600">
              Tu ingreso debe estar validado por el administrador
              {estado?.hora_cierre_votacion
                ? `. Votación habilitada hasta las ${String(estado.hora_cierre_votacion).slice(0, 5)}.`
                : '.'}
            </p>
          </header>

          <div className="rounded-2xl bg-white p-6 shadow-md">
            <form onSubmit={validar} className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                inputMode="numeric"
                value={documento}
                onChange={(evento) => setDocumento(evento.target.value)}
                placeholder="Número de cédula"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-sena-green focus:outline-none focus:ring-2 focus:ring-sena-green/20"
              />
              <button
                type="submit"
                disabled={validando}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-sena-navy px-6 py-3 font-semibold text-white transition-colors hover:bg-sena-green disabled:opacity-60"
              >
                <Search className="h-4 w-4" />
                {validando ? 'Validando…' : 'Validar'}
              </button>
            </form>

            {error && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
                ⚠️ {error}
              </div>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            ¿Aún no te han validado? Acércate al módulo de registro con tu documento.
          </p>
        </div>
      </div>
    );
  }

  // Paso 2: el tarjetón. El voto se emite en la tarjeta del candidato.
  return (
    <div className="min-h-screen bg-sena-bg py-8 px-4 sm:px-8">
      <header className="mb-8 text-center">
        <span className="mx-auto inline-flex items-center gap-2 rounded-full bg-sena-green/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-sena-green">
          <ShieldCheck className="h-3.5 w-3.5" />
          Cédula validada
        </span>
        <h1 className="mt-3 text-3xl font-extrabold text-sena-navy sm:text-4xl">
          Tarjetón Electoral SENA
        </h1>
        <p className="mt-2 text-slate-600">
          {votante.nombre_completo}, selecciona el candidato de tu preferencia y confirma tu voto.
        </p>
        {(votante.ficha || votante.programa_o_dependencia) && (
          <p className="mt-1 text-sm text-slate-500">
            {votante.tipo_documento ? `${votante.tipo_documento} ` : ''}
            {votante.documento}
            {votante.ficha ? ` · Ficha ${votante.ficha}` : ''}
            {votante.programa_o_dependencia ? ` · ${votante.programa_o_dependencia}` : ''}
          </p>
        )}
      </header>

      {error && (
        <div className="mx-auto mb-6 max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-sm font-medium text-amber-800">
          ⚠️ {error}
        </div>
      )}

      <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-6">
        {candidatos.map((candidato) => (
          <CardCandidato
            key={candidato.id}
            candidato={candidato}
            onSeleccionar={setCandidatoSeleccionado}
          />
        ))}
      </div>

      {/* El voto en blanco es una opción del tarjetón y va en su propia casilla,
          porque no tiene propuesta que consultar. */}
      {votoBlanco && (
        <section className="mx-auto mt-10 max-w-6xl">
          <div className="mb-5 flex items-center gap-4">
            <span className="h-px flex-1 bg-slate-200" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Otra opción en el tarjetón
            </h2>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="flex justify-center">
            <CardCandidato candidato={votoBlanco} onSeleccionar={setCandidatoSeleccionado} />
          </div>
        </section>
      )}

      <div className="mt-10 text-center">
        <button
          type="button"
          onClick={salirDeCabina}
          className="text-sm font-semibold text-slate-500 underline-offset-4 transition-colors hover:text-sena-navy hover:underline"
        >
          No soy yo / cancelar esta sesión
        </button>
      </div>

      <ModalConfirmacionVoto
        candidato={candidatoSeleccionado}
        onCerrar={() => setCandidatoSeleccionado(null)}
        onRegistrado={() => {
          setCandidatoSeleccionado(null);
          setVotoEnviado(true);
          // El token del votante ya fue consumido en el servidor.
          setVotante(null);
        }}
      />
    </div>
  );
};
