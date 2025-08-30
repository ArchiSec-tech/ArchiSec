/**
 * Form Handler con Integrazione API - ArchiTech
 * Gestisce l'invio sicuro dei form con validazione avanzata e analytics
 */

class FormHandler {
    constructor() {
        this.forms = new Map();
        this.submitQueue = [];
        this.retryAttempts = 3;
        this.isOnline = navigator.onLine;
        
        this.initializeEventListeners();
        this.loadSavedDrafts();
        this.startPeriodicSync();
    }

    /**
     * Inizializza tutti i listeners per i form
     */
    initializeEventListeners() {
        // Gestione stato di connessione
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processOfflineQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });

        // Auto-registrazione di tutti i form esistenti
        document.addEventListener('DOMContentLoaded', () => {
            this.autoRegisterForms();
        });

        // Gestione dinamica dei form aggiunti successivamente
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.tagName === 'FORM') {
                        this.registerForm(node);
                    }
                    if (node.querySelectorAll) {
                        node.querySelectorAll('form').forEach(form => {
                            this.registerForm(form);
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Auto-registra tutti i form presenti nella pagina
     */
    autoRegisterForms() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => this.registerForm(form));
    }

    /**
     * Registra un form per la gestione avanzata
     */
    registerForm(formElement, options = {}) {
        if (!formElement || formElement.dataset.registered) return;

        const formId = formElement.id || 'form_' + Date.now();
        formElement.id = formId;
        formElement.dataset.registered = 'true';

        const config = {
            endpoint: formElement.action || '/api/form-submit',
            method: formElement.method || 'POST',
            validation: true,
            autosave: true,
            analytics: true,
            encryption: false,
            fileUpload: formElement.querySelector('input[type="file"]') !== null,
            ...options
        };

        this.forms.set(formId, {
            element: formElement,
            config,
            lastSaved: null,
            validationRules: this.extractValidationRules(formElement)
        });

        this.setupFormHandlers(formElement, formId);
        
        // Carica draft salvati
        this.loadDraft(formId);
    }

    /**
     * Estrae regole di validazione dal form
     */
    extractValidationRules(form) {
        const rules = {};
        const inputs = form.querySelectorAll('input, textarea, select');

        inputs.forEach(input => {
            const fieldRules = {};

            if (input.required) fieldRules.required = true;
            if (input.pattern) fieldRules.pattern = input.pattern;
            if (input.minLength) fieldRules.minLength = parseInt(input.minLength);
            if (input.maxLength) fieldRules.maxLength = parseInt(input.maxLength);
            if (input.min) fieldRules.min = parseFloat(input.min);
            if (input.max) fieldRules.max = parseFloat(input.max);

            // Regole personalizzate per tipo
            switch (input.type) {
                case 'email':
                    fieldRules.email = true;
                    break;
                case 'tel':
                    fieldRules.phone = true;
                    break;
                case 'url':
                    fieldRules.url = true;
                    break;
                case 'file':
                    fieldRules.fileTypes = input.accept?.split(',').map(t => t.trim()) || [];
                    fieldRules.maxSize = input.dataset.maxSize || '10MB';
                    break;
            }

            if (Object.keys(fieldRules).length > 0) {
                rules[input.name || input.id] = fieldRules;
            }
        });

        return rules;
    }

    /**
     * Configura gli handler per un form specifico
     */
    setupFormHandlers(form, formId) {
        const formData = this.forms.get(formId);

        // Handler per il submit
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit(formId);
        });

        // Auto-save per i campi
        if (formData.config.autosave) {
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('input', 
                    this.debounce(() => this.saveDraft(formId), 1000)
                );
            });
        }

        // Validazione in tempo reale
        if (formData.config.validation) {
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateField(formId, input);
                });

                input.addEventListener('input', () => {
                    this.clearFieldError(input);
                });
            });
        }

        // Gestione file upload con preview
        const fileInputs = form.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleFilePreview(e.target);
            });
        });
    }

    /**
     * Gestisce il submit del form
     */
    async handleSubmit(formId) {
        const formData = this.forms.get(formId);
        if (!formData) return;

        const form = formData.element;
        
        // Mostra loading state
        this.setLoadingState(form, true);

        try {
            // Validazione completa
            const validationResult = await this.validateForm(formId);
            if (!validationResult.isValid) {
                this.showValidationErrors(form, validationResult.errors);
                return;
            }

            // Preparazione dati
            const submissionData = await this.prepareFormData(formId);
            
            // Analytics - tracking submit attempt
            if (formData.config.analytics) {
                this.trackFormEvent(formId, 'form_submit_attempt', {
                    form_name: form.dataset.name || form.id,
                    fields_count: submissionData.fieldCount
                });
            }

            // Invio del form
            const response = await this.submitForm(formId, submissionData);

            if (response.success) {
                this.handleSubmitSuccess(formId, response);
            } else {
                this.handleSubmitError(formId, response.error);
            }

        } catch (error) {
            this.handleSubmitError(formId, error);
        } finally {
            this.setLoadingState(form, false);
        }
    }

    /**
     * Prepara i dati del form per l'invio
     */
    async prepareFormData(formId) {
        const formData = this.forms.get(formId);
        const form = formData.element;
        const data = new FormData();

        // Dati del form
        const formValues = new FormData(form);
        let fieldCount = 0;

        for (let [key, value] of formValues.entries()) {
            // Gestione file
            if (value instanceof File) {
                if (value.size > 0) {
                    // Compressione immagini se necessario
                    if (value.type.startsWith('image/') && value.size > 1024 * 1024) {
                        value = await this.compressImage(value);
                    }
                    data.append(key, value);
                }
            } else {
                data.append(key, value);
            }
            fieldCount++;
        }

        // Metadati
        data.append('_form_id', formId);
        data.append('_timestamp', new Date().toISOString());
        data.append('_user_agent', navigator.userAgent);
        data.append('_page_url', window.location.href);
        
        // Token CSRF se disponibile
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            data.append('_token', csrfToken);
        }

        return {
            data,
            fieldCount,
            formId
        };
    }

    /**
     * Invia il form al server
     */
    async submitForm(formId, submissionData) {
        const formData = this.forms.get(formId);
        const config = formData.config;

        const options = {
            method: config.method,
            body: submissionData.data
        };

        // Headers personalizzati
        if (!config.fileUpload) {
            options.headers = {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            };
            
            // Converti FormData in JSON se non ci sono file
            options.body = JSON.stringify(Object.fromEntries(submissionData.data));
        }

        try {
            const response = await fetch(config.endpoint, options);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Errore durante l\'invio');
            }

            return { success: true, data: result };

        } catch (error) {
            // Gestione offline - aggiungi alla coda
            if (!this.isOnline) {
                this.addToOfflineQueue(formId, submissionData);
                return { 
                    success: true, 
                    offline: true, 
                    message: 'Form salvato per invio automatico quando tornerai online' 
                };
            }

            throw error;
        }
    }

    /**
     * Gestisce il successo dell'invio
     */
    handleSubmitSuccess(formId, response) {
        const formData = this.forms.get(formId);
        const form = formData.element;

        // Rimuovi draft salvati
        this.clearDraft(formId);

        // Analytics
        if (formData.config.analytics) {
            this.trackFormEvent(formId, 'form_submit_success', {
                form_name: form.dataset.name || form.id
            });
        }

        // Notifica utente
        if (window.feedbackSystem) {
            const message = response.offline 
                ? response.message 
                : 'Form inviato con successo!';
            window.feedbackSystem.showNotification(message, 'success');
        }

        // Reset form se richiesto
        if (form.dataset.resetOnSuccess !== 'false') {
            form.reset();
        }

        // Redirect se specificato
        if (response.data?.redirect) {
            setTimeout(() => {
                window.location.href = response.data.redirect;
            }, 1500);
        }

        // Custom event
        form.dispatchEvent(new CustomEvent('formSubmitSuccess', {
            detail: { formId, response }
        }));
    }

    /**
     * Gestisce gli errori di invio
     */
    handleSubmitError(formId, error) {
        const formData = this.forms.get(formId);
        const form = formData.element;

        // Analytics
        if (formData.config.analytics) {
            this.trackFormEvent(formId, 'form_submit_error', {
                form_name: form.dataset.name || form.id,
                error: error.message
            });
        }

        // Mostra errore
        if (window.feedbackSystem) {
            window.feedbackSystem.showNotification(
                error.message || 'Errore durante l\'invio del form',
                'error'
            );
        }

        // Custom event
        form.dispatchEvent(new CustomEvent('formSubmitError', {
            detail: { formId, error }
        }));
    }

    /**
     * Valida un singolo campo
     */
    validateField(formId, field) {
        const formData = this.forms.get(formId);
        const rules = formData.validationRules[field.name] || {};
        const errors = [];

        const value = field.value.trim();

        // Required
        if (rules.required && !value) {
            errors.push('Questo campo è obbligatorio');
        }

        if (value) {
            // Pattern
            if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
                errors.push('Formato non valido');
            }

            // Length
            if (rules.minLength && value.length < rules.minLength) {
                errors.push(`Minimo ${rules.minLength} caratteri`);
            }
            if (rules.maxLength && value.length > rules.maxLength) {
                errors.push(`Massimo ${rules.maxLength} caratteri`);
            }

            // Email
            if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                errors.push('Email non valida');
            }

            // Phone
            if (rules.phone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(value)) {
                errors.push('Numero di telefono non valido');
            }

            // URL
            if (rules.url) {
                try {
                    new URL(value);
                } catch {
                    errors.push('URL non valido');
                }
            }
        }

        // File validation
        if (field.type === 'file' && field.files.length > 0) {
            const file = field.files[0];
            const fileRules = rules;

            if (fileRules.fileTypes && fileRules.fileTypes.length > 0) {
                const isValidType = fileRules.fileTypes.some(type => 
                    file.type.match(type.replace('*', '.*'))
                );
                if (!isValidType) {
                    errors.push(`Tipo file non supportato. Tipi consentiti: ${fileRules.fileTypes.join(', ')}`);
                }
            }

            if (fileRules.maxSize) {
                const maxBytes = this.parseSize(fileRules.maxSize);
                if (file.size > maxBytes) {
                    errors.push(`File troppo grande. Massimo: ${fileRules.maxSize}`);
                }
            }
        }

        // Mostra errori
        if (errors.length > 0) {
            this.showFieldError(field, errors);
            return false;
        } else {
            this.clearFieldError(field);
            return true;
        }
    }

    /**
     * Valida l'intero form
     */
    async validateForm(formId) {
        const formData = this.forms.get(formId);
        const form = formData.element;
        const inputs = form.querySelectorAll('input, textarea, select');
        const errors = {};
        let isValid = true;

        for (const input of inputs) {
            const fieldValid = this.validateField(formId, input);
            if (!fieldValid) {
                errors[input.name] = 'Validation failed';
                isValid = false;
            }
        }

        return { isValid, errors };
    }

    /**
     * Mostra errori di validazione
     */
    showFieldError(field, errors) {
        this.clearFieldError(field);
        
        field.classList.add('error');
        field.setAttribute('aria-invalid', 'true');

        const errorContainer = document.createElement('div');
        errorContainer.className = 'field-error';
        errorContainer.setAttribute('role', 'alert');
        errorContainer.innerHTML = errors.map(error => 
            `<span class="error-message">${error}</span>`
        ).join('');

        field.parentNode.insertBefore(errorContainer, field.nextSibling);
        field.setAttribute('aria-describedby', field.id + '_error');
        errorContainer.id = field.id + '_error';
    }

    /**
     * Rimuove errori di validazione
     */
    clearFieldError(field) {
        field.classList.remove('error');
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');

        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    /**
     * Gestisce il salvataggio automatico dei draft
     */
    saveDraft(formId) {
        try {
            const formData = this.forms.get(formId);
            const form = formData.element;
            const data = {};

            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                if (input.type !== 'password' && input.type !== 'file') {
                    data[input.name || input.id] = input.value;
                }
            });

            localStorage.setItem(`form_draft_${formId}`, JSON.stringify({
                data,
                timestamp: Date.now(),
                url: window.location.href
            }));

            formData.lastSaved = Date.now();

            // Mostra indicatore di salvataggio
            this.showSaveIndicator(form);

        } catch (error) {
            console.warn('Errore nel salvataggio draft:', error);
        }
    }

    /**
     * Carica un draft salvato
     */
    loadDraft(formId) {
        try {
            const savedData = localStorage.getItem(`form_draft_${formId}`);
            if (!savedData) return;

            const draft = JSON.parse(savedData);
            const formData = this.forms.get(formId);
            const form = formData.element;

            // Verifica che il draft sia per la stessa pagina
            if (draft.url !== window.location.href) return;

            // Ripristina i valori
            Object.entries(draft.data).forEach(([key, value]) => {
                const field = form.querySelector(`[name="${key}"], #${key}`);
                if (field && value) {
                    field.value = value;
                }
            });

            // Mostra notifica di ripristino
            if (window.feedbackSystem) {
                window.feedbackSystem.showNotification(
                    'Draft precedente ripristinato',
                    'info'
                );
            }

        } catch (error) {
            console.warn('Errore nel caricamento draft:', error);
        }
    }

    /**
     * Carica tutti i draft salvati
     */
    loadSavedDrafts() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('form_draft_')) {
                const formId = key.replace('form_draft_', '');
                if (this.forms.has(formId)) {
                    this.loadDraft(formId);
                }
            }
        });
    }

    /**
     * Rimuove un draft
     */
    clearDraft(formId) {
        localStorage.removeItem(`form_draft_${formId}`);
    }

    /**
     * Gestisce la coda offline
     */
    addToOfflineQueue(formId, submissionData) {
        const queueData = {
            formId,
            data: submissionData,
            timestamp: Date.now(),
            attempts: 0
        };

        this.submitQueue.push(queueData);
        localStorage.setItem('form_submit_queue', JSON.stringify(this.submitQueue));
    }

    /**
     * Processa la coda offline quando si torna online
     */
    async processOfflineQueue() {
        if (this.submitQueue.length === 0) return;

        const queue = [...this.submitQueue];
        this.submitQueue = [];

        for (const item of queue) {
            try {
                item.attempts++;
                const response = await this.submitForm(item.formId, item.data);
                
                if (response.success && window.feedbackSystem) {
                    window.feedbackSystem.showNotification(
                        'Form offline inviato con successo!',
                        'success'
                    );
                }
            } catch (error) {
                if (item.attempts < this.retryAttempts) {
                    this.submitQueue.push(item);
                }
            }
        }

        localStorage.setItem('form_submit_queue', JSON.stringify(this.submitQueue));
    }

    /**
     * Gestisce l'anteprima dei file
     */
    handleFilePreview(fileInput) {
        const files = Array.from(fileInput.files);
        let previewContainer = fileInput.parentNode.querySelector('.file-preview');

        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.className = 'file-preview';
            fileInput.parentNode.appendChild(previewContainer);
        }

        previewContainer.innerHTML = '';

        files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';

            // Anteprima immagine
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.className = 'file-thumbnail';
                img.onload = () => URL.revokeObjectURL(img.src);
                fileItem.appendChild(img);
            }

            // Informazioni file
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            fileInfo.innerHTML = `
                <span class="file-name">${file.name}</span>
                <span class="file-size">${this.formatFileSize(file.size)}</span>
            `;
            fileItem.appendChild(fileInfo);

            // Pulsante rimozione
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'file-remove';
            removeBtn.innerHTML = '×';
            removeBtn.onclick = () => {
                fileItem.remove();
                this.removeFileFromInput(fileInput, index);
            };
            fileItem.appendChild(removeBtn);

            previewContainer.appendChild(fileItem);
        });
    }

    /**
     * Utility functions
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    parseSize(sizeStr) {
        const units = { B: 1, KB: 1024, MB: 1024*1024, GB: 1024*1024*1024 };
        const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
        if (match) {
            return parseFloat(match[1]) * units[match[2].toUpperCase()];
        }
        return 0;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    setLoadingState(form, loading) {
        const submitBtn = form.querySelector('[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = loading;
            submitBtn.textContent = loading ? 'Invio in corso...' : submitBtn.dataset.originalText || 'Invia';
        }

        form.classList.toggle('loading', loading);
    }

    showSaveIndicator(form) {
        let indicator = form.querySelector('.save-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'save-indicator';
            indicator.textContent = 'Salvato';
            form.appendChild(indicator);
        }

        indicator.style.opacity = '1';
        setTimeout(() => {
            indicator.style.opacity = '0';
        }, 2000);
    }

    /**
     * Traccia eventi per analytics
     */
    trackFormEvent(formId, event, data = {}) {
        if (typeof gtag !== 'undefined') {
            gtag('event', event, {
                form_id: formId,
                ...data
            });
        }

        // Custom analytics
        if (window.analytics && typeof window.analytics.track === 'function') {
            window.analytics.track(event, {
                formId,
                ...data
            });
        }
    }

    /**
     * Comprime le immagini prima dell'upload
     */
    async compressImage(file) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;

                let { width, height } = img;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = height * (MAX_WIDTH / width);
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = width * (MAX_HEIGHT / height);
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(resolve, 'image/jpeg', 0.8);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Avvia sincronizzazione periodica per gestire la coda offline
     */
    startPeriodicSync() {
        setInterval(() => {
            if (this.isOnline && this.submitQueue.length > 0) {
                this.processOfflineQueue();
            }
        }, 30000); // Ogni 30 secondi
    }

    /**
     * API pubblica per integrazioni esterne
     */
    getFormData(formId) {
        const formData = this.forms.get(formId);
        if (!formData) return null;

        const form = formData.element;
        const data = {};
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            data[input.name || input.id] = input.value;
        });

        return data;
    }

    setFormData(formId, data) {
        const formData = this.forms.get(formId);
        if (!formData) return false;

        const form = formData.element;
        Object.entries(data).forEach(([key, value]) => {
            const field = form.querySelector(`[name="${key}"], #${key}`);
            if (field) {
                field.value = value;
            }
        });

        return true;
    }

    resetForm(formId) {
        const formData = this.forms.get(formId);
        if (!formData) return false;

        formData.element.reset();
        this.clearDraft(formId);
        
        // Rimuovi errori di validazione
        const errorElements = formData.element.querySelectorAll('.field-error');
        errorElements.forEach(error => error.remove());
        
        const errorFields = formData.element.querySelectorAll('.error');
        errorFields.forEach(field => {
            field.classList.remove('error');
            field.removeAttribute('aria-invalid');
        });

        return true;
    }
}

// Export per uso come modulo
export default FormHandler;
