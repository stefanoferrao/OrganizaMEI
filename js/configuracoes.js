/* Configurações Unificadas - OrganizaMEI */

// ===== SISTEMA DE ATALHOS =====
class ShortcutSystem {
    constructor() {
        this.currentNotifications = [];
        this.isEnabled = this.loadUserPreference();
        this.feedbackEnabled = this.loadFeedbackPreference();
        this.globalShortcuts = {
            'F1': () => this.navigateToTab('dashboard'),
            'F2': () => this.navigateToTab('estoque'),
            'F3': () => this.navigateToTab('financeiro'),
            'F4': () => this.navigateToTab('vendas'),
            'F5': () => this.refreshPage(),
            'F6': () => this.navigateToTab('categorias'),
            'F7': () => this.navigateToTab('graficos'),
            'F8': () => this.navigateToTab('configuracoes'),
            'Digit1': () => this.navigateToTab('dashboard'),
            'Digit2': () => this.navigateToTab('estoque'),
            'Digit3': () => this.navigateToTab('financeiro'),
            'Digit4': () => this.navigateToTab('vendas'),
            'Digit5': () => this.navigateToTab('categorias'),
            'Digit6': () => this.navigateToTab('graficos'),
            'Digit7': () => this.navigateToTab('configuracoes')
        };
        
        this.financeiroShortcuts = {
            'Tab': () => this.handleTabNavigation(),
            'Escape': () => this.clearForm()
        };
        
        this.graficosShortcuts = {
            'ArrowUp': () => this.navigateGraficoOption(-1),
            'ArrowDown': () => this.navigateGraficoOption(1)
        };
        
        this.form = null;
        this.fields = [];
        this.currentFieldIndex = 0;
        
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.form = document.getElementById('financeiro-form-inner');
        if (this.form) {
            this.setupFields();
            this.setupFieldListeners();
        }
        
        this.setupEventListeners();
        this.setupConfigListeners();
        this.setupFinanceiroFormToggleListener();
    }

    setupFinanceiroFormToggleListener() {
        const header = document.getElementById('financeiro-form-header');
        if (header) {
            header.addEventListener('click', () => {
                const content = document.getElementById('financeiro-form-content');
                if (content && content.style.display === 'none') {
                    this.clearFinanceiroFormPersistentActive();
                }
            });
        }
    }

    setupFields() {
        this.fields = [
            { element: () => document.querySelector('input[name="tipo-lancamento"]:checked'), type: 'radio' },
            { element: () => document.getElementById('categoria-lancamento'), type: 'select' },
            { element: () => document.getElementById('subcategoria-lancamento'), type: 'select' },
            { element: () => document.getElementById('descricao-lancamento'), type: 'input' },
            { element: () => document.getElementById('quantidade-lancamento'), type: 'input' },
            { element: () => document.getElementById('valor-lancamento'), type: 'input' },
            { element: () => document.getElementById('data-lancamento'), type: 'input' }
        ];
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.isEnabled) return;
            
            if (e.key === 'F5') return;
            
            if (e.ctrlKey) {
                const shortcut = this.globalShortcuts[e.code];
                if (shortcut) {
                    e.preventDefault();
                    shortcut();
                    return;
                }
            }
            
            const globalShortcut = this.globalShortcuts[e.key];
            if (globalShortcut) {
                if (e.key !== 'F5') e.preventDefault();
                globalShortcut();
                return;
            }
            
            if (this.isFinanceiroTabActive()) {
                const financeiroShortcut = this.financeiroShortcuts[e.key];
                if (financeiroShortcut) {
                    if (e.key === 'Tab') {
                        const result = financeiroShortcut();
                        if (!result) {
                            e.preventDefault();
                        }
                    } else {
                        e.preventDefault();
                        financeiroShortcut();
                    }
                }
            }
            
