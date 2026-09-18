import { useState } from 'react';
import { CircleUserRound } from 'lucide-react';
import { esCupoDisponible, getEtiquetaTarjeton, getFotoUrl, getNombreVisible } from '../../utils/candidatos';

/**
 * Tarjeta del módulo de propuestas.
 *
 * Muestra la foto del candidato con el botón "Votar" sobre la propia imagen y
 * la propuesta completa (recortada a 5 líneas, ampliable). Los cupos del
 * tarjetón que todavía no tienen candidato registrado aparecen deshabilitados.
 */
export const CardPropuesta = ({ candidato, onVotar, votacionHabilitada = true }) => {
  const [propuestaExpandida, setPropuestaExpandida] = useState(false);

  const esBlanco = candidato.es_voto_blanco;
  const cupoDisponible = esCupoDisponible(candidato);
  const propuesta = candidato.propuesta?.trim();
  const esLarga = (propuesta?.length ?? 0) > 240;
  const puedeVotar = votacionHabilitada && !cupoDisponible;
  const votos = candidato.votos;

  return (
    <article
      className={`flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 sm:w-72 lg:w-80 ${
        cupoDisponible
          ? 'border-2 border-dashed border-slate-300'
          : 'border border-slate-100 hover:-translate-y-1 hover:shadow-xl'
      }`}
    >
      {/* Imagen del candidato con el botón de votar encima */}
      <div className="relative h-64 w-full overflow-hidden bg-sena-bg">
        {candidato.foto ? (
          <img
            src={getFotoUrl(candidato.foto)}
            alt={getNombreVisible(candidato)}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div
            className={`flex h-full w-full flex-col items-center justify-center gap-2 ${
              esBlanco ? 'bg-slate-200 text-slate-500' : 'bg-white text-slate-400'
            }`}
          >
            {esBlanco ? (
              <>
                <span className="text-5xl font-black text-slate-500">VB</span>
                <span className="text-xs font-semibold uppercase tracking-wider">Voto en Blanco</span>
              </>
            ) : (
              <>
                <CircleUserRound className="h-16 w-16" strokeWidth={1.2} />
                <span className="text-xs font-semibold uppercase tracking-wider">Cupo disponible</span>
              </>
            )}
          </div>
        )}

        {/* Degradado para que el botón y las etiquetas siempre sean legibles */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-sena-navy/85 to-transparent" />

        {/* Número del tarjetón */}
        <span
          className={`absolute left-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white shadow-md ring-2 ring-white/70 ${
            esBlanco ? 'bg-slate-600' : 'bg-sena-navy'
          }`}
        >
          {getEtiquetaTarjeton(candidato)}
        </span>

        {/* Votos (solo cuando la jornada ya cerró) */}
        {typeof votos === 'number' && (
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-sena-navy shadow-md">
            {votos} {votos === 1 ? 'voto' : 'votos'}
          </span>
        )}

        {/* Botón Votar sobre la imagen */}
        <button
          type="button"
          onClick={() => onVotar(candidato)}
          disabled={!puedeVotar}
          aria-label={`Votar por ${getNombreVisible(candidato)}`}
          className={`absolute bottom-3 left-1/2 -translate-x-1/2 rounded-xl px-7 py-2.5 text-sm font-bold shadow-lg transition-all duration-200 ${
            puedeVotar
              ? 'bg-sena-green text-white hover:scale-105 hover:bg-white hover:text-sena-green focus:outline-none focus-visible:ring-4 focus-visible:ring-sena-green/40'
              : 'cursor-not-allowed bg-slate-500/80 text-slate-200'
          }`}
        >
          {cupoDisponible ? 'No disponible' : 'Votar'}
        </button>
      </div>

      {/* Datos y propuesta */}
      <div className="flex flex-1 flex-col p-5">
        <h3
          className={`text-lg font-bold leading-tight ${
            cupoDisponible ? 'text-slate-400' : 'text-sena-navy'
          }`}
        >
          {getNombreVisible(candidato)}
        </h3>

        <div className="mt-4 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-sena-blue">
            Propuesta
          </p>

          {propuesta ? (
            <>
              <p
                className={`mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600 ${
                  !propuestaExpandida && esLarga ? 'line-clamp-5' : ''
                }`}
              >
                {propuesta}
              </p>
              {esLarga && (
                <button
                  type="button"
                  onClick={() => setPropuestaExpandida((valor) => !valor)}
                  className="mt-2 text-xs font-semibold text-sena-green hover:underline"
                >
                  {propuestaExpandida ? 'Ver menos' : 'Ver propuesta completa'}
                </button>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm italic text-slate-400">
              {cupoDisponible
                ? 'Cupo del tarjetón pendiente por asignar.'
                : 'Este candidato aún no ha registrado su propuesta.'}
            </p>
          )}
        </div>

        {!cupoDisponible && (
          <button
            type="button"
            onClick={() => onVotar(candidato)}
            disabled={!puedeVotar}
            className="mt-5 w-full rounded-xl bg-sena-navy py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sena-green disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {votacionHabilitada ? 'Votar por este candidato' : 'Votación cerrada'}
          </button>
        )}
      </div>
    </article>
  );
};
