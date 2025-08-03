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
async function saveWebAppUrl() {
    const url = document.getElementById('webAppUrl').value.trim();
    const btn = document.getElementById('btn-save-url');
    const originalText = btn.textContent;
    
    if (!url) {
        if (typeof mostrarNotificacao === 'function') {
            mostrarNotificacao('Por favor, insira uma URL válida', 'erro');
        }
        return;
    }
    
    try {
        // Criar barra de progresso
        const progressContainer = document.createElement('div');
        progressContainer.className = 'save-url-progress';
        progressContainer.innerHTML = `
            <div class="progress-text">Aguarde...</div>
            <div class="progress-bar-container">
                <div class="progress-bar-fill"></div>
            </div>
        `;
        const sheetsConfig = document.querySelector('.sheets-config');
        sheetsConfig.appendChild(progressContainer);
        
        // Estado de carregamento
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span> Salvando...';
        btn.classList.add('loading');
        
        // Animar progresso
        const progressFill = progressContainer.querySelector('.progress-bar-fill');
        const progressText = progressContainer.querySelector('.progress-text');
        
        progressText.textContent = 'Aguarde - Validando URL...';
        progressFill.style.width = '30%';
        await new Promise(resolve => setTimeout(resolve, 600));
        
        progressText.textContent = 'Aguarde - Salvando configuração...';
        progressFill.style.width = '70%';
        await new Promise(resolve => setTimeout(resolve, 400));
        
        localStorage.setItem('googleSheetsWebAppUrl', url);
        hideUrlWithAsterisks();
        
        progressText.textContent = 'Aguarde - Finalizando...';
        progressFill.style.width = '100%';
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Estado de sucesso
        btn.innerHTML = '✅ Salvo!';
        btn.classList.remove('loading');
        btn.classList.add('success');
        progressContainer.remove();
        
        if (typeof mostrarNotificacao === 'function') {
            mostrarNotificacao('URL salva com sucesso!');
        }
        
        // Atualizar status após salvar
        setTimeout(atualizarStatusIntegracao, 500);
        
        // Restaurar botão após 2 segundos
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('success');
            btn.disabled = false;
        }, 2000);
        
    } catch (error) {
        // Remover barra de progresso se existir
        const progressContainer = document.querySelector('.save-url-progress');
        if (progressContainer) progressContainer.remove();
        
        // Estado de erro
        btn.innerHTML = '❌ Erro';
        btn.classList.remove('loading');
        btn.classList.add('error');
        
        if (typeof mostrarNotificacao === 'function') {
            mostrarNotificacao('Erro ao salvar URL', 'erro');
        }
        
        // Restaurar botão após 2 segundos
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('error');
            btn.disabled = false;
        }, 2000);
    }
}

