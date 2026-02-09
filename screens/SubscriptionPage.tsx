
import React from 'react';
import { useNavigate } from 'react-router-dom';

const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-background-dark p-8 animate-fadeIn">
      <div className="pt-10 text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
           <span className="material-symbols-outlined text-primary text-sm font-black">verified_user</span>
           <p className="text-[9px] font-black text-primary-dark uppercase tracking-widest">Protocolo de Remisión HTA</p>
        </div>
        <h1 className="text-3xl font-black text-deep-blue dark:text-white leading-tight tracking-tight">
          Tu salud no tiene precio, <br/>pero sí un <span className="text-primary">plan</span>.
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium px-6">
          Acompañamiento digital basado en ciencia para el control real de la hipertensión.
        </p>
      </div>

      <div className="mt-12 flex-grow">
        <div className="relative p-1 bg-gradient-to-br from-primary to-leaf-green rounded-[3.5rem] shadow-2xl shadow-primary/20">
          <div className="bg-white dark:bg-slate-900 rounded-[3.4rem] p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-deep-blue text-[9px] font-black px-6 py-2 rounded-bl-3xl uppercase tracking-widest shadow-md">RECOMENDADO</div>
            
            <h3 className="text-xl font-black text-deep-blue dark:text-white uppercase tracking-tight">Membresía Vital</h3>
            
            <div className="mt-8 flex items-baseline gap-2">
              <span className="text-6xl font-black text-deep-blue dark:text-white tracking-tighter">$5</span>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-black uppercase tracking-widest">USD</span>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">/ Mes</span>
              </div>
            </div>
            
            <p className="mt-4 text-[10px] text-primary-dark font-black uppercase tracking-[0.2em] bg-primary/10 inline-block px-4 py-1.5 rounded-full">
              Incluye 7 días gratis
            </p>
            
            <ul className="mt-12 space-y-5">
              {[
                "Análisis IA de presión arterial",
                "Plan Nutricional DASH Celular",
                "Rutinas de Movimiento Vital",
                "Monitoreo de 8 Remedios",
                "Triage Médico Digital"
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-4 group">
                  <div className="size-6 bg-primary/20 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-sm font-black">done</span>
                  </div>
                  <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 text-center px-8 italic">
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
            "Siento que finalmente tengo el control de mi vida. Los planes DASH son fáciles y deliciosos."
          </p>
        </div>
      </div>

      <div className="mt-12 space-y-4 pb-4">
        <button 
          onClick={() => navigate('/medical-history')}
          className="w-full h-20 bg-primary text-deep-blue font-black text-xl rounded-[2.5rem] shadow-2xl shadow-primary/20 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          Activar Prueba Gratis
          <span className="material-symbols-outlined font-black">bolt</span>
        </button>
        <button 
          onClick={() => navigate('/')}
          className="w-full py-2 text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
};

export default SubscriptionPage;
