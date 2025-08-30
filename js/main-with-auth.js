/**
 * Main JavaScript file per ArchiTech
 * Funzionalità di base senza interferenze con il layout
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('ArchiTech Website caricato');
    
    // Smooth scrolling per i link interni
    const internalLinks = document.querySelectorAll('a[href^="#"]');
    internalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});
