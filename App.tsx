
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import WelcomePage from './screens/WelcomePage';
import SubscriptionPage from './screens/SubscriptionPage';
import MedicalHistoryPage from './screens/MedicalHistoryPage';
import OnboardingPage from './screens/OnboardingPage';
import DashboardPage from './screens/DashboardPage';
import NutritionPage from './screens/NutritionPage';
import CommunityPage from './screens/CommunityPage';
import TriagePage from './screens/TriagePage';
import { UserProfile, VitalLog } from './types';

const AppLayout: React.FC<{ children: React.ReactNode; hideNav?: boolean }> = ({ children, hideNav = false }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-[430px] mx-auto bg-white dark:bg-background-dark shadow-2xl border-x border-gray-100 dark:border-gray-800">
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {children}
      </div>
      
      {!hideNav && (
        <nav className="shrink-0 bg-white/95 dark:bg-background-dark/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 flex items-center justify-around py-3 pb-8 px-4 z-50">
          <Link to="/log" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/log') ? 'text-primary' : 'text-gray-400'}`}>
            <span className="material-symbols-outlined text-[28px]">dashboard</span>
            <span className="text-[10px] font-bold">Log</span>
          </Link>
          <Link to="/nutrition" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/nutrition') ? 'text-primary' : 'text-gray-400'}`}>
            <span className="material-symbols-outlined text-[28px]">restaurant</span>
            <span className="text-[10px] font-medium">Plan</span>
          </Link>
          <Link to="/community" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/community') ? 'text-primary' : 'text-gray-400'}`}>
            <span className="material-symbols-outlined text-[28px]">groups</span>
            <span className="text-[10px] font-medium">Comunidad</span>
          </Link>
          <Link to="/triage" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/triage') ? 'text-primary' : 'text-gray-400'}`}>
            <span className="material-symbols-outlined text-[28px]">medical_information</span>
            <span className="text-[10px] font-medium">Consulta</span>
          </Link>
        </nav>
      )}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
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
    totalPoints: 0, // Inicialización de puntos
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

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout hideNav><WelcomePage /></AppLayout>} />
        <Route path="/subscription" element={<AppLayout hideNav><SubscriptionPage /></AppLayout>} />
        <Route path="/medical-history" element={<AppLayout hideNav><MedicalHistoryPage profile={profile} setProfile={setProfile} /></AppLayout>} />
        <Route path="/onboarding" element={<AppLayout hideNav><OnboardingPage profile={profile} setProfile={setProfile} /></AppLayout>} />
        <Route path="/log" element={<AppLayout><DashboardPage profile={profile} logs={logs} setLogs={setLogs} lastInsight={lastInsight} setLastInsight={setLastInsight} /></AppLayout>} />
        <Route path="/nutrition" element={<AppLayout><NutritionPage profile={profile} setProfile={setProfile} logs={logs} /></AppLayout>} />
        <Route path="/community" element={<AppLayout><CommunityPage profile={profile} /></AppLayout>} />
        <Route path="/triage" element={<AppLayout><TriagePage /></AppLayout>} />
      </Routes>
    </Router>
  );
};

export default App;
