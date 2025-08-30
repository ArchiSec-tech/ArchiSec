# Sistema di Autenticazione Firebase - ArchiTech

## 📁 Struttura Progetto

```
/autohtml-project
├── index.html                 # Homepage principale
├── signup.html               # Pagina registrazione
├── login.html                # Pagina login
├── css/
│   └── auth.css              # Stili per l'autenticazione
└── js/
    ├── firebase-config.js    # Configurazione Firebase
    ├── auth.js              # Logica autenticazione
    └── main.js              # Script principale esistente
```

## 🚀 Configurazione Firebase

### 1. Crea un Progetto Firebase
1. Vai su [Firebase Console](https://console.firebase.google.com)
2. Clicca su "Crea un progetto"
3. Scegli un nome (es: "architech-cybersecurity")
4. Abilita Google Analytics se desideri

### 2. Configura l'App Web
1. Nel pannello del progetto, clicca sull'icona `</>` per "Aggiungi app"
2. Registra l'app con un nome (es: "ArchiTech Web App")
3. Copia le credenziali di configurazione

### 3. Configura Authentication
1. Vai su "Authentication" > "Sign-in method"
2. Abilita "Email/Password"
3. (Opzionale) Abilita altri provider come Google, Facebook

### 4. Configura Firestore Database
1. Vai su "Firestore Database"
2. Clicca "Crea database"
3. Inizia in modalità test (regole di sicurezza di base)
4. Scegli la regione più vicina

### 5. Aggiorna firebase-config.js
Sostituisci i valori in `js/firebase-config.js` con quelli del tuo progetto:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id-here"
};
```

## 📋 Funzionalità Implementate

### ✅ Registrazione Utenti
- **Modal nella homepage**: Cliccando su "SIGN UP"
- **Pagina dedicata**: `signup.html`
- **Dati salvati**: Nome, Email, Azienda, Telefono, Timestamp

### ✅ Login Utenti  
- **Modal nella homepage**: Switch dal modal di registrazione
- **Pagina dedicata**: `login.html`
- **Reset password**: Funzionalità integrata

### ✅ Logout
- **Automatico**: Quando l'utente è loggato, il pulsante "SIGN UP" diventa un menu utente con logout

### ✅ Gestione Stato Utente
- **Auto-login**: L'utente rimane loggato tra le sessioni
- **UI dinamica**: L'interfaccia si aggiorna in base allo stato di login

## 🛠️ Come Usare

### Opzione 1: Modal (Homepage)
1. L'utente clicca su "SIGN UP" nella navbar
2. Si apre un modal con form di registrazione
3. Può switchare al login dal link nel modal

### Opzione 2: Pagine Dedicate
1. Vai direttamente su `/signup.html` o `/login.html`
2. Form full-page più puliti e professionali
3. Reindirizzamento automatico alla homepage dopo login/signup

## 🗄️ Struttura Database Firestore

### Collection: `users`
```javascript
{
  uid: "firebase-user-id",
  name: "Nome Completo",
  email: "email@example.com", 
  company: "Nome Azienda",
  phone: "+39123456789",
  role: "user", 
  isActive: true,
  createdAt: timestamp
}
```

## 🔧 Personalizzazioni

### Modificare i Campi del Signup
Edita i file:
- `js/auth.js` (per il modal)
- `signup.html` (per la pagina dedicata)

### Modificare gli Stili
Edita `css/auth.css` per personalizzare l'aspetto dei modal e form.

### Aggiungere Validazioni
Le validazioni possono essere aggiunte nei file JavaScript prima di chiamare Firebase.

## 🚨 Note Importanti

1. **Regole Firestore**: In produzione, configura regole di sicurezza appropriate
2. **HTTPS**: Firebase richiede HTTPS per funzionare in produzione
3. **Domini autorizzati**: Aggiungi i tuoi domini nella console Firebase
4. **Backup**: Configura backup automatici per Firestore

## 🐛 Troubleshooting

### Errori Comuni
- **"Firebase not defined"**: Controlla che gli script siano caricati nell'ordine corretto
- **"Auth domain not authorized"**: Aggiungi il dominio nella console Firebase
- **"Missing config"**: Verifica la configurazione in `firebase-config.js`

### Console del Browser
Controlla sempre la console del browser (F12) per errori dettagliati.

## 📞 Supporto
Per problemi tecnici, controlla:
1. Console del browser per errori JavaScript
2. Tab "Network" per errori di caricamento
3. Firebase Console per log degli errori
