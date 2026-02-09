
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import WelcomePage from './screens/WelcomePage';
import SubscriptionPage from './screens/SubscriptionPage';
import MedicalHistoryPage from './screens/MedicalHistoryPage';
import OnboardingPage from './screens/OnboardingPage';
import DashboardPage from './screens/DashboardPage';
import NutritionPage from './screens/NutritionPage';
import ExercisePage from './screens/ExercisePage';
import CommunityPage from './screens/CommunityPage';
import TriagePage from './screens/TriagePage';
import RemediesPage from './screens/RemediesPage';
import { UserProfile, VitalLog, DailyNutritionPlan, DailyExercisePlan, NaturalRemedies, AppNotification } from './types';

// Componente para proteger rutas y forzar el registro inicial
const AuthGuard: React.FC<{ profile: UserProfile; children: React.ReactNode }> = ({ profile, children }) => {
  const location = useLocation();
  const setupPaths = ['/', '/subscription', '/medical-history', '/onboarding'];
  const isSetupPath = setupPaths.includes(location.pathname);
  
  // Si no hay nombre (perfil incompleto) y no está en una página de configuración, redirigir a Bienvenida
  if (!profile.name && !isSetupPath) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const NotificationModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
}> = ({ isOpen, onClose, notifications, onMarkRead }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-deep-blue/40 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-[85%] max-w-[360px] h-full bg-white dark:bg-background-dark shadow-2xl flex flex-col animate-slideInRight">
        <header className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-black text-deep-blue dark:text-white uppercase tracking-widest">Notificaciones</h2>
          <button onClick={onClose} className="size-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-full">
            <span className="material-symbols-outlined font-black">close</span>
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 opacity-30 text-center px-8">
              <span className="material-symbols-outlined text-5xl mb-2">notifications_off</span>
              <p className="text-[10px] font-black uppercase tracking-widest">No tienes notificaciones aún</p>
            </div>
          ) : (
            [...notifications].reverse().map(notif => (
              <div 
                key={notif.id} 
                onClick={() => onMarkRead(notif.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                  notif.read ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-white/5 opacity-60' : 'bg-white dark:bg-slate-800 border-primary/20 shadow-lg ring-1 ring-primary/5'
                }`}
              >
                {!notif.read && <div className="absolute top-4 right-4 size-2 bg-primary rounded-full"></div>}
                <div className="flex gap-3">
                  <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                    notif.type === 'achievement' ? 'bg-primary/10 text-primary' :
                    notif.type === 'alert' ? 'bg-urgent/10 text-urgent' :
                    notif.type === 'reminder' ? 'bg-amber-100 text-amber-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    <span className="material-symbols-outlined text-xl">
                      {notif.type === 'achievement' ? 'workspace_premium' :
                       notif.type === 'alert' ? 'warning' :
                       notif.type === 'reminder' ? 'alarm' : 'info'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-deep-blue dark:text-white uppercase tracking-tight">{notif.title}</h4>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">{notif.message}</p>
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC<{ children: React.ReactNode; hideNav?: boolean }> = ({ children, hideNav = false }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-[430px] mx-auto bg-white dark:bg-background-dark shadow-2xl border-x border-gray-100 dark:border-gray-800">
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {children}
      </div>
      
      {!hideNav && (
        <nav className="shrink-0 bg-white/95 dark:bg-background-dark/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 flex items-center justify-around pt-3 pb-8 px-1 z-[100] shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
          <Link to="/log" className={`flex flex-col items-center gap-1 transition-all duration-300 w-[16%] ${isActive('/log') ? 'text-primary' : 'text-slate-400'}`}>
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: isActive('/log') ? "'FILL' 1" : "'FILL' 0" }}>grid_view</span>
            <span className={`text-[9px] font-bold tracking-tight ${isActive('/log') ? 'text-primary' : 'text-slate-400'}`}>Log</span>
          </Link>
          <Link to="/nutrition" className={`flex flex-col items-center gap-1 transition-all duration-300 w-[16%] ${isActive('/nutrition') ? 'text-primary' : 'text-slate-400'}`}>
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: isActive('/nutrition') ? "'FILL' 1" : "'FILL' 0" }}>restaurant</span>
            <span className={`text-[9px] font-bold tracking-tight ${isActive('/nutrition') ? 'text-primary' : 'text-slate-400'}`}>Plan</span>
          </Link>
          <Link to="/exercise" className={`flex flex-col items-center gap-1 transition-all duration-300 w-[16%] ${isActive('/exercise') ? 'text-primary' : 'text-slate-400'}`}>
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: isActive('/exercise') ? "'FILL' 1" : "'FILL' 0" }}>fitness_center</span>
            <span className={`text-[9px] font-bold tracking-tight ${isActive('/exercise') ? 'text-primary' : 'text-slate-400'}`}>Mov</span>
          </Link>
          <Link to="/remedies" className={`flex flex-col items-center gap-1 transition-all duration-300 w-[16%] ${isActive('/remedies') ? 'text-primary' : 'text-slate-400'}`}>
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: isActive('/remedies') ? "'FILL' 1" : "'FILL' 0" }}>energy_savings_leaf</span>
            <span className={`text-[9px] font-bold tracking-tight ${isActive('/remedies') ? 'text-primary' : 'text-slate-400'}`}>Vida</span>
          </Link>
          <Link to="/community" className={`flex flex-col items-center gap-1 transition-all duration-300 w-[16%] ${isActive('/community') ? 'text-primary' : 'text-slate-400'}`}>
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: isActive('/community') ? "'FILL' 1" : "'FILL' 0" }}>groups</span>
            <span className={`text-[9px] font-bold tracking-tight ${isActive('/community') ? 'text-primary' : 'text-slate-400'}`}>Red</span>
          </Link>
          <Link to="/triage" className={`flex flex-col items-center gap-1 transition-all duration-300 w-[16%] ${isActive('/triage') ? 'text-primary' : 'text-slate-400'}`}>
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: isActive('/triage') ? "'FILL' 1" : "'FILL' 0" }}>badge</span>
            <span className={`text-[9px] font-bold tracking-tight ${isActive('/triage') ? 'text-primary' : 'text-slate-400'}`}>Doc</span>
          </Link>
        </nav>
      )}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full z-[110] opacity-50"></div>
    </div>
  );
};

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    occupation: '',
    residence: '',
    gender: 'Masculino',
    age: 0,
    weight: 0,
    height: 0,
    totalPoints: 0,
    dailyNutrients: {
      sodium: 0,
      potassium: 0,
      lastUpdateDate: new Date().toDateString()
    },
    medicalHistory: {
      chronicConditions: [],
      currentMedications: [],
      otherConditions: '',
      allergies: '',
      surgeries: '',
      familyHistory: false,
      smoker: false,
      alcoholConsumption: 'Nunca',
      lastCheckup: ''
    },
    subscription: {
      plan: 'Free Trial',
      startDate: new Date(),
      isActive: true
    }
  });

  const [logs, setLogs] = useState<VitalLog[]>([]);
  const [lastInsight, setLastInsight] = useState<any | null>(null);

  const [nutritionPlan, setNutritionPlan] = useState<DailyNutritionPlan | null>(null);
  const [completedMealIds, setCompletedMealIds] = useState<string[]>([]);
  const [lastPlanLogDate, setLastPlanLogDate] = useState<string | null>(null);

  const [exercisePlan, setExercisePlan] = useState<DailyExercisePlan | null>(null);
  const [completedExerciseIds, setCompletedExerciseIds] = useState<string[]>([]);
  const [lastExerciseLogDate, setLastExerciseLogDate] = useState<string | null>(null);

  const [remedies, setRemedies] = useState<NaturalRemedies>({
    water: 0,
    rest: 8,
    exercise: false,
    sunlight: false,
    freshAir: false,
    nutrition: false,
    temperance: false,
    hope: ""
  });

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [...prev, newNotif]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  useEffect(() => {
    if (logs.length > 0) {
      const lastLog = logs[logs.length - 1];
      const logDate = new Date(lastLog.timestamp).toDateString();
      
      if (profile.dailyNutrients.lastUpdateDate !== logDate) {
        setProfile(prev => ({
          ...prev,
          dailyNutrients: {
            sodium: 0,
            potassium: 0,
            lastUpdateDate: logDate
          }
        }));
        setCompletedMealIds([]);
        setCompletedExerciseIds([]);
        setRemedies({
          water: 0,
          rest: 8,
          exercise: false,
          sunlight: false,
          freshAir: false,
          nutrition: false,
          temperance: false,
          hope: ""
        });
      }
    }
  }, [logs]);

  useEffect(() => {
    setRemedies(prev => ({
      ...prev,
      nutrition: completedMealIds.length > 0,
      exercise: completedExerciseIds.length > 0
    }));
  }, [completedMealIds, completedExerciseIds]);

  return (
    <Router>
      <AuthGuard profile={profile}>
        <NotificationModal 
          isOpen={isNotificationsOpen} 
          onClose={() => setIsNotificationsOpen(false)} 
          notifications={notifications}
          onMarkRead={markNotificationRead}
        />
        <Routes>
          <Route path="/" element={<AppLayout hideNav><WelcomePage /></AppLayout>} />
          <Route path="/subscription" element={<AppLayout hideNav><SubscriptionPage /></AppLayout>} />
          <Route path="/medical-history" element={<AppLayout hideNav><MedicalHistoryPage profile={profile} setProfile={setProfile} /></AppLayout>} />
          <Route path="/onboarding" element={<AppLayout hideNav><OnboardingPage profile={profile} setProfile={setProfile} /></AppLayout>} />
          <Route path="/log" element={<AppLayout><DashboardPage profile={profile} setProfile={setProfile} logs={logs} setLogs={setLogs} lastInsight={lastInsight} setLastInsight={setLastInsight} onOpenNotifications={() => setIsNotificationsOpen(true)} notifications={notifications} addNotification={addNotification} /></AppLayout>} />
          <Route path="/nutrition" element={
            <AppLayout>
              <NutritionPage 
                profile={profile} 
                setProfile={setProfile} 
                logs={logs} 
                plan={nutritionPlan}
                setPlan={setNutritionPlan}
                completedMealIds={completedMealIds}
                setCompletedMealIds={setCompletedMealIds}
                lastPlanLogDate={lastPlanLogDate}
                setLastPlanLogDate={setLastPlanLogDate}
                onOpenNotifications={() => setIsNotificationsOpen(true)}
                notifications={notifications}
                addNotification={addNotification}
              />
            </AppLayout>
          } />
          <Route path="/exercise" element={
            <AppLayout>
              <ExercisePage 
                profile={profile}
                setProfile={setProfile}
                logs={logs}
                plan={exercisePlan}
                setPlan={setExercisePlan}
                completedExerciseIds={completedExerciseIds}
                setCompletedExerciseIds={setCompletedExerciseIds}
                lastExerciseLogDate={lastExerciseLogDate}
                setLastExerciseLogDate={setLastExerciseLogDate}
                onOpenNotifications={() => setIsNotificationsOpen(true)}
                notifications={notifications}
                addNotification={addNotification}
              />
            </AppLayout>
          } />
          <Route path="/remedies" element={
            <AppLayout>
              <RemediesPage 
                remedies={remedies} 
                setRemedies={setRemedies} 
                logs={logs}
                profile={profile}
                setProfile={setProfile}
                onOpenNotifications={() => setIsNotificationsOpen(true)}
                notifications={notifications}
                addNotification={addNotification}
              />
            </AppLayout>
          } />
          <Route path="/community" element={<AppLayout><CommunityPage profile={profile} onOpenNotifications={() => setIsNotificationsOpen(true)} notifications={notifications} /></AppLayout>} />
          <Route path="/triage" element={<AppLayout><TriagePage onOpenNotifications={() => setIsNotificationsOpen(true)} notifications={notifications} /></AppLayout>} />
        </Routes>
      </AuthGuard>
    </Router>
  );
};

export default App;
