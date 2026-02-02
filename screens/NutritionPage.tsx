
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { getNutritionAdvice } from '../services/geminiService';

interface Props {
  profile: UserProfile;
}

const NutritionPage: React.FC<Props> = ({ profile }) => {
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const meals = [
    {
      id: '1',
      time: '08:00 AM',
      title: 'Bowl de Avena y Nueces',
      desc: 'Avena integral con nueces, semillas de chía y arándanos frescos.',
      img: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: '2',
      time: '01:30 PM',
      title: 'Salmón a la Plancha',
      desc: 'Salmón rico en Omega-3 con espárragos y quinoa al limón.',
      img: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=300&q=80'
    }
  ];

  const handleShowAdvice = async (title: string) => {
    setSelectedMeal(title);
    setLoadingAdvice(true);
    try {
      const advice = await getNutritionAdvice(title, profile.medicalHistory);
      setAiAdvice(advice);
    } catch (e) {
      setAiAdvice('No se pudo cargar el consejo personalizado.');
    } finally {
      setLoadingAdvice(false);
    }
  };

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-[#dbe6df] dark:border-white/10">
        <div className="flex items-center p-4 justify-between">
          <div className="text-[#111813] dark:text-white flex size-10 items-center justify-center"><span className="material-symbols-outlined">arrow_back_ios</span></div>
          <h2 className="text-[#111813] dark:text-white text-lg font-black flex-1 text-center">Plan de Nutrición Celular</h2>
          <div className="flex w-10 items-center justify-end"><span className="material-symbols-outlined">calendar_today</span></div>
        </div>
      </div>

      <div className="flex gap-3 p-4 overflow-x-auto hide-scrollbar">
        {[12, 13, 14, 15, 16, 17, 18].map((day, i) => (
          <div key={day} className={`flex flex-col items-center justify-center min-w-[64px] h-20 rounded-2xl transition-all ${i === 1 ? 'bg-primary text-deep-blue scale-110 shadow-lg shadow-primary/20 font-black' : 'bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10'}`}>
            <p className="text-[10px] font-bold uppercase opacity-60">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i]}</p>
            <p className="text-lg">{day}</p>
          </div>
        ))}
      </div>

      <div className="px-4">
        <div className="bg-deep-blue dark:bg-slate-900 rounded-3xl border border-primary/20 p-5 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">analytics</span>
            <p className="text-white text-xs font-black uppercase tracking-[0.2em]">Balance Celular</p>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col gap-1 rounded-2xl p-4 bg-white/5 border border-white/10">
              <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Sodio (Límite)</p>
              <p className="text-white text-2xl font-black">1.2g</p>
              <span className="text-[8px] bg-primary/20 text-primary font-black px-2 py-0.5 rounded-full self-start">SEGURO</span>
            </div>
            <div className="flex-1 flex flex-col gap-1 rounded-2xl p-4 bg-white/5 border border-white/10">
              <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Potasio (Meta)</p>
              <p className="text-white text-2xl font-black">3.8g</p>
              <span className="text-[8px] bg-blue-500/20 text-blue-400 font-black px-2 py-0.5 rounded-full self-start">POTENTE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-8 space-y-6">
        <div className="flex justify-between items-end">
          <h2 className="text-deep-blue dark:text-white text-xl font-black">Menú del Día</h2>
          <p className="text-[10px] font-bold text-slate-400">Nutrición Celular Personalizada</p>
        </div>

        {meals.map((meal) => (
          <div key={meal.id} className="flex flex-col gap-4 rounded-3xl bg-white dark:bg-white/5 p-5 border border-gray-100 dark:border-white/10 shadow-xl shadow-slate-100 dark:shadow-none group transition-all hover:border-primary/40">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                   <span className="text-primary text-[10px] font-black uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">{meal.time}</span>
                </div>
                <h3 className="text-deep-blue dark:text-white font-black text-lg leading-tight">{meal.title}</h3>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed font-medium">{meal.desc}</p>
              </div>
              <div 
                className="w-24 h-24 bg-cover bg-center rounded-2xl ml-4 shrink-0 shadow-lg" 
                style={{ backgroundImage: `url("${meal.img}")` }}
              ></div>
            </div>
            
            <button 
              onClick={() => handleShowAdvice(meal.title)}
              className="mt-2 w-full py-3 rounded-xl border border-primary/20 text-[10px] font-black uppercase tracking-[0.15em] text-primary flex items-center justify-center gap-2 hover:bg-primary/5 transition-all"
            >
              <span className="material-symbols-outlined text-lg">clinical_notes</span>
              Análisis Celular
            </button>

            {selectedMeal === meal.title && (
              <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-l-4 border-primary">
                {loadingAdvice ? (
                  <div className="flex items-center gap-3 text-xs italic text-slate-400 font-medium">
                    <div className="animate-spin text-primary">progress_activity</div>
                    Analizando impacto a nivel celular...
                  </div>
                ) : (
                  <p className="text-[12px] text-slate-700 dark:text-slate-200 leading-relaxed font-medium italic">
                    {aiAdvice}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NutritionPage;
