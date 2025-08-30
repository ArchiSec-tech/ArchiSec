/**
 * Lazy Loading Module
 * Implementa lazy loading per immagini e contenuti below-the-fold
 * Utilizza Intersection Observer API per performance ottimali
 */

class LazyLoader {
    constructor(options = {}) {
        this.options = {
            rootMargin: '50px 0px',
            threshold: 0.01,
            enableDataSaver: true,
            fadeInDuration: 300,
            ...options
        };
        
        this.imageObserver = null;
        this.contentObserver = null;
        this.init();
    }
    
    init() {
        // Verifica supporto Intersection Observer
        if (!('IntersectionObserver' in window)) {
            this.fallbackLoading();
            return;
        }
        
        this.initImageLazyLoading();
        this.initContentLazyLoading();
        this.initBackgroundImageLazyLoading();
    }
    
    /**
     * Lazy loading per immagini standard
     */
    initImageLazyLoading() {
        const imageObserverOptions = {
            rootMargin: this.options.rootMargin,
            threshold: this.options.threshold
        };
        
        this.imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, imageObserverOptions);
        
        // Osserva tutte le immagini con attributo data-src
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            this.imageObserver.observe(img);
        });
    }
    
    /**
     * Lazy loading per immagini di background
     */
    initBackgroundImageLazyLoading() {
        const bgImageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadBackgroundImage(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: this.options.rootMargin,
            threshold: this.options.threshold
        });
        
        const lazyBgElements = document.querySelectorAll('[data-bg]');
        lazyBgElements.forEach(element => {
            bgImageObserver.observe(element);
        });
    }
    
    /**
     * Lazy loading per contenuti generici
     */
    initContentLazyLoading() {
        this.contentObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadContent(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '100px 0px',
            threshold: 0.01
        });
        
        const lazyContent = document.querySelectorAll('[data-lazy-content]');
        lazyContent.forEach(element => {
            this.contentObserver.observe(element);
        });
    }
    
    /**
     * Carica un'immagine lazy
     */
    loadImage(img) {
        // Verifica Data Saver API se abilitata
        if (this.options.enableDataSaver && this.isDataSaverEnabled()) {
            this.loadLowQualityImage(img);
            return;
        }
        
        const src = img.getAttribute('data-src');
        const srcset = img.getAttribute('data-srcset');
        
        if (!src) return;
        
        // Crea un'immagine temporanea per il preload
        const imageLoader = new Image();
        
        imageLoader.onload = () => {
            // Applica l'immagine caricata
            img.src = src;
            if (srcset) {
                img.srcset = srcset;
            }
            
            // Aggiungi classe per animazione fade-in
            img.classList.add('lazy-loaded');
            
            // Rimuovi attributi data non più necessari
            img.removeAttribute('data-src');
            img.removeAttribute('data-srcset');
            
            // Trigger evento personalizzato
            img.dispatchEvent(new CustomEvent('lazyImageLoaded', {
                bubbles: true,
                detail: { element: img }
            }));
        };
        
        imageLoader.onerror = () => {
            img.classList.add('lazy-error');
            console.warn('Errore nel caricamento lazy dell\'immagine:', src);
        };
        
        // Avvia il caricamento
        imageLoader.src = src;
        if (srcset) {
            imageLoader.srcset = srcset;
        }
    }
    
    /**
     * Carica immagine di background lazy
     */
    loadBackgroundImage(element) {
        const bgImage = element.getAttribute('data-bg');
        if (!bgImage) return;
        
        const imageLoader = new Image();
        imageLoader.onload = () => {
            element.style.backgroundImage = `url(${bgImage})`;
            element.classList.add('lazy-bg-loaded');
            element.removeAttribute('data-bg');
        };
        
        imageLoader.onerror = () => {
            element.classList.add('lazy-bg-error');
        };
        
        imageLoader.src = bgImage;
    }
    
    /**
     * Carica contenuto lazy generico
     */
    loadContent(element) {
        const contentType = element.getAttribute('data-lazy-content');
        
        switch (contentType) {
            case 'iframe':
                this.loadIframe(element);
                break;
            case 'video':
                this.loadVideo(element);
                break;
            case 'component':
                this.loadComponent(element);
                break;
            default:
                this.loadGenericContent(element);
        }
    }
    
    /**
     * Carica iframe lazy
     */
    loadIframe(container) {
        const src = container.getAttribute('data-iframe-src');
        if (!src) return;
        
        const iframe = document.createElement('iframe');
        iframe.src = src;
        iframe.loading = 'lazy';
        
        // Copia attributi dal container
        ['width', 'height', 'frameborder', 'allowfullscreen'].forEach(attr => {
            const value = container.getAttribute(`data-iframe-${attr}`);
            if (value !== null) {
                iframe.setAttribute(attr, value);
            }
        });
        
        container.appendChild(iframe);
        container.classList.add('lazy-content-loaded');
    }
    
    /**
     * Carica video lazy
     */
    loadVideo(container) {
        const src = container.getAttribute('data-video-src');
        const poster = container.getAttribute('data-video-poster');
        
        if (!src) return;
        
        const video = document.createElement('video');
        video.src = src;
        video.controls = true;
        video.preload = 'metadata';
        
        if (poster) {
            video.poster = poster;
        }
        
        container.appendChild(video);
        container.classList.add('lazy-content-loaded');
    }
    
    /**
     * Carica componente lazy generico
     */
    loadComponent(container) {
        const componentName = container.getAttribute('data-component');
        if (!componentName) return;
        
        // Simula caricamento componente (personalizzabile)
        this.loadComponentByName(componentName, container);
    }
    
    /**
     * Carica contenuto generico lazy
     */
    loadGenericContent(element) {
        element.classList.add('lazy-content-loaded');
        
        // Trigger evento per contenuto caricato
        element.dispatchEvent(new CustomEvent('lazyContentLoaded', {
            bubbles: true,
            detail: { element }
        }));
    }
    
    /**
     * Carica immagine a bassa qualità per Data Saver
     */
    loadLowQualityImage(img) {
        const lowQualitySrc = img.getAttribute('data-src-lowq') || 
                             this.generateLowQualityUrl(img.getAttribute('data-src'));
        
        if (lowQualitySrc) {
            img.src = lowQualitySrc;
            img.classList.add('lazy-loaded', 'low-quality');
        }
    }
    
    /**
     * Genera URL per immagine a bassa qualità
     */
    generateLowQualityUrl(originalUrl) {
        // Implementazione specifica del servizio utilizzato
        // Esempio per servizi come Cloudinary, ImageKit, etc.
        return originalUrl; // Placeholder
    }
    
    /**
     * Verifica se Data Saver è abilitato
     */
    isDataSaverEnabled() {
        return navigator.connection && 
               navigator.connection.saveData === true;
    }
    
    /**
     * Fallback per browser senza Intersection Observer
     */
    fallbackLoading() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        const lazyBgElements = document.querySelectorAll('[data-bg]');
        const lazyContent = document.querySelectorAll('[data-lazy-content]');
        
        // Carica tutto immediatamente
        lazyImages.forEach(img => this.loadImage(img));
        lazyBgElements.forEach(element => this.loadBackgroundImage(element));
        lazyContent.forEach(element => this.loadContent(element));
    }
    
    /**
     * Carica componente per nome (estendibile)
     */
    async loadComponentByName(componentName, container) {
        try {
            // Esempio di caricamento dinamico componente
            const module = await import(`../components/${componentName}.js`);
            const Component = module.default;
            
            const componentInstance = new Component(container);
            componentInstance.render();
            
            container.classList.add('lazy-content-loaded');
        } catch (error) {
            console.warn(`Errore nel caricamento componente ${componentName}:`, error);
            container.classList.add('lazy-content-error');
        }
    }
    
    /**
     * Aggiorna osservatori per nuovo contenuto dinamico
     */
    observeNewContent() {
        if (!this.imageObserver) return;
        
        const newImages = document.querySelectorAll('img[data-src]:not(.lazy-observed)');
        const newBgElements = document.querySelectorAll('[data-bg]:not(.lazy-observed)');
        const newContent = document.querySelectorAll('[data-lazy-content]:not(.lazy-observed)');
        
        newImages.forEach(img => {
            img.classList.add('lazy-observed');
            this.imageObserver.observe(img);
        });
        
        newBgElements.forEach(element => {
            element.classList.add('lazy-observed');
            // Assumendo un observer separato per bg images
        });
        
        newContent.forEach(element => {
            element.classList.add('lazy-observed');
            this.contentObserver.observe(element);
        });
    }
    
    /**
     * Distruggi gli osservatori
     */
    destroy() {
        if (this.imageObserver) {
            this.imageObserver.disconnect();
        }
        if (this.contentObserver) {
            this.contentObserver.disconnect();
        }
    }
}

// Inizializza lazy loading al caricamento DOM
document.addEventListener('DOMContentLoaded', () => {
    window.lazyLoader = new LazyLoader({
        rootMargin: '100px 0px',
        threshold: 0.01,
        enableDataSaver: true
    });
});

export default LazyLoader;
