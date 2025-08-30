// auth.js - Gestione autenticazione Firebase

// Variabili globali per i modali
let signupModal = null;
let loginModal = null;

// Inizializzazione quando la pagina è caricata
document.addEventListener('DOMContentLoaded', function() {
    // Controlla lo stato dell'autenticazione
    auth.onAuthStateChanged(user => {
        if (user) {
            // Utente loggato
            console.log('Utente loggato:', user.email);
            updateUIForLoggedInUser(user);
        } else {
            // Utente non loggato
            console.log('Utente non loggato');
            updateUIForLoggedOutUser();
        }
    });

    // Inizializza i modali
    initModals();
});

// Funzione per inizializzare i modali
function initModals() {
    // Crea modal di signup se non esiste
    if (!document.getElementById('signupModal')) {
        createSignupModal();
    }
    
    // Crea modal di login se non esiste
    if (!document.getElementById('loginModal')) {
        createLoginModal();
    }

    // Aggiungi event listeners
    setupEventListeners();
}

// Funzione per creare il modal di signup
function createSignupModal() {
    const modalHTML = `
        <div id="signupModal" class="auth-modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Registrati</h2>
                    <span class="close" onclick="closeSignupModal()">&times;</span>
                </div>
                <form id="signupForm" class="auth-form">
                    <div class="form-group">
                        <label for="signupName">Nome Completo</label>
                        <input type="text" id="signupName" required>
                    </div>
                    <div class="form-group">
                        <label for="signupEmail">Email</label>
                        <input type="email" id="signupEmail" required>
                    </div>
                    <div class="form-group">
                        <label for="signupPassword">Password</label>
                        <input type="password" id="signupPassword" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label for="signupCompany">Azienda (opzionale)</label>
                        <input type="text" id="signupCompany">
                    </div>
                    <button type="submit" class="auth-btn">Registrati</button>
                    <div class="auth-switch">
                        Hai già un account? <a href="#" onclick="switchToLogin()">Accedi</a>
                    </div>
                </form>
                <div id="signupError" class="error-message"></div>
                <div id="signupSuccess" class="success-message"></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Funzione per creare il modal di login
function createLoginModal() {
    const modalHTML = `
        <div id="loginModal" class="auth-modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Accedi</h2>
                    <span class="close" onclick="closeLoginModal()">&times;</span>
                </div>
                <form id="loginForm" class="auth-form">
                    <div class="form-group">
                        <label for="loginEmail">Email</label>
                        <input type="email" id="loginEmail" required>
                    </div>
                    <div class="form-group">
                        <label for="loginPassword">Password</label>
                        <input type="password" id="loginPassword" required>
                    </div>
                    <button type="submit" class="auth-btn">Accedi</button>
                    <div class="auth-switch">
                        Non hai un account? <a href="#" onclick="switchToSignup()">Registrati</a>
                    </div>
                </form>
                <div id="loginError" class="error-message"></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Funzione per configurare gli event listeners
function setupEventListeners() {
    // Form di signup
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    // Form di login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Bottone SIGN UP nella navbar
    const signupButton = document.getElementById('signupButton');
    if (signupButton) {
        signupButton.addEventListener('click', function(e) {
            e.preventDefault();
            openSignupModal();
        });
    }

    // Bottone SIGN UP alternativo (se esiste la classe)
    const signupButtonAlt = document.querySelector('.sign-up');
    if (signupButtonAlt && !signupButtonAlt.id) {
        signupButtonAlt.addEventListener('click', function(e) {
            e.preventDefault();
            openSignupModal();
        });
    }

    // Chiusura modali cliccando fuori
    window.addEventListener('click', function(event) {
        const signupModal = document.getElementById('signupModal');
        const loginModal = document.getElementById('loginModal');
        
        if (event.target === signupModal) {
            closeSignupModal();
        }
        if (event.target === loginModal) {
            closeLoginModal();
        }
    });
}

// Gestione registrazione
async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const company = document.getElementById('signupCompany').value;
    
    const errorDiv = document.getElementById('signupError');
    const successDiv = document.getElementById('signupSuccess');
    
    try {
        // Pulisci messaggi precedenti
        errorDiv.textContent = '';
        successDiv.textContent = '';
        
        // Crea account Firebase
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Salva dati aggiuntivi in Firestore
        await db.collection('users').doc(user.uid).set({
            name: name,
            email: email,
            company: company,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            role: 'user'
        });
        
        successDiv.textContent = 'Registrazione completata con successo!';
        
        // Chiudi modal dopo 2 secondi
        setTimeout(() => {
            closeSignupModal();
        }, 2000);
        
    } catch (error) {
        console.error('Errore registrazione:', error);
        errorDiv.textContent = getErrorMessage(error.code);
    }
}

// Gestione login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const errorDiv = document.getElementById('loginError');
    
    try {
        errorDiv.textContent = '';
        
        await auth.signInWithEmailAndPassword(email, password);
        closeLoginModal();
        
    } catch (error) {
        console.error('Errore login:', error);
        errorDiv.textContent = getErrorMessage(error.code);
    }
}

// Logout
async function handleLogout() {
    try {
        await auth.signOut();
        console.log('Logout effettuato');
    } catch (error) {
        console.error('Errore logout:', error);
    }
}

// Funzioni per aprire/chiudere modali
function openSignupModal() {
    document.getElementById('signupModal').style.display = 'flex';
}

function closeSignupModal() {
    document.getElementById('signupModal').style.display = 'none';
    document.getElementById('signupForm').reset();
    document.getElementById('signupError').textContent = '';
    document.getElementById('signupSuccess').textContent = '';
}

function openLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').textContent = '';
}

// Funzioni per switchare tra modali
function switchToLogin() {
    closeSignupModal();
    openLoginModal();
}

function switchToSignup() {
    closeLoginModal();
    openSignupModal();
}

// Aggiorna UI per utente loggato
function updateUIForLoggedInUser(user) {
    const signupButton = document.getElementById('signupButton') || document.querySelector('.sign-up');
    if (signupButton) {
        const userEmail = user.email.split('@')[0]; // Prende solo la parte prima di @
        signupButton.innerHTML = `
            <div class="user-menu">
                <span>Ciao, ${userEmail}</span>
                <button onclick="handleLogout()" class="logout-btn">Logout</button>
            </div>
        `;
        signupButton.style.cursor = 'default';
        // Rimuove l'event listener di apertura modal
        signupButton.replaceWith(signupButton.cloneNode(true));
    }
}

// Aggiorna UI per utente non loggato
function updateUIForLoggedOutUser() {
    const signupButton = document.getElementById('signupButton') || document.querySelector('.sign-up');
    if (signupButton) {
        // Ripristina il contenuto e gli stili originali
        signupButton.textContent = 'SIGN UP';
        signupButton.style.cursor = 'pointer';
        signupButton.className = 'sign-up'; // Ripristina la classe originale
        
        // Riattiva l'event listener
        setupEventListeners();
    }
}

// Funzione per tradurre i codici errore Firebase
function getErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/email-already-in-use':
            return 'Questa email è già registrata.';
        case 'auth/invalid-email':
            return 'Email non valida.';
        case 'auth/weak-password':
            return 'La password deve essere di almeno 6 caratteri.';
        case 'auth/user-not-found':
            return 'Utente non trovato.';
        case 'auth/wrong-password':
            return 'Password errata.';
        case 'auth/too-many-requests':
            return 'Troppi tentativi. Riprova più tardi.';
        default:
            return 'Errore: ' + errorCode;
    }
}
