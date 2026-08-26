import React from 'react';
const getFotoUrl = (fotoPath) => {
  if (!fotoPath) return null;
  if (fotoPath.startsWith('http')) return fotoPath;
  return `http://127.0.0.1:8000${fotoPath}`;
};

export const CardCandidato = ({ candidato, onSeleccionar }) => {
  const isBlanco = candidato.es_voto_blanco;

  return (
    <div 
      onClick={() => onSeleccionar(candidato)}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-2 ${
        isBlanco ? 'border-slate-300 hover:border-slate-500' : 'border-transparent hover:border-sena-green'
      }`}
    >
      {/* Badge Número Tarjetón */}
      <div className={`absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full font-bold text-white shadow-sm ${
        isBlanco ? 'bg-slate-600' : 'bg-sena-navy group-hover:bg-sena-green'
      }`}>
        {isBlanco ? 'VB' : `#${candidato.numero_tarjeton}`}
      </div>

      {/* Imagen o Icono */}
      <div className="mb-4 flex justify-center">
        {candidato.foto ? (
          <img 
            src={getFotoUrl(candidato.foto)} 
            alt={candidato.nombre} 
            className="h-36 w-36 rounded-full object-cover ring-4 ring-sena-bg group-hover:ring-sena-green"
          />
        ) : (
          <div className="flex h-36 w-36 items-center justify-center rounded-full bg-sena-bg text-slate-400 font-medium">
            Sin Foto
          </div>
        )}
      </div>

      {/* Datos del Candidato */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-sena-navy group-hover:text-sena-green transition-colors">
          {candidato.nombre}
        </h3>
        {candidato.propuesta && (
          <p className="mt-2 text-sm text-slate-600 line-clamp-2">
            {candidato.propuesta}
          </p>
        )}
      </div>

      {/* Botón Seleccionar */}
      <button className="mt-6 w-full rounded-xl bg-sena-navy py-3 text-sm font-semibold text-white shadow-sm transition-colors group-hover:bg-sena-green">
        Votar
      </button>
    </div>
  );
};