/**
 * SPA Router - ArchiTech
 * Sistema di navigazione SPA per esperienza fluida senza reload
 */

class SPARouter {
    constructor(options = {}) {
        this.routes = new Map();
        this.middleware = [];
        this.currentRoute = null;
        this.previousRoute = null;
        this.isNavigating = false;
        
        this.config = {
            baseUrl: options.baseUrl || '',
            containerSelector: options.containerSelector || 'main',
            transitionDuration: options.transitionDuration || 300,
            cachePages: options.cachePages || true,
            maxCacheSize: options.maxCacheSize || 10,
            enablePreload: options.enablePreload || true,
            scrollToTop: options.scrollToTop || true,
            updateTitle: options.updateTitle || true,
            trackAnalytics: options.trackAnalytics || true,
            ...options
        };

        this.cache = new Map();
        this.loadingStates = new Map();
        this.preloadQueue = new Set();

        this.initialize();
    }

    /**
     * Inizializza il router SPA
     */
    initialize() {
        // Impedisce comportamento default dei link
        document.addEventListener('click', (e) => {
            this.handleLinkClick(e);
        });

        // Gestisce back/forward del browser
        window.addEventListener('popstate', (e) => {
            this.handlePopState(e);
        });

        // Registra route automaticamente dai link esistenti
        this.autoRegisterRoutes();

        // Preload delle pagine linkate
        if (this.config.enablePreload) {
            this.setupPreloading();
        }

        // Gestisce la route corrente
        this.handleInitialRoute();

        console.log('SPA Router inizializzato');
    }

    /**
     * Registra una route
     */
    route(path, handler) {
        // Normalizza il path
        const normalizedPath = this.normalizePath(path);
        
        this.routes.set(normalizedPath, {
            path: normalizedPath,
            handler: handler,
            pattern: this.createRoutePattern(normalizedPath),
            params: this.extractParams(normalizedPath)
        });

        return this;
    }

    /**
     * Aggiunge middleware
     */
    use(middleware) {
        this.middleware.push(middleware);
        return this;
    }

    /**
     * Naviga verso una route
     */
    async navigate(path, state = {}, replace = false) {
        if (this.isNavigating) return;

        const targetPath = this.normalizePath(path);
        const currentPath = this.getCurrentPath();

        // Non navigare se siamo già sulla stessa pagina
        if (targetPath === currentPath && !state.force) {
            return;
        }

        this.isNavigating = true;

        try {
            // Esegue middleware
            const middlewareResult = await this.runMiddleware(targetPath, state);
            if (middlewareResult === false) {
                this.isNavigating = false;
                return false;
            }

            // Aggiorna la history
            if (replace) {
                history.replaceState(state, '', this.config.baseUrl + targetPath);
            } else {
                history.pushState(state, '', this.config.baseUrl + targetPath);
            }

            // Esegue la navigazione
            await this.executeRoute(targetPath, state);

            return true;

        } catch (error) {
            console.error('Errore durante la navigazione:', error);
            this.handleNavigationError(error, targetPath);
            return false;
        } finally {
            this.isNavigating = false;
        }
    }

    /**
     * Gestisce i click sui link
     */
    handleLinkClick(event) {
        const link = event.target.closest('a');
        
        if (!link || 
            link.target === '_blank' ||
            link.hasAttribute('download') ||
            link.href.startsWith('mailto:') ||
            link.href.startsWith('tel:') ||
            link.hostname !== window.location.hostname ||
            event.ctrlKey || event.metaKey || event.shiftKey ||
            link.dataset.external !== undefined) {
            return;
        }

        event.preventDefault();
        
        const path = this.getPathFromUrl(link.href);
        this.navigate(path);
    }

    /**
     * Gestisce popstate (back/forward)
     */
    async handlePopState(event) {
        const path = this.getCurrentPath();
        const state = event.state || {};
        
        await this.executeRoute(path, state, true);
    }

    /**
     * Gestisce la route iniziale
     */
    handleInitialRoute() {
        const currentPath = this.getCurrentPath();
        this.executeRoute(currentPath, history.state || {}, true);
    }

