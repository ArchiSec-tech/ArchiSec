/**
 * Business Data Manager Module
 * Gestisce dati aziendali, metriche KPI e business intelligence
 */

class BusinessDataManager {
    constructor() {
        this.businessMetrics = {
            sessionId: this.generateSessionId(),
            pagePerformance: {},
            conversionFunnels: {},
            customerJourney: [],
            revenue: {},
            serviceMetrics: {},
            securityMetrics: {}
        };
        
        this.waitForFirebase();
        this.initializeBusinessTracking();
    }

    generateSessionId() {
        return 'biz_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async waitForFirebase() {
        const checkFirebase = () => {
            if (window.db && window.auth) {
                this.initializeBusinessDataCollection();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    }

    initializeBusinessDataCollection() {
        this.setupConversionFunnelTracking();
        this.setupServiceMetricsTracking();
        this.setupRevenueTracking();
        this.setupSecurityMetricsTracking();
    }

    initializeBusinessTracking() {
        this.trackPagePerformance();
        this.setupBusinessEventListeners();
    }

    // Track page performance metrics
    trackPagePerformance() {
        const pageMetrics = {
            url: window.location.href,
            loadTime: this.getPageLoadTime(),
            domContentLoaded: this.getDOMContentLoadedTime(),
            firstPaint: this.getFirstPaintTime(),
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            timestamp: Date.now()
        };

        this.businessMetrics.pagePerformance = pageMetrics;
        this.saveBusinessMetrics('page_performance', pageMetrics);
    }

    // Get page load time
    getPageLoadTime() {
        try {
            const navigation = performance.getEntriesByType('navigation')[0];
            return navigation ? Math.round(navigation.loadEventEnd - navigation.fetchStart) : 0;
        } catch (error) {
            return 0;
        }
    }

    // Get DOM content loaded time
    getDOMContentLoadedTime() {
        try {
            const navigation = performance.getEntriesByType('navigation')[0];
            return navigation ? Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart) : 0;
        } catch (error) {
            return 0;
        }
    }

    // Get first paint time
    getFirstPaintTime() {
        try {
            const paintEntries = performance.getEntriesByType('paint');
            const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
            return firstPaint ? Math.round(firstPaint.startTime) : 0;
        } catch (error) {
            return 0;
        }
    }

    // Setup conversion funnel tracking
    setupConversionFunnelTracking() {
        const funnelSteps = {
            'homepage': { step: 1, page: '/', weight: 1 },
            'services': { step: 2, page: '/security-assessment|/vulnerability-fixing|/monitoraggio-risposta', weight: 2 },
            'pricing': { step: 3, page: '/pricing', weight: 3 },
            'contact': { step: 4, page: '/contattaci|/consulenza', weight: 4 },
            'signup': { step: 5, page: '/signup', weight: 5 }
        };

        const currentPage = window.location.pathname;
        for (const [stepName, stepData] of Object.entries(funnelSteps)) {
            if (stepData.page === '/' ? currentPage === '/' : new RegExp(stepData.page).test(currentPage)) {
                this.trackFunnelStep(stepName, stepData.step, stepData.weight);
                break;
            }
        }
    }

    // Track funnel step
    trackFunnelStep(stepName, stepNumber, weight) {
        const funnelData = {
            stepName: stepName,
            stepNumber: stepNumber,
            weight: weight,
            timestamp: Date.now(),
            sessionId: this.businessMetrics.sessionId,
            userAgent: navigator.userAgent,
            referrer: document.referrer
        };

        this.businessMetrics.conversionFunnels[stepName] = funnelData;
        this.saveBusinessMetrics('funnel_step', funnelData);

        // Track customer journey
        this.businessMetrics.customerJourney.push({
            step: stepName,
            timestamp: Date.now(),
            page: window.location.href
        });
    }

    // Setup service metrics tracking
    setupServiceMetricsTracking() {
        const servicePages = {
            'security-assessment': 'Security Assessment',
            'vulnerability-fixing': 'Vulnerability Remediation',
            'monitoraggio-risposta': 'Monitoring & Response',
            'implementazione-sicurezza': 'Security Implementation'
        };

        const currentPath = window.location.pathname;
        for (const [path, serviceName] of Object.entries(servicePages)) {
            if (currentPath.includes(path)) {
                this.trackServiceInterest(serviceName, path);
                break;
            }
        }
    }

    // Track service interest
    trackServiceInterest(serviceName, servicePath) {
        const serviceMetrics = {
            serviceName: serviceName,
            servicePath: servicePath,
            interactionTime: Date.now(),
            timeOnPage: 0,
            scrollDepth: 0,
            ctaClicks: 0
        };

        this.businessMetrics.serviceMetrics[serviceName] = serviceMetrics;

        // Track time on service page
        const startTime = Date.now();
        window.addEventListener('beforeunload', () => {
            serviceMetrics.timeOnPage = Date.now() - startTime;
            this.saveBusinessMetrics('service_engagement', serviceMetrics);
        });

        // Track CTA clicks on service pages
        document.addEventListener('click', (e) => {
            const element = e.target.closest('.btn, .cta-button, a[href*="contatt"], a[href*="consulenza"]');
            if (element) {
                serviceMetrics.ctaClicks++;
                this.trackServiceCTAClick(serviceName, element.textContent?.trim());
            }
        });
    }

    // Track service CTA clicks
    trackServiceCTAClick(serviceName, ctaText) {
        const ctaData = {
            serviceName: serviceName,
            ctaText: ctaText,
            timestamp: Date.now(),
            page: window.location.href
        };

        this.saveBusinessMetrics('service_cta_click', ctaData);
    }

    // Setup revenue tracking
    setupRevenueTracking() {
        // Track potential revenue based on service interest
        const servicePricing = {
            'Security Assessment': 2500,
            'Vulnerability Remediation': 5000,
            'Monitoring & Response': 8000,
            'Security Implementation': 15000
        };

        // Calculate potential revenue based on current page
        for (const [serviceName, price] of Object.entries(servicePricing)) {
            if (this.businessMetrics.serviceMetrics[serviceName]) {
                this.businessMetrics.revenue.potentialValue = price;
                this.businessMetrics.revenue.serviceType = serviceName;
                break;
            }
        }
    }

    // Setup security metrics tracking (for cybersecurity business)
    setupSecurityMetricsTracking() {
        const securityMetrics = {
            pageSecurityChecks: this.performPageSecurityChecks(),
            userSecurityAwareness: this.assessUserSecurityAwareness(),
            complianceIndicators: this.checkComplianceIndicators()
        };

        this.businessMetrics.securityMetrics = securityMetrics;
        this.saveBusinessMetrics('security_assessment', securityMetrics);
    }

    // Perform basic page security checks
    performPageSecurityChecks() {
        return {
            httpsEnabled: window.location.protocol === 'https:',
            mixedContent: this.checkMixedContent(),
            cspHeaderPresent: this.checkCSPHeader(),
            secureStorageUsed: this.checkSecureStorage()
        };
    }

    // Check for mixed content issues
    checkMixedContent() {
        const httpResources = [];
        const allElements = document.querySelectorAll('img, script, link, iframe');
        
        allElements.forEach(element => {
            const src = element.src || element.href;
            if (src && src.startsWith('http://')) {
                httpResources.push(src);
            }
        });

        return {
            hasMixedContent: httpResources.length > 0,
            httpResourcesCount: httpResources.length
        };
    }

    // Check CSP header (client-side detection is limited)
    checkCSPHeader() {
        // This is a basic check - full CSP analysis requires server-side checking
        return {
            metaCSPPresent: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]'),
            hasInlineScripts: document.querySelectorAll('script:not([src])').length > 0
        };
    }

