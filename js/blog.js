/**
 * Blog functionality - Filtri articoli e interazioni
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeBlogFilters();
    initializeBlogInteractions();
});

function initializeBlogFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const blogCards = document.querySelectorAll('.blog-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Aggiorna bottoni attivi
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filtra le cards
            blogCards.forEach(card => {
                const category = card.getAttribute('data-category');
                
                if (filter === 'all' || category === filter) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 100);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

function initializeBlogInteractions() {
    // Newsletter form
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            
            if (email) {
                // Simula invio newsletter
                alert('Grazie per la tua iscrizione! Ti invieremo i migliori contenuti sulla cybersecurity.');
                this.reset();
            }
        });
    }
    
    // Smooth scroll per il link "Leggi l'articolo"
    const articleLinks = document.querySelectorAll('a[href^="#"]');
    articleLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start' 
                });
            }
        });
    });
    
    // Animazioni scroll per le cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Osserva le cards del blog
    const cards = document.querySelectorAll('.blog-card, .ai-feature');
    cards.forEach(card => {
        observer.observe(card);
    });
    
    console.log('🗞️ Blog functionality initialized');
}
