// Integração com Google Sheets para OrganizaMEI - Controle Financeiro

// ===== CONFIGURAÇÕES DE SINCRONIZAÇÃO =====
const SYNC_CONFIG = {
    INTERVALO_MINIMO_VERIFICACAO: 30000, // 30 segundos
    TOLERANCIA_TIMESTAMP: 5000, // 5 segundos
    MAX_TENTATIVAS_SYNC: 3,
    DEBUG_MODE: false,
    VERIFICACAO_INTELIGENTE: {
        USAR_COMPARACAO_IDS: true,
        SINCRONIZADO_SE_AMBOS_VAZIOS: true,
        VERIFICACAO_RAPIDA: false
    }
};

// Função para verificar se deve executar verificação de sincronização
function deveVerificarSincronizacao() {
    const ultimaVerificacao = localStorage.getItem('ultimaVerificacaoSync');
    if (!ultimaVerificacao) return true;
    
    const agora = Date.now();
    const tempoDecorrido = agora - parseInt(ultimaVerificacao, 10);
    
    return tempoDecorrido > SYNC_CONFIG.INTERVALO_MINIMO_VERIFICACAO;
}

// Função para marcar timestamp da última verificação
function marcarUltimaVerificacao() {
    localStorage.setItem('ultimaVerificacaoSync', Date.now().toString());
}

// Função para log condicional baseado no DEBUG_MODE
function debugLog(message, data = null) {
    if (SYNC_CONFIG.DEBUG_MODE) {
        console.log(`[SYNC DEBUG] ${message}`, data || '');
    }
}

// Função de inicialização (compatibilidade)
function inicializarNotificacoes() {
    // Não precisa fazer nada, sistema já está pronto
}

// Atualizar indicador mini
function updateMiniIndicator(type) {
    const indicator = document.getElementById('mini-sync-indicator');
    if (indicator) {
        indicator.className = `mini-sync-indicator ${type}`;
    }
}

// Manter compatibilidade com código existente
function updateSyncIndicator(type, message) {
    const config = {
        'success': { message: 'Dados sincronizados com sucesso', notification: 'success', indicator: 'connected-working' },
        'error': { message: 'Erro na sincronização', notification: 'error', indicator: 'error' },
        'syncing': { message: 'Sincronizando dados...', notification: 'info', indicator: 'checking' },
        'not-configured': { message: 'Google Sheets não configurado', notification: 'warning', indicator: 'not-configured' },
        'checking': { message: 'Verificando conexão...', notification: 'info', indicator: 'checking' },
        'connected-working': { message: 'Conectado e funcionando', notification: 'success', indicator: 'connected-working' },
        'connected-pending': { message: 'Conectado com pendências', notification: 'warning', indicator: 'connected-pending' }
    };
    
    const typeConfig = config[type] || config['error'];
    const finalMessage = message || typeConfig.message;
    
    updateMiniIndicator(typeConfig.indicator);
    mostrarNotificacaoSync(finalMessage, typeConfig.notification);
}
    

