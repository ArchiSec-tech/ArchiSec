/**
 * Enhanced Navigation System
 * Sistema di navigazione a schede per sezioni servizi con transizioni fluide
 * Mantiene coerenza con design esistente ArchiTech
 */

class EnhancedNavigation {
    constructor(options = {}) {
        this.options = {
            transitionDuration: 300,
            enableKeyboardNav: true,
            enableSwipeGestures: true,
            autoCollapseOnMobile: true,
            activeClass: 'nav-active',
            ...options
        };
        
        this.currentTab = null;
        this.tabContainers = new Map();
        this.touchStartX = 0;
        this.touchStartY = 0;
        
        this.init();
    }
    
    init() {
        this.setupTabNavigation();
        this.setupDropdownEnhancements();
        this.setupMobileOptimizations();
        this.setupAccessibility();
        
        if (this.options.enableSwipeGestures) {
            this.setupSwipeGestures();
        }
    }
    
    /**
     * Configura sistema di navigazione a schede
     */
    setupTabNavigation() {
        const tabGroups = document.querySelectorAll('[data-tab-group]');
        
        tabGroups.forEach(group => {
            const groupId = group.getAttribute('data-tab-group');
            const tabs = group.querySelectorAll('[data-tab]');
            const panels = group.querySelectorAll('[data-tab-panel]');
            
            if (tabs.length === 0 || panels.length === 0) return;
            
            // Registra gruppo di tab
            this.tabContainers.set(groupId, {
                group,
                tabs: Array.from(tabs),
                panels: Array.from(panels),
                activeIndex: 0
            });
            
            // Configura tab
            tabs.forEach((tab, index) => {
                this.setupTab(tab, index, groupId);
            });
            
            // Configura pannelli
            panels.forEach((panel, index) => {
                this.setupTabPanel(panel, index, groupId);
            });
            
            // Attiva primo tab di default
            this.activateTab(groupId, 0, false);
        });
    }
    
