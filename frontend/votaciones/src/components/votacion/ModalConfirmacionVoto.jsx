import { useState } from 'react';
import { registrarVoto } from '../../services/api';
import { getEtiquetaTarjeton, getNombreVisible } from '../../utils/candidatos';

/**
 * Confirmación de voto reutilizable.
 *
 * Recibe un candidato (o `null` para no mostrarse) y se encarga de enviar el
 * sufragio a la API, mostrando el error del servidor si algo falla.
 */
export const ModalConfirmacionVoto = ({ candidato, onCerrar, onRegistrado }) => {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  if (!candidato) return null;

  const esBlanco = candidato.es_voto_blanco;

  const confirmar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await registrarVoto(candidato.id);
      onRegistrado?.(candidato);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'No se pudo registrar el voto. Verifica la conexión con el servidor.'
      );
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-sena-navy/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className={`h-1.5 ${esBlanco ? 'bg-slate-500' : 'bg-sena-green'}`} />

        <div className="p-6">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                esBlanco ? 'bg-slate-600' : 'bg-sena-navy'
              }`}
            >
              {getEtiquetaTarjeton(candidato)}
            </span>
            <div>
              <h3 className="text-xl font-bold text-sena-navy">Confirmar Voto</h3>
              <p className="text-sm text-slate-500">Esta acción no se puede deshacer</p>
            </div>
          </div>

          <p className="mt-5 text-slate-600">
            ¿Estás seguro de votar por{' '}
            <strong className="text-sena-navy">{getNombreVisible(candidato)}</strong>?
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              ⚠️ {error}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCerrar}
              disabled={enviando}
              className="rounded-xl px-4 py-2 font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmar}
              disabled={enviando}
              className="rounded-xl bg-sena-green px-5 py-2 font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {enviando ? 'Registrando…' : 'Confirmar Voto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
