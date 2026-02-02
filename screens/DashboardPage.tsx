import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, VitalLog } from '../types';
import { getHealthInsight } from '../services/geminiService';

interface Props {
  profile: UserProfile;
  logs: VitalLog[];
  setLogs: React.Dispatch<React.SetStateAction<VitalLog[]>>;
  lastInsight: any | null;
  setLastInsight: React.Dispatch<React.SetStateAction<any | null>>;
}

const DashboardPage: React.FC<Props> = ({ profile, logs, setLogs, lastInsight, setLastInsight }) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<'view' | 'medCheck' | 'vitals'>('view');
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [confirmedMedIds, setConfirmedMedIds] = useState<string[]>([]);
  const [missedDose, setMissedDose] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [showManualSelection, setShowManualSelection] = useState(false);

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

  const lastLog = logs[logs.length - 1];
  
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

  const handleSaveLog = async () => {
    if (!systolic || !diastolic || !pulse) {
      setError('Por favor complete todos los campos obligatorios (*)');
      return;
    }
    setError('');
    setLoadingInsight(true);
    const sysNum = parseInt(systolic);
    const mas = calculateMAS(sysNum);

    const newLog: VitalLog = {
      systolic: sysNum,
      diastolic: parseInt(diastolic),
      pulse: parseInt(pulse),
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

    setLogs(prev => [...prev, newLog].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));
    setSystolic(''); setDiastolic(''); setPulse('');
    setActiveStep('view');
    
    try {
      const aiInsight = await getHealthInsight(newLog.systolic, newLog.diastolic, newLog.pulse, profile.medicalHistory, newLog, mas);
      setLastInsight(aiInsight);
    } catch (err) {
      setError('Error en el análisis de IA. Por favor reintente.');
    } finally {
      setLoadingInsight(false);
    }
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

  const renderChart = (compact = false) => {
    const data = viewMode === 'weekly' ? logs.slice(-7) : logs.slice(-30);
    if (data.length === 0) return (
      <div className={`${compact ? 'h-32' : 'h-40'} flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-3xl`}>
        <span className="material-symbols-outlined text-slate-200 text-4xl mb-2">analytics</span>
        <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest text-center">Sin datos registrados</p>
      </div>
    );
    
    const MAX_BP = 200;
    const MIN_BP = 40;
    const RANGE = MAX_BP - MIN_BP;
    const WIDTH = 300;
    const HEIGHT = 120;

    const getX = (index: number) => (index / (data.length > 1 ? data.length - 1 : 1)) * WIDTH;
    const getY = (val: number) => HEIGHT - ((val - MIN_BP) / RANGE) * HEIGHT;

    const sysPoints = data.map((d, i) => `${getX(i)},${getY(d.systolic)}`).join(' ');
    const diaPoints = data.map((d, i) => `${getX(i)},${getY(d.diastolic)}`).join(' ');

    return (
      <div className={`${compact ? 'h-40' : 'h-60'} bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 relative overflow-hidden flex flex-col shadow-inner`}>
        <div className="flex-1 relative mt-4 mx-6">
          {[180, 140, 120, 80].map(val => (
            <div key={val} className="absolute inset-x-0 border-t border-slate-100 dark:border-white/5 flex items-center" style={{ top: `${((MAX_BP - val) / (MAX_BP - MIN_BP)) * 100}%` }}>
              <span className="absolute -left-6 text-[8px] font-bold text-slate-300">{val}</span>
            </div>
          ))}

          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-full overflow-visible">
            <polyline points={sysPoints} fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className="opacity-40" />
            <polyline points={diaPoints} fill="none" stroke="#13ec5b" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className="opacity-40" />
            {data.map((log, i) => (
              <g key={i}>
                <circle cx={getX(i)} cy={getY(log.systolic)} r="3.5" className={log.systolic >= 140 ? 'fill-urgent' : log.systolic >= 120 ? 'fill-warning' : 'fill-primary'} />
                <circle cx={getX(i)} cy={getY(log.diastolic)} r="3.5" className={log.diastolic >= 90 ? 'fill-urgent' : log.diastolic >= 80 ? 'fill-warning' : 'fill-primary'} />
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  const HistoryCard: React.FC<{ log: VitalLog }> = ({ log }) => (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] shadow-sm border border-slate-50 dark:border-slate-800 flex items-center justify-between relative overflow-hidden transition-all">
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
        log.systolic >= 140 || log.diastolic >= 90 ? 'bg-urgent' : 
        log.systolic >= 120 || log.diastolic >= 80 ? 'bg-warning' : 
        'bg-primary'
      }`}></div>
      <div className="flex-1 ml-2">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black text-deep-blue dark:text-white leading-none tracking-tight">
            {log.systolic}/{log.diastolic}
          </span>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">MMHG</span>
        </div>
        <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
          {log.timestamp.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toLowerCase()} • {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-1 justify-end text-[#13ec5b]">
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 600" }}>favorite</span>
          <span className="text-xl font-black leading-none">{log.pulse}</span>
        </div>
        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5 text-right">LPM</p>
      </div>
    </div>
  );

  const systolicPercent = lastLog ? Math.min(100, (lastLog.systolic / 200) * 100) : 0;

  return (
    <div className="pb-32 bg-slate-50 dark:bg-background-dark min-h-full">
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md px-6 py-4 flex flex-col border-b border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-black text-deep-blue dark:text-white leading-tight">Hola, {profile.name}</h1>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <span className={`${bmiStatus.text} transition-colors`}>IMC {bmi}</span> • {profile.age} años
            </span>
          </div>
          <div className={`p-2 ${bmiStatus.bg} rounded-xl ${bmiStatus.icon} transition-all duration-500`}>
            <span className="material-symbols-outlined text-2xl font-bold">monitoring</span>
          </div>
        </div>
      </header>

      <div className="p-5 space-y-6">
        {activeStep === 'view' && !loadingInsight && (
          <>
            {lastInsight && lastLog ? (
              <div className="space-y-4 animate-fadeIn">
                {/* Análisis de Riesgo AHA */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-xl border border-primary/10">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Análisis AHA/ACC 2025</h4>
                    <span className="text-2xl font-black text-deep-blue dark:text-white">{lastLog.systolic}/{lastLog.diastolic} <span className="text-xs text-slate-400 font-bold">mmHg</span></span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                      <span>Normal</span>
                      <span>Elevada</span>
                      <span>HTA G1</span>
                      <span>HTA G2</span>
                    </div>
                    <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative border border-slate-200/50 dark:border-white/5">
                      {/* Fixed typo: changed systPercent to systolicPercent */}
                      <div className={`h-full transition-all duration-1000 ${lastLog.systolic >= 140 ? 'bg-urgent' : lastLog.systolic >= 120 ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${systolicPercent}%` }}></div>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 text-center italic mt-2">Meta: Menos de 120/80 mmHg</p>
                  </div>
                </div>

                <section className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-xl border border-white dark:border-slate-800">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Tendencia de Presión</h3>
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                      <button onClick={() => setViewMode('weekly')} className={`px-3 py-1 text-[9px] font-black rounded-md ${viewMode === 'weekly' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400'}`}>7D</button>
                      <button onClick={() => setViewMode('monthly')} className={`px-3 py-1 text-[9px] font-black rounded-md ${viewMode === 'monthly' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400'}`}>30D</button>
                    </div>
                  </div>
                  {renderChart(true)}
                </section>

                <div className={`p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden ${lastInsight.status === 'critical' ? 'bg-urgent' : lastInsight.status === 'warning' ? 'bg-amber-600' : 'bg-deep-blue'}`}>
                  <h3 className="text-xl font-black mb-2 uppercase leading-tight">{lastInsight.status === 'critical' ? 'Riesgo Crítico Detectado' : lastInsight.status === 'warning' ? 'Presión Arterial Elevada' : 'Estado Óptimo'}</h3>
                  <p className="text-sm opacity-90 leading-relaxed italic mb-6">"{lastInsight.message}"</p>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Acciones Recomendadas:</p>
                    {lastInsight.recommendations.map((r: string, i: number) => (
                      <div key={i} className="flex gap-3 items-start p-3 bg-white/10 rounded-xl border border-white/10">
                        <span className="material-symbols-outlined text-sm shrink-0">check_circle</span>
                        <span className="text-xs opacity-95">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan de Nutrición Celular Hoy */}
                {lastInsight.cellularNutrition && (
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-xl border-l-8 border-primary animate-fadeIn">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="material-symbols-outlined text-primary text-2xl">eco</span>
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Plan Nutricional Celular Hoy</h4>
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed italic">
                      {lastInsight.cellularNutrition}
                    </p>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <button onClick={() => navigate('/nutrition')} className="w-full bg-deep-blue text-white font-black py-6 rounded-full shadow-lg text-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
                    <span className="material-symbols-outlined">restaurant</span> IR A PLAN DE NUTRICIÓN
                  </button>
                  <button onClick={startNewRegistration} className="w-full bg-primary text-deep-blue font-black py-6 rounded-full shadow-lg text-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
                    <span className="material-symbols-outlined">add_circle</span> NUEVO REGISTRO
                  </button>
                  <button onClick={() => navigate('/triage')} className="w-full bg-urgent text-white font-black py-6 rounded-full shadow-2xl flex items-center justify-center gap-3 text-sm animate-pulse active:scale-95 transition-all">
                    <span className="material-symbols-outlined">medical_services</span> SOLICITAR CONSULTA MÉDICA ONLINE
                  </button>
                </div>
              </div>
            ) : (
              <>
                <section className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-xl border border-white dark:border-slate-800">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Historial Tendencias</h3>
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
                <h3 onClick={() => setIsHistoryModalOpen(true)} className="text-[13px] font-black uppercase tracking-[0.2em] text-[#0a1a2f]/60 dark:text-white/60 cursor-pointer">Historial Completo</h3>
                <button onClick={() => setIsHistoryModalOpen(true)} className="text-[11px] font-black text-primary uppercase tracking-[0.1em]">VER TODO</button>
              </div>
              <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1 hide-scrollbar ios-shadow rounded-[2rem]">
                {logs.length > 0 ? (
                  [...logs].reverse().map((log, idx) => <HistoryCard key={idx} log={log} />)
                ) : (
                  <p className="text-center py-10 text-xs text-slate-400 font-bold uppercase tracking-widest">Sin registros aún</p>
                )}
              </div>
            </section>
          </>
        )}

        {loadingInsight && (
           <div className="bg-deep-blue/5 p-8 rounded-[3rem] border-2 border-dashed border-primary/20 flex flex-col items-center text-center gap-4 animate-pulse">
              <div className="p-4 bg-primary/10 rounded-full animate-spin"><span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span></div>
              <p className="text-xs font-black uppercase tracking-widest text-primary">Analizando balance celular...</p>
           </div>
        )}

        {isHistoryModalOpen && (
          <div className="fixed inset-0 z-[100] bg-white dark:bg-background-dark flex flex-col animate-fadeIn">
            <header className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-black text-deep-blue dark:text-white uppercase tracking-widest">Historial de Signos</h2>
              <button onClick={() => setIsHistoryModalOpen(false)} className="size-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-full active:scale-90 transition-all">
                <span className="material-symbols-outlined font-black">close</span>
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-background-dark">
              {[...logs].reverse().map((log, idx) => <HistoryCard key={idx} log={log} />)}
            </div>
          </div>
        )}

        {activeStep === 'medCheck' && (
          <section className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-primary animate-fadeIn overflow-hidden">
            <h2 className="text-2xl font-black text-deep-blue uppercase text-center mb-6 tracking-tighter">Medicación Hoy</h2>
            <div className="grid grid-cols-1 gap-4 mb-8">
              <button onClick={handleTookAll} className="w-full h-20 bg-primary/10 border-2 border-primary rounded-[1.5rem] flex items-center justify-between px-6 transition-all active:scale-95 group">
                <div className="text-left">
                  <p className="text-deep-blue font-black text-sm uppercase">Toda mi medicación</p>
                  <p className="text-primary-dark text-[10px] font-bold">Tomé mis dosis a tiempo</p>
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
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1">Selecciona lo que SI tomaste hoy:</p>
                {profile.medicalHistory.currentMedications.map(med => (
                  <button key={med.id} onClick={() => toggleMedication(med.id)} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${confirmedMedIds.includes(med.id) ? 'bg-primary/10 border-primary text-primary-dark' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                    <div className="text-left"><p className="text-xs font-black uppercase">{med.name}</p><p className="text-[10px] opacity-70">{med.dose} • {med.time}</p></div>
                    <span className="material-symbols-outlined">{confirmedMedIds.includes(med.id) ? 'check_circle' : 'radio_button_unchecked'}</span>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setActiveStep('vitals')} className={`w-full bg-primary text-deep-blue font-black py-6 rounded-3xl text-lg flex items-center justify-center gap-3 shadow-xl transition-all ${showManualSelection ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
              CONFIRMAR Y CONTINUAR
            </button>
          </section>
        )}

        {activeStep === 'vitals' && (
          <section className="bg-white p-6 rounded-[3rem] shadow-2xl border border-white animate-fadeIn space-y-8">
            <h2 className="font-black text-deep-blue uppercase text-xl mb-4 text-center">Registro de Signos</h2>
            
            {/* Fecha para registro previo */}
            <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Fecha y Hora de la Toma</label>
               <input 
                 type="datetime-local" 
                 value={timestamp}
                 onChange={e => setTimestamp(e.target.value)}
                 className="w-full bg-white border-none rounded-xl p-3 text-center font-black text-deep-blue"
               />
               <p className="text-[9px] text-slate-300 text-center font-bold">Permite registrar lecturas pasadas</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <VitalInput label="Sístole *" value={systolic} onChange={setSystolic} placeholder="120" color="border-primary" />
              <VitalInput label="Diástole *" value={diastolic} onChange={setDiastolic} placeholder="80" color="border-primary" />
              <VitalInput label="Pulso *" value={pulse} onChange={setPulse} placeholder="72" color="border-primary" />
            </div>

            <div className="space-y-4">
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">¿Cómo se realizó la toma?</p>
               <div className="grid grid-cols-2 gap-2">
                 {[
                   { id: 'resting', label: 'Reposo', icon: 'airline_seat_recline_normal' },
                   { id: 'walking', label: 'Caminando', icon: 'directions_walk' },
                   { id: 'exercise', label: 'Ejercicio', icon: 'fitness_center' },
                   { id: 'stress', label: 'Estrés', icon: 'psychology' },
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

            <div className="space-y-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Descanso previo</p>
               <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-[10px] font-bold text-slate-400">Horas de sueño</span>
                    <input type="number" value={sleepHours} onChange={e => setSleepHours(e.target.value)} className="w-full bg-white border-none rounded-xl p-2 text-center font-black text-deep-blue" />
                  </div>
                  <button 
                    onClick={() => setSleepQuality(!sleepQuality)}
                    className={`flex-1 h-14 rounded-xl flex flex-col items-center justify-center border-2 transition-all ${
                      sleepQuality ? 'bg-primary/10 border-primary text-primary-dark' : 'bg-urgent/10 border-urgent text-urgent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">{sleepQuality ? 'verified' : 'hotel_class'}</span>
                    <span className="text-[8px] font-black uppercase">{sleepQuality ? 'Bien Descansado' : 'No Descansado'}</span>
                  </button>
               </div>
            </div>

            {/* Hábitos últimas 6h */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Hábitos últimas 6h</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'coffee', label: 'Café', icon: 'coffee' },
                  { id: 'alcohol', label: 'Alcohol', icon: 'wine_bar' },
                  { id: 'salt', label: 'Exceso Sal', icon: 'rebase_edit' },
                  { id: 'smoking', label: 'Tabaco', icon: 'smoking_rooms' },
                  { id: 'fried_foods', label: 'Fritos', icon: 'fastfood' },
                  { id: 'sugar', label: 'Dulces', icon: 'icecream' }
                ].map(item => (
                  <button 
                    key={item.id}
                    onClick={() => toggleConsumption(item.id as any)}
                    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-2 transition-all h-20 ${consumptions[item.id as keyof VitalLog['consumptions']] ? 'bg-primary/10 border-primary text-primary-dark' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                  >
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                    <span className="text-[8px] font-black uppercase">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Síntomas de alarma */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">¿Cómo te sientes hoy? (Signos de Alarma)</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'headache', label: 'Dolor de Cabeza', icon: 'headset_off' },
                  { id: 'dizziness', label: 'Mareos', icon: 'sync' },
                  { id: 'chest_pain', label: 'Dolor Pecho', icon: 'heart_broken' },
                  { id: 'shortness_breath', label: 'Falta Aire', icon: 'air' },
                  { id: 'blurred_vision', label: 'Visión Borrosa', icon: 'visibility_off' },
                  { id: 'none', label: 'Todo Bien', icon: 'sentiment_very_satisfied' }
                ].map(s => {
                  const isSelected = symptoms.includes(s.id as any);
                  const selectedClass = s.id === 'none' 
                    ? 'bg-primary/10 border-primary text-primary-dark' 
                    : 'bg-urgent/10 border-urgent text-urgent';
                  
                  return (
                    <button 
                      key={s.id}
                      onClick={() => toggleSymptom(s.id as any)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        isSelected ? selectedClass : 'bg-slate-50 border-slate-100 text-slate-400'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{s.icon}</span>
                      <span className="text-[9px] font-black uppercase text-left leading-tight">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <div className="p-4 bg-red-50 text-red-600 text-xs font-black rounded-2xl border border-red-100 animate-bounce text-center">{error}</div>}

            {/* BOTÓN PRINCIPAL REFINADO Y CENTRADO */}
            <div className="pt-2">
              <button 
                onClick={handleSaveLog} 
                className="w-full bg-primary text-deep-blue font-black h-[72px] rounded-full shadow-2xl uppercase tracking-widest active:scale-[0.97] transition-all flex items-center justify-center gap-3 px-6 group"
              >
                <span className="material-symbols-outlined text-[32px] font-black shrink-0" style={{ fontVariationSettings: "'FILL' 0, 'wght' 700" }}>bar_chart</span>
                <span className="text-base leading-tight">GUARDAR Y ANALIZAR MI ESTADO</span>
              </button>
            </div>
          </section>
        )}
      </div>
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