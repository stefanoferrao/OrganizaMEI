// Sistema de Loading Manager para OrganizaMEI
// Gerencia o bloqueio de interface durante sincronização

class LoadingManager {
  constructor() {
    this.isLoading = false;
    this.overlay = null;
    this.originalButtonStates = new Map();
    this.init();
  }

  init() {
    // Criar overlay de loading
    this.createOverlay();
    
    // Interceptar notificações de sincronização
    this.interceptSyncNotifications();
  }

  createOverlay() {
    // Remover overlay existente se houver
    const existingOverlay = document.getElementById('sync-loading-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Criar novo overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'sync-loading-overlay';
    this.overlay.className = 'loading-overlay sync-loading-overlay';
    
    this.overlay.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text pulse">Sincronizando dados...</div>
        <div class="loading-subtext">Aguarde, não feche esta janela</div>
        <div class="loading-progress">
          <div class="loading-progress-bar"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.overlay);
  }

  showLoading(message = 'Sincronizando dados...', subtext = 'Aguarde, não feche esta janela') {
    if (this.isLoading) return;
    
    this.isLoading = true;
    
    // Atualizar textos
    const loadingText = this.overlay.querySelector('.loading-text');
    const loadingSubtext = this.overlay.querySelector('.loading-subtext');
    
    if (loadingText) loadingText.textContent = message;
    if (loadingSubtext) loadingSubtext.textContent = subtext;
    
    // Resetar progresso
    this.updateProgress(0);
    
    // Mostrar overlay
    this.overlay.classList.add('active', 'fade-in');
    
    // Bloquear todos os botões e inputs
    this.disableAllInteractions();
    
    // Prevenir scroll
    document.body.style.overflow = 'hidden';
  }

  hideLoading() {
    if (!this.isLoading) return;
    
    this.isLoading = false;
    
    // Esconder overlay
    this.overlay.classList.remove('active', 'fade-in');
    
    // Reabilitar interações
    this.enableAllInteractions();
    
    // Restaurar scroll
    document.body.style.overflow = '';
  }

  disableAllInteractions() {
    // Salvar estados originais e desabilitar botões
    const buttons = document.querySelectorAll('button');
    const inputs = document.querySelectorAll('input');
    const selects = document.querySelectorAll('select');
    
    buttons.forEach(button => {
      this.originalButtonStates.set(button, button.disabled);
      button.disabled = true;
    });
    
    inputs.forEach(input => {
      this.originalButtonStates.set(input, input.disabled);
      input.disabled = true;
    });
    
    selects.forEach(select => {
      this.originalButtonStates.set(select, select.disabled);
      select.disabled = true;
    });
  }

  enableAllInteractions() {
    // Restaurar estados originais
    this.originalButtonStates.forEach((originalState, element) => {
      element.disabled = originalState;
    });
    
    this.originalButtonStates.clear();
  }

  interceptSyncNotifications() {
    // Interceptar a função mostrarNotificacaoSync original
    const originalMostrarNotificacao = window.mostrarNotificacaoSync;
    
    if (originalMostrarNotificacao) {
      window.mostrarNotificacaoSync = (message, type) => {
        // Verificar se é uma mensagem de sincronização
        if (message && message.includes('sincronizando') && type === 'info') {
          this.showLoading('Dados desatualizados - sincronizando...', 'Por favor, aguarde a conclusão');
        } else if (message && (message.includes('sincronizado') || message.includes('sucesso')) && type === 'success') {
          this.updateProgress(100, 'Sincronização concluída!');
          setTimeout(() => this.hideLoading(), 800);
        } else if (type === 'error') {
          this.hideLoading();
        }
        
        // Chamar função original
        originalMostrarNotificacao(message, type);
      };
    }
    
    // Interceptar função showProgress do sheets-integration.js
    const originalShowProgress = window.showProgress;
    if (originalShowProgress) {
      window.showProgress = (message) => {
        if (this.isLoading) {
          // Mapear mensagens para percentuais
          let percentage = 10;
          if (message.includes('Conectando')) percentage = 20;
          else if (message.includes('Processando')) percentage = 40;
          else if (message.includes('estoque')) percentage = 60;
          else if (message.includes('Atualizando')) percentage = 80;
          else if (message.includes('Finalizando')) percentage = 95;
          
          this.updateProgress(percentage, message);
        }
        // Chamar função original
        originalShowProgress(message);
      };
    }
  }

