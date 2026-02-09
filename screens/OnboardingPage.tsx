
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';

interface Props {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
}

const OnboardingPage: React.FC<Props> = ({ profile, setProfile }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    gender: profile.gender,
    age: profile.age,
    weight: profile.weight,
    height: profile.height
  });
  const [error, setError] = useState('');

  const handleFinish = () => {
    if (formData.age <= 0 || formData.weight <= 0 || formData.height <= 0) {
      setError('Por favor, ingresa valores válidos para calcular tu IMC y plan metabólico.');
      return;
    }
    setProfile({
      ...profile,
      ...formData
    });
    navigate('/log');
  };

  return (
    <div className="flex flex-col min-h-full bg-background-light dark:bg-background-dark animate-fadeIn">
      <header className="flex items-center p-6 sticky top-0 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md z-10 border-b border-slate-100 dark:border-white/5">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-slate-400">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="flex-1 text-center font-black text-[11px] uppercase tracking-[0.2em] text-slate-500">Medidas Corporales</h2>
        <div className="size-10"></div>
      </header>

      <div className="p-10 space-y-4">
        <div className="flex justify-between items-end">
          <h1 className="text-4xl font-black text-deep-blue dark:text-white leading-[0.95] tracking-tighter">Último <span className="text-primary">Esfuerzo</span>.</h1>
          <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-4 py-1.5 rounded-full mb-1 border border-primary/10">100% Registro</span>
        </div>
        <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-primary transition-all duration-1500 ease-in-out" style={{ width: '100%' }}></div>
        </div>
      </div>

      {error && (
        <div className="mx-10 p-4 bg-urgent/10 text-urgent text-[10px] font-black rounded-2xl border border-urgent/20 animate-pulse text-center uppercase tracking-widest">
          {error}
        </div>
      )}

      <div className="p-10 space-y-12 flex-grow">
        {/* SEXO */}
        <div className="space-y-4">
          <p className="text-[11px] font-black text-primary uppercase tracking-[0.3em] ml-1">Sexo Biológico</p>
          <div className="flex h-20 items-center justify-center rounded-[2rem] bg-white dark:bg-slate-900 p-2 shadow-xl border border-slate-50 dark:border-white/5">
            {['Masculino', 'Femenino'].map(g => (
              <button 
                key={g} 
                onClick={() => setFormData(prev => ({ ...prev, gender: g as any }))} 
                className={`flex h-full grow items-center justify-center rounded-2xl px-6 transition-all text-xs font-black uppercase tracking-widest ${
                  formData.gender === g 
                  ? 'bg-primary text-deep-blue shadow-lg scale-105' 
                  : 'text-slate-400'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* EDAD */}
        <div className="space-y-4">
          <p className="text-[11px] font-black text-primary uppercase tracking-[0.3em] ml-1">Edad Actual</p>
          <div className="relative">
            <input 
              className="w-full h-24 rounded-[2.5rem] border-none bg-white dark:bg-slate-900 px-8 text-4xl font-black text-deep-blue dark:text-white shadow-xl outline-none focus:ring-4 ring-primary/20 transition-all text-center" 
              type="number" 
              placeholder="00"
              value={formData.age || ''} 
              onChange={e => {setFormData(p => ({ ...p, age: parseInt(e.target.value) || 0 })); setError('');}} 
            />
            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 font-black uppercase text-[10px] tracking-widest">Años</div>
          </div>
        </div>

        {/* PESO Y ALTURA */}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4 text-center">
            <p className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">Peso (kg)</p>
            <input 
              className="w-full h-24 rounded-[2.5rem] border-none bg-white dark:bg-slate-900 px-4 text-4xl font-black text-deep-blue dark:text-white shadow-xl outline-none focus:ring-4 ring-primary/20 transition-all text-center" 
              type="number" 
              placeholder="00"
              value={formData.weight || ''} 
              onChange={e => {setFormData(p => ({ ...p, weight: parseInt(e.target.value) || 0 })); setError('');}} 
            />
          </div>
          <div className="space-y-4 text-center">
            <p className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">Altura (cm)</p>
            <input 
              className="w-full h-24 rounded-[2.5rem] border-none bg-white dark:bg-slate-900 px-4 text-4xl font-black text-deep-blue dark:text-white shadow-xl outline-none focus:ring-4 ring-primary/20 transition-all text-center" 
              type="number" 
              placeholder="000"
              value={formData.height || ''} 
              onChange={e => {setFormData(p => ({ ...p, height: parseInt(e.target.value) || 0 })); setError('');}} 
            />
          </div>
        </div>
      </div>

      <div className="p-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-slate-100 dark:border-white/5 z-20">
        <button 
          onClick={handleFinish} 
          className="w-full h-20 bg-primary text-deep-blue font-black text-xl rounded-[2.5rem] flex items-center justify-center gap-4 shadow-2xl shadow-primary/30 active:scale-95 transition-all animate-slideUp"
        >
          Finalizar y Entrar
          <span className="material-symbols-outlined font-black">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default OnboardingPage;
