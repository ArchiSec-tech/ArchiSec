#!/bin/bash

# ArchiSec Security Scanner - Script di Avvio
# Avvia il server Flask per l'integrazione con lo scanner Python

echo "🛡️  ArchiSec Security Scanner - Avvio Server"
echo "============================================"

# Controlla se Python 3 è installato
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 non trovato. Installa Python 3 per continuare."
    exit 1
fi

# Controlla se pip è installato
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 non trovato. Installa pip per continuare."
    exit 1
fi

# Controlla se l'ambiente virtuale esiste, altrimenti crealo
if [ ! -d "scanner_env" ]; then
    echo "🔧 Creazione ambiente virtuale Python..."
    python3 -m venv scanner_env
fi

# Attiva l'ambiente virtuale
echo "🔗 Attivazione ambiente virtuale..."
source scanner_env/bin/activate

# Installa le dipendenze se necessario
echo "📦 Installazione dipendenze Python..."
pip install -r requirements.txt

# Controlla se il file security_scanner.py esiste
SCANNER_PATH="/home/fra/Documenti/Security Automation Script/security_scanner.py"
if [ ! -f "$SCANNER_PATH" ]; then
    echo "❌ File security_scanner.py non trovato in: $SCANNER_PATH"
    echo "   Verifica il percorso nel file security_scanner_api.py"
    exit 1
fi

echo "✅ Security scanner trovato"
echo "🚀 Avvio server API su porta 5000..."
echo ""
echo "   Frontend: http://localhost:8000 (apri index.html)"
echo "   API:      http://localhost:5000"
echo ""
echo "Premi Ctrl+C per fermare il server"
echo ""

# Avvia il server Flask
export PYTHONPATH="${PYTHONPATH}:/home/fra/Documenti/Security Automation Script"
export DEBUG=true
python3 api/security_scanner_api.py
