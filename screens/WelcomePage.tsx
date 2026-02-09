
import React from 'react';
import { useNavigate } from 'react-router-dom';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-full bg-background-light dark:bg-background-dark animate-fadeIn">
      {/* Espacio para barra de estado */}
      <div className="h-10"></div>
      
      <div className="flex flex-col items-center justify-center flex-1 px-8">
        <div className="relative mb-12">
          <div className="size-56 bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl shadow-primary/10 flex items-center justify-center border border-white dark:border-slate-800 relative overflow-hidden">
            {/* Círculos decorativos de fondo */}
            <div className="absolute -top-10 -right-10 size-32 bg-primary/5 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 size-32 bg-leaf-green/5 rounded-full blur-2xl"></div>
            
            <div className="relative animate-pulse-slow">
              <span className="material-symbols-outlined text-[120px] text-primary opacity-20 select-none">shield_with_heart</span>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-[80px] text-primary select-none" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              </div>
            </div>
          </div>
          
          <div className="absolute -bottom-4 -right-4 size-20 bg-white dark:bg-slate-900 rounded-3xl shadow-xl flex items-center justify-center border-4 border-background-light dark:border-background-dark animate-float">
            <span className="material-symbols-outlined text-primary text-4xl font-black select-none">eco</span>
          </div>
        </div>

        <div className="text-center space-y-4 max-w-sm">
          <h2 className="text-deep-blue dark:text-white font-black text-4xl tracking-tighter leading-none">
            HTA <span className="text-primary">Infinity</span> Flow
          </h2>
          <p className="text-leaf-green font-black text-[10px] uppercase tracking-[0.4em] mb-6">Nutrición Celular Avanzada</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed px-6">
            Descubre el poder de la medicina ortomolecular para normalizar tu presión arterial y recuperar tu vitalidad.
          </p>
        </div>
      </div>

      <div className="p-10 space-y-5">
        <button 
          onClick={() => navigate('/subscription')}
          className="w-full bg-primary text-deep-blue font-black py-6 rounded-[2.5rem] shadow-2xl shadow-primary/20 text-lg flex items-center justify-center gap-3 hover:brightness-105 active:scale-95 transition-all transform"
        >
          Iniciar Mi Proceso
          <span className="material-symbols-outlined font-black">arrow_forward</span>
        </button>
        
        <button 
          onClick={() => navigate('/log')}
          className="w-full py-2 text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] hover:text-primary transition-colors"
        >
          Ya soy parte <span className="text-primary underline underline-offset-4 decoration-2">Entrar</span>
        </button>
      </div>
      
      <div className="h-6"></div>
    </div>
  );
};

export default WelcomePage;
