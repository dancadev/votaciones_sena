import { CircleUserRound } from 'lucide-react';
import { esCupoDisponible, getEtiquetaTarjeton, getFotoUrl, getNombreVisible } from '../../utils/candidatos';

/**
 * Tarjeta del tarjetón electoral (cabina de votación).
 *
 * Los cupos del tarjetón que aún no tienen candidato registrado se muestran
 * deshabilitados: no se puede votar por ellos.
 */
export const CardCandidato = ({ candidato, onSeleccionar, votacionHabilitada = true }) => {
  const esBlanco = candidato.es_voto_blanco;
  const cupoDisponible = esCupoDisponible(candidato);
  const propuesta = candidato.propuesta?.trim();
  const puedeVotar = votacionHabilitada && !cupoDisponible;

  return (
    <div
      onClick={() => puedeVotar && onSeleccionar(candidato)}
      className={`group relative flex w-full flex-col overflow-hidden rounded-2xl bg-white p-6 shadow-md transition-all duration-300 sm:w-64 lg:w-72 ${
        cupoDisponible
          ? 'border-2 border-dashed border-slate-300'
          : `border-2 border-transparent ${
              esBlanco ? 'hover:border-slate-500' : 'hover:border-sena-green'
            } ${puedeVotar ? 'cursor-pointer hover:-translate-y-1 hover:shadow-xl' : ''}`
      }`}
    >
      {/* Badge Número Tarjetón */}
      <div
        className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm ${
          esBlanco || cupoDisponible ? 'bg-slate-600' : 'bg-sena-navy group-hover:bg-sena-green'
        }`}
      >
        {getEtiquetaTarjeton(candidato)}
      </div>

      {/* Imagen o Icono */}
      <div className="mb-4 flex justify-center">
        {candidato.foto ? (
          <img
            src={getFotoUrl(candidato.foto)}
            alt={getNombreVisible(candidato)}
            className={`h-32 w-32 rounded-full object-cover ring-4 ring-sena-bg ${
              esBlanco ? 'group-hover:ring-slate-400' : 'group-hover:ring-sena-green'
            }`}
          />
        ) : (
          <div
            className={`flex h-32 w-32 flex-col items-center justify-center gap-1 rounded-full ring-4 ring-sena-bg ${
              esBlanco ? 'bg-slate-200 text-slate-500' : 'bg-white text-slate-400'
            }`}
          >
            {esBlanco ? (
              <span className="text-2xl font-black text-slate-500">VB</span>
            ) : (
              <>
                <CircleUserRound className="h-9 w-9" strokeWidth={1.4} />
                <span className="text-[10px] font-semibold uppercase tracking-wide">Disponible</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Datos del Candidato */}
      <div className="flex-1 text-center">
        <h3
          className={`text-lg font-bold leading-tight transition-colors ${
            cupoDisponible
              ? 'text-slate-400'
              : 'text-sena-navy group-hover:text-sena-green'
          }`}
        >
          {getNombreVisible(candidato)}
        </h3>
        {propuesta ? (
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">{propuesta}</p>
        ) : (
          <p className="mt-2 text-sm italic text-slate-400">
            {cupoDisponible ? 'Pendiente por asignar.' : 'Sin propuesta registrada.'}
          </p>
        )}
      </div>

      {/* Botón Seleccionar */}
      <button
        type="button"
        disabled={!puedeVotar}
        className={`mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white shadow-sm transition-colors ${
          puedeVotar
            ? 'bg-sena-navy group-hover:bg-sena-green'
            : 'cursor-not-allowed bg-slate-300'
        }`}
      >
        {cupoDisponible ? 'No disponible' : 'Votar'}
      </button>
    </div>
  );
};
