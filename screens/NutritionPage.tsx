
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, VitalLog, DailyNutritionPlan, MealPlanItem } from '../types';
import { getDetailedNutritionPlan, analyzeFoodImage } from '../services/geminiService';

interface Props {
  profile: UserProfile;
  logs: VitalLog[];
}

const NutritionPage: React.FC<Props> = ({ profile, logs }) => {
  const [plan, setPlan] = useState<DailyNutritionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastLog = logs.length > 0 ? logs[logs.length - 1] : undefined;

  useEffect(() => {
    const fetchPlan = async () => {
      setLoading(true);
      setError('');
      try {
        const generatedPlan = await getDetailedNutritionPlan(profile, lastLog);
        setPlan(generatedPlan);
      } catch (err) {
        console.error(err);
        setError('No pudimos generar tu plan personalizado. Intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [profile, lastLog]);

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const base64 = await fileToBase64(file);
      const result = await analyzeFoodImage(base64, profile, lastLog);
      setAnalysisResult(result);
    } catch (err) {
      setError('Error al analizar la imagen. Por favor, intenta de nuevo.');
    } finally {
      setAnalyzing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const getMealIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return 'sunny';
      case 'lunch': return 'restaurant';
      case 'snack': return 'apple';
      case 'dinner': return 'nights_stay';
      default: return 'lunch_dining';
    }
  };

  const getMealImage = (type: string) => {
    const images: any = {
      breakfast: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=300&q=80",
      lunch: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=300&q=80",
      snack: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=300&q=80",
      dinner: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80"
    };
    return images[type] || images.lunch;
  };

  return (
    <div className="pb-32 bg-slate-50 dark:bg-background-dark min-h-full">
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <div className="sticky top-0 z-50 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-[#dbe6df] dark:border-white/10">
        <div className="flex items-center p-4 justify-between">
          <div className="text-[#111813] dark:text-white flex size-10 items-center justify-center">
            <span className="material-symbols-outlined">menu_book</span>
          </div>
          <h2 className="text-[#111813] dark:text-white text-lg font-black flex-1 text-center">Medicina Ortomolecular</h2>
          <button 
            onClick={handleCameraClick}
            disabled={analyzing}
            className="flex w-10 h-10 items-center justify-center bg-primary/10 rounded-full text-primary hover:bg-primary/20 transition-all active:scale-90"
          >
            <span className="material-symbols-outlined">{analyzing ? 'progress_activity' : 'photo_camera'}</span>
          </button>
        </div>
      </div>

      <div className="flex gap-3 p-4 overflow-x-auto hide-scrollbar">
        {[12, 13, 14, 15, 16, 17, 18].map((day, i) => (
          <div key={day} className={`flex flex-col items-center justify-center min-w-[64px] h-20 rounded-2xl transition-all ${i === 1 ? 'bg-primary text-deep-blue scale-110 shadow-lg shadow-primary/20 font-black' : 'bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 opacity-40'}`}>
            <p className="text-[10px] font-bold uppercase opacity-60">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i]}</p>
            <p className="text-lg">{day}</p>
          </div>
        ))}
      </div>

      <div className="px-4">
        {analysisResult && (
          <div className="mb-6 bg-white dark:bg-slate-900 rounded-3xl border-2 border-primary p-6 shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                 <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                   {analysisResult.score}
                 </div>
                 <div>
                    <p className="text-xs font-black uppercase text-primary tracking-widest">Puntaje DASH</p>
                    <p className="text-[10px] text-slate-400 font-bold">{analysisResult.score === 10 ? '¡Excelente elección!' : 'Podemos mejorar'}</p>
                 </div>
              </div>
              <button onClick={() => setAnalysisResult(null)} className="text-slate-300"><span className="material-symbols-outlined">close</span></button>
            </div>
            
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 italic leading-relaxed mb-4">
              "{analysisResult.feedback}"
            </p>

            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 mb-4">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Ajuste de Próxima Comida:</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {analysisResult.nextStepAdjustment}
              </p>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl uppercase tracking-tighter">
              <span className="material-symbols-outlined text-sm">groups</span>
              {analysisResult.communityMessage}
            </div>
          </div>
        )}

        <div className="bg-deep-blue dark:bg-slate-900 rounded-3xl border border-primary/20 p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="flex items-center gap-2 mb-4 relative z-10">
            <span className="material-symbols-outlined text-primary text-xl">analytics</span>
            <p className="text-white text-xs font-black uppercase tracking-[0.2em]">Balance Celular del Día</p>
          </div>
          <div className="flex gap-4 relative z-10">
            <div className="flex-1 flex flex-col gap-1 rounded-2xl p-4 bg-white/5 border border-white/10">
              <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Sodio (Límite)</p>
              <p className="text-white text-2xl font-black">
                {analysisResult?.nutritionalImpact?.sodium ? `-${analysisResult.nutritionalImpact.sodium}` : (plan?.sodiumLimit || '--')}
              </p>
              <span className="text-[8px] bg-primary/20 text-primary font-black px-2 py-0.5 rounded-full self-start">SEGURO</span>
            </div>
            <div className="flex-1 flex flex-col gap-1 rounded-2xl p-4 bg-white/5 border border-white/10">
              <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Potasio (Meta)</p>
              <p className="text-white text-2xl font-black">
                {analysisResult?.nutritionalImpact?.potassium ? `+${analysisResult.nutritionalImpact.potassium}` : (plan?.potassiumTarget || '--')}
              </p>
              <span className="text-[8px] bg-blue-500/20 text-blue-400 font-black px-2 py-0.5 rounded-full self-start">POTENTE</span>
            </div>
          </div>
          <p className="text-[9px] text-slate-500 font-bold mt-4 uppercase tracking-widest text-center italic">Basado en DASH & Medicina Pro-Vida</p>
        </div>
      </div>

      <div className="px-4 pt-8 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-deep-blue dark:text-white text-xl font-black">Menú del Día</h2>
            {lastLog && (
              <p className="text-[10px] font-bold text-primary uppercase mt-1">Ajustado para {lastLog.systolic}/{lastLog.diastolic} mmHg</p>
            )}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plan Ortomolecular</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
            <div className="animate-spin text-primary"><span className="material-symbols-outlined text-4xl">progress_activity</span></div>
            <p className="text-xs font-black uppercase tracking-widest animate-pulse">Calculando nutrientes celulares...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 text-red-500 rounded-3xl border border-red-100 text-center text-xs font-bold leading-relaxed">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            {plan?.meals.map((meal, idx) => (
              <div key={idx} className="flex flex-col gap-4 rounded-3xl bg-white dark:bg-white/5 p-5 border border-gray-100 dark:border-white/10 shadow-xl shadow-slate-100 dark:shadow-none animate-fadeIn group">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="material-symbols-outlined text-primary text-lg">{getMealIcon(meal.type)}</span>
                       <span className="text-primary text-[10px] font-black uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">{meal.time}</span>
                    </div>
                    <h3 className="text-deep-blue dark:text-white font-black text-lg leading-tight">{meal.title}</h3>
                    <p className="text-slate-500 text-xs mt-2 leading-relaxed font-medium line-clamp-2">{meal.description}</p>
                  </div>
                  <div 
                    className="w-24 h-24 bg-cover bg-center rounded-2xl ml-4 shrink-0 shadow-lg border-2 border-white dark:border-slate-800" 
                    style={{ backgroundImage: `url("${getMealImage(meal.type)}")` }}
                  ></div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setExpandedMeal(expandedMeal === meal.title ? null : meal.title)}
                    className="flex-1 py-3 rounded-xl border-2 border-primary/20 text-[10px] font-black uppercase tracking-[0.15em] text-primary flex items-center justify-center gap-2 hover:bg-primary/5 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">clinical_notes</span>
                    ANÁLISIS CELULAR
                  </button>
                </div>

                {expandedMeal === meal.title && (
                  <div className="mt-2 space-y-4 animate-slideIn">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-l-4 border-primary">
                      <p className="text-[11px] font-black text-primary uppercase tracking-widest mb-2">Impacto Celular:</p>
                      <p className="text-[12px] text-slate-700 dark:text-slate-200 leading-relaxed font-medium italic">
                        "{meal.cellularBenefit}"
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cantidades DASH:</p>
                        <p className="text-[11px] font-bold text-deep-blue dark:text-white">{meal.quantities}</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Micro-Nutrientes:</p>
                        <div className="flex flex-wrap gap-1">
                          {meal.nutrients.map((n, i) => (
                            <span key={i} className="text-[8px] bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded font-black">{n}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <div className="mt-8 p-6 bg-primary/5 rounded-[2.5rem] border-2 border-dashed border-primary/30">
               <div className="flex items-center gap-3 mb-3">
                  <span className="material-symbols-outlined text-primary text-2xl">eco</span>
                  <p className="text-[11px] font-black uppercase tracking-widest text-primary">Saber es Poder</p>
               </div>
               <p className="text-[12px] text-slate-600 dark:text-slate-300 italic leading-relaxed">
                 {plan?.overallAdvice}
               </p>
               <p className="text-[9px] text-slate-400 mt-4 font-bold uppercase text-center">Referencia: Dash Diet & Ellen White's Counsel</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NutritionPage;
