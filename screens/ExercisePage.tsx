
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserProfile, VitalLog, DailyExercisePlan, ExercisePlanItem, AppNotification } from '../types';
import { getDetailedExercisePlan, analyzeExerciseImage } from '../services/geminiService';

interface Props {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  logs: VitalLog[];
  plan: DailyExercisePlan | null;
  setPlan: (p: DailyExercisePlan | null) => void;
  completedExerciseIds: string[];
  setCompletedExerciseIds: React.Dispatch<React.SetStateAction<string[]>>;
  lastExerciseLogDate: string | null;
  setLastExerciseLogDate: (d: string | null) => void;
  onOpenNotifications: () => void;
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
}

const ExercisePage: React.FC<Props> = ({ 
  profile, setProfile, logs, 
  plan, setPlan, 
  completedExerciseIds, setCompletedExerciseIds,
  lastExerciseLogDate, setLastExerciseLogDate,
  onOpenNotifications, notifications, addNotification
}) => {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
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
      if (plan && lastExerciseLogDate === logDate) return;

      setLoading(true);
      setError('');
      try {
        const generatedPlan = await getDetailedExercisePlan(profile, lastLog);
        const exercisesWithIds = generatedPlan.exercises.map((e, i) => ({ 
          ...e, 
          id: e.id || `exec-${i}`,
          isCompleted: completedExerciseIds.includes(e.id || `exec-${i}`)
        }));
        setPlan({ ...generatedPlan, exercises: exercisesWithIds });
        setLastExerciseLogDate(logDate);
      } catch (err: any) {
        setError('Error al sincronizar el plan de movimiento.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlanIfNeeded();
  }, [selectedDate, profile.age, profile.weight]);

  const handleCameraClick = (execId: string) => {
    if (completedExerciseIds.includes(execId)) return;
    setSelectedExerciseId(execId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedExerciseId || !plan) return;

    const currentExec = plan.exercises.find(ex => ex.id === selectedExerciseId);
    if (!currentExec) return;

    setAnalyzing(true);
    setError('');
    setAnalysisResult(null);
    try {
      const base64 = await fileToBase64(file);
      const result = await analyzeExerciseImage(base64, currentExec.title);
      setAnalysisResult(result);
    } catch (err: any) {
      setError('Error al analizar la evidencia física.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmExercise = () => {
    if (!analysisResult || !selectedExerciseId || !plan) return;
    
    const currentExec = plan.exercises.find(ex => ex.id === selectedExerciseId);
    const score = analysisResult.puntos || 0;
    
    let motivationMsg = "";
    if (score >= 9) {
      motivationMsg = "¡Movimiento perfecto! Estás oxigenando tu sistema vascular eficazmente. 🏃‍♂️";
      addNotification({
        type: 'achievement',
        title: '¡Logro de Movimiento!',
        message: `Sesión "${currentExec?.title}" completada con éxito. +${score} pts.`,
      });
    } else if (score >= 6) {
      motivationMsg = "¡Buen esfuerzo! El movimiento es medicina. Sigue así. 💪";
      addNotification({
        type: 'info',
        title: 'Sesión Completada',
        message: `Has realizado "${currentExec?.title}". Sigue moviéndote.`,
      });
    } else {
      motivationMsg = "Cada paso cuenta. Mañana intenta completar la sesión sugerida para mejores resultados. ✨";
    }

    setMotivationModal({ show: true, msg: motivationMsg, score });
    setCompletedExerciseIds(prev => [...prev, selectedExerciseId]);
    
    const updatedExecs = plan.exercises.map(ex => ex.id === selectedExerciseId ? { ...ex, isCompleted: true } : ex);
    setPlan({ ...plan, exercises: updatedExecs });

    setProfile(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + score
    }));
    
    setAnalysisResult(null);
    setSelectedExerciseId(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const progressPercent = plan?.exercises ? (completedExerciseIds.length / plan.exercises.length) * 100 : 0;

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
          <h2 className="text-[#111813] dark:text-white text-lg font-bold flex-1 text-center tracking-tight">Movimiento Vital</h2>
          <div className="flex items-center gap-1 bg-[#e8fff0] dark:bg-primary/20 px-3 py-1.5 rounded-full border border-primary/20">
            <span className="material-symbols-outlined text-primary text-sm font-black">verified</span>
            <span className="text-[11px] font-black text-[#13ec5b] tracking-tight">{profile.totalPoints} pts</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="px-4 py-4 overflow-x-auto hide-scrollbar flex gap-3 mb-2">
        {weekDays.map((date, idx) => {
          const isSelected = date.toDateString() === selectedDate.toDateString();
          return (
            <button key={idx} onClick={() => setSelectedDate(date)} className={`flex flex-col items-center justify-center min-w-[58px] h-[72px] rounded-2xl transition-all duration-300 border-2 ${isSelected ? 'bg-primary border-primary text-deep-blue shadow-lg' : 'bg-white dark:bg-slate-800 border-gray-100 text-slate-400'}`}>
              <span className="text-[9px] font-black uppercase">{date.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
              <span className="text-xl font-black mt-0.5">{date.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div className="px-4">
        {error && <div className="mb-4 p-4 bg-amber-50 text-amber-600 text-[10px] font-black rounded-2xl text-center uppercase tracking-widest">{error}</div>}

        {/* Daily Goal Card */}
        <div className="bg-deep-blue dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden mt-2">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-xl">bolt</span>
            <p className="text-white text-[11px] font-black uppercase tracking-widest">Meta de Actividad</p>
          </div>
          <p className="text-white text-xl font-bold leading-tight">{plan?.dailyGoal || "Cargando plan..."}</p>
          
          <div className="mt-6 space-y-2">
             <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400">
               <span>Progreso Diario</span>
               <span className="text-primary">{Math.round(progressPercent)}% completado</span>
             </div>
             <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
             </div>
          </div>
        </div>

        {plan?.safetyWarning && (
          <div className="mt-4 p-4 bg-urgent/10 border border-urgent/20 rounded-2xl flex items-start gap-3">
             <span className="material-symbols-outlined text-urgent">warning</span>
             <p className="text-[10px] font-bold text-urgent uppercase italic">{plan.safetyWarning}</p>
          </div>
        )}

        <div className="space-y-5 mt-10">
          <div className="flex justify-between items-end px-2">
            <h2 className="text-deep-blue dark:text-white text-2xl font-black tracking-tight">Sesiones</h2>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Fisiología Ortomolecular</p>
          </div>

          {loading ? (
             <div className="py-20 flex flex-col items-center opacity-40">
                <div className="animate-spin text-primary"><span className="material-symbols-outlined text-4xl">progress_activity</span></div>
             </div>
          ) : (
            plan?.exercises.map((exec) => (
              <div key={exec.id} className="bg-white dark:bg-white/5 rounded-[2.5rem] p-6 border border-gray-100 dark:border-white/10 shadow-xl transition-all relative overflow-hidden">
                {exec.isCompleted && (
                  <div className="absolute top-5 right-5 z-20 bg-primary text-deep-blue size-10 rounded-full flex items-center justify-center shadow-lg animate-scaleIn">
                    <span className="material-symbols-outlined font-black">done</span>
                  </div>
                )}
                
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                       <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${exec.intensity === 'Baja' ? 'bg-blue-100 text-blue-500' : exec.intensity === 'Media' ? 'bg-primary/10 text-primary' : 'bg-urgent/10 text-urgent'}`}>{exec.intensity}</span>
                       <span className="text-[10px] font-black text-slate-400">{exec.time}</span>
                    </div>
                    <h3 className="text-deep-blue dark:text-white font-black text-lg">{exec.title}</h3>
                    <p className="text-slate-500 text-xs mt-2 italic">{exec.description}</p>
                  </div>
                  <div className="ml-4 shrink-0 flex flex-col items-center justify-center size-16 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-100">
                     <span className="text-xl font-black text-deep-blue dark:text-white leading-none">{exec.duration}</span>
                     <span className="text-[8px] font-black text-slate-400 uppercase mt-1">Min</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setExpandedExercise(expandedExercise === exec.id ? null : exec.id)} className="flex-1 h-14 rounded-2xl border-2 border-primary/20 text-[10px] font-black uppercase text-primary flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-lg">clinical_notes</span>Detalles
                  </button>
                  {!exec.isCompleted ? (
                    <button onClick={() => handleCameraClick(exec.id)} disabled={analyzing} className="size-14 rounded-2xl bg-primary text-deep-blue flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-all">
                      <span className="material-symbols-outlined font-black">{analyzing && selectedExerciseId === exec.id ? 'progress_activity' : 'photo_camera'}</span>
                    </button>
                  ) : (
                    <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border-2 border-primary/30"><span className="material-symbols-outlined font-black">verified</span></div>
                  )}
                </div>

                {analysisResult && selectedExerciseId === exec.id && (
                  <div className="mt-6 bg-primary/5 rounded-3xl border-2 border-primary p-5 animate-fadeIn">
                    <p className="text-xs font-bold text-slate-700 italic mb-4">"{analysisResult.feedback}"</p>
                    <button onClick={handleConfirmExercise} className="w-full bg-primary text-deep-blue font-black h-12 rounded-xl text-xs uppercase tracking-widest">Confirmar Actividad</button>
                  </div>
                )}

                {expandedExercise === exec.id && (
                  <div className="mt-6 space-y-4 animate-slideIn">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-l-4 border-primary">
                      <p className="text-[9px] font-black text-primary uppercase mb-1">Instrucciones</p>
                      <p className="text-xs text-slate-700 dark:text-slate-200">{exec.instructions}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-l-4 border-leaf-green">
                      <p className="text-[9px] font-black text-leaf-green uppercase mb-1">Frecuencia Cardiaca Meta</p>
                      <p className="text-xs text-slate-700 dark:text-slate-200">{exec.targetPulseRange} LPM</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-l-4 border-blue-400">
                      <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Beneficio Clínico</p>
                      <p className="text-xs text-slate-700 dark:text-slate-200 italic">"{exec.clinicalBenefit}"</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Motivation Modal */}
      {motivationModal?.show && (
        <div className="fixed inset-0 z-[100] bg-deep-blue/90 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 w-full max-w-[360px] text-center shadow-2xl animate-scaleIn">
            <span className="material-symbols-outlined text-6xl text-primary mb-4">military_tech</span>
            <h3 className="text-2xl font-black text-deep-blue dark:text-white">+{motivationModal.score} Puntos Vitales</h3>
            <p className="text-slate-600 dark:text-slate-400 font-medium italic mt-2 mb-8">"{motivationModal.msg}"</p>
            <button onClick={() => setMotivationModal(null)} className="w-full bg-primary text-deep-blue font-black py-4 rounded-xl text-xs uppercase tracking-widest">Seguir Avanzando</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExercisePage;
