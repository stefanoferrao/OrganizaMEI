// Tutorial Interativo - OrganizaMEI
class TutorialOnboarding {
  constructor() {
    this.currentStep = 0;
    this.steps = [
      {
        target: 'aside img',
        title: 'Bem-vindo ao OrganizaMEI! 🎉',
        content: 'Este é seu sistema de gestão completo para MEI. Vamos fazer um tour rápido pelas principais funcionalidades.',
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
        target: 'nav button[onclick*="graficos"]',
        title: 'Relatórios e Gráficos 📈',
        content: 'Analise seu negócio com gráficos detalhados e relatórios DRE.',
        position: 'right',
        action: () => changeTab('graficos')
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
        content: 'Agora você conhece as principais funcionalidades. Comece cadastrando alguns produtos no estoque!',
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

    // Executar ação se existir
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
    // Remove highlight anterior
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });

    // Adiciona novo highlight
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

    // Event listeners
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

      // Ajustar se sair da tela
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

    // Remove highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
  }
}

// Inicializar tutorial
let tutorial = null;

function startTutorial() {
  if (tutorial) {
    tutorial.cleanup();
  }
  tutorial = new TutorialOnboarding();
  tutorial.start();
}

// Auto-iniciar para novos usuários
document.addEventListener('DOMContentLoaded', function() {
  // Verificar se é primeira visita
  const isFirstVisit = !localStorage.getItem('tutorial_completed') && 
                      !localStorage.getItem('produtos') && 
                      !localStorage.getItem('lancamentos');
  
  if (isFirstVisit) {
    setTimeout(() => {
      startTutorial();
    }, 1000);
  }
});

// Expor função globalmente
window.startTutorial = startTutorial;