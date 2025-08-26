/* ===== SISTEMA DE SINCRONIZAÇÃO GLOBAL ===== */
/* Arquivo: sync-global.js */
/* Responsável pela sincronização robusta e centralizada de todos os módulos do sistema */

class SyncGlobalManager {
    constructor() {
        this.isActive = false;
        this.currentStep = 0;
        this.totalSteps = 6;
        this.progress = 0;
        this.overlay = null;
        this.cancelRequested = false;
        
        // Definir etapas de sincronização
        this.steps = [
            { id: 'financeiro', name: 'Sincronizando Financeiro', progress: 20 },
            { id: 'estoque', name: 'Sincronizando Estoque', progress: 35 },
            { id: 'categorias', name: 'Sincronizando Categorias', progress: 50 },
            { id: 'vendas', name: 'Sincronizando Vendas', progress: 65 },
            { id: 'graficos', name: 'Atualizando Gráficos', progress: 80 },
            { id: 'relatorios', name: 'Atualizando Relatórios', progress: 100 }
        ];
        
        this.init();
    }
    
    /**
     * Inicializa o sistema de sincronização
     */
    init() {
        this.createOverlay();
        this.bindEvents();
        console.log('🔄 Sistema de Sincronização Global inicializado');
    }
    
    /**
     * Cria o overlay de sincronização
     */
    createOverlay() {
        // Remove overlay existente se houver
        const existingOverlay = document.getElementById('sync-global-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Criar novo overlay
        this.overlay = document.createElement('div');
        this.overlay.id = 'sync-global-overlay';
        this.overlay.className = 'sync-global-overlay';
        
        this.overlay.innerHTML = `
            <div class="sync-global-container">
                <!-- Ícone de sincronização -->
                <div class="sync-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                </div>
                
                <!-- Título e descrição -->
                <h3 class="sync-title">Sincronizando Sistema</h3>
                <p class="sync-description">Atualizando todos os módulos do OrganizaMEI...</p>
                
                <!-- Barra de progresso -->
                <div class="sync-progress-container">
                    <div class="sync-progress-bar">
                        <div class="sync-progress-fill" id="sync-progress-fill"></div>
                    </div>
                    <div class="sync-progress-text">
                        <span id="sync-current-step">Iniciando...</span>
                        <span class="sync-progress-percentage" id="sync-percentage">0%</span>
                    </div>
                </div>
                
                <!-- Lista de etapas - DaisyUI Steps Style -->
                <div class="sync-steps" id="sync-steps">
                    ${this.steps.map((step, index) => `
                        <div class="sync-step" data-step="${index}">
                            <div class="sync-step-icon">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path d="M12 1v6m0 6v6"></path>
                                </svg>
                            </div>
                            <div class="sync-step-content">
                                <span class="sync-step-title">${step.name}</span>
                                <div class="sync-step-progress">${step.progress}%</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Botão de cancelar -->
                <button class="sync-cancel-btn" id="sync-cancel-btn">
                    Cancelar Sincronização
                </button>
            </div>
        `;
        
        document.body.appendChild(this.overlay);
    }
    
    /**
     * Vincula eventos do sistema
     */
    bindEvents() {
        // Evento do botão de sincronização principal
        document.addEventListener('click', (e) => {
            if (e.target.id === 'btn-sync-all' || e.target.closest('#btn-sync-all')) {
                e.preventDefault();
                this.startSync('manual');
            }
        });
        
        // Evento do botão de cancelar
        document.addEventListener('click', (e) => {
            if (e.target.id === 'sync-cancel-btn') {
                this.cancelSync();
            }
        });
        
        // Observar mudanças no status dot para sincronização automática
        this.observeStatusDot();
        
        // Observar salvamento de URL
        this.observeUrlSave();
    }
    
    /**
     * Observa o status dot para sincronização automática
     */
    observeStatusDot() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList.contains('daisyui-status-dot') && 
                        target.classList.contains('needs-sync')) {
                        console.log('🔄 Status dot detectou necessidade de sincronização');
                        setTimeout(() => this.startSync('auto'), 1000);
                    }
                }
            });
        });
        
        // Observar todos os elementos com classe daisyui-status-dot
        document.querySelectorAll('.daisyui-status-dot').forEach(dot => {
            observer.observe(dot, { attributes: true });
        });
    }
    
    /**
     * Observa salvamento de URL para iniciar sincronização
     */
    observeUrlSave() {
        // Interceptar eventos de salvamento de configuração
        document.addEventListener('configSaved', () => {
            console.log('🔄 Configuração salva, iniciando sincronização');
            setTimeout(() => this.startSync('config'), 500);
        });
        
        // Observar mudanças no localStorage para URLs - CORRIGIDO
        let lastUrl = localStorage.getItem('googleSheetsWebAppUrl');
        setInterval(() => {
            const currentUrl = localStorage.getItem('googleSheetsWebAppUrl');
            if (currentUrl && currentUrl !== lastUrl && !currentUrl.includes('*')) {
                console.log('🔄 Nova URL detectada, iniciando sincronização');
                lastUrl = currentUrl;
                setTimeout(() => this.startSync('url'), 1000);
            }
        }, 2000);
    }
    
    /**
     * Inicia o processo de sincronização
     * @param {string} trigger - Tipo de trigger ('manual', 'auto', 'config', 'url')
     */
    async startSync(trigger = 'manual') {
        if (this.isActive) {
            console.log('⚠️ Sincronização já está em andamento');
            return;
        }
        
        console.log(`🚀 Iniciando sincronização global (trigger: ${trigger})`);
        
        this.isActive = true;
        this.cancelRequested = false;
        this.currentStep = 0;
        this.progress = 0;
        
        // Bloquear interface
        this.blockInterface();
        
        // Mostrar overlay
        this.showOverlay();
        

        
        try {
            // Executar sincronização por etapas
            await this.executeSync();
            
            // Sucesso
            this.handleSyncSuccess();
            
        } catch (error) {
            console.error('❌ Erro durante sincronização:', error);
            this.handleSyncError(error);
        } finally {
            // Sempre limpar estado
            this.cleanup();
        }
    }
    
    /**
     * Executa a sincronização por etapas
     */
    async executeSync() {
        for (let i = 0; i < this.steps.length; i++) {
            if (this.cancelRequested) {
                throw new Error('Sincronização cancelada pelo usuário');
            }
            
            const step = this.steps[i];
            this.currentStep = i;
            
            const stepMessage = `Executando etapa ${i + 1}/${this.steps.length}: ${step.name}`;
            console.log(stepMessage);
            
            // Atualizar interface
            this.updateProgress(step.progress, stepMessage);
            this.updateStepStatus(i, 'active');
            
            // Executar etapa específica
            await this.executeStep(step.id);
            
            // Marcar como concluída
            this.updateStepStatus(i, 'completed');
            
            // Aguardar um pouco entre etapas
            await this.delay(300);
        }
    }
    
    /**
     * Executa uma etapa específica de sincronização
     * @param {string} stepId - ID da etapa
     */
    async executeStep(stepId) {
        switch (stepId) {
            case 'financeiro':
                await this.syncFinanceiro();
                break;
            case 'estoque':
                await this.syncEstoque();
                break;
            case 'categorias':
                await this.syncCategorias();
                break;
            case 'vendas':
                await this.syncVendas();
                break;
            case 'graficos':
                await this.syncGraficos();
                break;
            case 'relatorios':
                await this.syncRelatorios();
                break;
        }
    }
    
    /**
     * Sincroniza módulo financeiro - FUNÇÃO PRINCIPAL DE SINCRONIZAÇÃO
     * Esta função substitui a antiga sincronizarFinanceiro() e atualiza todos os módulos
     */
    async syncFinanceiro() {
        
        if (!this.isUrlConfigured()) {
            if (typeof updateSyncStatus === 'function') {
                updateSyncStatus('Configure a URL do Web App primeiro!', 'error');
            }
            throw new Error('URL do Google Sheets não configurada');
        }
        
        const url = this.getCurrentUrl();

        try {
            console.log('🔗 Conectando com Google Sheets...');
            
            // Obter dados da planilha
            const responseRead = await fetch(url + '?action=read', { method: 'GET', mode: 'cors' });
            const resultRead = await responseRead.json();
            
            if (!resultRead.success) {
                if (typeof updateSyncStatus === 'function') {
                    updateSyncStatus('Erro ao ler planilha', 'error');
                }
                throw new Error('Erro ao ler dados da planilha');
            }
            
            console.log('📊 Processando dados financeiros...');
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
            
            // Forçar atualização das variáveis globais
            if (window.carregarDadosAtualizados && typeof window.carregarDadosAtualizados === 'function') {
                window.carregarDadosAtualizados();
            } else if (window.lancamentos && Array.isArray(window.lancamentos)) {
                window.lancamentos.length = 0;
                window.lancamentos.push(...lancamentosSincronizados);
            }
            
            // Atualizar timestamp de modificação
            if (typeof atualizarTimestampModificacao === 'function') {
                atualizarTimestampModificacao();
            }
            
            console.log(`✅ ${dadosPlanilha.length} lançamentos sincronizados`);
            
            // Atualizar interface financeira
            if (typeof window.renderizarLancamentos === 'function') {
                window.renderizarLancamentos();
            }
            if (typeof window.renderizarResumoFinanceiro === 'function') {
                window.renderizarResumoFinanceiro();
            }
            
        } catch (error) {
            console.error('❌ Erro na sincronização financeira:', error);
            throw error;
        }
        
        await this.delay(200);
    }
    
    /**
     * Sincroniza módulo estoque
     */
    async syncEstoque() {
        
        if (!this.isUrlConfigured()) {
            console.log('⚠️ URL não configurada, pulando sincronização do estoque');
            return;
        }
        
        const url = this.getCurrentUrl();
        
        const estoqueAtivo = localStorage.getItem('estoqueGoogleSheetsAtivo') === 'true';
        if (!estoqueAtivo) {
            console.log('⚠️ Estoque não ativo no Google Sheets, pulando sincronização');
            return;
        }
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'readEstoque' })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                console.log('⚠️ Erro ao ler dados do estoque');
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
                    estoqueCalculado[mov.produto] += Number(mov.quantidade) || 0;
                } else if (mov.tipoMovimento === 'Saída' || mov.tipoMovimento === 'Venda' || mov.tipoMovimento === 'Quebra' || mov.tipoMovimento === 'Ajuste') {
                    estoqueCalculado[mov.produto] -= Number(mov.quantidade) || 0;
                }
            });
            
            // Converter para array de produtos
            const produtosSincronizados = Object.entries(estoqueCalculado)
                .filter(([nome, quantidade]) => quantidade > 0)
                .map(([nome, quantidade]) => ({
                    nome: nome,
                    quantidade: quantidade
                }));
            
            // Atualizar localStorage e variável global
            localStorage.setItem('produtos', JSON.stringify(produtosSincronizados));
            
            // Forçar atualização das variáveis globais
            if (window.carregarDadosAtualizados && typeof window.carregarDadosAtualizados === 'function') {
                window.carregarDadosAtualizados();
            } else if (window.produtos && Array.isArray(window.produtos)) {
                window.produtos.length = 0;
                window.produtos.push(...produtosSincronizados);
            }
            
            console.log(`✅ ${produtosSincronizados.length} produtos sincronizados`);
            
        } catch (error) {
            console.error('❌ Erro na sincronização do estoque:', error);
        }
        
        // Aguardar processamento dos dados
        await this.delay(300);
        
        // Forçar recálculo do estoque baseado nas movimentações
        if (typeof window.recalcularEstoque === 'function') {
            window.recalcularEstoque();
        }
        
        // Aguardar recálculo
        await this.delay(200);
        
        // Atualizar interface do estoque
        if (typeof window.renderizarProdutos === 'function') {
            window.renderizarProdutos();
        }
        
        // Aguardar renderização
        await this.delay(200);
        
        // Forçar recálculo de layout para garantir exibição correta
        if (typeof window.forcarRecalculoLayout === 'function') {
            window.forcarRecalculoLayout();
        }
        
        // Atualizar outras funções relacionadas ao estoque
        if (typeof window.atualizarSelectSaida === 'function') {
            window.atualizarSelectSaida();
        }
        if (typeof window.atualizarListaProdutos === 'function') {
            window.atualizarListaProdutos();
        }
        
        await this.delay(200);
    }
    
    /**
     * Sincroniza módulo categorias
     */
    async syncCategorias() {
        
        // Sincronizar categorias com dados do financeiro
        if (window.categoriaManager && typeof window.categoriaManager.sincronizarComFinanceiro === 'function') {
            window.categoriaManager.sincronizarComFinanceiro();
        }
        
        // Atualizar interface de categorias
        if (typeof window.renderizarListaCategorias === 'function') {
            window.renderizarListaCategorias();
        }
        if (typeof window.atualizarCategorias === 'function') {
            window.atualizarCategorias();
        }
        
        await this.delay(200);
    }
    
    /**
     * Sincroniza módulo vendas
     */
    async syncVendas() {
        
        // Atualizar interface de vendas
        if (typeof window.renderizarVendas === 'function') {
            window.renderizarVendas();
        }
        
        await this.delay(200);
    }
    
    /**
     * Sincroniza gráficos
     */
    async syncGraficos() {
        
        // Atualizar gráficos
        if (typeof window.renderizarGrafico === 'function') {
            const ultimoGrafico = localStorage.getItem('ultimoGraficoSelecionado') || 'vendas';
            window.renderizarGrafico(ultimoGrafico);
        }
        
        await this.delay(200);
    }
    
    /**
     * Sincroniza relatórios
     */
    async syncRelatorios() {
        
        // Atualizar dashboard e relatórios
        if (typeof window.renderizarDashboardResumo === 'function') {
            window.renderizarDashboardResumo();
        }
        if (typeof window.atualizarFiltroMesAno === 'function') {
            window.atualizarFiltroMesAno();
        }
        
        await this.delay(200);
    }
    
    /**
     * Atualiza o progresso da sincronização
     * @param {number} percentage - Porcentagem de progresso
     * @param {string} message - Mensagem atual
     */
    updateProgress(percentage, message) {
        this.progress = percentage;
        
        const progressFill = document.getElementById('sync-progress-fill');
        const currentStep = document.getElementById('sync-current-step');
        const percentageEl = document.getElementById('sync-percentage');
        
        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (currentStep) currentStep.textContent = message;
        if (percentageEl) percentageEl.textContent = `${percentage}%`;
    }
    
    /**
     * Atualiza o status de uma etapa
     * @param {number} stepIndex - Índice da etapa
     * @param {string} status - Status ('active', 'completed')
     */
    updateStepStatus(stepIndex, status) {
        const stepEl = document.querySelector(`[data-step="${stepIndex}"]`);
        if (stepEl) {
            stepEl.classList.remove('active', 'completed');
            stepEl.classList.add(status);
        }
    }
    
    /**
     * Bloqueia a interface durante sincronização
     */
    blockInterface() {
        // Bloquear elementos principais
        const elementsToBlock = [
            'button', 'input', 'select', 'textarea', 
            '.btn', '.form-control', '.dropdown',
            '[role="button"]', '[tabindex]'
        ];
        
        elementsToBlock.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (!el.closest('#sync-global-overlay')) {
                    el.classList.add('interface-blocked');
                }
            });
        });
        
        // Adicionar classe ao body
        document.body.classList.add('sync-active');
    }
    
    /**
     * Desbloqueia a interface
     */
    unblockInterface() {
        document.querySelectorAll('.interface-blocked').forEach(el => {
            el.classList.remove('interface-blocked');
        });
        
        document.body.classList.remove('sync-active');
    }
    
    /**
     * Mostra o overlay de sincronização
     */
    showOverlay() {
        if (this.overlay) {
            this.overlay.classList.add('active');
        }
    }
    
    /**
     * Esconde o overlay de sincronização
     */
    hideOverlay() {
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }
    }
    
    /**
     * Cancela a sincronização
     */
    cancelSync() {
        console.log('⏹️ Cancelando sincronização...');
        this.cancelRequested = true;
        
        if (typeof mostrarNotificacaoSync === 'function') {
            mostrarNotificacaoSync('Sincronização cancelada', 'warning');
        }
    }
    
    /**
     * Manipula sucesso da sincronização
     */
    handleSyncSuccess() {
        console.log('✅ Sincronização concluída com sucesso');
        
        // Atualizar status
        if (typeof updateSyncStatus === 'function') {
            updateSyncStatus('Sincronizado', 'success');
        }
        if (typeof updateMiniIndicator === 'function') {
            updateMiniIndicator('connected-working');
        }
        
        // Verificação final: garantir que o estoque está atualizado
        setTimeout(() => {
            console.log('🔍 Verificação final do estoque após sincronização');
            
            // Forçar recarga completa dos dados do localStorage
            if (typeof window.carregarDadosAtualizados === 'function') {
                window.carregarDadosAtualizados();
            }
            
            // Forçar atualização final do estoque
            if (typeof window.recalcularEstoque === 'function') {
                window.recalcularEstoque();
            }
            
            // Aguardar e renderizar novamente
            setTimeout(() => {
                if (typeof window.renderizarProdutos === 'function') {
                    window.renderizarProdutos();
                }
                if (typeof window.forcarRecalculoLayout === 'function') {
                    window.forcarRecalculoLayout();
                }
                
                // Forçar atualização de outras funções relacionadas ao estoque
                if (typeof window.atualizarSelectSaida === 'function') {
                    window.atualizarSelectSaida();
                }
                if (typeof window.atualizarListaProdutos === 'function') {
                    window.atualizarListaProdutos();
                }
                
                console.log('✅ Verificação final do estoque concluída');
            }, 300);
        }, 500);
        

    }
    
    /**
     * Manipula erro na sincronização
     * @param {Error} error - Erro ocorrido
     */
    handleSyncError(error) {
        console.error('❌ Erro na sincronização:', error);
        
        // Atualizar status
        if (typeof updateSyncStatus === 'function') {
            updateSyncStatus('Erro na sincronização', 'error');
        }
        
        // Mostrar notificação de erro
        if (typeof mostrarNotificacaoSync === 'function') {
            const message = error.message.includes('cancelada') 
                ? 'Sincronização cancelada pelo usuário'
                : 'Erro durante a sincronização. Tente novamente.';
            mostrarNotificacaoSync(message, 'error');
        }
    }
    
    /**
     * Limpa o estado da sincronização
     */
    cleanup() {
        this.isActive = false;
        this.cancelRequested = false;
        this.currentStep = 0;
        this.progress = 0;
        
        // Desbloquear interface
        this.unblockInterface();
        
        // Esconder overlay
        setTimeout(() => {
            this.hideOverlay();
        }, 1000);
    }
    
    /**
     * Utilitário para delay
     * @param {number} ms - Milissegundos
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Obtém a URL atual do Google Sheets
     */
    getCurrentUrl() {
        return localStorage.getItem('googleSheetsWebAppUrl');
    }
    
    /**
     * Verifica se a URL está configurada e válida
     */
    isUrlConfigured() {
        const url = this.getCurrentUrl();
        return url && !url.includes('*') && url.trim() !== '';
    }
    
    /**
     * Verifica se a sincronização está ativa
     */
    isRunning() {
        return this.isActive;
    }
    
    /**
     * Força parada da sincronização
     */
    forceStop() {
        console.log('🛑 Forçando parada da sincronização');
        this.cancelRequested = true;
        this.cleanup();
    }
}

// ===== INICIALIZAÇÃO GLOBAL =====
let syncGlobalManager = null;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    syncGlobalManager = new SyncGlobalManager();
    window.syncGlobalManager = syncGlobalManager;
});

// Fallback para inicialização imediata se DOM já estiver pronto
if (document.readyState === 'loading') {
    // DOM ainda carregando, aguardar evento
} else {
    // DOM já pronto, inicializar imediatamente
    syncGlobalManager = new SyncGlobalManager();
    window.syncGlobalManager = syncGlobalManager;
}

// ===== FUNÇÕES UTILITÁRIAS GLOBAIS =====

/**
 * Inicia sincronização global (função pública)
 * @param {string} trigger - Tipo de trigger
 */
window.startGlobalSync = function(trigger = 'manual') {
    if (syncGlobalManager) {
        syncGlobalManager.startSync(trigger);
    } else {
        console.error('❌ Sistema de sincronização não inicializado');
    }
};

/**
 * Verifica se sincronização está ativa (função pública)
 */
window.isGlobalSyncRunning = function() {
    return syncGlobalManager ? syncGlobalManager.isRunning() : false;
};

/**
 * Para sincronização forçadamente (função pública)
 */
window.stopGlobalSync = function() {
    if (syncGlobalManager) {
        syncGlobalManager.forceStop();
    }
};

/**
 * Função de compatibilidade - sincronizarFinanceiro agora é parte do sistema global
 * Esta função é mantida para compatibilidade com código existente
 */
window.sincronizarFinanceiro = async function() {
    if (syncGlobalManager) {
        console.log('🔄 Executando sincronização financeira via sistema global');
        await syncGlobalManager.syncFinanceiro();
    } else {
        console.error('❌ Sistema de sincronização global não disponível');
        throw new Error('Sistema de sincronização global não inicializado');
    }
};

/**
 * Função de compatibilidade - sincronizarEstoque agora é parte do sistema global
 */
window.sincronizarEstoque = async function() {
    if (syncGlobalManager) {
        console.log('🔄 Executando sincronização de estoque via sistema global');
        await syncGlobalManager.syncEstoque();
    } else {
        console.error('❌ Sistema de sincronização global não disponível');
        throw new Error('Sistema de sincronização global não inicializado');
    }
};

console.log('🔄 Sistema de Sincronização Global carregado');
console.log('✅ Funções de compatibilidade (sincronizarFinanceiro, sincronizarEstoque) expostas globalmente');