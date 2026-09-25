import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { PlanTrabajoPage } from '../components/votacion/PlanTrabajo';
import { getPlanTrabajo } from '../services/api';

/**
 * Página del plan de trabajo de un candidato.
 *
 * Carga el documento desde la API y lo entrega a `PlanTrabajoPage`, que es la
 * plantilla compartida por todos los planes: cualquier candidato con un plan
 * cargado en el mismo formato se presenta igual.
 */
export const PlanTrabajoCandidatoPage = () => {
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [candidato, setCandidato] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const { data } = await getPlanTrabajo(id);
      setPlan(data.plan);
      setCandidato(data.plan.candidato);
    } catch (err) {
      if (err.response?.status === 404) {
        setError(
          err.response.data?.error || 'Este candidato aún no ha publicado su plan de trabajo.',
        );
        setCandidato(err.response.data?.candidato ?? null);
      } else {
        setError('No se pudo cargar el plan de trabajo. Verifica que el servidor esté activo.');
      }
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    queueMicrotask(cargar);
  }, [cargar]);

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sena-bg">
        <p className="font-semibold text-sena-navy">Cargando el plan de trabajo…</p>
      </div>
    );
  }

  if (!plan || !candidato) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sena-bg p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <FileText className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-sena-navy">Plan de trabajo no disponible</h2>
          <p className="mt-2 text-slate-600">{error}</p>
          <p className="mt-2 text-sm text-slate-500">
            Mientras tanto puedes consultar el perfil y las propuestas del candidato.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to={`/propuestas/${id}`}
              className="rounded-xl bg-sena-navy px-5 py-2.5 font-semibold text-white transition-colors hover:bg-sena-green"
            >
              Ver el perfil
            </Link>
            <Link
              to="/propuestas"
              className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-600 transition-colors hover:bg-slate-100"
            >
              Todas las propuestas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <PlanTrabajoPage candidato={candidato} plan={plan} />;
};