// Salvar URL do Web App no localStorage
async function saveWebAppUrl() {
    const urlInput = document.getElementById('webAppUrl').value.trim();
    const btn = document.getElementById('btn-save-url');
    const originalText = btn.textContent;
    
    // Validate and sanitize URL
    if (!urlInput) {
        mostrarNotificacaoSync('Por favor, insira uma URL válida', 'error');
        return;
    }
    
    // Basic URL validation
    try {
        const url = new URL(urlInput);
        if (!['https:', 'http:'].includes(url.protocol)) {
            mostrarNotificacaoSync('URL deve usar protocolo HTTP ou HTTPS', 'error');
            return;
        }
    } catch (e) {
        mostrarNotificacaoSync('URL inválida', 'error');
        return;
    }
    
    const url = urlInput;
    
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
        btn.innerHTML = 'Sincronizando...';
        btn.classList.add('loading');
        
        // Animar progresso
        const progressFill = progressContainer.querySelector('.progress-bar-fill');
        const progressText = progressContainer.querySelector('.progress-text');
        
        progressText.textContent = 'Aguarde - Validando URL...';
        progressFill.style.width = '20%';
        await new Promise(resolve => setTimeout(resolve, 600));
        
        progressText.textContent = 'Aguarde - Salvando configuração...';
        progressFill.style.width = '40%';
        await new Promise(resolve => setTimeout(resolve, 400));
        
        localStorage.setItem('googleSheetsWebAppUrl', url);
        hideUrlWithAsterisks();
        
        progressText.textContent = 'Aguarde - Sincronizando dados...';
        progressFill.style.width = '70%';
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Executar ressincronização automaticamente
        await sincronizarTudo();
        
        progressText.textContent = 'Aguarde - Finalizando...';
        progressFill.style.width = '100%';
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Estado de sucesso
        btn.innerHTML = 'Sincronizado!';
        btn.classList.remove('loading');
        btn.classList.add('success');
        progressContainer.remove();
        
        mostrarNotificacaoSync('URL salva e dados sincronizados!', 'success');
        
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
        
        mostrarNotificacaoSync('Erro ao salvar URL', 'error');
        
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
            urlStatus.innerHTML = '<span class="url-loaded">✓ URL carregada</span>';
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
        // Dynamic masking to prevent URL length disclosure
        urlInput.value = '*'.repeat(Math.max(20, url.length));
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

// Mostrar barra de progresso
function showProgress(message) {
    const progress = document.getElementById('sync-progress');
    const text = progress?.querySelector('.progress-text');
    const statusContainer = document.getElementById('integration-status');
    const statusMessage = document.getElementById('status-message');
    
    if (progress && text) {
        progress.style.display = 'block';
        text.textContent = message;
        
        // Manter status "Verificando, aguarde" durante o progresso
        if (statusContainer && statusMessage) {
            statusContainer.className = 'integration-status checking';
            statusMessage.textContent = 'Verificando, aguarde';
            updateMiniIndicator('checking');
        }
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
        // Atualizar progresso no loading manager se estiver ativo
        if (typeof window.loadingManager !== 'undefined' && window.loadingManager && window.loadingManager.isCurrentlyLoading()) {
            window.loadingManager.updateProgress(10, 'Conectando com Google Sheets...');
        }
        
        showProgress('Conectando com Google Sheets...');
        updateSyncStatus('Sincronizando...', 'syncing');
        updateMiniIndicator('checking');
        
        // Aguardar um pouco para mostrar o progresso
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Atualizar progresso
        if (typeof window.loadingManager !== 'undefined' && window.loadingManager && window.loadingManager.isCurrentlyLoading()) {
            window.loadingManager.updateProgress(25, 'Obtendo dados da planilha...');
        }
        
        // Obter dados da planilha
        const responseRead = await fetch(url + '?action=read', { method: 'GET', mode: 'cors' });
        const resultRead = await responseRead.json();
        
        if (!resultRead.success) {
            updateSyncStatus('Erro ao ler planilha', 'error');
            mostrarNotificacaoSync('Erro ao ler planilha', 'error');
            hideProgress();
            return;
        }
        
        // Atualizar progresso
        if (typeof window.loadingManager !== 'undefined' && window.loadingManager && window.loadingManager.isCurrentlyLoading()) {
            window.loadingManager.updateProgress(40, 'Processando dados financeiros...');
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
        
        // Forçar atualização das variáveis globais - safer function checks
        if (window.carregarDadosAtualizados && typeof window.carregarDadosAtualizados === 'function') {
            window.carregarDadosAtualizados();
        } else if (window.lancamentos && Array.isArray(window.lancamentos)) {
            window.lancamentos.length = 0;
            window.lancamentos.push(...lancamentosSincronizados);
        }
        
        // Atualizar timestamp de modificação
        atualizarTimestampModificacao();
        
        // Atualizar progresso
        if (typeof window.loadingManager !== 'undefined' && window.loadingManager && window.loadingManager.isCurrentlyLoading()) {
            window.loadingManager.updateProgress(60, 'Sincronizando estoque...');
        }
        
        // Sincronizar estoque se a aba existir
        showProgress('Sincronizando estoque...');
        await sincronizarEstoque();
        
        // Atualizar progresso
        if (typeof window.loadingManager !== 'undefined' && window.loadingManager && window.loadingManager.isCurrentlyLoading()) {
            window.loadingManager.updateProgress(80, 'Atualizando interface...');
        }
        
        showProgress('Atualizando interface...');
        
        // Forçar atualização completa da interface
        // Recarregar dados do localStorage
        if (typeof carregarDadosAtualizados === 'function') {
            carregarDadosAtualizados();
        } else {
            const novosLancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');
            if (typeof window.lancamentos !== 'undefined') {
                window.lancamentos.length = 0;
                window.lancamentos.push(...novosLancamentos);
            }
        }
        
        // Forçar atualização das variáveis globais (usar dados já carregados)
        window.lancamentos = lancamentosSincronizados;
        if (window.lancamentos && Array.isArray(window.lancamentos)) {
            window.lancamentos.length = 0;
            window.lancamentos.push(...lancamentosSincronizados);
        }
        
        // Atualizar financeiro imediatamente durante "Atualizando interface..." - safer function checks
        if (window.renderizarLancamentos && typeof window.renderizarLancamentos === 'function') {
            window.renderizarLancamentos();
        }
        if (window.renderizarResumoFinanceiro && typeof window.renderizarResumoFinanceiro === 'function') {
            window.renderizarResumoFinanceiro();
        }
        
        await new Promise(resolve => setTimeout(resolve, 700));
        
        // Atualizar outras interfaces - safer function checks
        if (window.renderizarDashboardResumo && typeof window.renderizarDashboardResumo === 'function') window.renderizarDashboardResumo();
        if (window.renderizarVendas && typeof window.renderizarVendas === 'function') window.renderizarVendas();
        if (window.renderizarResumoFinanceiro && typeof window.renderizarResumoFinanceiro === 'function') window.renderizarResumoFinanceiro();
        if (window.atualizarFiltroMesAno && typeof window.atualizarFiltroMesAno === 'function') window.atualizarFiltroMesAno();
        if (window.renderizarProdutos && typeof window.renderizarProdutos === 'function') window.renderizarProdutos();
        
        // Atualizar progresso
        if (typeof window.loadingManager !== 'undefined' && window.loadingManager && window.loadingManager.isCurrentlyLoading()) {
            window.loadingManager.updateProgress(95, 'Finalizando sincronização...');
        }
        
        showProgress('Finalizando...');
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Atualizar gráficos se a função estiver disponível - safer function check
        if (window.renderizarGrafico && typeof window.renderizarGrafico === 'function') {
            const ultimoGrafico = localStorage.getItem('ultimoGraficoSelecionado') || 'vendas';
            window.renderizarGrafico(ultimoGrafico);
        }
        
        updateSyncStatus('Sincronizado', 'success');
        updateMiniIndicator('connected-working');
        mostrarNotificacaoSync('Dados sincronizados com sucesso', 'success');
        hideProgress();
        
        // Atualizar progresso final e parar loading manager
        if (typeof window.loadingManager !== 'undefined' && window.loadingManager && window.loadingManager.isCurrentlyLoading()) {
            window.loadingManager.updateProgress(100, 'Sincronização concluída!');
            setTimeout(() => {
                window.loadingManager.stopSyncLoading();
            }, 800);
        }
        
        // Remover feedback visual após sincronização - safer function check
        if (window.removerFeedbackVisual && typeof window.removerFeedbackVisual === 'function') {
            window.removerFeedbackVisual();
        }
        
        // Aguardar 1500ms para compatibilidade com atualização dos dados
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        updateSyncStatus(`${dadosPlanilha.length} registros importados`, 'success');
        updateMiniIndicator('connected-working');
        
        // Interface já foi atualizada com os dados sincronizados
        
    } catch (error) {
        updateSyncStatus('Erro na sincronização', 'error');
        updateMiniIndicator('error');
        mostrarNotificacaoSync('Erro na sincronização', 'error');
        hideProgress();
        
        // Parar loading manager em caso de erro
        if (typeof window.loadingManager !== 'undefined' && window.loadingManager) {
          window.loadingManager.stopSyncLoading();
        }
    } finally {
        // Controle de sync-disabled gerenciado pela função sincronizarTudo
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
        if (result.success) {
            atualizarTimestampModificacao();
            // Remover feedback visual após adição bem-sucedida - safer function check
            if (window.removerFeedbackVisual && typeof window.removerFeedbackVisual === 'function') {
                setTimeout(window.removerFeedbackVisual, 500);
            }
        }
        return result.success;
    } catch (error) {
        return false;
    }
}

// Excluir lançamento do Google Sheets
async function excluirLancamentoSheets(id) {
    const url = getCurrentUrl();
    if (!url || url.includes('*')) {
        return false;
    }

    try {
        // Aguardar um pouco para garantir que a inclusão foi processada
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'delete',
                id: String(id) // Garantir que o ID seja string
            })
        });
        
        if (!response.ok) {
            return false;
        }
        
        const result = await response.json();
        if (result.success === true) {
            atualizarTimestampModificacao();
            // Remover feedback visual após exclusão bem-sucedida
            if (typeof removerFeedbackVisual === 'function') {
                setTimeout(removerFeedbackVisual, 500);
            }
        }
        return result.success === true;
    } catch (error) {
        return false;
    }
}

