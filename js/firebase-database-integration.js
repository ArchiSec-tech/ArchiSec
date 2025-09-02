/**
 * Firebase Database Integration Module
 * Sistema centralizzato per la gestione di tutti i moduli Firebase
 */

class FirebaseIntegrationManager {
    constructor() {
        this.modules = {};
        this.firebaseReady = false;
        this.initializationQueue = [];
        
        this.waitForFirebase();
    }

    // Wait for Firebase to be fully initialized
    async waitForFirebase() {
        const checkFirebase = () => {
            if (typeof firebase !== 'undefined' && window.db && window.auth && window.analytics) {
                this.firebaseReady = true;
                this.initializeAllModules();
                this.processInitializationQueue();
                console.log('🔥 Firebase Integration Manager - All services ready');
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    }

    // Initialize all Firebase-dependent modules
    initializeAllModules() {
        // Initialize core modules if they haven't been loaded yet
        this.initializeUserAnalytics();
        this.initializeLeadManager();
        this.initializeBusinessDataManager();
        this.initializeDataSyncManager();
        
        // Set up cross-module integrations
        this.setupModuleIntegrations();
    }

    // Initialize User Analytics module
    initializeUserAnalytics() {
        if (!window.userAnalytics && window.UserAnalyticsManager) {
            this.modules.userAnalytics = new window.UserAnalyticsManager();
            console.log('✅ User Analytics Module loaded');
        }
    }

    // Initialize Lead Manager module
    initializeLeadManager() {
        if (!window.leadManager && window.LeadManager) {
            this.modules.leadManager = new window.LeadManager();
            console.log('✅ Lead Manager Module loaded');
        }
    }

    // Initialize Business Data Manager module
    initializeBusinessDataManager() {
        if (!window.businessDataManager && window.BusinessDataManager) {
            this.modules.businessDataManager = new window.BusinessDataManager();
            console.log('✅ Business Data Manager Module loaded');
        }
    }

    // Initialize Data Sync Manager for real-time updates
    initializeDataSyncManager() {
        this.modules.dataSyncManager = new DataSyncManager();
        console.log('✅ Data Sync Manager Module loaded');
    }

    // Set up integrations between modules
    setupModuleIntegrations() {
        // Connect lead scoring with analytics events
        if (this.modules.userAnalytics && this.modules.leadManager) {
            this.setupLeadAnalyticsIntegration();
        }

        // Connect business metrics with lead data
        if (this.modules.businessDataManager && this.modules.leadManager) {
            this.setupBusinessLeadIntegration();
        }

        // Set up real-time data synchronization
        if (this.modules.dataSyncManager) {
            this.setupRealtimeSync();
        }
    }

    // Integration between Lead Manager and User Analytics
    setupLeadAnalyticsIntegration() {
        // Override lead tracking to also send analytics events
        const originalTrackTouchpoint = this.modules.leadManager.trackTouchpoint;
        this.modules.leadManager.trackTouchpoint = function(touchpointType, data) {
            // Call original method
            originalTrackTouchpoint.call(this, touchpointType, data);
            
            // Also track in analytics
            if (window.userAnalytics) {
                window.userAnalytics.trackEvent('lead_touchpoint', {
                    touchpointType: touchpointType,
                    leadScore: this.leadData.score,
                    leadStatus: this.leadData.status,
                    ...data
                });
            }
        };
    }

    // Integration between Business Data Manager and Lead Manager
    setupBusinessLeadIntegration() {
        // Enhance business metrics with lead context
        const originalSaveBusinessMetrics = this.modules.businessDataManager.saveBusinessMetrics;
        this.modules.businessDataManager.saveBusinessMetrics = async function(metricType, metricData) {
            // Add lead context to business metrics
            if (window.leadManager) {
                metricData.leadContext = {
                    leadId: window.leadManager.leadData.leadId,
                    leadScore: window.leadManager.leadData.score,
                    leadStatus: window.leadManager.leadData.status,
                    leadSource: window.leadManager.leadData.source
                };
            }
            
            // Call original method
            return originalSaveBusinessMetrics.call(this, metricType, metricData);
        };
    }

    // Set up real-time data synchronization
    setupRealtimeSync() {
        // Listen for real-time updates from Firebase
        this.modules.dataSyncManager.startRealtimeListeners();
        
        // Sync local data with Firebase periodically
        setInterval(() => {
            this.modules.dataSyncManager.syncAllData();
        }, 60000); // Sync every minute
    }

    // Queue initialization tasks for when Firebase is ready
    queueInitialization(callback) {
        if (this.firebaseReady) {
            callback();
        } else {
            this.initializationQueue.push(callback);
        }
    }

    // Process queued initialization tasks
    processInitializationQueue() {
        while (this.initializationQueue.length > 0) {
            const callback = this.initializationQueue.shift();
            try {
                callback();
            } catch (error) {
                console.error('Error processing initialization queue:', error);
            }
        }
    }

    // Get comprehensive dashboard data
    getDashboardData() {
        const dashboardData = {
            timestamp: Date.now(),
            firebaseStatus: this.firebaseReady,
            modules: {}
        };

        // Collect data from all modules
        if (this.modules.userAnalytics) {
            dashboardData.modules.analytics = this.modules.userAnalytics.getUserInsights();
        }

        if (this.modules.leadManager) {
            dashboardData.modules.leads = this.modules.leadManager.getLeadInsights();
        }

        if (this.modules.businessDataManager) {
            dashboardData.modules.business = this.modules.businessDataManager.getBusinessInsights();
        }

        if (this.modules.dataSyncManager) {
            dashboardData.modules.sync = this.modules.dataSyncManager.getSyncStatus();
        }

        return dashboardData;
    }

    // Export data for analysis
    async exportData(dataType = 'all', dateRange = null) {
        if (!this.firebaseReady) {
            throw new Error('Firebase not ready');
        }

        const exportData = {};

        try {
            if (dataType === 'all' || dataType === 'analytics') {
                exportData.analytics = await this.exportAnalyticsData(dateRange);
            }

            if (dataType === 'all' || dataType === 'leads') {
                exportData.leads = await this.exportLeadsData(dateRange);
            }

            if (dataType === 'all' || dataType === 'business') {
                exportData.business = await this.exportBusinessData(dateRange);
            }

            return exportData;
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    }

    // Export analytics data
    async exportAnalyticsData(dateRange) {
        const query = window.db.collection('user_analytics');
        
        if (dateRange) {
            query.where('createdAt', '>=', dateRange.start)
                 .where('createdAt', '<=', dateRange.end);
        }

        const snapshot = await query.limit(1000).get();
        const data = [];
        
        snapshot.forEach(doc => {
            data.push({ id: doc.id, ...doc.data() });
        });

        return data;
    }

    // Export leads data
    async exportLeadsData(dateRange) {
        const query = window.db.collection('leads');
        
        if (dateRange) {
            query.where('updatedAt', '>=', dateRange.start)
                 .where('updatedAt', '<=', dateRange.end);
        }

        const snapshot = await query.limit(1000).get();
        const data = [];
        
        snapshot.forEach(doc => {
            data.push({ id: doc.id, ...doc.data() });
        });

        return data;
    }

    // Export business data
    async exportBusinessData(dateRange) {
        const query = window.db.collection('business_metrics');
        
        if (dateRange) {
            query.where('createdAt', '>=', dateRange.start)
                 .where('createdAt', '<=', dateRange.end);
        }

        const snapshot = await query.limit(1000).get();
        const data = [];
        
        snapshot.forEach(doc => {
            data.push({ id: doc.id, ...doc.data() });
        });

        return data;
    }
}

// Data Sync Manager for real-time updates
class DataSyncManager {
    constructor() {
        this.syncStatus = {
            lastSync: null,
            syncErrors: [],
            realtimeListeners: []
        };
    }

    // Start real-time listeners
    startRealtimeListeners() {
        // Listen for new leads
        const leadsListener = window.db.collection('leads')
            .where('status', '==', 'new')
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        this.handleNewLead(change.doc.data());
                    }
                });
            });

        // Listen for high-value conversions
        const conversionsListener = window.db.collection('conversions')
            .where('createdAt', '>', new Date(Date.now() - 24 * 60 * 60 * 1000))
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        this.handleNewConversion(change.doc.data());
                    }
                });
            });

        this.syncStatus.realtimeListeners = [leadsListener, conversionsListener];
    }

    // Handle new lead
    handleNewLead(leadData) {
        console.log('🆕 New lead detected:', leadData.leadId);
        
        // Trigger lead notifications or automation
        if (leadData.score > 30) {
            this.triggerLeadNotification(leadData);
        }
    }

    // Handle new conversion
    handleNewConversion(conversionData) {
        console.log('🎉 New conversion detected:', conversionData.type);
        
        // Trigger conversion notifications
        this.triggerConversionNotification(conversionData);
    }

    // Trigger lead notification
    triggerLeadNotification(leadData) {
        // Implementation for lead notifications
        console.log(`High-score lead alert: ${leadData.leadId} (Score: ${leadData.score})`);
    }

    // Trigger conversion notification
    triggerConversionNotification(conversionData) {
        // Implementation for conversion notifications
        console.log(`New conversion: ${conversionData.type} - ${conversionData.leadId}`);
    }

    // Sync all data
    async syncAllData() {
        try {
            // Sync any pending local data to Firebase
            await this.syncLocalData();
            
            // Update sync status
            this.syncStatus.lastSync = Date.now();
            this.syncStatus.syncErrors = [];
            
        } catch (error) {
            this.syncStatus.syncErrors.push({
                error: error.message,
                timestamp: Date.now()
            });
            console.error('Data sync error:', error);
        }
    }

    // Sync local data to Firebase
    async syncLocalData() {
        // Check for any unsent data in localStorage and sync it
        try {
            const pendingData = localStorage.getItem('pendingFirebaseData');
            if (pendingData) {
                const data = JSON.parse(pendingData);
                
                for (const item of data) {
                    await window.db.collection(item.collection).add(item.data);
                }
                
                localStorage.removeItem('pendingFirebaseData');
            }
        } catch (error) {
            console.warn('Error syncing local data:', error);
        }
    }

    // Get sync status
    getSyncStatus() {
        return {
            ...this.syncStatus,
            isConnected: this.syncStatus.realtimeListeners.length > 0,
            lastSyncAgo: this.syncStatus.lastSync ? Date.now() - this.syncStatus.lastSync : null
        };
    }

    // Stop all listeners
    stopRealtimeListeners() {
        this.syncStatus.realtimeListeners.forEach(listener => {
            if (typeof listener === 'function') {
                listener(); // Firestore listeners return unsubscribe functions
            }
        });
        this.syncStatus.realtimeListeners = [];
    }
}

// Initialize the Firebase Integration Manager
document.addEventListener('DOMContentLoaded', () => {
    window.firebaseIntegrationManager = new FirebaseIntegrationManager();
    console.log('🔥 Firebase Integration Manager initialized');
});

// Export classes for use in other modules
window.FirebaseIntegrationManager = FirebaseIntegrationManager;
window.DataSyncManager = DataSyncManager;

// Utility function to ensure all Firebase modules are loaded
window.ensureFirebaseModules = function(callback) {
    if (window.firebaseIntegrationManager && window.firebaseIntegrationManager.firebaseReady) {
        callback();
    } else if (window.firebaseIntegrationManager) {
        window.firebaseIntegrationManager.queueInitialization(callback);
    } else {
        setTimeout(() => window.ensureFirebaseModules(callback), 100);
    }
};
