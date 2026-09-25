import { Link } from 'react-router-dom';
import { ArrowLeft, CircleUserRound, FileText } from 'lucide-react';
import { getFotoUrl } from '../../utils/candidatos';

/**
 * Renderiza un bloque de contenido del plan de trabajo.
 *
 * Los planes se guardan como secciones estructuradas (ver `PlanTrabajo` en el
 * backend), así que cada tipo de bloque tiene su propia presentación:
 * párrafos, listas, bloques destacados, secuencias y tablas.
 */
const Bloque = ({ bloque }) => {
  switch (bloque.tipo) {
    case 'parrafo':
      if (!bloque.texto?.trim()) return null;
      return (
        <p className="text-base leading-relaxed text-slate-700">{bloque.texto}</p>
      );

    case 'lista': {
      const items = (bloque.items ?? []).filter((item) => String(item).trim());
      if (!items.length) return null;
      const esNumerada = bloque.estilo === 'numeros';
      const Lista = esNumerada ? 'ol' : 'ul';
      return (
        <Lista
          className={`space-y-2 pl-5 text-base leading-relaxed text-slate-700 ${
            esNumerada ? 'list-decimal' : 'list-disc'
          }`}
        >
          {items.map((item, indice) => (
            <li key={indice} className="pl-1 marker:text-sena-green">
              {item}
            </li>
          ))}
        </Lista>
      );
    }

    case 'destacado':
      if (!bloque.texto?.trim()) return null;
      return (
        <div className="rounded-xl border-l-4 border-sena-green bg-sena-green/5 p-5">
          {bloque.etiqueta && (
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-sena-green">
              {bloque.etiqueta}
            </p>
          )}
          <p className="text-base font-medium leading-relaxed text-sena-navy">{bloque.texto}</p>
        </div>
      );

    case 'secuencia': {
      const items = bloque.items ?? [];
      if (!items.length) return null;
      return (
        <div className="flex flex-wrap items-center gap-2">
          {items.map((item, indice) => (
            <span key={indice} className="flex items-center gap-2">
              <span className="rounded-full bg-sena-navy px-4 py-2 text-sm font-semibold text-white">
                {item}
              </span>
              {indice < items.length - 1 && (
                <span className="font-bold text-sena-green">→</span>
              )}
            </span>
          ))}
        </div>
      );
    }

    case 'tabla': {
      const columnas = bloque.columnas ?? [];
      const filas = bloque.filas ?? [];
      if (!columnas.length || !filas.length) return null;
      return (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead className="bg-sena-navy text-white">
              <tr>
                {columnas.map((columna, indice) => (
                  <th key={indice} className="px-4 py-3 font-semibold">
                    {columna}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, indiceFila) => (
                <tr
                  key={indiceFila}
                  className={indiceFila % 2 ? 'bg-slate-50' : 'bg-white'}
                >
                  {columnas.map((_, indiceColumna) => (
                    <td
                      key={indiceColumna}
                      className="border-t border-slate-200 px-4 py-3 align-top text-slate-700"
                    >
                      {fila[indiceColumna] || (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    default:
      return null;
  }
};

const Seccion = ({ seccion }) => {
  const esSubseccion = (seccion.nivel ?? 1) > 1;
  const bloques = (seccion.bloques ?? []).filter(Boolean);

  return (
    <section id={`seccion-${seccion.numero}`} className="scroll-mt-24">
      <div className={esSubseccion ? 'border-l-4 border-sena-green/30 pl-5' : ''}>
        <p
          className={`font-bold uppercase tracking-wider text-sena-green ${
            esSubseccion ? 'text-xs' : 'text-sm'
          }`}
        >
          {seccion.numero}
        </p>
        <h2
          className={`mt-1 font-extrabold text-sena-navy ${
            esSubseccion ? 'text-xl' : 'text-2xl sm:text-3xl'
          }`}
        >
          {seccion.titulo}
        </h2>
        {seccion.proyecto && (
          <p className="mt-1 inline-block rounded-full bg-sena-blue/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sena-blue">
            Proyecto: {seccion.proyecto}
          </p>
        )}
      </div>

      {bloques.length > 0 && (
        <div className="mt-5 space-y-4">
          {bloques.map((bloque, indice) => (
            <Bloque key={indice} bloque={bloque} />
          ))}
        </div>
      )}
    </section>
  );
};

/**
 * Página del plan de trabajo de un candidato.
 *
 * Es la **plantilla** de los planes de todos los candidatos: renderiza la
 * estructura de secciones definida en el backend, así que cualquier plan
 * cargado con el mismo formato se ve igual sin tocar el frontend.
 */
export const PlanTrabajoPage = ({ candidato, plan }) => {
  const secciones = plan.secciones ?? [];
  const principales = secciones.filter((seccion) => (seccion.nivel ?? 1) === 1);

  return (
    <div className="min-h-screen bg-sena-bg py-8 px-4 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          to={`/propuestas/${candidato.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-sena-navy"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al perfil del candidato
        </Link>

        {/* Encabezado del documento */}
        <header className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-r from-sena-navy to-sena-blue p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            {candidato.foto ? (
              <img
                src={getFotoUrl(candidato.foto)}
                alt={candidato.nombre}
                className="h-28 w-28 rounded-2xl object-cover ring-4 ring-white/30"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-white/10 ring-4 ring-white/20">
                <CircleUserRound className="h-12 w-12" strokeWidth={1.2} />
              </div>
            )}

            <div className="text-center sm:text-left">
              <span className="inline-flex items-center gap-2 rounded-full bg-sena-green px-4 py-1 text-xs font-bold uppercase tracking-wider">
                <FileText className="h-3.5 w-3.5" />
                Tarjetón #{candidato.numero_tarjeton}
                {plan.vigencia ? ` · Vigencia ${plan.vigencia}` : ''}
              </span>
              <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                {plan.eslogan || plan.titulo}
              </h1>
              <p className="mt-1 text-lg font-semibold text-slate-100">{plan.titulo}</p>
              <p className="mt-1 text-sm text-slate-200">{candidato.nombre}</p>
              {plan.lema && <p className="mt-2 text-sm text-sena-green">{plan.lema}</p>}
            </div>
          </div>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_1fr]">
          {/* Índice del documento */}
          <nav className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-md">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Contenido del plan
              </h2>
              <ol className="mt-3 space-y-1.5 text-sm">
                {principales.map((seccion) => (
                  <li key={seccion.numero}>
                    <a
                      href={`#seccion-${seccion.numero}`}
                      className="flex gap-2 text-slate-600 transition-colors hover:text-sena-green"
                    >
                      <span className="font-bold text-sena-navy">{seccion.numero}.</span>
                      <span>{seccion.titulo}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          {/* Documento */}
          <article className="space-y-10 rounded-3xl bg-white p-6 shadow-xl sm:p-10">
            {secciones.map((seccion) => (
              <Seccion key={`${seccion.numero}-${seccion.titulo}`} seccion={seccion} />
            ))}

            <footer className="border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
              Documento de la candidatura · {candidato.nombre}
              {plan.vigencia ? ` · Vigencia ${plan.vigencia}` : ''}
            </footer>
          </article>
        </div>
      </div>
    </div>
  );
};
