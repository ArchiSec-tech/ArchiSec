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
                // Firebase integration for newsletter
                handleNewsletterSignup(email, this);
            }
        });
    }
    
    // Comments functionality
    initializeCommentsSystem();
    
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

// Handle newsletter signup with Firebase
async function handleNewsletterSignup(email, form) {
    try {
        // Wait for Firebase to be ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const dbInstance = window.db;
        if (dbInstance) {
            await dbInstance.collection('newsletter_subscriptions').add({
                email: email,
                subscribedAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active',
                source: 'blog_page'
            });
        }
        
        alert('Grazie per la tua iscrizione! Ti invieremo i migliori contenuti sulla cybersecurity.');
        form.reset();
        
    } catch (error) {
        console.error('Newsletter signup error:', error);
        alert('Errore durante l\'iscrizione. Riprova più tardi.');
    }
}

// Initialize comments system with Firebase
function initializeCommentsSystem() {
    const commentsForms = document.querySelectorAll('.comments-form');
    
    commentsForms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const articleId = this.getAttribute('data-article-id');
            const commentText = this.querySelector('textarea').value;
            const authorName = this.querySelector('input[name="name"]')?.value || 'Anonimo';
            const authorEmail = this.querySelector('input[name="email"]')?.value;
            
            try {
                // Wait for Firebase to be ready
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const authInstance = window.auth;
                const dbInstance = window.db;
                const currentUser = authInstance ? authInstance.currentUser : null;
                
                if (dbInstance) {
                    await dbInstance.collection('blog_comments').add({
                        articleId: articleId,
                        comment: commentText,
                        authorName: currentUser ? currentUser.displayName || authorName : authorName,
                        authorEmail: currentUser ? currentUser.email : authorEmail,
                        userId: currentUser ? currentUser.uid : null,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        status: 'pending', // Comments need moderation
                        likes: 0
                    });
                    
                    alert('Commento inviato! Sarà pubblicato dopo la moderazione.');
                    this.reset();
                } else {
                    throw new Error('Database non disponibile');
                }
                
            } catch (error) {
                console.error('Comment submission error:', error);
                alert('Errore durante l\'invio del commento. Riprova più tardi.');
            }
        });
    });
    
    // Load and display existing comments
    loadCommentsForArticles();
}

// Load comments for articles
async function loadCommentsForArticles() {
    try {
        // Wait for Firebase to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const dbInstance = window.db;
        if (!dbInstance) return;
        
        const commentsContainers = document.querySelectorAll('.comments-container');
        
        commentsContainers.forEach(async container => {
            const articleId = container.getAttribute('data-article-id');
            
            try {
                const commentsSnapshot = await dbInstance.collection('blog_comments')
                    .where('articleId', '==', articleId)
                    .where('status', '==', 'approved')
                    .orderBy('createdAt', 'desc')
                    .limit(10)
                    .get();
                    
                const commentsHTML = [];
                commentsSnapshot.forEach(doc => {
                    const comment = doc.data();
                    const date = comment.createdAt ? comment.createdAt.toDate().toLocaleDateString('it-IT') : 'Data non disponibile';
                    
                    commentsHTML.push(`
                        <div class="comment">
                            <div class="comment-header">
                                <strong>${comment.authorName}</strong>
                                <span class="comment-date">${date}</span>
                            </div>
                            <div class="comment-text">${comment.comment}</div>
                        </div>
                    `);
                });
                
                if (commentsHTML.length > 0) {
                    container.innerHTML = `
                        <h4>Commenti (${commentsHTML.length})</h4>
                        <div class="comments-list">
                            ${commentsHTML.join('')}
                        </div>
                    `;
                } else {
                    container.innerHTML = '<p>Nessun commento ancora. Sii il primo a commentare!</p>';
                }
                
            } catch (error) {
                console.error('Error loading comments for article:', articleId, error);
            }
        });
        
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}