// Recuperar URL salva
function getWebAppUrl() {
    const url = localStorage.getItem('googleSheetsWebAppUrl');
    if (url) {
        hideUrlWithAsterisks();
        const urlStatus = document.getElementById('urlStatus');
        if (urlStatus) {
            urlStatus.innerHTML = '<span style="color: #38a169;">✓ URL carregada</span>';
        }
        // Atualizar status da integração
        setTimeout(atualizarStatusIntegracao, 100);
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
        
        // Sincronizar estoque se a aba existir
        showProgress('Sincronizando estoque...');
        await sincronizarEstoque();
        
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
        if (typeof renderizarProdutos === 'function') renderizarProdutos();
        
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
    const urlInput = document.getElementById('webAppUrl');
    if (urlInput) {
        urlInput.value = '';
        delete urlInput.dataset.realUrl;
    }
    atualizarStatusIntegracao();
    if (typeof mostrarNotificacao === 'function') {
        mostrarNotificacao('URL removida com sucesso', 'sucesso');
    }
}

// Função para enviar todos os dados do OrganizaMEI para o Google Sheets
async function enviarTodosDados() {
    const url = getCurrentUrl();
    if (!url || url.includes('*')) {
        updateSyncStatus('Configure a URL do Web App primeiro!', 'error');
        if (typeof mostrarNotificacao === 'function') {
            mostrarNotificacao('Configure a URL do Google Sheets primeiro!', 'erro');
        }
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
            if (typeof mostrarNotificacao === 'function') {
                mostrarNotificacao('Nenhum lançamento para enviar', 'erro');
            }
            return;
        }
        
        // Garantir que todos os lançamentos tenham ID
        const lancamentosComID = lancamentos.map(lancamento => ({
            ...lancamento,
            id: lancamento.id || gerarIdentificadorUnico()
        }));
        
        showProgress(`Enviando ${lancamentosComID.length} registros...`);
        
        if (typeof mostrarNotificacao === 'function') {
            mostrarNotificacao(`Enviando ${lancamentosComID.length} lançamentos...`);
        }
        
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
            
            if (typeof mostrarNotificacao === 'function') {
                mostrarNotificacao(`${result.inserted || lancamentosComID.length} lançamentos enviados!`);
            }
        } else {
            updateSyncStatus('Erro ao enviar dados', 'error');
            updateSyncIndicator('error');
            
            if (typeof mostrarNotificacao === 'function') {
                mostrarNotificacao('Erro ao enviar dados para planilha', 'erro');
            }
        }
        
        hideProgress();
    } catch (error) {
        console.error('Erro ao enviar dados:', error);
        updateSyncStatus('Erro na conexão', 'error');
        updateSyncIndicator('error');
        hideProgress();
        
        if (typeof mostrarNotificacao === 'function') {
            mostrarNotificacao('Erro de conexão com planilha', 'erro');
        }
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

// Função para atualizar status unificado da integração
async function atualizarStatusIntegracao() {
    const statusContainer = document.getElementById('integration-status');
    const statusMessage = document.getElementById('status-message');
    const tabsStatus = document.getElementById('sheets-tabs-status');
    const sheetsActions = document.querySelector('.sheets-actions');
    const financeiroStatus = document.getElementById('financeiro-status');
    const estoqueStatus = document.getElementById('estoque-status');
    const btnCriarAba = document.getElementById('btnCriarAbaEstoque');
    
    const url = localStorage.getItem('googleSheetsWebAppUrl');
    
    if (!url) {
        // Não configurado
        statusContainer.className = 'integration-status error';
        statusMessage.textContent = 'Não configurado';
        tabsStatus.style.display = 'none';
        sheetsActions.style.display = 'none';
        return;
    }
    
    try {
        // Configurado - verificar conexão
        statusContainer.className = 'integration-status';
        statusMessage.textContent = 'Verificando conexão...';
        
        // Testar conexão
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'testarScript' })
        });
        const result = await response.json();
        
        if (result.success) {
            statusContainer.className = 'integration-status connected';
            statusMessage.textContent = 'Conectado e funcionando';
            tabsStatus.style.display = 'block';
            sheetsActions.style.display = 'block';
            
            // Verificar aba Estoque
            const temAbaEstoque = await verificarAbaEstoque();
            if (temAbaEstoque) {
                estoqueStatus.textContent = '✅';
                btnCriarAba.style.display = 'none';
                localStorage.setItem('estoqueGoogleSheetsAtivo', 'true');
            } else {
                estoqueStatus.textContent = '❌';
                btnCriarAba.style.display = 'inline-block';
                localStorage.setItem('estoqueGoogleSheetsAtivo', 'false');
            }
            
            // Financeiro sempre ativo se conectado
            financeiroStatus.textContent = '✅';
            
        } else {
            throw new Error(result.message || 'Falha na conexão');
        }
        
    } catch (error) {
        statusContainer.className = 'integration-status error';
        statusMessage.textContent = 'Erro de conexão';
        tabsStatus.style.display = 'none';
        sheetsActions.style.display = 'none';
    }
}

