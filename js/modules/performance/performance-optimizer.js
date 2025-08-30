/**
 * Performance Optimizer Module
 * Ottimizza animazioni, previene repaints/reflows e implementa debouncing
 * Utilizza requestAnimationFrame per animazioni fluide
 */

class PerformanceOptimizer {
    constructor() {
        this.rafCallbacks = new Set();
        this.debouncedCallbacks = new Map();
        this.throttledCallbacks = new Map();
        this.scrollCallbacks = new Set();
        this.resizeCallbacks = new Set();
        this.isScrolling = false;
        this.isResizing = false;
        
        this.init();
    }
    
    init() {
        this.setupScrollOptimization();
        this.setupResizeOptimization();
        this.setupAnimationOptimization();
        this.preloadCriticalResources();
    }
    
    /**
     * Ottimizza eventi di scroll con requestAnimationFrame
     */
    setupScrollOptimization() {
        let scrollRAF = null;
        
        window.addEventListener('scroll', () => {
            if (scrollRAF) return;
            
            scrollRAF = requestAnimationFrame(() => {
                this.scrollCallbacks.forEach(callback => {
                    try {
                        callback();
                    } catch (error) {
                        console.warn('Errore in callback scroll:', error);
                    }
                });
                scrollRAF = null;
            });
        }, { passive: true });
    }
    
    /**
     * Ottimizza eventi di resize con debouncing
     */
    setupResizeOptimization() {
        let resizeRAF = null;
        const debouncedResize = this.debounce(() => {
            this.resizeCallbacks.forEach(callback => {
                try {
                    callback();
                } catch (error) {
                    console.warn('Errore in callback resize:', error);
                }
            });
        }, 250);
        
        window.addEventListener('resize', () => {
            // Immediate callbacks per aggiornamenti critici
            if (resizeRAF) return;
            
            resizeRAF = requestAnimationFrame(() => {
                this.resizeCallbacks.forEach(callback => {
                    if (callback.immediate) {
                        callback();
                    }
                });
                resizeRAF = null;
            });
            
            // Debounced callbacks per aggiornamenti pesanti
            debouncedResize();
        });
    }
    
    /**
     * Sistema di animazioni ottimizzate
     */
    setupAnimationOptimization() {
        // Disabilita animazioni se utente preferisce reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.classList.add('reduce-motion');
        }
        
