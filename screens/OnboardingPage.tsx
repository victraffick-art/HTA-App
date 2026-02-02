
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';

interface Props {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
}

const OnboardingPage: React.FC<Props> = ({ profile, setProfile }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: profile.name,
    gender: profile.gender,
    age: profile.age,
    weight: profile.weight,
    height: profile.height
  });
  const [error, setError] = useState('');

  const handleFinish = () => {
    if (formData.age <= 0 || formData.weight <= 0 || formData.height <= 0) {
      setError('Por favor, ingresa valores válidos para edad, peso y altura.');
      return;
    }
    setProfile({
      ...profile,
      ...formData
    });
    navigate('/log');
  };

  return (
    <div className="pb-32">
      <div className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
        <div onClick={() => navigate(-1)} className="text-[#111813] dark:text-white flex size-12 shrink-0 items-center cursor-pointer">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </div>
        <h2 className="text-[#111813] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">Datos Físicos</h2>
      </div>
      <div className="flex flex-col gap-3 p-4 bg-white dark:bg-background-dark">
        <div className="flex gap-6 justify-between items-center">
          <p className="text-[#111813] dark:text-white text-sm font-medium leading-normal">Paso 3 de 3: Medidas</p>
          <p className="text-[#111813] dark:text-white text-xs font-normal leading-normal opacity-70">100% completado</p>
        </div>
        <div className="rounded-full bg-[#dbe6df] dark:bg-gray-700 h-2.5 overflow-hidden">
          <div className="h-full rounded-full bg-primary" style={{ width: '100%' }}></div>
        </div>
      </div>
      <div className="h-2 bg-background-light dark:bg-gray-900/30"></div>

      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl border border-red-100">
          {error}
        </div>
      )}

      <div className="flex flex-col px-4 py-6">
        <label className="flex flex-col w-full">
          <p className="text-[#111813] dark:text-white text-base font-semibold leading-normal pb-2">Tu nombre</p>
          <div className="flex w-full items-stretch rounded-xl border border-[#dbe6df] dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden focus-within:border-primary transition-colors">
            <input 
              className="form-input flex w-full min-w-0 flex-1 border-0 bg-transparent text-[#111813] dark:text-white h-14 placeholder:text-[#61896f]/60 px-4 text-lg font-normal outline-none focus:ring-0" 
              placeholder="Ej: Alex" 
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
        </label>
      </div>

      <div className="flex flex-col gap-1">
        <div className="px-4 py-3">
          <p className="text-[#111813] dark:text-white text-base font-semibold leading-normal pb-3">Sexo biológico</p>
          <div className="flex h-14 items-center justify-center rounded-xl bg-[#f0f4f2] dark:bg-gray-800 p-1.5">
            <button 
              onClick={() => setFormData(prev => ({ ...prev, gender: 'Masculino' }))}
              className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 transition-all ${formData.gender === 'Masculino' ? 'bg-white dark:bg-gray-700 shadow-sm text-[#111813] dark:text-white font-medium' : 'text-[#61896f]'}`}
            >
              <span className="truncate">Masculino</span>
            </button>
            <button 
              onClick={() => setFormData(prev => ({ ...prev, gender: 'Femenino' }))}
              className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 transition-all ${formData.gender === 'Femenino' ? 'bg-white dark:bg-gray-700 shadow-sm text-[#111813] dark:text-white font-medium' : 'text-[#61896f]'}`}
            >
              <span className="truncate">Femenino</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col px-4 py-3">
          <label className="flex flex-col w-full">
            <p className="text-[#111813] dark:text-white text-base font-semibold leading-normal pb-2">Edad *</p>
            <div className="flex w-full items-stretch rounded-xl border border-[#dbe6df] dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden focus-within:border-primary transition-colors">
              <input 
                className="form-input flex w-full min-w-0 flex-1 border-0 bg-transparent text-[#111813] dark:text-white h-14 placeholder:text-[#61896f]/60 px-4 text-lg font-normal outline-none focus:ring-0" 
                placeholder="Ej: 52" 
                type="number"
                value={formData.age || ''}
                onChange={(e) => {setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 })); setError('');}}
              />
              <div className="text-[#61896f] flex items-center justify-center px-4">
                <span className="material-symbols-outlined">cake</span>
              </div>
            </div>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2 px-4 py-3">
          <div className="flex flex-col">
            <p className="text-[#111813] dark:text-white text-base font-semibold leading-normal pb-2">Peso (kg) *</p>
            <div className="flex w-full items-stretch rounded-xl border border-[#dbe6df] dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden focus-within:border-primary">
              <input 
                className="w-full border-0 bg-transparent text-[#111813] dark:text-white h-14 px-4 text-lg outline-none" 
                placeholder="85" 
                type="number"
                value={formData.weight || ''}
                onChange={(e) => {setFormData(prev => ({ ...prev, weight: parseInt(e.target.value) || 0 })); setError('');}}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <p className="text-[#111813] dark:text-white text-base font-semibold leading-normal pb-2">Altura (cm) *</p>
            <div className="flex w-full items-stretch rounded-xl border border-[#dbe6df] dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden focus-within:border-primary">
              <input 
                className="w-full border-0 bg-transparent text-[#111813] dark:text-white h-14 px-4 text-lg outline-none" 
                placeholder="175" 
                type="number"
                value={formData.height || ''}
                onChange={(e) => {setFormData(prev => ({ ...prev, height: parseInt(e.target.value) || 0 })); setError('');}}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-white/90 dark:bg-background-dark/90 backdrop-blur-md p-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3 z-20">
        <button onClick={handleFinish} className="w-full h-14 bg-primary text-[#111813] font-bold text-lg rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
          <span>Finalizar Perfil</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default OnboardingPage;
