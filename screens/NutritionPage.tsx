
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, VitalLog, DailyNutritionPlan, MealPlanItem } from '../types';
import { getDetailedNutritionPlan, analyzeFoodImage } from '../services/geminiService';

interface Props {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  logs: VitalLog[];
}

const NutritionPage: React.FC<Props> = ({ profile, setProfile, logs }) => {
  const [plan, setPlan] = useState<DailyNutritionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [completedMealIds, setCompletedMealIds] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastLog = logs.length > 0 ? logs[logs.length - 1] : undefined;

  useEffect(() => {
    const fetchPlan = async () => {
      setLoading(true);
      setError('');
      try {
        const generatedPlan = await getDetailedNutritionPlan(profile, lastLog);
        const mealsWithIds = generatedPlan.meals.map((m, i) => ({ 
          ...m, 
          id: m.id || `meal-${m.type}-${i}`,
          isCompleted: completedMealIds.includes(m.id || `meal-${m.type}-${i}`)
        }));
        setPlan({ ...generatedPlan, meals: mealsWithIds });
      } catch (err) {
        console.error(err);
        setError('No pudimos generar tu plan personalizado. Intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [profile, lastLog]);

  const handleCameraClick = (mealId: string) => {
    if (completedMealIds.includes(mealId)) return;
    setSelectedMealId(mealId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedMealId) return;

    setAnalyzing(true);
    setError('');
    setAnalysisResult(null);
    try {
      const base64 = await fileToBase64(file);
      const result = await analyzeFoodImage(base64, profile, lastLog);
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
      setError('Error al analizar la imagen. Por favor, intenta de nuevo.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmMeal = () => {
    if (!analysisResult || !selectedMealId || !plan) return;

    setCompletedMealIds(prev => [...prev, selectedMealId]);

    setPlan(prev => {
      if (!prev) return null;
      return {
        ...prev,
        meals: prev.meals.map(m => m.id === selectedMealId ? { ...m, isCompleted: true } : m)
      };
    });

    // Se usan los puntos de la respuesta estricta 'puntos' o 'score' como fallback
    const pointsToAdd = analysisResult.puntos || analysisResult.score || 0;
    setProfile(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + pointsToAdd
    }));

    setAnalysisResult(null);
    setSelectedMealId(null);
    alert(`¡Plato confirmado! Has ganado ${pointsToAdd} puntos para tu salud celular.`);
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
      breakfast: "https://images.unsplash.com/photo-1504113888839-1c8eb50233d3?auto=format&fit=crop&w=300&q=80",
      lunch: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=300&q=80",
      snack: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=300&q=80",
      dinner: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80"
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
          <div className="flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
            <span className="material-symbols-outlined text-primary text-sm font-black">verified</span>
            <span className="text-[11px] font-black text-primary tracking-tight">{profile.totalPoints} pts</span>
          </div>
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
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-500 rounded-2xl border border-red-100 text-xs font-bold animate-fadeIn">
            {error}
          </div>
        )}

        {analysisResult && (
          <div className="mb-6 bg-white dark:bg-slate-900 rounded-3xl border-2 border-primary p-6 shadow-2xl animate-fadeIn ring-4 ring-primary/5">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                 <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xl border border-primary/20">
                   {analysisResult.puntos || analysisResult.score}
                 </div>
                 <div>
                    <p className="text-xs font-black uppercase text-primary tracking-widest">Resultado Análisis</p>
                    <p className="text-[10px] text-slate-400 font-bold">Identificado: {analysisResult.identifiedFoods?.join(', ')}</p>
                 </div>
              </div>
              <button onClick={() => setAnalysisResult(null)} className="text-slate-300"><span className="material-symbols-outlined">close</span></button>
            </div>
            
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 italic leading-relaxed mb-6 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
              "{analysisResult.feedback}"
            </p>

            <button 
              onClick={handleConfirmMeal}
              className="w-full bg-primary text-deep-blue font-black h-16 rounded-2xl shadow-xl mb-4 flex items-center justify-center gap-3 active:scale-95 transition-all text-sm uppercase tracking-widest"
            >
              <span className="material-symbols-outlined text-2xl">check_circle</span>
              CONFIRMAR Y GUARDAR PLATO
            </button>

            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-4">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Impacto Nutricional Estimado:</p>
              <div className="flex gap-4">
                <p className="text-[10px] text-slate-600 dark:text-slate-300 font-bold">Sodio: {analysisResult.sodio_mg || analysisResult.nutritionalImpact?.sodium}mg</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 font-bold">Potasio: {analysisResult.potasio_mg || analysisResult.nutritionalImpact?.potassium}mg</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl uppercase tracking-tighter italic">
              <span className="material-symbols-outlined text-xs">groups</span>
              {analysisResult.mensaje_comunidad || analysisResult.communityMessage}
            </div>
          </div>
        )}

        <div className="bg-deep-blue dark:bg-slate-900 rounded-3xl border border-primary/20 p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl opacity-30"></div>
          <div className="flex items-center gap-2 mb-4 relative z-10">
            <span className="material-symbols-outlined text-primary text-xl">analytics</span>
            <p className="text-white text-xs font-black uppercase tracking-[0.2em]">Balance Celular Hoy</p>
          </div>
          <div className="flex gap-4 relative z-10">
            <div className="flex-1 flex flex-col gap-1 rounded-2xl p-4 bg-white/5 border border-white/10">
              <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Sodio Restante</p>
              <p className="text-white text-2xl font-black">{plan?.sodiumLimit || '--'}</p>
              <span className="text-[8px] bg-primary/20 text-primary font-black px-2 py-0.5 rounded-full self-start">DENTRO DEL LÍMITE</span>
            </div>
            <div className="flex-1 flex flex-col gap-1 rounded-2xl p-4 bg-white/5 border border-white/10">
              <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Meta Potasio</p>
              <p className="text-white text-2xl font-black">{plan?.potassiumTarget || '--'}</p>
              <span className="text-[8px] bg-blue-500/20 text-blue-400 font-black px-2 py-0.5 rounded-full self-start">POTENTE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-8 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-deep-blue dark:text-white text-xl font-black">Menú del Día</h2>
            {lastLog && (
              <p className="text-[10px] font-bold text-primary uppercase mt-1 tracking-widest">Ajustado para {lastLog.systolic}/{lastLog.diastolic} mmHg</p>
            )}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocolo DASH</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
            <div className="animate-spin text-primary"><span className="material-symbols-outlined text-4xl">progress_activity</span></div>
            <p className="text-xs font-black uppercase tracking-widest animate-pulse">Sincronizando nutrientes celulares...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {plan?.meals.map((meal) => (
              <div key={meal.id} className="flex flex-col gap-4 rounded-[2.5rem] bg-white dark:bg-white/5 p-6 border border-gray-100 dark:border-white/10 shadow-xl shadow-slate-100 dark:shadow-none animate-fadeIn group relative">
                
                {meal.isCompleted && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-[#13ec5b] text-white size-8 rounded-full flex items-center justify-center shadow-lg shadow-primary/20 ring-4 ring-white dark:ring-slate-900 animate-scaleIn">
                      <span className="material-symbols-outlined text-xl font-black">done</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                       <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{getMealIcon(meal.type)}</span>
                       <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${meal.isCompleted ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                         {meal.time}
                       </span>
                    </div>
                    <h3 className="text-deep-blue dark:text-white font-black text-lg leading-tight group-hover:text-primary transition-colors">{meal.title}</h3>
                    <p className="text-slate-500 text-xs mt-3 leading-relaxed font-medium line-clamp-2">{meal.description}</p>
                  </div>
                  <div className="relative ml-4 shrink-0">
                    <div 
                      className="w-24 h-24 bg-cover bg-center rounded-3xl shadow-2xl border-4 border-white dark:border-slate-800" 
                      style={{ backgroundImage: `url("${getMealImage(meal.type)}")` }}
                    ></div>
                    {meal.isCompleted && (
                       <div className="absolute inset-0 bg-white/20 dark:bg-black/20 rounded-3xl backdrop-blur-[1px] flex items-center justify-center">
                         <span className="material-symbols-outlined text-white text-5xl font-black drop-shadow-lg opacity-80">lock</span>
                       </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => setExpandedMeal(expandedMeal === meal.id ? null : meal.id)}
                    className="flex-1 py-4 rounded-2xl border-2 border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center justify-center gap-2 hover:bg-primary/5 transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-xl">clinical_notes</span>
                    ANÁLISIS CELULAR
                  </button>
                  
                  {!meal.isCompleted ? (
                    <button 
                      onClick={() => handleCameraClick(meal.id)}
                      disabled={analyzing}
                      className="size-14 rounded-2xl bg-primary text-deep-blue flex items-center justify-center shadow-xl shadow-primary/10 active:scale-90 transition-all disabled:opacity-50 hover:brightness-105"
                    >
                      <span className="material-symbols-outlined text-2xl font-black">{analyzing && selectedMealId === meal.id ? 'progress_activity' : 'photo_camera'}</span>
                    </button>
                  ) : (
                    <div className="size-14 rounded-2xl bg-[#13ec5b]/10 text-[#13ec5b] flex items-center justify-center border-2 border-[#13ec5b]/20">
                      <span className="material-symbols-outlined text-2xl font-black">verified</span>
                    </div>
                  )}
                </div>

                {expandedMeal === meal.id && (
                  <div className="mt-4 space-y-5 animate-slideIn">
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-l-4 border-primary shadow-inner">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs">auto_awesome</span>
                        Impacto Celular:
                      </p>
                      <p className="text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed font-medium italic">
                        "{meal.cellularBenefit}"
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Cantidades DASH:</p>
                        <p className="text-[11px] font-bold text-deep-blue dark:text-white leading-tight">{meal.quantities}</p>
                      </div>
                      <div className="p-4 bg-white dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Micro-Nutrientes:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {meal.nutrients.map((n, i) => (
                            <span key={i} className="text-[9px] bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-lg font-black text-slate-600 dark:text-slate-300">{n}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NutritionPage;
