// Gerenciador de Temas
class ThemeManager {
    constructor() {
        this.themes = {
            'default': {
                name: 'Default',
                file: 'themes/desert.css'
            },
            'police': {
                name: 'Police',
                file: 'themes/police.css'
            }
        };
        // Migração: converter 'desert' antigo para 'default'
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
        // Remove tema anterior
        const existingTheme = document.getElementById('theme-css');
        if (existingTheme) {
            existingTheme.remove();
        }

        // Remove atributo de tema anterior
        document.body.removeAttribute('data-theme');

        // Carrega novo tema
        if (themeId !== 'default') {
            const link = document.createElement('link');
            link.id = 'theme-css';
            link.rel = 'stylesheet';
            link.href = this.themes[themeId].file;
            document.head.appendChild(link);
            
            // Adiciona atributo data-theme ao body
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

        // Event listeners
        container.querySelectorAll('input[name="theme"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.changeTheme(e.target.value);
            });
        });
    }

    changeTheme(themeId) {
        // Criar overlay de transição
        this.createTransitionOverlay();
        
        // Aplicar tema após pequeno delay para suavizar transição
        setTimeout(() => {
            this.loadTheme(themeId);
            this.updateThemeSelector(themeId);
            
            // Feedback visual usando sistema existente
            if (typeof mostrarNotificacaoSync === 'function') {
                mostrarNotificacaoSync(`Tema alterado para: ${this.themes[themeId].name}`, 'success');
            }
        }, 150);
    }
    
    createTransitionOverlay() {
        // Remove overlay existente se houver
        const existingOverlay = document.querySelector('.theme-transition-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Cria novo overlay
        const overlay = document.createElement('div');
        overlay.className = 'theme-transition-overlay';
        document.body.appendChild(overlay);
        
        // Ativa animação
        setTimeout(() => {
            overlay.classList.add('active');
        }, 10);
        
        // Remove overlay após animação
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

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});