  // Atualizar progresso da barra
  updateProgress(percentage, message) {
    const progressBar = this.overlay.querySelector('.loading-progress-bar');
    const loadingText = this.overlay.querySelector('.loading-text');
    
    if (progressBar) {
      progressBar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
      progressBar.style.animation = 'none'; // Remove animação automática
    }
    
    if (message && loadingText) {
      loadingText.textContent = message;
    }
  }

  // Método para uso manual
  startSyncLoading() {
    this.showLoading('Dados desatualizados - sincronizando...', 'Por favor, aguarde a conclusão');
  }

  stopSyncLoading() {
    this.hideLoading();
  }

  // Verificar se está carregando
  isCurrentlyLoading() {
    return this.isLoading;
  }
}

// Instanciar o gerenciador globalmente
let loadingManager;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  loadingManager = new LoadingManager();
  
  // Expor globalmente para uso em outros arquivos
  window.loadingManager = loadingManager;
});

// Interceptar a função acionarSincronizacaoSeNecessario do main.js
document.addEventListener('DOMContentLoaded', function() {
  // Aguardar um pouco para garantir que o main.js foi carregado
  setTimeout(() => {
    const originalAcionarSincronizacao = window.acionarSincronizacaoSeNecessario;
    
    if (originalAcionarSincronizacao) {
      window.acionarSincronizacaoSeNecessario = async function() {
        // Verificar se os dados estão atualizados
        const dadosAtualizados = await verificarDadosAtualizados();
        
        if (!dadosAtualizados) {
          // Mostrar loading imediatamente
          if (loadingManager) {
            loadingManager.startSyncLoading();
          }
          
          // Chamar função original
          return originalAcionarSincronizacao.call(this);
        }
      };
    }
  }, 1000);
});

// Interceptar função sincronizarTudo para garantir loading
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    const originalSincronizarTudo = window.sincronizarTudo;
    
    if (originalSincronizarTudo) {
      window.sincronizarTudo = async function() {
        try {
          if (loadingManager) {
            loadingManager.startSyncLoading();
          }
          
          const result = await originalSincronizarTudo.call(this);
          
          // Aguardar um pouco antes de esconder o loading
          setTimeout(() => {
            if (loadingManager) {
              loadingManager.stopSyncLoading();
            }
          }, 1000);
          
          return result;
        } catch (error) {
          if (loadingManager) {
            loadingManager.stopSyncLoading();
          }
          throw error;
        }
      };
    }
  }, 1500);
});

// Interceptar sincronizarTudo para progresso detalhado
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    const originalSincronizarFinanceiro = window.sincronizarFinanceiro;
    
    if (originalSincronizarFinanceiro) {
      window.sincronizarFinanceiro = async function() {
        if (loadingManager && loadingManager.isCurrentlyLoading()) {
          loadingManager.updateProgress(10, 'Iniciando sincronização...');
          await new Promise(resolve => setTimeout(resolve, 300));
          
          loadingManager.updateProgress(25, 'Conectando com Google Sheets...');
          await new Promise(resolve => setTimeout(resolve, 400));
        }
        
        const result = await originalSincronizarFinanceiro.call(this);
        
        if (loadingManager && loadingManager.isCurrentlyLoading()) {
          loadingManager.updateProgress(90, 'Finalizando sincronização...');
        }
        
        return result;
      };
    }
  }, 2000);
});

// Expor funções globalmente
window.LoadingManager = LoadingManager;