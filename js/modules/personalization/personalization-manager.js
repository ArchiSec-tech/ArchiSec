/**
 * Personalization Manager
 * Gestisce preferenze utente, temi, localStorage e ripristino sessione
 * Mantiene coerenza con design ArchiTech
 */

class PersonalizationManager {
    constructor(options = {}) {
        this.options = {
            storagePrefix: 'architech_',
            themeStorageKey: 'theme_preference',
            userPrefsKey: 'user_preferences',
            formDataKey: 'form_data_backup',
            sessionKey: 'session_state',
            defaultTheme: 'dark',
            autoSaveInterval: 30000, // 30 secondi
            enableAnalytics: true,
            ...options
        };
        
        this.currentTheme = this.options.defaultTheme;
        this.userPreferences = {};
        this.formBackups = {};
        this.sessionState = {};
        
        this.init();
    }
    
    init() {
        this.loadUserPreferences();
        this.initializeThemeSystem();
        this.setupFormBackup();
        this.initializeSessionRestore();
        this.setupPreferenceInterface();
        this.startAutoSave();
    }
    
    /**
     * Carica preferenze utente da localStorage
     */
    loadUserPreferences() {
        try {
            const stored = localStorage.getItem(this.getStorageKey('user_preferences'));
            this.userPreferences = stored ? JSON.parse(stored) : this.getDefaultPreferences();
            
            // Applica preferenze caricate
            this.applyUserPreferences();
        } catch (error) {
            console.warn('Errore caricamento preferenze utente:', error);
            this.userPreferences = this.getDefaultPreferences();
        }
    }
    
    /**
     * Ottieni preferenze di default
     */
    getDefaultPreferences() {
        return {
            theme: this.options.defaultTheme,
            language: 'it',
            animations: true,
            notifications: true,
            autoSave: true,
            accessibilityMode: false,
            fontSize: 'normal',
            contrastMode: 'normal',
            soundEnabled: false,
            vibrationEnabled: true,
            cookiesAccepted: false,
            analyticsEnabled: false,
            marketingEnabled: false,
            contentPreferences: {
                showTutorials: true,
                showTips: true,
                compactView: false
            },
            navigationPreferences: {
                stickyHeader: true,
                breadcrumbs: true,
                backToTop: true
            }
        };
    }
    
    /**
     * Applica preferenze utente
     */
    applyUserPreferences() {
        // Tema
        this.setTheme(this.userPreferences.theme);
        
        // Animazioni
        if (!this.userPreferences.animations) {
            document.documentElement.classList.add('reduce-motion');
        }
        
        // Font size
        this.setFontSize(this.userPreferences.fontSize);
        
        // Contrast mode
        this.setContrastMode(this.userPreferences.contrastMode);
        
        // Accessibility mode
        if (this.userPreferences.accessibilityMode) {
            document.documentElement.classList.add('accessibility-mode');
        }
        
        // Navigation preferences
        this.applyNavigationPreferences();
        
        console.log('✅ Preferenze utente applicate');
    }
    