            if (this.isGraficosTabActive()) {
                const graficosShortcut = this.graficosShortcuts[e.key];
                if (graficosShortcut) {
                    e.preventDefault();
                    graficosShortcut();
                }
            }
        });
    }

    setupFieldListeners() {
        this.fields.forEach((field, index) => {
            const element = typeof field.element === 'function' ? field.element() : field.element;
            if (!element) return;

            element.addEventListener('keydown', (e) => {
                if (!this.isEnabled) return;

                switch (e.key) {
                    case 'Enter':
                        e.preventDefault();
                        if (index === this.fields.length - 1) {
                            this.submitForm();
                        } else {
                            this.focusNextField(index);
                        }
                        break;
                    
                    case 'Tab':
                        this.updateCurrentFieldIndex(e.shiftKey ? index - 1 : index + 1);
                        break;
                }
            });

            element.addEventListener('focus', () => {
                if (this.isEnabled) {
                    this.highlightField(element);
                }
                this.currentFieldIndex = index;
            });

            element.addEventListener('blur', () => {
                this.removeHighlight(element);
            });
        });

        const radioButtons = document.querySelectorAll('input[name="tipo-lancamento"]');
        // Radio buttons não precisam mais de atalhos de seta
    }

    refreshPage() {}

    navigateToTab(tabId) {
        if (typeof changeTab === 'function') {
            if (tabId !== 'financeiro') {
                this.clearFinanceiroFormPersistentActive();
            }
            
            changeTab(tabId);
            
            const navButtons = document.querySelectorAll('nav button');
            navButtons.forEach(btn => {
                btn.classList.remove('nav-active');
                if (btn.onclick && btn.onclick.toString().includes(tabId)) {
                    btn.classList.add('nav-active');
                }
            });
            
            const tabNames = {
                'dashboard': 'Dashboard',
                'estoque': 'Estoque', 
                'financeiro': 'Financeiro',
                'vendas': 'Vendas',
                'categorias': 'Categorias',
                'graficos': 'Gráficos',
                'configuracoes': 'Configurações'
            };
            this.showNotification(tabNames[tabId], 'global');
        }
    }

    // Funções selectReceita e selectDespesa removidas - não são mais necessárias

    submitForm() {
        this.expandFinanceiroForm();
        this.highlightFinanceiroForm();
        const submitBtn = this.form?.querySelector('button[type="submit"]');
        if (submitBtn && !submitBtn.disabled) {
            submitBtn.click();
        }
    }

    handleTabNavigation() {
        this.expandFinanceiroForm();
        this.setFinanceiroFormPersistentActive();
        return true;
    }

    expandFinanceiroForm() {
        const header = document.getElementById('financeiro-form-header');
        const content = document.getElementById('financeiro-form-content');
        const arrow = document.getElementById('financeiro-form-arrow');
        
        if (header && content && arrow) {
            if (content.style.display === 'none') {
                content.style.display = 'block';
                arrow.classList.add('rotated');
                
                if (typeof saveFinanceiroFormState === 'function') {
                    saveFinanceiroFormState(true);
                } else {
                    localStorage.setItem('financeiroFormExpanded', 'true');
                }
            }
        }
    }

    highlightFinanceiroForm() {
        const header = document.getElementById('financeiro-form-header');
        const form = document.getElementById('financeiro-form');
        
        if (header && form) {
            header.classList.add('shortcut-active');
            form.classList.add('shortcut-focused');
            
            setTimeout(() => {
                header.classList.remove('shortcut-active');
                form.classList.remove('shortcut-focused');
            }, 2000);
        }
    }

    setFinanceiroFormPersistentActive() {
        const header = document.getElementById('financeiro-form-header');
        const form = document.getElementById('financeiro-form');
        
        if (header && form) {
            header.classList.add('persistent-active');
            form.classList.add('persistent-focused');
        }
    }

    clearFinanceiroFormPersistentActive() {
        const header = document.getElementById('financeiro-form-header');
        const form = document.getElementById('financeiro-form');
        
        if (header && form) {
            header.classList.remove('persistent-active');
            form.classList.remove('persistent-focused');
        }
    }

    clearForm() {
        document.getElementById('tipo-receita').checked = true;
        document.getElementById('categoria-lancamento').value = '';
        document.getElementById('subcategoria-lancamento').value = '';
        document.getElementById('descricao-lancamento').value = '';
        document.getElementById('quantidade-lancamento').value = '1';
        document.getElementById('valor-lancamento').value = '';
        document.getElementById('data-lancamento').value = '';
        
        if (typeof atualizarCategorias === 'function') {
            atualizarCategorias();
        }
        
        this.form?.focus();
        this.showNotification('Formulário limpo', 'field');
    }

    focusNextField(currentIndex) {
        const nextIndex = Math.min(currentIndex + 1, this.fields.length - 1);
        const nextField = this.fields[nextIndex];
        const element = typeof nextField.element === 'function' ? nextField.element() : nextField.element;
        
        if (nextField && element) {
            element.focus();
            if (nextField.type === 'input') {
                element.select();
            } else if (nextField.type === 'select') {
                this.openSelect(element);
            }
        }
    }

    updateCurrentFieldIndex(newIndex) {
        this.currentFieldIndex = Math.max(0, Math.min(newIndex, this.fields.length - 1));
    }

    openSelect(selectElement) {
        if (selectElement && selectElement.options.length > 1) {
            selectElement.size = Math.min(selectElement.options.length, 8);
            setTimeout(() => {
                selectElement.size = 1;
            }, 3000);
        }
    }

    highlightField(element) {
        element.classList.add('shortcut-focused');
    }

    removeHighlight(element) {
        element.classList.remove('shortcut-focused');
    }

    // Função toggleTipo removida - não é mais necessária

    isFinanceiroTabActive() {
        const financeiroTab = document.getElementById('financeiro');
        return financeiroTab && financeiroTab.classList.contains('active');
    }
    
    isGraficosTabActive() {
        const graficosTab = document.getElementById('graficos');
        return graficosTab && graficosTab.classList.contains('active');
    }
    
    navigateGraficoOption(direction) {
        const tipoGrafico = document.getElementById('tipo-grafico');
        if (!tipoGrafico) return;
        
        const currentIndex = tipoGrafico.selectedIndex;
        const totalOptions = tipoGrafico.options.length;
        
        let newIndex;
        if (direction === 1) {
            newIndex = currentIndex < totalOptions - 1 ? currentIndex + 1 : 0;
        } else {
            newIndex = currentIndex > 0 ? currentIndex - 1 : totalOptions - 1;
        }
        
        tipoGrafico.selectedIndex = newIndex;
        tipoGrafico.focus();
        
        const changeEvent = new Event('change', { bubbles: true });
        tipoGrafico.dispatchEvent(changeEvent);
        
        const selectedOption = tipoGrafico.options[newIndex];
        this.showNotification(`Gráfico: ${selectedOption.text}`, 'field');
    }

    showNotification(message, type = 'global', duration = 2000) {
        if (!this.feedbackEnabled) return;
        
        const feedback = document.createElement('div');
        feedback.className = `shortcut-feedback ${type}`;
        feedback.textContent = message;
        
        const topOffset = this.calculateTopOffset();
        feedback.style.top = `${topOffset}px`;
        
        document.body.appendChild(feedback);
        this.currentNotifications.push(feedback);
        
        setTimeout(() => {
            feedback.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            feedback.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(feedback)) {
                    document.body.removeChild(feedback);
                    this.currentNotifications = this.currentNotifications.filter(n => n !== feedback);
                    this.updatePositions();
                }
            }, 300);
        }, duration);
    }

    calculateTopOffset() {
        const isMobile = window.innerWidth <= 768;
        const baseTop = isMobile ? 50 : 50;
        const notificationHeight = isMobile ? 50 : 60;
        const currentCount = this.currentNotifications.length;
        
        return baseTop + (currentCount * notificationHeight);
    }

    updatePositions() {
        const isMobile = window.innerWidth <= 768;
        const baseTop = isMobile ? 50 : 50;
        const notificationHeight = isMobile ? 50 : 60;
        
        this.currentNotifications.forEach((notification, index) => {
            const newTop = baseTop + (index * notificationHeight);
            notification.style.top = `${newTop}px`;
        });
    }

    loadUserPreference() {
        return localStorage.getItem('financeiroAtalhosEnabled') === 'true';
    }
    
    loadFeedbackPreference() {
        return localStorage.getItem('atalhosFeedbackEnabled') !== 'false';
    }
    
    loadHeaderState() {
        return localStorage.getItem('shortcutsHeaderExpanded') !== 'false';
    }
    
    saveUserPreference(enabled) {
        localStorage.setItem('financeiroAtalhosEnabled', enabled.toString());
        this.isEnabled = enabled;
    }
    
    saveFeedbackPreference(enabled) {
        localStorage.setItem('atalhosFeedbackEnabled', enabled.toString());
        this.feedbackEnabled = enabled;
    }
    
    saveHeaderState(expanded) {
        localStorage.setItem('shortcutsHeaderExpanded', expanded.toString());
    }
    
    setupConfigListeners() {
        const checkbox = document.getElementById('atalhos-financeiro-enabled');
        const feedbackCheckbox = document.getElementById('atalhos-feedback-enabled');
        const info = document.getElementById('shortcuts-info');
        const header = document.getElementById('shortcuts-header');
        const content = document.getElementById('shortcuts-content');
        const arrow = document.getElementById('shortcuts-arrow');
        
        if (checkbox) {
            checkbox.checked = this.isEnabled;
            this.initializeVisibility();
            this.updateFeedbackState();
            this.updateShortcutsInfo();
            
            checkbox.addEventListener('change', (e) => {
                this.saveUserPreference(e.target.checked);
                this.updateFeedbackState();
                this.updateShortcutsInfo();
            });
        }
        
        if (feedbackCheckbox) {
            feedbackCheckbox.checked = this.feedbackEnabled;
            
            feedbackCheckbox.addEventListener('change', (e) => {
                this.saveFeedbackPreference(e.target.checked);
            });
        }
        
        if (header && content && arrow) {
            const savedState = this.loadHeaderState();
            content.style.display = savedState ? 'block' : 'none';
            arrow.classList.toggle('rotated', savedState);
            
            header.addEventListener('click', () => {
                const isVisible = content.style.display !== 'none';
                const newState = !isVisible;
                content.style.display = newState ? 'block' : 'none';
                arrow.classList.toggle('rotated', newState);
                
                this.saveHeaderState(newState);
                
                if (info && newState) {
                    this.updateShortcutsInfo();
                }
            });
        }
    }
    
    initializeVisibility() {
        const content = document.getElementById('shortcuts-content');
        const arrow = document.getElementById('shortcuts-arrow');
        const info = document.getElementById('shortcuts-info');
        
        if (content && arrow) {
            const headerExpanded = this.loadHeaderState();
            content.style.display = headerExpanded ? 'block' : 'none';
            arrow.classList.toggle('rotated', headerExpanded);
            
            if (info && this.isEnabled && headerExpanded) {
                info.style.display = 'block';
            }
        }
    }
    
    updateFeedbackState() {
        const feedbackCheckbox = document.getElementById('atalhos-feedback-enabled');
        
        if (feedbackCheckbox) {
            feedbackCheckbox.disabled = !this.isEnabled;
            
            if (!this.isEnabled) {
                feedbackCheckbox.checked = false;
                this.saveFeedbackPreference(false);
            }
        }
    }
    
    updateShortcutsInfo() {
        const info = document.getElementById('shortcuts-info');
        
        if (info) {
            info.style.display = this.isEnabled ? 'block' : 'none';
        }
    }

    updateEnabledState(enabled) {
        this.isEnabled = enabled;
    }
}

