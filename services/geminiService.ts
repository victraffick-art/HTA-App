
import { GoogleGenAI, Type } from "@google/genai";
import { MedicalHistory, VitalLog, DailyNutritionPlan, DailyExercisePlan, NaturalRemedies } from "../types";

const MAX_RETRIES = 3;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const cleanJsonString = (str: string) => {
  if (!str) return "{}";
  const firstBrace = str.indexOf('{');
  const firstBracket = str.indexOf('[');
  let start = -1;
  let endChar = '';

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    endChar = '}';
  } else if (firstBracket !== -1) {
    start = firstBrace;
    endChar = '}';
  } else if (firstBracket !== -1) {
    start = firstBracket;
    endChar = ']';
  }

  if (start === -1) return str.replace(/```json|```/gi, '').trim();
  const lastIndex = str.lastIndexOf(endChar);
  if (lastIndex !== -1) return str.substring(start, lastIndex + 1).trim();
  return str.substring(start).trim();
};

async function callWithRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error?.message || "";
    const isRateLimit = errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED');
    const isQuotaExceeded = errorMsg.includes('quota');

    if ((isRateLimit || isQuotaExceeded) && retries > 0) {
      const waitTime = Math.pow(2, (MAX_RETRIES - retries + 1)) * 1000;
      console.warn(`Cuota excedida o Rate Limit. Reintentando en ${waitTime}ms... (${retries} reintentos restantes)`);
      await delay(waitTime);
      return callWithRetry(fn, retries - 1);
    }
    throw error;
  }
}

export const analyzeFoodImage = async (
  base64Image: string, 
  profile: any, 
  lastLog: VitalLog | undefined,
  expectedMeal: string,
  expectedIngredients: string
) => {
  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Actúa como el motor de análisis de salud y visión de "Infinity-Flow".
    MISIÓN: Realizar un Desglose Nutricional Celular del plato en la foto.
    
    RECOMENDACIÓN DASH ESPERADA:
    - Plato: "${expectedMeal}"
    - Ingredientes: "${expectedIngredients}"
    
    RESTRICCIONES MÉDICAS DEL PACIENTE:
    - Alergias: ${profile.medicalHistory.allergies || 'Ninguna'}
    - Condiciones: ${profile.medicalHistory.chronicConditions.join(', ') || 'Ninguna'}
    
    PROTOCOLO:
    1. Identifica alimentos y estima peso.
    2. Calcula aporte de Sodio (mg) y Potasio (mg).
    3. Asigna Puntos (0-10) considerando si el plato respeta las alergias y condiciones.
    
    ESTRUCTURA JSON OBLIGATORIA:
    {
      "sodio_mg": number,
      "potasio_mg": number,
      "puntos": number,
      "mensaje_comunidad": "string",
      "feedback": "string",
      "identifiedFoods": ["string"]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      }
    });

    return JSON.parse(cleanJsonString(response.text || "{}"));
  });
};

export const analyzeExerciseImage = async (
  base64Image: string,
  expectedExercise: string
) => {
  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Actúa como Verificador de Actividad Física de "Infinity-Flow".
    Analiza la imagen para confirmar si el usuario está realizando o ha realizado el ejercicio: "${expectedExercise}".
    
    PROTOCOLO:
    1. Valida si la imagen muestra ropa deportiva, equipo, ambiente de ejercicio o al usuario en acción.
    2. Asigna puntos (0-10) según la veracidad.
    
    ESTRUCTURA JSON:
    {
      "puntos": number,
      "feedback": "string",
      "isVerified": boolean
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      }
    });
    return JSON.parse(cleanJsonString(response.text || "{}"));
  });
};

