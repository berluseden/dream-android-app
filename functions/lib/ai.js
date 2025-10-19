"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiSummarizeCheckIn = exports.aiGenerateProgram = exports.aiSuggestWorkoutTweaks = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const openai_1 = __importDefault(require("openai"));
// Nota: La API Key de OpenAI debe configurarse como variable de entorno del backend (no del cliente)
// firebase functions:config:set openai.key="sk-..."
// y luego acceder vía functions.config().openai.key
const getOpenAIClient = () => {
    var _a, _b;
    const key = process.env.OPENAI_API_KEY || ((_b = (_a = functions.config()) === null || _a === void 0 ? void 0 : _a.openai) === null || _b === void 0 ? void 0 : _b.key);
    if (!key) {
        throw new functions.https.HttpsError('failed-precondition', 'OpenAI API key not configured. Set OPENAI_API_KEY env or use: firebase functions:config:set openai.key="..."');
    }
    return new openai_1.default({ apiKey: key });
};
async function getUserProfile(uid) {
    const db = admin.firestore();
    const doc = await db.collection('users').doc(uid).get();
    return (doc.exists ? doc.data() : {}) || {};
}
exports.aiSuggestWorkoutTweaks = functions.https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }
    const { workout, recentStats, goal } = data;
    const openai = getOpenAIClient();
    const user = (await getUserProfile(context.auth.uid)) || {};
    const system = `Eres un coach de fuerza y fisicoculturismo. Da recomendaciones concretas, seguras y accionables.
Responde en español con bullets cortos. Si falta información, asume prácticas conservadoras.`;
    const userMsg = {
        role: 'user',
        content: [
            { type: 'text', text: `Perfil: ${JSON.stringify({ goal: (_a = goal !== null && goal !== void 0 ? goal : user.goal) !== null && _a !== void 0 ? _a : null, level: (_b = user.level) !== null && _b !== void 0 ? _b : null, age: (_c = user.age) !== null && _c !== void 0 ? _c : null, sex: (_d = user.sex) !== null && _d !== void 0 ? _d : null })}` },
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
            userMsg
        ]
    });
    const text = ((_g = (_f = (_e = chat.choices) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.message) === null || _g === void 0 ? void 0 : _g.content) || '';
    return { suggestions: text };
});
exports.aiGenerateProgram = functions.https.onCall(async (data, context) => {
    var _a, _b, _c;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }
    const { goal, daysPerWeek, equipment, experience } = data;
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
    let content = ((_c = (_b = (_a = chat.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) || '';
    // Intentar extraer JSON válido
    content = content.trim();
    try {
        const json = JSON.parse(content);
        return { program: json };
    }
    catch (e) {
        // Fallback: intentar limpiar bloques de markdown
        const cleaned = content.replace(/^```(?:json)?/g, '').replace(/```$/g, '').trim();
        try {
            const json = JSON.parse(cleaned);
            return { program: json };
        }
        catch (e2) {
            throw new functions.https.HttpsError('internal', 'Respuesta inválida del modelo');
        }
    }
});
exports.aiSummarizeCheckIn = functions.https.onCall(async (data, context) => {
    var _a, _b, _c;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }
    const { checkIn } = data;
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
    const text = ((_c = (_b = (_a = chat.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) || '';
    return { summary: text };
});
//# sourceMappingURL=ai.js.map