// Editar lançamento no Google Sheets - VERSÃO ROBUSTA
async function editarLancamentoSheets(lancamento) {
    const url = getCurrentUrl();
    if (!url || url.includes('*')) {
        return false;
    }

    if (!lancamento.id) {
        return false;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'updateById',
                data: {
                    id: String(lancamento.id),
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
        
        if (!response.ok) {
            return false;
        }
        
        const result = await response.json();
        
        if (result.success) {
            atualizarTimestampModificacao();
            // Remover feedback visual após edição bem-sucedida
            if (typeof removerFeedbackVisual === 'function') {
                setTimeout(removerFeedbackVisual, 500);
            }
        }
        
        return result.success;
    } catch (error) {
        return false;
    }
}

// Editar movimentação de estoque no Google Sheets - VERSÃO ROBUSTA
async function editarMovimentacaoEstoque(movimentacao) {
    const url = getCurrentUrl();
    if (!url || url.includes('*')) {
        return false;
    }

    if (!movimentacao.id) {
        return false;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'editarMovimentacaoEstoqueSheets',
                data: {
                    id: String(movimentacao.id),
                    produto: movimentacao.produto,
                    categoria: movimentacao.categoria || '',
                    quantidade: movimentacao.quantidade,
                    valorUnitario: movimentacao.valorUnitario || 0,
                    valorTotal: movimentacao.valorTotal || 0,
                    data: movimentacao.data,
                    tipoMovimento: movimentacao.tipoMovimento,
                    observacoes: movimentacao.observacoes || ''
                }
            })
        });
        
        if (!response.ok) {
            return false;
        }
        
        const result = await response.json();
        
        if (result.success) {
            atualizarTimestampModificacao();
            // Remover feedback visual após edição bem-sucedida
            if (typeof removerFeedbackVisual === 'function') {
                setTimeout(removerFeedbackVisual, 500);
            }
        }
        
        return result.success;
    } catch (error) {
        return false;
    }
}

