/**
 * Interactive Price Calculator
 * Calcolatore di prezzi interattivo con aggiornamento in tempo reale
 * Integrato con il design ArchiTech esistente
 */

class InteractivePriceCalculator {
    constructor(options = {}) {
        this.options = {
            currency: '€',
            locale: 'it-IT',
            updateDelay: 300,
            enableComparison: true,
            enableSavings: true,
            animationDuration: 400,
            ...options
        };
        
        this.currentConfig = {
            plan: 'basic',
            addons: new Set(),
            duration: 12,
            users: 1,
            features: new Set()
        };
        
        this.priceHistory = [];
        this.comparisonPlans = [];
        
        this.init();
    }
    
    init() {
        this.setupPricingStructure();
        this.createCalculatorInterface();
        this.setupEventListeners();
        this.setupComparisonFeature();
        this.updatePricing();
    }
    
    /**
     * Struttura prezzi servizi cybersecurity
     */
    setupPricingStructure() {
        this.pricing = {
            plans: {
                basic: {
                    name: 'Security Assessment',
                    basePrice: 299,
                    description: 'Valutazione base della sicurezza',
                    features: [
                        'Scansione vulnerabilità',
                        'Report dettagliato',
                        'Consulenza base',
                        'Supporto email'
                    ],
                    maxUsers: 50,
                    color: '#4CAF50'
                },
                professional: {
                    name: 'Vulnerability Fixing',
                    basePrice: 599,
                    description: 'Risoluzione completa vulnerabilità',
                    features: [
                        'Tutto del piano Basic',
                        'Correzione vulnerabilità',
                        'Monitoraggio 24/7',
                        'Supporto prioritario',
                        'Aggiornamenti automatici'
                    ],
                    maxUsers: 200,
                    color: '#2196F3'
                },
                enterprise: {
                    name: 'Complete Security Suite',
                    basePrice: 1299,
                    description: 'Protezione enterprise completa',
                    features: [
                        'Tutto del piano Professional',
                        'SOC dedicato',
                        'Incident response',
                        'Compliance audit',
                        'Training del personale',
                        'SLA garantito'
                    ],
                    maxUsers: -1, // Illimitati
                    color: '#FF9800'
                }
            },
            
            addons: {
                penetrationTesting: {
                    name: 'Penetration Testing',
                    price: 199,
                    description: 'Test approfonditi di sicurezza'
                },
                complianceAudit: {
                    name: 'Compliance Audit',
                    price: 299,
                    description: 'Audit conformità normative'
                },
                trainingProgram: {
                    name: 'Security Training',
                    price: 149,
                    description: 'Formazione team sicurezza'
                },
                incidentResponse: {
                    name: 'Incident Response 24/7',
                    price: 399,
                    description: 'Risposta immediata emergenze'
                },
                backupSolution: {
                    name: 'Backup & Recovery',
                    price: 99,
                    description: 'Soluzione backup sicura'
                }
            },
            
            discounts: {
                annual: { months: 12, discount: 0.15, label: 'Sconto annuale 15%' },
                biennial: { months: 24, discount: 0.25, label: 'Sconto biennale 25%' },
                triennial: { months: 36, discount: 0.35, label: 'Sconto triennale 35%' }
            },
            
            userPricing: {
                basic: { free: 10, perUser: 15 },
                professional: { free: 25, perUser: 25 },
                enterprise: { free: 50, perUser: 45 }
            }
        };
    }
    
    /**
     * Crea interfaccia calcolatore
     */
    createCalculatorInterface() {
        const existingCalculator = document.getElementById('price-calculator');
        if (existingCalculator) return;
        
        const calculator = document.createElement('div');
        calculator.id = 'price-calculator';
        calculator.className = 'price-calculator';
        
        calculator.innerHTML = this.generateCalculatorHTML();
        
        // Inserisci nel container appropriato
        const targetContainer = document.querySelector('.pricing-section') || 
                               document.querySelector('.main-content') || 
                               document.body;
        
        targetContainer.appendChild(calculator);
        
        // Aggiungi stili se non esistono
        this.addCalculatorStyles();
    }
    
