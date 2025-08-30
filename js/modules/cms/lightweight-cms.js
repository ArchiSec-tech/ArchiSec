/**
 * Content Management System Lightweight - ArchiTech
 * Sistema CMS client-side per gestione dinamica dei contenuti
 */

class LightweightCMS {
    constructor(config = {}) {
        this.config = {
            contentEndpoint: config.contentEndpoint || '/api/content',
            authEndpoint: config.authEndpoint || '/api/auth',
            uploadEndpoint: config.uploadEndpoint || '/api/upload',
            cacheTimeout: config.cacheTimeout || 5 * 60 * 1000, // 5 minuti
            enableVersioning: config.enableVersioning || true,
            enableDrafts: config.enableDrafts || true,
            enableCollaboration: config.enableCollaboration || false,
            autoSave: config.autoSave || true,
            autoSaveInterval: config.autoSaveInterval || 30000, // 30 secondi
            ...config
        };

        this.content = new Map();
        this.contentTypes = new Map();
        this.editors = new Map();
        this.cache = new Map();
        this.user = null;
        this.permissions = new Set();
        
        this.initialize();
    }

    /**
     * Inizializza il CMS
     */
    async initialize() {
        try {
            // Carica autenticazione utente
            await this.loadUserAuth();
            
            // Registra tipi di contenuto di base
            this.registerDefaultContentTypes();
            
            // Setup editor inline
            this.initializeInlineEditing();
            
            // Setup gestione media
            this.initializeMediaManager();
            
            // Setup collaboration se abilitata
            if (this.config.enableCollaboration) {
                this.initializeCollaboration();
            }

            console.log('Lightweight CMS inizializzato');

        } catch (error) {
            console.error('Errore inizializzazione CMS:', error);
        }
    }

    /**
     * Carica autenticazione utente
     */
    async loadUserAuth() {
        try {
            const token = localStorage.getItem('cms_auth_token');
            if (!token) return;

            const response = await fetch(this.config.authEndpoint + '/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                this.user = userData.user;
                this.permissions = new Set(userData.permissions || []);
            } else {
                localStorage.removeItem('cms_auth_token');
            }

        } catch (error) {
            console.warn('Errore verifica autenticazione:', error);
        }
    }

    /**
     * Login utente
     */
    async login(credentials) {
        try {
            const response = await fetch(this.config.authEndpoint + '/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('cms_auth_token', data.token);
                this.user = data.user;
                this.permissions = new Set(data.permissions || []);
                
                this.dispatchEvent('userLoggedIn', { user: this.user });
                return true;
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Errore login');
            }

        } catch (error) {
            console.error('Errore login:', error);
            throw error;
        }
    }

    /**
     * Logout utente
     */
    logout() {
        localStorage.removeItem('cms_auth_token');
        this.user = null;
        this.permissions.clear();
        this.dispatchEvent('userLoggedOut');
    }

    /**
     * Registra tipi di contenuto predefiniti
     */
    registerDefaultContentTypes() {
        // Testo semplice
        this.registerContentType('text', {
            name: 'Testo',
            fields: [
                { name: 'content', type: 'textarea', label: 'Contenuto', required: true }
            ],
            template: (data) => `<p>${data.content}</p>`
        });

        // Testo ricco (HTML)
        this.registerContentType('richtext', {
            name: 'Testo Ricco',
            fields: [
                { name: 'content', type: 'html', label: 'Contenuto', required: true }
            ],
            template: (data) => data.content
        });

        // Immagine
        this.registerContentType('image', {
            name: 'Immagine',
            fields: [
                { name: 'src', type: 'image', label: 'Immagine', required: true },
                { name: 'alt', type: 'text', label: 'Testo alternativo', required: true },
                { name: 'caption', type: 'text', label: 'Didascalia' }
            ],
            template: (data) => `
                <figure>
                    <img src="${data.src}" alt="${data.alt}" loading="lazy">
                    ${data.caption ? `<figcaption>${data.caption}</figcaption>` : ''}
                </figure>
            `
        });

        // Gallery
        this.registerContentType('gallery', {
            name: 'Galleria',
            fields: [
                { name: 'images', type: 'imageArray', label: 'Immagini', required: true },
                { name: 'layout', type: 'select', label: 'Layout', options: ['grid', 'carousel', 'masonry'], default: 'grid' }
            ],
            template: (data) => {
                const imagesHtml = data.images.map(img => 
                    `<img src="${img.src}" alt="${img.alt}" loading="lazy">`
                ).join('');
                return `<div class="gallery gallery-${data.layout}">${imagesHtml}</div>`;
            }
        });

        // Form di contatto
        this.registerContentType('contactform', {
            name: 'Form Contatto',
            fields: [
                { name: 'title', type: 'text', label: 'Titolo', required: true },
                { name: 'fields', type: 'json', label: 'Campi Form', required: true },
                { name: 'submitText', type: 'text', label: 'Testo Pulsante', default: 'Invia' }
            ],
            template: (data) => this.generateContactForm(data)
        });

        // Sezione hero
        this.registerContentType('hero', {
            name: 'Sezione Hero',
            fields: [
                { name: 'title', type: 'text', label: 'Titolo', required: true },
                { name: 'subtitle', type: 'text', label: 'Sottotitolo' },
                { name: 'backgroundImage', type: 'image', label: 'Immagine di sfondo' },
                { name: 'ctaText', type: 'text', label: 'Testo CTA' },
                { name: 'ctaLink', type: 'text', label: 'Link CTA' }
            ],
            template: (data) => this.generateHeroSection(data)
        });
    }

