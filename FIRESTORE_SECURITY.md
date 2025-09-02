# Regole di Sicurezza Firestore per ArchiSec - **AGGIORNATE**

## ⚠️ **PROBLEMA RISOLTO**: Regole aggiornate per permessi corretti

Le regole sono state **completamente rivisitate** per risolvere i problemi di permessi che impedivano il corretto funzionamento del sistema Firebase.

## Come applicare le regole

1. Vai su [Firebase Console](https://console.firebase.google.com)
2. Seleziona il progetto `architech-project-9b91e`
3. Menu laterale → **Firestore Database** → **Rules**
4. Copia e incolla il contenuto di `firestore.rules`
5. Clicca **Publish**

## 🔄 **MODIFICHE PRINCIPALI**

### **Problemi Risolti:**
1. ✅ **Regola di default troppo restrittiva** - Ora permette operazioni per utenti autenticati
2. ✅ **Mancanza permessi di aggiornamento** - Aggiunti permessi `update` dove necessario  
3. ✅ **Validazione campi troppo rigida** - Semplificata validazione per sviluppo
4. ✅ **Permessi analytics insufficienti** - Aperte le collezioni per il corretto funzionamento

### **Nuove Regole di Sviluppo:**
- **Collezioni analytics**: Completamente aperte per il funzionamento corretto
- **Lead capture**: Permessi ampliati per creazione e lettura
- **Regola fallback**: Utenti autenticati hanno accesso generale (per sviluppo)
- **Collezione temp**: Aggiunta per test e debug

## Cosa permettono queste regole

### ✅ Permesso

**Autenticazione e Utenti:**
- **Utenti autenticati**: possono leggere/scrivere i propri dati in `/users/{userId}`
- **Registrazione**: nuovo utente può creare il proprio profilo con campi validati
- **Aggiornamento profilo**: utente può aggiornare i propri dati (non ruolo)

**Lead Generation (anche utenti anonimi):**
- **Form contatti**: chiunque può inviare form contatti in `/contacts/{docId}`
- **Richieste consulenza**: chiunque può richiedere consulenze in `/consultations/{docId}`
- **Newsletter**: chiunque può iscriversi alla newsletter in `/newsletter_subscriptions/{docId}`
- **Demo requests**: chiunque può richiedere demo in `/demo_requests/{docId}`

**Analytics e Tracking (essenziale per business):**
- **User Analytics**: tracking comportamento utenti in `/user_analytics/{docId}`
- **Lead Management**: gestione lead automatica in `/leads/{docId}`
- **Business Metrics**: KPI e metriche in `/business_metrics/{docId}`
- **User Sessions**: tracking sessioni in `/user_sessions/{docId}`
- **Conversions**: tracking conversioni in `/conversions/{docId}` e `/lead_conversions/{docId}`

**Contenuti e Interazioni:**
- **Blog Comments**: chiunque può commentare in `/blog_comments/{docId}`
- **Security Logs**: sistema può creare log di sicurezza in `/security_logs/{docId}`
- **Service Interactions**: tracking interazioni servizi in `/service_interactions/{docId}`

**Dati Pubblici:**
- **Public Data**: chiunque può leggere `/public/{docId}` (pricing, servizi, ecc.)

### ❌ Negato

- **Cross-user access**: utente A non può vedere dati privati di utente B
- **Modifica ruoli**: utenti non possono cambiare il proprio ruolo
- **Collezioni non specificate**: tutto il resto è bloccato
- **Eliminazione dati**: solo lettura/creazione/aggiornamento permessi

## Collezioni supportate

```
📊 ANALYTICS E TRACKING
/user_analytics/{docId}          // Eventi comportamento utenti
/user_sessions/{docId}           // Sessioni complete
/business_metrics/{docId}        // KPI e metriche business
/security_logs/{docId}           // Log sicurezza automatici

🎯 LEAD MANAGEMENT
/leads/{docId}                   // Database lead con scoring
/conversions/{docId}             // Conversioni generiche
/lead_conversions/{docId}        // Conversioni dettagliate lead

📧 MARKETING E COMUNICAZIONE
/newsletter_subscriptions/{docId} // Iscrizioni newsletter
/contacts/{docId}                // Form contatti
/consultations/{docId}           // Richieste consulenza
/demo_requests/{docId}           // Richieste demo
/pricing_inquiries/{docId}       // Richieste informazioni pricing

👥 UTENTI E CONTENUTI
/users/{userId}                  // Profili utenti (privati)
/blog_comments/{docId}           // Commenti blog (pubblici)
/service_interactions/{docId}    // Interazioni servizi

🌐 DATI PUBBLICI
/public/pricing                  // Dati pubblici pricing
/public/services                 // Dati pubblici servizi
```

## Per sviluppo/test

Se hai bisogno di regole più permissive temporaneamente (SOLO PER SVILUPPO):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **MAI usare in produzione!**

## Sicurezza aggiuntiva

1. **Domains allowlist**: vai su Authentication → Settings → Authorized domains
2. **API Key restrictions**: vai su Google Cloud Console → Credentials  
3. **Backup regolare**: imposta backup automatici in Firestore
4. **Monitoring**: abilita audit logs per monitorare accessi

## Note Importanti

### Lead Generation
- I form possono essere compilati anche da utenti anonimi per massimizzare conversioni
- I dati vengono associati all'utente se successivamente si registra
- Sistema di lead scoring funziona automaticamente

### Privacy e GDPR
- Dati utente privati protetti per GDPR compliance
- Analytics anonimizzati dove possibile
- Newsletter con opt-in esplicito

### Performance
- Regole ottimizzate per minimizzare le chiamate database
- Indexing automatico per query frequenti
- Cache-friendly per analytics real-time

## Collezioni consigliate

```
/users/{userId}                 // Profili utenti
/consultations/{docId}          // Richieste di consulenza
/security_logs/{docId}          // Log attività (read-only per utenti)
/public/pricing                 // Dati pubblici pricing
/public/services               // Dati pubblici servizi
```

## Per sviluppo/test

Se hai bisogno di regole più permissive temporaneamente:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Sicurezza aggiuntiva

1. **Domains allowlist**: vai su Authentication → Settings → Authorized domains
2. **API Key restrictions**: vai su Google Cloud Console → Credentials
3. **Backup regolare**: imposta backup automatici in Firestore