// Sincronização unificada
async function sincronizarTudo() {
    const btn = document.getElementById('btn-sync-all');
    const originalText = btn.textContent;
    
    try {
        btn.disabled = true;
        btn.textContent = 'Sincronizando...';
        
        showProgress('Iniciando sincronização completa...');
        
        if (typeof mostrarNotificacao === 'function') {
            mostrarNotificacao('Iniciando sincronização completa...');
        }
        
        // Sincronizar financeiro
        await sincronizarFinanceiro();
        
    } catch (error) {
        console.error('Erro na sincronização:', error);
        if (typeof mostrarNotificacao === 'function') {
            mostrarNotificacao('Erro na sincronização', 'erro');
        }
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
        hideProgress();
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
    const syncAllBtn = document.getElementById('btn-sync-all');
    const testBtn = document.getElementById('btn-test-connection');
    const urlInput = document.getElementById('webAppUrl');
    const btnCriarAbaEstoque = document.getElementById('btnCriarAbaEstoque');
    
    if (saveUrlBtn) {
        saveUrlBtn.addEventListener('click', async function() {
            await saveWebAppUrl();
        });
    }
    
    if (clearUrlBtn) {
        clearUrlBtn.addEventListener('click', function() {
            clearWebAppUrl();
        });
    }
    
    if (syncAllBtn) syncAllBtn.addEventListener('click', sincronizarTudo);
    
    if (testBtn) testBtn.addEventListener('click', testarConexaoSheets);
    
    if (btnCriarAbaEstoque) {
        btnCriarAbaEstoque.addEventListener('click', async function() {
            const originalText = this.textContent;
            this.textContent = 'Criando...';
            this.disabled = true;
            
            try {
                const sucesso = await criarAbaEstoque();
                if (sucesso) {
                    if (typeof mostrarNotificacao === 'function') {
                        mostrarNotificacao('Aba Estoque criada com sucesso!');
                    }
                    setTimeout(atualizarStatusIntegracao, 1000);
                } else {
                    throw new Error('Falha na criação');
                }
            } catch (error) {
                console.error('Erro:', error);
                if (typeof mostrarNotificacao === 'function') {
                    mostrarNotificacao('Erro ao criar aba: ' + error.message, 'erro');
                }
            } finally {
                this.textContent = originalText;
                this.disabled = false;
            }
        });
    }
    
    // Mostrar URL real ao focar no campo
    if (urlInput) {
        urlInput.addEventListener('focus', showRealUrl);
        urlInput.addEventListener('blur', function() {
            if (localStorage.getItem('googleSheetsWebAppUrl')) {
                setTimeout(hideUrlWithAsterisks, 100);
            }
        });
    }
    
    // Status inicial
    setTimeout(atualizarStatusIntegracao, 500);
});

// Verificar status inicial de sincronização
function verificarStatusSincronizacao() {
    const url = localStorage.getItem('googleSheetsWebAppUrl');
    if (url) {
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

// Funções para integração de estoque
async function verificarAbaEstoque() {
    const url = getCurrentUrl();
    if (!url || url.includes('*')) {
        console.log('URL não configurada para verificação de estoque');
        return false;
    }
    
    try {
        console.log('Verificando aba Estoque...');
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'verificarAbaEstoque' })
        });
        
        if (!response.ok) {
            console.error('Erro HTTP:', response.status, response.statusText);
            return false;
        }
        
        const result = await response.json();
        console.log('Resultado da verificação:', result);
        return result.success && result.temAbaEstoque;
    } catch (error) {
        console.error('Erro ao verificar aba Estoque:', error);
        return false;
    }
}

async function criarAbaEstoque() {
    const url = getCurrentUrl();
    if (!url || url.includes('*')) {
        throw new Error('URL não configurada');
    }
    
    try {
        console.log('Criando aba Estoque...');
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'criarAbaEstoque' })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Resultado da criação:', result);
        
        if (!result.success) {
            throw new Error(result.message || 'Erro desconhecido');
        }
        
        return true;
    } catch (error) {
        console.error('Erro ao criar aba Estoque:', error);
        throw error;
    }
}

async function adicionarMovimentacaoEstoque(dados) {
    const url = getCurrentUrl();
    if (!url || url.includes('*')) return false;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'insertEstoque',
                data: dados
            })
        });
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Erro ao adicionar movimentação de estoque:', error);
        return false;
    }
}

async function excluirProdutoEstoque(nomeProduto) {
    const url = getCurrentUrl();
    if (!url || url.includes('*')) return false;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'deleteEstoque',
                produto: nomeProduto
            })
        });
        const result = await response.json();
        if (result.success) {
            console.log('Produto excluído do Google Sheets:', nomeProduto);
        } else {
            console.error('Falha ao excluir:', result.message);
        }
        return result.success;
    } catch (error) {
        console.error('Erro ao excluir produto do estoque:', error);
        return false;
    }
}

