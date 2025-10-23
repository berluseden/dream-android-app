# ⚠️ IMPORTANTE: Seguridad de API Keys de OpenAI

## 🔐 API Key Comprometida

La API key que compartiste en el chat está ahora **COMPROMETIDA** y debe ser revocada inmediatamente:

```
sk-svcacct-Sd603CyogHIw60lD_A7iErmfXyu8-iE1FjuhYvO0uxmUdHJrdTiD5JHypgCgwYfVyZT3BlbkFJV9J6BnN3dX3fBw8uR9z4HTFf-RF-zB7rZVo1i0Qqm7p3RpTco4TV5YKLltUeXhSykA
```

### Pasos Inmediatos:

1. **Revocar la key actual**:
   - Ve a https://platform.openai.com/api-keys
   - Encuentra la key comprometida
   - Haz clic en "Revoke" o "Delete"

2. **Generar nueva key**:
   - En el mismo dashboard, crea una nueva API key
   - Cópiala inmediatamente (solo se muestra una vez)

3. **Actualizar configuración**:
   ```bash
   # En functions/.env
   OPENAI_API_KEY=tu-nueva-key-aqui
   
   # O en Firebase Functions
   cd functions
   firebase functions:config:set openai.key="tu-nueva-key-aqui"
   ```

## ✅ Configuración Actual Implementada

### Archivo: `functions/src/ai.ts`

```typescript
export const DEFAULT_AI_CONFIG = {
  model: 'gpt-4o',                    // Modelo principal
  max_completion_tokens: 4000,        // Límite de tokens de salida
  reasoning_effort: 'medium',         // Nivel de razonamiento: low|medium|high
  temperature: 0.7,                   // Creatividad
};
```

### Todas las funciones actualizadas:
- ✅ `aiSuggestWorkoutTweaks` - Usa `gpt-4o` con 4000 tokens max
- ✅ `aiGenerateProgram` - Usa `gpt-4o` con 4000 tokens max
- ✅ `aiSummarizeCheckIn` - Usa `gpt-4o` con 4000 tokens max

## 🔒 Seguridad de API Keys - Mejores Prácticas

### ❌ NUNCA hagas esto:
```typescript
// ❌ MALO: Hardcodear la key en el código
const apiKey = "sk-...";

// ❌ MALO: Exponerla en variables de entorno del cliente
VITE_OPENAI_API_KEY=sk-...

// ❌ MALO: Commitear archivos .env
git add .env
```

### ✅ SIEMPRE haz esto:
```typescript
// ✅ BUENO: Usar variables de entorno del servidor
const key = process.env.OPENAI_API_KEY;

// ✅ BUENO: Mantener .env en .gitignore
echo ".env" >> .gitignore

// ✅ BUENO: Usar Firebase Functions config
firebase functions:config:set openai.key="sk-..."
```

## 📝 Archivos Creados/Actualizados

1. **`functions/src/ai.ts`**
   - Añadida configuración `DEFAULT_AI_CONFIG`
   - Todas las funciones usan ahora `gpt-4o`
   - Límite de tokens: 4000
   - Soporte para reasoning_effort

2. **`functions/.env`**
   - Contiene la API key (TEMPORAL - debe ser reemplazada)
   - Excluido de Git

3. **`functions/.gitignore`**
   - Asegura que `.env` no se commitee
   - Protege archivos sensibles

## 🚀 Próximos Pasos

1. **Revocar y reemplazar la API key inmediatamente**
2. **Desplegar las funciones actualizadas**:
   ```bash
   cd functions
   npm run build
   firebase deploy --only functions
   ```

3. **Verificar que funciona**:
   - Prueba las funciones AI desde la app
   - Revisa los logs de Firebase Functions
   - Monitorea el uso en OpenAI dashboard

## 💰 Consideraciones de Costo

- `gpt-4o` es más caro que `gpt-4o-mini`
- Con 4000 tokens max, cada llamada puede ser significativa
- Monitorea el uso en: https://platform.openai.com/usage

### Precios aproximados (Oct 2024):
- **gpt-4o**: ~$0.015/1K tokens input, ~$0.060/1K tokens output
- **gpt-4o-mini**: ~$0.00015/1K tokens input, ~$0.0006/1K tokens output

**Recomendación**: Para desarrollo/testing, considera volver a `gpt-4o-mini` y usar `gpt-4o` solo en producción.

## 📚 Documentación

- [OpenAI API Docs](https://platform.openai.com/docs)
- [Firebase Functions Environment Config](https://firebase.google.com/docs/functions/config-env)
- [OpenAI Best Practices](https://platform.openai.com/docs/guides/production-best-practices)
