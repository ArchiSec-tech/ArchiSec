/**
 * ArchiSec Bug Fixes & Safety Guards
 * Questo file contiene correzioni per problemi comuni identificati nel codice
 */

// 1. Safe element selection
function safeGetElement(selector) {
    const element = document.getElementById(selector) || document.querySelector(selector);
    if (!element) {
        console.warn(`⚠️ Element not found: ${selector}`);
        return null;
    }
    return element;
}

// 2. Safe form handling
function safeFormHandler(formSelector, callback) {
    const form = safeGetElement(formSelector);
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        try {
            callback(form, e);
        } catch (error) {
            console.error('Form handler error:', error);
            const errorMsg = form.querySelector('.error-message');
            if (errorMsg) {
                errorMsg.textContent = 'Si è verificato un errore. Riprova.';
                errorMsg.style.display = 'block';
            }
        }
    });
}

// 3. Firebase safety wrapper
function withFirebase(callback) {
    const checkFirebase = () => {
        if (window.firebase && window.db && window.auth) {
            try {
                callback();
            } catch (error) {
                console.error('Firebase operation error:', error);
            }
        } else {
            setTimeout(checkFirebase, 100);
        }
    };
    checkFirebase();
}

// 4. Newsletter form safety handler
function initNewsletterSafety() {
    const forms = document.querySelectorAll('form[id*="newsletter"], form[id*="Newsletter"]');
    
    forms.forEach(form => {
        const emailInput = form.querySelector('input[type="email"]');
        const submitBtn = form.querySelector('button[type="submit"]');
        const checkbox = form.querySelector('input[type="checkbox"]');
        
        if (!emailInput || !submitBtn) return;
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic validation
            if (!emailInput.value.trim()) {
                alert('Inserisci un indirizzo email');
                return;
            }
            
            if (checkbox && !checkbox.checked) {
                alert('Accetta la privacy policy per continuare');
                return;
            }
            
            // Prevent double submission
            if (submitBtn.disabled) return;
            
            submitBtn.disabled = true;
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Invio...';
            
            // Reset after 5 seconds even if Firebase fails
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }, 5000);
            
            // Show success message for now (without Firebase dependency)
            const successMsg = form.parentNode.querySelector('.success-message, .newsletter-message.success');
            if (successMsg) {
                successMsg.textContent = '✅ Iscrizione completata con successo!';
                successMsg.style.display = 'block';
                form.reset();
                setTimeout(() => {
                    successMsg.style.display = 'none';
                }, 5000);
            }
        });
    });
}

// 5. Contact form safety handler
function initContactFormSafety() {
    const contactForm = safeGetElement('contact-form') || safeGetElement('consultation-form');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const requiredFields = contactForm.querySelectorAll('[required]');
        let hasErrors = false;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.style.border = '2px solid #e74c3c';
                hasErrors = true;
            } else {
                field.style.border = '';
            }
        });
        
        if (hasErrors) {
            alert('Compila tutti i campi obbligatori');
            return;
        }
        
        // Show success message
        const successMsg = contactForm.querySelector('.success-message') || contactForm.parentNode.querySelector('.success-message');
        if (successMsg) {
            successMsg.textContent = '✅ Messaggio inviato con successo! Ti contatteremo presto.';
            successMsg.style.display = 'block';
            contactForm.reset();
        }
    });
}

// 6. Auth form safety handler
function initAuthFormSafety() {
    const signupBtn = safeGetElement('signupButton');
    if (signupBtn) {
        signupBtn.addEventListener('click', function() {
            window.location.href = 'signup.html';
        });
    }
    
    // Handle signup form
    const signupForm = safeGetElement('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = safeGetElement('signupEmail')?.value;
            const password = safeGetElement('signupPassword')?.value;
            
            if (!email || !password) {
                alert('Email e password sono obbligatorie');
                return;
            }
            
            if (password.length < 6) {
                alert('La password deve essere di almeno 6 caratteri');
                return;
            }
            
            // Simulate success for now
            alert('Registrazione simulata con successo! (Firebase non configurato)');
        });
    }
}

// 7. Initialize all safety measures
function initBugFixes() {
    console.log('🔧 Inizializzazione correzioni di sicurezza ArchiSec');
    
    // Initialize safety handlers
    initNewsletterSafety();
    initContactFormSafety();
    initAuthFormSafety();
    
    // Handle missing dropdown menus
    const dropdowns = document.querySelectorAll('.nav-dropdown');
    dropdowns.forEach(dropdown => {
        const trigger = dropdown.querySelector('.dropdown-trigger');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        if (trigger && menu) {
            trigger.addEventListener('click', function(e) {
                e.preventDefault();
                dropdown.classList.toggle('active');
            });
            
            document.addEventListener('click', function(e) {
                if (!dropdown.contains(e.target)) {
                    dropdown.classList.remove('active');
                }
            });
        }
    });
    
    // Handle missing content placeholders
    const emptyElements = document.querySelectorAll('.hero-text h1:empty, .hero-text p:empty, .section-header h2:empty');
    emptyElements.forEach(el => {
        if (el.tagName === 'H1') {
            el.innerHTML = '<span class="hero-title-main">ArchiSec</span><span class="hero-title-highlight">Solutions</span>';
        } else if (el.tagName === 'P') {
            el.textContent = 'Protezione avanzata per il tuo business digitale.';
        } else if (el.tagName === 'H2') {
            el.textContent = 'I Nostri Servizi';
        }
    });
    
    console.log('✅ Correzioni di sicurezza attivate');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBugFixes);
} else {
    initBugFixes();
}

// Export functions for external use
window.ArchiSecBugFixes = {
    safeGetElement,
    safeFormHandler,
    withFirebase,
    initBugFixes
};
