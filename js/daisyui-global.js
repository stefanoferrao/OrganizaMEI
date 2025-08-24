// DaisyUI Global System - Alert Outline Style, Footer e outros componentes
// Sistema global DaisyUI com notificações, footer e outros componentes

class DaisyUINotifications {
  constructor() {
    this.container = null;
    this.notifications = [];
    this.init();
  }

  init() {
    // Criar container se não existir
    if (!this.container) {
      this.container = document.getElementById('daisyui-notification-container');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'daisyui-notification-container';
        document.body.appendChild(this.container);
      }
    }
    return this.container;
  }

  show(message, type = 'info') {
    const container = this.init();
    
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `daisyui-alert alert-${type} entering`;
    
    // Mapear ícones por tipo
    const iconMap = {
      'success': '<i class="fas fa-check-circle alert-icon"></i>',
      'error': '<i class="fas fa-exclamation-circle alert-icon"></i>',
      'warning': '<i class="fas fa-exclamation-triangle alert-icon"></i>',
      'info': '<i class="fas fa-info-circle alert-icon"></i>'
    };
    
    const icon = iconMap[type] || iconMap['info'];
    
    // Sanitizar mensagem
    const sanitizedMessage = message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
    
    notification.innerHTML = `
      ${icon}
      <span class="alert-text">${sanitizedMessage}</span>
    `;
    
    // Calcular posição inicial (fora da tela, no topo)
    const existingNotifications = container.querySelectorAll('.daisyui-alert');
    const topOffset = existingNotifications.length * 60;
    const startPosition = topOffset - 100;
    
    // Posicionar inicialmente fora da tela
    notification.style.cssText = `
      position: absolute;
      top: ${startPosition}px;
      width: 100%;
      box-sizing: border-box;
    `;
    
    container.appendChild(notification);
    this.notifications.push(notification);
    
    // Animar entrada - vem do topo
    setTimeout(() => {
      notification.classList.remove('entering');
      notification.classList.add('visible');
      notification.style.top = `${topOffset}px`;
    }, 10);
    
    // Animar saída após 3 segundos - volta para o topo
    setTimeout(() => {
      this.hideNotification(notification);
    }, 3000);
    
    return notification;
  }

  hideNotification(notification) {
    if (!notification || !notification.parentNode) return;
    
    // Animar saída - volta para o topo
    notification.classList.remove('visible');
    notification.classList.add('exiting');
    
    const currentTop = parseInt(notification.style.top);
    notification.style.top = `${currentTop - 100}px`;
    
    // Remover após animação
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
        
        // Remover da lista de notificações
        const index = this.notifications.indexOf(notification);
        if (index > -1) {
          this.notifications.splice(index, 1);
        }
        
        // Reposicionar notificações restantes
        this.repositionNotifications();
      }
    }, 400);
  }

  repositionNotifications() {
    const remainingNotifications = this.container.querySelectorAll('.daisyui-alert.visible');
    remainingNotifications.forEach((notif, index) => {
      notif.style.top = `${index * 60}px`;
    });
  }

  // Método para limpar todas as notificações
  clearAll() {
    this.notifications.forEach(notification => {
      if (notification.parentNode) {
        this.hideNotification(notification);
      }
    });
    this.notifications = [];
  }
}

// Instância global
window.DaisyUINotifications = new DaisyUINotifications();

// Função de compatibilidade para substituir mostrarNotificacaoSync
function mostrarNotificacaoSync(message, type = 'info') {
  return window.DaisyUINotifications.show(message, type);
}

// Aliases globais
window.showDaisyNotification = (message, type) => window.DaisyUINotifications.show(message, type);
window.daisyNotify = (message, type) => window.DaisyUINotifications.show(message, type);

// Expor função globalmente para compatibilidade
window.mostrarNotificacaoSync = mostrarNotificacaoSync;


// DaisyUI Status Indicator Functions
class DaisyUIStatusIndicator {
  constructor() {
    this.indicator = null;
    this.init();
  }

  init() {
    this.indicator = document.getElementById('daisyui-status-indicator');
    if (this.indicator) {
      this.indicator.addEventListener('click', () => {
        if (typeof changeTab === 'function') {
          changeTab('configuracoes');
        }
      });
    }
  }

  updateStatus(type) {
    if (this.indicator) {
      this.indicator.className = `daisyui-status-indicator ${type}`;
    }
  }
}

// Instância global
window.DaisyUIStatusIndicator = new DaisyUIStatusIndicator();

// Função de compatibilidade
function updateMiniIndicator(type) {
  return window.DaisyUIStatusIndicator.updateStatus(type);
}

// Expor função globalmente
window.updateMiniIndicator = updateMiniIndicator;

// 