    /**
     * Genera HTML del calcolatore
     */
    generateCalculatorHTML() {
        return `
            <div class="calculator-container">
                <div class="calculator-header">
                    <h2>Calcolatore Prezzi Personalizzato</h2>
                    <p>Configura il tuo piano di sicurezza perfetto</p>
                </div>
                
                <div class="calculator-content">
                    <div class="calculator-controls">
                        ${this.generatePlanSelector()}
                        ${this.generateUserSlider()}
                        ${this.generateDurationSelector()}
                        ${this.generateAddonSelector()}
                    </div>
                    
                    <div class="calculator-result">
                        ${this.generatePriceDisplay()}
                        ${this.generateComparisonTable()}
                        ${this.generateActionButtons()}
                    </div>
                </div>
                
                <div class="calculator-features">
                    ${this.generateFeaturesList()}
                </div>
            </div>
        `;
    }
    
    /**
     * Genera selettore piano
     */
    generatePlanSelector() {
        const plans = Object.entries(this.pricing.plans);
        
        return `
            <div class="control-group plan-selector">
                <label class="control-label">Seleziona Piano</label>
                <div class="plan-options">
                    ${plans.map(([key, plan]) => `
                        <div class="plan-option ${key === this.currentConfig.plan ? 'active' : ''}" 
                             data-plan="${key}">
                            <div class="plan-header">
                                <h3>${plan.name}</h3>
                                <div class="plan-price">${this.formatPrice(plan.basePrice)}/mese</div>
                            </div>
                            <p class="plan-description">${plan.description}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Genera slider utenti
     */
    generateUserSlider() {
        return `
            <div class="control-group user-slider">
                <label class="control-label">
                    Numero Utenti: <span class="user-count">${this.currentConfig.users}</span>
                </label>
                <div class="slider-container">
                    <input type="range" 
                           id="user-slider" 
                           min="1" 
                           max="500" 
                           value="${this.currentConfig.users}"
                           class="price-slider">
                    <div class="slider-labels">
                        <span>1</span>
                        <span>100</span>
                        <span>250</span>
                        <span>500+</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Genera selettore durata
     */
    generateDurationSelector() {
        return `
            <div class="control-group duration-selector">
                <label class="control-label">Durata Contratto</label>
                <div class="duration-options">
                    <button class="duration-option ${this.currentConfig.duration === 1 ? 'active' : ''}" 
                            data-duration="1">
                        <span class="duration-label">Mensile</span>
                        <span class="duration-price">Prezzo pieno</span>
                    </button>
                    <button class="duration-option ${this.currentConfig.duration === 12 ? 'active' : ''}" 
                            data-duration="12">
                        <span class="duration-label">Annuale</span>
                        <span class="duration-price">-15% sconto</span>
                        <span class="duration-badge">Più popolare</span>
                    </button>
                    <button class="duration-option ${this.currentConfig.duration === 24 ? 'active' : ''}" 
                            data-duration="24">
                        <span class="duration-label">Biennale</span>
                        <span class="duration-price">-25% sconto</span>
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Genera selettore addon
     */
    generateAddonSelector() {
        const addons = Object.entries(this.pricing.addons);
        
        return `
            <div class="control-group addon-selector">
                <label class="control-label">Servizi Aggiuntivi</label>
                <div class="addon-list">
                    ${addons.map(([key, addon]) => `
                        <div class="addon-item ${this.currentConfig.addons.has(key) ? 'selected' : ''}" 
                             data-addon="${key}">
                            <div class="addon-checkbox">
                                <input type="checkbox" 
                                       id="addon-${key}" 
                                       ${this.currentConfig.addons.has(key) ? 'checked' : ''}>
                                <label for="addon-${key}"></label>
                            </div>
                            <div class="addon-info">
                                <h4>${addon.name}</h4>
                                <p>${addon.description}</p>
                                <span class="addon-price">${this.formatPrice(addon.price)}/mese</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Genera display prezzi
     */
    generatePriceDisplay() {
        return `
            <div class="price-display">
                <div class="price-summary">
                    <div class="current-price">
                        <span class="price-label">Prezzo Mensile</span>
                        <span class="price-amount" id="monthly-price">${this.formatPrice(0)}</span>
                    </div>
                    <div class="annual-price">
                        <span class="price-label">Prezzo Annuale</span>
                        <span class="price-amount" id="annual-price">${this.formatPrice(0)}</span>
                        <span class="savings" id="annual-savings"></span>
                    </div>
                </div>
                
                <div class="price-breakdown" id="price-breakdown">
                    <!-- Dettaglio prezzi generato dinamicamente -->
                </div>
                
                <div class="price-chart" id="price-chart">
                    <!-- Grafico prezzi generato dinamicamente -->
                </div>
            </div>
        `;
    }
    
    /**
     * Genera tabella comparazione
     */
    generateComparisonTable() {
        if (!this.options.enableComparison) return '';
        
        return `
            <div class="comparison-table" id="comparison-table">
                <h3>Confronta Piani</h3>
                <div class="comparison-controls">
                    <button class="btn-secondary" id="add-comparison">Aggiungi al Confronto</button>
                    <button class="btn-secondary" id="clear-comparison">Pulisci Confronto</button>
                </div>
                <div class="comparison-content">
                    <!-- Tabella di confronto generata dinamicamente -->
                </div>
            </div>
        `;
    }
    
    /**
     * Genera bottoni azione
     */
    generateActionButtons() {
        return `
            <div class="calculator-actions">
                <button class="btn-primary" id="get-quote">Richiedi Preventivo</button>
                <button class="btn-secondary" id="save-config">Salva Configurazione</button>
                <button class="btn-secondary" id="share-config">Condividi</button>
                <button class="btn-secondary" id="export-pdf">Esporta PDF</button>
            </div>
        `;
    }
    
    /**
     * Genera lista features
     */
    generateFeaturesList() {
        return `
            <div class="features-comparison">
                <h3>Funzionalità Incluse</h3>
                <div class="features-grid" id="features-grid">
                    <!-- Features generate dinamicamente -->
                </div>
            </div>
        `;
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const calculator = document.getElementById('price-calculator');
        
        // Selettore piano
        calculator.querySelectorAll('.plan-option').forEach(option => {
            option.addEventListener('click', () => {
                const plan = option.dataset.plan;
                this.selectPlan(plan);
            });
        });
        
        // Slider utenti
        const userSlider = calculator.querySelector('#user-slider');
        if (userSlider) {
            userSlider.addEventListener('input', this.debounce((e) => {
                this.updateUsers(parseInt(e.target.value));
            }, this.options.updateDelay));
        }
        
        // Selettore durata
        calculator.querySelectorAll('.duration-option').forEach(option => {
            option.addEventListener('click', () => {
                const duration = parseInt(option.dataset.duration);
                this.selectDuration(duration);
            });
        });
        
        // Addon selector
        calculator.querySelectorAll('.addon-item').forEach(item => {
            item.addEventListener('click', () => {
                const addon = item.dataset.addon;
                this.toggleAddon(addon);
            });
        });
        
        // Bottoni azione
        this.setupActionButtons(calculator);
    }
    
    /**
     * Setup bottoni azione
     */
    setupActionButtons(calculator) {
        const buttons = {
            'get-quote': () => this.requestQuote(),
            'save-config': () => this.saveConfiguration(),
            'share-config': () => this.shareConfiguration(),
            'export-pdf': () => this.exportToPDF(),
            'add-comparison': () => this.addToComparison(),
            'clear-comparison': () => this.clearComparison()
        };
        
        Object.entries(buttons).forEach(([id, handler]) => {
            const button = calculator.querySelector(`#${id}`);
            if (button) {
                button.addEventListener('click', handler);
            }
        });
    }
    
    /**
     * Seleziona piano
     */
    selectPlan(planKey) {
        this.currentConfig.plan = planKey;
        
        // Aggiorna UI
        document.querySelectorAll('.plan-option').forEach(option => {
            option.classList.toggle('active', option.dataset.plan === planKey);
        });
        
        // Aggiorna limiti utenti
        this.updateUserLimits();
        this.updatePricing();
        this.updateFeatures();
    }
    
    /**
     * Aggiorna numero utenti
     */
    updateUsers(count) {
        this.currentConfig.users = count;
        
        // Aggiorna display
        const userCount = document.querySelector('.user-count');
        if (userCount) {
            userCount.textContent = count;
        }
        
        this.updatePricing();
    }
    
    /**
     * Seleziona durata contratto
     */
    selectDuration(duration) {
        this.currentConfig.duration = duration;
        
        // Aggiorna UI
        document.querySelectorAll('.duration-option').forEach(option => {
            const optionDuration = parseInt(option.dataset.duration);
            option.classList.toggle('active', optionDuration === duration);
        });
        
        this.updatePricing();
    }
    
    /**
     * Toggle addon
     */
    toggleAddon(addonKey) {
        const item = document.querySelector(`[data-addon="${addonKey}"]`);
        const checkbox = item.querySelector('input[type="checkbox"]');
        
        if (this.currentConfig.addons.has(addonKey)) {
            this.currentConfig.addons.delete(addonKey);
            checkbox.checked = false;
            item.classList.remove('selected');
        } else {
            this.currentConfig.addons.add(addonKey);
            checkbox.checked = true;
            item.classList.add('selected');
        }
        
        this.updatePricing();
    }
    
    /**
     * Aggiorna limiti utenti basati su piano
     */
    updateUserLimits() {
        const plan = this.pricing.plans[this.currentConfig.plan];
        const slider = document.querySelector('#user-slider');
        
        if (slider && plan.maxUsers > 0) {
            slider.max = plan.maxUsers;
            if (this.currentConfig.users > plan.maxUsers) {
                this.currentConfig.users = plan.maxUsers;
                slider.value = plan.maxUsers;
            }
        }
    }
    
    /**
     * Aggiorna pricing principale
     */
    updatePricing() {
        const pricing = this.calculatePricing();
        this.animatePriceUpdate(pricing);
        this.updatePriceBreakdown(pricing);
        this.updatePriceChart(pricing);
        this.storePriceHistory(pricing);
    }
    
    /**
     * Calcola pricing totale
     */
    calculatePricing() {
        const plan = this.pricing.plans[this.currentConfig.plan];
        const userPricing = this.pricing.userPricing[this.currentConfig.plan];
        
        // Prezzo base piano
        let basePrice = plan.basePrice;
        
        // Costo utenti aggiuntivi
        let userCost = 0;
        if (this.currentConfig.users > userPricing.free) {
            const additionalUsers = this.currentConfig.users - userPricing.free;
            userCost = additionalUsers * userPricing.perUser;
        }
        
        // Costo addon
        let addonCost = 0;
        this.currentConfig.addons.forEach(addonKey => {
            addonCost += this.pricing.addons[addonKey].price;
        });
        
        const subtotal = basePrice + userCost + addonCost;
        
        // Sconto durata
        let discount = 0;
        if (this.currentConfig.duration >= 12) {
            const discountKey = this.currentConfig.duration >= 36 ? 'triennial' :
                              this.currentConfig.duration >= 24 ? 'biennial' : 'annual';
            discount = subtotal * this.pricing.discounts[discountKey].discount;
        }
        
        const monthlyPrice = subtotal - discount;
        const annualPrice = monthlyPrice * 12;
        const totalSavings = discount * 12;
        
        return {
            basePrice,
            userCost,
            addonCost,
            subtotal,
            discount,
            monthlyPrice,
            annualPrice,
            totalSavings,
            duration: this.currentConfig.duration
        };
    }
    
    /**
     * Anima aggiornamento prezzi
     */
    animatePriceUpdate(pricing) {
        const monthlyElement = document.getElementById('monthly-price');
        const annualElement = document.getElementById('annual-price');
        const savingsElement = document.getElementById('annual-savings');
        
        if (!monthlyElement) return;
        
        // Animazione contatore
        this.animateValue(monthlyElement, pricing.monthlyPrice);
        this.animateValue(annualElement, pricing.annualPrice);
        
        // Mostra risparmi se applicabili
        if (savingsElement) {
            if (pricing.totalSavings > 0) {
                savingsElement.textContent = `Risparmi ${this.formatPrice(pricing.totalSavings)}/anno`;
                savingsElement.style.display = 'block';
                savingsElement.classList.add('savings-highlight');
            } else {
                savingsElement.style.display = 'none';
            }
        }
    }
    
    /**
     * Anima valore numerico
     */
    animateValue(element, targetValue) {
        const currentText = element.textContent;
        const currentValue = parseFloat(currentText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        
        const duration = this.options.animationDuration;
        const steps = 30;
        const stepValue = (targetValue - currentValue) / steps;
        const stepTime = duration / steps;
        
        let currentStep = 0;
        
        const timer = setInterval(() => {
            currentStep++;
            const value = currentValue + (stepValue * currentStep);
            
            element.textContent = this.formatPrice(value);
            
            if (currentStep >= steps) {
                clearInterval(timer);
                element.textContent = this.formatPrice(targetValue);
            }
        }, stepTime);
    }
    
    /**
     * Aggiorna breakdown prezzi
     */
    updatePriceBreakdown(pricing) {
        const breakdown = document.getElementById('price-breakdown');
        if (!breakdown) return;
        
        const items = [];
        
        // Piano base
        const plan = this.pricing.plans[this.currentConfig.plan];
        items.push({
            label: plan.name,
            value: pricing.basePrice,
            type: 'base'
        });
        
        // Utenti aggiuntivi
        if (pricing.userCost > 0) {
            const freeUsers = this.pricing.userPricing[this.currentConfig.plan].free;
            const additionalUsers = this.currentConfig.users - freeUsers;
            items.push({
                label: `${additionalUsers} utenti aggiuntivi`,
                value: pricing.userCost,
                type: 'users'
            });
        }
        
        // Addon
        this.currentConfig.addons.forEach(addonKey => {
            const addon = this.pricing.addons[addonKey];
            items.push({
                label: addon.name,
                value: addon.price,
                type: 'addon'
            });
        });
        
        // Sconto
        if (pricing.discount > 0) {
            const discountKey = this.currentConfig.duration >= 36 ? 'triennial' :
                              this.currentConfig.duration >= 24 ? 'biennial' : 'annual';
            items.push({
                label: this.pricing.discounts[discountKey].label,
                value: -pricing.discount,
                type: 'discount'
            });
        }
        
        breakdown.innerHTML = `
            <h4>Dettaglio Prezzo</h4>
            <div class="breakdown-items">
                ${items.map(item => `
                    <div class="breakdown-item ${item.type}">
                        <span class="item-label">${item.label}</span>
                        <span class="item-value">${this.formatPrice(Math.abs(item.value))}</span>
                    </div>
                `).join('')}
            </div>
            <div class="breakdown-total">
                <strong>Totale Mensile: ${this.formatPrice(pricing.monthlyPrice)}</strong>
            </div>
        `;
    }
    
    /**
     * Aggiorna grafico prezzi
     */
    updatePriceChart(pricing) {
        const chartContainer = document.getElementById('price-chart');
        if (!chartContainer || this.priceHistory.length < 2) return;
        
        // Semplice grafico SVG delle variazioni prezzo
        const width = 300;
        const height = 100;
        const padding = 20;
        
        const prices = this.priceHistory.map(h => h.monthlyPrice);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice || 1;
        
        const points = this.priceHistory.map((h, i) => {
            const x = padding + (i * (width - 2 * padding)) / (this.priceHistory.length - 1);
            const y = height - padding - ((h.monthlyPrice - minPrice) * (height - 2 * padding)) / priceRange;
            return `${x},${y}`;
        }).join(' ');
        
        chartContainer.innerHTML = `
            <h4>Andamento Prezzo</h4>
            <svg width="${width}" height="${height}" class="price-chart-svg">
                <polyline points="${points}" stroke="#2196F3" stroke-width="2" fill="none"/>
                <circle cx="${points.split(' ').pop().split(',')[0]}" 
                        cy="${points.split(' ').pop().split(',')[1]}" 
                        r="4" fill="#2196F3"/>
            </svg>
        `;
    }
    
    /**
     * Memorizza storico prezzi
     */
    storePriceHistory(pricing) {
        this.priceHistory.push({
            ...pricing,
            timestamp: Date.now(),
            config: { ...this.currentConfig }
        });
        
        // Mantieni solo ultimi 10 cambiamenti
        if (this.priceHistory.length > 10) {
            this.priceHistory.shift();
        }
    }
    
    /**
     * Aggiorna features list
     */
    updateFeatures() {
        const featuresGrid = document.getElementById('features-grid');
        if (!featuresGrid) return;
        
        const plan = this.pricing.plans[this.currentConfig.plan];
        const allFeatures = new Set([...plan.features]);
        
        // Aggiungi features da addon
        this.currentConfig.addons.forEach(addonKey => {
            const addon = this.pricing.addons[addonKey];
            allFeatures.add(addon.name);
        });
        
        featuresGrid.innerHTML = Array.from(allFeatures).map(feature => `
            <div class="feature-item">
                <span class="feature-icon">✓</span>
                <span class="feature-text">${feature}</span>
            </div>
        `).join('');
    }
    
    /**
     * Setup funzionalità comparazione
     */
    setupComparisonFeature() {
        if (!this.options.enableComparison) return;
        
        this.comparisonPlans = [];
    }
    
    /**
     * Aggiungi al confronto
     */
    addToComparison() {
        const currentPricing = this.calculatePricing();
        const configSnapshot = {
            ...this.currentConfig,
            addons: new Set(this.currentConfig.addons)
        };
        
        this.comparisonPlans.push({
            config: configSnapshot,
            pricing: currentPricing,
            timestamp: Date.now()
        });
        
        this.updateComparisonTable();
        
        // Feedback utente
        if (window.feedbackSystem) {
            window.feedbackSystem.showNotification('Configurazione aggiunta al confronto', 'success');
        }
    }
    
    /**
     * Pulisci confronto
     */
    clearComparison() {
        this.comparisonPlans = [];
        this.updateComparisonTable();
    }
    
    /**
     * Aggiorna tabella confronto
     */
    updateComparisonTable() {
        const comparisonContent = document.querySelector('.comparison-content');
        if (!comparisonContent) return;
        
        if (this.comparisonPlans.length === 0) {
            comparisonContent.innerHTML = '<p class="no-comparison">Nessuna configurazione nel confronto</p>';
            return;
        }
        
        const table = document.createElement('table');
        table.className = 'comparison-table-grid';
        
        // Header
        const headerRow = table.insertRow();
        headerRow.innerHTML = `
            <th>Configurazione</th>
            ${this.comparisonPlans.map((_, i) => `<th>Config ${i + 1}</th>`).join('')}
        `;
        
        // Righe di confronto
        const comparisonRows = [
            { label: 'Piano', key: 'plan' },
            { label: 'Utenti', key: 'users' },
            { label: 'Durata', key: 'duration' },
            { label: 'Prezzo Mensile', key: 'monthlyPrice', isPrice: true },
            { label: 'Prezzo Annuale', key: 'annualPrice', isPrice: true }
        ];
        
        comparisonRows.forEach(row => {
            const tr = table.insertRow();
            tr.innerHTML = `
                <td class="comparison-label">${row.label}</td>
                ${this.comparisonPlans.map(plan => {
                    let value;
                    if (row.isPrice) {
                        value = this.formatPrice(plan.pricing[row.key]);
                    } else if (row.key === 'plan') {
                        value = this.pricing.plans[plan.config[row.key]].name;
                    } else if (row.key === 'duration') {
                        value = plan.config[row.key] === 1 ? 'Mensile' : 
                               plan.config[row.key] === 12 ? 'Annuale' : 
                               `${plan.config[row.key]} mesi`;
                    } else {
                        value = plan.config[row.key];
                    }
                    
                    return `<td class="comparison-value">${value}</td>`;
                }).join('')}
            `;
        });
        
        comparisonContent.innerHTML = '';
        comparisonContent.appendChild(table);
    }
    
    /**
     * Richiedi preventivo
     */
    requestQuote() {
        const pricing = this.calculatePricing();
        const quoteData = {
            config: this.currentConfig,
            pricing: pricing,
            timestamp: new Date().toISOString()
        };
        
        // Simula invio richiesta
        if (window.feedbackSystem) {
            window.feedbackSystem.showNotification('Invio richiesta preventivo...', 'info');
            
            setTimeout(() => {
                window.feedbackSystem.showNotification('Richiesta inviata! Ti contatteremo presto.', 'success');
            }, 2000);
        }
        
        // In implementazione reale, inviare dati al server
        console.log('Quote request:', quoteData);
    }
    
    /**
     * Salva configurazione
     */
    saveConfiguration() {
        const configData = {
            config: this.currentConfig,
            pricing: this.calculatePricing(),
            timestamp: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('priceCalculatorConfig', JSON.stringify(configData));
            
            if (window.feedbackSystem) {
                window.feedbackSystem.showNotification('Configurazione salvata', 'success');
            }
        } catch (error) {
            if (window.feedbackSystem) {
                window.feedbackSystem.showNotification('Errore nel salvataggio', 'error');
            }
        }
    }
    
    /**
     * Condividi configurazione
     */
    async shareConfiguration() {
        const pricing = this.calculatePricing();
        const shareText = `Configurazione ArchiTech Security:\n` +
                         `Piano: ${this.pricing.plans[this.currentConfig.plan].name}\n` +
                         `Utenti: ${this.currentConfig.users}\n` +
                         `Prezzo: ${this.formatPrice(pricing.monthlyPrice)}/mese`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Configurazione ArchiTech',
                    text: shareText,
                    url: window.location.href
                });
            } catch (error) {
                this.fallbackShare(shareText);
            }
        } else {
            this.fallbackShare(shareText);
        }
    }
    
