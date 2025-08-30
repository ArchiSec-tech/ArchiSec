/**
 * Security Assessment Tools
 * Simulatore di vulnerabilità e tool interattivi per assessment sicurezza
 * Visualizzazione grafica e strumenti educativi
 */

class SecurityAssessmentTools {
    constructor(options = {}) {
        this.options = {
            enableRealTimeScanning: false, // Per sicurezza, solo simulazione
            scanDuration: 3000,
            resultAnimationDelay: 100,
            maxVulnerabilities: 50,
            ...options
        };
        
        this.scanningActive = false;
        this.scanResults = null;
        this.vulnerabilityDatabase = null;
        
        this.init();
    }
    
    init() {
        this.loadVulnerabilityDatabase();
        this.createAssessmentInterface();
        this.setupEventListeners();
        this.initializeCharts();
    }
    
    /**
     * Carica database vulnerabilità simulate
     */
    loadVulnerabilityDatabase() {
        this.vulnerabilityDatabase = {
            critical: [
                {
                    name: 'SQL Injection',
                    description: 'Possibile iniezione SQL nelle query database',
                    cvss: 9.8,
                    impact: 'Accesso non autorizzato ai dati',
                    solution: 'Utilizzare prepared statements e validazione input'
                },
                {
                    name: 'Remote Code Execution',
                    description: 'Esecuzione remota di codice attraverso upload file',
                    cvss: 9.6,
                    impact: 'Controllo completo del sistema',
                    solution: 'Validazione rigorosa file upload e sandboxing'
                },
                {
                    name: 'Authentication Bypass',
                    description: 'Bypass del sistema di autenticazione',
                    cvss: 9.1,
                    impact: 'Accesso non autorizzato amministrativo',
                    solution: 'Implementare MFA e audit sistema auth'
                }
            ],
            high: [
                {
                    name: 'Cross-Site Scripting (XSS)',
                    description: 'Script malevoli iniettabili nelle pagine web',
                    cvss: 7.5,
                    impact: 'Furto sessioni utente, defacing',
                    solution: 'Sanitizzazione input e Content Security Policy'
                },
                {
                    name: 'Insecure Direct Object Reference',
                    description: 'Accesso diretto a oggetti senza controlli',
                    cvss: 7.2,
                    impact: 'Accesso dati non autorizzato',
                    solution: 'Implementare controlli accesso per oggetti'
                },
                {
                    name: 'Security Misconfiguration',
                    description: 'Configurazioni di sicurezza non corrette',
                    cvss: 6.8,
                    impact: 'Esposizione informazioni sensibili',
                    solution: 'Hardening configurazioni e audit periodici'
                }
            ],
            medium: [
                {
                    name: 'Insufficient Logging',
                    description: 'Logging insufficiente per security monitoring',
                    cvss: 5.3,
                    impact: 'Difficoltà rilevamento attacchi',
                    solution: 'Implementare logging completo eventi security'
                },
                {
                    name: 'Weak Password Policy',
                    description: 'Policy password non adeguatamente robuste',
                    cvss: 4.9,
                    impact: 'Account compromise via brute force',
                    solution: 'Enforcement policy password complesse'
                },
                {
                    name: 'Missing Security Headers',
                    description: 'Header di sicurezza HTTP mancanti',
                    cvss: 4.2,
                    impact: 'Vulnerabilità client-side',
                    solution: 'Configurare header sicurezza (HSTS, CSP, etc.)'
                }
            ],
            low: [
                {
                    name: 'Information Disclosure',
                    description: 'Divulgazione involontaria informazioni sensibili',
                    cvss: 3.7,
                    impact: 'Raccolta intelligence per attaccanti',
                    solution: 'Rimuovere informazioni sensibili da output'
                },
                {
                    name: 'Deprecated Dependencies',
                    description: 'Utilizzo dipendenze software obsolete',
                    cvss: 3.1,
                    impact: 'Vulnerabilità indirette',
                    solution: 'Aggiornare regolarmente dipendenze'
                }
            ]
        };
    }
    
    /**
     * Crea interfaccia assessment
     */
    createAssessmentInterface() {
        const existingInterface = document.getElementById('security-assessment-tools');
        if (existingInterface) return;
        
        const interface_ = document.createElement('div');
        interface_.id = 'security-assessment-tools';
        interface_.className = 'security-assessment-tools';
        
        interface_.innerHTML = this.generateAssessmentHTML();
        
        // Inserisci nel container appropriato
        const targetContainer = document.querySelector('.security-assessment') || 
                               document.querySelector('.main-content') || 
                               document.body;
        
        targetContainer.appendChild(interface_);
        
        // Aggiungi stili
        this.addAssessmentStyles();
    }
    
