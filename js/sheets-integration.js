// Integração com Google Sheets para YumMetrics - Guia Financeiro

// Função para gerar identificador único no formato DDMMAAAAHHMMSS
function gerarIdentificadorUnico() {
    const agora = new Date();
    const dia = String(agora.getDate()).padStart(2, '0');
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const ano = agora.getFullYear();
    const hora = String(agora.getHours()).padStart(2, '0');
    const minuto = String(agora.getMinutes()).padStart(2, '0');
    const segundo = String(agora.getSeconds()).padStart(2, '0');
    
    return `${dia}${mes}${ano}${hora}${minuto}${segundo}`;
}

// Salvar URL do Web App no localStorage
function saveWebAppUrl() {
    const url = document.getElementById('webAppUrl').value.trim();
    if (!url) {
        updateSyncStatus('Por favor, insira uma URL válida', 'error');
        return;
    }
    
    localStorage.setItem('googleSheetsWebAppUrl', url);
    document.getElementById('urlStatus').innerHTML = '<span style="color: #38a169;">✓ URL salva com sucesso!</span>';
    updateSyncStatus('URL configurada', 'success');
    
    hideUrlWithAsterisks();
}

// Recuperar URL salva
function getWebAppUrl() {
    const url = localStorage.getItem('googleSheetsWebAppUrl');
    if (url) {
        hideUrlWithAsterisks();
        document.getElementById('urlStatus').innerHTML = '<span style="color: #38a169;">✓ URL carregada</span>';
    }
    return url;
}

// Ocultar URL com asteriscos
function hideUrlWithAsterisks() {
    const urlInput = document.getElementById('webAppUrl');
    const url = localStorage.getItem('googleSheetsWebAppUrl');
    if (url && urlInput) {
        urlInput.value = '*'.repeat(Math.min(url.length, 50)); // Limitar asteriscos para melhor visualização
        urlInput.dataset.realUrl = url;
    }
}

// Mostrar URL real para edição
function showRealUrl() {
    const urlInput = document.getElementById('webAppUrl');
    const realUrl = urlInput.dataset.realUrl;
    if (realUrl) {
        urlInput.value = realUrl;
    }
}

// Verificar se deve usar URL real ou asteriscos
function getCurrentUrl() {
    // Sempre retornar a URL real do localStorage
    return localStorage.getItem('googleSheetsWebAppUrl');
}

// Função para atualizar status de sincronização
function updateSyncStatus(message, type) {
    const statusMain = document.getElementById('sync-status-main');
    const statusConfig = document.getElementById('sheets-status');
    
    if (statusMain) {
        statusMain.textContent = message;
        statusMain.className = `sync-status sync-${type}`;
    }
    
    if (statusConfig) {
        statusConfig.textContent = message;
        statusConfig.className = `sheets-status ${type}`;
    }
}

// Atualizar indicador visual de sincronização
function updateSyncIndicator(type) {
    const indicator = document.getElementById('sync-indicator');
    const icon = indicator?.querySelector('.sync-icon');
    const text = indicator?.querySelector('.sync-text');
    
    if (indicator && icon) {
        indicator.className = `sync-indicator sync-${type}`;
        
        switch(type) {
            case 'success':
                icon.textContent = '✅';
                if (text) text.textContent = 'Sincronizado';
                break;
            case 'error':
                icon.textContent = '❌';
                if (text) text.textContent = 'Não sincronizado';
                break;
            case 'syncing':
                icon.textContent = '🔄';
                if (text) text.textContent = 'Sincronizando...';
                break;
            default:
                icon.textContent = '⚠️';
                if (text) text.textContent = 'Status desconhecido';
        }
    }
}

// Mostrar barra de progresso
function showProgress(message) {
    const progress = document.getElementById('sync-progress');
    const text = progress?.querySelector('.progress-text');
    
    if (progress && text) {
        progress.style.display = 'block';
        text.textContent = message;
    }
}

// Ocultar barra de progresso
function hideProgress() {
    const progress = document.getElementById('sync-progress');
    if (progress) {
        progress.style.display = 'none';
    }
}

