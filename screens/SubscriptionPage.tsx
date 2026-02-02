
import React from 'react';
import { useNavigate } from 'react-router-dom';

const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-background-dark p-6">
      <div className="pt-8 text-center space-y-3">
        <h2 className="text-leaf-green font-bold text-xs uppercase tracking-[0.2em]">Plan de Transformación</h2>
        <h1 className="text-2xl font-black text-deep-blue dark:text-white leading-tight px-2">
          ❤️ Un plan para vivir tranquilo. <br/>Hazlo por quienes amas!
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed px-4 font-medium">
          Accede al plan completo de acompañamiento médico, nutrición y vida sana que está ayudando a miles de personas con una guía real y resultados medibles.
        </p>
      </div>

      <div className="mt-8 space-y-6 flex-grow">
        <div className="relative p-6 rounded-3xl border-2 border-primary bg-primary/5 shadow-xl shadow-primary/10 overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-deep-blue text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase">Plan Mensual</div>
          <h3 className="text-xl font-bold text-deep-blue dark:text-white">Premium Integral</h3>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-4xl font-black text-deep-blue dark:text-white">$5</span>
            <span className="text-sm text-gray-500 font-medium">USD / mes</span>
          </div>
          <p className="mt-2 text-xs text-primary-dark font-bold">7 días GRATIS incluidos</p>
          
          <ul className="mt-6 space-y-4">
            <li className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Registro y análisis diario de la presión arterial</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Plan diario de alimentación saludable</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Plan diario estilo de vida sana</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Plan diario de nutrición celular</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Acceso Ilimitado a la comunidad Infinity-Circles</span>
            </li>
          </ul>
        </div>

        <div className="text-center px-4">
          <p className="text-xs text-gray-400 leading-relaxed italic">
            "Mi presión se estabilizó en solo 2 semanas siguiendo el plan de nutrición celular. Volví a jugar con mis nietos sin cansarme."
          </p>
        </div>
      </div>

      <div className="mt-auto space-y-4 pb-4">
        <button 
          onClick={() => navigate('/medical-history')}
          className="w-full h-16 bg-primary text-deep-blue font-bold text-lg rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:brightness-105 active:scale-95 transition-all"
        >
          Iniciar Prueba Gratuita
        </button>
        <button 
          onClick={() => navigate('/')}
          className="w-full py-2 text-sm text-gray-400 font-medium"
        >
          Tal vez más tarde
        </button>
      </div>
    </div>
  );
};

export default SubscriptionPage;
