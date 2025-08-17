// Sistema de Integridade de Dados - OrganizaMEI
// Detecta e corrige problemas de sincronização

// Função para verificar integridade dos dados
function verificarIntegridadeDados() {
    const lancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');
    const produtos = JSON.parse(localStorage.getItem('produtos') || '[]');
    const movimentacoes = JSON.parse(localStorage.getItem('movimentacoesEstoque') || '[]');
    const url = localStorage.getItem('googleSheetsWebAppUrl');
    
    const problemas = [];
    
    // Verificar se há URL configurada mas dados vazios
    if (url && !url.includes('*')) {
        if (lancamentos.length === 0) {
            problemas.push('Lançamentos financeiros vazios');
        }
        
        if (produtos.length === 0 && movimentacoes.length === 0) {
            problemas.push('Estoque vazio');
        }
        
        // Verificar inconsistência entre produtos e movimentações
        if (produtos.length > 0 && movimentacoes.length === 0) {
            problemas.push('Produtos sem movimentações correspondentes');
        }
    }
    
    return {
        temProblemas: problemas.length > 0,
        problemas: problemas,
        dadosVazios: lancamentos.length === 0 && produtos.length === 0
    };
}

// Função para corrigir problemas de sincronização
async function corrigirProblemasSincronizacao() {
    const url = localStorage.getItem('googleSheetsWebAppUrl');
    
    if (!url || url.includes('*')) {
        console.log('URL não configurada, não é possível corrigir');
        return false;
    }
    
    try {
        console.log('=== INICIANDO CORREÇÃO DE PROBLEMAS ===');
        
        if (typeof mostrarNotificacaoSync === 'function') {
            mostrarNotificacaoSync('Corrigindo problemas de sincronização...', 'info');
        }
        
        // Forçar ressincronização completa
        if (typeof sincronizarTudo === 'function') {
            await sincronizarTudo();
            
            // Aguardar um pouco e verificar novamente
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const verificacao = verificarIntegridadeDados();
            
            if (!verificacao.temProblemas) {
                if (typeof mostrarNotificacaoSync === 'function') {
                    mostrarNotificacaoSync('Problemas corrigidos com sucesso!', 'success');
                }
                return true;
            } else {
                console.warn('Ainda há problemas após correção:', verificacao.problemas);
                return false;
            }
        }
        
    } catch (error) {
        console.error('Erro ao corrigir problemas:', error);
        if (typeof mostrarNotificacaoSync === 'function') {
            mostrarNotificacaoSync('Erro na correção: ' + error.message, 'error');
        }
        return false;
    }
}

// Função para monitorar integridade periodicamente
function iniciarMonitoramentoIntegridade() {
    // Verificar integridade a cada 5 minutos
    setInterval(() => {
        const verificacao = verificarIntegridadeDados();
        
        if (verificacao.temProblemas) {
            console.warn('Problemas de integridade detectados:', verificacao.problemas);
            
            // Se os dados estão completamente vazios, tentar corrigir automaticamente
            if (verificacao.dadosVazios) {
                console.log('Dados completamente vazios, tentando correção automática...');
                corrigirProblemasSincronizacao();
            }
        }
    }, 300000); // 5 minutos
}

// Função para verificar na inicialização
function verificarIntegridadeInicializacao() {
    setTimeout(() => {
        const verificacao = verificarIntegridadeDados();
        
        if (verificacao.temProblemas) {
            console.log('Problemas detectados na inicialização:', verificacao.problemas);
            
            // Se dados estão vazios, mostrar notificação e tentar corrigir
            if (verificacao.dadosVazios) {
                if (typeof mostrarNotificacaoSync === 'function') {
                    mostrarNotificacaoSync('Dados não encontrados, sincronizando...', 'warning');
                }
                
                setTimeout(() => {
                    corrigirProblemasSincronizacao();
                }, 1000);
            }
        } else {
            console.log('Integridade dos dados OK');
        }
    }, 3000);
}

// Expor funções globalmente
window.verificarIntegridadeDados = verificarIntegridadeDados;
window.corrigirProblemasSincronizacao = corrigirProblemasSincronizacao;
window.iniciarMonitoramentoIntegridade = iniciarMonitoramentoIntegridade;
window.verificarIntegridadeInicializacao = verificarIntegridadeInicializacao;

// Inicializar monitoramento quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Verificar integridade na inicialização
    verificarIntegridadeInicializacao();
    
    // Iniciar monitoramento periódico
    iniciarMonitoramentoIntegridade();
});