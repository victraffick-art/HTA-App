
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
      setError('Nombre y residencia son campos obligatorios.');
      return;
    }
    setProfile({ 
      ...profile, 
      ...personal,
      medicalHistory: history 
    });
    navigate('/onboarding');
  };

  return (
    <div className="pb-32 bg-white dark:bg-background-dark min-h-full">
      <div className="flex items-center p-4 sticky top-0 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md z-50 border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => navigate(-1)} className="p-2"><span className="material-symbols-outlined">arrow_back_ios</span></button>
        <h2 className="flex-1 text-center font-bold text-lg">Historia Clínica</h2>
        <div className="w-10"></div>
      </div>

      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-deep-blue dark:text-white mb-2">Registro del Paciente</h1>
          <p className="text-sm text-gray-500">Completa tu perfil para una atención personalizada.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl border border-red-100 animate-pulse">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {/* Personal Data */}
          <section className="space-y-4">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Datos Personales</p>
            
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 ml-1">Nombre Completo *</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-slate-900 outline-none focus:border-primary"
                  placeholder="Ej: Juan Pérez"
                  value={personal.name}
                  onChange={e => {setPersonal({...personal, name: e.target.value}); setError('');}}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 ml-1">Ocupación</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-slate-900 outline-none focus:border-primary"
                  placeholder="Ej: Ingeniero"
                  value={personal.occupation}
                  onChange={e => setPersonal({...personal, occupation: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 ml-1">Ciudad de Residencia *</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-slate-900 outline-none focus:border-primary"
                  placeholder="Ej: Madrid, España"
                  value={personal.residence}
                  onChange={e => {setPersonal({...personal, residence: e.target.value}); setError('');}}
                />
              </div>
            </div>
          </section>

          {/* Conditions */}
          <section>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Condiciones Médicas</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['Diabetes', 'Obesidad', 'Apnea del Sueño', 'Colesterol Alto', 'Estrés Crónico', 'Sedentarismo'].map(cond => (
                <button
                  key={cond}
                  onClick={() => toggleCondition(cond)}
                  className={`p-3 rounded-xl border text-[11px] font-bold transition-all text-left uppercase tracking-tighter ${
                    history.chronicConditions.includes(cond) 
                      ? 'bg-primary/10 border-primary text-primary-dark shadow-sm' 
                      : 'border-gray-100 dark:border-gray-800 text-gray-400'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </section>

          {/* Structured Medications */}
          <section className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Plan de Medicación</p>
              <button 
                onClick={addMedication}
                className="flex items-center gap-1 text-xs font-black text-primary uppercase"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>
                Agregar
              </button>
            </div>
            
            <div className="space-y-3">
              {history.currentMedications.length === 0 ? (
                <div className="p-4 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase italic">No has agregado medicamentos aún</p>
                </div>
              ) : (
                history.currentMedications.map((med) => (
                  <div key={med.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 relative">
                    <button 
                      onClick={() => removeMedication(med.id)}
                      className="absolute top-4 right-4 text-urgent opacity-50 hover:opacity-100"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                    <div className="grid grid-cols-1 gap-2">
                      <input 
                        type="text" 
                        placeholder="Nombre del medicamento" 
                        className="w-full bg-white dark:bg-slate-800 border-none rounded-lg text-xs font-bold p-2"
                        value={med.name}
                        onChange={e => updateMedication(med.id, 'name', e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="text" 
                          placeholder="Dosis (ej: 50mg)" 
                          className="w-full bg-white dark:bg-slate-800 border-none rounded-lg text-xs font-bold p-2"
                          value={med.dose}
                          onChange={e => updateMedication(med.id, 'dose', e.target.value)}
                        />
                        <input 
                          type="time" 
                          className="w-full bg-white dark:bg-slate-800 border-none rounded-lg text-xs font-bold p-2"
                          value={med.time}
                          onChange={e => updateMedication(med.id, 'time', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Allergies & Surgeries */}
          <section className="space-y-4">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Antecedentes y Alergias</p>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 ml-1">Alergias</label>
              <textarea 
                className="w-full p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-slate-900 outline-none focus:border-primary text-sm"
                placeholder="Alimentos, medicamentos, etc."
                rows={2}
                value={history.allergies}
                onChange={e => setHistory({...history, allergies: e.target.value})}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 ml-1">Cirugías Previas</label>
              <textarea 
                className="w-full p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-slate-900 outline-none focus:border-primary text-sm"
                placeholder="Describe tus cirugías anteriores..."
                rows={2}
                value={history.surgeries}
                onChange={e => setHistory({...history, surgeries: e.target.value})}
              />
            </div>
          </section>

          {/* Lifestyle */}
          <section className="space-y-4">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Estilo de Vida</p>
            
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400">smoking_rooms</span>
                <span className="text-sm font-medium">¿Es fumador?</span>
              </div>
              <input 
                type="checkbox" 
                checked={history.smoker} 
                onChange={e => setHistory({...history, smoker: e.target.checked})}
                className="w-6 h-6 rounded-md border-gray-300 text-primary focus:ring-primary"
              />
            </div>

            <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400">wine_bar</span>
                <span className="text-sm font-medium">Consumo de Alcohol</span>
              </div>
              <div className="flex gap-2">
                {['Nunca', 'Social', 'Frecuente'].map(level => (
                  <button
                    key={level}
                    onClick={() => setHistory({...history, alcoholConsumption: level as any})}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      history.alcoholConsumption === level 
                        ? 'bg-primary text-deep-blue' 
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-400'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto p-6 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 z-50">
        <button 
          onClick={handleNext}
          className="w-full h-14 bg-deep-blue text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all"
        >
          Guardar y Continuar
        </button>
      </div>
    </div>
  );
};

export default MedicalHistoryPage;