    /**
     * Esegue una route
     */
    async executeRoute(path, state = {}, isPopState = false) {
        const route = this.findRoute(path);
        
        if (!route) {
            this.handle404(path);
            return;
        }

        // Aggiorna stato del router
        this.previousRoute = this.currentRoute;
        this.currentRoute = {
            path: path,
            route: route,
            params: this.extractRouteParams(route, path),
            query: this.parseQuery(),
            state: state,
            isPopState: isPopState
        };

        // Mostra loading se necessario
        this.showLoadingState();

        try {
            let content = null;

            // Controlla cache
            if (this.config.cachePages && this.cache.has(path)) {
                content = this.cache.get(path);
            } else if (typeof route.handler === 'function') {
                // Handler personalizzato
                content = await route.handler(this.currentRoute);
            } else {
                // Carica contenuto via AJAX
                content = await this.loadPageContent(path);
            }

            // Renderizza contenuto
            await this.renderContent(content);

            // Analytics
            if (this.config.trackAnalytics && window.analytics) {
                window.analytics.page(path, document.title);
            }

            // Scroll management
            if (this.config.scrollToTop && !isPopState) {
                this.scrollToTop();
            } else if (isPopState && state.scrollPosition) {
                window.scrollTo(0, state.scrollPosition);
            }

        } catch (error) {
            console.error('Errore esecuzione route:', error);
            this.handleRouteError(error, path);
        } finally {
            this.hideLoadingState();
        }
    }

    /**
     * Carica contenuto di una pagina via AJAX
     */
    async loadPageContent(path) {
        // Controlla se già in caricamento
        if (this.loadingStates.has(path)) {
            return this.loadingStates.get(path);
        }

        const loadPromise = this.fetchPageContent(path);
        this.loadingStates.set(path, loadPromise);

        try {
            const content = await loadPromise;
            
            // Aggiungi alla cache
            if (this.config.cachePages) {
                this.addToCache(path, content);
            }

            return content;

        } finally {
            this.loadingStates.delete(path);
        }
    }

    /**
     * Effettua il fetch del contenuto
     */
    async fetchPageContent(path) {
        const response = await fetch(path, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'text/html,application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            // Risposta JSON strutturata
            const data = await response.json();
            return {
                html: data.html || data.content,
                title: data.title,
                meta: data.meta || {},
                scripts: data.scripts || [],
                styles: data.styles || []
            };
        } else {
            // HTML completo - estrai parti rilevanti
            const html = await response.text();
            return this.parseHTMLContent(html);
        }
    }

    /**
     * Analizza contenuto HTML completo
     */
    parseHTMLContent(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Estrai contenuto principale
        const mainContent = doc.querySelector(this.config.containerSelector) || 
                          doc.querySelector('main') || 
                          doc.body;

        // Estrai metadati
        const title = doc.querySelector('title')?.textContent || '';
        const metaTags = Array.from(doc.querySelectorAll('meta')).reduce((meta, tag) => {
            const name = tag.getAttribute('name') || tag.getAttribute('property');
            if (name) {
                meta[name] = tag.getAttribute('content');
            }
            return meta;
        }, {});

        // Estrai scripts e styles specifici della pagina
        const scripts = Array.from(doc.querySelectorAll('script[src]')).map(script => ({
            src: script.src,
            async: script.async,
            defer: script.defer
        }));

        const styles = Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).map(link => ({
            href: link.href,
            media: link.media || 'all'
        }));