// Excluir movimentação de estoque no Google Sheets - VERSÃO ROBUSTA
async function excluirMovimentacaoEstoque(id) {
    const url = getCurrentUrl();
    if (!url || url.includes('*')) {
        return false;
    }

    if (!id) {
        return false;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'removerMovimentacaoEstoque',
                id: String(id)
            })
        });
        
        if (!response.ok) {
            return false;
        }
        
        const result = await response.json();
        
        if (result.success) {
            atualizarTimestampModificacao();
            // Remover feedback visual após exclusão bem-sucedida
            if (typeof removerFeedbackVisual === 'function') {
                setTimeout(removerFeedbackVisual, 500);
            }
        }
        
        return result.success;
    } catch (error) {
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
    updateMiniIndicator('not-configured');
    mostrarNotificacaoSync('Url removida', 'error');
}

// Função para enviar todos os dados do OrganizaMEI para o Google Sheets
async function enviarTodosDados() {
    const url = getCurrentUrl();
    if (!url || url.includes('*')) {
        updateSyncStatus('Configure a URL do Web App primeiro!', 'error');
        mostrarNotificacaoSync('Configure a URL do Google Sheets primeiro!', 'error');
        return;
    }

    try {
        showProgress('Preparando dados...');
        updateSyncStatus('Enviando dados...', 'syncing');
        updateMiniIndicator('checking');
        mostrarNotificacaoSync('Enviando dados...', 'info');
        
        const lancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');
        
        if (lancamentos.length === 0) {
            updateSyncStatus('Nenhum dado para enviar', 'error');
            hideProgress();
            mostrarNotificacaoSync('Nenhum lançamento para enviar', 'error');
            return;
        }
        
        // Garantir que todos os lançamentos tenham ID
        const lancamentosComID = lancamentos.map(lancamento => ({
            ...lancamento,
            id: lancamento.id || window.gerarIdentificadorUnico()
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
            atualizarTimestampModificacao();
            
            updateSyncStatus(`${result.inserted || lancamentosComID.length} registros enviados`, 'success');
            updateMiniIndicator('connected-working');
            mostrarNotificacaoSync(`${result.inserted || lancamentosComID.length} registros enviados`, 'success');
        } else {
            updateSyncStatus('Erro ao enviar dados', 'error');
            updateMiniIndicator('error');
            mostrarNotificacaoSync('Erro ao enviar dados', 'error');
        }
        
        hideProgress();
    } catch (error) {
        updateSyncStatus('Erro na conexão', 'error');
        updateMiniIndicator('error');
        mostrarNotificacaoSync('Erro na conexão', 'error');
        hideProgress();
    }
}

// Função para adicionar IDs aos lançamentos existentes que não possuem
function adicionarIDsLancamentosExistentes() {
    const lancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');
    let modificado = false;
    
    lancamentos.forEach(lancamento => {
        if (!lancamento.id) {
            lancamento.id = window.gerarIdentificadorUnico();
            modificado = true;
        }
    });
    
    if (modificado) {
        localStorage.setItem('lancamentos', JSON.stringify(lancamentos));
    }
}

// Função para atualizar status unificado da integração
async function atualizarStatusIntegracao() {
    // Cache DOM elements to reduce repeated queries with null checks
    const elements = {
        statusContainer: document.getElementById('integration-status'),
        statusMessage: document.getElementById('status-message'),
        statusIcon: document.querySelector('.status-icon'),
        tabsStatus: document.getElementById('sheets-tabs-status'),
        sheetsActions: document.querySelector('.sheets-actions'),
        financeiroStatus: document.getElementById('financeiro-status'),
        estoqueStatus: document.getElementById('estoque-status'),
        btnCriarAba: document.getElementById('btnCriarAbaEstoque')
    };
    
    const { statusContainer, statusMessage, statusIcon, tabsStatus, sheetsActions, financeiroStatus, estoqueStatus, btnCriarAba } = elements;
    
    // Early return if critical elements are missing
    if (!statusContainer || !statusMessage || !statusIcon) {
        return;
    }
    
    const url = localStorage.getItem('googleSheetsWebAppUrl');
    
    if (!url) {
        // Status: Não configurado
        statusContainer.className = 'integration-status not-configured';
        statusMessage.textContent = 'Não configurado';
        statusIcon.innerHTML = '<i class="fas fa-times"></i>';
        tabsStatus.style.display = 'none';
        sheetsActions.style.display = 'none';
        updateMiniIndicator('not-configured');
        return;
    }
    
    try {
        // Status: Verificando, aguarde
        statusContainer.className = 'integration-status checking';
        statusMessage.textContent = 'Verificando, aguarde';
        statusIcon.innerHTML = '<div class="loading-spinner"></div>';
        updateMiniIndicator('checking');
        
        // Testar conexão
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'testarScript' })
        });
        const result = await response.json();
        
        if (result.success) {
            tabsStatus.style.display = 'block';
            sheetsActions.style.display = 'block';
            
            // Verificar aba Estoque
            estoqueStatus.innerHTML = '<div class="loading-spinner-small"></div>';
            const temAbaEstoque = await verificarAbaEstoque();
            if (temAbaEstoque) {
                estoqueStatus.innerHTML = '<i class="fas fa-check-circle"></i>';
                btnCriarAba.style.display = 'none';
                localStorage.setItem('estoqueGoogleSheetsAtivo', 'true');
                // Status: Conectado e funcionando
                statusContainer.className = 'integration-status connected-working';
                statusMessage.textContent = 'Conectado e funcionando';
                statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
                updateMiniIndicator('connected-working');
            } else {
                estoqueStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                btnCriarAba.style.display = 'inline-block';
                localStorage.setItem('estoqueGoogleSheetsAtivo', 'false');
                // Status: Conectado com pendências
                statusContainer.className = 'integration-status connected-pending';
                statusMessage.textContent = 'Conectado com pendências';
                statusIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                updateMiniIndicator('connected-pending');
            }
            
            // Financeiro sempre ativo se conectado
            financeiroStatus.innerHTML = '<i class="fas fa-check-circle"></i>';
            
        } else {
            throw new Error(result.message || 'Falha na conexão');
        }
        
    } catch (error) {
        statusContainer.className = 'integration-status error';
        statusMessage.textContent = 'Erro de conexão';
        statusIcon.innerHTML = '<i class="fas fa-times"></i>';
        tabsStatus.style.display = 'none';
        sheetsActions.style.display = 'none';
        updateMiniIndicator('error');
    }
}