// ===== README VIEWER =====
class ReadmeViewer {
    constructor() {
        this.readmeContent = '';
        this.init();
    }

    init() {
        const btnReadme = document.getElementById('btn-readme');

        if (btnReadme) {
            btnReadme.addEventListener('click', (e) => {
                e.preventDefault();
                this.showReadme();
            });
        } else {
            setTimeout(() => {
                const btnReadme2 = document.getElementById('btn-readme');
                if (btnReadme2) {
                    btnReadme2.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.showReadme();
                    });
                }
            }, 1000);
        }
    }

    async loadReadmeContent() {
        try {
            const response = await fetch('docs/README.md');
            if (!response.ok) throw new Error('README não encontrado');
            this.readmeContent = await response.text();
            return this.readmeContent;
        } catch (error) {
            console.error('Erro ao carregar README:', error);
            throw error;
        }
    }

    parseMarkdown(markdown) {
        let html = markdown;

        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        html = this.parseLists(html);
        html = html.replace(/^> (.*$)/gim, '<blockquote><p>$1</p></blockquote>');
        html = html.replace(/^---$/gim, '<hr>');
        html = this.parseTables(html);
        html = this.parseEmojis(html);

        const lines = html.split('\n');
        let result = [];
        let inParagraph = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (!line) {
                if (inParagraph) {
                    result.push('</p>');
                    inParagraph = false;
                }
            } else if (line.match(/^<(h[1-6]|hr|ul|blockquote|pre|table)/)) {
                if (inParagraph) {
                    result.push('</p>');
                    inParagraph = false;
                }
                result.push(line);
            } else if (line.match(/^<\/(ul|blockquote|pre|table)/)) {
                result.push(line);
            } else {
                if (!inParagraph && !line.match(/^<\//)) {
                    result.push('<p>');
                    inParagraph = true;
                }
                result.push(line);
            }
        }
        
        if (inParagraph) {
            result.push('</p>');
        }
        
        html = result.join('\n');

        return html;
    }

    parseTables(html) {
        const lines = html.split('\n');
        let result = [];
        let i = 0;
        
        while (i < lines.length) {
            const line = lines[i];
            
            if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('|') && lines[i + 1].includes('-')) {
                const headerCells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
                const headerRow = '<tr>' + headerCells.map(cell => `<th>${cell}</th>`).join('') + '</tr>';
                
                i += 2;
                let bodyRows = '';
                
                while (i < lines.length && lines[i].includes('|')) {
                    const cells = lines[i].split('|').map(cell => cell.trim()).filter(cell => cell);
                    bodyRows += '<tr>' + cells.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
                    i++;
                }
                
                result.push(`<table><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table>`);
            } else {
                result.push(line);
                i++;
            }
        }
        
        return result.join('\n');
    }

    parseLists(html) {
        const lines = html.split('\n');
        let result = [];
        let inList = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.match(/^- (.+)$/)) {
                if (!inList) {
                    result.push('<ul>');
                    inList = true;
                }
                result.push('<li>' + line.substring(2) + '</li>');
            } else {
                if (inList) {
                    result.push('</ul>');
                    inList = false;
                }
                result.push(line);
            }
        }
        
        if (inList) {
            result.push('</ul>');
        }
        
        return result.join('\n');
    }

    parseEmojis(html) {
        const emojiMap = {
            ':rocket:': '🚀',
            ':clipboard:': '📋',
            ':graduation_cap:': '🎓',
            ':art:': '🎨',
            ':keyboard:': '⌨️',
            ':iphone:': '📱',
            ':moneybag:': '💰',
            ':package:': '📦',
            ':bar_chart:': '📊',
            ':link:': '🔗',
            ':gear:': '⚙️',
            ':arrows_counterclockwise:': '🔄',
            ':sparkles:': '✨',
            ':new:': '🆕',
            ':x:': '❌',
            ':white_check_mark:': '✅',
            ':warning:': '⚠️',
            ':shield:': '🛡️',
            ':computer:': '💻',
            ':books:': '📚',
            ':file_folder:': '📁'
        };

        Object.keys(emojiMap).forEach(emoji => {
            const regex = new RegExp(emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            html = html.replace(regex, `<span class="emoji">${emojiMap[emoji]}</span>`);
        });

        return html;
    }

    async showReadme() {
        try {
            Swal.fire({
                title: 'Carregando documentação...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
                background: '#0d1117',
                color: '#e6edf3'
            });

            const markdownContent = await this.loadReadmeContent();
            const htmlContent = this.parseMarkdown(markdownContent);

            Swal.close();

            const isMobile = window.innerWidth <= 768;
            const isSmallMobile = window.innerWidth <= 480;
            
            Swal.fire({
                title: isMobile ? 'Documentação' : 'OrganizaMEI - Documentação Completa',
                html: `<div class="readme-viewer">${htmlContent}</div>`,
                width: isSmallMobile ? '95%' : isMobile ? '92%' : '90%',
                showCloseButton: true,
                showConfirmButton: false,
                background: '#232b38',
                color: '#e2e8f0',
                customClass: {
                    popup: 'readme-popup'
                },
                ...(isMobile && {
                    heightAuto: false,
                    scrollbarPadding: false
                })
            });

        } catch (error) {
            Swal.close();
            
            Swal.fire({
                title: 'Erro',
                text: 'Não foi possível carregar a documentação. Verifique se o arquivo README.md existe na pasta docs/',
                icon: 'error',
                background: '#0d1117',
                color: '#e6edf3',
                confirmButtonColor: '#f85149'
            });
        }
    }

    static async show() {
        const viewer = new ReadmeViewer();
        await viewer.showReadme();
    }
}

