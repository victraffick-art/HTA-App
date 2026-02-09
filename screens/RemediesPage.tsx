
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { NaturalRemedies, VitalLog, UserProfile, AppNotification } from '../types';
import { getRemedyAdvice } from '../services/geminiService';

interface Props {
  remedies: NaturalRemedies;
  setRemedies: React.Dispatch<React.SetStateAction<NaturalRemedies>>;
  logs: VitalLog[];
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onOpenNotifications: () => void;
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
}

const RemediesPage: React.FC<Props> = ({ remedies, setRemedies, logs, profile, setProfile, onOpenNotifications, notifications, addNotification }) => {
  const navigate = useNavigate();
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [adviceData, setAdviceData] = useState<any>(null);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showGratitudeInput, setShowGratitudeInput] = useState(false);
  const [dailyWeight, setDailyWeight] = useState(profile.weight.toString());

  const lastLog = logs.length > 0 ? logs[logs.length - 1] : undefined;
  const unreadCount = notifications.filter(n => !n.read).length;

  // Lógica de Restricción de Líquidos
  const hasFluidRestriction = useMemo(() => {
    const conditions = profile.medicalHistory.chronicConditions.map(c => c.toLowerCase());
    return conditions.includes('falla cardiaca') || conditions.includes('enfermedad renal crónica');
  }, [profile.medicalHistory.chronicConditions]);

  // Cálculo de Meta de Agua Personalizada
  const waterTarget = useMemo(() => {
    if (hasFluidRestriction) return 6; // 1.5 Litros (6 vasos de 250ml)
    // Fórmula base: Peso (kg) * 35ml / 250ml por vaso
    const calculated = Math.round((profile.weight * 35) / 250);
    return Math.max(8, calculated); // Mínimo 8 vasos para personas sanas
  }, [profile.weight, hasFluidRestriction]);

  // Alerta de Peso (Retención de Líquidos)
  const weightAlert = useMemo(() => {
    if (!hasFluidRestriction) return null;
    const currentWeight = parseFloat(dailyWeight);
    if (currentWeight >= profile.weight + 1) {
      return "ALERTA ROJA: Incremento de peso > 1kg detectado. Esto indica retención peligrosa de líquidos. Contacte a su médico inmediatamente.";
    }
    return null;
  }, [dailyWeight, profile.weight, hasFluidRestriction]);

  const dailyInspiration = useMemo(() => {
    const quotes = [
      "El aire puro, la luz del sol, la abstinencia, el descanso, el ejercicio, un régimen alimentario conveniente, el agua y la confianza en el poder divino son los verdaderos remedios.",
      "Un espíritu alegre es de lo mejor para la salud. La gratitud y la alabanza a Dios ahuyentan las sombras del alma.",
      "La verdadera temperancia nos enseña a abstenernos por completo de lo perjudicial y a usar cuerdamente lo que es sano.",
      "Nuestros cuerpos son propiedad de Dios. Quien cuida su salud está sirviendo al Creador con amor.",
      "La naturaleza es el médico de Dios. Pasear entre los verdes prados restaura la vitalidad del alma y el cuerpo.",
      "Muchos están enfermos porque no se permiten descansar. El sueño es el bálsamo de la naturaleza para el sistema nervioso.",
      "El agua es el líquido que Dios proveyó para apagar la sed de los hombres y los animales. Bebedla libremente.",
      "La mente controla al hombre. Una voluntad firme y una fe puesta en Dios son los mejores tónicos para el corazón.",
      "Cada órgano del cuerpo debe ser el siervo de la mente, y la mente debe ser controlada por el Espíritu divino.",
      "La benevolencia y la ayuda a los demás traen una satisfacción que es salud para los huesos.",
      "Cristo es el gran Médico. Encomienda a Él tu camino y Él fortalecerá tu corazón.",
      "La sencillez en el vivir y en el comer eleva la mente y purifica los pensamientos.",
      "El ejercicio al aire libre es el medio más eficaz para asegurar una circulación sanguínea vigorosa.",
      "La fe en Dios nos da una paz que sobrepuja todo entendimiento, relajando cada fibra del ser.",
      "Dios desea que Su pueblo sea sano y fuerte, una luz para el mundo a través de su vitalidad.",
      "La limpieza del cuerpo es esencial para la pureza del alma y la claridad de la mente.",
      "Una dieta basada en granos, frutas y nueces contiene todas las propiedades para producir buena sangre.",
      "Agradece a Dios por cada respiración. La gratitud es el antídoto contra el desánimo.",
      "El dominio propio es la base de toda verdadera felicidad y salud duradera.",
      "Deja que la luz del sol entre en tus habitaciones y en tu corazón. Es el desinfectante del cielo.",
      "La oración y la fe son las manos que se asen del poder infinito para restaurar nuestra salud.",
      "Nunca permitas que las nubes del mañana cubran el sol de hoy. Confía plenamente en tu Salvador.",
      "La moderación en todas las cosas buenas es el secreto de la longevidad.",
      "El canto y la música son excelentes medios para elevar el ánimo y sanar las penas del corazón.",
      "Nuestra vida está en las manos de Dios. Vivamos con la confianza de que Él desea lo mejor para nosotros.",
      "El descanso del sábado es un regalo divino para que el cuerpo se renueve y el alma se encuentre con su Hacedor.",
      "La alegría de hacer el bien es el mejor remedio para las mentes cansadas.",
      "Busca la sabiduría de Dios en cada elección alimentaria. Él te guiará hacia la vida.",
      "La esperanza es el ancla del alma. Mantén tus ojos en las promesas divinas.",
      "El cuerpo es un templo sagrado. Trátalo con reverencia y cuidado constante.",
      "Confía en Dios como un niño confía en su padre; esa paz es la medicina más dulce."
    ];
    const day = new Date().getDate();
    return quotes[(day - 1) % quotes.length];
  }, []);

  const toggleCheck = (key: keyof NaturalRemedies) => {
    setRemedies(prev => {
      const newVal = !prev[key];
      if (newVal === true) {
        setProfile(p => ({ ...p, totalPoints: p.totalPoints + 2 }));
        addNotification({
          type: 'achievement',
          title: 'Remedio Completado',
          message: `Has completado la acción de "${key === 'sunlight' ? 'Luz Solar' : key === 'freshAir' ? 'Aire Puro' : 'Temperancia'}" hoy.`,
        });
      }
      return { ...prev, [key]: newVal };
    });
  };

  const addWater = () => {
    if (remedies.water < waterTarget) {
      setRemedies(prev => ({ ...prev, water: prev.water + 1 }));
      if (remedies.water + 1 === waterTarget) {
         setProfile(p => ({ ...p, totalPoints: p.totalPoints + 5 }));
         addNotification({
          type: 'achievement',
          title: 'Meta de Hidratación',
          message: '¡Excelente! Has alcanzado tu meta de agua personalizada para hoy.',
        });
      }
    }
  };

  const setSleepHours = (h: number) => {
    setRemedies(prev => ({ ...prev, rest: h }));
    if (h >= 7 && remedies.rest < 7) {
      setProfile(p => ({ ...p, totalPoints: p.totalPoints + 3 }));
      addNotification({
        type: 'achievement',
        title: 'Descanso Reparador',
        message: `Has registrado ${h} horas de sueño. Tu cuerpo se está reparando.`,
      });
    }
  };

  const handleAdvice = async () => {
    setLoadingAdvice(true);
    setError("");
    try {
      const advice = await getRemedyAdvice(remedies, lastLog);
      setAdviceData(advice);
      addNotification({
        type: 'info',
        title: 'Nuevo Consejo Vital',
        message: 'Tu tutor de Ruta de Vida ha generado un nuevo consejo para ti.',
      });
    } catch (err) {
      setError("No pudimos conectar con el tutor vital. Inténtalo de nuevo.");
    } finally {
      setLoadingAdvice(false);
    }
  };

  const calculateTotalProgress = () => {
    let completed = 0;
    if (remedies.water >= waterTarget) completed++;
    if (remedies.rest >= 7) completed++;
    if (remedies.exercise) completed++;
    if (remedies.sunlight) completed++;
    if (remedies.freshAir) completed++;
    if (remedies.nutrition) completed++;
    if (remedies.temperance) completed++;
    if (remedies.hope.length > 5) completed++;
    return (completed / 8) * 100;
  };

  const remediesConfig = [
    { 
      id: 'water', 
      label: 'Agua', 
      icon: 'water_drop', 
      color: 'bg-blue-400', 
      isToggle: false, 
      progress: (remedies.water / waterTarget) * 100, 
      detail: `${remedies.water}/${waterTarget} vasos`,
      review: hasFluidRestriction 
        ? 'Debido a tu condición, tu médico debe definir tu límite diario exacto. Meta máx sugerida: 1.5L.'
        : 'Vital para la viscosidad sanguínea y eliminación de toxinas metabólicas.'
    },
    { 
      id: 'rest', 
      label: 'Descanso', 
      icon: 'bedtime', 
      color: 'bg-indigo-500', 
      isToggle: false, 
      progress: (remedies.rest / 10) * 100, 
      detail: `${remedies.rest}h dormidas`,
      review: 'El sueño profundo repara el endotelio vascular y regula el cortisol.'
    },
    { 
      id: 'exercise', 
      label: 'Ejercicio', 
      icon: 'fitness_center', 
      color: 'bg-orange-500', 
      isToggle: true, 
      checked: remedies.exercise, 
      detail: remedies.exercise ? 'Completado' : 'Moverse hoy',
      review: 'Mejora la elasticidad arterial y aumenta el flujo de óxido nítrico.'
    },
    { 
      id: 'sunlight', 
      label: 'Luz Solar', 
      icon: 'light_mode', 
      color: 'bg-yellow-500', 
      isToggle: true, 
      checked: remedies.sunlight, 
      detail: '15 min de sol',
      review: 'Fuente de Vitamina D, esencial para modular la renina y la presión.'
    },
    { 
      id: 'freshAir', 
      label: 'Aire Puro', 
      icon: 'air', 
      color: 'bg-emerald-400', 
      isToggle: true, 
      checked: remedies.freshAir, 
      detail: 'Respira profundo',
      review: 'La oxigenación celular alcaliniza el medio y reduce la inflamación.'
    },
    { 
      id: 'nutrition', 
      label: 'Nutrición', 
      icon: 'restaurant', 
      color: 'bg-leaf-green', 
      isToggle: true, 
      checked: remedies.nutrition, 
      detail: 'DASH Protocol',
      review: 'Alimentación rica en fitonutrientes y equilibrada en sodio/potasio.'
    },
    { 
      id: 'temperance', 
      label: 'Temperancia', 
      icon: 'balance', 
      color: 'bg-purple-500', 
      isToggle: true, 
      checked: remedies.temperance, 
      detail: 'Cero excesos',
      review: 'Evitar procesados y sustancias nocivas para proteger riñones e hígado.'
    },
    { 
      id: 'hope', 
      label: 'Esperanza', 
      icon: 'volunteer_activism', 
      color: 'bg-rose-400', 
      isToggle: false, 
      progress: remedies.hope.length > 5 ? 100 : 0, 
      detail: 'Gratitud diaria',
      review: 'La confianza y paz mental reducen la respuesta simpática del corazón.'
    }
  ];

  const totalProgress = calculateTotalProgress();

  return (
    <div className="pb-32 bg-slate-50 dark:bg-background-dark min-h-full">
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center">
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
            <div>
              <h1 className="text-xl font-black text-deep-blue dark:text-white leading-tight">Ruta de Vida</h1>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">8 Remedios Naturales</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-[#e8fff0] dark:bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
            <span className="material-symbols-outlined text-primary text-sm font-black">verified</span>
            <span className="text-[11px] font-black text-primary-dark tracking-tight">{profile.totalPoints} pts</span>
          </div>
        </div>
      </header>

      <div className="p-5 space-y-6">
        {/* Alertas Críticas */}
        {weightAlert && (
          <div className="bg-urgent p-4 rounded-2xl flex items-start gap-3 animate-pulse border-2 border-white shadow-lg">
            <span className="material-symbols-outlined text-white text-3xl">warning</span>
            <p className="text-[11px] font-black text-white uppercase leading-tight">{weightAlert}</p>
          </div>
        )}

        {/* Progreso General */}
        <div className="bg-deep-blue dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden border border-white/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="flex justify-between items-end mb-4">
             <div>
                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Puntaje de Ruta Hoy</p>
                <p className="text-white text-3xl font-black">{Math.round(totalProgress)}%</p>
             </div>
             <div className="text-right">
                <span className="material-symbols-outlined text-primary text-4xl animate-pulse">spa</span>
                <p className="text-[9px] text-primary/80 font-black uppercase mt-1">Óptimo</p>
             </div>
          </div>
          <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden shadow-inner">
             <div className="h-full bg-gradient-to-r from-primary to-leaf-green transition-all duration-1000" style={{ width: `${totalProgress}%` }}></div>
          </div>
        </div>

        {/* Seguimiento de Peso Diario */}
        {hasFluidRestriction && (
          <div className="bg-white dark:bg-white/5 rounded-[2rem] p-6 border-2 border-primary/20 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary">scale</span>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Control de Peso Diario</p>
            </div>
            <div className="flex items-center gap-4">
              <input 
                type="number" 
                value={dailyWeight} 
                onChange={(e) => setDailyWeight(e.target.value)}
                className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none font-black text-deep-blue dark:text-white outline-none text-xl"
                placeholder="0.0"
              />
              <span className="text-xs font-black text-slate-400">KG</span>
            </div>
            <p className="text-[9px] text-slate-400 mt-2 font-medium italic">Un aumento súbito puede indicar retención de líquidos.</p>
          </div>
        )}

        {/* Grid de Remedios */}
        <div className="grid grid-cols-1 gap-4">
          {remediesConfig.map((item) => (
            <div 
              key={item.id} 
              className={`relative overflow-hidden group transition-all duration-500 rounded-[2.5rem] bg-white dark:bg-white/5 border-2 ${expandedId === item.id ? 'border-primary shadow-2xl' : 'border-slate-50 dark:border-white/5 shadow-md'}`}
            >
              <div 
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className="p-5 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`${item.color} size-12 rounded-[1.2rem] flex items-center justify-center text-white shadow-lg`}>
                    <span className="material-symbols-outlined text-2xl font-black">{item.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-deep-blue dark:text-white font-black text-base uppercase tracking-tight">{item.label}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.detail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   {item.isToggle && item.checked && <span className="material-symbols-outlined text-primary font-black">check_circle</span>}
                   <span className={`material-symbols-outlined transition-transform duration-300 ${expandedId === item.id ? 'rotate-180 text-primary' : 'text-slate-300'}`}>expand_more</span>
                </div>
              </div>

              {expandedId === item.id && (
                <div className="px-5 pb-6 pt-2 animate-fadeIn">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-5 border-l-4 border-primary">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 flex items-center gap-2">
                      <span className="material-symbols-outlined text-xs">info</span> Reseña Ortomolecular
                    </p>
                    <p className="text-[13px] font-bold text-slate-600 dark:text-slate-200 italic leading-relaxed">
                      "{item.review}"
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      {item.id === 'water' && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); addWater(); }}
                            className="flex-1 bg-primary text-deep-blue font-black py-4 rounded-xl text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">add_circle</span> Sumar Vaso
                          </button>
                          {hasFluidRestriction && (
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                navigate('/triage');
                              }}
                              className="bg-blue-100 text-blue-600 font-black px-4 rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">ac_unit</span> Sed Intensa
                            </button>
                          )}
                        </>
                      )}
                      {item.id === 'rest' && (
                        <div className="flex-1 flex gap-2">
                           {[6, 7, 8, 9].map(h => (
                             <button 
                               key={h}
                               onClick={(e) => { e.stopPropagation(); setSleepHours(h); }}
                               className={`flex-1 py-3 rounded-xl text-[11px] font-black transition-all ${remedies.rest === h ? 'bg-primary text-deep-blue' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                             >
                               {h}h
                             </button>
                           ))}
                        </div>
                      )}
                      {item.isToggle && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleCheck(item.id as any); }}
                          className={`flex-1 font-black py-4 rounded-xl text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all ${item.checked ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-primary text-deep-blue'}`}
                        >
                          <span className="material-symbols-outlined text-sm">{item.checked ? 'verified' : 'task_alt'}</span>
                          {item.checked ? 'Completado' : 'Registrar Acción'}
                        </button>
                      )}
                      {item.id === 'hope' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowGratitudeInput(true); }}
                          className="flex-1 bg-rose-400 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">edit_note</span> Escribir Gratitud
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Diario de Gratitud - Esperanza */}
        {showGratitudeInput && (
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border-4 border-rose-400 animate-fadeIn shadow-2xl">
             <div className="flex justify-between items-center mb-5">
                <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest flex items-center gap-2">
                   <span className="material-symbols-outlined text-base">favorite</span> Nutrición para el Alma
                </p>
                <button onClick={() => setShowGratitudeInput(false)} className="text-slate-300"><span className="material-symbols-outlined">close</span></button>
             </div>
             <textarea 
               placeholder="Hoy agradezco por..."
               className="w-full h-32 p-5 bg-slate-50 dark:bg-slate-800 border-none rounded-[2rem] text-sm font-bold outline-none focus:ring-2 ring-rose-200 transition-all italic text-slate-700 dark:text-white"
               value={remedies.hope}
               onChange={(e) => setRemedies(prev => ({ ...prev, hope: e.target.value }))}
             />
             <button 
               onClick={() => {
                 setShowGratitudeInput(false);
                 if (remedies.hope.length > 5) {
                    setProfile(p => ({ ...p, totalPoints: p.totalPoints + 3 }));
                    addNotification({
                      type: 'achievement',
                      title: 'Gratitud Expresada',
                      message: 'Has registrado tu reflexión diaria. La paz mental es salud.',
                    });
                 }
               }}
               className="w-full bg-rose-400 text-white font-black py-5 rounded-2xl mt-5 text-xs uppercase tracking-widest shadow-xl shadow-rose-200 active:scale-95 transition-all"
             >
               Guardar Reflexión
             </button>
          </div>
        )}

        {/* Inspiración Diaria */}
        <div className="pt-4 px-2">
           <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-[2.5rem] p-8 border border-white dark:border-slate-700 shadow-xl flex flex-col items-center text-center animate-fadeIn group">
              <div className="size-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-500 mb-5 shadow-inner">
                <span className="material-symbols-outlined text-2xl font-black">format_quote</span>
              </div>
              <p className="text-[13px] font-bold text-slate-600 dark:text-slate-300 italic leading-relaxed mb-4 group-hover:scale-[1.02] transition-transform duration-700">
                "{dailyInspiration}"
              </p>
              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest opacity-60">Consejo de Vida Sana & Fe</p>
           </div>
        </div>

        {/* Generar Análisis IA */}
        <div className="pt-4 space-y-4">
          <button 
            onClick={handleAdvice}
            disabled={loadingAdvice}
            className="w-full bg-deep-blue text-white font-black py-7 rounded-[2.5rem] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all border border-white/5"
          >
            <span className={`material-symbols-outlined text-primary text-3xl ${loadingAdvice ? 'animate-spin' : ''}`}>auto_awesome</span>
            <div className="text-left">
               <span className="block text-sm uppercase tracking-widest">{loadingAdvice ? 'Escaneando Ruta...' : 'Generar Consejo Vital'}</span>
               {!loadingAdvice && <span className="text-[9px] text-primary font-bold uppercase opacity-60">Basado en tus registros de hoy</span>}
            </div>
          </button>

          {error && <p className="text-[9px] text-urgent font-black text-center uppercase tracking-widest bg-urgent/10 p-2 rounded-lg">{error}</p>}

          {adviceData && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border-l-8 border-primary shadow-2xl animate-fadeIn relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-6xl">spa</span></div>
               <div className="flex items-center gap-3 mb-5">
                  <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center text-primary"><span className="material-symbols-outlined text-xl">psychology</span></div>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Tutoría de Ruta de Vida</p>
               </div>
               <p className="text-[15px] font-bold text-slate-700 dark:text-slate-200 leading-relaxed italic pr-4">
                 "{adviceData.advice}"
               </p>
               <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center gap-3">
                  <div className="px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                    <p className="text-[9px] font-black text-primary-dark uppercase">Enfoque: {adviceData.priorityRemedy}</p>
                  </div>
                  <div className="px-4 py-2 bg-deep-blue rounded-full">
                    <p className="text-[9px] font-black text-white uppercase tracking-widest">+{adviceData.points} pts vitales</p>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RemediesPage;