// Sincronização unificada
async function sincronizarTudo() {
    const btn = document.getElementById('btn-sync-all');
    const originalText = btn.textContent;
    
    try {
        // Inativar todos os botões CRUD
        document.body.classList.add('sync-disabled');
        
        btn.disabled = true;
        btn.textContent = 'Sincronizando...';
        
        showProgress('Iniciando sincronização completa...');
        updateMiniIndicator('syncing');
        
        // Sincronizar financeiro
        await sincronizarFinanceiro();
        
    } catch (error) {
        mostrarNotificacaoSync('Erro na sincronização', 'error');
    } finally {
        // Reativar todos os botões CRUD
        document.body.classList.remove('sync-disabled');
        
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
    
    // Sistema de notificação já está pronto
    
    // Configurar clique no indicador mini
    const miniIndicator = document.getElementById('mini-sync-indicator');
    if (miniIndicator) {
        miniIndicator.addEventListener('click', function() {
            changeTab('configuracoes');
        });
    }
    
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
                    mostrarNotificacaoSync('Aba Estoque criada com sucesso!', 'success');
                    setTimeout(atualizarStatusIntegracao, 1000);
                } else {
                    throw new Error('Falha na criação');
                }
            } catch (error) {
                mostrarNotificacaoSync('Erro ao criar aba: ' + error.message, 'error');
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
    
    // Definir mini-sync-dot como azul ao carregar a página
    updateMiniIndicator('page-load');
    
    // Status inicial
    setTimeout(atualizarStatusIntegracao, 500);
    
    // Verificar status inicial baseado no integration-status
    setTimeout(() => {
        const statusContainer = document.getElementById('integration-status');
        if (statusContainer) {
            if (statusContainer.classList.contains('error')) {
                updateMiniIndicator('error');
            } else if (statusContainer.classList.contains('connected-working')) {
                updateMiniIndicator('connected-working');
            } else if (statusContainer.classList.contains('connected-pending')) {
                updateMiniIndicator('connected-pending');
            } else if (statusContainer.classList.contains('not-configured')) {
                updateMiniIndicator('not-configured');
            } else {
                updateMiniIndicator('checking');
            }
        }
    }, 2000);
});

