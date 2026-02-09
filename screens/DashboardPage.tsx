
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, VitalLog, AppNotification } from '../types';
import { getHealthInsight } from '../services/geminiService';

interface Props {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  logs: VitalLog[];
  setLogs: React.Dispatch<React.SetStateAction<VitalLog[]>>;
  lastInsight: any | null;
  setLastInsight: React.Dispatch<React.SetStateAction<any | null>>;
  onOpenNotifications: () => void;
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
}

const DashboardPage: React.FC<Props> = ({ profile, setProfile, logs, setLogs, lastInsight, setLastInsight, onOpenNotifications, notifications, addNotification }) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<'view' | 'medCheck' | 'vitals'>('view');
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [confirmedMedIds, setConfirmedMedIds] = useState<string[]>([]);
  const [missedDose, setMissedDose] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [showManualSelection, setShowManualSelection] = useState(false);
  
  // Perfil Dropdown & Modal
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>(profile);

  // Estados de Registro Temporal
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [momentOfDay, setMomentOfDay] = useState<VitalLog['momentOfDay']>('morning');
  const [physicalState, setPhysicalState] = useState<VitalLog['physicalState']>('resting');
  const [sleepHours, setSleepHours] = useState('8');
  const [sleepQuality, setSleepQuality] = useState(true);
  const [consumptions, setConsumptions] = useState<VitalLog['consumptions']>({
    coffee: false, alcohol: false, salt: false, smoking: false, fried_foods: false, sugar: false
  });
  const [symptoms, setSymptoms] = useState<VitalLog['symptoms']>(['none']);
  
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [error, setError] = useState('');
  const [isQuotaError, setIsQuotaError] = useState(false);

  const lastLog = logs[logs.length - 1];
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const bmi = useMemo(() => {
    const h = profile.height / 100;
    return h > 0 ? (profile.weight / (h * h)).toFixed(1) : '0';
  }, [profile.weight, profile.height]);

  const bmiStatus = useMemo(() => {
    const val = parseFloat(bmi);
    if (val <= 0) return { text: 'text-slate-400', bg: 'bg-slate-100', icon: 'text-slate-400' };
    if (val < 18.5) return { text: 'text-warning', bg: 'bg-warning/10', icon: 'text-warning' }; 
    if (val < 25) return { text: 'text-primary', bg: 'bg-primary/10', icon: 'text-primary' };   
    if (val < 30) return { text: 'text-warning', bg: 'bg-warning/10', icon: 'text-warning' }; 
    return { text: 'text-urgent', bg: 'bg-urgent/10', icon: 'text-urgent' };                  
  }, [bmi]);

  const startNewRegistration = () => {
    setConfirmedMedIds([]);
    setMissedDose(false);
    setShowManualSelection(false);
    setSymptoms(['none']);
    setLastInsight(null);
    setError('');
    setIsQuotaError(false);
    setTimestamp(new Date().toISOString().slice(0, 16));
    setConsumptions({ coffee: false, alcohol: false, salt: false, smoking: false, fried_foods: false, sugar: false });
    setActiveStep('medCheck');
  };

  const calculateMAS = (currSys: number) => {
    let score = 0;
    const totalMeds = profile.medicalHistory.currentMedications.length;
    if (totalMeds > 0) score += (confirmedMedIds.length / totalMeds) * 40;
    else score += 40;
    if (lastLog && (currSys <= lastLog.systolic || currSys <= 130)) score += 30;
    else if (currSys <= 130) score += 30;
    score += 10;
    return Math.min(100, Math.round(score));
  };

  const handleOpenKeySelector = async () => {
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setIsQuotaError(false);
      setError('');
    } catch (err) {
      console.error("Error opening key selector", err);
    }
  };

  const handleSaveLog = async () => {
    if (!systolic || !diastolic || !pulse) {
      setError('Por favor complete todos los campos obligatorios (*)');
      return;
    }
    
    setError('');
    setIsQuotaError(false);
    setLoadingInsight(true);
    
    const sysNum = parseInt(systolic);
    const diaNum = parseInt(diastolic);
    const pulseNum = parseInt(pulse);
    const mas = calculateMAS(sysNum);

    const newLog: VitalLog = {
      systolic: sysNum,
      diastolic: diaNum,
      pulse: pulseNum,
      timestamp: new Date(timestamp),
      momentOfDay,
      physicalState,
      sleep: { hours: parseInt(sleepHours) || 8, quality: sleepQuality },
      consumptions,
      symptoms,
      note: '',
      medication: {
        takes: profile.medicalHistory.currentMedications.length > 0,
        name: profile.medicalHistory.currentMedications.filter(m => confirmedMedIds.includes(m.id)).map(m => m.name).join(', '),
        takenToday: confirmedMedIds.length === profile.medicalHistory.currentMedications.length,
        missedDose: missedDose || (confirmedMedIds.length < profile.medicalHistory.currentMedications.length),
        sideEffects: ''
      }
    };

    try {
      setLogs(prev => [...prev, newLog].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));
      const aiInsight = await getHealthInsight(sysNum, diaNum, pulseNum, profile.medicalHistory, newLog, mas);
      setLastInsight({ ...aiInsight, masScore: mas });
      setActiveStep('view');
      setSystolic(''); setDiastolic(''); setPulse('');
      
      addNotification({
        type: 'info',
        title: 'Signos Registrados',
        message: `Tu presión arterial de ${sysNum}/${diaNum} ha sido analizada exitosamente.`,
      });

      if (aiInsight.status === 'optimal') {
        addNotification({
          type: 'achievement',
          title: '¡Meta Alcanzada!',
          message: 'Tus niveles de presión arterial están en rango óptimo. ¡Sigue así!',
        });
      } else if (aiInsight.status === 'critical') {
        addNotification({
          type: 'alert',
          title: 'Alerta de Salud',
          message: 'Se detectó un nivel crítico. Por favor revisa las recomendaciones inmediatas.',
        });
      }

    } catch (err: any) {
      console.error("Error analyzing:", err);
      const isQuota = err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED') || err?.message?.includes('quota');
      if (isQuota) {
        setIsQuotaError(true);
        setError('Límite de cuota alcanzado. Para continuar con el análisis instantáneo, por favor conecta tu propia API Key.');
      } else {
        setError('Análisis interrumpido. Registro guardado localmente.');
        setActiveStep('view');
      }
    } finally {
      setLoadingInsight(false);
    }
  };

  const getAHAColor = (insight: any, log: VitalLog) => {
    if (insight?.aha_category) {
      const cat = insight.aha_category.toUpperCase();
      if (cat.includes('CRISIS') || cat.includes('HTA GRADO 2')) return 'bg-urgent';
      if (cat.includes('GRADO 1') || cat.includes('ELEVADA')) return 'bg-warning';
      return 'bg-primary';
    }
    if (log.systolic >= 140 || log.diastolic >= 90) return 'bg-urgent';
    if (log.systolic >= 120 || log.diastolic >= 80) return 'bg-warning';
    return 'bg-primary';
  };

  const getRiskTitle = (insight: any) => {
    if (!insight) return 'SIN DATOS';
    const status = insight.status;
    const cat = (insight.aha_category || "").toUpperCase();
    
    if (cat.includes('CRISIS')) return 'RIESGO CRÍTICO';
    if (status === 'critical') return 'RIESGO ALTO';
    if (status === 'warning') return 'RIESGO MEDIO';
    return 'RIESGO BAJO / ÓPTIMO';
  };

  const toggleMedication = (id: string) => {
    setConfirmedMedIds(prev => {
      const isCurrentlySelected = prev.includes(id);
      const newSelection = isCurrentlySelected ? prev.filter(mId => mId !== id) : [...prev, id];
      setMissedDose(newSelection.length < profile.medicalHistory.currentMedications.length);
      return newSelection;
    });
  };

  const handleTookAll = () => {
    setConfirmedMedIds(profile.medicalHistory.currentMedications.map(m => m.id));
    setMissedDose(false);
    setShowManualSelection(false);
    setActiveStep('vitals');
  };

  const handleForgotSome = () => {
    setMissedDose(true);
    setShowManualSelection(true);
  };

  const toggleConsumption = (key: keyof VitalLog['consumptions']) => {
    setConsumptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSymptom = (symptom: VitalLog['symptoms'][number]) => {
    if (symptom === 'none') {
      setSymptoms(['none']);
    } else {
      setSymptoms(prev => {
        const filtered = prev.filter(s => s !== 'none');
        if (filtered.includes(symptom)) {
          const result = filtered.filter(s => s !== symptom);
          return result.length === 0 ? ['none'] : result;
        } else {
          return [...filtered, symptom];
        }
      });
    }
  };

  const handleSaveProfile = () => {
    setProfile(tempProfile);
    setIsEditProfileOpen(false);
    setIsProfileMenuOpen(false);
  };

  const renderChart = () => {
    const data = viewMode === 'weekly' ? logs.slice(-7) : logs.slice(-30);
    if (data.length === 0) return (
      <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-3xl">
        <span className="material-symbols-outlined text-slate-200 text-4xl mb-2">analytics</span>
        <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest text-center">Sin datos registrados</p>
      </div>
    );
    
    const MAX_BP = 200;
    const MIN_BP = 40;
    const WIDTH = 300;
    const HEIGHT = 120;

    const getX = (index: number) => (index / (data.length > 1 ? data.length - 1 : 1)) * WIDTH;
    const getY = (val: number) => HEIGHT - ((val - MIN_BP) / (MAX_BP - MIN_BP)) * HEIGHT;

    const sysPoints = data.map((d, i) => `${getX(i)},${getY(d.systolic)}`).join(' ');
    const diaPoints = data.map((d, i) => `${getX(i)},${getY(d.diastolic)}`).join(' ');

    return (
      <div className="h-40 bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 relative overflow-hidden flex flex-col shadow-inner">
        <div className="flex-1 relative mt-4 mx-6">
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-full overflow-visible">
            <polyline points={sysPoints} fill="none" stroke="#EF4444" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" className="opacity-30" />
            <polyline points={diaPoints} fill="none" stroke="#13ec5b" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" className="opacity-30" />
            {data.map((log, i) => (
              <g key={i}>
                <circle cx={getX(i)} cy={getY(log.systolic)} r="3" className="fill-urgent" />
                <circle cx={getX(i)} cy={getY(log.diastolic)} r="3" className="fill-primary" />
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  const HistoryCard: React.FC<{ log: VitalLog }> = ({ log }) => (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] shadow-sm border border-slate-50 dark:border-slate-800 flex items-center justify-between relative overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${log.systolic >= 140 ? 'bg-urgent' : log.systolic >= 120 ? 'bg-warning' : 'bg-primary'}`}></div>
      <div className="flex-1 ml-2">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black text-deep-blue dark:text-white leading-none tracking-tight">{log.systolic}/{log.diastolic}</span>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">MMHG</span>
        </div>
        <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
          {log.timestamp.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toLowerCase()} • {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-1 justify-end text-[#13ec5b]">
          <span className="material-symbols-outlined text-xl">favorite</span>
          <span className="text-xl font-black leading-none">{log.pulse}</span>
        </div>
        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5 text-right">LPM</p>
      </div>
    </div>
  );

  return (
    <div className="pb-32 bg-slate-50 dark:bg-background-dark min-h-full">
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md px-6 py-4 flex flex-col border-b border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center relative">
          <div 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="cursor-pointer flex items-center gap-2 group"
          >
            <div>
              <div className="flex items-center gap-1">
                <h1 className="text-lg font-black text-deep-blue dark:text-white leading-tight">Hola, {profile.name}</h1>
                <span className={`material-symbols-outlined text-slate-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`}>expand_more</span>
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                <span className={`${bmiStatus.text}`}>IMC {bmi}</span> • {profile.age} años
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button 
               onClick={onOpenNotifications}
               className="size-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700 relative hover:text-primary transition-colors"
             >
               <span className="material-symbols-outlined text-2xl">notifications</span>
               {unreadCount > 0 && (
                 <div className="absolute top-1 right-1 size-4 bg-urgent text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                   {unreadCount}
                 </div>
               )}
             </button>
             <div 
               onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
               className="size-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700 cursor-pointer overflow-hidden"
             >
               <span className="material-symbols-outlined text-2xl font-bold">account_circle</span>
             </div>
          </div>

          {/* Menú Superior Desplegable */}
          {isProfileMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-white/5 py-4 z-[100] animate-fadeIn">
               <button 
                 onClick={() => { setIsEditProfileOpen(true); setIsProfileMenuOpen(false); }}
                 className="w-full px-6 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
               >
                 <span className="material-symbols-outlined text-primary">person_edit</span>
                 <span className="text-xs font-black uppercase text-slate-600 dark:text-white">Editar Perfil</span>
               </button>
               <button 
                 onClick={() => navigate('/medical-history')}
                 className="w-full px-6 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
               >
                 <span className="material-symbols-outlined text-blue-400">clinical_notes</span>
                 <span className="text-xs font-black uppercase text-slate-600 dark:text-white">Historia Clínica</span>
               </button>
               <button 
                 onClick={() => navigate('/subscription')}
                 className="w-full px-6 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
               >
                 <span className="material-symbols-outlined text-amber-500">workspace_premium</span>
                 <span className="text-xs font-black uppercase text-slate-600 dark:text-white">Mi Plan Premium</span>
               </button>
               <div className="mx-6 my-2 border-t border-slate-100 dark:border-white/5"></div>
               <button 
                 onClick={() => navigate('/')}
                 className="w-full px-6 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-urgent"
               >
                 <span className="material-symbols-outlined">logout</span>
                 <span className="text-xs font-black uppercase">Cerrar Sesión</span>
               </button>
            </div>
          )}
        </div>
      </header>

      {/* Modal de Edición de Perfil */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-[200] bg-white dark:bg-background-dark flex flex-col animate-fadeIn">
          <header className="p-6 flex items-center justify-between border-b sticky top-0 bg-white dark:bg-background-dark z-10">
            <h2 className="text-lg font-black text-deep-blue dark:text-white uppercase tracking-widest">Editar Perfil</h2>
            <button onClick={() => setIsEditProfileOpen(false)} className="size-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-full">
              <span className="material-symbols-outlined font-black">close</span>
            </button>
          </header>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
            <section className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Datos Personales</p>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={tempProfile.name}
                    onChange={e => setTempProfile({...tempProfile, name: e.target.value})}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-none font-bold outline-none ring-2 ring-transparent focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Ocupación</label>
                  <input 
                    type="text" 
                    value={tempProfile.occupation}
                    onChange={e => setTempProfile({...tempProfile, occupation: e.target.value})}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-none font-bold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Ciudad de Residencia</label>
                  <input 
                    type="text" 
                    value={tempProfile.residence}
                    onChange={e => setTempProfile({...tempProfile, residence: e.target.value})}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-none font-bold outline-none"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Medidas Biométricas</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Edad</label>
                  <input 
                    type="number" 
                    value={tempProfile.age}
                    onChange={e => setTempProfile({...tempProfile, age: parseInt(e.target.value) || 0})}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-none font-bold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Sexo</label>
                  <select 
                    value={tempProfile.gender}
                    onChange={e => setTempProfile({...tempProfile, gender: e.target.value as any})}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-none font-bold outline-none"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Peso (kg)</label>
                  <input 
                    type="number" 
                    value={tempProfile.weight}
                    onChange={e => setTempProfile({...tempProfile, weight: parseInt(e.target.value) || 0})}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-none font-bold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Altura (cm)</label>
                  <input 
                    type="number" 
                    value={tempProfile.height}
                    onChange={e => setTempProfile({...tempProfile, height: parseInt(e.target.value) || 0})}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-none font-bold outline-none"
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-6 bg-white dark:bg-background-dark border-t border-slate-100 dark:border-white/5">
            <button 
              onClick={handleSaveProfile}
              className="w-full bg-primary text-deep-blue font-black py-5 rounded-[2rem] shadow-xl text-sm uppercase tracking-widest active:scale-95 transition-all"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      )}

      <div className="p-5 space-y-6">
        {activeStep === 'view' && !loadingInsight && (
          <>
            {error && !isQuotaError && <div className="p-4 bg-amber-50 text-amber-700 text-[10px] font-black rounded-2xl border border-amber-100 animate-fadeIn text-center uppercase tracking-widest">{error}</div>}
            
            {isQuotaError && (
              <div className="bg-white p-6 rounded-[2rem] border-2 border-urgent/20 shadow-xl space-y-4 animate-fadeIn">
                <div className="flex items-center gap-3 text-urgent">
                  <span className="material-symbols-outlined font-black">lock_clock</span>
                  <p className="text-[11px] font-black uppercase tracking-widest">Saturación de Cuota Global</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {error}
                </p>
                <button 
                  onClick={handleOpenKeySelector}
                  className="w-full bg-deep-blue text-white font-black py-4 rounded-xl text-[11px] uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">key</span>
                  CONECTAR MI API KEY (PAGADA)
                </button>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="block text-center text-[9px] font-bold text-slate-400 underline uppercase tracking-widest">Documentación de Facturación GCP</a>
              </div>
            )}

            {lastInsight && lastLog ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-xl border border-primary/10">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-primary">{getRiskTitle(lastInsight)}</h4>
                    <span className="text-2xl font-black text-deep-blue dark:text-white">{lastLog.systolic}/{lastLog.diastolic} <span className="text-xs text-slate-400 font-bold">mmHg</span></span>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                      <span className="text-primary">ÓPTIMA</span>
                      <span className="text-warning">ELEVADA</span>
                      <span className="text-warning">G1</span>
                      <span className="text-urgent">G2</span>
                      <span className="text-urgent font-black underline">CRISIS</span>
                    </div>
                    <div className="h-5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative border border-slate-200/50">
                      <div className={`h-full transition-all duration-1000 ${getAHAColor(lastInsight, lastLog)} shadow-[0_0_10px_rgba(19,236,91,0.3)]`} style={{ width: `${Math.min(100, (lastLog.systolic / 200) * 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between mt-3 px-1">
                       <div className="text-center">
                          <p className="text-[8px] font-black text-slate-400 uppercase">Diagnóstico AHA</p>
                          <p className={`text-[12px] font-black uppercase ${getAHAColor(lastInsight, lastLog).replace('bg-', 'text-')}`}>
                            {lastInsight.aha_category || 'ANALIZANDO...'}
                          </p>
                       </div>
                       <div className="text-center">
                          <p className="text-[8px] font-black text-slate-400 uppercase">Meta MAS</p>
                          <p className={`text-[12px] font-black ${lastInsight.masScore >= 80 ? 'text-primary' : 'text-warning'}`}>
                            {lastInsight.masScore}% CUMPLIDO
                          </p>
                       </div>
                    </div>
                  </div>
                </div>

                <div className={`p-8 rounded-[3rem] shadow-2xl relative overflow-hidden transition-all duration-500 border-4 ${
                  lastInsight.status === 'critical' ? 'bg-urgent text-white border-white/20' : 
                  lastInsight.status === 'warning' ? 'bg-warning text-deep-blue border-deep-blue/5' : 
                  'bg-primary text-deep-blue border-white/20'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined font-black">shield_with_heart</span>
                    <h3 className="text-xl font-black uppercase leading-tight">
                      Correlación de Riesgo
                    </h3>
                  </div>
                  <p className="text-sm opacity-90 leading-relaxed italic mb-6 font-medium">"{lastInsight.message}"</p>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Recomendaciones Inmediatas:</p>
                    {lastInsight.recommendations.map((r: string, i: number) => (
                      <div key={i} className="flex gap-3 items-start p-3 bg-white/20 rounded-xl border border-white/20 backdrop-blur-sm">
                        <span className="material-symbols-outlined text-sm shrink-0">check_circle</span>
                        <span className="text-xs font-bold leading-tight">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {lastInsight.cellularNutrition && (
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-xl border-l-8 border-primary animate-fadeIn">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="material-symbols-outlined text-primary text-2xl">eco</span>
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Apoyo Celular Específico</h4>
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 italic">
                      "Para contrarrestar tu estado actual, prioriza: {lastInsight.cellularNutrition}"
                    </p>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <button onClick={() => navigate('/nutrition')} className="w-full bg-deep-blue text-white font-black py-6 rounded-full shadow-lg text-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
                    <span className="material-symbols-outlined">restaurant</span> IR A MI PLAN NUTRICIONAL
                  </button>
                  
                  {(lastInsight.status !== 'optimal' || lastInsight.triggerUrgentConsult) && (
                    <button 
                      onClick={() => navigate('/triage')} 
                      className="w-full bg-urgent text-white font-black py-6 rounded-full shadow-xl text-base flex items-center justify-center gap-3 animate-pulse active:scale-95 transition-all border-2 border-white/30"
                    >
                      <span className="material-symbols-outlined text-2xl font-black">medical_services</span>
                      <p className="text-sm font-black uppercase">CONSULTAR MÉDICO AHORA</p>
                    </button>
                  )}

                  <button onClick={startNewRegistration} className="w-full bg-primary/10 text-primary border-2 border-primary/20 font-black py-5 rounded-full text-sm flex items-center justify-center gap-3 active:scale-95 transition-all">
                    <span className="material-symbols-outlined">add_circle</span> NUEVO REGISTRO DE SIGNOS
                  </button>
                </div>
              </div>
            ) : (
              <>
                <section className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-xl border border-white dark:border-slate-800">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Tendencias de la Semana</h3>
                  </div>
                  {renderChart()}
                </section>
                <button onClick={startNewRegistration} className="w-full bg-primary text-deep-blue font-black py-6 rounded-3xl shadow-2xl text-lg flex items-center justify-center gap-4 active:scale-95 transition-all">
                  <span className="material-symbols-outlined font-black">add_box</span> NUEVO REGISTRO
                </button>
              </>
            )}

            <section className="space-y-4 pt-4 pb-10">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-slate-400">Tus Últimos Registros</h3>
                <button onClick={() => setIsHistoryModalOpen(true)} className="text-[11px] font-black text-primary uppercase">HISTORIAL</button>
              </div>
              <div className="space-y-3">
                {logs.length > 0 ? (
                  [...logs].reverse().slice(0, 3).map((log, idx) => <HistoryCard key={idx} log={log} />)
                ) : (
                  <p className="text-center py-10 text-xs text-slate-400 italic">No hay registros aún</p>
                )}
              </div>
            </section>
          </>
        )}

        {activeStep === 'medCheck' && (
          <section className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-primary animate-fadeIn">
            <h2 className="text-2xl font-black text-deep-blue uppercase text-center mb-6">Medicación Hoy</h2>
            <div className="grid grid-cols-1 gap-4 mb-8">
              <button onClick={handleTookAll} className="w-full h-20 bg-primary/10 border-2 border-primary rounded-[1.5rem] flex items-center justify-between px-6 transition-all active:scale-95 group">
                <div className="text-left">
                  <p className="text-deep-blue font-black text-sm uppercase">Toda mi medicación</p>
                  <p className="text-primary-dark text-[10px] font-bold">Tomé mi dosis a tiempo</p>
                </div>
                <span className="material-symbols-outlined text-primary text-3xl font-black">done_all</span>
              </button>
              <button onClick={handleForgotSome} className={`w-full h-20 border-2 rounded-[1.5rem] flex items-center justify-between px-6 transition-all active:scale-95 ${showManualSelection ? 'bg-urgent/10 border-urgent' : 'bg-slate-50 border-slate-100'}`}>
                <div className="text-left">
                  <p className={`${showManualSelection ? 'text-urgent' : 'text-slate-500'} font-black text-sm uppercase`}>Olvidé alguna dosis</p>
                  <p className="text-slate-400 text-[10px] font-bold">Seleccionar manualmente</p>
                </div>
                <span className={`material-symbols-outlined ${showManualSelection ? 'text-urgent' : 'text-slate-300'} text-3xl`}>history_toggle_off</span>
              </button>
            </div>
            {showManualSelection && (
              <div className="space-y-3 mb-8 animate-fadeIn">
                {profile.medicalHistory.currentMedications.map(med => (
                  <button key={med.id} onClick={() => toggleMedication(med.id)} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${confirmedMedIds.includes(med.id) ? 'bg-primary/10 border-primary text-primary-dark' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                    <div className="text-left"><p className="text-xs font-black uppercase">{med.name}</p></div>
                    <span className="material-symbols-outlined">{confirmedMedIds.includes(med.id) ? 'check_circle' : 'radio_button_unchecked'}</span>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setActiveStep('vitals')} className={`w-full bg-primary text-deep-blue font-black py-6 rounded-3xl text-lg flex items-center justify-center gap-3 transition-all ${showManualSelection ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
              CONTINUAR AL REGISTRO
            </button>
          </section>
        )}

        {activeStep === 'vitals' && (
          <section className="bg-white p-6 rounded-[3rem] shadow-2xl border border-white animate-fadeIn space-y-8 pb-10">
            <h2 className="font-black text-deep-blue uppercase text-xl mb-4 text-center">Toma de Signos</h2>
            
            <div className="flex flex-col px-1">
              <label className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Fecha y Hora de la toma</label>
              <input 
                type="datetime-local" 
                value={timestamp} 
                onChange={(e) => setTimestamp(e.target.value)}
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-deep-blue outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <VitalInput label="Sístole *" value={systolic} onChange={setSystolic} placeholder="120" color="border-primary" />
              <VitalInput label="Diástole *" value={diastolic} onChange={setDiastolic} placeholder="80" color="border-primary" />
              <VitalInput label="Pulso *" value={pulse} onChange={setPulse} placeholder="72" color="border-primary" />
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Estado Físico Actual</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'resting', label: 'Reposo Total', icon: 'airline_seat_recline_normal' },
                  { id: 'walking', label: 'Caminando', icon: 'directions_walk' },
                  { id: 'exercise', label: 'Post-Ejercicio', icon: 'fitness_center' },
                  { id: 'stress', label: 'Estrés/Ansiedad', icon: 'psychology' },
                  { id: 'just_ate', label: 'Post-Comida', icon: 'restaurant' },
                  { id: 'lying', label: 'Acostado', icon: 'bed' }
                ].map(state => (
                  <button 
                    key={state.id}
                    onClick={() => setPhysicalState(state.id as any)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${physicalState === state.id ? 'bg-primary/10 border-primary text-primary-dark' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                  >
                    <span className="material-symbols-outlined text-lg">{state.icon}</span>
                    <span className="text-[10px] font-black uppercase">{state.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Descanso y Sueño</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input 
                    type="number" 
                    value={sleepHours} 
                    onChange={(e) => setSleepHours(e.target.value)}
                    className="w-full text-center text-xl font-black py-4 bg-slate-50 border-b-4 border-primary rounded-2xl outline-none"
                    placeholder="Hrs"
                  />
                  <p className="text-[8px] font-black text-center mt-1 uppercase text-slate-400">Horas</p>
                </div>
                <div className="flex-[2] flex gap-2">
                  <button 
                    onClick={() => setSleepQuality(true)}
                    className={`flex-1 flex flex-col items-center justify-center rounded-2xl border-2 transition-all ${sleepQuality ? 'bg-primary/20 border-primary text-primary-dark' : 'bg-slate-50 border-slate-100 text-slate-300'}`}
                  >
                    <span className="material-symbols-outlined text-xl">verified</span>
                    <span className="text-[9px] font-black uppercase">Descansé</span>
                  </button>
                  <button 
                    onClick={() => setSleepQuality(false)}
                    className={`flex-1 flex flex-col items-center justify-center rounded-2xl border-2 transition-all ${!sleepQuality ? 'bg-urgent/20 border-urgent text-urgent' : 'bg-slate-50 border-slate-100 text-slate-300'}`}
                  >
                    <span className="material-symbols-outlined text-xl">block</span>
                    <span className="text-[9px] font-black uppercase text-center">No Descansé</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Hábitos Recientes</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'coffee', label: 'Cafeína', icon: 'coffee' },
                  { id: 'alcohol', label: 'Alcohol', icon: 'wine_bar' },
                  { id: 'salt', label: 'Sal Extra', icon: 'salt' },
                  { id: 'smoking', label: 'Tabaco', icon: 'smoking_rooms' },
                  { id: 'fried_foods', label: 'Grasas', icon: 'fastfood' },
                  { id: 'sugar', label: 'Azúcar', icon: 'cookie' }
                ].map(item => (
                  <button 
                    key={item.id}
                    onClick={() => toggleConsumption(item.id as any)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${consumptions[item.id as keyof VitalLog['consumptions']] ? 'bg-urgent/10 border-urgent text-urgent' : 'bg-slate-50 border-slate-100 text-slate-300'}`}
                  >
                    <span className="material-symbols-outlined text-xl">{item.icon.toLowerCase()}</span>
                    {item.id !== 'salt' && <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">¿Cómo te sientes hoy?</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'none', label: 'SIN SÍNTOMAS', icon: 'check_circle' },
                  { id: 'headache', label: 'DOLOR CABEZA', icon: 'mood_bad' },
                  { id: 'dizziness', label: 'MAREOS', icon: 'cached' },
                  { id: 'chest_pain', label: 'DOLOR PECHO', icon: 'heart_broken' },
                  { id: 'shortness_breath', label: 'FALTA AIRE', icon: 'air' },
                  { id: 'blurred_vision', label: 'VISIÓN BORROSA', icon: 'visibility_off' }
                ].map(sym => {
                  const isSelected = symptoms.includes(sym.id as any);
                  const activeClass = sym.id === 'none' 
                    ? 'bg-primary text-deep-blue border-primary' 
                    : 'bg-urgent text-white border-urgent';
                  
                  return (
                    <button 
                      key={sym.id}
                      onClick={() => toggleSymptom(sym.id as any)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${isSelected ? activeClass : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                    >
                      <span className="material-symbols-outlined text-xl">{sym.icon.toLowerCase()}</span>
                      <span className="text-[9px] font-black uppercase text-center leading-tight">{sym.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {isQuotaError ? (
              <button 
                onClick={handleOpenKeySelector}
                className="w-full bg-urgent text-white font-black h-[72px] rounded-full shadow-2xl uppercase tracking-widest transition-all flex items-center justify-center gap-3 px-6 hover:brightness-105"
              >
                <span className="material-symbols-outlined font-black">vpn_key</span>
                <span className="truncate">CONECTAR API KEY (CUOTA AGOTADA)</span>
              </button>
            ) : (
              <button 
                onClick={handleSaveLog} 
                disabled={loadingInsight}
                className="w-full bg-primary text-deep-blue font-black h-[72px] rounded-full shadow-2xl uppercase tracking-widest transition-all flex items-center justify-center gap-3 px-6 hover:brightness-105 disabled:opacity-50"
              >
                <span className={`material-symbols-outlined font-black ${loadingInsight ? 'animate-spin' : ''}`}>
                  {loadingInsight ? 'query_stats' : 'clinical_notes'}
                </span>
                <span className="truncate">
                  {loadingInsight ? 'GENERANDO PERFIL CLÍNICO...' : 'GUARDAR Y ANALIZAR SIGNOS'}
                </span>
              </button>
            )}
          </section>
        )}

        {loadingInsight && (
           <div className="bg-deep-blue/5 p-8 rounded-[3rem] border-2 border-dashed border-primary/20 flex flex-col items-center text-center gap-4 animate-pulse mt-4">
              <div className="p-4 bg-primary/10 rounded-full animate-spin"><span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span></div>
              <p className="text-xs font-black uppercase tracking-widest text-primary">EstABLEciendo correlaciones celulares...</p>
           </div>
        )}
      </div>

      {isHistoryModalOpen && (
          <div className="fixed inset-0 z-[100] bg-white dark:bg-background-dark flex flex-col animate-fadeIn">
            <header className="p-6 flex items-center justify-between border-b">
              <h2 className="text-lg font-black text-deep-blue dark:text-white uppercase tracking-widest">Historial Médico</h2>
              <button onClick={() => setIsHistoryModalOpen(false)} className="size-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-full">
                <span className="material-symbols-outlined font-black">close</span>
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {[...logs].reverse().map((log, idx) => <HistoryCard key={idx} log={log} />)}
            </div>
          </div>
      )}
    </div>
  );
};

const VitalInput: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder: string; color: string }> = ({ label, value, onChange, placeholder, color }) => (
  <div className="text-center group">
    <label className="block text-[10px] text-slate-400 mb-2 uppercase tracking-[0.2em] font-black">{label}</label>
    <input className={`w-full text-center text-2xl font-black py-5 bg-slate-50 border-b-4 ${color} rounded-2xl outline-none focus:bg-white transition-all`} placeholder={placeholder} type="number" value={value} onChange={e => onChange(e.target.value)} />
  </div>
);

export default DashboardPage;
