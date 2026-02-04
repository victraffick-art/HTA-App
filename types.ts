
export interface Medication {
  id: string;
  name: string;
  dose: string;
  time: string; // Formato HH:mm
}

export interface VitalLog {
  systolic: number;
  diastolic: number;
  pulse: number;
  timestamp: Date;
  // Contexto
  momentOfDay: 'morning' | 'afternoon' | 'night';
  physicalState: 'resting' | 'walking' | 'exercise' | 'stress' | 'just_ate' | 'lying';
  sleep: {
    hours: number;
    quality: boolean;
  };
  consumptions: {
    coffee: boolean;
    alcohol: boolean;
    salt: boolean;
    smoking: boolean;
    fried_foods: boolean;
    sugar: boolean;
  };
  symptoms: ('headache' | 'dizziness' | 'chest_pain' | 'shortness_breath' | 'blurred_vision' | 'none')[];
  note: string;
  // Medicación
  medication: {
    takes: boolean;
    name: string;
    takenToday: boolean;
    timeTaken?: string;
    missedDose: boolean;
    sideEffects: string;
  };
}

export interface MedicalHistory {
  chronicConditions: string[];
  currentMedications: Medication[]; // Lista estructurada
  otherConditions: string;
  allergies: string;
  surgeries: string;
  familyHistory: boolean;
  smoker: boolean;
  alcoholConsumption: 'Nunca' | 'Social' | 'Frecuente';
  lastCheckup: string;
}

export interface UserProfile {
  name: string;
  occupation: string;
  residence: string;
  gender: 'Masculino' | 'Femenino';
  age: number;
  weight: number;
  height: number;
  totalPoints: number; // Puntos acumulativos
  medicalHistory: MedicalHistory;
  subscription: {
    plan: 'Free Trial' | 'Premium';
    startDate: Date;
    isActive: boolean;
  };
}

export interface DailyInsight {
  status: 'optimal' | 'warning' | 'critical';
  message: string;
  recommendations: string[];
  adherenceScore?: number; 
  probabilityLevel?: 'Baja' | 'Media' | 'Alta';
}

export interface MealPlanItem {
  id: string; // Identificador único para cada plato
  time: string;
  title: string;
  description: string;
  quantities: string;
  nutrients: string[];
  cellularBenefit: string;
  type: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  imageSearchTerm: string;
  isCompleted?: boolean; // Estado de verificación por foto
}

export interface DailyNutritionPlan {
  date: string;
  sodiumLimit: string;
  potassiumTarget: string;
  magnesiumTarget: string;
  meals: MealPlanItem[];
  overallAdvice: string;
}