// Verificar status inicial de sincronização global
function verificarStatusSincronizacaoGlobal() {
    const url = localStorage.getItem('googleSheetsWebAppUrl');
    if (!url) {
        return false;
    }
    return true;
}

// Funções para integração de estoque
async function verificarAbaEstoque() {
    const url = getCurrentUrl();
    if (!url || url.includes('*')) {
        return false;
    }
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'verificarAbaEstoque' })
        });
        
        if (!response.ok) {
            return false;
        }
        
        const result = await response.json();
        return result.success && result.temAbaEstoque;
    } catch (error) {
        return false;
    }
}

async function criarAbaEstoque() {
    const url = getCurrentUrl();
    if (!url || url.includes('*')) {
        throw new Error('URL não configurada');
    }
    
    try {
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
        
        if (!result.success) {
            throw new Error(result.message || 'Erro desconhecido');
        }
        
        return true;
    } catch (error) {
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
        
        return result.success;
    } catch (error) {
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
        
        if (!result.success) {
            return;
        }
        
        const movimentacoes = result.data || [];
        
        // Salvar movimentações no localStorage
        localStorage.setItem('movimentacoesEstoque', JSON.stringify(movimentacoes));
        
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
        
        // Converter para array de produtos (otimizado)
        const produtosSincronizados = Object.entries(estoqueCalculado)
            .filter(([nome, quantidade]) => quantidade > 0)
            .map(([nome, quantidade]) => ({
                nome: nome,
                quantidade: quantidade
            }));
        
        // Atualizar localStorage e variável global
        localStorage.setItem('produtos', JSON.stringify(produtosSincronizados));
        
        // Forçar atualização das variáveis globais - safer function checks
        if (window.carregarDadosAtualizados && typeof window.carregarDadosAtualizados === 'function') {
            window.carregarDadosAtualizados();
        } else if (window.produtos && Array.isArray(window.produtos)) {
            window.produtos.length = 0;
            window.produtos.push(...produtosSincronizados);
        }
        
        // Atualizar interface se a função estiver disponível - safer function check
        if (window.renderizarProdutos && typeof window.renderizarProdutos === 'function') {
            setTimeout(() => {
                window.renderizarProdutos();
            }, 100);
        }
        
        // Salvar timestamp da sincronização
        localStorage.setItem('ultimaSincronizacaoEstoque', Date.now().toString());
        
    } catch (error) {
        // Erro silencioso
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
        if (btnCriar) btnCriar.style.display = 'none';
        if (btnTeste) btnTeste.style.display = 'none';
        return;
    }
    
    statusElement.textContent = 'Verificando aba Estoque...';
    containerStatus.className = 'estoque-status';
    if (btnTeste) btnTeste.style.display = 'block';
    
    const temAbaEstoque = await verificarAbaEstoque();
    
    if (temAbaEstoque) {
        statusElement.innerHTML = '<i class="fas fa-check-circle"></i> Aba Estoque encontrada - Integração ativa';
        containerStatus.className = 'estoque-status success';
        if (btnCriar) btnCriar.style.display = 'none';
        localStorage.setItem('estoqueGoogleSheetsAtivo', 'true');
    } else {
        statusElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Aba Estoque não encontrada - Usando apenas memória do dispositivo atual';
        containerStatus.className = 'estoque-status error';
        if (btnCriar) btnCriar.style.display = 'block';
        localStorage.setItem('estoqueGoogleSheetsAtivo', 'false');
    }
}

