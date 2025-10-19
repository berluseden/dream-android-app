import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';

// Nota: La API Key de OpenAI debe configurarse como variable de entorno del backend (no del cliente)
// firebase functions:config:set openai.key="sk-..."
// y luego acceder vía functions.config().openai.key

const getOpenAIClient = () => {
  const key = (process.env.OPENAI_API_KEY as string | undefined) || (functions.config()?.openai?.key as string | undefined);
  if (!key) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'OpenAI API key not configured. Set OPENAI_API_KEY env or use: firebase functions:config:set openai.key="..."'
    );
  }
  return new OpenAI({ apiKey: key });
};

// Tipado básico de perfil de usuario para AI y helper para obtenerlo
interface UserProfile {
  goal?: string;
  level?: string;
  age?: number;
  sex?: string;
}

async function getUserProfile(uid: string): Promise<Partial<UserProfile>> {
  const db = admin.firestore();
  const doc = await db.collection('users').doc(uid).get();
  return (doc.exists ? (doc.data() as Partial<UserProfile>) : {}) || {};
}

export const aiSuggestWorkoutTweaks = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { workout, recentStats, goal } = data as {
    workout: any;
    recentStats?: any;
    goal?: string;
  };

  const openai = getOpenAIClient();
  const user = (await getUserProfile(context.auth.uid)) || {};

  const system = `Eres un coach de fuerza y fisicoculturismo. Da recomendaciones concretas, seguras y accionables.
Responde en español con bullets cortos. Si falta información, asume prácticas conservadoras.`;

  const userMsg = {
    role: 'user' as const,
    content: [
  { type: 'text', text: `Perfil: ${JSON.stringify({ goal: goal ?? (user as UserProfile).goal ?? null, level: (user as UserProfile).level ?? null, age: (user as UserProfile).age ?? null, sex: (user as UserProfile).sex ?? null })}` },
      { type: 'text', text: `Entrenamiento del día: ${JSON.stringify(workout)}` },
      { type: 'text', text: `Tendencias recientes: ${JSON.stringify(recentStats || {})}` },
      { type: 'text', text: 'Devuelve máximo 6 bullets: volumen (series), intensidad (RIR/%), ajustes de ejercicios, y notas de técnica.' }
    ]
  };

  const chat = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.4,
    messages: [
      { role: 'system', content: system },
      userMsg as any
    ]
  });

  const text = chat.choices?.[0]?.message?.content || '';
  return { suggestions: text };
});

export const aiGenerateProgram = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { goal, daysPerWeek, equipment, experience } = data as {
    goal: 'hypertrophy' | 'strength' | 'fatloss' | string;
    daysPerWeek: number;
    equipment?: string[];
    experience?: 'beginner' | 'intermediate' | 'advanced' | string;
  };

  if (!goal || !daysPerWeek) {
    throw new functions.https.HttpsError('invalid-argument', 'goal y daysPerWeek son requeridos');
  }

  const openai = getOpenAIClient();

  const system = `Eres un generador de programas. Devuelve JSON estrictamente válido que cumpla este esquema:
{
  "name": string,
  "description": string,
  "days_per_week": number,
  "level": string,
  "duration_weeks": number,
  "sessions": [
    { "name": string, "blocks": [
      { "exercise": string, "sets": number, "reps": string | number, "rir": number, "rest": string }
    ]}
  ]
}
No incluyas comentarios ni texto extra.`;

  const userPrompt = `Objetivo: ${goal}. Días/semana: ${daysPerWeek}. Nivel: ${experience || 'intermediate'}.
Equipo disponible: ${(equipment || []).join(', ') || 'gimnasio completo'}.
Preferencias: volumen moderado, técnica estricta, progresión lineal simple.
Usa nombres de ejercicios comunes y claros en español.`;

  const chat = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userPrompt }
    ]
  });

  let content = chat.choices?.[0]?.message?.content || '';
  // Intentar extraer JSON válido
  content = content.trim();
  try {
    const json = JSON.parse(content);
    return { program: json };
  } catch (e) {
    // Fallback: intentar limpiar bloques de markdown
    const cleaned = content.replace(/^```(?:json)?/g, '').replace(/```$/g, '').trim();
    try {
      const json = JSON.parse(cleaned);
      return { program: json };
    } catch (e2) {
      throw new functions.https.HttpsError('internal', 'Respuesta inválida del modelo');
    }
  }
});

export const aiSummarizeCheckIn = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { checkIn } = data as { checkIn: any };
  const openai = getOpenAIClient();

  const system = `Eres un coach. Resume un check-in semanal en español, tono profesional y empático.
Devuelve:
- Estado general (fatiga, rendimiento, adherencia)
- Riesgos/alertas
- Enfoque para la semana (volumen por grupos, RIR, cardio)
Máximo 120 palabras.`;

  const msg = JSON.stringify(checkIn || {});
  const chat = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.5,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: msg }
    ]
  });

  const text = chat.choices?.[0]?.message?.content || '';
  return { summary: text };
});