        // Monitora visibilità pagina per pausare animazioni
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimations();
            } else {
                this.resumeAnimations();
            }
        });
    }
    
    /**
     * Precarica risorse critiche
     */
    preloadCriticalResources() {
        const criticalImages = document.querySelectorAll('[data-preload="critical"]');
        const criticalFonts = document.querySelectorAll('link[rel="preload"][as="font"]');
        
        // Preload immagini critiche
        criticalImages.forEach(img => {
            const src = img.getAttribute('data-src') || img.src;
            if (src) {
                const preloadLink = document.createElement('link');
                preloadLink.rel = 'preload';
                preloadLink.as = 'image';
                preloadLink.href = src;
                document.head.appendChild(preloadLink);
            }
        });
        
        // Ottimizza caricamento font
        this.optimizeFontLoading();
    }
    
    /**
     * Ottimizza il caricamento dei font
     */
    optimizeFontLoading() {
        if ('fonts' in document) {
            // Font display swap per evitare FOIT
            document.fonts.ready.then(() => {
                document.documentElement.classList.add('fonts-loaded');
            });
            
            // Preload font critici
            const criticalFonts = ['font-family-primary', 'font-family-heading'];
            criticalFonts.forEach(fontFamily => {
                if (CSS.supports('font-display', 'swap')) {
                    // Font è già ottimizzato con font-display: swap
                }
            });
        }
    }
    
    /**
     * Aggiungi callback per scroll ottimizzato
     */
    addScrollCallback(callback, options = {}) {
        const wrappedCallback = () => {
            if (options.throttle) {
                this.throttle(callback, options.throttle)();
            } else {
                callback();
            }
        };
        
        wrappedCallback.options = options;
        this.scrollCallbacks.add(wrappedCallback);
        
        return () => this.scrollCallbacks.delete(wrappedCallback);
    }
    
    /**
     * Aggiungi callback per resize ottimizzato
     */
    addResizeCallback(callback, options = {}) {
        const wrappedCallback = options.immediate ? 
            Object.assign(callback, { immediate: true }) : 
            callback;
            
        this.resizeCallbacks.add(wrappedCallback);
        
        return () => this.resizeCallbacks.delete(wrappedCallback);
    }
    
    /**
     * Animazione ottimizzata con requestAnimationFrame
     */
    animate(callback, duration = null) {
        const startTime = performance.now();
        let animationId;
        
        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = duration ? Math.min(elapsed / duration, 1) : 1;
            
            try {
                const shouldContinue = callback(progress, elapsed);
                
                if (shouldContinue !== false && (duration === null || progress < 1)) {
                    animationId = requestAnimationFrame(step);
                }
            } catch (error) {
                console.warn('Errore durante animazione:', error);
            }
        };
        
        animationId = requestAnimationFrame(step);
        
        return () => cancelAnimationFrame(animationId);
    }
    
    /**
     * Batch DOM operations per minimizzare reflow
     */
    batchDOMOperations(operations) {
        return requestAnimationFrame(() => {
            const fragment = document.createDocumentFragment();
            const elementsToUpdate = [];
            
            operations.forEach(operation => {
                try {
                    if (operation.type === 'create') {
                        const element = this.createElement(operation);
                        if (operation.parent === 'fragment') {
                            fragment.appendChild(element);
                        } else if (operation.parent) {
                            operation.parent.appendChild(element);
                        }
                        elementsToUpdate.push({ element, operation });
                    } else if (operation.type === 'update') {
                        elementsToUpdate.push({ element: operation.element, operation });
                    }
                } catch (error) {
                    console.warn('Errore in operazione DOM:', error);
                }
            });
            
            // Applica tutte le modifiche CSS insieme
            this.batchCSSUpdates(elementsToUpdate);
            
            // Appendi fragment se necessario
            if (fragment.children.length > 0) {
                const targetContainer = operations.find(op => op.container);
                if (targetContainer) {
                    targetContainer.container.appendChild(fragment);
                }
            }
        });
    }
    
    /**
     * Batch CSS updates per minimizzare repaint
     */
    batchCSSUpdates(elements) {
        elements.forEach(({ element, operation }) => {
            if (operation.styles) {
                Object.assign(element.style, operation.styles);
            }
            if (operation.classes) {
                if (operation.classes.add) {
                    element.classList.add(...operation.classes.add);
                }
                if (operation.classes.remove) {
                    element.classList.remove(...operation.classes.remove);
                }
                if (operation.classes.toggle) {
                    operation.classes.toggle.forEach(cls => {
                        element.classList.toggle(cls);
                    });
                }
            }
            if (operation.attributes) {
                Object.entries(operation.attributes).forEach(([key, value]) => {
                    element.setAttribute(key, value);
                });
            }
        });
    }
    
    /**
     * Crea elemento con ottimizzazioni
     */
    createElement(operation) {
        const element = document.createElement(operation.tag || 'div');
        
        if (operation.content) {
            if (operation.html) {
                element.innerHTML = operation.content;
            } else {
                element.textContent = operation.content;
            }
        }
        
        return element;
    }
    
    /**
     * Debounce function ottimizzata
     */
    debounce(func, wait, immediate = false) {
        const key = func.toString() + wait;
        
        if (this.debouncedCallbacks.has(key)) {
            return this.debouncedCallbacks.get(key);
        }
        
        let timeout;
        const debounced = function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            
            if (callNow) func(...args);
        };
        
        this.debouncedCallbacks.set(key, debounced);
        return debounced;
    }
    
    /**
     * Throttle function ottimizzata
     */
    throttle(func, limit) {
        const key = func.toString() + limit;
        
        if (this.throttledCallbacks.has(key)) {
            return this.throttledCallbacks.get(key);
        }
        
        let lastFunc;
        let lastRan;
        
        const throttled = function(...args) {
            if (!lastRan) {
                func(...args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(() => {
                    if ((Date.now() - lastRan) >= limit) {
                        func(...args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
        
        this.throttledCallbacks.set(key, throttled);
        return throttled;
    }
    
    /**
     * Metti in pausa animazioni quando pagina non è visibile
     */
    pauseAnimations() {
        document.documentElement.classList.add('animations-paused');
        
        // Pausa video se presenti
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            if (!video.paused) {
                video.pause();
                video.setAttribute('data-was-playing', 'true');
            }
        });
    }
    
    /**
     * Riprendi animazioni quando pagina torna visibile
     */
    resumeAnimations() {
        document.documentElement.classList.remove('animations-paused');
        
        // Riprendi video che erano in riproduzione
        const videos = document.querySelectorAll('video[data-was-playing]');
        videos.forEach(video => {
            video.play();
            video.removeAttribute('data-was-playing');
        });
    }
    
    /**
     * Ottimizza immagini per dispositivo corrente
     */
    optimizeImagesForDevice() {
        const pixelRatio = window.devicePixelRatio || 1;
        const connection = navigator.connection;
        const isSlowConnection = connection && (
            connection.effectiveType === 'slow-2g' ||
            connection.effectiveType === '2g' ||
            connection.saveData
        );
        
        return {
            pixelRatio: isSlowConnection ? 1 : pixelRatio,
            quality: isSlowConnection ? 60 : 80,
            format: this.getSupportedImageFormat()
        };
    }
    
    /**
     * Rileva formato immagine ottimale supportato
     */
    getSupportedImageFormat() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        
        // Testa supporto WebP
        if (canvas.toDataURL('image/webp').indexOf('webp') > -1) {
            return 'webp';
        }
        
        // Fallback JPEG
        return 'jpeg';
    }
    
    /**
     * Misura performance vitals
     */
    measurePerformance() {
        if ('performance' in window) {
            const perfEntries = performance.getEntriesByType('navigation')[0];
            const paintEntries = performance.getEntriesByType('paint');
            
            const metrics = {
                domContentLoaded: perfEntries.domContentLoadedEventEnd - perfEntries.domContentLoadedEventStart,
                loadComplete: perfEntries.loadEventEnd - perfEntries.loadEventStart,
                firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime,
                firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime
            };
            
            // Log metriche per analisi
            console.group('Performance Metrics');
            Object.entries(metrics).forEach(([key, value]) => {
                if (value !== undefined) {
                    console.log(`${key}: ${Math.round(value)}ms`);
                }
            });
            console.groupEnd();
            
            return metrics;
        }
        
        return null;
    }
    
    /**
     * Pulisci callbacks e listener
     */
    cleanup() {
        this.scrollCallbacks.clear();
        this.resizeCallbacks.clear();
        this.debouncedCallbacks.clear();
        this.throttledCallbacks.clear();
    }
}

// Inizializza performance optimizer
const performanceOptimizer = new PerformanceOptimizer();

// Esporta per uso globale
window.performanceOptimizer = performanceOptimizer;

export default PerformanceOptimizer;