// Função para gerar hash dos dados locais
function gerarHashDadosLocais() {
    const lancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');
    const produtos = JSON.parse(localStorage.getItem('produtos') || '[]');
    
    // Criar hash mais detalhado para melhor comparação
    const dadosCombinados = {
        totalLancamentos: lancamentos.length,
        totalProdutos: produtos.length,
        ultimoLancamento: lancamentos.length > 0 ? lancamentos[lancamentos.length - 1].id : null
    };
    
    return btoa(JSON.stringify(dadosCombinados));
}

// Função para atualizar timestamp de modificação
function atualizarTimestampModificacao() {
    localStorage.setItem('ultimaModificacao', Date.now());
}

// Função para atualizar timestamp de última verificação
function atualizarTimestampVerificacao() {
    localStorage.setItem('ultimaVerificacao', Date.now());
}

// Função para verificar se precisa verificar sincronização (evita verificações muito frequentes)
function precisaVerificarSincronizacao() {
    const ultimaVerificacao = localStorage.getItem('ultimaVerificacao');
    if (!ultimaVerificacao) return true;
    
    const agora = Date.now();
    const tempoDecorrido = agora - parseInt(ultimaVerificacao, 10);
    const INTERVALO_MINIMO = 30000; // 30 segundos
    
    return tempoDecorrido > INTERVALO_MINIMO;
}

// Função para verificar sincronização automática (otimizada)
async function verificarSincronizacaoAutomatica() {
    const url = getCurrentUrl();
    if (!url || url.includes('*')) {
        updateMiniIndicator('not-configured');
        return true; // Considera sincronizado se não há configuração
    }
    
    try {
        // Usar verificação inteligente se disponível
        if (typeof window.verificarSincronizacaoInteligente === 'function') {
            return await window.verificarSincronizacaoInteligente();
        }
        
        // Fallback para verificação por hash (método antigo)
        updateMiniIndicator('checking');
        
        const hashLocal = gerarHashDadosLocais();
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ 
                action: 'verificarSincronizacao',
                hashLocal: hashLocal
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (result.sincronizado) {
                updateMiniIndicator('connected-working');
                return true;
            } else {
                updateMiniIndicator('connected-pending');
                return false;
            }
        }
        
        updateMiniIndicator('error');
        return true;
    } catch (error) {
        updateMiniIndicator('error');
        return false;
    }
}

