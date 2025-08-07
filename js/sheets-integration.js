// Integração com Google Sheets para OrganizaMEI - Controle Financeiro

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

// Sistema de notificação global customizado
function mostrarNotificacaoSync(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    // Remover notificação existente
    container.innerHTML = '';
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `sync-notification ${type}`;
    
    const icon = type === 'success' ? '<i class="fas fa-check"></i>' : type === 'error' ? '<i class="fas fa-times"></i>' : type === 'warning' ? '<i class="fas fa-exclamation-triangle"></i>' : '<i class="fas fa-info-circle"></i>';
    notification.innerHTML = `<span class="icon">${icon}</span> ${message}`;
    
    container.appendChild(notification);
    
    // Mostrar com animação
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remover após 2 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            container.innerHTML = '';
        }, 300);
    }, 2000);
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
    const messages = {
        'success': message || 'Dados sincronizados com sucesso',
        'error': message || 'Erro na sincronização',
        'syncing': message || 'Sincronizando dados...',
        'not-configured': message || 'Google Sheets não configurado',
        'checking': message || 'Verificando conexão...',
        'connected-working': message || 'Conectado e funcionando',
        'connected-pending': message || 'Conectado com pendências'
    };
    
    const notificationTypes = {
        'success': 'success',
        'error': 'error', 
        'syncing': 'info',
        'not-configured': 'warning',
        'checking': 'info',
        'connected-working': 'success',
        'connected-pending': 'warning'
    };
    
    // Mapear tipos antigos para novos
    const typeMapping = {
        'success': 'connected-working',
        'syncing': 'checking'
    };
    
    const mappedType = typeMapping[type] || type;
    updateMiniIndicator(mappedType);
    mostrarNotificacaoSync(messages[type], notificationTypes[type]);
}
    

// Salvar URL do Web App no localStorage
async function saveWebAppUrl() {
    const url = document.getElementById('webAppUrl').value.trim();
    const btn = document.getElementById('btn-save-url');
    const originalText = btn.textContent;
    
    if (!url) {
        mostrarNotificacaoSync('Por favor, insira uma URL válida', 'error');
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
        btn.innerHTML = '✅ Salvo e Sincronizado!';
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
        showProgress('Conectando com Google Sheets...');
        updateSyncStatus('Sincronizando...', 'syncing');
        updateMiniIndicator('checking');
        mostrarNotificacaoSync('Sincronizando dados...', 'info');
        
        // Aguardar um pouco para mostrar o progresso
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Obter dados da planilha
        const responseRead = await fetch(url + '?action=read', { method: 'GET', mode: 'cors' });
        const resultRead = await responseRead.json();
        
        if (!resultRead.success) {
            updateSyncStatus('Erro ao ler planilha', 'error');
            mostrarNotificacaoSync('Erro ao ler planilha', 'error');
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
        
        // Atualizar timestamp de modificação
        atualizarTimestampModificacao();
        
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
        updateMiniIndicator('connected-working');
        mostrarNotificacaoSync('Dados sincronizados com sucesso', 'success');
        hideProgress();
        
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
        }
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
        // Aguardar um pouco para garantir que a inclusão foi processada
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
            console.error('Resposta HTTP não OK:', response.status);
            return false;
        }
        
        const result = await response.json();
        console.log('Resultado da exclusão:', result);
        if (result.success === true) {
            atualizarTimestampModificacao();
        }
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
        console.error('Erro ao enviar dados:', error);
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
    const statusIcon = document.querySelector('.status-icon');
    const tabsStatus = document.getElementById('sheets-tabs-status');
    const sheetsActions = document.querySelector('.sheets-actions');
    const financeiroStatus = document.getElementById('financeiro-status');
    const estoqueStatus = document.getElementById('estoque-status');
    const btnCriarAba = document.getElementById('btnCriarAbaEstoque');
    
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
        btn.disabled = true;
        btn.textContent = 'Sincronizando...';
        
        showProgress('Iniciando sincronização completa...');
        updateMiniIndicator('syncing');
        mostrarNotificacaoSync('Iniciando sincronização completa...', 'info');
        
        // Sincronizar financeiro
        await sincronizarFinanceiro();
        
    } catch (error) {
        console.error('Erro na sincronização:', error);
        mostrarNotificacaoSync('Erro na sincronização', 'error');
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
                console.error('Erro:', error);
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
        // Não mostrar notificação automática aqui para evitar spam
        console.log('Google Sheets não configurado');
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
        statusElement.innerHTML = '<i class="fas fa-check-circle"></i> Aba Estoque encontrada - Integração ativa';
        containerStatus.className = 'estoque-status success';
        btnCriar.style.display = 'none';
        localStorage.setItem('estoqueGoogleSheetsAtivo', 'true');
    } else {
        statusElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Aba Estoque não encontrada - Usando apenas memória do dispositivo atual';
        containerStatus.className = 'estoque-status error';
        btnCriar.style.display = 'block';
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
    localStorage.setItem('ultimaModificacao', Date.now().toString());
}

// Função para verificar sincronização automática
async function verificarSincronizacaoAutomatica() {
    const url = getCurrentUrl();
    if (!url || url.includes('*')) {
        updateMiniIndicator('not-configured');
        return true; // Considera sincronizado se não há configuração
    }
    
    try {
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
                return true; // Está sincronizado
            } else {
                updateMiniIndicator('connected-pending');
                return false; // Precisa sincronizar
            }
        } else {
            updateMiniIndicator('error');
            return true; // Em caso de erro, não tenta sincronizar
        }
    } catch (error) {
        updateMiniIndicator('error');
        return true; // Em caso de erro, não tenta sincronizar
    }
}

// Verificação periódica a cada 20 minutos
let intervalVerificacao = null;

function iniciarVerificacaoAutomatica() {
    if (intervalVerificacao) clearInterval(intervalVerificacao);
    
    intervalVerificacao = setInterval(async () => {
        const estaSincronizado = await verificarSincronizacaoAutomatica();
        
        if (!estaSincronizado) {
            mostrarNotificacaoSync('Sincronizando', 'info');
            await sincronizarTudo();
        }
    }, 1200000); // 20 minutos
}

// Expor funções globalmente para uso em outros arquivos
window.adicionarLancamentoSheets = adicionarLancamentoSheets;
window.excluirLancamentoSheets = excluirLancamentoSheets;
window.mostrarNotificacaoSync = mostrarNotificacaoSync;
window.inicializarNotificacoes = inicializarNotificacoes;
window.updateMiniIndicator = updateMiniIndicator;
window.updateSyncIndicator = updateSyncIndicator;
window.verificarStatusSincronizacao = verificarStatusSincronizacaoGlobal;
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
window.atualizarTimestampModificacao = atualizarTimestampModificacao;
window.iniciarVerificacaoAutomatica = iniciarVerificacaoAutomatica;