/**
 * Analytics and User Data Management Module
 * Gestisce raccolta dati utenti, analytics e metriche di utilizzo
 */

class UserAnalyticsManager {
    constructor() {
        this.sessionData = {
            sessionId: this.generateSessionId(),
            startTime: Date.now(),
            userId: null,
            events: [],
            pageViews: [],
            formInteractions: [],
            scrollDepth: 0,
            timeOnPage: 0
        };
        
        this.isFirebaseReady = false;
        this.waitForFirebase();
        this.initializeTracking();
    }

    // Generate unique session ID
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Wait for Firebase to be ready
    async waitForFirebase() {
        const checkFirebase = () => {
            if (window.db && window.auth && window.analytics) {
                this.isFirebaseReady = true;
                this.initializeUserContext();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    }

    // Initialize user context when Firebase is ready
    initializeUserContext() {
        if (window.auth) {
            window.auth.onAuthStateChanged((user) => {
                if (user) {
                    this.sessionData.userId = user.uid;
                    this.trackEvent('user_session_start', {
                        userId: user.uid,
                        email: user.email,
                        sessionId: this.sessionData.sessionId
                    });
                } else {
                    this.sessionData.userId = null;
                    this.trackEvent('anonymous_session_start', {
                        sessionId: this.sessionData.sessionId
                    });
                }
            });
        }
    }

    // Initialize all tracking mechanisms
    initializeTracking() {
        this.trackPageView();
        this.setupScrollTracking();
        this.setupFormTracking();
        this.setupClickTracking();
        this.setupTimeTracking();
        this.setupBeforeUnloadHandler();
    }

    // Track page view
    trackPageView() {
        const pageData = {
            url: window.location.href,
            title: document.title,
            timestamp: Date.now(),
            referrer: document.referrer,
            userAgent: navigator.userAgent
        };

        this.sessionData.pageViews.push(pageData);
        this.trackEvent('page_view', pageData);
    }

    // Setup scroll tracking
    setupScrollTracking() {
        let maxScrollDepth = 0;
        let ticking = false;

        const updateScrollDepth = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = Math.round((scrollTop / docHeight) * 100);
            
            if (scrollPercent > maxScrollDepth) {
                maxScrollDepth = scrollPercent;
                this.sessionData.scrollDepth = maxScrollDepth;
                
                // Track milestone depths
                if (maxScrollDepth % 25 === 0) {
                    this.trackEvent('scroll_depth', {
                        depth: maxScrollDepth,
                        url: window.location.href
                    });
                }
            }
            ticking = false;
        };

        const requestScrollUpdate = () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollDepth);
                ticking = true;
            }
        };

        window.addEventListener('scroll', requestScrollUpdate, { passive: true });
    }

    // Setup form tracking
    setupFormTracking() {
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.tagName === 'FORM') {
                const formData = {
                    formId: form.id || 'unknown',
                    formAction: form.action || 'none',
                    formMethod: form.method || 'get',
                    timestamp: Date.now(),
                    url: window.location.href,
                    fieldCount: form.elements.length
                };

                this.sessionData.formInteractions.push(formData);
                this.trackEvent('form_submit', formData);
            }
        });

        // Track form field interactions
        document.addEventListener('focusin', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.trackEvent('form_field_focus', {
                    fieldType: e.target.type,
                    fieldName: e.target.name,
                    formId: e.target.closest('form')?.id || 'unknown',
                    timestamp: Date.now()
                });
            }
        });
    }

    // Setup click tracking
    setupClickTracking() {
        document.addEventListener('click', (e) => {
            const element = e.target.closest('a, button, .btn');
            if (element) {
                this.trackEvent('click_interaction', {
                    elementType: element.tagName.toLowerCase(),
                    elementText: element.textContent?.trim().substring(0, 50),
                    elementId: element.id || null,
                    elementClass: element.className || null,
                    href: element.href || null,
                    timestamp: Date.now()
                });
            }
        });
    }

    // Setup time tracking
    setupTimeTracking() {
        setInterval(() => {
            this.sessionData.timeOnPage = Date.now() - this.sessionData.startTime;
        }, 10000); // Update every 10 seconds
    }

    // Track custom events
    trackEvent(eventName, eventData = {}) {
        const event = {
            name: eventName,
            data: eventData,
            timestamp: Date.now(),
            sessionId: this.sessionData.sessionId,
            userId: this.sessionData.userId,
            url: window.location.href
        };

        this.sessionData.events.push(event);

        // Send to Firebase Analytics if available
        if (window.analytics && this.isFirebaseReady) {
            try {
                window.analytics.logEvent(eventName, eventData);
            } catch (error) {
                console.warn('Firebase Analytics error:', error);
            }
        }

        // Store in Firestore for detailed analysis
        this.saveEventToFirestore(event);
    }

    // Save event to Firestore
    async saveEventToFirestore(event) {
        if (!this.isFirebaseReady || !window.db) return;

        try {
            await window.db.collection('user_analytics').add({
                ...event,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.warn('Error saving analytics event:', error);
        }
    }

    // Track conversion events (form submissions, signups, etc.)
    trackConversion(conversionType, conversionData = {}) {
        this.trackEvent('conversion', {
            type: conversionType,
            ...conversionData
        });

        // Special handling for high-value conversions
        if (this.isFirebaseReady && window.db) {
            this.saveConversionData(conversionType, conversionData);
        }
    }

    // Save conversion data with additional context
    async saveConversionData(conversionType, conversionData) {
        try {
            await window.db.collection('conversions').add({
                type: conversionType,
                data: conversionData,
                sessionData: this.sessionData,
                userId: this.sessionData.userId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                userAgent: navigator.userAgent,
                referrer: document.referrer
            });
        } catch (error) {
            console.warn('Error saving conversion data:', error);
        }
    }

    // Setup before unload handler to save session data
    setupBeforeUnloadHandler() {
        window.addEventListener('beforeunload', () => {
            this.sessionData.timeOnPage = Date.now() - this.sessionData.startTime;
            this.saveSessionData();
        });

        // Also save periodically
        setInterval(() => {
            this.saveSessionData();
        }, 30000); // Every 30 seconds
    }

    // Save complete session data
    async saveSessionData() {
        if (!this.isFirebaseReady || !window.db) return;

        try {
            const sessionDoc = {
                ...this.sessionData,
                endTime: Date.now(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await window.db.collection('user_sessions').doc(this.sessionData.sessionId).set(sessionDoc);
        } catch (error) {
            console.warn('Error saving session data:', error);
        }
    }

    // Get user behavior insights
    getUserInsights() {
        return {
            sessionDuration: Date.now() - this.sessionData.startTime,
            eventsCount: this.sessionData.events.length,
            pageViewsCount: this.sessionData.pageViews.length,
            formInteractionsCount: this.sessionData.formInteractions.length,
            scrollDepth: this.sessionData.scrollDepth,
            isAuthenticated: !!this.sessionData.userId
        };
    }

    // Track specific business metrics
    trackBusinessMetric(metricName, value, metadata = {}) {
        this.trackEvent('business_metric', {
            metric: metricName,
            value: value,
            metadata: metadata
        });
    }

    // A/B testing support
    trackABTest(testName, variant, conversionGoal = null) {
        const abTestData = {
            testName: testName,
            variant: variant,
            conversionGoal: conversionGoal,
            timestamp: Date.now()
        };

        this.trackEvent('ab_test_impression', abTestData);

        // Store in localStorage for persistent tracking
        try {
            localStorage.setItem(`ab_test_${testName}`, variant);
        } catch (error) {
            console.warn('LocalStorage error for A/B test:', error);
        }
    }
}

// Initialize analytics manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.userAnalytics = new UserAnalyticsManager();
    console.log('🔍 User Analytics Manager initialized');
});

// Export for use in other modules
window.UserAnalyticsManager = UserAnalyticsManager;