    /**
     * Sistema di gestione temi
     */
    initializeThemeSystem() {
        // Rileva preferenza sistema
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Se utente non ha preferenza salvata, usa quella del sistema
        if (!localStorage.getItem(this.getStorageKey('theme_preference'))) {
            this.currentTheme = systemPrefersDark ? 'dark' : 'light';
        } else {
            this.currentTheme = localStorage.getItem(this.getStorageKey('theme_preference')) || this.options.defaultTheme;
        }
        
        this.setTheme(this.currentTheme);
        
        // Ascolta cambiamenti preferenze sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(this.getStorageKey('theme_preference'))) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
    
    /**
     * Imposta tema
     */
    setTheme(theme) {
        const validThemes = ['light', 'dark', 'auto', 'high-contrast'];
        
        if (!validThemes.includes(theme)) {
            theme = this.options.defaultTheme;
        }
        
        this.currentTheme = theme;
        
        // Rimuovi classi tema esistenti
        validThemes.forEach(t => {
            document.documentElement.classList.remove(`theme-${t}`);
        });
        
        // Applica nuovo tema
        if (theme === 'auto') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            theme = systemPrefersDark ? 'dark' : 'light';
        }
        
        document.documentElement.classList.add(`theme-${theme}`);
        document.documentElement.setAttribute('data-theme', theme);
        
        // Salva preferenza
        this.savePreference('theme', theme);
        localStorage.setItem(this.getStorageKey('theme_preference'), theme);
        
        // Trigger evento per altri componenti
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: theme, previousTheme: this.currentTheme }
        }));
    }
    
    /**
     * Imposta dimensione font
     */
    setFontSize(size) {
        const validSizes = ['small', 'normal', 'large', 'extra-large'];
        
        if (!validSizes.includes(size)) {
            size = 'normal';
        }
        
        // Rimuovi classi esistenti
        validSizes.forEach(s => {
            document.documentElement.classList.remove(`font-size-${s}`);
        });
        
        document.documentElement.classList.add(`font-size-${size}`);
        
        this.savePreference('fontSize', size);
    }
    
    /**
     * Imposta modalità contrasto
     */
    setContrastMode(mode) {
        const validModes = ['normal', 'high', 'low'];
        
        if (!validModes.includes(mode)) {
            mode = 'normal';
        }
        
        // Rimuovi classi esistenti
        validModes.forEach(m => {
            document.documentElement.classList.remove(`contrast-${m}`);
        });
        
        if (mode !== 'normal') {
            document.documentElement.classList.add(`contrast-${mode}`);
        }
        
        this.savePreference('contrastMode', mode);
    }
    
    /**
     * Applica preferenze navigazione
     */
    applyNavigationPreferences() {
        const navPrefs = this.userPreferences.navigationPreferences;
        
        // Sticky header
        const header = document.querySelector('.site-header');
        if (header) {
            header.classList.toggle('sticky-disabled', !navPrefs.stickyHeader);
        }
        
        // Breadcrumbs
        const breadcrumbs = document.querySelector('.breadcrumbs');
        if (breadcrumbs) {
            breadcrumbs.style.display = navPrefs.breadcrumbs ? 'block' : 'none';
        }
        
        // Back to top button
        if (navPrefs.backToTop) {
            this.createBackToTopButton();
        }
    }
    
    /**
     * Crea bottone back to top
     */
    createBackToTopButton() {
        if (document.getElementById('back-to-top')) return;
        
        const button = document.createElement('button');
        button.id = 'back-to-top';
        button.className = 'back-to-top-btn';
        button.innerHTML = '↑';
        button.setAttribute('aria-label', 'Torna all\'inizio');
        
        document.body.appendChild(button);
        
        // Mostra/nascondi basato su scroll
        let isVisible = false;
        
        const toggleVisibility = () => {
            const shouldShow = window.pageYOffset > 300;
            
            if (shouldShow && !isVisible) {
                button.classList.add('visible');
                isVisible = true;
            } else if (!shouldShow && isVisible) {
                button.classList.remove('visible');
                isVisible = false;
            }
        };
        
        // Ottimizza con performance optimizer se disponibile
        if (window.performanceOptimizer) {
            window.performanceOptimizer.addScrollCallback(toggleVisibility);
        } else {
            window.addEventListener('scroll', this.throttle(toggleVisibility, 100));
        }
        
        // Click handler
        button.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    /**
     * Setup backup automatico form
     */
    setupFormBackup() {
        if (!this.userPreferences.autoSave) return;
        
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            const formId = form.id || form.className || 'unnamed-form';
            
            // Ripristina dati salvati
            this.restoreFormData(form, formId);
            
            // Setup auto-backup
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                // Throttle per performance
                const saveFormData = this.throttle(() => {
                    this.backupFormData(form, formId);
                }, 1000);
                
                input.addEventListener('input', saveFormData);
                input.addEventListener('change', saveFormData);
            });
            
            // Pulisci backup al submit
            form.addEventListener('submit', () => {
                this.clearFormBackup(formId);
            });
        });
    }
    
    /**
     * Backup dati form
     */
    backupFormData(form, formId) {
        try {
            const formData = new FormData(form);
            const dataObject = {};
            
            for (let [key, value] of formData.entries()) {
                dataObject[key] = value;
            }
            
            // Include checkbox unchecked
            const checkboxes = form.querySelectorAll('input[type=\"checkbox\"]');
            checkboxes.forEach(checkbox => {
                if (!checkbox.checked && checkbox.name) {
                    dataObject[checkbox.name] = false;
                }
            });
            
            this.formBackups[formId] = {
                data: dataObject,
                timestamp: Date.now(),
                url: window.location.href
            };
            
            this.saveToStorage('form_data_backup', this.formBackups);
        } catch (error) {
            console.warn('Errore backup form:', error);
        }
    }
    
    /**
     * Ripristina dati form
     */
    restoreFormData(form, formId) {
        try {
            const stored = this.getFromStorage('form_data_backup');
            if (!stored || !stored[formId]) return;
            
            const backup = stored[formId];
            
            // Verifica se backup è valido (non troppo vecchio, stessa URL)
            const maxAge = 24 * 60 * 60 * 1000; // 24 ore
            if (Date.now() - backup.timestamp > maxAge || 
                backup.url !== window.location.href) {
                delete stored[formId];
                this.saveToStorage('form_data_backup', stored);
                return;
            }
            
            // Ripristina dati
            Object.entries(backup.data).forEach(([name, value]) => {
                const input = form.querySelector(`[name=\"${name}\"]`);
                if (input) {
                    if (input.type === 'checkbox') {
                        input.checked = Boolean(value);
                    } else if (input.type === 'radio') {
                        if (input.value === value) {
                            input.checked = true;
                        }
                    } else {
                        input.value = value;
                    }
                }
            });
            
            // Mostra notifica ripristino
            if (window.feedbackSystem) {
                window.feedbackSystem.showNotification(
                    'Dati form ripristinati da backup precedente', 
                    'info'
                );
            }
        } catch (error) {
            console.warn('Errore ripristino form:', error);
        }
    }
    
    /**
     * Pulisci backup form
     */
    clearFormBackup(formId) {
        try {
            const stored = this.getFromStorage('form_data_backup') || {};
            delete stored[formId];
            this.saveToStorage('form_data_backup', stored);
        } catch (error) {
            console.warn('Errore pulizia backup form:', error);
        }
    }
    
    /**
     * Inizializza ripristino sessione
     */
    initializeSessionRestore() {
        // Salva stato sessione prima di chiudere
        window.addEventListener('beforeunload', () => {
            this.saveSessionState();
        });
        
        // Ripristina stato sessione
        this.restoreSessionState();
        
        // Aggiorna stato periodicamente
        setInterval(() => {
            this.updateSessionState();
        }, 30000); // Ogni 30 secondi
    }
    
    /**
     * Salva stato sessione
     */
    saveSessionState() {
        const sessionState = {
            url: window.location.href,
            scrollPosition: window.pageYOffset,
            timestamp: Date.now(),
            activeElement: document.activeElement ? document.activeElement.name || document.activeElement.id : null,
            formData: this.formBackups,
            userActions: this.getUserActionHistory()
        };
        
        this.saveToStorage('session_state', sessionState);
    }
    
    /**
     * Ripristina stato sessione
     */
    restoreSessionState() {
        try {
            const sessionState = this.getFromStorage('session_state');
            if (!sessionState) return;
            
            // Verifica se sessione è valida (non troppo vecchia, stessa URL)
            const maxAge = 30 * 60 * 1000; // 30 minuti
            if (Date.now() - sessionState.timestamp > maxAge || 
                sessionState.url !== window.location.href) {
                return;
            }
            
            // Ripristina posizione scroll
            if (sessionState.scrollPosition > 0) {
                setTimeout(() => {
                    window.scrollTo(0, sessionState.scrollPosition);
                }, 100);
            }
            
            // Ripristina focus elemento attivo
            if (sessionState.activeElement) {
                setTimeout(() => {
                    const element = document.querySelector(`[name=\"${sessionState.activeElement}\"], #${sessionState.activeElement}`);
                    if (element) {
                        element.focus();
                    }
                }, 200);
            }
        } catch (error) {
            console.warn('Errore ripristino sessione:', error);
        }
    }
    
    /**
     * Aggiorna stato sessione
     */
    updateSessionState() {
        if (document.visibilityState !== 'hidden') {
            this.sessionState = {
                lastActivity: Date.now(),
                currentUrl: window.location.href,
                scrollPosition: window.pageYOffset
            };
        }
    }
    
    /**
     * Ottieni storico azioni utente
     */
    getUserActionHistory() {
        // Placeholder per future implementazioni di tracking azioni
        return {
            clickCount: 0,
            formInteractions: 0,
            timeOnPage: Date.now() - (window.pageStartTime || Date.now())
        };
    }
    
    /**
     * Setup interfaccia preferenze
     */
    setupPreferenceInterface() {
        this.createPreferencePanel();
        this.createThemeToggle();
        this.createAccessibilityTools();
    }
    
    /**
     * Crea pannello preferenze
     */
    createPreferencePanel() {
        const panel = document.createElement('div');
        panel.id = 'preference-panel';
        panel.className = 'preference-panel';
        panel.innerHTML = this.generatePreferencePanelHTML();
        
        document.body.appendChild(panel);
        
        // Setup event handlers
        this.setupPreferencePanelHandlers(panel);
        
        // Aggiungi stili
        this.addPreferenceStyles();
    }
    
    /**
     * Genera HTML pannello preferenze
     */
    generatePreferencePanelHTML() {
        return `
            <div class=\"panel-header\">
                <h3>Preferenze</h3>
                <button class=\"close-panel\" id=\"close-preferences\">×</button>
            </div>
            
            <div class=\"panel-content\">
                <div class=\"preference-section\">
                    <h4>Aspetto</h4>
                    
                    <div class=\"preference-item\">
                        <label>Tema</label>
                        <select id=\"theme-selector\">
                            <option value=\"auto\">Automatico</option>
                            <option value=\"light\">Chiaro</option>
                            <option value=\"dark\">Scuro</option>
                            <option value=\"high-contrast\">Alto contrasto</option>
                        </select>
                    </div>
                    
                    <div class=\"preference-item\">
                        <label>Dimensione testo</label>
                        <select id=\"font-size-selector\">
                            <option value=\"small\">Piccolo</option>
                            <option value=\"normal\">Normale</option>
                            <option value=\"large\">Grande</option>
                            <option value=\"extra-large\">Molto grande</option>
                        </select>
                    </div>
                    
                    <div class=\"preference-item\">
                        <label>
                            <input type=\"checkbox\" id=\"animations-toggle\">
                            Abilita animazioni
                        </label>
                    </div>
                </div>
                
                <div class=\"preference-section\">
                    <h4>Accessibilità</h4>
                    
                    <div class=\"preference-item\">
                        <label>
                            <input type=\"checkbox\" id=\"accessibility-mode\">
                            Modalità accessibilità
                        </label>
                    </div>
                    
                    <div class=\"preference-item\">
                        <label>Contrasto</label>
                        <select id=\"contrast-selector\">
                            <option value=\"normal\">Normale</option>
                            <option value=\"high\">Alto</option>
                            <option value=\"low\">Basso</option>
                        </select>
                    </div>
                </div>
                
                <div class=\"preference-section\">
                    <h4>Funzionalità</h4>
                    
                    <div class=\"preference-item\">
                        <label>
                            <input type=\"checkbox\" id=\"auto-save-toggle\">
                            Salvataggio automatico
                        </label>
                    </div>
                    
                    <div class=\"preference-item\">
                        <label>
                            <input type=\"checkbox\" id=\"notifications-toggle\">
                            Notifiche
                        </label>
                    </div>
                    
                    <div class=\"preference-item\">
                        <label>
                            <input type=\"checkbox\" id=\"sound-toggle\">
                            Feedback audio
                        </label>
                    </div>
                </div>
                
                <div class=\"preference-actions\">
                    <button class=\"btn-primary\" id=\"save-preferences\">Salva</button>
                    <button class=\"btn-secondary\" id=\"reset-preferences\">Ripristina</button>
                    <button class=\"btn-secondary\" id=\"export-preferences\">Esporta</button>
                </div>
            </div>
        `;
    }
    
    /**
     * Setup handlers pannello preferenze
     */
    setupPreferencePanelHandlers(panel) {
        // Chiusura pannello
        panel.querySelector('#close-preferences').addEventListener('click', () => {
            this.hidePreferencePanel();
        });
        
        // Selettori
        panel.querySelector('#theme-selector').addEventListener('change', (e) => {
            this.setTheme(e.target.value);
        });
        
        panel.querySelector('#font-size-selector').addEventListener('change', (e) => {
            this.setFontSize(e.target.value);
        });
        
        panel.querySelector('#contrast-selector').addEventListener('change', (e) => {
            this.setContrastMode(e.target.value);
        });
        
        // Checkboxes
        panel.querySelector('#animations-toggle').addEventListener('change', (e) => {
            this.savePreference('animations', e.target.checked);
            document.documentElement.classList.toggle('reduce-motion', !e.target.checked);
        });
        
        panel.querySelector('#accessibility-mode').addEventListener('change', (e) => {
            this.savePreference('accessibilityMode', e.target.checked);
            document.documentElement.classList.toggle('accessibility-mode', e.target.checked);
        });
        
        panel.querySelector('#auto-save-toggle').addEventListener('change', (e) => {
            this.savePreference('autoSave', e.target.checked);
        });
        
        panel.querySelector('#notifications-toggle').addEventListener('change', (e) => {
            this.savePreference('notifications', e.target.checked);
        });
        
        panel.querySelector('#sound-toggle').addEventListener('change', (e) => {
            this.savePreference('soundEnabled', e.target.checked);
        });
        
        // Bottoni azione
        panel.querySelector('#save-preferences').addEventListener('click', () => {
            this.saveAllPreferences();
        });
        
        panel.querySelector('#reset-preferences').addEventListener('click', () => {
            this.resetPreferences();
        });
        
        panel.querySelector('#export-preferences').addEventListener('click', () => {
            this.exportPreferences();
        });
        
        // Popola valori correnti
        this.populatePreferencePanel(panel);
    }
    
    /**
     * Popola pannello con valori correnti
     */
    populatePreferencePanel(panel) {
        const prefs = this.userPreferences;
        
        panel.querySelector('#theme-selector').value = prefs.theme;
        panel.querySelector('#font-size-selector').value = prefs.fontSize;
        panel.querySelector('#contrast-selector').value = prefs.contrastMode;
        
        panel.querySelector('#animations-toggle').checked = prefs.animations;
        panel.querySelector('#accessibility-mode').checked = prefs.accessibilityMode;
        panel.querySelector('#auto-save-toggle').checked = prefs.autoSave;
        panel.querySelector('#notifications-toggle').checked = prefs.notifications;
        panel.querySelector('#sound-toggle').checked = prefs.soundEnabled;
    }
    
    /**
     * Crea toggle tema rapido
     */
    createThemeToggle() {
        const toggle = document.createElement('button');
        toggle.id = 'theme-toggle';
        toggle.className = 'theme-toggle';
        toggle.innerHTML = '🌓';
        toggle.setAttribute('aria-label', 'Cambia tema');
        
        document.body.appendChild(toggle);
        
        toggle.addEventListener('click', () => {
            const nextTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(nextTheme);
        });
    }
    
    /**
     * Crea strumenti accessibilità
     */
    createAccessibilityTools() {
        if (document.getElementById('accessibility-tools')) return;
        
        const tools = document.createElement('div');
        tools.id = 'accessibility-tools';
        tools.className = 'accessibility-tools';
        tools.innerHTML = `
            <button class=\"accessibility-toggle\" aria-label=\"Strumenti accessibilità\">♿</button>
            <div class=\"accessibility-menu\">
                <button data-action=\"increase-font\">A+</button>
                <button data-action=\"decrease-font\">A-</button>
                <button data-action=\"high-contrast\">◐</button>
                <button data-action=\"focus-mode\">👁</button>
            </div>
        `;
        
        document.body.appendChild(tools);
        
        // Setup handlers
        const toggle = tools.querySelector('.accessibility-toggle');
        const menu = tools.querySelector('.accessibility-menu');
        
        toggle.addEventListener('click', () => {
            menu.classList.toggle('visible');
        });
        
        // Actions
        tools.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                this.executeAccessibilityAction(action);
            }
        });
    }
    
    /**
     * Esegui azione accessibilità
     */
    executeAccessibilityAction(action) {
        switch (action) {
            case 'increase-font':
                const currentSize = this.userPreferences.fontSize;
                const sizes = ['small', 'normal', 'large', 'extra-large'];
                const currentIndex = sizes.indexOf(currentSize);
                if (currentIndex < sizes.length - 1) {
                    this.setFontSize(sizes[currentIndex + 1]);
                }
                break;
                
            case 'decrease-font':
                const currentSizeD = this.userPreferences.fontSize;
                const sizesD = ['small', 'normal', 'large', 'extra-large'];
                const currentIndexD = sizesD.indexOf(currentSizeD);
                if (currentIndexD > 0) {
                    this.setFontSize(sizesD[currentIndexD - 1]);
                }
                break;
                
            case 'high-contrast':
                const newMode = this.userPreferences.contrastMode === 'high' ? 'normal' : 'high';
                this.setContrastMode(newMode);
                break;
                
            case 'focus-mode':
                document.documentElement.classList.toggle('focus-mode');
                this.savePreference('focusMode', document.documentElement.classList.contains('focus-mode'));
                break;
        }
    }
    
    /**
     * Mostra pannello preferenze
     */
    showPreferencePanel() {
        const panel = document.getElementById('preference-panel');
        if (panel) {
            panel.classList.add('visible');
        }
    }
    
    /**
     * Nascondi pannello preferenze
     */
    hidePreferencePanel() {
        const panel = document.getElementById('preference-panel');
        if (panel) {
            panel.classList.remove('visible');
        }
    }
    
    /**
     * Salva singola preferenza
     */
    savePreference(key, value) {
        this.userPreferences[key] = value;
        this.saveToStorage('user_preferences', this.userPreferences);
    }
    
    /**
     * Salva tutte le preferenze
     */
    saveAllPreferences() {
        this.saveToStorage('user_preferences', this.userPreferences);
        
        if (window.feedbackSystem) {
            window.feedbackSystem.showNotification('Preferenze salvate', 'success');
        }
    }
    
    /**
     * Reset preferenze
     */
    resetPreferences() {
        if (confirm('Vuoi ripristinare tutte le preferenze ai valori di default?')) {
            this.userPreferences = this.getDefaultPreferences();
            this.saveAllPreferences();
            this.applyUserPreferences();
            
            // Aggiorna pannello
            const panel = document.getElementById('preference-panel');
            if (panel) {
                this.populatePreferencePanel(panel);
            }
        }
    }
    
    /**
     * Esporta preferenze
     */
    exportPreferences() {
        const exportData = {
            preferences: this.userPreferences,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `architech-preferences-${Date.now()}.json`;
        link.click();
    }
    
    /**
     * Importa preferenze
     */
    importPreferences(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                if (importData.preferences) {
                    this.userPreferences = { ...this.getDefaultPreferences(), ...importData.preferences };
                    this.saveAllPreferences();
                    this.applyUserPreferences();
                    
                    if (window.feedbackSystem) {
                        window.feedbackSystem.showNotification('Preferenze importate con successo', 'success');
                    }
                }
            } catch (error) {
                if (window.feedbackSystem) {
                    window.feedbackSystem.showNotification('Errore nell\'importazione', 'error');
                }
            }
        };
        reader.readAsText(file);
    }
    
    /**
     * Auto-save periodico
     */
    startAutoSave() {
        setInterval(() => {
            if (this.userPreferences.autoSave) {
                this.saveSessionState();
            }
        }, this.options.autoSaveInterval);
    }
    
    /**
     * Utility: salva in storage
     */
    saveToStorage(key, data) {
        try {
            localStorage.setItem(this.getStorageKey(key), JSON.stringify(data));
        } catch (error) {
            console.warn('Errore salvataggio localStorage:', error);
        }
    }
    
    /**
     * Utility: carica da storage
     */
    getFromStorage(key) {
        try {
            const stored = localStorage.getItem(this.getStorageKey(key));
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.warn('Errore caricamento localStorage:', error);
            return null;
        }
    }
    
    /**
     * Utility: genera chiave storage
     */
    getStorageKey(key) {
        return `${this.options.storagePrefix}${key}`;
    }
    
    /**
     * Utility: throttle
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * Aggiungi stili CSS
     */
    addPreferenceStyles() {
        if (document.getElementById('personalization-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'personalization-styles';
        style.textContent = `
            /* Theme styles */
            .theme-light {
                --bg-primary: #ffffff;
                --bg-secondary: #f5f5f5;
                --text-primary: #333333;
                --text-secondary: #666666;
                --border-color: #ddd;
            }
            
            .theme-dark {
                --bg-primary: #000000;
                --bg-secondary: #111111;
                --text-primary: #ffffff;
                --text-secondary: #cccccc;
                --border-color: #333;
            }
            
            /* Font size variants */
            .font-size-small {
                font-size: 0.875rem;
            }
            
            .font-size-large {
                font-size: 1.125rem;
            }
            
            .font-size-extra-large {
                font-size: 1.25rem;
            }
            
            /* Contrast modes */
            .contrast-high {
                filter: contrast(150%);
            }
            
            .contrast-low {
                filter: contrast(75%);
            }
            
            /* Accessibility mode */
            .accessibility-mode * {
                outline: 2px solid transparent !important;
            }
            
            .accessibility-mode *:focus {
                outline: 3px solid #4CAF50 !important;
                outline-offset: 2px !important;
            }
            
            /* Preference panel */
            .preference-panel {
                position: fixed;
                top: 0;
                right: -400px;
                width: 400px;
                height: 100vh;
                background: var(--bg-primary, #000);
                border-left: 1px solid var(--border-color, #333);
                z-index: 10000;
                transition: right 0.3s ease;
                overflow-y: auto;
            }
            
            .preference-panel.visible {
                right: 0;
            }
            
            .panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                border-bottom: 1px solid var(--border-color, #333);
            }
            
            .preference-section {
                padding: 1.5rem 1rem;
                border-bottom: 1px solid var(--border-color, #333);
            }
            
            .preference-item {
                margin-bottom: 1rem;
            }
            
            .preference-item label {
                display: block;
                margin-bottom: 0.5rem;
                color: var(--text-primary, #fff);
            }
            
            .preference-item select,
            .preference-item input {
                width: 100%;
                padding: 0.5rem;
                border: 1px solid var(--border-color, #333);
                border-radius: 4px;
                background: var(--bg-secondary, #111);
                color: var(--text-primary, #fff);
            }
            
            .preference-actions {
                padding: 1rem;
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
            }
            
            /* Theme toggle */
            .theme-toggle {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                border: none;
                background: var(--bg-secondary, #111);
                color: var(--text-primary, #fff);
                font-size: 1.5rem;
                cursor: pointer;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
            }
            
            .theme-toggle:hover {
                transform: scale(1.1);
            }
            
            /* Accessibility tools */
            .accessibility-tools {
                position: fixed;
                bottom: 80px;
                right: 20px;
                z-index: 1000;
            }
            
            .accessibility-toggle {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                border: none;
                background: #4CAF50;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }
            
            .accessibility-menu {
                position: absolute;
                bottom: 60px;
                right: 0;
                background: var(--bg-primary, #000);
                border: 1px solid var(--border-color, #333);
                border-radius: 8px;
                padding: 0.5rem;
                display: none;
                flex-direction: column;
                gap: 0.25rem;
            }
            
            .accessibility-menu.visible {
                display: flex;
            }
            
            .accessibility-menu button {
                padding: 0.5rem;
                border: none;
                background: transparent;
                color: var(--text-primary, #fff);
                cursor: pointer;
                border-radius: 4px;
                transition: background 0.2s ease;
            }
            
            .accessibility-menu button:hover {
                background: var(--bg-secondary, #111);
            }
            
            /* Back to top button */
            .back-to-top-btn {
                position: fixed;
                bottom: 20px;
                left: 20px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                border: none;
                background: #4CAF50;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }
            
            .back-to-top-btn.visible {
                opacity: 1;
                visibility: visible;
            }
            
            .back-to-top-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(0,0,0,0.4);
            }
            
            /* Focus mode */
            .focus-mode * {
                transition: opacity 0.3s ease;
            }
            
            .focus-mode :not(:focus):not(:focus-within):not(:hover) {
                opacity: 0.7;
            }
            
            @media (max-width: 768px) {
                .preference-panel {
                    width: 100vw;
                    right: -100vw;
                }
                
                .theme-toggle,
                .accessibility-tools {
                    bottom: 10px;
                }
                
                .theme-toggle {
                    right: 10px;
                }
                
                .back-to-top-btn {
                    left: 10px;
                    bottom: 10px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * API pubblica
     */
    getPreference(key) {
        return this.userPreferences[key];
    }
    
    setPreference(key, value) {
        this.savePreference(key, value);
    }
    
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    /**
     * Cleanup
     */
    destroy() {
        // Rimuovi elementi UI
        const elementsToRemove = [
            '#preference-panel',
            '#theme-toggle',
            '#accessibility-tools',
            '#back-to-top'
        ];
        
        elementsToRemove.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) element.remove();
        });
        
        // Rimuovi stili
        const styles = document.getElementById('personalization-styles');
        if (styles) styles.remove();
    }
}

export default PersonalizationManager;
