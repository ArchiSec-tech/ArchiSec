/**
 * Mobile Optimization & PWA - ArchiTech
 * Ottimizzazioni mobile complete con supporto PWA e gesture
 */

class MobileOptimizer {
    constructor(config = {}) {
        this.config = {
            enablePWA: config.enablePWA !== false,
            enableGestures: config.enableGestures !== false,
            enableOffline: config.enableOffline !== false,
            enableNotifications: config.enableNotifications || false,
            swipeThreshold: config.swipeThreshold || 100,
            touchDelay: config.touchDelay || 300,
            cacheName: config.cacheName || 'architech-cache-v1',
            offlinePages: config.offlinePages || ['/offline.html'],
            ...config
        };

        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.isTouch = false;
        this.gestureListeners = new Map();
        this.swipeHandlers = new Map();

        this.deviceInfo = this.detectDevice();
        this.connectionInfo = this.detectConnection();

        this.initialize();
    }

    /**
     * Inizializza ottimizzazioni mobile
     */
    async initialize() {
        try {
            // Rileva capacità del dispositivo
            this.detectCapabilities();

            // Setup viewport e meta tags
            this.setupMobileViewport();

            // Inizializza PWA se supportato
            if (this.config.enablePWA && 'serviceWorker' in navigator) {
                await this.initializePWA();
            }

            // Setup gesture recognition
            if (this.config.enableGestures) {
                this.initializeGestures();
            }

            // Ottimizzazioni performance mobile
            this.initializeMobilePerformance();

            // Setup offline support
            if (this.config.enableOffline) {
                this.initializeOfflineSupport();
            }

            // Setup notifiche push
            if (this.config.enableNotifications) {
                await this.initializeNotifications();
            }

            // Monitoraggio connessione
            this.setupConnectionMonitoring();

            // Ottimizzazioni specifiche per dispositivo
            this.applyDeviceOptimizations();

            console.log('Mobile Optimizer inizializzato', {
                device: this.deviceInfo,
                connection: this.connectionInfo
            });

        } catch (error) {
            console.error('Errore inizializzazione Mobile Optimizer:', error);
        }
    }

    /**
     * Rileva informazioni sul dispositivo
     */
    detectDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const screen = window.screen;

