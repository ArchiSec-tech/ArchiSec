// ArchiSec - Main JavaScript (Production Version)
// Versione semplificata senza Firebase per deployment sicuro

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 ArchiSec - Produzione caricato');

    // Navigation dropdown functionality
    const dropdown = document.querySelector('.nav-dropdown');
    const dropdownTrigger = dropdown?.querySelector('.dropdown-trigger');
    const dropdownMenu = dropdown?.querySelector('.dropdown-menu');
    
    if (dropdown && dropdownTrigger) {
        // Toggle dropdown on click
        dropdownTrigger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    }

    // Scroll effects for header
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.site-header');
        const currentScrollY = window.scrollY;
        
        if (!header) return;
        
        // Background opacity based on scroll
        if (currentScrollY > 50) {
            header.style.background = 'rgba(10, 10, 10, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(255, 107, 53, 0.1)';
        } else {
            header.style.background = 'rgba(10, 10, 10, 0.95)';
            header.style.boxShadow = 'none';
        }
        
        lastScrollY = currentScrollY;
    }, { passive: true });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Intersection Observer per animazioni fade-in
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Aggiungi un piccolo delay basato sull'indice
                setTimeout(() => {
                    entry.target.classList.add('animate-fade-in-up');
                }, index * 100);
                
                // Smetti di osservare una volta che l'elemento è animato
                fadeInObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Osserva tutti gli elementi che devono fare fade-in
    const elementsToAnimate = [
        '.service-card',
        '.stat-card',
        '.hero-text',
        '.section-header'
    ];

    elementsToAnimate.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            fadeInObserver.observe(el);
        });
    });

    // Gestione del pulsante Sign Up per versione produzione
    const signupButton = document.getElementById('signupButton');
    if (signupButton) {
        console.log('✅ Pulsante Sign Up collegato');
        
        signupButton.addEventListener('click', function(e) {
            e.preventDefault();
            showProductionMessage();
        });
    }

    // Loading states per pulsanti
    function addLoadingState(button) {
        const originalText = button.textContent;
        button.textContent = 'Loading...';
        button.disabled = true;
        button.classList.add('loading');
        
        return function removeLoadingState() {
            button.textContent = originalText;
            button.disabled = false;
            button.classList.remove('loading');
        };
    }

    // Mostra messaggio per versione produzione
    function showProductionMessage() {
        // Crea un modal personalizzato
        const modal = document.createElement('div');
        modal.className = 'production-modal';
        modal.innerHTML = `
            <div class="production-modal-content">
                <div class="production-modal-header">
                    <h3>🚀 ArchiSec</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="production-modal-body">
                    <p>Benvenuto in ArchiSec! 🛡️</p>
                    <p>La registrazione utenti è temporaneamente disabilitata per questo deploy di demonstrazione.</p>
                    <p>Per accedere ai nostri servizi professionali:</p>
                    <ul>
                        <li>📧 Contattaci: <strong>info@archisec.tech</strong></li>
                        <li>💬 Richiedi una consulenza gratuita</li>
                        <li>📞 Chiamaci per un preventivo personalizzato</li>
                    </ul>
                </div>
                <div class="production-modal-footer">
                    <a href="contattaci.html" class="btn btn-primary">Contattaci Ora</a>
                    <button class="btn btn-outline close-modal">Chiudi</button>
                </div>
            </div>
        `;

        // Aggiungi stili per il modal
        if (!document.getElementById('production-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'production-modal-styles';
            styles.textContent = `
                .production-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    animation: fadeIn 0.3s ease;
                }
                
                .production-modal-content {
                    background: var(--card-bg, #1a1a1a);
                    border-radius: 12px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 40px rgba(255, 107, 53, 0.2);
                    border: 1px solid var(--accent-primary, #ff6b35);
                }
                
                .production-modal-header {
                    padding: 20px;
                    border-bottom: 1px solid rgba(255, 107, 53, 0.2);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .production-modal-header h3 {
                    margin: 0;
                    color: var(--accent-primary, #ff6b35);
                    font-size: 1.5rem;
                }
                
                .close-modal {
                    background: none;
                    border: none;
                    font-size: 24px;
                    color: var(--text-secondary, #666);
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .close-modal:hover {
                    color: var(--accent-primary, #ff6b35);
                }
                
                .production-modal-body {
                    padding: 20px;
                    color: var(--text-primary, #fff);
                }
                
                .production-modal-body ul {
                    margin: 15px 0;
                    padding-left: 20px;
                }
                
                .production-modal-body li {
                    margin: 8px 0;
                    color: var(--text-secondary, #ccc);
                }
                
                .production-modal-footer {
                    padding: 20px;
                    border-top: 1px solid rgba(255, 107, 53, 0.2);
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(modal);

        // Gestisci la chiusura del modal
        const closeButtons = modal.querySelectorAll('.close-modal');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modal.remove();
            });
        });

        // Chiudi cliccando fuori
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Chiudi con ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    // Performance monitoring semplificato
    if ('performance' in window) {
        window.addEventListener('load', function() {
            setTimeout(() => {
                const perfData = performance.timing;
                const loadTime = perfData.loadEventEnd - perfData.navigationStart;
                console.log(`⚡ Pagina caricata in ${loadTime}ms`);
                
                // Log delle risorse caricate
                const resources = performance.getEntriesByType('resource');
                console.log(`📦 Risorse caricate: ${resources.length}`);
            }, 100);
        });
    }

    console.log('✅ ArchiSec JavaScript inizializzato - Versione Produzione');
});

// Utility functions
window.ArchiSec = {
    // Funzione per mostrare notifiche
    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            background: type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3',
            color: 'white',
            zIndex: '10001',
            animation: 'slideIn 0.3s ease'
        });
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
};