// Sincronizar dados do Google Sheets para a plataforma (apenas leitura)
async function sincronizarFinanceiro() {
    const url = getCurrentUrl();
    if (!url || url.includes('*')) {
        updateSyncStatus('Configure a URL do Web App primeiro!', 'error');
        hideProgress();
        return;
    }

    try {
        showProgress('Conectando com Google Sheets...');
        updateSyncStatus('Sincronizando...', 'syncing');
        
        // Aguardar um pouco para mostrar o progresso
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Obter dados da planilha
        console.log('Fazendo requisição para:', url + '?action=read');
        const responseRead = await fetch(url + '?action=read', { method: 'GET', mode: 'cors' });
        const resultRead = await responseRead.json();
        
        if (!resultRead.success) {
            updateSyncStatus('Erro ao ler planilha', 'error');
            hideProgress();
            return;
        }
        
        showProgress('Processando dados...');
        await new Promise(resolve => setTimeout(resolve, 600));
        
        const dadosPlanilha = resultRead.data || [];
        
        // Substituir dados locais pelos dados da planilha
        const lancamentosSincronizados = dadosPlanilha.map(item => ({
            id: item.id,
            tipo: item.tipo,
            categoria: item.categoria,
            subcategoria: item.subcategoria,
            descricao: item.descricao,
            quantidade: item.quantidade || 1,
            valor: item.valor,
            data: item.data instanceof Date ? item.data.toLocaleDateString('pt-BR') : item.data
        }));
        
        // Salvar dados sincronizados
        localStorage.setItem('lancamentos', JSON.stringify(lancamentosSincronizados));
        
        // Atualizar variável global lancamentos
        if (typeof window.lancamentos !== 'undefined') {
            window.lancamentos.length = 0;
            window.lancamentos.push(...lancamentosSincronizados);
        }
        
        showProgress('Atualizando interface...');
        await new Promise(resolve => setTimeout(resolve, 700));
        
        // Forçar atualização completa da interface
        // Recarregar dados do localStorage
        const novosLancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');
        if (typeof window.lancamentos !== 'undefined') {
            window.lancamentos.length = 0;
            window.lancamentos.push(...novosLancamentos);
        }
        
        // Atualizar todas as interfaces
        if (typeof renderizarLancamentos === 'function') renderizarLancamentos();
        if (typeof renderizarDashboardResumo === 'function') renderizarDashboardResumo();
        if (typeof renderizarVendas === 'function') renderizarVendas();
        if (typeof renderizarResumoFinanceiro === 'function') renderizarResumoFinanceiro();
        if (typeof atualizarFiltroMesAno === 'function') atualizarFiltroMesAno();
        
        showProgress('Finalizando...');
        await new Promise(resolve => setTimeout(resolve, 400));
        
        updateSyncStatus('Sincronizado', 'success');
        updateSyncIndicator('success');
        hideProgress();
        
        // Aguardar 1500ms para compatibilidade com atualização dos dados
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        updateSyncStatus(`${dadosPlanilha.length} registros importados`, 'success');
        
        // Recarregar a página para garantir atualização completa
        window.location.reload();
        
    } catch (error) {
        updateSyncStatus('Erro na sincronização', 'error');
        updateSyncIndicator('error');
        hideProgress();
    }
}

// Adicionar lançamento ao Google Sheets
async function adicionarLancamentoSheets(lancamento) {
    const url = getCurrentUrl();
    if (!url || url.includes('*')) return false;

    try {
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'insert',
                data: {
                    id: lancamento.id,
                    tipo: lancamento.tipo,
                    categoria: lancamento.categoria,
                    subcategoria: lancamento.subcategoria,
                    descricao: lancamento.descricao,
                    quantidade: lancamento.quantidade || 1,
                    valor: lancamento.valor,
                    data: lancamento.data
                }
            })
        });
        
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Erro ao adicionar no Google Sheets:', error);
        return false;
    }
}

// Excluir lançamento do Google Sheets
async function excluirLancamentoSheets(id) {
    const url = getCurrentUrl();
    if (!url || url.includes('*')) {
        console.log('URL não configurada para exclusão');
        return false;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'delete',
                id: id
            })
        });
        
        if (!response.ok) {
            console.error('Resposta HTTP não OK:', response.status);
            return false;
        }
        
        const result = await response.json();
        console.log('Resultado da exclusão:', result);
        return result.success === true;
    } catch (error) {
        console.error('Erro ao excluir do Google Sheets:', error);
        return false;
    }
}

// Mostrar status das operações
function showSheetsStatus(message, type) {
    updateSyncStatus(message, type);
}

// Função para limpar URL do Web App
function clearWebAppUrl() {
    localStorage.removeItem('googleSheetsWebAppUrl');
    document.getElementById('webAppUrl').value = '';
    document.getElementById('urlStatus').innerHTML = '<span style="color: #e53e3e;">URL removida</span>';
    updateSyncStatus('Não configurado', 'error');
    updateSyncIndicator('error');
}