// ===== MOBILE KEYBOARD HANDLER =====
(function() {
    'use strict';
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) return;
    
    let initialViewportHeight = window.innerHeight;
    let currentViewportHeight = window.innerHeight;
    let keyboardActive = false;
    
    function handleViewportChange() {
        currentViewportHeight = window.innerHeight;
        const heightDifference = initialViewportHeight - currentViewportHeight;
        const threshold = 150;
        
        const wasKeyboardActive = keyboardActive;
        keyboardActive = heightDifference > threshold;
        
        if (wasKeyboardActive !== keyboardActive) {
            const modals = document.querySelectorAll('.modal-bg:not(.modal-hidden)');
            
            modals.forEach(modal => {
                if (keyboardActive) {
                    modal.classList.add('keyboard-active');
                    const focusedInput = modal.querySelector('input:focus, textarea:focus, select:focus');
                    if (focusedInput) {
                        setTimeout(() => {
                            focusedInput.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'center' 
                            });
                        }, 300);
                    }
                } else {
                    modal.classList.remove('keyboard-active');
                }
            });
            
            console.log(`Teclado virtual ${keyboardActive ? 'ativo' : 'inativo'} - Altura: ${currentViewportHeight}px`);
        }
    }
    
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            initialViewportHeight = window.innerHeight;
            handleViewportChange();
        }, 500);
    });
    
    document.addEventListener('focusin', (e) => {
        if (e.target.matches('input, textarea, select')) {
            setTimeout(handleViewportChange, 300);
        }
    });
    
    document.addEventListener('focusout', (e) => {
        if (e.target.matches('input, textarea, select')) {
            setTimeout(handleViewportChange, 300);
        }
    });
    
    function optimizeModalInputs() {
        const modals = document.querySelectorAll('.modal-content');
        
        modals.forEach(modal => {
            const inputs = modal.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                if (input.type !== 'range' && input.type !== 'checkbox' && input.type !== 'radio') {
                    if (parseFloat(getComputedStyle(input).fontSize) < 16) {
                        input.style.fontSize = '16px';
                    }
                }
                
                input.addEventListener('focus', () => {
                    setTimeout(() => {
                        if (keyboardActive) {
                            input.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'center' 
                            });
                        }
                    }, 300);
                });
            });
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', optimizeModalInputs);
    } else {
        optimizeModalInputs();
    }
    
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && (node.classList?.contains('modal-bg') || node.querySelector?.('.modal-bg'))) {
                    setTimeout(optimizeModalInputs, 100);
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    function optimizeModalScroll() {
        const modals = document.querySelectorAll('.modal-content, .movimentacoes-container');
        
        modals.forEach(modal => {
            modal.style.scrollBehavior = 'smooth';
            modal.style.webkitOverflowScrolling = 'touch';
            modal.style.overscrollBehavior = 'contain';
        });
    }
    
    optimizeModalScroll();
    
    window.isMobileKeyboardActive = () => keyboardActive;
    window.recalculateKeyboardState = () => {
        setTimeout(handleViewportChange, 100);
    };
    
})();