    /**
     * Registra un nuovo tipo di contenuto
     */
    registerContentType(type, config) {
        this.contentTypes.set(type, {
            type,
            name: config.name,
            fields: config.fields || [],
            template: config.template || ((data) => JSON.stringify(data)),
            validation: config.validation || {},
            permissions: config.permissions || ['read'],
            ...config
        });
    }

    /**
     * Ottiene contenuto dal server con caching
     */
    async getContent(id, useCache = true) {
        const cacheKey = `content_${id}`;
        
        // Controlla cache
        if (useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const response = await fetch(`${this.config.contentEndpoint}/${id}`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const content = await response.json();
            
            // Aggiungi alla cache
            this.cache.set(cacheKey, {
                data: content,
                timestamp: Date.now()
            });

            return content;

        } catch (error) {
            console.error('Errore caricamento contenuto:', error);
            throw error;
        }
    }

    /**
     * Salva contenuto sul server
     */
    async saveContent(content) {
        if (!this.hasPermission('content.write')) {
            throw new Error('Permessi insufficienti per salvare contenuti');
        }

        try {
            const method = content.id ? 'PUT' : 'POST';
            const url = content.id 
                ? `${this.config.contentEndpoint}/${content.id}`
                : this.config.contentEndpoint;

            const response = await fetch(url, {
                method,
                headers: {
                    ...this.getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...content,
                    updatedAt: new Date().toISOString(),
                    updatedBy: this.user?.id
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const savedContent = await response.json();
            
            // Aggiorna cache
            const cacheKey = `content_${savedContent.id}`;
            this.cache.set(cacheKey, {
                data: savedContent,
                timestamp: Date.now()
            });

            this.dispatchEvent('contentSaved', { content: savedContent });
            return savedContent;

        } catch (error) {
            console.error('Errore salvataggio contenuto:', error);
            throw error;
        }
    }

    /**
     * Elimina contenuto
     */
    async deleteContent(id) {
        if (!this.hasPermission('content.delete')) {
            throw new Error('Permessi insufficienti per eliminare contenuti');
        }

        try {
            const response = await fetch(`${this.config.contentEndpoint}/${id}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Rimuovi dalla cache
            this.cache.delete(`content_${id}`);
            
            this.dispatchEvent('contentDeleted', { id });
            return true;

        } catch (error) {
            console.error('Errore eliminazione contenuto:', error);
            throw error;
        }
    }

    /**
     * Inizializza editing inline
     */
    initializeInlineEditing() {
        if (!this.hasPermission('content.write')) return;

        // Osserva elementi editabili
        document.addEventListener('dblclick', (e) => {
            const editableElement = e.target.closest('[data-editable]');
            if (editableElement) {
                this.startInlineEdit(editableElement);
            }
        });

        // Toolbar floating per editing
        this.createEditingToolbar();
    }

    /**
     * Avvia editing inline di un elemento
     */
    async startInlineEdit(element) {
        const contentId = element.dataset.editable;
        const contentType = element.dataset.contentType || 'text';

        try {
            // Carica contenuto corrente
            const content = await this.getContent(contentId);
            
            // Crea editor basato sul tipo
            const editor = this.createEditor(contentType, content, element);
            this.editors.set(contentId, editor);

            // Sostituisce elemento con editor
            element.style.display = 'none';
            element.parentNode.insertBefore(editor.element, element.nextSibling);

            // Focus sull'editor
            editor.focus();

            // Auto-save se abilitato
            if (this.config.autoSave) {
                this.startAutoSave(contentId, editor);
            }

        } catch (error) {
            console.error('Errore avvio editing:', error);
            if (window.feedbackSystem) {
                window.feedbackSystem.showNotification('Errore durante l\'avvio dell\'editor', 'error');
            }
        }
    }

    /**
     * Crea editor basato sul tipo di contenuto
     */
    createEditor(contentType, content, originalElement) {
        const typeConfig = this.contentTypes.get(contentType);
        if (!typeConfig) {
            throw new Error(`Tipo contenuto sconosciuto: ${contentType}`);
        }

        const editorContainer = document.createElement('div');
        editorContainer.className = 'cms-inline-editor';
        
        const form = document.createElement('form');
        form.className = 'cms-editor-form';

        // Genera campi del form
        typeConfig.fields.forEach(field => {
            const fieldContainer = document.createElement('div');
            fieldContainer.className = 'cms-field';

            const label = document.createElement('label');
            label.textContent = field.label;
            label.setAttribute('for', `field_${field.name}`);

            const input = this.createFieldInput(field, content.data[field.name]);
            input.id = `field_${field.name}`;
            input.name = field.name;

            fieldContainer.appendChild(label);
            fieldContainer.appendChild(input);
            form.appendChild(fieldContainer);
        });

        // Pulsanti di controllo
        const buttons = document.createElement('div');
        buttons.className = 'cms-editor-buttons';

        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.textContent = 'Salva';
        saveBtn.className = 'cms-btn cms-btn-primary';
        saveBtn.onclick = () => this.saveInlineEdit(content.id, originalElement);

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.textContent = 'Annulla';
        cancelBtn.className = 'cms-btn cms-btn-secondary';
        cancelBtn.onclick = () => this.cancelInlineEdit(content.id, originalElement);

        buttons.appendChild(saveBtn);
        buttons.appendChild(cancelBtn);

        editorContainer.appendChild(form);
        editorContainer.appendChild(buttons);

        return {
            element: editorContainer,
            form: form,
            focus: () => form.querySelector('input, textarea')?.focus(),
            getData: () => this.getFormData(form),
            destroy: () => editorContainer.remove()
        };
    }

    /**
     * Crea input per campo
     */
    createFieldInput(field, value = '') {
        let input;

        switch (field.type) {
            case 'text':
                input = document.createElement('input');
                input.type = 'text';
                input.value = value || field.default || '';
                break;

            case 'textarea':
                input = document.createElement('textarea');
                input.value = value || field.default || '';
                input.rows = field.rows || 3;
                break;

            case 'html':
                input = document.createElement('div');
                input.contentEditable = true;
                input.innerHTML = value || field.default || '';
                input.className = 'cms-rich-editor';
                this.initializeRichEditor(input);
                break;

            case 'select':
                input = document.createElement('select');
                (field.options || []).forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.value || option;
                    optionElement.textContent = option.label || option;
                    optionElement.selected = (value || field.default) === optionElement.value;
                    input.appendChild(optionElement);
                });
                break;

            case 'image':
                input = document.createElement('div');
                input.className = 'cms-image-field';
                input.innerHTML = this.createImageField(field, value);
                break;

            case 'json':
                input = document.createElement('textarea');
                input.value = typeof value === 'object' ? JSON.stringify(value, null, 2) : (value || '{}');
                input.className = 'cms-json-editor';
                break;

            default:
                input = document.createElement('input');
                input.type = 'text';
                input.value = value || field.default || '';
        }

        if (field.required) {
            input.required = true;
        }

        return input;
    }

    /**
     * Salva modifiche inline
     */
    async saveInlineEdit(contentId, originalElement) {
        const editor = this.editors.get(contentId);
        if (!editor) return;

        try {
            const data = editor.getData();
            const content = await this.getContent(contentId, false);
            
            content.data = { ...content.data, ...data };
            content.updatedAt = new Date().toISOString();

            await this.saveContent(content);

            // Aggiorna elemento originale
            this.updateElementContent(originalElement, content);

            // Chiudi editor
            this.cancelInlineEdit(contentId, originalElement);

            if (window.feedbackSystem) {
                window.feedbackSystem.showNotification('Contenuto salvato con successo', 'success');
            }

        } catch (error) {
            console.error('Errore salvataggio:', error);
            if (window.feedbackSystem) {
                window.feedbackSystem.showNotification('Errore durante il salvataggio', 'error');
            }
        }
    }

    /**
     * Annulla editing inline
     */
    cancelInlineEdit(contentId, originalElement) {
        const editor = this.editors.get(contentId);
        if (editor) {
            editor.destroy();
            this.editors.delete(contentId);
        }

        originalElement.style.display = '';
        
        // Ferma auto-save
        if (this.autoSaveTimers && this.autoSaveTimers.has(contentId)) {
            clearInterval(this.autoSaveTimers.get(contentId));
            this.autoSaveTimers.delete(contentId);
        }
    }

    /**
     * Aggiorna contenuto di un elemento
     */
    updateElementContent(element, content) {
        const contentType = element.dataset.contentType || 'text';
        const typeConfig = this.contentTypes.get(contentType);
        
        if (typeConfig && typeConfig.template) {
            element.innerHTML = typeConfig.template(content.data);
        } else {
            element.innerHTML = content.data.content || '';
        }
    }

    /**
     * Auto-save per editor
     */
    startAutoSave(contentId, editor) {
        if (!this.autoSaveTimers) {
            this.autoSaveTimers = new Map();
        }

        const timer = setInterval(async () => {
            try {
                const data = editor.getData();
                const content = await this.getContent(contentId, false);
                
                content.data = { ...content.data, ...data };
                content.isDraft = true;
                
                await this.saveContent(content);
                
                // Visual feedback
                const indicator = editor.element.querySelector('.autosave-indicator') || 
                               this.createAutoSaveIndicator(editor.element);
                indicator.textContent = 'Salvato automaticamente';
                indicator.classList.add('visible');
                
                setTimeout(() => {
                    indicator.classList.remove('visible');
                }, 2000);

            } catch (error) {
                console.warn('Errore auto-save:', error);
            }
        }, this.config.autoSaveInterval);

        this.autoSaveTimers.set(contentId, timer);
    }

    /**
     * Gestione media
     */
    initializeMediaManager() {
        // Crea bottone per apertura media manager
        this.createMediaButton();
    }

    /**
     * Upload file
     */
    async uploadFile(file, folder = 'uploads') {
        if (!this.hasPermission('media.upload')) {
            throw new Error('Permessi insufficienti per caricare file');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        try {
            const response = await fetch(this.config.uploadEndpoint, {
                method: 'POST',
                headers: this.getAuthHeaders(false), // Non aggiungere Content-Type per FormData
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            this.dispatchEvent('fileUploaded', { file: result });
            
            return result;

        } catch (error) {
            console.error('Errore upload file:', error);
            throw error;
        }
    }

    /**
     * Utility functions
     */
    hasPermission(permission) {
        if (!this.user) return false;
        return this.user.isAdmin || this.permissions.has(permission);
    }

    getAuthHeaders(includeContentType = true) {
        const headers = {};
        
        if (includeContentType) {
            headers['Content-Type'] = 'application/json';
        }

        const token = localStorage.getItem('cms_auth_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    getFormData(form) {
        const data = {};
        const formData = new FormData(form);
        
        for (let [key, value] of formData.entries()) {
            // Gestione campi JSON
            if (form.querySelector(`[name="${key}"]`)?.classList.contains('cms-json-editor')) {
                try {
                    data[key] = JSON.parse(value);
                } catch {
                    data[key] = value;
                }
            } else {
                data[key] = value;
            }
        }

        return data;
    }

    dispatchEvent(eventName, detail = {}) {
        window.dispatchEvent(new CustomEvent(`cms:${eventName}`, { detail }));
    }

    /**
     * Template generators
     */
    generateContactForm(data) {
        const fields = Array.isArray(data.fields) ? data.fields : [];
        
        const fieldsHtml = fields.map(field => {
            const fieldHtml = field.type === 'textarea' 
                ? `<textarea name="${field.name}" ${field.required ? 'required' : ''} placeholder="${field.placeholder || ''}">${field.default || ''}</textarea>`
                : `<input type="${field.type || 'text'}" name="${field.name}" ${field.required ? 'required' : ''} placeholder="${field.placeholder || ''}" value="${field.default || ''}">`;
            
            return `
                <div class="form-field">
                    <label for="${field.name}">${field.label}</label>
                    ${fieldHtml}
                </div>
            `;
        }).join('');

        return `
            <form class="contact-form" data-cms-form>
                <h3>${data.title}</h3>
                ${fieldsHtml}
                <button type="submit">${data.submitText}</button>
            </form>
        `;
    }

    generateHeroSection(data) {
        const backgroundStyle = data.backgroundImage ? `style="background-image: url('${data.backgroundImage}')"` : '';
        
        return `
            <section class="hero-section" ${backgroundStyle}>
                <div class="hero-content">
                    <h1>${data.title}</h1>
                    ${data.subtitle ? `<p class="hero-subtitle">${data.subtitle}</p>` : ''}
                    ${data.ctaText && data.ctaLink ? 
                        `<a href="${data.ctaLink}" class="hero-cta">${data.ctaText}</a>` : 
                        ''
                    }
                </div>
            </section>
        `;
    }

    createImageField(field, value) {
        return `
            <div class="cms-image-preview">
                ${value ? `<img src="${value}" alt="Preview">` : '<div class="no-image">Nessuna immagine</div>'}
            </div>
            <input type="file" accept="image/*" onchange="window.cmsInstance.handleImageUpload(this)">
            <input type="hidden" name="${field.name}" value="${value || ''}">
        `;
    }

    async handleImageUpload(input) {
        if (input.files.length === 0) return;

        try {
            const file = input.files[0];
            const result = await this.uploadFile(file, 'images');
            
            const hiddenInput = input.parentNode.querySelector('input[type="hidden"]');
            hiddenInput.value = result.url;
            
            const preview = input.parentNode.querySelector('.cms-image-preview');
            preview.innerHTML = `<img src="${result.url}" alt="Preview">`;
            
        } catch (error) {
            console.error('Errore upload immagine:', error);
            if (window.feedbackSystem) {
                window.feedbackSystem.showNotification('Errore durante l\'upload dell\'immagine', 'error');
            }
        }
    }

    createEditingToolbar() {
        // Implementazione toolbar floating per editing avanzato
        const toolbar = document.createElement('div');
        toolbar.className = 'cms-floating-toolbar';
        toolbar.style.display = 'none';
        
        // Aggiungere pulsanti per formattazione, link, etc.
        
        document.body.appendChild(toolbar);
        return toolbar;
    }

    createMediaButton() {
        // Implementazione bottone media manager
        if (document.querySelector('.cms-media-button')) return;
        
        const button = document.createElement('button');
        button.className = 'cms-media-button';
        button.innerHTML = '📁';
        button.title = 'Gestione Media';
        button.onclick = () => this.openMediaManager();
        
        document.body.appendChild(button);
    }

    openMediaManager() {
        // Implementazione modal per gestione media
        console.log('Apertura Media Manager');
    }

    createAutoSaveIndicator(container) {
        const indicator = document.createElement('div');
        indicator.className = 'autosave-indicator';
        container.appendChild(indicator);
        return indicator;
    }

    initializeRichEditor(element) {
        // Implementazione base rich editor
        // In una implementazione completa si userebbe TinyMCE, CKEditor, etc.
        element.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'b':
                        e.preventDefault();
                        document.execCommand('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        document.execCommand('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        document.execCommand('underline');
                        break;
                }
            }
        });
    }

    initializeCollaboration() {
        // Implementazione sistema collaborativo (WebSocket, etc.)
        console.log('Inizializzazione sistema collaborativo');
    }
}

// Rende disponibile globalmente per gli handler di upload
window.cmsInstance = null;

export default LightweightCMS;
