/**
 * Feedback System
 * Sistema di feedback visivi per interazioni utente
 * Caricatori progressivi e suggerimenti intelligenti
 */

class FeedbackSystem {
    constructor(options = {}) {
        this.options = {
            loadingDelay: 200,
            successDuration: 3000,
            errorDuration: 5000,
            enableHapticFeedback: true,
            enableSoundFeedback: false,
            animations: {
                duration: 300,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            },
            ...options
        };
        
        this.activeLoaders = new Map();
        this.notifications = new Set();
        this.soundContext = null;
        
        this.init();
    }
    
    init() {
        this.createNotificationContainer();
        this.setupFormFeedback();
        this.setupButtonFeedback();
        this.setupLoadingIndicators();
        this.initSoundSystem();
        this.setupTooltipSystem();
    }
    
    /**
     * Crea container per notifiche
     */
    createNotificationContainer() {
        if (document.getElementById('feedback-notifications')) return;
        
        const container = document.createElement('div');
        container.id = 'feedback-notifications';
        container.className = 'feedback-notifications';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'false');
        
        document.body.appendChild(container);
    }
    
    /**
     * Setup feedback per form
     */
    setupFormFeedback() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            // Feedback real-time per campi
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                this.setupInputFeedback(input);
            });
            
            // Feedback submit
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit(form);
            });
        });
    }
    
    /**
     * Setup feedback per singolo input
     */
    setupInputFeedback(input) {
        const wrapper = this.createInputWrapper(input);
        
        // Eventi di validazione
        input.addEventListener('input', () => {
            this.clearInputFeedback(wrapper);
            this.debounce(() => this.validateInput(input, wrapper), 300)();
        });
        
        input.addEventListener('blur', () => {
            this.validateInput(input, wrapper, true);
        });
        
        input.addEventListener('focus', () => {
            this.showInputHint(wrapper);
        });
        
        // Setup suggerimenti intelligenti
        if (input.type === 'email' || input.name === 'email') {
            this.setupEmailSuggestions(input, wrapper);
        }
        
        if (input.type === 'tel' || input.name === 'telefono') {
            this.setupPhoneFormatting(input, wrapper);
        }
    }
    
    /**
     * Crea wrapper per input con feedback
     */
    createInputWrapper(input) {
        if (input.parentElement.classList.contains('input-wrapper')) {
            return input.parentElement;
        }
        
        const wrapper = document.createElement('div');
        wrapper.className = 'input-wrapper';
        
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        
        // Aggiungi elementi feedback
        const feedbackContainer = document.createElement('div');
        feedbackContainer.className = 'input-feedback';
        wrapper.appendChild(feedbackContainer);
        
        return wrapper;
    }
    
    /**
     * Valida input e mostra feedback
     */
    validateInput(input, wrapper, showSuccess = false) {
        const value = input.value.trim();
        const isRequired = input.hasAttribute('required');
        const inputType = input.type || input.tagName.toLowerCase();
        
        this.clearInputFeedback(wrapper);
        
        // Validazione vuoto
        if (isRequired && !value) {
            if (showSuccess) {
                this.showInputError(wrapper, 'Campo obbligatorio');
            }
            return false;
        }
        
        if (!value) return true;
        
        // Validazioni specifiche per tipo
        let isValid = true;
        let errorMessage = '';
        
        switch (inputType) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Formato email non valido';
                } else if (showSuccess) {
                    this.showInputSuccess(wrapper, 'Email valida');
                }
                break;
                
            case 'tel':
                const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
                if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                    isValid = false;
                    errorMessage = 'Numero di telefono non valido';
                } else if (showSuccess) {
                    this.showInputSuccess(wrapper, 'Numero valido');
                }
                break;
                
            case 'password':
                if (value.length < 8) {
                    isValid = false;
                    errorMessage = 'Password troppo corta (minimo 8 caratteri)';
                } else {
                    const strength = this.checkPasswordStrength(value);
                    this.showPasswordStrength(wrapper, strength);
                }
                break;
        }
        
        if (!isValid) {
            this.showInputError(wrapper, errorMessage);
        }
        
        return isValid;
    }
    
    /**
     * Mostra errore input
     */
    showInputError(wrapper, message) {
        const input = wrapper.querySelector('input, textarea, select');
        const feedback = wrapper.querySelector('.input-feedback');
        
        input.classList.add('input-error');
        input.setAttribute('aria-invalid', 'true');
        
        feedback.innerHTML = `
            <div class="feedback-error">
                <span class="feedback-icon">⚠</span>
                <span class="feedback-message">${message}</span>
            </div>
        `;
        
        // Animazione
        feedback.style.opacity = '0';
        feedback.style.transform = 'translateY(-10px)';
        
        requestAnimationFrame(() => {
            feedback.style.transition = `all ${this.options.animations.duration}ms ${this.options.animations.easing}`;
            feedback.style.opacity = '1';
            feedback.style.transform = 'translateY(0)';
        });
        
        // Haptic feedback
        this.vibrate([50]);
        
        // Focus management
        setTimeout(() => input.focus(), 100);
    }
    
    /**
     * Mostra successo input
     */
    showInputSuccess(wrapper, message) {
        const input = wrapper.querySelector('input, textarea, select');
        const feedback = wrapper.querySelector('.input-feedback');
        
        input.classList.remove('input-error');
        input.classList.add('input-success');
        input.setAttribute('aria-invalid', 'false');
        
        feedback.innerHTML = `
            <div class="feedback-success">
                <span class="feedback-icon">✓</span>
                <span class="feedback-message">${message}</span>
            </div>
        `;
        
        // Animazione
        this.animateFeedback(feedback);
        
        // Auto-hide success dopo 2 secondi
        setTimeout(() => {
            this.clearInputFeedback(wrapper);
        }, 2000);
    }
    
    /**
     * Mostra forza password
     */
    showPasswordStrength(wrapper, strength) {
        const feedback = wrapper.querySelector('.input-feedback');
        const strengthLabels = ['Molto debole', 'Debole', 'Discreta', 'Forte', 'Molto forte'];
        const strengthClasses = ['very-weak', 'weak', 'fair', 'strong', 'very-strong'];
        
        feedback.innerHTML = `
            <div class="password-strength ${strengthClasses[strength]}">
                <div class="strength-label">${strengthLabels[strength]}</div>
                <div class="strength-bars">
                    ${Array.from({length: 5}, (_, i) => 
                        `<div class="strength-bar ${i <= strength ? 'active' : ''}"></div>`
                    ).join('')}
                </div>
            </div>
        `;
        
        this.animateFeedback(feedback);
    }
    
    /**
     * Calcola forza password
     */
    checkPasswordStrength(password) {
        let score = 0;
        
        // Lunghezza
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        
        // Varietà caratteri
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        return Math.min(Math.floor(score / 1.2), 4);
    }
    
    /**
     * Mostra hint per input
     */
    showInputHint(wrapper) {
        const input = wrapper.querySelector('input, textarea, select');
        const hint = input.getAttribute('data-hint');
        
        if (!hint || wrapper.querySelector('.input-hint')) return;
        
        const hintElement = document.createElement('div');
        hintElement.className = 'input-hint';
        hintElement.innerHTML = `
            <span class="hint-icon">💡</span>
            <span class="hint-text">${hint}</span>
        `;
        
        wrapper.appendChild(hintElement);
        
        // Auto-hide dopo 5 secondi
        setTimeout(() => {
            hintElement.remove();
        }, 5000);
    }
    
    /**
     * Setup suggerimenti email
     */
    setupEmailSuggestions(input, wrapper) {
        const commonDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'libero.it', 'hotmail.com'];
        
        input.addEventListener('blur', () => {
            const email = input.value.trim();
            if (!email.includes('@')) return;
            
            const [localPart, domain] = email.split('@');
            if (!domain) return;
            
            // Trova domini simili
            const suggestion = this.findSimilarDomain(domain, commonDomains);
            if (suggestion && suggestion !== domain) {
                this.showEmailSuggestion(wrapper, localPart, suggestion);
            }
        });
    }
    
    /**
     * Trova dominio simile
     */
    findSimilarDomain(domain, commonDomains) {
        const minDistance = 2;
        let bestMatch = null;
        let bestDistance = Infinity;
        
        for (const commonDomain of commonDomains) {
            const distance = this.calculateEditDistance(domain.toLowerCase(), commonDomain);
            if (distance <= minDistance && distance < bestDistance) {
                bestDistance = distance;
                bestMatch = commonDomain;
            }
        }
        
        return bestMatch;
    }
    
    /**
     * Calcola distanza di edit
     */
    calculateEditDistance(a, b) {
        const dp = Array(a.length + 1).fill().map(() => Array(b.length + 1).fill(0));
        
        for (let i = 0; i <= a.length; i++) dp[i][0] = i;
        for (let j = 0; j <= b.length; j++) dp[0][j] = j;
        
        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                const cost = a[i-1] === b[j-1] ? 0 : 1;
                dp[i][j] = Math.min(
                    dp[i-1][j] + 1,
                    dp[i][j-1] + 1,
                    dp[i-1][j-1] + cost
                );
            }
        }
        
        return dp[a.length][b.length];
    }
    
    /**
     * Mostra suggerimento email
     */
    showEmailSuggestion(wrapper, localPart, suggestedDomain) {
        const suggestionElement = document.createElement('div');
        suggestionElement.className = 'email-suggestion';
        
        const suggestedEmail = `${localPart}@${suggestedDomain}`;
        suggestionElement.innerHTML = `
            <div class="suggestion-text">
                Forse intendevi: 
                <button type="button" class="suggestion-button" data-suggestion="${suggestedEmail}">
                    ${suggestedEmail}
                </button>
            </div>
        `;
        
        wrapper.appendChild(suggestionElement);
        
        // Click handler per suggerimento
        suggestionElement.querySelector('.suggestion-button').addEventListener('click', () => {
            const input = wrapper.querySelector('input');
            input.value = suggestedEmail;
            input.focus();
            suggestionElement.remove();
            this.validateInput(input, wrapper, true);
        });
        
        // Auto-hide dopo 10 secondi
        setTimeout(() => {
            suggestionElement.remove();
        }, 10000);
    }
    
    /**
     * Setup formattazione telefono
     */
    setupPhoneFormatting(input, wrapper) {
        input.addEventListener('input', () => {
            const value = input.value.replace(/\D/g, '');
            let formatted = value;
            
            // Formattazione italiana
            if (value.startsWith('39')) {
                formatted = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '+$1 $2 $3 $4');
            } else if (value.length >= 10) {
                formatted = value.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
            }
            
            if (formatted !== input.value) {
                input.value = formatted;
            }
        });
    }
    
    /**
     * Pulisci feedback input
     */
    clearInputFeedback(wrapper) {
        const input = wrapper.querySelector('input, textarea, select');
        const feedback = wrapper.querySelector('.input-feedback');
        
        input.classList.remove('input-error', 'input-success');
        input.removeAttribute('aria-invalid');
        
        if (feedback) {
            feedback.innerHTML = '';
        }
        
        // Rimuovi suggerimenti esistenti
        wrapper.querySelectorAll('.email-suggestion, .input-hint').forEach(el => el.remove());
    }
    
    /**
     * Setup feedback per bottoni
     */
    setupButtonFeedback() {
        const buttons = document.querySelectorAll('button, .btn, [role="button"]');
        
        buttons.forEach(button => {
            this.setupButtonInteraction(button);
        });
    }
    
    /**
     * Setup interazione singolo bottone
     */
    setupButtonInteraction(button) {
        // Ripple effect al click
        button.addEventListener('click', (e) => {
            this.createRippleEffect(button, e);
            this.vibrate([25]); // Haptic feedback leggero
        });
        
        // Feedback hover
        button.addEventListener('mouseenter', () => {
            button.classList.add('btn-hover');
        });
        
        button.addEventListener('mouseleave', () => {
            button.classList.remove('btn-hover');
        });
        
        // Feedback focus
        button.addEventListener('focus', () => {
            button.classList.add('btn-focus');
        });
        
        button.addEventListener('blur', () => {
            button.classList.remove('btn-focus');
        });
    }
    
    /**
     * Crea effetto ripple
     */
    createRippleEffect(element, event) {
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.className = 'ripple-effect';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        // Rimuovi dopo animazione
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    /**
     * Setup indicatori caricamento
     */
    setupLoadingIndicators() {
        // Observer per elementi con data-loading
        const loadingObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-loading') {
                    const element = mutation.target;
                    const isLoading = element.getAttribute('data-loading') === 'true';
                    
                    if (isLoading) {
                        this.showLoadingState(element);
                    } else {
                        this.hideLoadingState(element);
                    }
                }
            });
        });
        
        document.querySelectorAll('[data-loading]').forEach(element => {
            loadingObserver.observe(element, { attributes: true });
        });
    }
    
    /**
     * Mostra stato caricamento
     */
    showLoadingState(element) {
        const loadingId = 'loading-' + Date.now();
        const loadingType = element.getAttribute('data-loading-type') || 'spinner';
        
        let loader;
        switch (loadingType) {
            case 'skeleton':
                loader = this.createSkeletonLoader(element);
                break;
            case 'progress':
                loader = this.createProgressLoader(element);
                break;
            default:
                loader = this.createSpinnerLoader(element);
        }
        
        loader.id = loadingId;
        element.appendChild(loader);
        this.activeLoaders.set(element, loadingId);
        
        // Disabilita elemento
        if (element.tagName === 'BUTTON' || element.tagName === 'INPUT') {
            element.disabled = true;
        }
        
        element.classList.add('loading-state');
    }
    
    /**
     * Nascondi stato caricamento
     */
    hideLoadingState(element) {
        const loadingId = this.activeLoaders.get(element);
        if (!loadingId) return;
        
        const loader = document.getElementById(loadingId);
        if (loader) {
            loader.remove();
        }
        
        this.activeLoaders.delete(element);
        element.classList.remove('loading-state');
        
        // Riabilita elemento
        if (element.tagName === 'BUTTON' || element.tagName === 'INPUT') {
            element.disabled = false;
        }
    }
    
    /**
     * Crea spinner loader
     */
    createSpinnerLoader(element) {
        const loader = document.createElement('div');
        loader.className = 'spinner-loader';
        loader.innerHTML = `
            <div class="spinner">
                <div class="spinner-circle"></div>
            </div>
        `;
        return loader;
    }
    
    /**
     * Crea skeleton loader
     */
    createSkeletonLoader(element) {
        const loader = document.createElement('div');
        loader.className = 'skeleton-loader';
        
        // Crea skeleton basato su contenuto esistente
        const textNodes = element.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span');
        textNodes.forEach(node => {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton-line';
            skeleton.style.width = '100%';
            skeleton.style.height = window.getComputedStyle(node).lineHeight;
            loader.appendChild(skeleton);
        });
        
        if (textNodes.length === 0) {
            // Skeleton generico
            for (let i = 0; i < 3; i++) {
                const skeleton = document.createElement('div');
                skeleton.className = 'skeleton-line';
                loader.appendChild(skeleton);
            }
        }
        
        return loader;
    }
    
    /**
     * Crea progress loader
     */
    createProgressLoader(element) {
        const loader = document.createElement('div');
        loader.className = 'progress-loader';
        loader.innerHTML = `
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <div class="progress-text">Caricamento...</div>
        `;
        return loader;
    }
    
    /**
     * Gestisce submit form con feedback
     */
    handleFormSubmit(form) {
        const submitBtn = form.querySelector('[type="submit"]');
        const inputs = form.querySelectorAll('input, textarea, select');
        
        // Valida tutti i campi
        let isValid = true;
        inputs.forEach(input => {
            const wrapper = input.closest('.input-wrapper') || this.createInputWrapper(input);
            if (!this.validateInput(input, wrapper, true)) {
                isValid = false;
            }
        });
        
        if (!isValid) {
            // Focus primo campo con errore
            const firstError = form.querySelector('.input-error');
            if (firstError) firstError.focus();
            
            this.showNotification('Correggi gli errori nel modulo', 'error');
            this.vibrate([100, 50, 100]); // Doppio vibration per errore
            return;
        }
        
        // Simula invio
        if (submitBtn) {
            submitBtn.setAttribute('data-loading', 'true');
            submitBtn.textContent = 'Invio in corso...';
        }
        
        // Simula risposta server
        setTimeout(() => {
            if (submitBtn) {
                submitBtn.setAttribute('data-loading', 'false');
                submitBtn.textContent = 'Invia';
            }
            
            this.showNotification('Messaggio inviato con successo!', 'success');
            form.reset();
            
            // Pulisci feedback
            inputs.forEach(input => {
                const wrapper = input.closest('.input-wrapper');
                if (wrapper) this.clearInputFeedback(wrapper);
            });
        }, 2000);
    }
    
    /**
     * Sistema di tooltip
     */
    setupTooltipSystem() {
        const elements = document.querySelectorAll('[data-tooltip]');
        
        elements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target);
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
            
            element.addEventListener('focus', (e) => {
                this.showTooltip(e.target);
            });
            
            element.addEventListener('blur', () => {
                this.hideTooltip();
            });
        });
    }
    
    /**
     * Mostra tooltip
     */
    showTooltip(element) {
        const text = element.getAttribute('data-tooltip');
        const position = element.getAttribute('data-tooltip-position') || 'top';
        
        if (!text) return;
        
        this.hideTooltip(); // Nascondi tooltip esistenti
        
        const tooltip = document.createElement('div');
        tooltip.className = `tooltip tooltip-${position}`;
        tooltip.textContent = text;
        tooltip.id = 'active-tooltip';
        
        document.body.appendChild(tooltip);
        
        // Posiziona tooltip
        this.positionTooltip(tooltip, element, position);
        
        // Mostra con animazione
        requestAnimationFrame(() => {
            tooltip.classList.add('tooltip-visible');
        });
    }
    
    /**
     * Posiziona tooltip
     */
    positionTooltip(tooltip, element, position) {
        const elementRect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let top, left;
        
        switch (position) {
            case 'top':
                top = elementRect.top - tooltipRect.height - 8;
                left = elementRect.left + (elementRect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = elementRect.bottom + 8;
                left = elementRect.left + (elementRect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = elementRect.top + (elementRect.height - tooltipRect.height) / 2;
                left = elementRect.left - tooltipRect.width - 8;
                break;
            case 'right':
                top = elementRect.top + (elementRect.height - tooltipRect.height) / 2;
                left = elementRect.right + 8;
                break;
        }
        
        // Previeni overflow viewport
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        if (left < 0) left = 8;
        if (left + tooltipRect.width > viewport.width) {
            left = viewport.width - tooltipRect.width - 8;
        }
        if (top < 0) top = 8;
        if (top + tooltipRect.height > viewport.height) {
            top = viewport.height - tooltipRect.height - 8;
        }
        
        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';
    }
    
    /**
     * Nascondi tooltip
     */
    hideTooltip() {
        const tooltip = document.getElementById('active-tooltip');
        if (tooltip) {
            tooltip.classList.remove('tooltip-visible');
            setTimeout(() => tooltip.remove(), 200);
        }
    }
    
    /**
     * Mostra notifica
     */
    showNotification(message, type = 'info', duration = null) {
        const notification = this.createNotification(message, type);
        const container = document.getElementById('feedback-notifications');
        
        container.appendChild(notification);
        this.notifications.add(notification);
        
        // Mostra con animazione
        requestAnimationFrame(() => {
            notification.classList.add('notification-visible');
        });
        
        // Auto-hide
        const hideDelay = duration || (type === 'error' ? this.options.errorDuration : this.options.successDuration);
        setTimeout(() => {
            this.hideNotification(notification);
        }, hideDelay);
        
        return notification;
    }
    
    /**
     * Crea notifica
     */
    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icons[type] || icons.info}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" aria-label="Chiudi notifica">×</button>
            </div>
        `;
        
        // Handler chiusura
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.hideNotification(notification);
        });
        
        return notification;
    }
    
    /**
     * Nascondi notifica
     */
    hideNotification(notification) {
        notification.classList.remove('notification-visible');
        this.notifications.delete(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }
    
    /**
     * Inizializza sistema audio
     */
    initSoundSystem() {
        if (!this.options.enableSoundFeedback) return;
        
        try {
            this.soundContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Audio Context non supportato');
        }
    }
    
    /**
     * Riproduce suono feedback
     */
    playSound(type) {
        if (!this.soundContext || !this.options.enableSoundFeedback) return;
        
        const frequencies = {
            success: 800,
            error: 300,
            click: 600,
            hover: 400
        };
        
        const freq = frequencies[type] || frequencies.click;
        const oscillator = this.soundContext.createOscillator();
        const gain = this.soundContext.createGain();
        
        oscillator.connect(gain);
        gain.connect(this.soundContext.destination);
        
        oscillator.frequency.setValueAtTime(freq, this.soundContext.currentTime);
        oscillator.type = 'sine';
        
        gain.gain.setValueAtTime(0.1, this.soundContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.soundContext.currentTime + 0.1);
        
        oscillator.start(this.soundContext.currentTime);
        oscillator.stop(this.soundContext.currentTime + 0.1);
    }
    
    /**
     * Vibrazione haptic
     */
    vibrate(pattern) {
        if (!this.options.enableHapticFeedback || !navigator.vibrate) return;
        
        try {
            navigator.vibrate(pattern);
        } catch (e) {
            // Vibrazione non supportata
        }
    }
    
    /**
     * Anima feedback
     */
    animateFeedback(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(-10px)';
        
        requestAnimationFrame(() => {
            element.style.transition = `all ${this.options.animations.duration}ms ${this.options.animations.easing}`;
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
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
     * Cleanup sistema feedback
     */
    destroy() {
        this.notifications.forEach(notification => notification.remove());
        this.activeLoaders.clear();
        
        if (this.soundContext) {
            this.soundContext.close();
        }
    }
}

// Inizializzazione automatica
document.addEventListener('DOMContentLoaded', () => {
    window.feedbackSystem = new FeedbackSystem({
        enableHapticFeedback: true,
        enableSoundFeedback: false, // Disabilitato di default
        loadingDelay: 200
    });
});

export default FeedbackSystem;