        return {
            isMobile: /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent),
            isIOS: /ipad|iphone|ipod/.test(userAgent),
            isAndroid: /android/.test(userAgent),
            isTablet: /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(userAgent),
            screenWidth: screen.width,
            screenHeight: screen.height,
            pixelRatio: window.devicePixelRatio || 1,
            orientation: screen.orientation?.type || 'unknown',
            hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            memory: navigator.deviceMemory || null,
            cores: navigator.hardwareConcurrency || null
        };
    }

    /**
     * Rileva informazioni sulla connessione
     */
    detectConnection() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        return {
            effectiveType: connection?.effectiveType || 'unknown',
            downlink: connection?.downlink || null,
            rtt: connection?.rtt || null,
            saveData: connection?.saveData || false,
            isOnline: navigator.onLine
        };
    }

    /**
     * Rileva capacità del dispositivo
     */
    detectCapabilities() {
        this.capabilities = {
            webGL: !!window.WebGLRenderingContext,
            webGL2: !!window.WebGL2RenderingContext,
            webAssembly: typeof WebAssembly === 'object',
            intersectionObserver: 'IntersectionObserver' in window,
            serviceWorker: 'serviceWorker' in navigator,
            pushManager: 'PushManager' in window,
            notifications: 'Notification' in window,
            geolocation: 'geolocation' in navigator,
            deviceOrientation: 'DeviceOrientationEvent' in window,
            deviceMotion: 'DeviceMotionEvent' in window,
            fullscreen: document.fullscreenEnabled || document.webkitFullscreenEnabled,
            localStorage: typeof Storage !== 'undefined',
            indexedDB: 'indexedDB' in window,
            webShare: 'share' in navigator,
            clipboard: 'clipboard' in navigator
        };
    }

    /**
     * Setup viewport mobile
     */
    setupMobileViewport() {
        let viewport = document.querySelector('meta[name="viewport"]');
        
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }

        // Configurazione viewport ottimizzata
        let viewportContent = 'width=device-width, initial-scale=1.0';
        
        // Impedisce zoom su iOS per input
        if (this.deviceInfo.isIOS) {
            viewportContent += ', user-scalable=no';
        }
        
        viewport.content = viewportContent;

        // Meta tag aggiuntivi per mobile
        this.addMobileMetaTags();
    }

    /**
     * Aggiunge meta tag mobile
     */
    addMobileMetaTags() {
        const metaTags = [
            { name: 'mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
            { name: 'theme-color', content: '#1a1a1a' },
            { name: 'msapplication-TileColor', content: '#1a1a1a' }
        ];

        metaTags.forEach(tag => {
            if (!document.querySelector(`meta[name="${tag.name}"]`)) {
                const meta = document.createElement('meta');
                meta.name = tag.name;
                meta.content = tag.content;
                document.head.appendChild(meta);
            }
        });

        // Apple touch icon
        if (!document.querySelector('link[rel="apple-touch-icon"]')) {
            const appleTouchIcon = document.createElement('link');
            appleTouchIcon.rel = 'apple-touch-icon';
            appleTouchIcon.href = '/apple-touch-icon.png';
            document.head.appendChild(appleTouchIcon);
        }
    }

    /**
     * Inizializza PWA
     */
    async initializePWA() {
        try {
            // Registra Service Worker
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker registrato:', registration);

            // Gestisce aggiornamenti del Service Worker
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showUpdateAvailable();
                    }
                });
            });

            // Crea manifest.json dinamicamente se non esiste
            if (!document.querySelector('link[rel="manifest"]')) {
                await this.createWebAppManifest();
            }

            // Mostra prompt di installazione
            this.setupInstallPrompt();

        } catch (error) {
            console.error('Errore inizializzazione PWA:', error);
        }
    }

    /**
     * Crea manifest.json dinamicamente
     */
    async createWebAppManifest() {
        const manifest = {
            name: 'ArchiTech - Cybersecurity Solutions',
            short_name: 'ArchiTech',
            description: 'Soluzioni avanzate di cybersecurity per la tua azienda',
            start_url: '/',
            display: 'standalone',
            background_color: '#1a1a1a',
            theme_color: '#1a1a1a',
            orientation: 'portrait-primary',
            icons: [
                {
                    src: '/icon-192.png',
                    sizes: '192x192',
                    type: 'image/png'
                },
                {
                    src: '/icon-512.png',
                    sizes: '512x512',
                    type: 'image/png'
                }
            ],
            categories: ['business', 'productivity', 'security'],
            screenshots: [
                {
                    src: '/screenshot-mobile.png',
                    sizes: '640x1136',
                    type: 'image/png'
                }
            ]
        };

        // Crea blob per il manifest
        const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
            type: 'application/json'
        });
        const manifestURL = URL.createObjectURL(manifestBlob);

        // Aggiungi link al manifest
        const manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = manifestURL;
        document.head.appendChild(manifestLink);
    }

    /**
     * Setup prompt di installazione PWA
     */
    setupInstallPrompt() {
        let deferredPrompt = null;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.showInstallButton(deferredPrompt);
        });

        window.addEventListener('appinstalled', (e) => {
            console.log('PWA installata');
            this.trackEvent('pwa_installed');
        });
    }

    /**
     * Mostra pulsante di installazione
     */
    showInstallButton(deferredPrompt) {
        const installButton = document.createElement('button');
        installButton.className = 'pwa-install-button';
        installButton.innerHTML = '📱 Installa App';
        installButton.onclick = async () => {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('Scelta utente per installazione:', outcome);
            installButton.remove();
        };

        // Aggiungi il pulsante in una posizione appropriata
        document.body.appendChild(installButton);

        // Auto-rimuovi dopo 10 secondi se non cliccato
        setTimeout(() => {
            if (document.body.contains(installButton)) {
                installButton.remove();
            }
        }, 10000);
    }

    /**
     * Inizializza gesture recognition
     */
    initializeGestures() {
        // Touch events base
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });

        // Gesture specifiche per elementi
        this.setupSwipeNavigation();
        this.setupPullToRefresh();
        this.setupPinchZoom();
        
        // Migliora tap response
        this.improveTapResponse();
    }

    /**
     * Gestisce inizio touch
     */
    handleTouchStart(e) {
        this.isTouch = true;
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.touchStartTime = Date.now();

        // Custom event per sviluppatori
        this.dispatchGestureEvent('touchstart', {
            x: this.touchStartX,
            y: this.touchStartY,
            target: e.target
        });
    }

    /**
     * Gestisce movimento touch
     */
    handleTouchMove(e) {
        if (!this.isTouch) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = currentX - this.touchStartX;
        const deltaY = currentY - this.touchStartY;

        // Impedisce scroll durante swipe laterale
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            e.preventDefault();
        }

        this.dispatchGestureEvent('touchmove', {
            x: currentX,
            y: currentY,
            deltaX: deltaX,
            deltaY: deltaY,
            target: e.target
        });
    }

    /**
     * Gestisce fine touch
     */
    handleTouchEnd(e) {
        if (!this.isTouch) return;

        this.touchEndX = e.changedTouches[0].clientX;
        this.touchEndY = e.changedTouches[0].clientY;
        const touchDuration = Date.now() - this.touchStartTime;

        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Rileva tipo di gesture
        this.detectGesture(deltaX, deltaY, distance, touchDuration, e.target);

        this.isTouch = false;
    }

    /**
     * Rileva tipo di gesture
     */
    detectGesture(deltaX, deltaY, distance, duration, target) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // Tap
        if (distance < 10 && duration < 300) {
            this.dispatchGestureEvent('tap', { target, x: this.touchEndX, y: this.touchEndY });
        }
        // Long press
        else if (distance < 10 && duration > 500) {
            this.dispatchGestureEvent('longpress', { target, x: this.touchEndX, y: this.touchEndY });
        }
        // Swipe
        else if (distance > this.config.swipeThreshold) {
            let direction;
            
            if (absX > absY) {
                direction = deltaX > 0 ? 'right' : 'left';
            } else {
                direction = deltaY > 0 ? 'down' : 'up';
            }

            this.dispatchGestureEvent('swipe', {
                direction,
                distance,
                deltaX,
                deltaY,
                target,
                velocity: distance / duration
            });

            // Esegue handler specifici per swipe
            this.executeSwipeHandlers(direction, target);
        }
    }

    /**
     * Setup navigazione con swipe
     */
    setupSwipeNavigation() {
        // Swipe per tornare indietro nella history (come nei browser mobile)
        this.addSwipeHandler('right', (e) => {
            if (e.target.closest('nav, .navigation')) {
                return; // Non interferire con la navigazione
            }
            
            if (window.history.length > 1 && e.x < 50) { // Solo se swipe inizia dal bordo
                window.history.back();
                this.showSwipeBackFeedback();
            }
        });

        // Swipe per aprire/chiudere menu mobile
        this.addSwipeHandler('left', (e) => {
            if (e.x > window.innerWidth - 50) { // Solo se swipe inizia dal bordo destro
                this.toggleMobileMenu();
            }
        });
    }

    /**
     * Setup pull to refresh
     */
    setupPullToRefresh() {
        let startY = 0;
        let pullDistance = 0;
        const threshold = 100;

        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (window.scrollY === 0 && startY > 0) {
                pullDistance = e.touches[0].clientY - startY;
                
                if (pullDistance > 0) {
                    this.showPullToRefreshIndicator(pullDistance, threshold);
                }
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (pullDistance > threshold) {
                this.triggerRefresh();
            }
            this.hidePullToRefreshIndicator();
            startY = 0;
            pullDistance = 0;
        }, { passive: true });
    }

    /**
     * Setup pinch zoom per immagini
     */
    setupPinchZoom() {
        let initialDistance = 0;
        let scale = 1;

        document.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                const img = e.target.closest('img');
                if (img) {
                    initialDistance = this.getTouchDistance(e.touches);
                    img.style.transformOrigin = 'center';
                }
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const img = e.target.closest('img');
                if (img && initialDistance > 0) {
                    const currentDistance = this.getTouchDistance(e.touches);
                    scale = currentDistance / initialDistance;
                    img.style.transform = `scale(${Math.min(Math.max(scale, 0.5), 3)})`;
                }
            }
        });

        document.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) {
                initialDistance = 0;
                // Reset zoom dopo 2 secondi
                const img = e.target.closest('img');
                if (img) {
                    setTimeout(() => {
                        img.style.transform = 'scale(1)';
                    }, 2000);
                }
            }
        }, { passive: true });
    }

    /**
     * Migliora response dei tap (elimina delay 300ms)
     */
    improveTapResponse() {
        // Elimina delay su iOS
        document.addEventListener('touchstart', () => {}, { passive: true });
        
        // Custom tap implementation per elementi interattivi
        const interactiveElements = 'button, a, input, select, textarea, [role="button"], [tabindex]';
        
        document.addEventListener('touchend', (e) => {
            const element = e.target.closest(interactiveElements);
            if (element && !element.disabled) {
                element.classList.add('tap-highlight');
                setTimeout(() => element.classList.remove('tap-highlight'), 150);
                
                // Trigger click immediato invece di aspettare
                if (Date.now() - this.touchStartTime < 300) {
                    element.click();
                    e.preventDefault();
                }
            }
        }, { passive: false });
    }

    /**
     * Inizializza ottimizzazioni performance mobile
     */
    initializeMobilePerformance() {
        // Riduce animazioni su dispositivi lenti
        if (this.deviceInfo.memory && this.deviceInfo.memory < 2) {
            document.documentElement.classList.add('low-memory');
        }

        // Ottimizza rendering per connessioni lente
        if (this.connectionInfo.effectiveType === 'slow-2g' || this.connectionInfo.effectiveType === '2g') {
            this.enableDataSaverMode();
        }

        // Preload risorse critiche solo su connessioni veloci
        if (this.connectionInfo.effectiveType === '4g') {
            this.preloadCriticalResources();
        }

        // Ottimizza scroll su mobile
        this.optimizeMobileScroll();

        // Gestisce rotazione schermo
        this.handleOrientationChange();
    }

    /**
     * Abilita modalità data saver
     */
    enableDataSaverMode() {
        document.documentElement.classList.add('data-saver');
        
        // Disabilita immagini di background non critiche
        const bgImages = document.querySelectorAll('[style*="background-image"]');
        bgImages.forEach(el => {
            if (!el.dataset.critical) {
                el.style.backgroundImage = 'none';
            }
        });

        // Ritarda caricamento di media non critici
        const media = document.querySelectorAll('video, iframe');
        media.forEach(el => el.loading = 'lazy');
    }

    /**
     * Ottimizza scroll mobile
     */
    optimizeMobileScroll() {
        // Migliora momentum scrolling su iOS
        document.body.style.webkitOverflowScrolling = 'touch';
        
        // Riduce repaints durante scroll
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScrollOptimization();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    /**
     * Gestisce rotazione schermo
     */
    handleOrientationChange() {
        const handleRotation = () => {
            // Corregge bug di zoom su iOS durante rotazione
            if (this.deviceInfo.isIOS) {
                document.querySelector('meta[name="viewport"]').content = 
                    'width=device-width, initial-scale=1.0, user-scalable=no';
            }

            // Ricalcola dimensioni dopo rotazione
            setTimeout(() => {
                this.updateViewportDimensions();
                window.dispatchEvent(new Event('resize'));
            }, 100);
        };

        screen.orientation?.addEventListener('change', handleRotation);
        window.addEventListener('orientationchange', handleRotation);
    }

    /**
     * Inizializza supporto offline
     */
    initializeOfflineSupport() {
        // Monitora stato connessione
        window.addEventListener('online', () => {
            this.handleConnectionChange(true);
        });

        window.addEventListener('offline', () => {
            this.handleConnectionChange(false);
        });

        // Mostra stato offline
        if (!navigator.onLine) {
            this.showOfflineIndicator();
        }
    }

    /**
     * Gestisce cambio connessione
     */
    handleConnectionChange(isOnline) {
        if (isOnline) {
            this.hideOfflineIndicator();
            this.syncOfflineData();
            
            if (window.feedbackSystem) {
                window.feedbackSystem.showNotification('Connessione ripristinata', 'success');
            }
        } else {
            this.showOfflineIndicator();
            
            if (window.feedbackSystem) {
                window.feedbackSystem.showNotification('Modalità offline attiva', 'warning');
            }
        }

        this.updateConnectionInfo();
    }

    /**
     * Inizializza notifiche push
     */
    async initializeNotifications() {
        if (!('Notification' in window) || !('PushManager' in window)) {
            console.warn('Notifiche push non supportate');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.config.vapidPublicKey
                });

                // Invia subscription al server
                await this.sendSubscriptionToServer(subscription);
            }

        } catch (error) {
            console.error('Errore inizializzazione notifiche:', error);
        }
    }

    /**
     * Utility functions
     */
    addSwipeHandler(direction, handler) {
        if (!this.swipeHandlers.has(direction)) {
            this.swipeHandlers.set(direction, []);
        }
        this.swipeHandlers.get(direction).push(handler);
    }

    executeSwipeHandlers(direction, target) {
        const handlers = this.swipeHandlers.get(direction) || [];
        handlers.forEach(handler => {
            handler({ direction, target, x: this.touchStartX, y: this.touchStartY });
        });
    }

    getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    dispatchGestureEvent(type, detail) {
        window.dispatchEvent(new CustomEvent(`mobile:${type}`, { detail }));
    }

    trackEvent(eventName, data = {}) {
        if (window.analytics) {
            window.analytics.track(eventName, {
                device_type: this.deviceInfo.isMobile ? 'mobile' : 'desktop',
                connection_type: this.connectionInfo.effectiveType,
                ...data
            });
        }
    }

    showOfflineIndicator() {
        if (document.querySelector('.offline-indicator')) return;

        const indicator = document.createElement('div');
        indicator.className = 'offline-indicator';
        indicator.innerHTML = '📡 Offline';
        document.body.appendChild(indicator);
    }

    hideOfflineIndicator() {
        const indicator = document.querySelector('.offline-indicator');
        if (indicator) indicator.remove();
    }

    showUpdateAvailable() {
        if (window.feedbackSystem) {
            window.feedbackSystem.showNotification(
                'Nuova versione disponibile. Ricarica la pagina per aggiornarla.',
                'info',
                { persistent: true }
            );
        }
    }

    showSwipeBackFeedback() {
        const feedback = document.createElement('div');
        feedback.className = 'swipe-back-feedback';
        feedback.innerHTML = '← Indietro';
        document.body.appendChild(feedback);
        
        setTimeout(() => feedback.remove(), 300);
    }

    toggleMobileMenu() {
        const menu = document.querySelector('.mobile-menu') || document.querySelector('nav');
        if (menu) {
            menu.classList.toggle('open');
        }
    }

    showPullToRefreshIndicator(distance, threshold) {
        let indicator = document.querySelector('.pull-refresh-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'pull-refresh-indicator';
            indicator.innerHTML = '↓ Rilascia per aggiornare';
            document.body.appendChild(indicator);
        }

        const progress = Math.min(distance / threshold, 1);
        indicator.style.transform = `translateY(${Math.min(distance, threshold)}px)`;
        indicator.style.opacity = progress;

        if (progress >= 1) {
            indicator.classList.add('ready');
            indicator.innerHTML = '↻ Rilascia per aggiornare';
        }
    }

    hidePullToRefreshIndicator() {
        const indicator = document.querySelector('.pull-refresh-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    triggerRefresh() {
        // Ricarica la pagina o aggiorna contenuti
        if (window.spaRouter) {
            window.spaRouter.refresh();
        } else {
            window.location.reload();
        }
    }

    updateConnectionInfo() {
        this.connectionInfo = this.detectConnection();
    }

    updateViewportDimensions() {
        // Aggiorna CSS custom properties per dimensioni viewport
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        const vw = window.innerWidth * 0.01;
        document.documentElement.style.setProperty('--vw', `${vw}px`);
    }

    handleScrollOptimization() {
        // Implementa ottimizzazioni scroll specifiche
        const scrollY = window.scrollY;
        
        // Nascondi elementi non critici durante scroll veloce
        if (this.lastScrollY && Math.abs(scrollY - this.lastScrollY) > 50) {
            document.body.classList.add('fast-scroll');
            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = setTimeout(() => {
                document.body.classList.remove('fast-scroll');
            }, 150);
        }
        
        this.lastScrollY = scrollY;
    }

    preloadCriticalResources() {
        // Preload solo per connessioni veloci
        const criticalImages = document.querySelectorAll('img[data-critical]');
        criticalImages.forEach(img => {
            if ('loading' in img) {
                img.loading = 'eager';
            }
        });
    }

    syncOfflineData() {
        // Sincronizza dati offline quando torna la connessione
        if (window.formHandler) {
            window.formHandler.processOfflineQueue();
        }
    }

    async sendSubscriptionToServer(subscription) {
        try {
            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            });
        } catch (error) {
            console.error('Errore invio subscription:', error);
        }
    }

    applyDeviceOptimizations() {
        // Ottimizzazioni specifiche per dispositivo
        if (this.deviceInfo.isIOS) {
            document.body.classList.add('ios');
            // Fix per bouncing scroll
            document.addEventListener('touchmove', (e) => {
                if (e.touches.length > 1) e.preventDefault();
            }, { passive: false });
        }

        if (this.deviceInfo.isAndroid) {
            document.body.classList.add('android');
        }

        if (this.deviceInfo.memory && this.deviceInfo.memory < 4) {
            document.body.classList.add('low-memory');
        }
    }

    /**
     * API pubblica
     */
    
    // Vibrazione (se supportata)
    vibrate(pattern = [100]) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }

    // Condivisione nativa
    async share(data) {
        if ('share' in navigator) {
            try {
                await navigator.share(data);
                return true;
            } catch (error) {
                console.error('Errore condivisione:', error);
            }
        }
        return false;
    }

    // Ottieni info dispositivo
    getDeviceInfo() {
        return { ...this.deviceInfo };
    }

    // Ottieni info connessione
    getConnectionInfo() {
        return { ...this.connectionInfo };
    }

    // Abilita/disabilita gesture
    setGesturesEnabled(enabled) {
        this.config.enableGestures = enabled;
        if (enabled) {
            this.initializeGestures();
        } else {
            this.gestureListeners.clear();
        }
    }
}

export default MobileOptimizer;
