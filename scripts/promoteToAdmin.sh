#!/bin/bash
# Script para obtener el UID del usuario actual y luego promover a admin
# Uso: bash scripts/promoteToAdmin.sh

set -e

PROJECT_ID="fitness-dfbb4"

echo "🔍 Obteniendo usuarios de Firebase Auth..."
echo ""

# Listar usuarios de Firebase
firebase auth:list --project="$PROJECT_ID" | head -20

echo ""
echo "📋 Instrucciones:"
echo "1. Copia el UID del usuario que deseas promover (columna UID)"
echo "2. Ejecuta: npx tsx scripts/promoteToAdmin.ts <UID>"
echo ""
echo "Ejemplo:"
echo "   npx tsx scripts/promoteToAdmin.ts ZfrDygEd36YqiMuvhhCdtw3G3UB2"
