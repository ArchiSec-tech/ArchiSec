# Regole di Sicurezza Firestore per ArchiSec

## Come applicare le regole

1. Vai su [Firebase Console](https://console.firebase.google.com)
2. Seleziona il progetto `architech-project-9b91e`
3. Menu laterale → **Firestore Database** → **Rules**
4. Copia e incolla il contenuto di `firestore.rules`
5. Clicca **Publish**

## Cosa permettono queste regole

### ✅ Permesso
- **Utenti autenticati**: possono leggere/scrivere i propri dati in `/users/{userId}`
- **Registrazione**: nuovo utente può creare il proprio profilo con campi validati
- **Aggiornamento profilo**: utente può aggiornare nome, azienda, telefono (non ruolo/stato)
- **Richieste consulenza**: utenti autenticati possono creare richieste in `/consultations/{docId}`
- **Dati pubblici**: chiunque può leggere `/public/{docId}` (per pricing, servizi, ecc.)

### ❌ Negato
- **Cross-user access**: utente A non può vedere dati di utente B
- **Modifica ruoli**: utenti non possono cambiare il proprio ruolo da 'user' ad 'admin'
- **Accesso non autenticato**: serve login per la maggior parte delle operazioni
- **Collezioni non specificate**: tutto il resto è bloccato

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