// NOVA FUNÇÃO: Verificação inteligente de sincronização (evita falsos positivos)
async function verificarSincronizacaoInteligentePrecisa() {
    const url = getCurrentUrl();
    if (!url || url.includes('*')) {
        debugLog('URL não configurada - considerando dados sincronizados');
        return true;
    }
    
    try {
        // Coletar dados locais
        const lancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');
        const movimentacoes = JSON.parse(localStorage.getItem('movimentacoesEstoque') || '[]');
        
        const dadosLocais = {
            financeiro: lancamentos.map(l => String(l.id)).filter(id => id && id.length === 14),
            estoque: movimentacoes.map(m => String(m.id)).filter(id => id && id.length === 14)
        };
        
        debugLog('Dados locais para verificação:', {
            financeiro: dadosLocais.financeiro.length,
            estoque: dadosLocais.estoque.length
        });
        
        // Chamar verificação inteligente no servidor
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ 
                action: 'verificarSincronizacaoInteligente',
                dadosLocais: dadosLocais
            })
        });
        
        const result = await response.json();
        debugLog('Resultado da verificação inteligente:', result);
        
        if (result.success) {
            return result.sincronizado;
        } else {
            debugLog('Erro na verificação inteligente:', result.message);
            return true; // Em caso de erro, considera sincronizado
        }
        
    } catch (error) {
        debugLog('Erro ao verificar sincronização inteligente:', error);
        return true; // Em caso de erro, considera sincronizado
    }
}

// Verificação automática DESABILITADA - apenas na inicialização
function iniciarVerificacaoAutomatica() {
    // Verificação periódica desabilitada - apenas verificação na inicialização
}

// Função para testar conexão com Google Sheets
async function testarConexaoSheets() {
    const btn = document.getElementById('btn-test-connection');
    const originalText = btn.textContent;
    
    const url = getCurrentUrl();
    if (!url || url.includes('*')) {
        mostrarNotificacaoSync('Configure a URL do Web App primeiro!', 'error');
        return;
    }
    
    try {
        btn.disabled = true;
        btn.textContent = 'Testando...';
        
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'testarScript' })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        let result;
        try {
            result = await response.json();
        } catch (parseError) {
            throw new Error('Resposta inválida do servidor');
        }
        
        if (result.success) {
            mostrarNotificacaoSync('Conexão testada com sucesso!', 'success');
            setTimeout(atualizarStatusIntegracao, 500);
        } else {
            mostrarNotificacaoSync('Erro no teste: ' + (result.message || 'Falha desconhecida'), 'error');
        }
        
    } catch (error) {
        mostrarNotificacaoSync('Erro na conexão: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// Expor funções globalmente para uso em outros arquivos
window.SYNC_CONFIG = SYNC_CONFIG;
window.deveVerificarSincronizacao = deveVerificarSincronizacao;
window.marcarUltimaVerificacao = marcarUltimaVerificacao;
window.debugLog = debugLog;
window.adicionarLancamentoSheets = adicionarLancamentoSheets;
window.excluirLancamentoSheets = excluirLancamentoSheets;
window.editarLancamentoSheets = editarLancamentoSheets;
window.editarMovimentacaoEstoque = editarMovimentacaoEstoque;
window.excluirMovimentacaoEstoque = excluirMovimentacaoEstoque;
window.inicializarNotificacoes = inicializarNotificacoes;
window.updateMiniIndicator = updateMiniIndicator;
window.updateSyncIndicator = updateSyncIndicator;
window.verificarStatusSincronizacaoGlobal = verificarStatusSincronizacaoGlobal;
window.verificarAbaEstoque = verificarAbaEstoque;
window.criarAbaEstoque = criarAbaEstoque;
window.adicionarMovimentacaoEstoque = adicionarMovimentacaoEstoque;
window.excluirProdutoEstoque = excluirProdutoEstoque;
window.atualizarStatusIntegracao = atualizarStatusIntegracao;
window.testarConexaoSheets = testarConexaoSheets;
window.sincronizarEstoque = sincronizarEstoque;
window.sincronizarTudo = sincronizarTudo;
window.verificarSincronizacaoAutomatica = verificarSincronizacaoAutomatica;
window.verificarSincronizacaoInteligentePrecisa = verificarSincronizacaoInteligentePrecisa;
window.atualizarTimestampModificacao = atualizarTimestampModificacao;
window.atualizarTimestampVerificacao = atualizarTimestampVerificacao;
window.precisaVerificarSincronizacao = precisaVerificarSincronizacao;
window.iniciarVerificacaoAutomatica = iniciarVerificacaoAutomatica;