// Função para enviar todos os dados do OrganizaMEI para o Google Sheets
async function enviarTodosDados() {
    const url = getCurrentUrl();
    if (!url || url.includes('*')) {
        updateSyncStatus('Configure a URL do Web App primeiro!', 'error');
        return;
    }

    try {
        showProgress('Preparando dados...');
        updateSyncStatus('Enviando dados...', 'syncing');
        updateSyncIndicator('syncing');
        
        const lancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');
        
        if (lancamentos.length === 0) {
            updateSyncStatus('Nenhum dado para enviar', 'error');
            hideProgress();
            return;
        }
        
        // Garantir que todos os lançamentos tenham ID
        const lancamentosComID = lancamentos.map(lancamento => ({
            ...lancamento,
            id: lancamento.id || gerarIdentificadorUnico()
        }));
        
        showProgress(`Enviando ${lancamentosComID.length} registros...`);
        
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'insertBatch',
                data: lancamentosComID
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Atualizar localStorage com os IDs gerados
            localStorage.setItem('lancamentos', JSON.stringify(lancamentosComID));
            
            updateSyncStatus(`${result.inserted || lancamentosComID.length} registros enviados`, 'success');
            updateSyncIndicator('success');
        } else {
            updateSyncStatus('Erro ao enviar dados', 'error');
            updateSyncIndicator('error');
        }
        
        hideProgress();
    } catch (error) {
        console.error('Erro ao enviar dados:', error);
        updateSyncStatus('Erro na conexão', 'error');
        updateSyncIndicator('error');
        hideProgress();
    }
}

// Função para adicionar IDs aos lançamentos existentes que não possuem
function adicionarIDsLancamentosExistentes() {
    const lancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');
    let modificado = false;
    
    lancamentos.forEach(lancamento => {
        if (!lancamento.id) {
            lancamento.id = gerarIdentificadorUnico();
            modificado = true;
        }
    });
    
    if (modificado) {
        localStorage.setItem('lancamentos', JSON.stringify(lancamentos));
    }
}

// Inicializar integração ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    // Carregar URL salva
    getWebAppUrl();
    
    // Adicionar IDs aos lançamentos existentes
    adicionarIDsLancamentosExistentes();
    
    // Adicionar event listeners
    const saveUrlBtn = document.getElementById('btn-save-url');
    const clearUrlBtn = document.getElementById('btn-clear-url');
    const syncBtn = document.getElementById('btn-sync-financeiro');
    const enviarDadosBtn = document.getElementById('btn-enviar-dados');
    const urlInput = document.getElementById('webAppUrl');
    
    if (saveUrlBtn) saveUrlBtn.addEventListener('click', saveWebAppUrl);
    if (clearUrlBtn) clearUrlBtn.addEventListener('click', clearWebAppUrl);
    if (syncBtn) syncBtn.addEventListener('click', sincronizarFinanceiro);
    if (enviarDadosBtn) enviarDadosBtn.addEventListener('click', enviarTodosDados);
    
    // Mostrar URL real ao focar no campo
    if (urlInput) {
        urlInput.addEventListener('focus', showRealUrl);
        urlInput.addEventListener('blur', function() {
            if (localStorage.getItem('googleSheetsWebAppUrl')) {
                setTimeout(hideUrlWithAsterisks, 100);
            }
        });
    }
    
    // Verificar status inicial de sincronização
    const url = getCurrentUrl();
    if (url) {
        updateSyncIndicator('success');
        updateSyncStatus('Configurado', 'success');
    } else {
        updateSyncIndicator('error');
        updateSyncStatus('Não configurado', 'error');
    }
});

// Verificar status inicial de sincronização
function verificarStatusSincronizacao() {
    const url = getCurrentUrl();
    if (url && !url.includes('*')) {
        updateSyncIndicator('success');
    } else {
        updateSyncIndicator('error');
        // Mostrar aviso se não estiver configurado
        if (typeof mostrarAvisoImportacao === 'function') {
            setTimeout(() => {
                const avisoElement = document.getElementById('aviso-importacao');
                if (!avisoElement || avisoElement.style.display === 'none') {
                    mostrarAvisoImportacao();
                }
            }, 1000);
        }
    }
}

// Expor funções globalmente para uso em outros arquivos
window.adicionarLancamentoSheets = adicionarLancamentoSheets;
window.excluirLancamentoSheets = excluirLancamentoSheets;
window.updateSyncIndicator = updateSyncIndicator;
window.verificarStatusSincronizacao = verificarStatusSincronizacao;