    /**
     * Genera HTML interfaccia
     */
    generateAssessmentHTML() {
        return `
            <div class="assessment-container">
                <div class="assessment-header">
                    <h2>Security Assessment Simulator</h2>
                    <p>Simula una valutazione di sicurezza per comprendere le vulnerabilità comuni</p>
                </div>
                
                <div class="assessment-controls">
                    ${this.generateScanControls()}
                </div>
                
                <div class="assessment-dashboard">
                    ${this.generateDashboard()}
                </div>
                
                <div class="scan-results" id="scan-results">
                    ${this.generateResultsSection()}
                </div>
                
                <div class="vulnerability-details" id="vulnerability-details">
                    ${this.generateVulnerabilityDetails()}
                </div>
                
                <div class="remediation-guide" id="remediation-guide">
                    ${this.generateRemediationGuide()}
                </div>
            </div>
        `;
    }
    
    /**
     * Genera controlli scan
     */
    generateScanControls() {
        return `
            <div class="scan-controls">
                <div class="scan-options">
                    <h3>Opzioni Scansione</h3>
                    <div class="scan-types">
                        <label class="scan-type-option">
                            <input type="checkbox" value="web-app" checked>
                            <span>Web Application Scan</span>
                        </label>
                        <label class="scan-type-option">
                            <input type="checkbox" value="network">
                            <span>Network Scan</span>
                        </label>
                        <label class="scan-type-option">
                            <input type="checkbox" value="configuration">
                            <span>Configuration Audit</span>
                        </label>
                        <label class="scan-type-option">
                            <input type="checkbox" value="compliance">
                            <span>Compliance Check</span>
                        </label>
                    </div>
                </div>
                
                <div class="scan-target">
                    <h3>Target</h3>
                    <div class="target-input">
                        <input type="url" 
                               placeholder="https://esempio.com" 
                               id="scan-target-url"
                               value="https://demo.example.com">
                        <button class="btn-scan" id="start-scan">
                            <span class="scan-icon">🔍</span>
                            Avvia Scansione
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Genera dashboard
     */
    generateDashboard() {
        return `
            <div class="dashboard-grid">
                <div class="dashboard-card scan-status">
                    <h3>Stato Scansione</h3>
                    <div class="status-indicator" id="scan-status-indicator">
                        <div class="status-text">Pronto</div>
                        <div class="status-progress">
                            <div class="progress-bar" id="scan-progress"></div>
                        </div>
                    </div>
                </div>
                
                <div class="dashboard-card vulnerability-summary">
                    <h3>Riepilogo Vulnerabilità</h3>
                    <div class="vulnerability-stats" id="vulnerability-stats">
                        <div class="stat critical">
                            <span class="stat-number" id="critical-count">0</span>
                            <span class="stat-label">Critiche</span>
                        </div>
                        <div class="stat high">
                            <span class="stat-number" id="high-count">0</span>
                            <span class="stat-label">Alte</span>
                        </div>
                        <div class="stat medium">
                            <span class="stat-number" id="medium-count">0</span>
                            <span class="stat-label">Medie</span>
                        </div>
                        <div class="stat low">
                            <span class="stat-number" id="low-count">0</span>
                            <span class="stat-label">Basse</span>
                        </div>
                    </div>
                </div>
                
                <div class="dashboard-card security-score">
                    <h3>Security Score</h3>
                    <div class="score-display" id="security-score-display">
                        <div class="score-circle">
                            <svg class="score-svg" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" class="score-bg"></circle>
                                <circle cx="50" cy="50" r="45" class="score-fill" id="score-circle"></circle>
                            </svg>
                            <div class="score-text" id="security-score">--</div>
                        </div>
                    </div>
                </div>
                
                <div class="dashboard-card risk-assessment">
                    <h3>Valutazione Rischio</h3>
                    <div class="risk-level" id="risk-level">
                        <div class="risk-indicator" id="risk-indicator"></div>
                        <div class="risk-text" id="risk-text">Non valutato</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Genera sezione risultati
     */
    generateResultsSection() {
        return `
            <div class="results-header">
                <h3>Risultati Scansione</h3>
                <div class="results-actions">
                    <button class="btn-secondary" id="export-results">Esporta Report</button>
                    <button class="btn-secondary" id="share-results">Condividi</button>
                </div>
            </div>
            <div class="results-content" id="results-content">
                <div class="no-results">
                    <p>Avvia una scansione per vedere i risultati</p>
                </div>
            </div>
        `;
    }
    
    /**
     * Genera dettagli vulnerabilità
     */
    generateVulnerabilityDetails() {
        return `
            <div class="details-header" style="display: none;">
                <h3>Dettagli Vulnerabilità</h3>
                <button class="close-details" id="close-details">×</button>
            </div>
            <div class="details-content" id="details-content">
                <!-- Contenuto generato dinamicamente -->
            </div>
        `;
    }
    
    /**
     * Genera guida rimedi
     */
    generateRemediationGuide() {
        return `
            <div class="guide-header">
                <h3>Guida alla Risoluzione</h3>
            </div>
            <div class="guide-content" id="guide-content">
                <div class="guide-placeholder">
                    <p>Seleziona una vulnerabilità per vedere la guida alla risoluzione</p>
                </div>
            </div>
        `;
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const interface_ = document.getElementById('security-assessment-tools');
        
        // Avvio scansione
        const startScanBtn = interface_.querySelector('#start-scan');
        startScanBtn.addEventListener('click', () => this.startScan());
        
        // Chiusura dettagli
        const closeDetailsBtn = interface_.querySelector('#close-details');
        closeDetailsBtn.addEventListener('click', () => this.closeDetails());
        
        // Export/Share risultati
        const exportBtn = interface_.querySelector('#export-results');
        const shareBtn = interface_.querySelector('#share-results');
        
        exportBtn.addEventListener('click', () => this.exportResults());
        shareBtn.addEventListener('click', () => this.shareResults());
        
        // Selezione target URL
        const targetInput = interface_.querySelector('#scan-target-url');
        targetInput.addEventListener('input', () => this.validateTarget());
        
        // Opzioni scansione
        const scanOptions = interface_.querySelectorAll('.scan-type-option input');
        scanOptions.forEach(option => {
            option.addEventListener('change', () => this.updateScanOptions());
        });
    }
    
    /**
     * Avvia scansione simulata
     */
    async startScan() {
        if (this.scanningActive) return;
        
        this.scanningActive = true;
        const startBtn = document.getElementById('start-scan');
        const statusIndicator = document.getElementById('scan-status-indicator');
        const progressBar = document.getElementById('scan-progress');
        
        // UI di avvio scan
        startBtn.disabled = true;
        startBtn.innerHTML = '<span class="scan-icon spinning">⟳</span> Scansione in corso...';
        
        statusIndicator.querySelector('.status-text').textContent = 'Scansione in corso...';
        statusIndicator.classList.add('scanning');
        
        // Simula progresso scan
        await this.simulateScanProgress(progressBar);
        
        // Genera risultati
        this.scanResults = this.generateScanResults();
        
        // Mostra risultati
        this.displayScanResults();
        this.updateDashboard();
        
        // Reset UI
        this.scanningActive = false;
        startBtn.disabled = false;
        startBtn.innerHTML = '<span class="scan-icon">🔍</span> Avvia Scansione';
        statusIndicator.querySelector('.status-text').textContent = 'Completata';
        statusIndicator.classList.remove('scanning');
        statusIndicator.classList.add('completed');
        
        // Feedback utente
        if (window.feedbackSystem) {
            window.feedbackSystem.showNotification('Scansione completata con successo!', 'success');
        }
    }
    
    /**
     * Simula progresso scansione
     */
    async simulateScanProgress(progressBar) {
        const steps = [
            { progress: 10, message: 'Inizializzazione scanner...' },
            { progress: 25, message: 'Scansione porte...' },
            { progress: 40, message: 'Analisi applicazione web...' },
            { progress: 60, message: 'Test vulnerabilità...' },
            { progress: 80, message: 'Verifica configurazioni...' },
            { progress: 95, message: 'Generazione report...' },
            { progress: 100, message: 'Completata' }
        ];
        
        const statusText = document.querySelector('.status-text');
        
        for (const step of steps) {
            await new Promise(resolve => setTimeout(resolve, this.options.scanDuration / steps.length));
            
            progressBar.style.width = `${step.progress}%`;
            statusText.textContent = step.message;
        }
    }
    
    /**
     * Genera risultati scan simulati
     */
    generateScanResults() {
        const selectedScanTypes = Array.from(document.querySelectorAll('.scan-type-option input:checked'))
            .map(input => input.value);
        
        const results = {
            timestamp: new Date().toISOString(),
            target: document.getElementById('scan-target-url').value,
            scanTypes: selectedScanTypes,
            vulnerabilities: [],
            summary: {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
                total: 0
            },
            securityScore: 0,
            riskLevel: 'unknown'
        };
        
        // Genera vulnerabilità casuali basate sui tipi di scan
        Object.entries(this.vulnerabilityDatabase).forEach(([severity, vulnerabilities]) => {
            const count = Math.floor(Math.random() * 3) + 1; // 1-3 per severità
            
            for (let i = 0; i < count && results.vulnerabilities.length < this.options.maxVulnerabilities; i++) {
                const vuln = vulnerabilities[Math.floor(Math.random() * vulnerabilities.length)];
                const vulnCopy = {
                    ...vuln,
                    id: `vuln_${Date.now()}_${i}`,
                    severity: severity,
                    discoveredAt: new Date().toISOString(),
                    status: 'open',
                    affectedUrl: this.generateRandomUrl(results.target)
                };
                
                results.vulnerabilities.push(vulnCopy);
                results.summary[severity]++;
                results.summary.total++;
            }
        });
        
        // Calcola security score
        results.securityScore = this.calculateSecurityScore(results.summary);
        results.riskLevel = this.calculateRiskLevel(results.summary);
        
        return results;
    }
    
    /**
     * Genera URL casuale per vulnerabilità
     */
    generateRandomUrl(baseUrl) {
        const paths = ['/login', '/admin', '/api/users', '/dashboard', '/profile', '/search'];
        const randomPath = paths[Math.floor(Math.random() * paths.length)];
        return `${baseUrl}${randomPath}`;
    }
    
    /**
     * Calcola security score
     */
    calculateSecurityScore(summary) {
        let score = 100;
        
        score -= summary.critical * 20;
        score -= summary.high * 10;
        score -= summary.medium * 5;
        score -= summary.low * 1;
        
        return Math.max(0, score);
    }
    
    /**
     * Calcola livello di rischio
     */
    calculateRiskLevel(summary) {
        if (summary.critical > 0) return 'critical';
        if (summary.high > 2) return 'high';
        if (summary.high > 0 || summary.medium > 5) return 'medium';
        if (summary.medium > 0 || summary.low > 10) return 'low';
        return 'minimal';
    }
    
    /**
     * Mostra risultati scan
     */
    displayScanResults() {
        const resultsContent = document.getElementById('results-content');
        
        if (this.scanResults.vulnerabilities.length === 0) {
            resultsContent.innerHTML = `
                <div class="no-vulnerabilities">
                    <div class="success-icon">✅</div>
                    <h3>Nessuna Vulnerabilità Rilevata</h3>
                    <p>Il target sembra essere ben protetto!</p>
                </div>
            `;
            return;
        }
        
        // Raggruppa vulnerabilità per severità
        const vulnsBySeverity = this.scanResults.vulnerabilities.reduce((acc, vuln) => {
            if (!acc[vuln.severity]) acc[vuln.severity] = [];
            acc[vuln.severity].push(vuln);
            return acc;
        }, {});
        
        let resultsHTML = '';
        
        Object.entries(vulnsBySeverity).forEach(([severity, vulns]) => {
            resultsHTML += `
                <div class="severity-section ${severity}">
                    <h4 class="severity-header">
                        <span class="severity-badge ${severity}">${this.getSeverityLabel(severity)}</span>
                        <span class="severity-count">${vulns.length} vulnerabilit${vulns.length === 1 ? 'à' : 'à'}</span>
                    </h4>
                    <div class="vulnerabilities-list">
                        ${vulns.map(vuln => this.renderVulnerabilityItem(vuln)).join('')}
                    </div>
                </div>
            `;
        });
        
        resultsContent.innerHTML = resultsHTML;
        
        // Setup click handlers per dettagli
        this.setupVulnerabilityClickHandlers();
    }
    
    /**
     * Render singola vulnerabilità
     */
    renderVulnerabilityItem(vuln) {
        return `
            <div class="vulnerability-item ${vuln.severity}" data-vuln-id="${vuln.id}">
                <div class="vuln-header">
                    <h5 class="vuln-name">${vuln.name}</h5>
                    <div class="vuln-badges">
                        <span class="cvss-badge">CVSS ${vuln.cvss}</span>
                        <span class="status-badge ${vuln.status}">${vuln.status}</span>
                    </div>
                </div>
                <p class="vuln-description">${vuln.description}</p>
                <div class="vuln-meta">
                    <span class="vuln-url">${vuln.affectedUrl}</span>
                    <button class="btn-details" data-vuln-id="${vuln.id}">
                        Dettagli <span class="arrow">→</span>
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Setup click handlers vulnerabilità
     */
    setupVulnerabilityClickHandlers() {
        const detailButtons = document.querySelectorAll('.btn-details');
        
        detailButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const vulnId = button.dataset.vulnId;
                this.showVulnerabilityDetails(vulnId);
            });
        });
        
        const vulnItems = document.querySelectorAll('.vulnerability-item');
        vulnItems.forEach(item => {
            item.addEventListener('click', () => {
                const vulnId = item.dataset.vulnId;
                this.showVulnerabilityDetails(vulnId);
            });
        });
    }
    
    /**
     * Mostra dettagli vulnerabilità
     */
    showVulnerabilityDetails(vulnId) {
        const vulnerability = this.scanResults.vulnerabilities.find(v => v.id === vulnId);
        if (!vulnerability) return;
        
        const detailsSection = document.getElementById('vulnerability-details');
        const detailsContent = document.getElementById('details-content');
        const detailsHeader = detailsSection.querySelector('.details-header');
        
        detailsHeader.style.display = 'block';
        
        detailsContent.innerHTML = `
            <div class="vuln-detail-card">
                <div class="detail-header">
                    <h4>${vulnerability.name}</h4>
                    <div class="detail-badges">
                        <span class="severity-badge ${vulnerability.severity}">${this.getSeverityLabel(vulnerability.severity)}</span>
                        <span class="cvss-badge">CVSS ${vulnerability.cvss}/10</span>
                    </div>
                </div>
                
                <div class="detail-sections">
                    <div class="detail-section">
                        <h5>Descrizione</h5>
                        <p>${vulnerability.description}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h5>Impatto</h5>
                        <p class="impact-text">${vulnerability.impact}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h5>URL Coinvolto</h5>
                        <code class="affected-url">${vulnerability.affectedUrl}</code>
                    </div>
                    
                    <div class="detail-section">
                        <h5>Soluzione Raccomandata</h5>
                        <div class="solution-box">
                            ${vulnerability.solution}
                        </div>
                    </div>
                    
                    <div class="detail-actions">
                        <button class="btn-primary" onclick="window.assessmentTools.markAsResolved('${vulnerability.id}')">
                            Segna come Risolto
                        </button>
                        <button class="btn-secondary" onclick="window.assessmentTools.showRemediationGuide('${vulnerability.id}')">
                            Guida Dettagliata
                        </button>
                        <button class="btn-secondary" onclick="window.assessmentTools.exportVulnerability('${vulnerability.id}')">
                            Esporta
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Scroll alla sezione dettagli
        detailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    /**
     * Chiudi dettagli
     */
    closeDetails() {
        const detailsSection = document.getElementById('vulnerability-details');
        const detailsContent = document.getElementById('details-content');
        const detailsHeader = detailsSection.querySelector('.details-header');
        
        detailsHeader.style.display = 'none';
        detailsContent.innerHTML = '';
    }
    
    /**
     * Aggiorna dashboard
     */
    updateDashboard() {
        if (!this.scanResults) return;
        
        // Aggiorna contatori
        Object.entries(this.scanResults.summary).forEach(([key, value]) => {
            const element = document.getElementById(`${key}-count`);
            if (element && key !== 'total') {
                this.animateCounter(element, value);
            }
        });
        
        // Aggiorna security score
        this.updateSecurityScore();
        
        // Aggiorna livello rischio
        this.updateRiskLevel();
    }
    
    /**
     * Anima contatore
     */
    animateCounter(element, targetValue) {
        const startValue = parseInt(element.textContent) || 0;
        const duration = 1000;
        const steps = 50;
        const stepValue = (targetValue - startValue) / steps;
        const stepTime = duration / steps;
        
        let currentStep = 0;
        
        const timer = setInterval(() => {
            currentStep++;
            const value = Math.round(startValue + (stepValue * currentStep));
            element.textContent = value;
            
            if (currentStep >= steps) {
                clearInterval(timer);
                element.textContent = targetValue;
            }
        }, stepTime);
    }
    
    /**
     * Aggiorna security score
     */
    updateSecurityScore() {
        const scoreElement = document.getElementById('security-score');
        const scoreCircle = document.getElementById('score-circle');
        const score = this.scanResults.securityScore;
        
        // Anima testo score
        this.animateCounter(scoreElement, score);
        
        // Anima cerchio
        const circumference = 2 * Math.PI * 45; // radius = 45
        const strokeDasharray = circumference;
        const strokeDashoffset = circumference - (score / 100) * circumference;
        
        scoreCircle.style.strokeDasharray = strokeDasharray;
        scoreCircle.style.strokeDashoffset = strokeDashoffset;
        
        // Colore basato su score
        let color;
        if (score >= 80) color = '#4CAF50';
        else if (score >= 60) color = '#FF9800';
        else if (score >= 40) color = '#FF5722';
        else color = '#F44336';
        
        scoreCircle.style.stroke = color;
    }
    
    /**
     * Aggiorna livello rischio
     */
    updateRiskLevel() {
        const riskIndicator = document.getElementById('risk-indicator');
        const riskText = document.getElementById('risk-text');
        const riskLevel = this.scanResults.riskLevel;
        
        const riskConfig = {
            minimal: { color: '#4CAF50', text: 'Rischio Minimo', icon: '🟢' },
            low: { color: '#8BC34A', text: 'Rischio Basso', icon: '🟡' },
            medium: { color: '#FF9800', text: 'Rischio Medio', icon: '🟠' },
            high: { color: '#FF5722', text: 'Rischio Alto', icon: '🔴' },
            critical: { color: '#F44336', text: 'Rischio Critico', icon: '🚨' }
        };
        
        const config = riskConfig[riskLevel] || riskConfig.minimal;
        
        riskIndicator.style.backgroundColor = config.color;
        riskText.textContent = `${config.icon} ${config.text}`;
        riskText.style.color = config.color;
    }
    
    /**
     * Mostra guida rimedio
     */
    showRemediationGuide(vulnId) {
        const vulnerability = this.scanResults.vulnerabilities.find(v => v.id === vulnId);
        if (!vulnerability) return;
        
        const guideContent = document.getElementById('guide-content');
        
        guideContent.innerHTML = `
            <div class="remediation-guide-content">
                <h4>Guida alla Risoluzione: ${vulnerability.name}</h4>
                
                <div class="guide-steps">
                    <div class="step-item">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <h5>Valutazione Immediata</h5>
                            <p>Determina l'urgenza e l'impatto della vulnerabilità nel tuo ambiente specifico.</p>
                        </div>
                    </div>
                    
                    <div class="step-item">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <h5>Implementazione Fix</h5>
                            <p>${vulnerability.solution}</p>
                        </div>
                    </div>
                    
                    <div class="step-item">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <h5>Testing e Verifica</h5>
                            <p>Testa la soluzione implementata per assicurarti che la vulnerabilità sia stata risolta.</p>
                        </div>
                    </div>
                    
                    <div class="step-item">
                        <div class="step-number">4</div>
                        <div class="step-content">
                            <h5>Monitoraggio</h5>
                            <p>Implementa monitoraggio continuo per prevenire la ricomparsa della vulnerabilità.</p>
                        </div>
                    </div>
                </div>
                
                <div class="additional-resources">
                    <h5>Risorse Aggiuntive</h5>
                    <ul>
                        <li><a href="#" onclick="return false;">OWASP Guidelines per ${vulnerability.name}</a></li>
                        <li><a href="#" onclick="return false;">Best Practices di Sicurezza</a></li>
                        <li><a href="#" onclick="return false;">Tools di Testing Automatico</a></li>
                    </ul>
                </div>
            </div>
        `;
        
        // Scroll alla guida
        document.getElementById('remediation-guide').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
    
    /**
     * Segna vulnerabilità come risolta
     */
    markAsResolved(vulnId) {
        const vulnerability = this.scanResults.vulnerabilities.find(v => v.id === vulnId);
        if (!vulnerability) return;
        
        vulnerability.status = 'resolved';
        vulnerability.resolvedAt = new Date().toISOString();
        
        // Aggiorna UI
        const vulnElement = document.querySelector(`[data-vuln-id="${vulnId}"]`);
        if (vulnElement) {
            vulnElement.classList.add('resolved');
            const statusBadge = vulnElement.querySelector('.status-badge');
            if (statusBadge) {
                statusBadge.textContent = 'resolved';
                statusBadge.className = 'status-badge resolved';
            }
        }
        
        // Ricalcola score
        this.recalculateSecurityMetrics();
        
        if (window.feedbackSystem) {
            window.feedbackSystem.showNotification(
                `Vulnerabilità "${vulnerability.name}" segnata come risolta`, 
                'success'
            );
        }
    }
    
    /**
     * Ricalcola metriche sicurezza
     */
    recalculateSecurityMetrics() {
        const resolvedCount = this.scanResults.vulnerabilities.filter(v => v.status === 'resolved').length;
        const totalCount = this.scanResults.vulnerabilities.length;
        
        if (resolvedCount === totalCount) {
            this.scanResults.securityScore = 100;
            this.scanResults.riskLevel = 'minimal';
        } else {
            const openVulns = this.scanResults.vulnerabilities.filter(v => v.status === 'open');
            const summary = openVulns.reduce((acc, vuln) => {
                acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
                return acc;
            }, { critical: 0, high: 0, medium: 0, low: 0 });
            
            this.scanResults.securityScore = this.calculateSecurityScore(summary);
            this.scanResults.riskLevel = this.calculateRiskLevel(summary);
        }
        
        this.updateSecurityScore();
        this.updateRiskLevel();
    }
    
    /**
     * Esporta vulnerabilità singola
     */
    exportVulnerability(vulnId) {
        const vulnerability = this.scanResults.vulnerabilities.find(v => v.id === vulnId);
        if (!vulnerability) return;
        
        const reportData = {
            vulnerability,
            exportedAt: new Date().toISOString(),
            target: this.scanResults.target
        };
        
        const dataStr = JSON.stringify(reportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `vulnerability-${vulnerability.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
        link.click();
        
        if (window.feedbackSystem) {
            window.feedbackSystem.showNotification('Report vulnerabilità esportato', 'success');
        }
    }
    
    /**
     * Esporta risultati completi
     */
    exportResults() {
        if (!this.scanResults) return;
        
        const reportData = {
            ...this.scanResults,
            exportedAt: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(reportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `security-assessment-${Date.now()}.json`;
        link.click();
        
        if (window.feedbackSystem) {
            window.feedbackSystem.showNotification('Report completo esportato', 'success');
        }
    }
    
    /**
     * Condividi risultati
     */
    async shareResults() {
        if (!this.scanResults) return;
        
        const summary = `Security Assessment Results:\n` +
                       `Target: ${this.scanResults.target}\n` +
                       `Security Score: ${this.scanResults.securityScore}/100\n` +
                       `Risk Level: ${this.scanResults.riskLevel}\n` +
                       `Total Vulnerabilities: ${this.scanResults.summary.total}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Security Assessment Results',
                    text: summary,
                    url: window.location.href
                });
            } catch (error) {
                this.fallbackShare(summary);
            }
        } else {
            this.fallbackShare(summary);
        }
    }
    