// ===== GITHUB CHANGELOG VIEWER =====
class GitHubChangelogViewer {
    constructor() {
        this.owner = 'stefanoferrao';
        this.repo = 'OrganizaMEI';
        this.init();
    }

    init() {
        const btnChangelog = document.getElementById('btn-changelog');
        if (btnChangelog) {
            btnChangelog.addEventListener('click', (e) => {
                e.preventDefault();
                this.showChangelog();
            });
        }
    }

    async fetchCommits() {
        try {
            let allCommits = [];
            let page = 1;
            let hasMore = true;
            
            while (hasMore) {
                const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/commits?per_page=100&page=${page}`);
                if (!response.ok) throw new Error('Erro ao buscar commits');
                const commits = await response.json();
                
                if (commits.length === 0) {
                    hasMore = false;
                } else {
                    allCommits = allCommits.concat(commits);
                    page++;
                }
            }
            
            return allCommits.filter(commit => {
                const message = commit.commit.message;
                const lines = message.split('\n');
                const hasDetails = lines.length > 1 && lines.slice(1).some(line => line.trim());
                const isNotDelete = !message.toLowerCase().includes('delete') && !message.toLowerCase().includes('deleted');
                return hasDetails && isNotDelete;
            });
        } catch (error) {
            console.error('Erro:', error);
            throw error;
        }
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            year: 'numeric', month: 'long', day: 'numeric', 
            hour: '2-digit', minute: '2-digit'
        });
    }

    formatDetails(details) {
        const lines = details.split('\n').filter(line => line.trim());
        let html = '<div class="changelog-details">';
        
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('- ')) {
                html += `<div class="changelog-item-detail"><i class="fas fa-circle"></i>${trimmed.substring(2)}</div>`;
            } else {
                html += `<div class="changelog-text">${trimmed}</div>`;
            }
        });
        
        html += '</div>';
        return html;
    }

    generateHTML(commits) {
        let html = '<div class="changelog-container">';
        
        commits.forEach((commit, index) => {
            const fullMessage = commit.commit.message;
            const lines = fullMessage.split('\n');
            const title = lines[0];
            const details = lines.slice(1).filter(line => line.trim()).join('\n');
            const author = commit.commit.author.name;
            const date = this.formatDate(commit.commit.author.date);
            const sha = commit.sha.substring(0, 7);
            
            html += `
                <div class="changelog-item ${index === 0 ? 'latest' : ''}">
                    <div class="changelog-header">
                        <div class="changelog-version">
                            <i class="fas fa-code-branch"></i>
                            ${sha} ${index === 0 ? '<span class="latest-badge">Mais recente</span>' : ''}
                        </div>
                        <div class="changelog-date">
                            <i class="fas fa-calendar-alt"></i>
                            ${date}
                        </div>
                    </div>
                    <h3 class="changelog-title">${title}</h3>
                    ${details ? this.formatDetails(details) : ''}
                    <div class="changelog-author">
                        <i class="fas fa-user"></i>
                        Por: ${author}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    async showChangelog() {
        try {
            Swal.fire({
                title: 'Carregando atualizações...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
                background: '#232b38',
                color: '#e2e8f0'
            });

            const commits = await this.fetchCommits();
            const htmlContent = this.generateHTML(commits);

            Swal.close();

            const isMobile = window.innerWidth <= 768;
            
            Swal.fire({
                title: isMobile ? 'Atualizações' : 'OrganizaMEI - Últimas Atualizações',
                html: htmlContent,
                width: isMobile ? '95%' : '80%',
                showCloseButton: true,
                showConfirmButton: false,
                background: '#232b38',
                color: '#e2e8f0',
                customClass: { popup: 'changelog-popup' }
            });

        } catch (error) {
            Swal.close();
            Swal.fire({
                title: 'Erro',
                text: 'Não foi possível carregar as atualizações do GitHub.',
                icon: 'error',
                background: '#232b38',
                color: '#e2e8f0'
            });
        }
    }
}

// ===== INICIALIZAÇÃO =====
let shortcutSystem;

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        shortcutSystem = new ShortcutSystem();
        window.shortcutSystem = shortcutSystem;
        window.globalShortcuts = shortcutSystem;
        window.financeiroShortcuts = shortcutSystem;
        window.notificationQueue = shortcutSystem;
        
        new ReadmeViewer();
        new GitHubChangelogViewer();
        window.themeManager = new ThemeManager();
        
        // Inicializar navegação das abas de configurações
        initConfigTabs();
        
        // Garantir que a primeira aba esteja ativa após inicialização
        setTimeout(() => {
            const firstRadio = document.getElementById('tab-geral');
            const firstContent = document.getElementById('config-geral');
            if (firstRadio && firstContent && firstRadio.checked) {
                firstContent.classList.add('active');
            }
        }, 100);
        
        // Auto-iniciar tutorial para novos usuários
        const isFirstVisit = !localStorage.getItem('tutorial_completed') && 
                            !localStorage.getItem('produtos') && 
                            !localStorage.getItem('lancamentos');
        
        if (isFirstVisit) {
            setTimeout(() => {
                startTutorial();
            }, 1000);
        }
    }, 600);
});

