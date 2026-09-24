import { Link } from 'react-router-dom';
import { CircleUserRound } from 'lucide-react';
import { getFotoUrl, getNombreVisible } from '../../utils/candidatos';

/**
 * Tarjeta del módulo de propuestas.
 *
 * No permite votar: toda la tarjeta es el acceso al micrositio del candidato,
 * donde se ven el perfil y las propuestas completas.
 */
export const CardCandidatoFicha = ({ candidato }) => {
  const propuesta = candidato.propuesta?.trim();

  return (
    <Link
      to={`/propuestas/${candidato.id}`}
      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-sena-green hover:shadow-xl sm:w-72 lg:w-80"
      aria-label={`Ver el perfil y las propuestas de ${getNombreVisible(candidato)}`}
    >
      <div className="relative h-56 w-full overflow-hidden bg-sena-bg">
        {candidato.foto ? (
          <img
            src={getFotoUrl(candidato.foto)}
            alt={getNombreVisible(candidato)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
            <CircleUserRound className="h-14 w-14" strokeWidth={1.2} />
            <span className="text-xs font-semibold uppercase tracking-wider">Sin foto</span>
          </div>
        )}

        <span className="absolute left-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-sena-navy text-sm font-bold text-white shadow-md ring-2 ring-white/70">
          #{candidato.numero_tarjeton}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-tight text-sena-navy transition-colors group-hover:text-sena-green">
          {candidato.nombre}
        </h3>

        <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
          {propuesta ? (
            <span className="line-clamp-4">{propuesta}</span>
          ) : (
            <span className="italic text-slate-400">Este candidato aún no ha registrado su propuesta.</span>
          )}
        </p>

        <span className="mt-5 inline-flex items-center justify-center rounded-xl bg-sena-navy py-2.5 text-sm font-semibold text-white transition-colors group-hover:bg-sena-green">
          Ver perfil y propuestas
        </span>
      </div>
    </Link>
  );
};