export const getDetailedExercisePlan = async (profile: any, lastLog: VitalLog | undefined): Promise<DailyExercisePlan> => {
  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const bp = lastLog ? `${lastLog.systolic}/${lastLog.diastolic}` : "No registrada";
    
    const prompt = `Actúa como Especialista en Fisiología del Ejercicio para Hipertensión.
    Genera un plan de actividad física para un paciente con:
    - Edad: ${profile.age}, Peso: ${profile.weight}kg.
    - Presión Arterial Reciente: ${bp} mmHg.
    - Condiciones: ${profile.medicalHistory.chronicConditions.join(', ') || 'Ninguna'}.

    REGLA CLÍNICA: Si la sístole es >160, el ejercicio debe ser de muy baja intensidad (estiramientos, respiración).
    
    ESTRUCTURA JSON:
    {
      "date": "string",
      "dailyGoal": "string",
      "exercises": [
        {
          "id": "string",
          "time": "HH:mm",
          "title": "string",
          "description": "string",
          "intensity": "Baja|Media|Alta",
          "duration": "string",
          "targetPulseRange": "string",
          "clinicalBenefit": "string",
          "instructions": "string"
        }
      ],
      "safetyWarning": "string"
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJsonString(response.text || ""));
  });
};

export const getDetailedNutritionPlan = async (profile: any, lastLog: VitalLog | undefined): Promise<DailyNutritionPlan> => {
  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const hM = profile.height / 100;
    const bmi = hM > 0 ? (profile.weight / (hM * hM)).toFixed(1) : '0';
    const allergies = profile.medicalHistory.allergies || 'Ninguna';
    const conditions = profile.medicalHistory.chronicConditions.join(', ') || 'Ninguna';

    const prompt = `Actúa como Experto de Élite en Nutrición Ortomolecular y Clínica para "Infinity-Flow".
    
    PERFIL BIOQUÍMICO DEL PACIENTE:
    - Edad: ${profile.age} años | Peso: ${profile.weight}kg | IMC: ${bmi}
    - Condiciones: ${conditions} (Si hay Diabetes: Control glucémico estricto e índice glucémico bajo).
    - Alergias: ${allergies} (SI ALÉRGICO A LA AVENA, PROHIBIDO RECOMENDARLA).
    - PA Reciente: ${lastLog ? `${lastLog.systolic}/${lastLog.diastolic}` : 'No reg.'} mmHg.

    MISIÓN: Generar un PLAN DASH OPTIMIZADO para HOY.
    Cada plato debe aportar un equilibrio celular exacto basado en el IMC y patologías del usuario.
    
    REGLA DE NUTRIENTES: Debes incluir obligatoriamente en el array "nutrients" los siguientes valores calculados por plato:
    1. Carbohidratos (g)
    2. Proteínas (g)
    3. Grasas (g)
    4. Sodio (mg)
    5. Potasio (mg)
    6. Vitaminas Clave (ej. Vitamina C, Magnesio, Complejo B)

    ESTRUCTURA JSON:
    {
      "date": "string",
      "sodiumLimit": "string",
      "potassiumTarget": "string",
      "magnesiumTarget": "string",
      "meals": [
        {
          "time": "HH:mm",
          "title": "string",
          "description": "string (Ajustar porciones según peso e IMC)",
          "preparationReview": "string",
          "quantities": "string",
          "nutrients": [
            "Carbohidratos: Xg",
            "Proteínas: Yg",
            "Grasas: Zg",
            "Sodio: Amg",
            "Potasio: Bmg",
            "Vitamina/Mineral: C"
          ],
          "cellularBenefit": "string",
          "type": "breakfast|lunch|snack|dinner",
          "imageSearchTerm": "string"
        }
      ],
      "overallAdvice": "string"
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJsonString(response.text || ""));
  });
};

export const getHealthInsight = async (sys: number, dia: number, pulse: number, history: MedicalHistory, log: VitalLog, mas: number) => {
  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Consultor Senior Ortomolecular. PA: ${sys}/${dia}, Pulso: ${pulse}. MAS: ${mas}%.
    JSON: { "status": "optimal"|"warning"|"critical", "aha_category": "string", "message": "string", "recommendations": ["string"], "cellularNutrition": "string", "triggerUrgentConsult": boolean }`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJsonString(response.text || "{}"));
  });
};

export const getRemedyAdvice = async (remedies: NaturalRemedies, lastLog?: VitalLog) => {
  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Eres el tutor de la 'Ruta de Vida' de Infinity-Flow. 
    Analiza el cumplimiento actual de los 8 Remedios Naturales:
    - Agua: ${remedies.water}/8 vasos
    - Descanso: ${remedies.rest} horas
    - Ejercicio: ${remedies.exercise ? 'Completado' : 'Pendiente'}
    - Luz Solar: ${remedies.sunlight ? 'Completado' : 'Pendiente'}
    - Aire Puro: ${remedies.freshAir ? 'Completado' : 'Pendiente'}
    - Nutrición: ${remedies.nutrition ? 'Completado' : 'Pendiente'}
    - Temperancia: ${remedies.temperance ? 'Día Limpio' : 'Incumplido'}
    - Esperanza/Gratitud: "${remedies.hope || 'Sin registro'}"
    
    PA Reciente: ${lastLog ? `${lastLog.systolic}/${lastLog.diastolic}` : 'Sin datos'}
    
    MISIÓN: Genera un 'Consejo Vital' breve y potente que anime al usuario basándose especialmente en lo que falta por cumplir.
    
    JSON: { "advice": "string", "priorityRemedy": "string", "points": number }`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJsonString(response.text || "{}"));
  });
};