    /**
     * Configura singolo tab
     */
    setupTab(tab, index, groupId) {
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('tabindex', '-1');
        tab.setAttribute('data-tab-index', index);
        
        // Event listeners
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            this.activateTab(groupId, index);
        });
        
        if (this.options.enableKeyboardNav) {
            tab.addEventListener('keydown', (e) => {
                this.handleTabKeydown(e, groupId, index);
            });
        }
        
        // Hover effects per desktop
        if (!this.isMobileDevice()) {
            tab.addEventListener('mouseenter', () => {
                this.previewTab(groupId, index);
            });
            
            tab.addEventListener('mouseleave', () => {
                this.cancelPreview(groupId);
            });
        }
    }
    
    /**
     * Configura pannello tab
     */
    setupTabPanel(panel, index, groupId) {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-hidden', 'true');
        panel.setAttribute('data-panel-index', index);
        panel.style.display = 'none';
    }
    
    /**
     * Attiva tab specificato
     */
    activateTab(groupId, targetIndex, animate = true) {
        const container = this.tabContainers.get(groupId);
        if (!container) return;
        
        const { tabs, panels, activeIndex } = container;
        
        // Previeni attivazione dello stesso tab
        if (activeIndex === targetIndex && animate) return;
        
        // Deattiva tab corrente
        if (activeIndex !== -1) {
            const currentTab = tabs[activeIndex];
            const currentPanel = panels[activeIndex];
            
            currentTab.classList.remove(this.options.activeClass);
            currentTab.setAttribute('aria-selected', 'false');
            currentTab.setAttribute('tabindex', '-1');
            
            if (animate) {
                this.hidePanel(currentPanel).then(() => {
                    this.showPanel(panels[targetIndex]);
                });
            } else {
                currentPanel.style.display = 'none';
                currentPanel.setAttribute('aria-hidden', 'true');
            }
        }
        
        // Attiva nuovo tab
        const newTab = tabs[targetIndex];
        const newPanel = panels[targetIndex];
        
        newTab.classList.add(this.options.activeClass);
        newTab.setAttribute('aria-selected', 'true');
        newTab.setAttribute('tabindex', '0');
        newTab.focus();
        
        if (!animate) {
            newPanel.style.display = 'block';
            newPanel.setAttribute('aria-hidden', 'false');
        }
        
        // Aggiorna stato container
        container.activeIndex = targetIndex;
        
        // Trigger evento personalizzato
        this.dispatchTabChangeEvent(groupId, targetIndex, activeIndex);
    }
    
    /**
     * Nascondi pannello con animazione
     */
    hidePanel(panel) {
        return new Promise(resolve => {
            panel.style.transition = `opacity ${this.options.transitionDuration}ms ease-out`;
            panel.style.opacity = '0';
            
            setTimeout(() => {
                panel.style.display = 'none';
                panel.setAttribute('aria-hidden', 'true');
                panel.style.opacity = '';
                panel.style.transition = '';
                resolve();
            }, this.options.transitionDuration);
        });
    }
    
    /**
     * Mostra pannello con animazione
     */
    showPanel(panel) {
        panel.style.display = 'block';
        panel.style.opacity = '0';
        panel.setAttribute('aria-hidden', 'false');
        
        // Force reflow
        panel.offsetHeight;
        
        panel.style.transition = `opacity ${this.options.transitionDuration}ms ease-in`;
        panel.style.opacity = '1';
        
        setTimeout(() => {
            panel.style.opacity = '';
            panel.style.transition = '';
        }, this.options.transitionDuration);
    }
    
    /**
     * Gestisce navigazione da tastiera per tab
     */
    handleTabKeydown(event, groupId, currentIndex) {
        const container = this.tabContainers.get(groupId);
        if (!container) return;
        
        const { tabs } = container;
        let targetIndex = currentIndex;
        
        switch (event.key) {
            case 'ArrowRight':
                event.preventDefault();
                targetIndex = (currentIndex + 1) % tabs.length;
                break;
                
            case 'ArrowLeft':
                event.preventDefault();
                targetIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                break;
                
            case 'Home':
                event.preventDefault();
                targetIndex = 0;
                break;
                
            case 'End':
                event.preventDefault();
                targetIndex = tabs.length - 1;
                break;
                
            case 'Enter':
            case ' ':
                event.preventDefault();
                this.activateTab(groupId, currentIndex);
                return;
                
            default:
                return;
        }
        
        tabs[targetIndex].focus();
    }
    
    /**
     * Preview tab al hover (desktop)
     */
    previewTab(groupId, index) {
        if (this.isMobileDevice()) return;
        
        const container = this.tabContainers.get(groupId);
        if (!container || container.activeIndex === index) return;
        
        const tab = container.tabs[index];
        tab.classList.add('tab-preview');
        
        // Mostra preview del contenuto dopo delay
        clearTimeout(this.previewTimeout);
        this.previewTimeout = setTimeout(() => {
            this.showContentPreview(groupId, index);
        }, 300);
    }
    
    /**
     * Cancella preview tab
     */
    cancelPreview(groupId) {
        clearTimeout(this.previewTimeout);
        
        const container = this.tabContainers.get(groupId);
        if (!container) return;
        
        container.tabs.forEach(tab => {
            tab.classList.remove('tab-preview');
        });
        
        this.hideContentPreview(groupId);
    }
    
    /**
     * Mostra preview contenuto
     */
    showContentPreview(groupId, index) {
        const container = this.tabContainers.get(groupId);
        if (!container) return;
        
        const panel = container.panels[index];
        const previewElement = this.createPreviewElement(panel);
        
        if (previewElement) {
            document.body.appendChild(previewElement);
            
            setTimeout(() => {
                previewElement.classList.add('preview-visible');
            }, 10);
        }
    }
    
    /**
     * Nascondi preview contenuto
     */
    hideContentPreview(groupId) {
        const existingPreview = document.querySelector('.tab-content-preview');
        if (existingPreview) {
            existingPreview.classList.remove('preview-visible');
            setTimeout(() => {
                existingPreview.remove();
            }, 200);
        }
    }
    
    /**
     * Crea elemento preview
     */
    createPreviewElement(panel) {
        const preview = document.createElement('div');
        preview.className = 'tab-content-preview';
        
        // Copia contenuto ridotto del pannello
        const previewContent = panel.textContent.substring(0, 150) + '...';
        preview.innerHTML = `
            <div class="preview-content">
                <p>${previewContent}</p>
            </div>
        `;
        
        return preview;
    }
    
    /**
     * Migliora dropdown esistenti
     */
    setupDropdownEnhancements() {
        const dropdowns = document.querySelectorAll('.nav-dropdown');
        
        dropdowns.forEach(dropdown => {
            this.enhanceDropdown(dropdown);
        });
    }
    
    /**
     * Migliora singolo dropdown
     */
    enhanceDropdown(dropdown) {
        const trigger = dropdown.querySelector('.dropdown-trigger');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        if (!trigger || !menu) return;
        
        // Aggiungi indicatori di caricamento
        trigger.addEventListener('mouseenter', () => {
            if (!dropdown.classList.contains('dropdown-loaded')) {
                this.preloadDropdownContent(dropdown);
            }
        });
        
        // Migliora posizionamento dropdown
        trigger.addEventListener('click', () => {
            this.positionDropdown(dropdown);
        });
        
        // Aggiungi animazioni fluide
        menu.style.transition = 'all 0.2s ease-out';
    }
    
    /**
     * Precarica contenuto dropdown
     */
    preloadDropdownContent(dropdown) {
        const menu = dropdown.querySelector('.dropdown-menu');
        const links = menu.querySelectorAll('a[href]');
        
        // Preload link più probabili
        links.forEach((link, index) => {
            if (index < 3) { // Prime 3 voci
                const prefetchLink = document.createElement('link');
                prefetchLink.rel = 'prefetch';
                prefetchLink.href = link.href;
                document.head.appendChild(prefetchLink);
            }
        });
        
        dropdown.classList.add('dropdown-loaded');
    }
    
    /**
     * Posiziona dropdown intelligentemente
     */
    positionDropdown(dropdown) {
        const menu = dropdown.querySelector('.dropdown-menu');
        const rect = dropdown.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Calcola se c'è spazio sotto
        const spaceBelow = viewportHeight - rect.bottom;
        const menuHeight = menu.offsetHeight || 200; // Stima
        
        if (spaceBelow < menuHeight && rect.top > menuHeight) {
            menu.classList.add('dropdown-above');
        } else {
            menu.classList.remove('dropdown-above');
        }
    }
    
    /**
     * Ottimizzazioni mobile
     */
    setupMobileOptimizations() {
        if (!this.isMobileDevice()) return;
        
        // Collassa automaticamente navigation su mobile
        if (this.options.autoCollapseOnMobile) {
            this.setupMobileCollapse();
        }
        
        // Ottimizza touch targets
        this.optimizeTouchTargets();
    }
    
    /**
     * Setup collasso automatico mobile
     */
    setupMobileCollapse() {
        const nav = document.querySelector('.site-nav');
        if (!nav) return;
        
        // Chiudi nav quando si clicca su un link
        nav.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                const mobileToggle = document.querySelector('.mobile-menu-toggle');
                if (mobileToggle && nav.classList.contains('mobile-open')) {
                    mobileToggle.click();
                }
            }
        });
    }
    
    /**
     * Ottimizza touch targets per mobile
     */
    optimizeTouchTargets() {
        const interactiveElements = document.querySelectorAll('a, button, [data-tab]');
        
        interactiveElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.height < 44) { // Apple guidelines: minimo 44px
                element.style.minHeight = '44px';
                element.style.display = 'flex';
                element.style.alignItems = 'center';
            }
        });
    }
    
    /**
     * Setup gesture swipe per tab
     */
    setupSwipeGestures() {
        this.tabContainers.forEach((container, groupId) => {
            const group = container.group;
            
            group.addEventListener('touchstart', (e) => {
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
            }, { passive: true });
            
            group.addEventListener('touchend', (e) => {
                if (!this.touchStartX || !this.touchStartY) return;
                
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;
                
                const diffX = this.touchStartX - touchEndX;
                const diffY = this.touchStartY - touchEndY;
                
                // Verifica che sia uno swipe orizzontale
                if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                    const currentIndex = container.activeIndex;
                    let targetIndex;
                    
                    if (diffX > 0) {
                        // Swipe left - prossimo tab
                        targetIndex = (currentIndex + 1) % container.tabs.length;
                    } else {
                        // Swipe right - tab precedente
                        targetIndex = (currentIndex - 1 + container.tabs.length) % container.tabs.length;
                    }
                    
                    this.activateTab(groupId, targetIndex);
                }
                
                this.touchStartX = 0;
                this.touchStartY = 0;
            }, { passive: true });
        });
    }
    
    /**
     * Setup accessibility enhancements
     */
    setupAccessibility() {
        // Aggiungi descrizioni ARIA
        this.tabContainers.forEach((container, groupId) => {
            const group = container.group;
            
            // Tab list role
            const tabList = group.querySelector('[role="tablist"]') || 
                           this.createTabList(container.tabs);
            
            // Collega tab ai pannelli
            container.tabs.forEach((tab, index) => {
                const panel = container.panels[index];
                const tabId = `tab-${groupId}-${index}`;
                const panelId = `panel-${groupId}-${index}`;
                
                tab.id = tabId;
                tab.setAttribute('aria-controls', panelId);
                
                panel.id = panelId;
                panel.setAttribute('aria-labelledby', tabId);
            });
        });
    }
    
    /**
     * Crea tab list se non esiste
     */
    createTabList(tabs) {
        const tabList = document.createElement('div');
        tabList.setAttribute('role', 'tablist');
        
        const firstTab = tabs[0];
        if (firstTab && firstTab.parentNode) {
            firstTab.parentNode.insertBefore(tabList, firstTab);
            tabs.forEach(tab => tabList.appendChild(tab));
        }
        
        return tabList;
    }
    
    /**
     * Dispatch evento personalizzato cambio tab
     */
    dispatchTabChangeEvent(groupId, newIndex, oldIndex) {
        const event = new CustomEvent('tabChanged', {
            bubbles: true,
            detail: {
                groupId,
                newIndex,
                oldIndex,
                tab: this.tabContainers.get(groupId).tabs[newIndex],
                panel: this.tabContainers.get(groupId).panels[newIndex]
            }
        });
        
        document.dispatchEvent(event);
    }
    
    /**
     * Rileva dispositivo mobile
     */
    isMobileDevice() {
        return window.innerWidth <= 768 || 
               /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    /**
     * API pubblica per controllo tab programmatico
     */
    switchTab(groupId, index) {
        this.activateTab(groupId, index);
    }
    
    /**
     * Ottieni tab attivo per gruppo
     */
    getActiveTab(groupId) {
        const container = this.tabContainers.get(groupId);
        return container ? container.activeIndex : -1;
    }
    
    /**
     * Aggiungi nuovo tab dinamicamente
     */
    addTab(groupId, tabConfig) {
        const container = this.tabContainers.get(groupId);
        if (!container) return false;
        
        const { tab, panel } = this.createTabElements(tabConfig);
        const index = container.tabs.length;
        
        // Aggiungi agli array
        container.tabs.push(tab);
        container.panels.push(panel);
        
        // Setup nuovo tab
        this.setupTab(tab, index, groupId);
        this.setupTabPanel(panel, index, groupId);
        
        // Inserisci nel DOM
        container.group.appendChild(tab);
        container.group.appendChild(panel);
        
        return true;
    }
    
    /**
     * Crea elementi tab
     */
    createTabElements(config) {
        const tab = document.createElement('button');
        tab.className = 'nav-tab';
        tab.textContent = config.title;
        tab.setAttribute('data-tab', config.id);
        
        const panel = document.createElement('div');
        panel.className = 'tab-panel';
        panel.innerHTML = config.content;
        panel.setAttribute('data-tab-panel', config.id);
        
        return { tab, panel };
    }
    
    /**
     * Rimuovi tab
     */
    removeTab(groupId, index) {
        const container = this.tabContainers.get(groupId);
        if (!container || index >= container.tabs.length) return false;
        
        const tab = container.tabs[index];
        const panel = container.panels[index];
        
        // Rimuovi dal DOM
        tab.remove();
        panel.remove();
        
        // Rimuovi dagli array
        container.tabs.splice(index, 1);
        container.panels.splice(index, 1);
        
        // Aggiusta indice attivo se necessario
        if (container.activeIndex === index) {
            const newIndex = Math.min(container.activeIndex, container.tabs.length - 1);
            this.activateTab(groupId, newIndex);
        } else if (container.activeIndex > index) {
            container.activeIndex--;
        }
        
        return true;
    }
    
    /**
     * Cleanup
     */
    destroy() {
        clearTimeout(this.previewTimeout);
        this.tabContainers.clear();
    }
}

// Auto-inizializza quando DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    window.enhancedNavigation = new EnhancedNavigation({
        transitionDuration: 300,
        enableKeyboardNav: true,
        enableSwipeGestures: true,
        autoCollapseOnMobile: true
    });
});

export default EnhancedNavigation;
