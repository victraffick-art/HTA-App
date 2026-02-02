
import React from 'react';
import { useNavigate } from 'react-router-dom';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-full">
      <div className="relative z-20 flex justify-between items-center px-8 pt-4 w-full text-gray-400 dark:text-gray-500">
        <span className="font-semibold text-sm">9:41</span>
        <div className="flex gap-1.5">
          <span className="material-symbols-outlined text-sm">signal_cellular_4_bar</span>
          <span className="material-symbols-outlined text-sm">wifi</span>
          <span className="material-symbols-outlined text-sm">battery_full</span>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center flex-1 min-h-[45vh]">
        <div className="relative flex items-center justify-center w-40 h-40 bg-white dark:bg-white/5 rounded-[2.5rem] shadow-xl shadow-green-100/50 dark:shadow-none">
          <div className="relative">
            <span className="material-symbols-outlined text-[100px] text-primary" style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}>shield</span>
            <div className="absolute inset-0 flex items-center justify-center pt-2">
              <span className="material-symbols-outlined text-[54px] text-leaf-green" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            </div>
            <div className="absolute -top-1 -right-1 bg-white dark:bg-background-dark rounded-full p-1">
              <span className="material-symbols-outlined text-[32px] text-leaf-green" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            </div>
          </div>
        </div>
        <div className="mt-6 text-center">
          <h2 className="text-deep-blue dark:text-white font-bold text-xl tracking-tight">HTA Remission</h2>
          <p className="text-leaf-green font-medium text-xs uppercase tracking-[0.2em]">Nutrición Celular Tech</p>
        </div>
      </div>
      <div className="relative flex flex-col px-6 pb-10 bg-white dark:bg-background-dark flex-grow">
        <div className="pt-4">
          <h1 className="text-deep-blue dark:text-white tracking-tight text-[32px] font-bold leading-tight text-center">
            Bienvenido a tu <br /><span className="text-leaf-green">nueva vida</span>
          </h1>
        </div>
        <div className="mt-6">
          <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-relaxed text-center px-4">
            Descubre el poder de la nutrición celular y recupera tu vitalidad. Transforma tus hábitos para controlar la hipertensión.
          </p>
        </div>
        <div className="flex w-full flex-row items-center justify-center gap-2.5 py-10">
          <div className="h-1.5 w-6 rounded-full bg-primary"></div>
          <div className="h-1.5 w-1.5 rounded-full bg-gray-200 dark:bg-gray-800"></div>
          <div className="h-1.5 w-1.5 rounded-full bg-gray-200 dark:bg-gray-800"></div>
        </div>
        <div className="mt-auto pt-4">
          <button onClick={() => navigate('/subscription')} className="w-full flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl h-16 px-5 bg-primary text-deep-blue text-lg font-bold leading-normal tracking-wide shadow-xl shadow-green-200 dark:shadow-none hover:brightness-105 active:scale-[0.98] transition-all">
            <span className="truncate">Comenzar mi transformación</span>
          </button>
        </div>
        <div className="mt-5 text-center">
          <button onClick={() => navigate('/log')} className="text-gray-400 dark:text-gray-500 text-sm font-medium hover:text-deep-blue dark:hover:text-white transition-colors">
            ¿Ya tienes una cuenta? <span className="text-leaf-green font-semibold underline underline-offset-4">Inicia sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