async function sincronizarEstoque() {
    const url = getCurrentUrl();
    if (!url || url.includes('*')) return;
    
    const estoqueAtivo = localStorage.getItem('estoqueGoogleSheetsAtivo') === 'true';
    if (!estoqueAtivo) return;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'readEstoque' })
        });
        
        const result = await response.json();
        if (!result.success) return;
        
        const movimentacoes = result.data || [];
        const estoqueCalculado = {};
        
        // Calcular estoque por produto
        movimentacoes.forEach(mov => {
            if (!estoqueCalculado[mov.produto]) {
                estoqueCalculado[mov.produto] = 0;
            }
            
            if (mov.tipoMovimento === 'Entrada') {
                estoqueCalculado[mov.produto] += mov.quantidade;
            } else if (mov.tipoMovimento === 'Saída' || mov.tipoMovimento === 'Venda' || mov.tipoMovimento === 'Exclusão') {
                estoqueCalculado[mov.produto] -= mov.quantidade;
            }
        });
        
        // Converter para array de produtos
        const produtosSincronizados = Object.keys(estoqueCalculado)
            .filter(nome => estoqueCalculado[nome] > 0)
            .map(nome => ({
                nome: nome,
                quantidade: estoqueCalculado[nome]
            }));
        
        // Atualizar localStorage e variável global
        localStorage.setItem('produtos', JSON.stringify(produtosSincronizados));
        if (typeof window.produtos !== 'undefined') {
            window.produtos.length = 0;
            window.produtos.push(...produtosSincronizados);
        }
        
    } catch (error) {
        console.error('Erro ao sincronizar estoque:', error);
    }
}

async function testarConexaoSheets() {
    const url = getCurrentUrl();
    if (!url || url.includes('*')) {
        Swal.fire({
            icon: 'warning',
            title: 'URL não configurada',
            text: 'Configure a URL do Google Sheets primeiro',
            confirmButtonColor: '#17acaf',
            background: '#2d3748',
            color: '#fff'
        });
        return;
    }
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'testarScript' })
        });
        const result = await response.json();
        
        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: 'Conexão bem-sucedida!',
                text: result.message,
                confirmButtonColor: '#38a169',
                background: '#2d3748',
                color: '#fff'
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Falha na conexão',
                text: result.message,
                confirmButtonColor: '#e53e3e',
                background: '#2d3748',
                color: '#fff'
            });
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Erro de conexão',
            text: error.message,
            confirmButtonColor: '#e53e3e',
            background: '#2d3748',
            color: '#fff'
        });
    }
}

async function atualizarStatusEstoque() {
    const statusElement = document.getElementById('statusEstoque');
    const btnCriar = document.getElementById('btnCriarAbaEstoque');
    const btnTeste = document.getElementById('btnTestarConexao');
    const containerStatus = document.getElementById('estoqueStatus');
    
    if (!statusElement || !containerStatus) return;
    
    const url = getCurrentUrl();
    if (!url || url.includes('*')) {
        statusElement.textContent = 'Configure a URL do Google Sheets primeiro';
        containerStatus.className = 'estoque-status error';
        btnCriar.style.display = 'none';
        btnTeste.style.display = 'none';
        return;
    }
    
    statusElement.textContent = 'Verificando aba Estoque...';
    containerStatus.className = 'estoque-status';
    btnTeste.style.display = 'block';
    
    const temAbaEstoque = await verificarAbaEstoque();
    
    if (temAbaEstoque) {
        statusElement.textContent = '✅ Aba Estoque encontrada - Integração ativa';
        containerStatus.className = 'estoque-status success';
        btnCriar.style.display = 'none';
        localStorage.setItem('estoqueGoogleSheetsAtivo', 'true');
    } else {
        statusElement.textContent = '⚠️ Aba Estoque não encontrada - Usando apenas memória do dispositivo atual';
        containerStatus.className = 'estoque-status error';
        btnCriar.style.display = 'block';
        localStorage.setItem('estoqueGoogleSheetsAtivo', 'false');
    }
}

// Expor funções globalmente para uso em outros arquivos
window.adicionarLancamentoSheets = adicionarLancamentoSheets;
window.excluirLancamentoSheets = excluirLancamentoSheets;
window.updateSyncIndicator = updateSyncIndicator;
window.verificarStatusSincronizacao = verificarStatusSincronizacao;
window.verificarAbaEstoque = verificarAbaEstoque;
window.criarAbaEstoque = criarAbaEstoque;
window.adicionarMovimentacaoEstoque = adicionarMovimentacaoEstoque;
window.excluirProdutoEstoque = excluirProdutoEstoque;
window.atualizarStatusIntegracao = atualizarStatusIntegracao;
window.testarConexaoSheets = testarConexaoSheets;
window.sincronizarEstoque = sincronizarEstoque;
window.sincronizarTudo = sincronizarTudo;