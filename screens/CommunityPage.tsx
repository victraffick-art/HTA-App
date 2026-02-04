
import React from 'react';
import { UserProfile } from '../types';

interface Props {
  profile: UserProfile;
}

const CommunityPage: React.FC<Props> = ({ profile }) => {
  return (
    <div className="pb-24">
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center p-4 justify-between">
          <div className="size-10 rounded-full border-2 border-primary overflow-hidden shadow-sm">
            <img src="https://picsum.photos/seed/community-profile/100/100" alt="Circle" />
          </div>
          <h2 className="text-[#111813] dark:text-white font-bold tracking-tight">Infinity-Circles</h2>
          <span className="material-symbols-outlined text-gray-500">notifications</span>
        </div>
      </div>
      
      <div className="px-4 py-3 bg-primary/10 flex items-center gap-2 border-b border-primary/5">
        <span className="material-symbols-outlined text-primary text-sm">bolt</span>
        <p className="text-xs font-medium text-primary-dark">50 personas completaron el reto de hidratación hoy.</p>
      </div>

      <div className="p-4 space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-4">Muro de Logros</h2>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
            <AchievementCard 
              title="Mi Puntuación Vital" 
              user={`${profile.name} (Tú)`} 
              color="from-[#13ec5b] to-leaf-green" 
              icon="verified"
              points={profile.totalPoints} 
            />
            <AchievementCard 
              title="Reducción de dosis lograda" 
              user="Usuario #482" 
              color="from-primary/80 to-leaf-green" 
              icon="pill_off" 
            />
            <AchievementCard 
              title="Presión estable 30 días" 
              user="Usuario #129" 
              color="from-blue-400 to-blue-600" 
              icon="vital_signs" 
            />
          </div>
        </div>

        <section>
          <h3 className="font-bold text-lg mb-3">Retos Semanales</h3>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 ios-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">timer</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">Cero Sal Procesada</p>
                <p className="text-[10px] text-gray-500">Quedan 2 días • 1.2k participantes</p>
              </div>
              <button className="bg-primary px-4 py-1.5 rounded-full text-[10px] font-bold text-slate-900 shadow-sm">UNIRSE</button>
            </div>
            <div className="mt-4 bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: '65%' }}></div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="font-bold text-lg mb-3">Tendencias de Salud</h3>
          <div className="grid grid-cols-2 gap-3">
             <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl ios-shadow">
                <span className="material-symbols-outlined text-leaf-green mb-2">trending_up</span>
                <p className="text-xs font-bold">Potasio +12%</p>
                <p className="text-[10px] text-gray-400">Promedio global comunidad</p>
             </div>
             <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl ios-shadow">
                <span className="material-symbols-outlined text-urgent mb-2">trending_down</span>
                <p className="text-xs font-bold">Estrés -5%</p>
                <p className="text-[10px] text-gray-400">Medido por HRV</p>
             </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const AchievementCard: React.FC<{ title: string; user: string; color: string; icon: string; points?: number }> = ({ title, user, color, icon, points }) => (
  <div className="min-w-[260px] bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm group hover:border-primary/50 transition-colors">
    <div className={`h-32 bg-gradient-to-br ${color} rounded-lg flex flex-col items-center justify-center shadow-inner relative overflow-hidden`}>
      <span className="material-symbols-outlined text-white text-5xl opacity-90 group-hover:scale-110 transition-transform">{icon}</span>
      {points !== undefined && (
        <div className="absolute bottom-2 right-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
          <p className="text-[10px] font-black text-white">{points} pts</p>
        </div>
      )}
    </div>
    <p className="font-bold mt-2 text-sm">{title}</p>
    <p className="text-xs text-gray-500">{user}</p>
  </div>
);

export default CommunityPage;
