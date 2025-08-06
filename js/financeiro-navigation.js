// Navegação nativa tipo planilha para formulário financeiro
class FinanceiroNavigation {
    constructor() {
        this.form = null;
        this.fields = [];
        this.isActive = false;
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
        if (!this.form) return;

        this.setupFields();
        this.setupEventListeners();
    }

    setupFields() {
        this.fields = [
            () => document.querySelector('input[name="tipo-lancamento"]:checked'),
            () => document.getElementById('categoria-lancamento'),
            () => document.getElementById('subcategoria-lancamento'),
            () => document.getElementById('descricao-lancamento'),
            () => document.getElementById('quantidade-lancamento'),
            () => document.getElementById('valor-lancamento'),
            () => document.getElementById('data-lancamento')
        ];
    }

    setupEventListeners() {
        // Ativar navegação ao clicar no formulário
        this.form.addEventListener('click', () => {
            this.isActive = true;
            this.form.classList.add('navigation-active');
        });

        // Desativar ao clicar fora
        document.addEventListener('click', (e) => {
            if (!this.form.contains(e.target)) {
                this.isActive = false;
                this.form.classList.remove('navigation-active');
            }
        });

        // Navegação com Tab/Enter nos campos
        this.fields.forEach((fieldFn, index) => {
            const field = fieldFn();
            if (!field) return;

            field.addEventListener('keydown', (e) => {
                if (!this.isActive) return;

                if (e.key === 'Tab') {
                    e.preventDefault();
                    this.focusNextField(index, e.shiftKey);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (index === this.fields.length - 1) {
                        this.submitAndReset();
                    } else {
                        this.focusNextField(index, false);
                    }
                }
            });
        });

        // Interceptar submit do formulário
        this.form.addEventListener('submit', (e) => {
            if (this.isActive) {
                e.preventDefault();
                this.submitAndReset();
            }
        });
    }

    focusNextField(currentIndex, reverse = false) {
        const direction = reverse ? -1 : 1;
        let nextIndex = currentIndex + direction;
        
        if (nextIndex < 0) nextIndex = this.fields.length - 1;
        if (nextIndex >= this.fields.length) nextIndex = 0;

        const nextField = this.fields[nextIndex]();
        if (nextField) {
            nextField.focus();
            if (nextField.select) nextField.select();
        }
    }

    submitAndReset() {
        // Trigger submit original
        const submitBtn = this.form.querySelector('button[type="submit"]');
        if (submitBtn && !submitBtn.disabled) {
            submitBtn.click();
            
            // Aguardar processamento e resetar para primeiro campo
            setTimeout(() => {
                this.resetToFirst();
            }, 100);
        }
    }

    resetToFirst() {
        // Focar no primeiro campo (tipo)
        const firstField = document.querySelector('input[name="tipo-lancamento"]:checked');
        if (firstField) {
            firstField.focus();
        }
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        new FinanceiroNavigation();
    }, 500);
});