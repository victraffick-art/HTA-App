
import React from 'react';

const TriagePage: React.FC = () => {
  const alerts = [
    { id: 1, name: 'Carlos J. Ramírez', vital: '165/105', status: 'CRISIS HTA', type: 'urgent' },
    { id: 2, name: 'Elena Martínez', vital: '142/91', status: 'RIESGO ELEVADO', type: 'warning' },
    { id: 3, name: 'Juan P. Soto', vital: '118/79', status: 'ESTABLE', type: 'stable' }
  ];

  return (
    <div className="pb-24">
      <header className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
        <div className="text-gray-500 flex size-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <span className="material-symbols-outlined">account_circle</span>
        </div>
        <div className="flex flex-col items-center flex-1">
          <h2 className="text-sm font-bold">Panel de Consultas</h2>
          <p className="text-[10px] text-gray-500">Dr. Alejandro Méndez</p>
        </div>
        <span className="material-symbols-outlined text-gray-500">notifications</span>
      </header>

      <div className="flex gap-3 p-4 overflow-x-auto hide-scrollbar bg-background-light dark:bg-background-dark/50">
        <div className="flex min-w-[110px] flex-col gap-1 rounded-xl p-3 border border-urgent/20 bg-urgent/5 shadow-sm">
          <p className="text-urgent text-[10px] font-bold uppercase tracking-widest">CRÍTICO</p>
          <p className="text-2xl font-bold">12</p>
        </div>
        <div className="flex min-w-[110px] flex-col gap-1 rounded-xl p-3 border border-warning/20 bg-warning/5 shadow-sm">
          <p className="text-warning text-[10px] font-bold uppercase tracking-widest">RIESGO</p>
          <p className="text-2xl font-bold">24</p>
        </div>
        <div className="flex min-w-[110px] flex-col gap-1 rounded-xl p-3 border border-stable/20 bg-stable/5 shadow-sm">
          <p className="text-stable text-[10px] font-bold uppercase tracking-widest">ESTABLE</p>
          <p className="text-2xl font-bold">145</p>
        </div>
      </div>

      <div className="px-4 space-y-3 mt-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Alertas Recientes</h3>
        
        {alerts.map(alert => (
          <div key={alert.id} className="relative flex items-center bg-white dark:bg-background-dark border border-gray-100 dark:border-gray-800 rounded-xl p-4 ios-shadow hover:scale-[1.01] transition-transform cursor-pointer">
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${
              alert.type === 'urgent' ? 'bg-urgent' : alert.type === 'warning' ? 'bg-warning' : 'bg-stable'
            }`}></div>
            <div className="flex-1 ml-2">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{alert.name}</h4>
                <span className="text-[9px] text-slate-400">hace 5 min</span>
              </div>
              <div className="flex justify-between items-end mt-3">
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">PRESIÓN</span>
                    <span className={`text-xl font-bold ${
                      alert.type === 'urgent' ? 'text-urgent' : alert.type === 'warning' ? 'text-warning' : 'text-stable'
                    }`}>{alert.vital}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                  alert.type === 'urgent' ? 'bg-urgent/10 text-urgent' : 
                  alert.type === 'warning' ? 'bg-warning/10 text-warning' : 
                  'bg-stable/10 text-stable'
                }`}>
                  {alert.status}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center">
                 <button className="text-[10px] font-bold text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">chat_bubble</span>
                    Contactar
                 </button>
                 <button className="text-[10px] font-bold text-slate-400">Ver Historial</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 mt-4">
          <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
             <h4 className="text-sm font-bold mb-1">Análisis de Red IA</h4>
             <p className="text-[11px] opacity-70 leading-relaxed">Optimizando la nutrición celular en pacientes de tu zona. Consulta personalizada disponible.</p>
             <button className="mt-4 bg-primary text-slate-900 text-[10px] font-bold px-4 py-2 rounded-lg">VER REPORTE COMPLETO</button>
          </div>
      </div>
    </div>
  );
};

export default TriagePage;
