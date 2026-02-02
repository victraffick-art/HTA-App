
import { GoogleGenAI, Type } from "@google/genai";
import { MedicalHistory, VitalLog } from "../types";

const cleanJsonString = (str: string) => {
  return str.replace(/```json|```/gi, '').trim();
};

export const getNutritionAdvice = async (mealTitle: string, history: MedicalHistory) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analiza el plato "${mealTitle}" para un paciente con: ${history.chronicConditions.join(', ') || 'Hipertensión'}. Explica su beneficio para la salud celular y control de presión arterial. Sé conciso, máximo 2 frases.`,
  });
  return response.text || "Consulta no disponible en este momento.";
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
    - Cirugías: ${history.surgeries || 'Ninguna'}
    - Fumador: ${history.smoker ? 'Sí' : 'No'}
    - Alcohol: ${history.alcoholConsumption}
    - Medicación actual registrada en historial: ${history.currentMedications.map(m => `${m.name} (${m.dose})`).join(', ')}
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
    - Sueño previo: ${logContext.sleep.hours}h (Calidad: ${logContext.sleep.quality ? 'Reparador' : 'No reparador'})
    `;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Actúa como un cardiólogo experto. Analiza estos signos vitales: Sístole ${systolic} mmHg, Diástole ${diastolic} mmHg, Pulso ${pulse} lpm.
    ${contextStr}
    
    REGLA DE ORO: Clasifica según la GUÍA AHA/ACC 2025 de Hipertensión Arterial:
    - Normal: <120/<80
    - Elevada: 120-129/<80
    - HTA Grado 1: 130-139 o 80-89
    - HTA Grado 2: >=140 o >=90
    - Crisis Hipertensiva: >180 y/o >120
    
    INSTRUCCIONES DE RESPUESTA:
    1. Evalúa el riesgo cardiovascular inmediato correlacionando la presión con los síntomas de alarma (dolor de pecho, visión borrosa, etc.) y la falta de adherencia (MAS).
    2. NUTRICIÓN CELULAR: Brinda una recomendación específica de medicina ortomolecular o nutrición celular (ej. magnesio, potasio, antioxidantes endoteliales) según el estado actual.
    3. RECOMENDACIONES: Acciones de estilo de vida urgentes.
    4. CONSULTA: Activa triggerUrgentConsult si hay crisis o HTA Grado 2 con síntomas.
    
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