        return {
            html: mainContent ? mainContent.innerHTML : html,
            title: title,
            meta: metaTags,
            scripts: scripts,
            styles: styles
        };
    }

    /**
     * Renderizza il contenuto nella pagina
     */
    async renderContent(content) {
        const container = document.querySelector(this.config.containerSelector);
        if (!container) {
            throw new Error(`Container ${this.config.containerSelector} non trovato`);
        }

        // Salva posizione scroll per back navigation
        if (history.state) {
            history.replaceState({
                ...history.state,
                scrollPosition: window.scrollY
            }, document.title);
        }

        // Animazione di transizione out
        await this.transitionOut(container);

        // Aggiorna contenuto
        if (typeof content === 'string') {
            container.innerHTML = content;
        } else {
            container.innerHTML = content.html || content;
            
            // Aggiorna title
            if (content.title && this.config.updateTitle) {
                document.title = content.title;
            }

            // Aggiorna meta tags
            if (content.meta) {
                this.updateMetaTags(content.meta);
            }

            // Carica scripts necessari
            if (content.scripts) {
                await this.loadScripts(content.scripts);
            }

            // Carica styles necessari
            if (content.styles) {
                await this.loadStyles(content.styles);
            }
        }

        // Re-inizializza componenti JavaScript
        this.reinitializeComponents(container);

        // Animazione di transizione in
        await this.transitionIn(container);

        // Evento di route completata
        this.dispatchRouteEvent('routeChanged', {
            route: this.currentRoute,
            previousRoute: this.previousRoute,
            container: container
        });
    }

    /**
     * Animazioni di transizione
     */
    async transitionOut(container) {
        return new Promise(resolve => {
            container.style.opacity = '0';
            container.style.transform = 'translateY(20px)';
            container.style.transition = `all ${this.config.transitionDuration}ms ease`;
            
            setTimeout(resolve, this.config.transitionDuration);
        });
    }

    async transitionIn(container) {
        return new Promise(resolve => {
            // Force reflow
            container.offsetHeight;
            
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
            
            setTimeout(() => {
                container.style.transition = '';
                resolve();
            }, this.config.transitionDuration);
        });
    }

    /**
     * Re-inizializza componenti JavaScript dopo il cambio di contenuto
     */
    reinitializeComponents(container) {
        // Re-registra form handler
        if (window.formHandler) {
            const forms = container.querySelectorAll('form');
            forms.forEach(form => {
                window.formHandler.registerForm(form);
            });
        }

        // Re-inizializza lazy loading
        if (window.lazyLoader) {
            window.lazyLoader.observe();
        }

        // Re-inizializza altri componenti
        if (window.enhancedNavigation) {
            window.enhancedNavigation.initializeTabsInContainer(container);
        }

        // Event personalizzato per altri script
        container.dispatchEvent(new CustomEvent('contentLoaded', {
            detail: { route: this.currentRoute }
        }));
    }

    /**
     * Carica scripts dinamicamente
     */
    async loadScripts(scripts) {
        const promises = scripts.map(script => {
            return new Promise((resolve, reject) => {
                // Controlla se lo script è già caricato
                if (document.querySelector(`script[src="${script.src}"]`)) {
                    resolve();
                    return;
                }

                const scriptTag = document.createElement('script');
                scriptTag.src = script.src;
                scriptTag.async = script.async || false;
                scriptTag.defer = script.defer || false;
                scriptTag.onload = resolve;
                scriptTag.onerror = reject;
                
                document.head.appendChild(scriptTag);
            });
        });

        await Promise.all(promises);
    }

    /**
     * Carica styles dinamicamente
     */
    async loadStyles(styles) {
        const promises = styles.map(style => {
            return new Promise((resolve) => {
                // Controlla se lo style è già caricato
                if (document.querySelector(`link[href="${style.href}"]`)) {
                    resolve();
                    return;
                }

                const linkTag = document.createElement('link');
                linkTag.rel = 'stylesheet';
                linkTag.href = style.href;
                linkTag.media = style.media || 'all';
                linkTag.onload = resolve;
                linkTag.onerror = resolve; // Non bloccare per errori CSS
                
                document.head.appendChild(linkTag);
            });
        });

        await Promise.all(promises);
    }

    /**
     * Aggiorna meta tags
     */
    updateMetaTags(metaData) {
        Object.entries(metaData).forEach(([name, content]) => {
            let metaTag = document.querySelector(`meta[name="${name}"]`) ||
                         document.querySelector(`meta[property="${name}"]`);
            
            if (metaTag) {
                metaTag.setAttribute('content', content);
            } else {
                metaTag = document.createElement('meta');
                metaTag.setAttribute('name', name);
                metaTag.setAttribute('content', content);
                document.head.appendChild(metaTag);
            }
        });
    }

    /**
     * Setup preloading delle pagine
     */
    setupPreloading() {
        // Intersection Observer per preload quando i link entrano nel viewport
        const preloadObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const link = entry.target;
                    const path = this.getPathFromUrl(link.href);
                    this.preloadPage(path);
                    preloadObserver.unobserve(link);
                }
            });
        }, { rootMargin: '100px' });

        // Osserva tutti i link interni
        document.querySelectorAll('a[href]').forEach(link => {
            if (this.isInternalLink(link)) {
                preloadObserver.observe(link);
            }
        });

        // Preload on hover
        document.addEventListener('mouseenter', (e) => {
            const link = e.target.closest('a');
            if (link && this.isInternalLink(link)) {
                const path = this.getPathFromUrl(link.href);
                this.preloadPage(path);
            }
        }, true);
    }

    /**
     * Preload di una pagina
     */
    async preloadPage(path) {
        if (this.cache.has(path) || this.preloadQueue.has(path) || this.loadingStates.has(path)) {
            return;
        }

        this.preloadQueue.add(path);

        try {
            await this.loadPageContent(path);
        } catch (error) {
            console.warn('Errore preload pagina:', path, error);
        } finally {
            this.preloadQueue.delete(path);
        }
    }

    /**
     * Gestione cache
     */
    addToCache(path, content) {
        // Rimuovi elementi più vecchi se necessario
        if (this.cache.size >= this.config.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(path, content);
    }

    clearCache() {
        this.cache.clear();
    }

    /**
     * Auto-registrazione delle route dai link esistenti
     */
    autoRegisterRoutes() {
        document.querySelectorAll('a[href]').forEach(link => {
            if (this.isInternalLink(link)) {
                const path = this.getPathFromUrl(link.href);
                if (!this.routes.has(path)) {
                    this.route(path, null); // Handler di default (AJAX)
                }
            }
        });
    }

    /**
     * Middleware execution
     */
    async runMiddleware(path, state) {
        for (const middleware of this.middleware) {
            try {
                const result = await middleware(path, state, this.currentRoute);
                if (result === false) {
                    return false;
                }
            } catch (error) {
                console.error('Errore middleware:', error);
                return false;
            }
        }
        return true;
    }

    /**
     * Utility functions
     */
    normalizePath(path) {
        return path.replace(this.config.baseUrl, '').replace(/\/$/, '') || '/';
    }

    getCurrentPath() {
        return this.normalizePath(window.location.pathname);
    }

    getPathFromUrl(url) {
        try {
            const urlObj = new URL(url);
            return this.normalizePath(urlObj.pathname);
        } catch {
            return this.normalizePath(url);
        }
    }

    isInternalLink(link) {
        return link.hostname === window.location.hostname && 
               !link.hasAttribute('data-external') &&
               !link.href.startsWith('javascript:') &&
               !link.href.startsWith('#');
    }

    findRoute(path) {
        return this.routes.get(path);
    }

    createRoutePattern(path) {
        return new RegExp('^' + path.replace(/:\w+/g, '([^/]+)') + '$');
    }

    extractParams(path) {
        const params = [];
        const matches = path.match(/:(\w+)/g);
        if (matches) {
            matches.forEach(match => {
                params.push(match.slice(1));
            });
        }
        return params;
    }

    extractRouteParams(route, path) {
        const params = {};
        const matches = path.match(route.pattern);
        if (matches && route.params) {
            route.params.forEach((param, index) => {
                params[param] = matches[index + 1];
            });
        }
        return params;
    }

    parseQuery() {
        return Object.fromEntries(new URLSearchParams(window.location.search));
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    showLoadingState() {
        document.body.classList.add('spa-loading');
        
        // Crea indicatore di caricamento se non esiste
        if (!document.querySelector('.spa-loading-indicator')) {
            const loader = document.createElement('div');
            loader.className = 'spa-loading-indicator';
            loader.innerHTML = '<div class="spinner"></div>';
            document.body.appendChild(loader);
        }
    }

    hideLoadingState() {
        document.body.classList.remove('spa-loading');
    }

    handle404(path) {
        if (window.feedbackSystem) {
            window.feedbackSystem.showNotification(`Pagina non trovata: ${path}`, 'error');
        }
        
        // Reindirizza alla home o pagina 404
        this.navigate('/', {}, true);
    }

    handleNavigationError(error, path) {
        console.error(`Errore navigazione verso ${path}:`, error);
        
        if (window.feedbackSystem) {
            window.feedbackSystem.showNotification('Errore durante la navigazione', 'error');
        }
    }

    handleRouteError(error, path) {
        console.error(`Errore route ${path}:`, error);
        
        // Fallback: reload della pagina
        window.location.href = path;
    }

    dispatchRouteEvent(eventName, detail) {
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }

    /**
     * API pubblica
     */

    // Naviga verso una route
    push(path, state) {
        return this.navigate(path, state, false);
    }

    // Sostituisce la route corrente
    replace(path, state) {
        return this.navigate(path, state, true);
    }

    // Torna indietro nella history
    back() {
        history.back();
    }

    // Va avanti nella history
    forward() {
        history.forward();
    }

    // Ottieni route corrente
    getCurrentRoute() {
        return this.currentRoute;
    }

    // Ottieni route precedente
    getPreviousRoute() {
        return this.previousRoute;
    }

    // Controlla se è possibile tornare indietro
    canGoBack() {
        return window.history.length > 1;
    }

    // Refresh della route corrente
    refresh() {
        const currentPath = this.getCurrentPath();
        this.cache.delete(currentPath);
        return this.navigate(currentPath, { force: true }, true);
    }
}

export default SPARouter;
