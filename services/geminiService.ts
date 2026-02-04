
import { GoogleGenAI, Type } from "@google/genai";
import { MedicalHistory, VitalLog, DailyNutritionPlan } from "../types";

const cleanJsonString = (str: string) => {
  return str.replace(/```json|```/gi, '').trim();
};

export const analyzeFoodImage = async (base64Image: string, profile: any, lastLog: VitalLog | undefined) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Actúa como el motor de análisis de salud y visión de "Infinity-Flow".
  MISIÓN: Analizar la foto del plato del usuario, verificar cumplimiento DASH/Ortomolecular y gamificar la experiencia.
  
  DATOS DEL PACIENTE:
  - Edad: ${profile.age}, Peso: ${profile.weight}kg.
  - Última Presión: ${lastLog ? `${lastLog.systolic}/${lastLog.diastolic} mmHg` : 'Desconocida'}.
  
  PROTOCOLO DE ANÁLISIS:
  1. Identifica alimentos y estima Sodio/Potasio.
  2. Asigna puntos: 10 (Excelente DASH), 5 (Aceptable), 0 (Procesados/Peligrosos).
  3. Genera un mensaje motivador para la comunidad.
  4. Si el plato no es apto, sugiere reemplazo inmediato.
  5. Ajusta la recomendación de gramajes para el siguiente tiempo de comida basado en lo detectado.

  RESPONDE EXCLUSIVAMENTE EN JSON:
  {
    "score": number,
    "identifiedFoods": string[],
    "feedback": "Mensaje del Coach Médico",
    "communityMessage": "¡Usuario X ha cumplido su meta DASH! 🚀",
    "nutritionalImpact": { "sodium": "Xmg", "potassium": "Ymg" },
    "nextStepAdjustment": "Recomendación ajustada de gramajes y nutrientes para la siguiente comida",
    "isApt": boolean
  }`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: prompt }
      ]
    },
    config: { responseMimeType: "application/json" }
  });

  return JSON.parse(cleanJsonString(response.text || "{}"));
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
  Genera un PLAN NUTRICIONAL DIARIO basado estrictamente en la DIETA DASH y los principios de salud de ELLEN WHITE (énfasis en plantas, cereales integrales, legumbres, frutas y frutos secos, con temperancia extrema en sal y azúcares).
  
  PERFIL DEL PACIENTE:
  - Edad: ${profile.age} años, Peso: ${profile.weight}kg, Altura: ${profile.height}cm.
  - Condiciones: ${profile.medicalHistory.chronicConditions.join(', ')}
  - Última lectura de presión: ${lastLog ? `${lastLog.systolic}/${lastLog.diastolic} mmHg` : 'No disponible'}
  
  REQUERIMIENTOS DEL PLAN:
  1. Define límites de Sodio, Potasio y Magnesio para hoy.
  2. Proporciona 4 comidas: Desayuno, Almuerzo, Merienda/Snack y Cena.
  3. Para cada comida incluye: Cantidades exactas (ej: 1/2 taza), Nutrientes clave aportados y el Beneficio Celular específico.
  
  DEVUELVE EXCLUSIVAMENTE UN JSON con esta estructura:
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
        "cellularBenefit": "Explicación breve del impacto en el endotelio o mitocondria",
        "type": "breakfast",
        "imageSearchTerm": "termino para buscar imagen"
      }
    ],
    "overallAdvice": "Consejo general del día basado en medicina ortomolecular"
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
    - Alergias: ${history.allergies || 'Ninguna'}
    - Score de Adherencia Terapéutica (MAS): ${masScore}%
  `;

  if (logContext) {
    const activeConsumptions = Object.entries(logContext.consumptions)
      .filter(([_, value]) => value)
      .map(([key]) => key)
      .join(', ');

    contextStr += `
    CONTEXTO DE LA MEDICIÓN ACTUAL:
    - Momento del día: ${logContext.momentOfDay}
    - Estado físico: ${logContext.physicalState}
    - Síntomas de alarma reportados: ${logContext.symptoms.filter(s => s !== 'none').join(', ') || 'Ninguno'}
    - Consumos en últimas 6h: ${activeConsumptions || 'Ninguno relevante'}
    - Medicación hoy: ${logContext.medication.takenToday ? 'SÍ (Todo en orden)' : 'NO / OLVIDO (Riesgo Adherencia)'}
    `;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Actúa como un cardiólogo experto. Analiza estos signos vitales: Sístole ${systolic} mmHg, Diástole ${diastolic} mmHg, Pulso ${pulse} lpm.
    ${contextStr}
    
    REGLA DE ORO: Clasifica según la GUÍA AHA/ACC 2025 de Hipertensión Arterial.
    Proporciona un JSON con esta estructura:
    {
      "status": "optimal" | "warning" | "critical",
      "message": "Análisis clínico detallado bajo AHA/ACC 2025",
      "probabilityLevel": "Baja" | "Media" | "Alta",
      "recommendations": ["Lista de acciones concretas"],
      "cellularNutrition": "Recomendación ortomolecular/celular para restaurar balance",
      "triggerUrgentConsult": boolean
    }`,
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