    /**
     * Fallback condivisione
     */
    fallbackShare(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                if (window.feedbackSystem) {
                    window.feedbackSystem.showNotification('Link copiato negli appunti', 'success');
                }
            });
        }
    }
    
    /**
     * Esporta in PDF
     */
    exportToPDF() {
        // Simulazione export PDF
        if (window.feedbackSystem) {
            window.feedbackSystem.showNotification('Generazione PDF in corso...', 'info');
            
            setTimeout(() => {
                window.feedbackSystem.showNotification('PDF generato! Download avviato.', 'success');
            }, 3000);
        }
    }
    
    /**
     * Aggiungi stili CSS
     */
    addCalculatorStyles() {
        if (document.getElementById('price-calculator-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'price-calculator-styles';
        style.textContent = `
            .price-calculator {
                max-width: 1200px;
                margin: 2rem auto;
                padding: 2rem;
                background: #000;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                color: white;
            }
            
            .calculator-header {
                text-align: center;
                margin-bottom: 2rem;
            }
            
            .calculator-header h2 {
                color: #fff;
                margin-bottom: 0.5rem;
            }
            
            .calculator-content {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 2rem;
                margin-bottom: 2rem;
            }
            
            .plan-options {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-top: 1rem;
            }
            
            .plan-option {
                padding: 1.5rem;
                border: 2px solid #333;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                background: #111;
            }
            
            .plan-option.active {
                border-color: #4CAF50;
                background: rgba(76, 175, 80, 0.1);
            }
            
            .plan-option:hover {
                border-color: #555;
            }
            
            .plan-header {
                display: flex;
                justify-content: between;
                align-items: center;
                margin-bottom: 0.5rem;
            }
            
            .plan-price {
                color: #4CAF50;
                font-weight: bold;
                font-size: 1.2rem;
            }
            
            .control-group {
                margin-bottom: 2rem;
            }
            
            .control-label {
                display: block;
                margin-bottom: 0.5rem;
                font-weight: 500;
                color: #fff;
            }
            
            .price-slider {
                width: 100%;
                height: 6px;
                border-radius: 3px;
                background: #333;
                outline: none;
                -webkit-appearance: none;
            }
            
            .price-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #4CAF50;
                cursor: pointer;
            }
            
            .duration-options {
                display: flex;
                gap: 1rem;
                margin-top: 1rem;
            }
            
            .duration-option {
                flex: 1;
                padding: 1rem;
                border: 2px solid #333;
                border-radius: 8px;
                background: #111;
                color: white;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
            }
            
            .duration-option.active {
                border-color: #4CAF50;
                background: rgba(76, 175, 80, 0.1);
            }
            
            .duration-badge {
                position: absolute;
                top: -8px;
                right: -8px;
                background: #FF9800;
                color: white;
                padding: 0.2rem 0.5rem;
                border-radius: 12px;
                font-size: 0.8rem;
            }
            
            .addon-list {
                display: grid;
                gap: 1rem;
                margin-top: 1rem;
            }
            
            .addon-item {
                display: flex;
                align-items: center;
                padding: 1rem;
                border: 2px solid #333;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                background: #111;
            }
            
            .addon-item.selected {
                border-color: #4CAF50;
                background: rgba(76, 175, 80, 0.1);
            }
            
            .addon-checkbox {
                margin-right: 1rem;
            }
            
            .addon-info {
                flex: 1;
            }
            
            .addon-price {
                color: #4CAF50;
                font-weight: bold;
            }
            
            .price-display {
                background: #111;
                padding: 2rem;
                border-radius: 8px;
            }
            
            .price-summary {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 2rem;
                margin-bottom: 2rem;
            }
            
            .price-amount {
                display: block;
                font-size: 2rem;
                font-weight: bold;
                color: #4CAF50;
            }
            
            .savings {
                color: #FF9800;
                font-size: 0.9rem;
            }
            
            .breakdown-items {
                margin: 1rem 0;
            }
            
            .breakdown-item {
                display: flex;
                justify-content: space-between;
                padding: 0.5rem 0;
                border-bottom: 1px solid #333;
            }
            
            .breakdown-total {
                margin-top: 1rem;
                padding-top: 1rem;
                border-top: 2px solid #4CAF50;
                color: #4CAF50;
            }
            
            .calculator-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
                margin-top: 2rem;
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
            
            .btn-primary:hover {
                background: #45a049;
            }
            
            .btn-secondary:hover {
                background: #444;
            }
            
            @media (max-width: 768px) {
                .calculator-content {
                    grid-template-columns: 1fr;
                }
                
                .price-summary {
                    grid-template-columns: 1fr;
                }
                
                .duration-options {
                    flex-direction: column;
                }
                
                .calculator-actions {
                    flex-direction: column;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Formatta prezzo
     */
    formatPrice(amount) {
        return new Intl.NumberFormat(this.options.locale, {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }
    
    /**
     * Utility debounce
     */
    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    /**
     * Cleanup calculator
     */
    destroy() {
        const calculator = document.getElementById('price-calculator');
        if (calculator) {
            calculator.remove();
        }
        
        const styles = document.getElementById('price-calculator-styles');
        if (styles) {
            styles.remove();
        }
    }
}

// Auto-inizializzazione quando DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    // Inizializza solo se siamo nella pagina pricing o se richiesto
    if (document.querySelector('.pricing-section') || 
        document.querySelector('[data-enable-calculator]')) {
        
        window.priceCalculator = new InteractivePriceCalculator({
            currency: '€',
            locale: 'it-IT',
            enableComparison: true,
            enableSavings: true
        });
    }
});

export default InteractivePriceCalculator;
