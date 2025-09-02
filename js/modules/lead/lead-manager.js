/**
 * Lead Generation and Management Module
 * Gestisce lead, prospect tracking e nurturing campaigns
 */

class LeadManager {
    constructor() {
        this.leadData = {
            leadId: this.generateLeadId(),
            source: this.getLeadSource(),
            campaign: this.getCampaignData(),
            touchpoints: [],
            interactions: [],
            score: 0,
            status: 'new'
        };
        
        this.waitForFirebase();
        this.initializeLeadTracking();
    }

    // Generate unique lead ID
    generateLeadId() {
        return 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Determine lead source
    getLeadSource() {
        const referrer = document.referrer;
        const utm_source = new URLSearchParams(window.location.search).get('utm_source');
        
        if (utm_source) return utm_source;
        if (referrer.includes('google.com')) return 'google_organic';
        if (referrer.includes('facebook.com')) return 'facebook';
        if (referrer.includes('linkedin.com')) return 'linkedin';
        if (referrer) return 'referral';
        return 'direct';
    }

    // Get campaign data from URL parameters
    getCampaignData() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            utm_source: urlParams.get('utm_source'),
            utm_medium: urlParams.get('utm_medium'),
            utm_campaign: urlParams.get('utm_campaign'),
            utm_term: urlParams.get('utm_term'),
            utm_content: urlParams.get('utm_content')
        };
    }

    // Wait for Firebase to be ready
    async waitForFirebase() {
        const checkFirebase = () => {
            if (window.db && window.auth) {
                this.initializeLeadManagement();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    }

    // Initialize lead management when Firebase is ready
    initializeLeadManagement() {
        this.checkExistingLead();
        this.setupFormListeners();
        this.setupBehaviorTracking();
    }

    // Check for existing lead data
    checkExistingLead() {
        try {
            const existingLeadData = localStorage.getItem('leadData');
            if (existingLeadData) {
                const parsedData = JSON.parse(existingLeadData);
                this.leadData = { ...this.leadData, ...parsedData };
                this.updateLeadScore('returning_visitor', 5);
            }
        } catch (error) {
            console.warn('Error loading existing lead data:', error);
        }
    }

    // Initialize lead tracking
    initializeLeadTracking() {
        this.trackTouchpoint('page_visit', {
            page: window.location.pathname,
            timestamp: Date.now()
        });

        // Save lead data to localStorage
        this.saveLeadDataLocally();
    }

    // Track touchpoint
    trackTouchpoint(touchpointType, data = {}) {
        const touchpoint = {
            type: touchpointType,
            data: data,
            timestamp: Date.now(),
            page: window.location.href
        };

        this.leadData.touchpoints.push(touchpoint);
        this.updateLeadScore(touchpointType);
        this.saveLeadDataLocally();

        // Send to analytics if available
        if (window.userAnalytics) {
            window.userAnalytics.trackEvent('lead_touchpoint', touchpoint);
        }
    }

    // Update lead score based on actions
    updateLeadScore(action, customPoints = null) {
        const scoringMatrix = {
            'page_visit': 1,
            'returning_visitor': 5,
            'form_view': 3,
            'form_start': 5,
            'form_complete': 15,
            'newsletter_signup': 8,
            'download_resource': 10,
            'video_watch': 7,
            'contact_form': 20,
            'demo_request': 25,
            'pricing_view': 12,
            'case_study_read': 8,
            'blog_comment': 6,
            'social_share': 4,
            'email_open': 2,
            'email_click': 4
        };

        const points = customPoints || scoringMatrix[action] || 1;
        this.leadData.score += points;

        // Update status based on score
        if (this.leadData.score >= 50) {
            this.leadData.status = 'hot';
        } else if (this.leadData.score >= 25) {
            this.leadData.status = 'warm';
        } else if (this.leadData.score >= 10) {
            this.leadData.status = 'qualified';
        }

        this.saveLeadToFirestore();
    }

    // Setup form listeners for lead capture
    setupFormListeners() {
        // Track form views
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            // Track when form comes into view
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.trackTouchpoint('form_view', {
                            formId: form.id || 'unknown',
                            formType: this.getFormType(form)
                        });
                        observer.unobserve(entry.target);
                    }
                });
            });
            observer.observe(form);

            // Track form start
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('focus', () => {
                    this.trackTouchpoint('form_start', {
                        formId: form.id || 'unknown',
                        fieldName: input.name || 'unknown'
                    });
                }, { once: true });
            });

            // Track form completion
            form.addEventListener('submit', (e) => {
                this.handleFormSubmission(form, e);
            });
        });
    }

    // Get form type based on form elements and context
    getFormType(form) {
        const formId = form.id?.toLowerCase() || '';
        const formClass = form.className?.toLowerCase() || '';
        
        if (formId.includes('contact') || formClass.includes('contact')) return 'contact';
        if (formId.includes('newsletter') || formClass.includes('newsletter')) return 'newsletter';
        if (formId.includes('demo') || formClass.includes('demo')) return 'demo';
        if (formId.includes('consultation') || formClass.includes('consultation')) return 'consultation';
        if (formId.includes('signup') || formClass.includes('signup')) return 'signup';
        if (formId.includes('login') || formClass.includes('login')) return 'login';
        
        return 'unknown';
    }

    // Handle form submission
    handleFormSubmission(form, event) {
        const formType = this.getFormType(form);
        const formData = new FormData(form);
        const leadInfo = {};

        // Extract lead information
        for (let [key, value] of formData.entries()) {
            leadInfo[key] = value;
        }

        // Update lead data with form information
        if (leadInfo.email) {
            this.leadData.email = leadInfo.email;
        }
        if (leadInfo.name || leadInfo.nome) {
            this.leadData.name = leadInfo.name || leadInfo.nome;
        }
        if (leadInfo.company || leadInfo.azienda) {
            this.leadData.company = leadInfo.company || leadInfo.azienda;
        }
        if (leadInfo.phone || leadInfo.telefono) {
            this.leadData.phone = leadInfo.phone || leadInfo.telefono;
        }

        this.trackTouchpoint('form_complete', {
            formType: formType,
            formId: form.id || 'unknown',
            leadInfo: leadInfo
        });

        // Convert to customer if it's a high-value form
        if (['contact', 'demo', 'consultation'].includes(formType)) {
            this.convertToCustomer(formType, leadInfo);
        }

        this.saveLeadToFirestore();
    }

    // Convert lead to customer
    async convertToCustomer(conversionType, conversionData) {
        this.leadData.status = 'converted';
        this.leadData.conversionType = conversionType;
        this.leadData.conversionData = conversionData;
        this.leadData.conversionDate = Date.now();

        // Track conversion event
        if (window.userAnalytics) {
            window.userAnalytics.trackConversion(conversionType, {
                leadId: this.leadData.leadId,
                leadScore: this.leadData.score,
                source: this.leadData.source,
                campaign: this.leadData.campaign
            });
        }

        // Save to conversions collection
        try {
            if (window.db) {
                await window.db.collection('lead_conversions').add({
                    leadId: this.leadData.leadId,
                    conversionType: conversionType,
                    conversionData: conversionData,
                    leadData: this.leadData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error saving conversion:', error);
        }
    }

    // Setup behavior tracking for lead scoring
    setupBehaviorTracking() {
        // Track time on high-value pages
        const highValuePages = ['/pricing', '/consulenza', '/security-assessment', '/vulnerability-fixing'];
        if (highValuePages.some(page => window.location.pathname.includes(page))) {
            setTimeout(() => {
                this.updateLeadScore('high_value_page_time', 5);
            }, 30000); // 30 seconds on page
        }

        // Track scroll depth on content pages
        let scrollTracked = false;
        window.addEventListener('scroll', () => {
            if (!scrollTracked) {
                const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
                if (scrollPercent > 75) {
                    this.updateLeadScore('deep_scroll', 3);
                    scrollTracked = true;
                }
            }
        });

        // Track outbound clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href && !link.href.startsWith(window.location.origin)) {
                this.trackTouchpoint('outbound_click', {
                    url: link.href,
                    text: link.textContent?.trim().substring(0, 50)
                });
            }
        });
    }

    // Save lead data to Firestore
    async saveLeadToFirestore() {
        try {
            if (window.db) {
                const leadDoc = {
                    ...this.leadData,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    userAgent: navigator.userAgent,
                    referrer: document.referrer
                };

                await window.db.collection('leads').doc(this.leadData.leadId).set(leadDoc, { merge: true });
            }
        } catch (error) {
            console.warn('Error saving lead to Firestore:', error);
        }
    }

    // Save lead data locally
    saveLeadDataLocally() {
        try {
            localStorage.setItem('leadData', JSON.stringify(this.leadData));
        } catch (error) {
            console.warn('Error saving lead data locally:', error);
        }
    }

    // Get lead qualification status
    getLeadQualification() {
        const qualification = {
            score: this.leadData.score,
            status: this.leadData.status,
            touchpoints: this.leadData.touchpoints.length,
            hasContactInfo: !!(this.leadData.email || this.leadData.phone),
            source: this.leadData.source,
            recommendations: []
        };

        // Add recommendations based on behavior
        if (qualification.score > 30 && !qualification.hasContactInfo) {
            qualification.recommendations.push('Show contact form or demo request');
        }
        if (this.leadData.source === 'google_organic' && qualification.score > 15) {
            qualification.recommendations.push('Highly engaged organic visitor - priority follow-up');
        }
        if (qualification.touchpoints > 5 && qualification.status === 'new') {
            qualification.recommendations.push('Multiple touchpoints detected - nurture sequence recommended');
        }

        return qualification;
    }

    // Trigger lead nurturing actions
    triggerNurturing(actionType) {
        const nurturingActions = {
            'welcome_email': () => this.scheduleEmail('welcome'),
            'content_recommendation': () => this.showContentRecommendations(),
            'demo_popup': () => this.showDemoPopup(),
            'discount_offer': () => this.showDiscountOffer(),
            'exit_intent': () => this.showExitIntentOffer()
        };

        if (nurturingActions[actionType]) {
            nurturingActions[actionType]();
            this.trackTouchpoint('nurturing_action', { action: actionType });
        }
    }

    // Schedule follow-up email (placeholder - integrate with email service)
    scheduleEmail(emailType) {
        console.log(`Scheduling ${emailType} email for lead ${this.leadData.leadId}`);
        // Integration with email service (Mailchimp, SendGrid, etc.)
    }

    // Show content recommendations
    showContentRecommendations() {
        // Implementation for showing personalized content
        console.log('Showing content recommendations based on lead behavior');
    }

    // Show demo popup
    showDemoPopup() {
        // Implementation for demo request popup
        console.log('Showing demo request popup for qualified lead');
    }

    // Show discount offer
    showDiscountOffer() {
        // Implementation for discount offer
        console.log('Showing discount offer for high-intent lead');
    }

    // Show exit intent offer
    showExitIntentOffer() {
        // Implementation for exit intent popup
        console.log('Showing exit intent offer');
    }

    // Get lead insights for dashboard
    getLeadInsights() {
        return {
            leadId: this.leadData.leadId,
            score: this.leadData.score,
            status: this.leadData.status,
            source: this.leadData.source,
            touchpointsCount: this.leadData.touchpoints.length,
            qualification: this.getLeadQualification(),
            nextRecommendedAction: this.getNextRecommendedAction()
        };
    }

    // Get next recommended action
    getNextRecommendedAction() {
        const qualification = this.getLeadQualification();
        
        if (qualification.score > 40 && qualification.hasContactInfo) {
            return 'Schedule sales call';
        } else if (qualification.score > 25 && !qualification.hasContactInfo) {
            return 'Capture contact information';
        } else if (qualification.score > 15) {
            return 'Send targeted content';
        } else {
            return 'Continue nurturing';
        }
    }
}

// Initialize lead manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.leadManager = new LeadManager();
    console.log('🎯 Lead Manager initialized');
});

// Export for use in other modules
window.LeadManager = LeadManager;