    /**
     * Fallback condivisione
     */
    fallbackShare(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                if (window.feedbackSystem) {
                    window.feedbackSystem.showNotification('Risultati copiati negli appunti', 'success');
                }
            });
        }
    }
    
    /**
     * Valida target URL
     */
    validateTarget() {
        const input = document.getElementById('scan-target-url');
        const url = input.value.trim();
        
        try {
            new URL(url);
            input.classList.remove('invalid');
            input.classList.add('valid');
        } catch {
            input.classList.remove('valid');
            input.classList.add('invalid');
        }
    }
    
    /**
     * Aggiorna opzioni scan
     */
    updateScanOptions() {
        const selectedOptions = Array.from(document.querySelectorAll('.scan-type-option input:checked'))
            .map(input => input.value);
        
        console.log('Selected scan options:', selectedOptions);
    }
    
    /**
     * Ottieni label severità
     */
    getSeverityLabel(severity) {
        const labels = {
            critical: 'Critica',
            high: 'Alta',
            medium: 'Media',
            low: 'Bassa'
        };
        return labels[severity] || severity;
    }
    
    /**
     * Inizializza grafici
     */
    initializeCharts() {
        // Placeholder per future implementazioni di grafici avanzati
        console.log('Charts initialized');
    }
    
    /**
     * Aggiungi stili CSS
     */
    addAssessmentStyles() {
        if (document.getElementById('assessment-tools-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'assessment-tools-styles';
        style.textContent = `
            .security-assessment-tools {
                max-width: 1400px;
                margin: 2rem auto;
                padding: 2rem;
                background: #000;
                border-radius: 12px;
                color: white;
            }
            
            .assessment-header {
                text-align: center;
                margin-bottom: 2rem;
            }
            
            .assessment-controls {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 2rem;
                margin-bottom: 2rem;
                padding: 2rem;
                background: #111;
                border-radius: 8px;
            }
            
            .scan-types {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-top: 1rem;
            }
            
            .scan-type-option {
                display: flex;
                align-items: center;
                padding: 0.75rem;
                border: 1px solid #333;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .scan-type-option:hover {
                background: rgba(76, 175, 80, 0.1);
                border-color: #4CAF50;
            }
            
            .target-input {
                display: flex;
                gap: 1rem;
                margin-top: 1rem;
            }
            
            .target-input input {
                flex: 1;
                padding: 0.75rem;
                border: 1px solid #333;
                border-radius: 6px;
                background: #222;
                color: white;
            }
            
            .target-input input.valid {
                border-color: #4CAF50;
            }
            
            .target-input input.invalid {
                border-color: #f44336;
            }
            
            .btn-scan {
                padding: 0.75rem 1.5rem;
                background: #4CAF50;
                border: none;
                border-radius: 6px;
                color: white;
                cursor: pointer;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                transition: all 0.3s ease;
            }
            
            .btn-scan:hover {
                background: #45a049;
            }
            
            .btn-scan:disabled {
                background: #666;
                cursor: not-allowed;
            }
            
            .scan-icon.spinning {
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            .dashboard-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .dashboard-card {
                background: #111;
                padding: 1.5rem;
                border-radius: 8px;
                border: 1px solid #333;
            }
            
            .status-indicator.scanning {
                color: #FF9800;
            }
            
            .status-indicator.completed {
                color: #4CAF50;
            }
            
            .progress-bar {
                width: 100%;
                height: 8px;
                background: #333;
                border-radius: 4px;
                overflow: hidden;
                margin-top: 0.5rem;
            }
            
            .progress-bar::before {
                content: '';
                display: block;
                height: 100%;
                width: 0%;
                background: #4CAF50;
                transition: width 0.3s ease;
            }
            
            .vulnerability-stats {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 1rem;
                text-align: center;
            }
            
            .stat {
                padding: 1rem;
                border-radius: 6px;
            }
            
            .stat.critical {
                background: rgba(244, 67, 54, 0.1);
                border: 1px solid #f44336;
            }
            
            .stat.high {
                background: rgba(255, 87, 34, 0.1);
                border: 1px solid #FF5722;
            }
            
            .stat.medium {
                background: rgba(255, 152, 0, 0.1);
                border: 1px solid #FF9800;
            }
            
            .stat.low {
                background: rgba(76, 175, 80, 0.1);
                border: 1px solid #4CAF50;
            }
            
            .stat-number {
                display: block;
                font-size: 2rem;
                font-weight: bold;
                margin-bottom: 0.5rem;
            }
            
            .score-display {
                text-align: center;
            }
            
            .score-circle {
                position: relative;
                width: 120px;
                height: 120px;
                margin: 0 auto;
            }
            
            .score-svg {
                width: 100%;
                height: 100%;
                transform: rotate(-90deg);
            }
            
            .score-bg {
                fill: none;
                stroke: #333;
                stroke-width: 8;
            }
            
            .score-fill {
                fill: none;
                stroke: #4CAF50;
                stroke-width: 8;
                stroke-dasharray: 283;
                stroke-dashoffset: 283;
                transition: stroke-dashoffset 1s ease;
            }
            
            .score-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 1.5rem;
                font-weight: bold;
            }
            
            .risk-indicator {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                display: inline-block;
                margin-right: 0.5rem;
            }
            
            .severity-section {
                margin-bottom: 2rem;
                border-radius: 8px;
                overflow: hidden;
            }
            
            .severity-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1rem;
                background: #111;
                margin-bottom: 1rem;
            }
            
            .severity-badge {
                padding: 0.25rem 0.75rem;
                border-radius: 12px;
                font-size: 0.875rem;
                font-weight: 500;
            }
            
            .severity-badge.critical {
                background: #f44336;
                color: white;
            }
            
            .severity-badge.high {
                background: #FF5722;
                color: white;
            }
            
            .severity-badge.medium {
                background: #FF9800;
                color: white;
            }
            
            .severity-badge.low {
                background: #4CAF50;
                color: white;
            }
            
            .vulnerability-item {
                background: #111;
                border: 1px solid #333;
                border-radius: 8px;
                padding: 1.5rem;
                margin-bottom: 1rem;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .vulnerability-item:hover {
                border-color: #555;
                background: #1a1a1a;
            }
            
            .vulnerability-item.resolved {
                opacity: 0.6;
                border-color: #4CAF50;
            }
            
            .vuln-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
            }
            
            .vuln-badges {
                display: flex;
                gap: 0.5rem;
            }
            
            .cvss-badge {
                background: #333;
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.75rem;
            }
            
            .status-badge {
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.75rem;
                text-transform: uppercase;
            }
            
            .status-badge.open {
                background: #f44336;
                color: white;
            }
            
            .status-badge.resolved {
                background: #4CAF50;
                color: white;
            }
            
            .vuln-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 1rem;
                font-size: 0.875rem;
                color: #aaa;
            }
            
            .btn-details {
                background: #333;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                transition: background 0.3s ease;
            }
            
            .btn-details:hover {
                background: #555;
            }
            
            .vuln-detail-card {
                background: #111;
                border-radius: 8px;
                padding: 2rem;
                margin-bottom: 2rem;
            }
            
            .detail-sections {
                display: grid;
                gap: 1.5rem;
            }
            
            .detail-section h5 {
                margin-bottom: 0.5rem;
                color: #4CAF50;
            }
            
            .solution-box {
                background: #1a1a1a;
                padding: 1rem;
                border-radius: 6px;
                border-left: 4px solid #4CAF50;
            }
            
            .detail-actions {
                display: flex;
                gap: 1rem;
                margin-top: 1.5rem;
            }
            
            .btn-primary, .btn-secondary {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.3s ease;
            }
            
            .btn-primary {
                background: #4CAF50;
                color: white;
            }
            
            .btn-secondary {
                background: #333;
                color: white;
                border: 1px solid #555;
            }
            
            .step-item {
                display: flex;
                gap: 1rem;
                margin-bottom: 1.5rem;
            }
            
            .step-number {
                width: 30px;
                height: 30px;
                background: #4CAF50;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                flex-shrink: 0;
            }
            
            .step-content h5 {
                margin-bottom: 0.5rem;
                color: white;
            }
            
            @media (max-width: 768px) {
                .assessment-controls {
                    grid-template-columns: 1fr;
                }
                
                .dashboard-grid {
                    grid-template-columns: 1fr;
                }
                
                .vulnerability-stats {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .detail-actions {
                    flex-direction: column;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Cleanup
     */
    destroy() {
        const interface_ = document.getElementById('security-assessment-tools');
        if (interface_) {
            interface_.remove();
        }
        
        const styles = document.getElementById('assessment-tools-styles');
        if (styles) {
            styles.remove();
        }
    }
}

// Auto-inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    // Inizializza solo se siamo nella pagina security assessment o se richiesto
    if (document.querySelector('.security-assessment') || 
        document.querySelector('[data-enable-assessment]') ||
        window.location.pathname.includes('security-assessment')) {
        
        window.assessmentTools = new SecurityAssessmentTools({
            enableRealTimeScanning: false,
            scanDuration: 3000,
            maxVulnerabilities: 15
        });
    }
});

export default SecurityAssessmentTools;