window.startTutorial = startTutorial;

// ===== NAVEGAÇÃO ABAS CONFIGURAÇÕES =====
function initConfigTabs() {
    const configRadios = document.querySelectorAll('.tab-radio');
    const configContents = document.querySelectorAll('.config-tab-content');
    const tabLabels = document.querySelectorAll('.tab-label');
    
    // Adicionar eventos de change para os radio inputs
    configRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.checked) {
                const targetTab = radio.id.replace('tab-', '');
                
                // Remove active de todos os conteúdos
                configContents.forEach(c => c.classList.remove('active'));
                
                // Adiciona active no conteúdo correspondente
                const targetContent = document.getElementById(`config-${targetTab}`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            }
        });
    });
    
    // Adicionar eventos de click para os labels
    tabLabels.forEach((label, index) => {
        label.addEventListener('click', () => {
            const radioId = label.getAttribute('for');
            const radio = document.getElementById(radioId);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        });
        
        // Suporte para navegação por teclado
        label.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                label.click();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                const direction = e.key === 'ArrowRight' ? 1 : -1;
                const nextIndex = (index + direction + tabLabels.length) % tabLabels.length;
                tabLabels[nextIndex].focus();
                tabLabels[nextIndex].click();
            }
        });
        
        // Tornar labels focáveis
        label.setAttribute('tabindex', '0');
    });
    
    // Inicializar com a primeira aba ativa
    const firstRadio = document.getElementById('tab-geral');
    if (firstRadio && firstRadio.checked) {
        const firstContent = document.getElementById('config-geral');
        if (firstContent) {
            firstContent.classList.add('active');
        }
    }
}

// Inicializar navegação das abas quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConfigTabs);
} else {
    initConfigTabs();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ReadmeViewer();
    });
} else {
    new ReadmeViewer();
}

window.ReadmeViewer = ReadmeViewer;

// ===== THEME MANAGER =====
class ThemeManager {
    constructor() {
        this.themes = {
            'default': {
                name: 'Default',
                file: 'themes/desert.css'
            },
            'police': {
                name: 'Police - 𝐵𝑒𝑡𝑎',
                file: 'themes/police.css'
            },
            'office': {
                name: 'Office - 𝐵𝑒𝑡𝑎',
                file: 'themes/office.css'
            }
        };
        const savedTheme = localStorage.getItem('selectedTheme');
        if (savedTheme === 'desert') {
            localStorage.setItem('selectedTheme', 'default');
            this.currentTheme = 'default';
        } else {
            this.currentTheme = savedTheme || 'default';
        }
        this.init();
    }

    init() {
        this.loadTheme(this.currentTheme);
        this.setupThemeSelector();
    }

    loadTheme(themeId) {
        const existingTheme = document.getElementById('theme-css');
        if (existingTheme) {
            existingTheme.remove();
        }

        document.body.removeAttribute('data-theme');

        if (themeId !== 'default') {
            const link = document.createElement('link');
            link.id = 'theme-css';
            link.rel = 'stylesheet';
            link.href = this.themes[themeId].file;
            document.head.appendChild(link);
            
            document.body.setAttribute('data-theme', themeId);
        }

        this.currentTheme = themeId;
        localStorage.setItem('selectedTheme', themeId);
    }

