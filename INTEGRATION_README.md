# ArchiSec Security Scanner - Integrazione Completa

## 🛡️ Panoramica

Questa integrazione collega lo script Python `security_scanner.py` con l'interfaccia web di ArchiSec, permettendo scansioni di sicurezza reali direttamente dal sito web.

## 📋 Prerequisiti

### Software Richiesto
- **Python 3.8+** con pip
- **Browser moderno** (Chrome, Firefox, Safari, Edge)
- **Server web locale** (opzionale, per sviluppo)

### Dipendenze Python
Le dipendenze sono gestite automaticamente dallo script di avvio:
- Flask 2.3.3
- Flask-CORS 4.0.0
- Requests 2.31.0
- python-dateutil 2.8.2

## 🚀 Installazione e Avvio

### Metodo Rapido (Script Automatico)
```bash
cd /home/fra/Documenti/autohtml-project
./start_scanner.sh
```

### Metodo Manuale
```bash
# 1. Installa dipendenze
pip3 install -r requirements.txt

# 2. Configura PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:/home/fra/Documenti/Security Automation Script"

# 3. Avvia API server
python3 api/security_scanner_api.py

# 4. Apri il browser su index.html
```

## 🌐 Accesso al Servizio

Una volta avviato:
- **Frontend**: Apri `index.html` nel browser
- **API Backend**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 🔧 Funzionalità Integrate

### Scanner Web Reale
- **SSL/TLS Check**: Verifica certificati e configurazione
- **Security Headers**: Analizza intestazioni di sicurezza HTTP  
- **CMS Detection**: Rileva WordPress, Joomla e versioni
- **Vulnerability Assessment**: Identifica problemi di sicurezza reali

### Scanner di Rete
- **Port Scanning**: Scansione porte TCP comuni
- **Service Detection**: Identificazione servizi esposti
- **SSL Certificate Analysis**: Controllo scadenza certificati

### Report Professionale
- **Executive Summary**: Riassunto per management
- **Technical Details**: Dettagli tecnici per IT
- **Cost Estimation**: Stima costi di risoluzione
- **Priority Matrix**: Matrice priorità interventi

## 📊 API Endpoints

### `POST /api/scan`
Esegue scansione di sicurezza
```json
{
  "url": "https://example.com",
  "type": "web"
}
```

### `GET /api/scan-status/<scan_id>`
Controlla stato scansione in corso

### `POST /api/generate-report`
Genera report professionale
```json
{
  "scan_results": {...},
  "client_info": {
    "name": "Azienda SRL",
    "sector": "E-commerce"
  }
}
```

## 🎯 Utilizzo Frontend

1. **Inserisci URL**: Digita il sito web da scansionare
2. **Avvia Scansione**: Clicca "Scansiona"
3. **Visualizza Risultati**: Ottieni security score e vulnerabilità
4. **Genera Report**: Scarica report professionale (opzionale)

## 🛠️ Personalizzazione

### Configurazione Scanner
Modifica `/home/fra/Documenti/Security Automation Script/security_scanner.py`:
- Porte da scansionare
- Timeout di connessione
- Tipi di vulnerabilità

### Personalizzazione Frontend
Modifica `css/security-scanner.css`:
- Colori e tema
- Layout responsive
- Animazioni

### API Configuration
Modifica `api/security_scanner_api.py`:
- Porta del server
- Logging level
- Rate limiting

## 🔒 Sicurezza e Privacy

### Misure Implementate
- **Input Validation**: Validazione rigorosa URL
- **Rate Limiting**: Prevenzione abuse tramite tracking scansioni attive
- **Error Handling**: Gestione sicura degli errori
- **Logging**: Log sicuri per audit

### Raccomandazioni Produzione
1. **HTTPS**: Usa sempre HTTPS per l'API
2. **Authentication**: Implementa autenticazione per API
3. **Rate Limiting**: Limita richieste per IP
4. **Input Sanitization**: Sanifica tutti gli input
5. **Database**: Considera database per risultati storici

## 📈 Monitoring e Logs

### File di Log
- `security_api.log`: Log API server
- `security_scan_*.log`: Log scansioni individuali
- `security_scan_requests.log`: Log richieste HTTP

### Metriche Tracciabili
- Numero scansioni giornaliere
- Tipi vulnerabilità più comuni
- Tempi di risposta API
- Errori e fallimenti

## 🚨 Troubleshooting

### Problemi Comuni

**API non risponde**
```bash
# Controlla se il server è attivo
curl http://localhost:5000/api/health
```

**Errore dipendenze Python**
```bash
# Reinstalla dipendenze
pip3 install --upgrade -r requirements.txt
```

**Permessi script**
```bash
# Rendi eseguibile lo script
chmod +x start_scanner.sh
```

**CORS Errors**
- Assicurati che Flask-CORS sia installato
- Controlla che l'API sia su localhost:5000

### Debug Mode
```bash
export DEBUG=true
python3 api/security_scanner_api.py
```

## 📝 Struttura File

```
autohtml-project/
├── index.html                      # Frontend principale
├── css/security-scanner.css        # Stili scanner
├── js/security-scanner.js          # Logica frontend
├── api/
│   ├── security_scanner_api.py     # API Flask
│   └── security-scan.php           # API PHP (backup)
├── requirements.txt                # Dipendenze Python
├── start_scanner.sh               # Script avvio
└── SECURITY_SCANNER_README.md     # Documentazione
```

## 🔄 Aggiornamenti Futuri

### Pianificati
- Database persistenza risultati
- Dashboard admin per statistiche
- Notificazioni email per vulnerabilità critiche
- Integrazione con sistemi ticketing
- API rate limiting avanzato
- Autenticazione OAuth2

### Contrib
- Report PDF generazione
- Integrazione Slack/Teams
- Webhook per risultati scansione
- Plugin WordPress per scansioni automatiche

## 📞 Supporto

### Documentazione
- README principale: `/SECURITY_SCANNER_README.md`
- Documentazione API: Endpoint `/api/health` per status
- Log files per troubleshooting

### Contatti
- **Email**: support@archisec.tech
- **GitHub Issues**: Per bug e feature request
- **Documentation**: Wiki interno per procedure

## 🏆 Best Practices

### Sicurezza
1. Mai esporre API su Internet senza autenticazione
2. Usa HTTPS in produzione
3. Implementa rate limiting
4. Log ma non loggare dati sensibili
5. Valida sempre gli input utente

### Performance
1. Usa timeout appropriati per scansioni
2. Implementa caching per risultati comuni
3. Monitora uso memoria/CPU
4. Usa threading per scansioni parallele
5. Considera Redis per session storage

### UX
1. Feedback immediato per l'utente
2. Indicatori di progresso chiari
3. Messaggi di errore comprensibili
4. Design responsive per mobile
5. Accessibilità WCAG compliant
