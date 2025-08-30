# 🔥 Firebase Configuration Setup

## 🚨 IMPORTANTE: Sicurezza Firebase

Il file `js/firebase-config.js` contiene informazioni sensibili e **NON deve essere committato** nel repository.

## 🛠️ Setup Iniziale

1. **Copia il template:**
   ```bash
   cp js/firebase-config.template.js js/firebase-config.js
   ```

2. **Sostituisci i placeholder** nel file `js/firebase-config.js` con i tuoi valori reali da Firebase Console:
   - `YOUR_API_KEY_HERE` → La tua API Key
   - `your-project.firebaseapp.com` → Il tuo Auth Domain
   - `your-project-id` → Il tuo Project ID
   - `your-project.firebasestorage.app` → Il tuo Storage Bucket
   - `YOUR_SENDER_ID` → Il tuo Messaging Sender ID
   - `YOUR_APP_ID` → Il tuo App ID
   - `YOUR_MEASUREMENT_ID` → Il tuo Measurement ID

3. **Il file sarà ignorato** da Git automaticamente grazie al `.gitignore`

## 🔧 Dove trovare i valori Firebase

1. Vai su [Firebase Console](https://console.firebase.google.com)
2. Seleziona il tuo progetto
3. Vai su **Project Settings** (icona ingranaggio)
4. Scorri fino a **Your apps** e seleziona la tua Web App
5. Copia i valori dalla sezione **Firebase SDK snippet**

## 🌐 Deploy su Hosting (GitHub Pages)

Per il deploy su GitHub Pages, dovrai:

1. **Usare variabili d'ambiente del browser** (per chiavi pubbliche come apiKey)
2. **Configurare le regole Firebase** per limitare l'accesso per dominio
3. **Usare GitHub Secrets** per automatizzare il deploy

## 📝 Nota per il Team

Ogni sviluppatore deve:
1. Creare il proprio `js/firebase-config.js` dal template
2. **MAI** committare questo file
3. Usare lo stesso progetto Firebase per consistency
