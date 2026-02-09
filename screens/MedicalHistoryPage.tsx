
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, MedicalHistory, Medication } from '../types';

interface Props {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
}

const MedicalHistoryPage: React.FC<Props> = ({ profile, setProfile }) => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<MedicalHistory>(profile.medicalHistory);
  const [personal, setPersonal] = useState({
    name: profile.name,
    occupation: profile.occupation,
    residence: profile.residence
  });
  const [error, setError] = useState('');

  const toggleCondition = (cond: string) => {
    setHistory(prev => ({
      ...prev,
      chronicConditions: prev.chronicConditions.includes(cond) 
        ? prev.chronicConditions.filter(c => c !== cond)
        : [...prev.chronicConditions, cond]
    }));
  };

  const addMedication = () => {
    const newMed: Medication = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      dose: '',
      time: '08:00'
    };
    setHistory(prev => ({
      ...prev,
      currentMedications: [...prev.currentMedications, newMed]
    }));
  };

  const updateMedication = (id: string, field: keyof Medication, value: string) => {
    setHistory(prev => ({
      ...prev,
      currentMedications: prev.currentMedications.map(m => 
        m.id === id ? { ...m, [field]: value } : m
      )
    }));
  };

  const removeMedication = (id: string) => {
    setHistory(prev => ({
      ...prev,
      currentMedications: prev.currentMedications.filter(m => m.id !== id)
    }));
  };

  const handleNext = () => {
    if (!personal.name.trim() || !personal.residence.trim()) {
      setError('Por favor completa los campos marcados con (*).');
      return;
    }
    setProfile({ 
      ...profile, 
      ...personal,
      medicalHistory: history 
    });
    navigate('/onboarding');
  };

  const healthConditions = [
    'Diabetes', 'Obesidad', 'Apnea del Sueño', 'Colesterol Alto', 
    'Estrés Crónico', 'Sedentarismo', 'Falla cardiaca', 'Infarto', 
    'ACV (Ictus)', 'EPOC', 'Enfermedad Renal', 'Artritis', 'Lupus', 'Ansiedad', 'Otros'
  ];

  return (
    <div className="pb-40 bg-background-light dark:bg-background-dark min-h-full animate-fadeIn">
      <header className="flex items-center p-6 sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md z-50 border-b border-slate-100 dark:border-white/5">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-slate-400">
           <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="flex-1 text-center font-black text-[11px] uppercase tracking-[0.2em] text-slate-500">Historia Clínica</h2>
        <div className="size-10"></div>
      </header>

      <div className="p-8">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-deep-blue dark:text-white leading-[0.95] tracking-tighter mb-4">Registro del <span className="text-primary">Paciente</span>.</h1>
          <p className="text-sm text-slate-400 font-medium">Esta información nos permite crear tu perfil metabólico inicial.</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-urgent/10 text-urgent text-[10px] font-black rounded-2xl border border-urgent/20 animate-pulse text-center uppercase tracking-widest">
            {error}
          </div>
        )}

        <div className="space-y-12">
          {/* SECCIÓN 1: PERSONALES */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
               <span className="size-8 bg-primary rounded-full flex items-center justify-center text-deep-blue font-black text-xs">01</span>
               <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Identificación</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nombre Completo *</label>
                <input 
                  type="text" 
                  className="w-full p-5 rounded-2xl border-none bg-white dark:bg-slate-900 font-bold text-deep-blue dark:text-white shadow-sm outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all"
                  placeholder="Ej. Juan Manuel Pérez"
                  value={personal.name}
                  onChange={e => {setPersonal({...personal, name: e.target.value}); setError('');}}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Ocupación</label>
                <input 
                  type="text" 
                  className="w-full p-5 rounded-2xl border-none bg-white dark:bg-slate-900 font-bold text-deep-blue dark:text-white shadow-sm outline-none"
                  placeholder="Ej. Ingeniero de Software"
                  value={personal.occupation}
                  onChange={e => setPersonal({...personal, occupation: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Ciudad de Residencia *</label>
                <input 
                  type="text" 
                  className="w-full p-5 rounded-2xl border-none bg-white dark:bg-slate-900 font-bold text-deep-blue dark:text-white shadow-sm outline-none"
                  placeholder="Ej. Bogotá, Colombia"
                  value={personal.residence}
                  onChange={e => {setPersonal({...personal, residence: e.target.value}); setError('');}}
                />
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: CONDICIONES */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
               <span className="size-8 bg-primary rounded-full flex items-center justify-center text-deep-blue font-black text-xs">02</span>
               <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Condiciones Médicas</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {healthConditions.map(cond => (
                <button
                  key={cond}
                  onClick={() => toggleCondition(cond)}
                  className={`p-4 rounded-2xl border-2 text-[10px] font-black transition-all text-left uppercase tracking-tighter leading-tight h-16 flex items-center shadow-sm ${
                    history.chronicConditions.includes(cond) 
                      ? 'bg-primary border-primary text-deep-blue scale-[1.02] shadow-primary/20' 
                      : 'bg-white dark:bg-slate-900 border-transparent text-slate-400'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
            
            {history.chronicConditions.includes('Otros') && (
              <div className="mt-4 space-y-1.5 animate-fadeIn">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Especificar Otras Condiciones</label>
                <textarea 
                  className="w-full p-5 rounded-2xl border-none bg-white dark:bg-slate-900 font-bold text-xs outline-none focus:ring-2 ring-primary/20 shadow-sm resize-none"
                  placeholder="Describe brevemente tus otras patologías o condiciones de salud..."
                  rows={3}
                  value={history.otherConditions}
                  onChange={e => setHistory({...history, otherConditions: e.target.value})}
                />
              </div>
            )}
          </section>

          {/* SECCIÓN 3: MEDICACIÓN */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
               <span className="size-8 bg-primary rounded-full flex items-center justify-center text-deep-blue font-black text-xs">03</span>
               <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Medicación Actual</p>
            </div>
            <div className="space-y-4">
              {history.currentMedications.map((med) => (
                <div key={med.id} className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 space-y-4 relative shadow-lg animate-fadeIn">
                  <button 
                    onClick={() => removeMedication(med.id)}
                    className="absolute top-6 right-6 size-8 flex items-center justify-center bg-urgent/10 text-urgent rounded-full"
                  >
                    <span className="material-symbols-outlined text-sm font-black">close</span>
                  </button>
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="Nombre del fármaco (Ej: Losartán)" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-black p-4 outline-none"
                      value={med.name}
                      onChange={e => updateMedication(med.id, 'name', e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="text" 
                        placeholder="Dosis (Ej: 50mg)" 
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-black p-4 outline-none"
                        value={med.dose}
                        onChange={e => updateMedication(med.id, 'dose', e.target.value)}
                      />
                      <input 
                        type="time" 
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-black p-4 outline-none"
                        value={med.time}
                        onChange={e => updateMedication(med.id, 'time', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={addMedication}
                className="w-full h-16 flex items-center justify-center gap-3 rounded-[1.5rem] border-2 border-dashed border-primary/40 text-primary text-[10px] font-black uppercase hover:bg-primary/5 transition-all"
              >
                <span className="material-symbols-outlined text-xl">add_circle</span>
                Añadir Medicamento
              </button>
            </div>
          </section>

          {/* SECCIÓN 4: HÁBITOS TOXICOLÓGICOS */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
               <span className="size-8 bg-primary rounded-full flex items-center justify-center text-deep-blue font-black text-xs">04</span>
               <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Hábitos y Estilo de Vida</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Consumo de Tabaco</label>
                <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm">
                  <span className="material-symbols-outlined text-slate-400">smoking_rooms</span>
                  <p className="flex-1 text-xs font-bold text-slate-700 dark:text-slate-300">¿Fuma actualmente?</p>
                  <button 
                    onClick={() => setHistory(h => ({...h, smoker: !h.smoker}))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${history.smoker ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 left-1 size-4 bg-white rounded-full transition-transform ${history.smoker ? 'translate-x-6' : ''}`}></div>
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Consumo de Alcohol</label>
                <div className="flex gap-2">
                  {['Nunca', 'Social', 'Frecuente'].map(level => (
                    <button
                      key={level}
                      onClick={() => setHistory(h => ({...h, alcoholConsumption: level as any}))}
                      className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${
                        history.alcoholConsumption === level 
                        ? 'bg-primary border-primary text-deep-blue shadow-lg' 
                        : 'bg-white dark:bg-slate-900 border-transparent text-slate-400'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN 5: ALERGIAS Y CIRUGÍAS */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
               <span className="size-8 bg-primary rounded-full flex items-center justify-center text-deep-blue font-black text-xs">05</span>
               <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Alergias y Cirugias</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Alergias Conocidas</label>
                <textarea 
                  className="w-full p-5 rounded-2xl border-none bg-white dark:bg-slate-900 font-bold text-xs outline-none focus:ring-2 ring-primary/20 shadow-sm resize-none"
                  placeholder="¿Alguna alergia alimentaria o farmacológica?"
                  rows={2}
                  value={history.allergies}
                  onChange={e => setHistory({...history, allergies: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Cirugías Previas</label>
                <textarea 
                  className="w-full p-5 rounded-2xl border-none bg-white dark:bg-slate-900 font-bold text-xs outline-none shadow-sm resize-none"
                  placeholder="Detalla intervenciones quirúrgicas relevantes..."
                  rows={2}
                  value={history.surgeries}
                  onChange={e => setHistory({...history, surgeries: e.target.value})}
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto p-8 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-slate-100 dark:border-white/5 z-50">
        <button 
          onClick={handleNext}
          className="w-full h-20 bg-deep-blue dark:bg-primary text-white dark:text-deep-blue font-black rounded-[2.5rem] shadow-2xl shadow-primary/10 active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3"
        >
          Guardar Perfil Médico
          <span className="material-symbols-outlined font-black">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default MedicalHistoryPage;
