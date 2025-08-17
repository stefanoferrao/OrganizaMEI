/* Mobile Keyboard Handler - Detecta e gerencia teclado virtual */

(function() {
    'use strict';
    
    // Detectar se é dispositivo móvel
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) return; // Só executar em dispositivos móveis
    
    let initialViewportHeight = window.innerHeight;
    let currentViewportHeight = window.innerHeight;
    let keyboardActive = false;
    
    // Função para detectar mudanças no viewport
    function handleViewportChange() {
        currentViewportHeight = window.innerHeight;
        const heightDifference = initialViewportHeight - currentViewportHeight;
        const threshold = 150; // Threshold para considerar que o teclado está ativo
        
        const wasKeyboardActive = keyboardActive;
        keyboardActive = heightDifference > threshold;
        
        // Se o estado mudou, aplicar/remover classes
        if (wasKeyboardActive !== keyboardActive) {
            const modals = document.querySelectorAll('.modal-bg:not(.modal-hidden)');
            
            modals.forEach(modal => {
                if (keyboardActive) {
                    modal.classList.add('keyboard-active');
                    // Scroll para o input focado se necessário
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
            
            // Debug log (remover em produção)
            console.log(`Teclado virtual ${keyboardActive ? 'ativo' : 'inativo'} - Altura: ${currentViewportHeight}px`);
        }
    }
    
    // Event listeners para mudanças no viewport
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            initialViewportHeight = window.innerHeight;
            handleViewportChange();
        }, 500);
    });
    
    // Detectar quando inputs recebem foco (adicional)
    document.addEventListener('focusin', (e) => {
        if (e.target.matches('input, textarea, select')) {
            setTimeout(handleViewportChange, 300);
        }
    });
    
    // Detectar quando inputs perdem foco
    document.addEventListener('focusout', (e) => {
        if (e.target.matches('input, textarea, select')) {
            setTimeout(handleViewportChange, 300);
        }
    });
    
    // Função para otimizar inputs em modais
    function optimizeModalInputs() {
        const modals = document.querySelectorAll('.modal-content');
        
        modals.forEach(modal => {
            const inputs = modal.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                // Prevenir zoom automático no iOS
                if (input.type !== 'range' && input.type !== 'checkbox' && input.type !== 'radio') {
                    if (parseFloat(getComputedStyle(input).fontSize) < 16) {
                        input.style.fontSize = '16px';
                    }
                }
                
                // Melhorar experiência de scroll quando input está focado
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
    
    // Executar otimizações quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', optimizeModalInputs);
    } else {
        optimizeModalInputs();
    }
    
    // Re-executar otimizações quando novos modais forem adicionados
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
    
    // Função para melhorar performance de scroll em modais
    function optimizeModalScroll() {
        const modals = document.querySelectorAll('.modal-content, .movimentacoes-container');
        
        modals.forEach(modal => {
            // Adicionar scroll suave
            modal.style.scrollBehavior = 'smooth';
            
            // Otimizar scroll em iOS
            modal.style.webkitOverflowScrolling = 'touch';
            
            // Prevenir bounce scroll
            modal.style.overscrollBehavior = 'contain';
        });
    }
    
    // Executar otimizações de scroll
    optimizeModalScroll();
    
    // Função utilitária para verificar se teclado está ativo (para uso externo)
    window.isMobileKeyboardActive = () => keyboardActive;
    
    // Função para forçar recálculo (para uso externo)
    window.recalculateKeyboardState = () => {
        setTimeout(handleViewportChange, 100);
    };
    
})();