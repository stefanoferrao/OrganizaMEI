// Sistema Unificado de Atalhos e Notificações

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
            'ArrowLeft': () => this.selectReceita(),
            'ArrowRight': () => this.selectDespesa(),
            'Enter': () => this.submitForm(),
            'Escape': () => this.clearForm()
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
        this.form = document.getElementById('financeiro-form');
        if (this.form) {
            this.setupFields();
            this.setupFieldListeners();
        }
        
        this.setupEventListeners();
        this.setupConfigListeners();
        console.log('Sistema unificado de atalhos inicializado');
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
            
            // Atalhos globais
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
            
            // Atalhos do financeiro (apenas na aba financeiro)
            if (this.isFinanceiroTabActive()) {
                const financeiroShortcut = this.financeiroShortcuts[e.key];
                if (financeiroShortcut) {
                    e.preventDefault();
                    financeiroShortcut();
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
        radioButtons.forEach(radio => {
            radio.addEventListener('keydown', (e) => {
                if (!this.isEnabled) return;
                
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.toggleTipo();
                }
            });
        });
    }

    // Ações dos atalhos globais
    refreshPage() {}

    navigateToTab(tabId) {
        if (typeof changeTab === 'function') {
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

    // Ações dos atalhos do financeiro
    selectReceita() {
        const form = document.getElementById('financeiro-form');
        const receitaRadio = document.getElementById('tipo-receita');
        const receitaLabel = document.querySelector('.receita-label');
        
        if (form && receitaRadio && receitaLabel) {
            form.focus();
            receitaRadio.checked = true;
            receitaLabel.focus();
            
            const event = new Event('change', { bubbles: true });
            receitaRadio.dispatchEvent(event);
            
            this.showNotification('Receita selecionada', 'field');
        }
    }

    selectDespesa() {
        const form = document.getElementById('financeiro-form');
        const despesaRadio = document.getElementById('tipo-despesa');
        const despesaLabel = document.querySelector('.despesa-label');
        
        if (form && despesaRadio && despesaLabel) {
            form.focus();
            despesaRadio.checked = true;
            despesaLabel.focus();
            
            const event = new Event('change', { bubbles: true });
            despesaRadio.dispatchEvent(event);
            
            this.showNotification('Despesa selecionada', 'field');
        }
    }

    submitForm() {
        const submitBtn = this.form?.querySelector('button[type="submit"]');
        if (submitBtn && !submitBtn.disabled) {
            submitBtn.click();
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

    // Utilitários
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

    toggleTipo() {
        const receita = document.getElementById('tipo-receita');
        const despesa = document.getElementById('tipo-despesa');
        
        if (receita.checked) {
            this.selectDespesa();
        } else {
            this.selectReceita();
        }
    }

    isFinanceiroTabActive() {
        const financeiroTab = document.getElementById('financeiro');
        return financeiroTab && financeiroTab.classList.contains('active');
    }

    // Sistema de notificações
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

    // Configurações
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
        
        // Configurar estado inicial
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
        
        // Clique no cabeçalho para expandir/colapsar
        if (header && content && arrow) {
            // Restaurar estado salvo
            const savedState = this.loadHeaderState();
            content.style.display = savedState ? 'block' : 'none';
            arrow.classList.toggle('rotated', savedState);
            
            header.addEventListener('click', () => {
                const isVisible = content.style.display !== 'none';
                const newState = !isVisible;
                content.style.display = newState ? 'block' : 'none';
                arrow.classList.toggle('rotated', newState);
                
                // Salvar novo estado
                this.saveHeaderState(newState);
                
                // Atualizar shortcuts-info baseado no estado dos atalhos
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
            // Usar estado salvo do header
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

// Inicializar sistema unificado
let shortcutSystem;

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        shortcutSystem = new ShortcutSystem();
        window.shortcutSystem = shortcutSystem;
        window.globalShortcuts = shortcutSystem;
        window.financeiroShortcuts = shortcutSystem;
        window.notificationQueue = shortcutSystem;
    }, 600);
});