    // Check secure storage usage
    checkSecureStorage() {
        let hasInsecureStorage = false;
        
        try {
            // Check for sensitive data in localStorage
            const localStorage = window.localStorage;
            const sessionStorage = window.sessionStorage;
            
            const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth'];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i).toLowerCase();
                if (sensitiveKeys.some(sensitive => key.includes(sensitive))) {
                    hasInsecureStorage = true;
                    break;
                }
            }
        } catch (error) {
            // Storage access denied or not available
        }

        return {
            hasInsecureStorage: hasInsecureStorage,
            cookieSecureFlags: this.checkCookieFlags()
        };
    }

    // Check cookie security flags
    checkCookieFlags() {
        const cookies = document.cookie.split(';');
        return {
            totalCookies: cookies.length,
            // Note: Secure and HttpOnly flags can't be checked from client-side
            hasDocumentCookies: cookies.length > 0
        };
    }

    // Assess user security awareness based on behavior
    assessUserSecurityAwareness() {
        const awareness = {
            visitedSecurityPages: this.hasVisitedSecurityPages(),
            timeOnSecurityContent: this.getTimeOnSecurityContent(),
            securityResourceDownloads: this.getSecurityResourceDownloads(),
            newsletterSignup: this.hasNewsletterSignup()
        };

        // Calculate awareness score
        let score = 0;
        if (awareness.visitedSecurityPages) score += 25;
        if (awareness.timeOnSecurityContent > 60000) score += 25; // 1 minute
        if (awareness.securityResourceDownloads > 0) score += 30;
        if (awareness.newsletterSignup) score += 20;

        awareness.awarenesScore = score;
        awareness.awarenessLevel = score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low';

        return awareness;
    }

    // Check compliance indicators
    checkComplianceIndicators() {
        return {
            privacyPolicyPresent: !!document.querySelector('a[href*="privacy"], a[href*="policy"]'),
            gdprCompliance: this.checkGDPRCompliance(),
            accessibilityFeatures: this.checkAccessibilityFeatures()
        };
    }

    // Check GDPR compliance indicators
    checkGDPRCompliance() {
        return {
            cookieBanner: !!document.querySelector('.cookie-banner, .cookie-consent, #cookie-notice'),
            privacyControls: !!document.querySelector('[data-privacy], .privacy-controls'),
            dataProtectionMentioned: document.body.textContent.toLowerCase().includes('gdpr') || 
                                   document.body.textContent.toLowerCase().includes('data protection')
        };
    }

    // Check accessibility features
    checkAccessibilityFeatures() {
        return {
            altTextPresent: document.querySelectorAll('img[alt]').length > 0,
            ariaLabels: document.querySelectorAll('[aria-label]').length,
            keyboardNavigation: document.querySelectorAll('[tabindex]').length,
            headingStructure: this.checkHeadingStructure()
        };
    }

    // Check heading structure
    checkHeadingStructure() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        return {
            totalHeadings: headings.length,
            hasH1: document.querySelectorAll('h1').length > 0,
            headingHierarchy: headings.length > 0
        };
    }

    // Helper methods for security awareness assessment
    hasVisitedSecurityPages() {
        const securityPages = ['/security-assessment', '/vulnerability-fixing', '/monitoraggio-risposta'];
        return securityPages.some(page => window.location.pathname.includes(page));
    }

    getTimeOnSecurityContent() {
        // This would track time spent on security-related content
        // For now, return 0 as placeholder
        return 0;
    }

    getSecurityResourceDownloads() {
        // Track downloads of security resources
        return 0;
    }

    hasNewsletterSignup() {
        // Check if user has signed up for newsletter
        try {
            return localStorage.getItem('newsletterSignup') === 'true';
        } catch (error) {
            return false;
        }
    }

    // Setup business event listeners
    setupBusinessEventListeners() {
        // Track form submissions as business events
        document.addEventListener('submit', (e) => {
            if (e.target.tagName === 'FORM') {
                this.trackBusinessFormSubmission(e.target);
            }
        });

        // Track high-value button clicks
        document.addEventListener('click', (e) => {
            const element = e.target.closest('.btn-primary, .cta-button, .sign-up, .contact-btn');
            if (element) {
                this.trackHighValueInteraction(element);
            }
        });

        // Track page exit for business analysis
        window.addEventListener('beforeunload', () => {
            this.trackPageExit();
        });
    }

    // Track business form submissions
    trackBusinessFormSubmission(form) {
        const formType = form.id || form.className || 'unknown';
        const businessImpact = this.calculateBusinessImpact(formType);

        this.saveBusinessMetrics('form_conversion', {
            formType: formType,
            businessImpact: businessImpact,
            potentialRevenue: this.businessMetrics.revenue.potentialValue || 0,
            timestamp: Date.now()
        });
    }

    // Calculate business impact of form submission
    calculateBusinessImpact(formType) {
        const impactMatrix = {
            'contact': 'high',
            'consulenza': 'high',
            'consultation': 'high',
            'demo': 'high',
            'newsletter': 'medium',
            'signup': 'high',
            'login': 'low'
        };

        for (const [key, value] of Object.entries(impactMatrix)) {
            if (formType.toLowerCase().includes(key)) {
                return value;
            }
        }
        return 'low';
    }

    // Track high-value interactions
    trackHighValueInteraction(element) {
        const interactionData = {
            elementType: element.tagName.toLowerCase(),
            elementText: element.textContent?.trim().substring(0, 50),
            elementId: element.id,
            className: element.className,
            businessValue: this.calculateInteractionValue(element),
            timestamp: Date.now()
        };

        this.saveBusinessMetrics('high_value_interaction', interactionData);
    }

    // Calculate interaction business value
    calculateInteractionValue(element) {
        const text = element.textContent?.toLowerCase() || '';
        const classNames = element.className?.toLowerCase() || '';

        if (text.includes('contact') || text.includes('demo') || text.includes('consulenza')) return 'high';
        if (text.includes('pricing') || text.includes('sign up')) return 'medium';
        if (classNames.includes('primary') || classNames.includes('cta')) return 'medium';
        
        return 'low';
    }

    // Track page exit
    trackPageExit() {
        const exitData = {
            timeOnPage: Date.now() - this.businessMetrics.sessionId,
            pageUrl: window.location.href,
            customerJourney: this.businessMetrics.customerJourney,
            businessMetrics: this.businessMetrics,
            timestamp: Date.now()
        };

        this.saveBusinessMetrics('page_exit', exitData);
    }

    // Save business metrics to Firestore
    async saveBusinessMetrics(metricType, metricData) {
        try {
            if (window.db) {
                await window.db.collection('business_metrics').add({
                    type: metricType,
                    data: metricData,
                    sessionId: this.businessMetrics.sessionId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    userAgent: navigator.userAgent,
                    url: window.location.href
                });
            }
        } catch (error) {
            console.warn('Error saving business metrics:', error);
        }
    }

    // Get business insights dashboard data
    getBusinessInsights() {
        return {
            performance: this.businessMetrics.pagePerformance,
            conversionFunnel: this.businessMetrics.conversionFunnels,
            customerJourney: this.businessMetrics.customerJourney,
            revenue: this.businessMetrics.revenue,
            security: this.businessMetrics.securityMetrics,
            recommendations: this.getBusinessRecommendations()
        };
    }

    // Get business recommendations based on data
    getBusinessRecommendations() {
        const recommendations = [];

        // Performance recommendations
        if (this.businessMetrics.pagePerformance.loadTime > 3000) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                message: 'Page load time exceeds 3 seconds - consider optimization'
            });
        }

        // Security recommendations
        if (!this.businessMetrics.securityMetrics.pageSecurityChecks.httpsEnabled) {
            recommendations.push({
                type: 'security',
                priority: 'critical',
                message: 'HTTPS not enabled - immediate security risk'
            });
        }

        // Conversion recommendations
        if (Object.keys(this.businessMetrics.conversionFunnels).length === 1) {
            recommendations.push({
                type: 'conversion',
                priority: 'medium',
                message: 'Single page visit detected - improve engagement strategy'
            });
        }

        return recommendations;
    }
}

// Initialize business data manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.businessDataManager = new BusinessDataManager();
    console.log('📊 Business Data Manager initialized');
});

// Export for use in other modules
window.BusinessDataManager = BusinessDataManager;
