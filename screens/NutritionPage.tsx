
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserProfile, VitalLog, DailyNutritionPlan, MealPlanItem, AppNotification } from '../types';
import { getDetailedNutritionPlan, analyzeFoodImage } from '../services/geminiService';

interface Props {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  logs: VitalLog[];
  plan: DailyNutritionPlan | null;
  setPlan: (p: DailyNutritionPlan | null) => void;
  completedMealIds: string[];
  setCompletedMealIds: React.Dispatch<React.SetStateAction<string[]>>;
  lastPlanLogDate: string | null;
  setLastPlanLogDate: (d: string | null) => void;
  onOpenNotifications: () => void;
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
}

const NutritionPage: React.FC<Props> = ({ 
  profile, setProfile, logs, 
  plan, setPlan, 
  completedMealIds, setCompletedMealIds,
  lastPlanLogDate, setLastPlanLogDate,
  onOpenNotifications, notifications, addNotification
}) => {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [motivationModal, setMotivationModal] = useState<{show: boolean, msg: string, score: number} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastLog = logs.length > 0 ? logs[logs.length - 1] : undefined;
  const unreadCount = notifications.filter(n => !n.read).length;

  const weekDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = -3; i <= 3; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  }, []);

  useEffect(() => {
    const fetchPlanIfNeeded = async () => {
      const logDate = selectedDate.toDateString();
      if (plan && lastPlanLogDate === logDate) return;

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
        setLastPlanLogDate(logDate);
      } catch (err: any) {
        setError('Error al sincronizar el plan celular.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlanIfNeeded();
  }, [selectedDate, profile.age, profile.weight]);

  const handleCameraClick = (mealId: string) => {
    if (completedMealIds.includes(mealId)) return;
    setSelectedMealId(mealId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedMealId || !plan) return;

    const currentMeal = plan.meals.find(m => m.id === selectedMealId);
    if (!currentMeal) return;

    setAnalyzing(true);
    setError('');
    setAnalysisResult(null);
    try {
      const base64 = await fileToBase64(file);
      const result = await analyzeFoodImage(base64, profile, lastLog, currentMeal.title, currentMeal.description);
      setAnalysisResult(result);
    } catch (err: any) {
      setError('Error al analizar la imagen.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmMeal = () => {
    if (!analysisResult || !selectedMealId || !plan) return;
    
    const currentMeal = plan.meals.find(m => m.id === selectedMealId);
    const score = analysisResult.puntos || analysisResult.score || 0;
    
    // Lógica de Motivación
    let motivationMsg = "";
    if (score >= 9) {
      motivationMsg = "¡Increíble! Estás nutriendo tus células al máximo. ¡Tu corazón te lo agradece! 🚀";
      addNotification({
        type: 'achievement',
        title: '¡Nutrición Excelente!',
        message: `Has completado "${currentMeal?.title}" con un puntaje perfecto de ${score}/10.`,
      });
    } else if (score >= 6) {
      motivationMsg = "¡Buen trabajo! Vas por excelente camino. Mañana intenta ajustar un poco más las porciones para llegar al 10. 💪";
      addNotification({
        type: 'info',
        title: 'Nutrición Completada',
        message: `Has registrado "${currentMeal?.title}" exitosamente.`,
      });
    } else {
      motivationMsg = "Tu salud arterial es prioridad. Mañana tienes una nueva oportunidad para elegir mejor. ¡No te rindas! 🥗";
      addNotification({
        type: 'reminder',
        title: 'Ajuste Nutricional',
        message: `El plato "${currentMeal?.title}" no fue el ideal hoy. ¡Mañana lo harás mejor!`,
      });
    }

    setMotivationModal({ show: true, msg: motivationMsg, score });
    setCompletedMealIds(prev => [...prev, selectedMealId]);
    
    const updatedMeals = plan.meals.map(m => m.id === selectedMealId ? { ...m, isCompleted: true } : m);
    setPlan({ ...plan, meals: updatedMeals });

    const sodiumToAdd = analysisResult.sodio_mg || 0;
    const potassiumToAdd = analysisResult.potasio_mg || 0;

    setProfile(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + score,
      dailyNutrients: {
        ...prev.dailyNutrients,
        sodium: prev.dailyNutrients.sodium + sodiumToAdd,
        potassium: prev.dailyNutrients.potassium + potassiumToAdd
      }
    }));
    
    setAnalysisResult(null);
    setSelectedMealId(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const getMealIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return 'sunny';
      case 'lunch': return 'restaurant';
      case 'snack': return 'local_cafe'; 
      case 'dinner': return 'nights_stay';
      default: return 'lunch_dining';
    }
  };

  const getMealImage = (type: string, title: string) => {
    if (title.toLowerCase().includes('avena')) return "https://images.unsplash.com/photo-1504113888839-1c8eb50233d3?auto=format&fit=crop&w=300&q=80";
    if (title.toLowerCase().includes('quinoa') || title.toLowerCase().includes('bol')) return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80";
    const images: any = {
      breakfast: "https://images.unsplash.com/photo-1504113888839-1c8eb50233d3?auto=format&fit=crop&w=300&q=80",
      lunch: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=300&q=80",
      snack: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=300&q=80",
      dinner: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80"
    };
    return images[type] || images.lunch;
  };

  const sodiumLimitMg = parseFloat(plan?.sodiumLimit || '1.5') * 1000;
  const remainingSodium = Math.max(0, sodiumLimitMg - profile.dailyNutrients.sodium);
  const currentPotassium = profile.dailyNutrients.potassium;
  const progressPercent = plan?.meals ? (completedMealIds.length / plan.meals.length) * 100 : 0;

  return (
    <div className="pb-32 bg-slate-50 dark:bg-background-dark min-h-full">
      <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
      
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-[#dbe6df] dark:border-white/10">
        <div className="flex items-center p-4 justify-between">
          <button 
            onClick={onOpenNotifications}
            className="text-[#111813] dark:text-white flex size-10 items-center justify-center relative hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined font-light text-2xl">notifications</span>
            {unreadCount > 0 && (
              <div className="absolute top-1 right-1 size-4 bg-urgent text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                {unreadCount}
              </div>
            )}
          </button>
          <h2 className="text-[#111813] dark:text-white text-lg font-bold flex-1 text-center tracking-tight">Medicina Ortomolecular</h2>
          <div className="flex items-center gap-1 bg-[#e8fff0] dark:bg-primary/20 px-3 py-1.5 rounded-full border border-primary/20">
            <span className="material-symbols-outlined text-primary text-sm font-black">verified</span>
            <span className="text-[11px] font-black text-[#13ec5b] tracking-tight">{profile.totalPoints} pts</span>
          </div>
        </div>
      </div>

      {/* Week Calendar */}
      <div className="px-4 py-4 overflow-x-auto hide-scrollbar flex gap-3 mb-2 bg-white/50 dark:bg-slate-900/30">
        {weekDays.map((date, idx) => {
          const isSelected = date.toDateString() === selectedDate.toDateString();
          const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
          const dayNum = date.getDate();
          return (
            <button key={idx} onClick={() => setSelectedDate(date)} className={`flex flex-col items-center justify-center min-w-[58px] h-[72px] rounded-2xl transition-all duration-300 border-2 ${isSelected ? 'bg-primary border-primary text-deep-blue shadow-lg shadow-primary/30 scale-105' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-white/5 text-slate-400'}`}>
              <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-deep-blue/60' : 'text-slate-400'}`}>{dayName}</span>
              <span className="text-xl font-black mt-0.5">{dayNum}</span>
            </button>
          );
        })}
      </div>

      <div className="px-4">
        {error && <div className="mb-4 p-4 bg-amber-50 text-amber-600 text-[10px] font-black rounded-2xl border border-amber-100 animate-fadeIn text-center uppercase tracking-widest">{error}</div>}

        {/* Balance Card */}
        <div className="bg-deep-blue dark:bg-slate-900 rounded-[2.5rem] border border-primary/10 p-6 shadow-2xl relative overflow-hidden mt-2">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="flex items-center gap-2 mb-5 relative z-10">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>assessment</span>
            <p className="text-white text-[11px] font-black uppercase tracking-[0.2em]">Balance Celular Hoy</p>
          </div>
          <div className="flex gap-3 relative z-10">
            <div className="flex-1 flex flex-col gap-1 rounded-[1.5rem] p-4 bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Sodio Restante</p>
              <p className="text-white text-3xl font-black tracking-tighter">{(remainingSodium / 1000).toFixed(1)}g</p>
            </div>
            <div className="flex-1 flex flex-col gap-1 rounded-[1.5rem] p-4 bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Potasio Hoy</p>
              <p className="text-white text-3xl font-black tracking-tighter">{(currentPotassium / 1000).toFixed(1)}g</p>
            </div>
          </div>
        </div>

        {/* Adherence Progress and Animated Instruction */}
        <div className="mt-4 px-2 space-y-4">
           <div className="space-y-2">
             <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
               <span>Progreso de Adherencia</span>
               <span className="text-primary">{Math.round(progressPercent)}% del plan</span>
             </div>
             <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner border border-slate-100 dark:border-white/5">
                <div className="h-full bg-gradient-to-r from-primary to-leaf-green transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(19,236,91,0.5)]" style={{ width: `${progressPercent}%` }}></div>
             </div>
           </div>
           
           <div className="w-full flex items-center justify-between bg-primary/10 border border-primary/30 p-4 rounded-2xl animate-pulse transition-all">
              <div className="flex items-center gap-3">
                 <div className="size-10 bg-primary text-deep-blue rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-2xl font-black">photo_camera</span>
                 </div>
                 <div className="text-left">
                    <p className="text-[11px] font-black text-primary uppercase tracking-wider">¡Suma puntos vitales!</p>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Toma foto a tu plato y confirma</p>
                 </div>
              </div>
              <span className="material-symbols-outlined text-primary font-black opacity-30">verified</span>
           </div>
        </div>
      </div>

      {/* Meals Menu */}
      <div className="px-4 pt-10 space-y-6">
        <div className="flex justify-between items-end px-2">
          <h2 className="text-deep-blue dark:text-white text-2xl font-black tracking-tight">Menú del Día</h2>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">DASH Protocol</p>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-50">
            <div className="animate-spin text-primary"><span className="material-symbols-outlined text-5xl">progress_activity</span></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Sincronizando Plan...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {plan?.meals.map((meal) => (
              <div key={meal.id} className="flex flex-col gap-5 rounded-[2.5rem] bg-white dark:bg-white/5 p-6 border border-gray-100 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none animate-fadeIn group relative overflow-hidden transition-all hover:border-primary/30">
                {meal.isCompleted && (
                  <div className="absolute top-5 right-5 z-20">
                    <div className="bg-[#13ec5b] text-white size-10 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 ring-4 ring-white dark:ring-slate-900 animate-scaleIn">
                      <span className="material-symbols-outlined text-2xl font-black">done</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                       <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{getMealIcon(meal.type)}</span>
                       <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${meal.isCompleted ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{meal.time}</span>
                    </div>
                    <h3 className="text-deep-blue dark:text-white font-black text-[19px] leading-tight pr-12">{meal.title}</h3>
                    <p className="text-slate-500 text-[13px] mt-3 leading-relaxed font-medium line-clamp-2 italic">{meal.description}</p>
                  </div>
                  <div className="relative ml-4 shrink-0">
                    <div className="w-24 h-24 bg-cover bg-center rounded-[2rem] shadow-2xl border-4 border-white dark:border-slate-800" style={{ backgroundImage: `url("${getMealImage(meal.type, meal.title)}")` }}></div>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setExpandedMeal(expandedMeal === meal.id ? null : meal.id)} className="flex-1 h-16 rounded-[1.5rem] border-2 border-primary/20 text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center justify-center gap-3 hover:bg-primary/5 transition-all active:scale-95"><span className="material-symbols-outlined text-2xl">clinical_notes</span>Detalles</button>
                  {!meal.isCompleted ? (
                    <button onClick={() => handleCameraClick(meal.id)} disabled={analyzing} className="size-16 rounded-[1.5rem] bg-[#13ec5b] text-deep-blue flex flex-col items-center justify-center shadow-xl shadow-primary/20 active:scale-90 transition-all disabled:opacity-50 hover:brightness-105">
                      <span className="material-symbols-outlined text-2xl font-black leading-none">{analyzing && selectedMealId === meal.id ? 'progress_activity' : 'photo_camera'}</span>
                      {!analyzing && <span className="text-[7px] font-black uppercase tracking-widest mt-0.5 animate-bounce">PUNTOS</span>}
                    </button>
                  ) : (
                    <div className="size-16 rounded-[1.5rem] bg-[#13ec5b]/10 text-[#13ec5b] flex items-center justify-center border-2 border-[#13ec5b]/30"><span className="material-symbols-outlined text-3xl font-black">verified</span></div>
                  )}
                </div>

                {analysisResult && selectedMealId === meal.id && (
                  <div className="mt-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border-2 border-primary p-5 shadow-inner animate-fadeIn">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                         <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xl border border-primary/20">{analysisResult.puntos}</div>
                         <div><p className="text-[10px] font-black uppercase text-primary tracking-[0.1em]">Análisis IA</p></div>
                      </div>
                      <button onClick={() => setAnalysisResult(null)} className="text-slate-300"><span className="material-symbols-outlined">close</span></button>
                    </div>
                    <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100 italic leading-relaxed mb-5 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-white/5">"{analysisResult.feedback}"</p>
                    <button onClick={handleConfirmMeal} className="w-full bg-primary text-deep-blue font-black h-16 rounded-2xl shadow-lg mb-4 flex items-center justify-center gap-3 active:scale-95 transition-all text-sm uppercase tracking-[0.1em] hover:brightness-105"><span className="material-symbols-outlined text-2xl font-black">check_circle</span><span>Confirmar Plato</span></button>
                  </div>
                )}

                {expandedMeal === meal.id && (
                  <div className="mt-4 space-y-4 animate-slideIn">
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border-l-4 border-primary">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-xs">kitchen</span> Ingredientes</p>
                      <p className="text-[14px] text-slate-700 dark:text-slate-200 font-bold">{meal.description}</p>
                      <p className="text-[12px] text-slate-500 mt-2 italic">Porción: {meal.quantities}</p>
                    </div>
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border-l-4 border-leaf-green">
                      <p className="text-[10px] font-black text-leaf-green uppercase tracking-widest mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-xs">analytics</span> Nutrientes</p>
                      <div className="flex flex-wrap gap-2">
                        {meal.nutrients.map((nut, i) => <span key={i} className="px-3 py-1 bg-white dark:bg-slate-700 rounded-full text-[10px] font-bold border border-slate-100 shadow-sm">{nut}</span>)}
                      </div>
                    </div>
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border-l-4 border-blue-400">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-xs">auto_awesome</span> Beneficio</p>
                      <p className="text-[14px] text-slate-700 dark:text-slate-200 italic">"{meal.cellularBenefit}"</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Motivation Modal */}
      {motivationModal?.show && (
        <div className="fixed inset-0 z-[100] bg-deep-blue/90 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 w-full max-w-[360px] text-center shadow-2xl border-4 border-primary/20 animate-scaleIn">
            <div className="size-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className={`material-symbols-outlined text-6xl text-primary ${motivationModal.score >= 9 ? 'animate-bounce' : ''}`}>
                {motivationModal.score >= 9 ? 'workspace_premium' : motivationModal.score >= 6 ? 'trending_up' : 'favorite'}
              </span>
            </div>
            <h3 className="text-2xl font-black text-deep-blue dark:text-white mb-2">+{motivationModal.score} Puntos Vitales</h3>
            <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic mb-8">"{motivationModal.msg}"</p>
            <button onClick={() => setMotivationModal(null)} className="w-full bg-primary text-deep-blue font-black py-5 rounded-2xl shadow-lg active:scale-95 transition-all text-sm uppercase tracking-widest">Continuar mi Plan</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NutritionPage;
