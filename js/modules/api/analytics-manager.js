/**
 * Analytics Manager - ArchiTech
 * Sistema unificato per tracking eventi e analytics
 */

class AnalyticsManager {
    constructor(config = {}) {
        this.config = {
            googleAnalytics: config.googleAnalytics || null,
            facebookPixel: config.facebookPixel || null,
            customEndpoint: config.customEndpoint || '/api/analytics',
            enableHeatmaps: config.enableHeatmaps || false,
            enableUserJourney: config.enableUserJourney || true,
            enablePerformance: config.enablePerformance || true,
            enableErrors: config.enableErrors || true,
            cookieConsent: config.cookieConsent || false,
            ...config
        };

        this.userSession = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            pageViews: 0,
            events: [],
            userAgent: navigator.userAgent,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            referrer: document.referrer,
            utmParams: this.extractUTMParams()
        };

        this.eventQueue = [];
        this.initialized = false;
        this.consentGiven = !this.config.cookieConsent;

        this.initialize();
    }

    /**
     * Inizializza il sistema di analytics
     */
    async initialize() {
        try {
            // Carica configurazione da sessionStorage se disponibile
            this.loadSessionData();

            // Inizializza provider esterni
            if (this.consentGiven) {
                await this.initializeProviders();
            }

            // Setup event listeners
            this.setupEventListeners();

            // Traccia la prima pageview
            this.trackPageView();

            // Avvia tracking performance
            if (this.config.enablePerformance) {
                this.initializePerformanceTracking();
            }

            // Avvia tracking errori
            if (this.config.enableErrors) {
                this.initializeErrorTracking();
            }

            // Avvia user journey tracking
            if (this.config.enableUserJourney) {
                this.initializeUserJourneyTracking();
            }

            this.initialized = true;
            console.log('Analytics Manager inizializzato');

        } catch (error) {
            console.error('Errore inizializzazione Analytics:', error);
        }
    }

    /**
     * Inizializza i provider esterni (GA, FB Pixel, etc.)
     */
    async initializeProviders() {
        // Google Analytics 4
        if (this.config.googleAnalytics) {
            await this.initializeGoogleAnalytics();
        }

        // Facebook Pixel
        if (this.config.facebookPixel) {
            await this.initializeFacebookPixel();
        }

        // Altri provider possono essere aggiunti qui
    }

    /**
     * Inizializza Google Analytics 4
     */
    async initializeGoogleAnalytics() {
        try {
            // Carica gtag se non presente
            if (typeof gtag === 'undefined') {
                const script = document.createElement('script');
                script.async = true;
                script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.googleAnalytics}`;
                document.head.appendChild(script);

                await new Promise((resolve) => {
                    script.onload = resolve;
                });

                window.dataLayer = window.dataLayer || [];
                window.gtag = function() {
                    dataLayer.push(arguments);
                };
                gtag('js', new Date());
            }

            // Configura GA4
            gtag('config', this.config.googleAnalytics, {
                page_title: document.title,
                page_location: window.location.href,
                custom_map: {
                    'custom_parameter_1': 'user_type',
                    'custom_parameter_2': 'page_category'
                }
            });

        } catch (error) {
            console.error('Errore inizializzazione Google Analytics:', error);
        }
    }

    /**
     * Inizializza Facebook Pixel
     */
    async initializeFacebookPixel() {
        try {
            if (typeof fbq === 'undefined') {
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
            }

            fbq('init', this.config.facebookPixel);
            fbq('track', 'PageView');

        } catch (error) {
            console.error('Errore inizializzazione Facebook Pixel:', error);
        }
    }

    /**
     * Setup event listeners per tracking automatico
     */
    setupEventListeners() {
        // Click tracking
        document.addEventListener('click', (e) => {
            this.handleClickEvent(e);
        });

        // Form tracking
        document.addEventListener('submit', (e) => {
            this.handleFormEvent(e);
        });

        // Scroll tracking
        let scrollPercentage = 0;
        const handleScroll = this.throttle(() => {
            const newPercentage = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );
            
            if (newPercentage > scrollPercentage && newPercentage % 25 === 0) {
                scrollPercentage = newPercentage;
                this.trackEvent('scroll', {
                    scroll_percentage: scrollPercentage
                });
            }
        }, 100);

        window.addEventListener('scroll', handleScroll);

        // Time on page
        this.startTimeTracking();

        // Visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.trackEvent('page_hidden', {
                    time_on_page: Date.now() - this.userSession.startTime
                });
                this.flushEvents();
            }
        });

        // Beforeunload per salvare dati prima della chiusura
        window.addEventListener('beforeunload', () => {
            this.flushEvents();
            this.saveSessionData();
        });

        // Resize per responsive analytics
        window.addEventListener('resize', this.debounce(() => {
            this.trackEvent('viewport_resize', {
                viewport_width: window.innerWidth,
                viewport_height: window.innerHeight
            });
        }, 300));
    }

    /**
     * Gestisce eventi di click
     */
    handleClickEvent(event) {
        const element = event.target;
        const tagName = element.tagName.toLowerCase();

        // Link esterni
        if (tagName === 'a' && element.href && !element.href.startsWith(window.location.origin)) {
            this.trackEvent('external_link_click', {
                url: element.href,
                text: element.textContent?.trim() || '',
                position: this.getElementPosition(element)
            });
        }

        // Download
        if (tagName === 'a' && element.download) {
            this.trackEvent('file_download', {
                filename: element.download,
                url: element.href,
                type: this.getFileType(element.href)
            });
        }

        // Pulsanti
        if (tagName === 'button' || element.role === 'button') {
            this.trackEvent('button_click', {
                text: element.textContent?.trim() || '',
                id: element.id || '',
                className: element.className || '',
                position: this.getElementPosition(element)
            });
        }

        // Elementi con data-track
        if (element.dataset.track) {
            this.trackEvent(element.dataset.track, {
                element_id: element.id,
                element_text: element.textContent?.trim() || '',
                custom_data: element.dataset.trackData ? JSON.parse(element.dataset.trackData) : {}
            });
        }
    }

    /**
     * Gestisce eventi di form
     */
    handleFormEvent(event) {
        const form = event.target;
        
        this.trackEvent('form_submit', {
            form_id: form.id || '',
            form_name: form.name || '',
            form_action: form.action || '',
            fields_count: form.querySelectorAll('input, textarea, select').length
        });
    }

    /**
     * Tracka una page view
     */
    trackPageView(path = null, title = null) {
        this.userSession.pageViews++;

        const pageData = {
            page_path: path || window.location.pathname,
            page_title: title || document.title,
            page_location: window.location.href,
            referrer: document.referrer,
            user_agent: navigator.userAgent,
            timestamp: Date.now(),
            session_id: this.userSession.id,
            page_view_count: this.userSession.pageViews
        };

        // Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('config', this.config.googleAnalytics, {
                page_title: pageData.page_title,
                page_location: pageData.page_location
            });
        }

        // Facebook Pixel
        if (typeof fbq !== 'undefined') {
            fbq('track', 'PageView');
        }

        // Custom tracking
        this.trackEvent('page_view', pageData);
    }

    /**
     * Tracka un evento personalizzato
     */
    trackEvent(eventName, eventData = {}) {
        if (!this.consentGiven) {
            return;
        }

        const event = {
            event: eventName,
            timestamp: Date.now(),
            session_id: this.userSession.id,
            page_path: window.location.pathname,
            user_id: this.getUserId(),
            ...eventData
        };

        this.eventQueue.push(event);
        this.userSession.events.push(event);

        // Invia a Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, eventData);
        }

        // Invia a Facebook Pixel per eventi specifici
        if (typeof fbq !== 'undefined' && this.isFBPixelEvent(eventName)) {
            fbq('track', this.mapToFBPixelEvent(eventName), eventData);
        }

        // Flush eventi se la coda è troppo piena
        if (this.eventQueue.length >= 50) {
            this.flushEvents();
        }

        // Auto-flush ogni 30 secondi
        if (!this.flushTimer) {
            this.flushTimer = setTimeout(() => {
                this.flushEvents();
                this.flushTimer = null;
            }, 30000);
        }
    }

    /**
     * Tracka conversioni
     */
    trackConversion(conversionType, value = null, currency = 'EUR') {
        const conversionData = {
            conversion_type: conversionType,
            value: value,
            currency: currency,
            timestamp: Date.now()
        };

        // Google Analytics Enhanced Ecommerce
        if (typeof gtag !== 'undefined') {
            gtag('event', 'conversion', {
                send_to: this.config.googleAnalytics,
                value: value,
                currency: currency,
                transaction_id: this.generateTransactionId()
            });
        }

        // Facebook Pixel
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Purchase', {
                value: value,
                currency: currency
            });
        }

        this.trackEvent('conversion', conversionData);
    }

    /**
     * Tracka errori JavaScript
     */
    initializeErrorTracking() {
        window.addEventListener('error', (event) => {
            this.trackEvent('javascript_error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack || ''
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.trackEvent('promise_rejection', {
                reason: event.reason?.toString() || 'Unknown promise rejection'
            });
        });
    }

    /**
     * Tracka performance della pagina
     */
    initializePerformanceTracking() {
        // Web Vitals
        if ('web-vitals' in window) {
            // Carica web-vitals se disponibile
            import('https://unpkg.com/web-vitals@3/dist/web-vitals.js').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
                getCLS((metric) => this.trackEvent('web_vital_cls', metric));
                getFID((metric) => this.trackEvent('web_vital_fid', metric));
                getFCP((metric) => this.trackEvent('web_vital_fcp', metric));
                getLCP((metric) => this.trackEvent('web_vital_lcp', metric));
                getTTFB((metric) => this.trackEvent('web_vital_ttfb', metric));
            }).catch(() => {
                // Fallback a Performance API nativo
                this.trackNativePerformance();
            });
        } else {
            this.trackNativePerformance();
        }
    }

    /**
     * Performance tracking nativo
     */
    trackNativePerformance() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    this.trackEvent('page_performance', {
                        dns_time: perfData.domainLookupEnd - perfData.domainLookupStart,
                        connect_time: perfData.connectEnd - perfData.connectStart,
                        response_time: perfData.responseEnd - perfData.requestStart,
                        dom_load_time: perfData.domContentLoadedEventEnd - perfData.navigationStart,
                        window_load_time: perfData.loadEventEnd - perfData.navigationStart
                    });
                }
            }, 1000);
        });
    }

    /**
     * User Journey Tracking
     */
    initializeUserJourneyTracking() {
        // Tracka interazioni con elementi
        const interactionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    this.trackEvent('element_view', {
                        element_type: element.tagName.toLowerCase(),
                        element_id: element.id || '',
                        element_class: element.className || '',
                        viewport_percentage: Math.round(entry.intersectionRatio * 100)
                    });
                }
            });
        }, { threshold: [0.5, 0.75, 1.0] });

        // Osserva elementi importanti
        document.querySelectorAll('[data-track-view]').forEach(el => {
            interactionObserver.observe(el);
        });
    }

    /**
     * Gestione del consenso ai cookie
     */
    setConsentStatus(granted) {
        this.consentGiven = granted;
        
        if (granted && !this.initialized) {
            this.initializeProviders();
        }

        // Aggiorna provider esterni
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                analytics_storage: granted ? 'granted' : 'denied',
                ad_storage: granted ? 'granted' : 'denied'
            });
        }

        localStorage.setItem('analytics_consent', granted.toString());
    }

    /**
     * Invia eventi al server personalizzato
     */
    async flushEvents() {
        if (this.eventQueue.length === 0) return;

        const eventsToSend = [...this.eventQueue];
        this.eventQueue = [];

        try {
            const response = await fetch(this.config.customEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session: this.userSession,
                    events: eventsToSend
                })
            });

            if (!response.ok) {
                // Rimetti gli eventi nella coda se l'invio fallisce
                this.eventQueue.unshift(...eventsToSend);
            }

        } catch (error) {
            console.warn('Errore invio analytics:', error);
            // Rimetti gli eventi nella coda
            this.eventQueue.unshift(...eventsToSend);
        }
    }

    /**
     * Utility functions
     */
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    generateTransactionId() {
        return 'txn_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getUserId() {
        // Implementa la logica per identificare l'utente
        let userId = localStorage.getItem('user_id');
        if (!userId) {
            userId = 'anon_' + this.generateSessionId();
            localStorage.setItem('user_id', userId);
        }
        return userId;
    }

    extractUTMParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            utm_source: params.get('utm_source'),
            utm_medium: params.get('utm_medium'),
            utm_campaign: params.get('utm_campaign'),
            utm_term: params.get('utm_term'),
            utm_content: params.get('utm_content')
        };
    }

    getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: Math.round(rect.left + window.scrollX),
            y: Math.round(rect.top + window.scrollY),
            viewport_x: Math.round(rect.left),
            viewport_y: Math.round(rect.top)
        };
    }

    getFileType(url) {
        const extension = url.split('.').pop()?.toLowerCase();
        const types = {
            pdf: 'document',
            doc: 'document', docx: 'document',
            xls: 'spreadsheet', xlsx: 'spreadsheet',
            jpg: 'image', jpeg: 'image', png: 'image', gif: 'image',
            mp4: 'video', avi: 'video', mov: 'video',
            mp3: 'audio', wav: 'audio'
        };
        return types[extension] || 'unknown';
    }

    isFBPixelEvent(eventName) {
        const fbEvents = ['purchase', 'add_to_cart', 'initiate_checkout', 'lead', 'complete_registration'];
        return fbEvents.includes(eventName.toLowerCase());
    }

    mapToFBPixelEvent(eventName) {
        const mapping = {
            'form_submit': 'Lead',
            'button_click': 'ViewContent',
            'conversion': 'Purchase'
        };
        return mapping[eventName] || 'CustomEvent';
    }

    startTimeTracking() {
        const intervals = [30, 60, 120, 300]; // 30s, 1min, 2min, 5min
        intervals.forEach(seconds => {
            setTimeout(() => {
                this.trackEvent('time_on_page', {
                    seconds: seconds,
                    milestone: true
                });
            }, seconds * 1000);
        });
    }

    saveSessionData() {
        try {
            sessionStorage.setItem('analytics_session', JSON.stringify(this.userSession));
        } catch (error) {
            console.warn('Errore salvataggio sessione:', error);
        }
    }

    loadSessionData() {
        try {
            const savedSession = sessionStorage.getItem('analytics_session');
            if (savedSession) {
                const session = JSON.parse(savedSession);
                // Aggiorna solo alcuni campi per continuità della sessione
                this.userSession.events = session.events || [];
                if (session.startTime && (Date.now() - session.startTime) < 30 * 60 * 1000) { // 30 min
                    this.userSession.pageViews = session.pageViews || 0;
                }
            }

            // Carica consenso
            const consent = localStorage.getItem('analytics_consent');
            if (consent !== null) {
                this.consentGiven = consent === 'true';
            }
        } catch (error) {
            console.warn('Errore caricamento sessione:', error);
        }
    }

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
        }
    }

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

    /**
     * API pubblica per uso esterno
     */
    
    // Tracka eventi personalizzati dall'esterno
    track(eventName, eventData = {}) {
        this.trackEvent(eventName, eventData);
    }

    // Identifica un utente
    identify(userId, traits = {}) {
        localStorage.setItem('user_id', userId);
        this.trackEvent('user_identified', {
            user_id: userId,
            traits: traits
        });
    }

    // Tracka pagine per SPA
    page(path, title, properties = {}) {
        this.trackPageView(path, title);
        this.trackEvent('spa_navigation', {
            from: this.currentPage,
            to: path,
            ...properties
        });
        this.currentPage = path;
    }

    // Ottieni dati della sessione corrente
    getSessionData() {
        return { ...this.userSession };
    }

    // Reset della sessione (per logout, etc.)
    reset() {
        this.userSession = {
            ...this.userSession,
            id: this.generateSessionId(),
            startTime: Date.now(),
            pageViews: 0,
            events: []
        };
        sessionStorage.removeItem('analytics_session');
        localStorage.removeItem('user_id');
    }
}

export default AnalyticsManager;
