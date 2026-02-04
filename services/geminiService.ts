
import { GoogleGenAI, Type } from "@google/genai";
import { MedicalHistory, VitalLog, DailyNutritionPlan } from "../types";

const cleanJsonString = (str: string) => {
  // Elimina bloques de código markdown y espacios en blanco
  let cleaned = str.replace(/```json|```/gi, '').trim();
  // Intenta encontrar el primer '{' y el último '}' para extraer solo el objeto JSON
  const firstBracket = cleaned.indexOf('{');
  const lastBracket = cleaned.lastIndexOf('}');
  if (firstBracket !== -1 && lastBracket !== -1) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  }
  return cleaned;
};

export const analyzeFoodImage = async (base64Image: string, profile: any, lastLog: VitalLog | undefined) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Actúa como el motor de análisis de salud y visión de "Infinity-Flow".
  MISIÓN: Analizar la foto del plato del usuario y realizar un Desglose Nutricional Celular.
  
  DATOS DEL PACIENTE:
  - Edad: ${profile.age}, Peso: ${profile.weight}kg.
  - Última Presión: ${lastLog ? `${lastLog.systolic}/${lastLog.diastolic} mmHg` : 'Desconocida'}.
  
  PROTOCOLO DE ANÁLISIS:
  1. Identifica alimentos y estima Sodio (mg) y Potasio (mg).
  2. Asigna puntos: 10 (Excelente DASH), 5 (Aceptable), 0 (Procesados/Peligrosos).
  3. Genera un mensaje motivador para la comunidad.
  4. Explica el impacto celular y sugiere ajustes de gramajes para la siguiente comida.

  REGLA ESTRICTA DE SALIDA: Responde EXCLUSIVAMENTE con un objeto JSON válido con esta estructura exacta:
  {
    "sodio_mg": number,
    "potasio_mg": number,
    "puntos": number,
    "mensaje_comunidad": "string",
    "identifiedFoods": ["string"],
    "feedback": "string",
    "nextStepAdjustment": "string",
    "isApt": boolean
  }`;

  // NOTA: Para gemini-2.5-flash-image NO se debe usar responseMimeType ni responseSchema
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: prompt }
      ]
    }
  });

  const rawText = response.text || "{}";
  try {
    const cleanedJson = cleanJsonString(rawText);
    return JSON.parse(cleanedJson);
  } catch (e) {
    console.error("Error al parsear JSON de Gemini:", e, rawText);
    throw new Error("No se pudo procesar la respuesta nutricional.");
  }
};

export const getNutritionAdvice = async (mealTitle: string, history: MedicalHistory) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analiza el plato "${mealTitle}" para un paciente con: ${history.chronicConditions.join(', ') || 'Hipertensión'}. Explica su beneficio para la salud celular y control de presión arterial. Sé conciso, máximo 2 frases.`,
  });
  return response.text || "Consulta no disponible en este momento.";
};

export const getDetailedNutritionPlan = async (profile: any, lastLog: VitalLog | undefined): Promise<DailyNutritionPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Actúa como un experto en Nutrición Ortomolecular y Cardiología Clínica. 
  Genera un PLAN NUTRICIONAL DIARIO basado estrictamente en la DIETA DASH y los principios de salud de ELLEN WHITE.
  
  PERFIL DEL PACIENTE:
  - Edad: ${profile.age} años, Peso: ${profile.weight}kg.
  - Condiciones: ${profile.medicalHistory.chronicConditions.join(', ')}
  - Última lectura de presión: ${lastLog ? `${lastLog.systolic}/${lastLog.diastolic} mmHg` : 'No disponible'}
  
  REQUERIMIENTOS DEL PLAN:
  1. Define límites de Sodio, Potasio y Magnesio para hoy.
  2. Proporciona 4 comidas: Desayuno, Almuerzo, Merienda/Snack y Cena.
  
  DEVUELVE EXCLUSIVAMENTE UN JSON:
  {
    "date": "2025-05-20",
    "sodiumLimit": "1.2g",
    "potassiumTarget": "4.5g",
    "magnesiumTarget": "420mg",
    "meals": [
      {
        "time": "08:00 AM",
        "title": "Nombre del plato",
        "description": "Breve descripción",
        "quantities": "Cantidades detalladas",
        "nutrients": ["Sodio: Xmg", "Potasio: Ymg", "Magnesio: Zmg", "Fibra: Wg"],
        "cellularBenefit": "Explicación breve del impacto celular",
        "type": "breakfast",
        "imageSearchTerm": "termino para buscar imagen"
      }
    ],
    "overallAdvice": "Consejo general"
  }`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  const cleanedText = cleanJsonString(response.text || "");
  return JSON.parse(cleanedText);
};

export const getHealthInsight = async (
  systolic: number, 
  diastolic: number, 
  pulse: number, 
  history: MedicalHistory,
  logContext: VitalLog,
  masScore: number 
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let contextStr = `
    DATOS CLÍNICOS DEL PACIENTE: 
    - Historial Médico: ${history.chronicConditions.join(', ')}
    - Score de Adherencia Terapéutica (MAS): ${masScore}%
  `;

  if (logContext) {
    contextStr += `
    CONTEXTO DE LA MEDICIÓN ACTUAL:
    - Momento del día: ${logContext.momentOfDay}
    - Estado físico: ${logContext.physicalState}
    - Síntomas: ${logContext.symptoms.filter(s => s !== 'none').join(', ') || 'Ninguno'}
    - Meds hoy: ${logContext.medication.takenToday ? 'SÍ' : 'NO'}
    `;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Actúa como un cardiólogo experto. Analiza estos signos vitales: Sístole ${systolic} mmHg, Diástole ${diastolic} mmHg, Pulso ${pulse} lpm.
    ${contextStr}
    
    Proporciona un JSON con status, message, probabilityLevel, recommendations, cellularNutrition y triggerUrgentConsult.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING, enum: ["optimal", "warning", "critical"] },
          message: { type: Type.STRING },
          probabilityLevel: { type: Type.STRING, enum: ["Baja", "Media", "Alta"] },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          cellularNutrition: { type: Type.STRING },
          triggerUrgentConsult: { type: Type.BOOLEAN }
        },
        required: ["status", "message", "probabilityLevel", "recommendations", "cellularNutrition", "triggerUrgentConsult"]
      }
    }
  });

  const cleanedText = cleanJsonString(response.text || "");
  const parsed = JSON.parse(cleanedText);
  return { ...parsed, adherenceScore: masScore };
};
