
export interface Medication {
  id: string;
  name: string;
  dose: string;
  time: string; // Formato HH:mm
}

export interface AppNotification {
  id: string;
  type: 'achievement' | 'reminder' | 'alert' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
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
  dailyNutrients: {
    sodium: number; // mg
    potassium: number; // mg
    lastUpdateDate: string;
  };
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
  id: string; 
  time: string;
  title: string;
  description: string;
  preparationReview: string; 
  quantities: string;
  nutrients: string[];
  cellularBenefit: string;
  type: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  imageSearchTerm: string;
  isCompleted?: boolean; 
}

export interface DailyNutritionPlan {
  date: string;
  sodiumLimit: string;
  potassiumTarget: string;
  magnesiumTarget: string;
  meals: MealPlanItem[];
  overallAdvice: string;
}

export interface ExercisePlanItem {
  id: string;
  time: string;
  title: string;
  description: string;
  intensity: 'Baja' | 'Media' | 'Alta';
  duration: string;
  targetPulseRange: string;
  clinicalBenefit: string;
  instructions: string;
  isCompleted?: boolean;
}

export interface DailyExercisePlan {
  date: string;
  dailyGoal: string;
  exercises: ExercisePlanItem[];
  safetyWarning: string;
}

export interface NaturalRemedies {
  water: number;       // vasos (0-8)
  rest: number;        // horas
  exercise: boolean;   // vinculado a ExercisePage
  sunlight: boolean;   // check
  freshAir: boolean;   // check
  nutrition: boolean;  // vinculado a NutritionPage
  temperance: boolean; // switch libre de procesados
  hope: string;        // frase de gratitud
}