    setupThemeSelector() {
        const container = document.getElementById('theme-selector-container');
        if (!container) return;

        let html = '<div class="theme-options">';
        
        Object.keys(this.themes).forEach(themeId => {
            const theme = this.themes[themeId];
            const isSelected = themeId === this.currentTheme;
            
            html += `
                <label class="theme-option ${isSelected ? 'selected' : ''}">
                    <input type="radio" name="theme" value="${themeId}" ${isSelected ? 'checked' : ''}>
                    <span class="theme-name">${theme.name}</span>
                    <div class="theme-preview theme-preview-${themeId}"></div>
                </label>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('input[name="theme"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.changeTheme(e.target.value);
            });
        });
    }

    changeTheme(themeId) {
        this.createTransitionOverlay();
        
        setTimeout(() => {
            this.loadTheme(themeId);
            this.updateThemeSelector(themeId);
            
            if (typeof mostrarNotificacaoSync === 'function') {
                mostrarNotificacaoSync(`Tema alterado para: ${this.themes[themeId].name}`, 'success');
            }
        }, 150);
    }
    
    createTransitionOverlay() {
        const existingOverlay = document.querySelector('.theme-transition-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'theme-transition-overlay';
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.classList.add('active');
        }, 10);
        
        setTimeout(() => {
            overlay.remove();
        }, 600);
    }

    updateThemeSelector(themeId) {
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`input[value="${themeId}"]`).closest('.theme-option');
        selectedOption.classList.add('selected');
    }
}

// ===== TUTORIAL ONBOARDING =====
class TutorialOnboarding {
    constructor() {
        this.currentStep = 0;
        this.steps = [
            {
                target: 'aside img',
                title: 'Bem-vindo ao OrganizaMEI! 🎉',
                content: 'Este é seu sistema de gestão completo para MEI. Vamos fazer um tour pelas 8 funcionalidades principais.',
                position: 'right'
            },
            {
                target: '.filtro-container',
                title: 'Filtros de Data 📅',
                content: 'Use estes filtros para visualizar dados de meses específicos. Muito útil para análises mensais!',
                position: 'right'
            },
            {
                target: 'nav button[onclick*="dashboard"]',
                title: 'Dashboard 📊',
                content: 'Aqui você tem uma visão geral do seu negócio: produtos, estoque, vendas e saldo.',
                position: 'right',
                action: () => changeTab('dashboard')
            },
            {
                target: '#dashboard-resumo',
                title: 'Resumo Financeiro 💰',
                content: 'Acompanhe seus números principais: receitas, despesas e saldo atual.',
                position: 'bottom'
            },
            {
                target: 'nav button[onclick*="estoque"]',
                title: 'Controle de Estoque 📦',
                content: 'Gerencie seus produtos e quantidades em estoque.',
                position: 'right',
                action: () => changeTab('estoque')
            },
            {
                target: '#estoque-form',
                title: 'Cadastro de Produtos 📝',
                content: 'Adicione novos produtos ao seu estoque aqui. Digite o nome e quantidade.',
                position: 'bottom'
            },
            {
                target: 'nav button[onclick*="financeiro"]',
                title: 'Gestão Financeira 💳',
                content: 'Registre todas suas receitas e despesas para controle completo.',
                position: 'right',
                action: () => changeTab('financeiro')
            },
            {
                target: '#financeiro-form',
                title: 'Lançamentos Financeiros 💸',
                content: 'Registre receitas e despesas com categorias organizadas. Essencial para seu controle!',
                position: 'bottom'
            },
            {
                target: 'nav button[onclick*="vendas"]',
                title: 'Histórico de Vendas 🛒',
                content: 'Visualize todas suas vendas registradas e acompanhe o desempenho.',
                position: 'right',
                action: () => changeTab('vendas')
            },
            {
                target: 'nav button[onclick*="categorias"]',
                title: 'Gestão de Categorias 🏷️',
                content: 'Organize suas receitas e despesas em categorias personalizadas. Essencial para relatórios precisos!',
                position: 'right',
                action: () => changeTab('categorias')
            },
            {
                target: '#lista-categorias',
                title: 'Categorias Organizadas 📋',
                content: 'Aqui você pode adicionar, editar e organizar suas categorias e subcategorias de receitas e despesas.',
                position: 'bottom'
            },
            {
                target: 'nav button[onclick*="graficos"]',
                title: 'Gráficos e Análises 📈',
                content: 'Visualize seus dados com mais de 15 tipos de gráficos diferentes para análise completa.',
                position: 'right',
                action: () => changeTab('graficos')
            },
            {
                target: '#tipo-grafico',
                title: 'Tipos de Gráficos 📊',
                content: 'Escolha entre gráficos de linha, pizza e relatórios DRE. Use as setas ↑↓ para navegar rapidamente!',
                position: 'bottom'
            },
            {
                target: 'nav button[onclick*="relatorios"]',
                title: 'Relatórios Detalhados 📄',
                content: 'Gere relatórios DRE completos e exporte para Excel. Perfeito para análises financeiras!',
                position: 'right',
                action: () => changeTab('relatorios')
            },
            {
                target: '#relatorios-content',
                title: 'DRE e Exportação 💼',
                content: 'Demonstrativo do Resultado do Exercício com exportação para Excel. Ideal para contabilidade!',
                position: 'bottom'
            },
            {
                target: 'nav button[onclick*="configuracoes"]',
                title: 'Configurações ⚙️',
                content: 'Configure integrações, exporte dados e acesse documentação.',
                position: 'right',
                action: () => changeTab('configuracoes')
            },
            {
                target: 'body',
                title: 'Pronto para começar! 🚀',
                content: 'Agora você conhece todas as 8 funcionalidades principais: Dashboard, Estoque, Financeiro, Vendas, Categorias, Gráficos, Relatórios e Configurações. Comece cadastrando alguns produtos no estoque!',
                position: 'center'
            }
        ];
        this.overlay = null;
        this.tooltip = null;
    }

    start() {
        if (this.isCompleted()) {
            this.showWelcomeBack();
            return;
        }
        
        this.createOverlay();
        this.showStep(0);
    }

    isCompleted() {
        return localStorage.getItem('tutorial_completed') === 'true';
    }

    markCompleted() {
        localStorage.setItem('tutorial_completed', 'true');
    }

    showWelcomeBack() {
        Swal.fire({
            title: 'Bem-vindo de volta! 👋',
            text: 'Deseja refazer o tutorial ou continuar usando o sistema?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Refazer Tutorial',
            cancelButtonText: 'Continuar',
            confirmButtonColor: '#38a169',
            cancelButtonColor: '#4a5568',
            background: '#232b38',
            color: '#e2e8f0'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('tutorial_completed');
                this.start();
            }
        });
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'tutorial-overlay';
        this.overlay.innerHTML = `
            <div class="tutorial-controls">
                <button class="tutorial-btn tutorial-skip">Pular Tutorial</button>
                <div class="tutorial-progress">
                    <span class="tutorial-step-counter">1 de ${this.steps.length}</span>
                    <div class="tutorial-progress-bar">
                        <div class="tutorial-progress-fill"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(this.overlay);

        this.overlay.querySelector('.tutorial-skip').onclick = () => this.skip();
    }

    showStep(stepIndex) {
        if (stepIndex >= this.steps.length) {
            this.complete();
            return;
        }

        this.currentStep = stepIndex;
        const step = this.steps[stepIndex];

        if (step.action) {
            step.action();
            setTimeout(() => this.displayStep(step), 300);
        } else {
            this.displayStep(step);
        }
    }

    displayStep(step) {
        this.removeTooltip();
        this.highlightElement(step.target);
        this.createTooltip(step);
        this.updateProgress();
    }

    highlightElement(selector) {
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });

        const element = document.querySelector(selector);
        if (element) {
            element.classList.add('tutorial-highlight');
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    createTooltip(step) {
        this.tooltip = document.createElement('div');
        this.tooltip.className = `tutorial-tooltip tutorial-tooltip-${step.position}`;
        
        this.tooltip.innerHTML = `
            <div class="tutorial-tooltip-content">
                <h3 class="tutorial-tooltip-title">${step.title}</h3>
                <p class="tutorial-tooltip-text">${step.content}</p>
                <div class="tutorial-tooltip-actions">
                    ${this.currentStep > 0 ? '<button class="tutorial-btn tutorial-prev">Anterior</button>' : ''}
                    <button class="tutorial-btn tutorial-next">
                        ${this.currentStep === this.steps.length - 1 ? 'Finalizar' : 'Próximo'}
                    </button>
                </div>
            </div>
            <div class="tutorial-tooltip-arrow"></div>
        `;

        document.body.appendChild(this.tooltip);
        this.positionTooltip(step);

        const nextBtn = this.tooltip.querySelector('.tutorial-next');
        const prevBtn = this.tooltip.querySelector('.tutorial-prev');
        
        if (nextBtn) nextBtn.onclick = () => this.next();
        if (prevBtn) prevBtn.onclick = () => this.previous();
    }

    positionTooltip(step) {
        const element = document.querySelector(step.target);
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const tooltip = this.tooltip;
        
        setTimeout(() => {
            const tooltipRect = tooltip.getBoundingClientRect();
            let top, left;

            switch (step.position) {
                case 'right':
                    top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                    left = rect.right + 20;
                    break;
                case 'left':
                    top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                    left = rect.left - tooltipRect.width - 20;
                    break;
                case 'bottom':
                    top = rect.bottom + 20;
                    left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                    break;
                case 'top':
                    top = rect.top - tooltipRect.height - 20;
                    left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                    break;
                case 'center':
                    top = window.innerHeight / 2 - tooltipRect.height / 2;
                    left = window.innerWidth / 2 - tooltipRect.width / 2;
                    break;
            }

            if (left < 10) left = 10;
            if (left + tooltipRect.width > window.innerWidth - 10) {
                left = window.innerWidth - tooltipRect.width - 10;
            }
            if (top < 10) top = 10;
            if (top + tooltipRect.height > window.innerHeight - 10) {
                top = window.innerHeight - tooltipRect.height - 10;
            }

            tooltip.style.top = top + 'px';
            tooltip.style.left = left + 'px';
        }, 10);
    }

    updateProgress() {
        const counter = this.overlay.querySelector('.tutorial-step-counter');
        const progressFill = this.overlay.querySelector('.tutorial-progress-fill');
        
        counter.textContent = `${this.currentStep + 1} de ${this.steps.length}`;
        progressFill.style.width = `${((this.currentStep + 1) / this.steps.length) * 100}%`;
    }

    next() {
        this.showStep(this.currentStep + 1);
    }

    previous() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }

    skip() {
        Swal.fire({
            title: 'Pular Tutorial?',
            text: 'Você pode refazê-lo depois nas configurações.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sim, pular',
            cancelButtonText: 'Continuar',
            confirmButtonColor: '#e53e3e',
            cancelButtonColor: '#38a169',
            background: '#232b38',
            color: '#e2e8f0',
            customClass: {
                container: 'swal-tutorial-container'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.complete();
            }
        });
    }

    complete() {
        this.cleanup();
        this.markCompleted();
        
        Swal.fire({
            title: 'Tutorial Concluído! 🎉',
            text: 'Agora você está pronto para usar o OrganizaMEI. Comece cadastrando seus produtos!',
            icon: 'success',
            confirmButtonText: 'Começar a usar',
            confirmButtonColor: '#38a169',
            background: '#232b38',
            color: '#e2e8f0'
        }).then(() => {
            changeTab('estoque');
        });
    }

    removeTooltip() {
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
    }

    cleanup() {
        this.removeTooltip();
        
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }

        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
    }
}

function startTutorial() {
    if (window.tutorial) {
        window.tutorial.cleanup();
    }
    window.tutorial = new TutorialOnboarding();
    window.tutorial.start();
}