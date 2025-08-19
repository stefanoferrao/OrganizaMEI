// Main.js - Arquivo principal unificado
// Contém todas as funcionalidades essenciais do sistema

// ===== UTILITÁRIOS E DADOS GLOBAIS =====

// Inicializar dados
let produtos = JSON.parse(localStorage.getItem("produtos") || "[]");
let lancamentos = JSON.parse(localStorage.getItem("lancamentos") || "[]");
const categorias = JSON.parse(localStorage.getItem("categorias")) || {
  receita: {
    "Vendas": ["Produtos", "Serviços"],
    "Investimentos": ["Rendimentos", "Dividendos"],
    "Outros": ["Doações", "Reembolsos"]
  },
  despesa: {
    "Operacional": ["Aluguel", "Energia", "Água", "Internet"],
    "Pessoal": ["Salários", "Benefícios"],
    "Compras": ["Insumos", "Materiais", "Higiene", "Embalagem"],
    "Outros": ["Impostos", "Multas"]
  }
};

// Variáveis globais de filtro
let filtroMes = null;
let filtroAno = null;

// ===== LOADING MANAGER =====

class LoadingManager {
  constructor() {
    this.isLoading = false;
    this.overlay = null;
    this.originalButtonStates = new Map();
    this.init();
  }

  init() {
    this.createOverlay();
  }

  createOverlay() {
    const existingOverlay = document.getElementById('sync-loading-overlay');
    if (existingOverlay) existingOverlay.remove();

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
    
    const loadingText = this.overlay.querySelector('.loading-text');
    const loadingSubtext = this.overlay.querySelector('.loading-subtext');
    
    if (loadingText) loadingText.textContent = message;
    if (loadingSubtext) loadingSubtext.textContent = subtext;
    
    this.updateProgress(0);
    this.overlay.classList.add('active', 'fade-in');
    this.disableAllInteractions();
    document.body.style.overflow = 'hidden';
  }

  hideLoading() {
    if (!this.isLoading) return;
    
    this.isLoading = false;
    this.overlay.classList.remove('active', 'fade-in');
    this.enableAllInteractions();
    document.body.style.overflow = '';
  }

  disableAllInteractions() {
    const elements = document.querySelectorAll('button, input, select');
    
    elements.forEach(element => {
      this.originalButtonStates.set(element, element.disabled);
      element.disabled = true;
    });
  }

  enableAllInteractions() {
    try {
      this.originalButtonStates.forEach((originalState, element) => {
        try {
          if (element && element.parentNode) {
            element.disabled = originalState;
          }
        } catch (error) {
          console.warn('Erro ao restaurar estado do elemento:', error);
        }
      });
      this.originalButtonStates.clear();
    } catch (error) {
      console.error('Erro ao restaurar interações:', error);
      this.originalButtonStates.clear();
    }
  }

  updateProgress(percentage, message) {
    const progressBar = this.overlay.querySelector('.loading-progress-bar');
    const loadingText = this.overlay.querySelector('.loading-text');
    
    if (progressBar) {
      progressBar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
      progressBar.style.animation = 'none';
    }
    
    if (message && loadingText) {
      loadingText.textContent = message;
    }
  }

  startSyncLoading() {
    this.showLoading('Dados desatualizados - sincronizando...', 'Por favor, aguarde a conclusão');
    this.updateProgress(0, 'Iniciando sincronização...');
  }

  stopSyncLoading() {
    this.hideLoading();
  }

  isCurrentlyLoading() {
    return this.isLoading;
  }
}

// ===== FUNÇÕES UTILITÁRIAS =====

// Função para carregar dados atualizados do localStorage
function carregarDadosAtualizados() {
  try {
    window.produtos = JSON.parse(localStorage.getItem("produtos") || "[]");
    window.lancamentos = JSON.parse(localStorage.getItem("lancamentos") || "[]");
    window.categorias = JSON.parse(localStorage.getItem("categorias")) || {
      receita: {
        "Vendas": ["Produtos", "Serviços"],
        "Investimentos": ["Rendimentos", "Dividendos"],
        "Outros": ["Doações", "Reembolsos"]
      },
      despesa: {
        "Operacional": ["Aluguel", "Energia", "Água", "Internet"],
        "Pessoal": ["Salários", "Benefícios"],
        "Compras": ["Insumos", "Materiais", "Higiene", "Embalagem"],
        "Outros": ["Impostos", "Multas"]
      }
    };
    
    if (!Array.isArray(window.produtos)) {
      console.warn('Dados de produtos inválidos, resetando...');
      window.produtos = [];
      localStorage.setItem("produtos", "[]");
    }
    
    if (!Array.isArray(window.lancamentos)) {
      console.warn('Dados de lançamentos inválidos, resetando...');
      window.lancamentos = [];
      localStorage.setItem("lancamentos", "[]");
    }
    
    // Atualizar filtros globais
    const filtroMes = localStorage.getItem('filtroMes');
    const filtroAno = localStorage.getItem('filtroAno');
    if (filtroMes) window.filtroMes = filtroMes;
    if (filtroAno) window.filtroAno = filtroAno;
    
    // Atualizar variáveis globais antigas para compatibilidade
    produtos = window.produtos;
    lancamentos = window.lancamentos;
    

    
    return { produtos: window.produtos, lancamentos: window.lancamentos };
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    window.produtos = [];
    window.lancamentos = [];
    localStorage.setItem("produtos", "[]");
    localStorage.setItem("lancamentos", "[]");
    return { produtos: [], lancamentos: [] };
  }
}

// Sistema de notificação global unificado
function mostrarNotificacaoSync(message, type = 'info') {
  // Cache container to avoid repeated DOM queries
  let container = mostrarNotificacaoSync._container;
  if (!container) {
    container = document.getElementById('notification-container');
    mostrarNotificacaoSync._container = container;
  }
  
  if (!container) {
    console.log(`[${type.toUpperCase()}] ${message}`);
    return;
  }
  
  container.innerHTML = '';
  const notification = document.createElement('div');
  notification.className = `sync-notification ${type}`;
  
  const iconMap = {
    'success': '<i class="fas fa-check"></i>',
    'error': '<i class="fas fa-times"></i>',
    'warning': '<i class="fas fa-exclamation-triangle"></i>',
    'info': '<i class="fas fa-info-circle"></i>'
  };
  const icon = iconMap[type] || iconMap['info'];
  const sanitizedMessage = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  notification.innerHTML = `<span class="icon">${icon}</span> ${sanitizedMessage}`;
  
  container.appendChild(notification);
  requestAnimationFrame(() => notification.classList.add('show'));
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => container.innerHTML = '', 300);
  }, 2000);
}

// Função para formatar moeda brasileira
function formatarMoedaBR(valor) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Função para gerar identificador único no formato DDMMAAAAHHMMSS
// Exemplo: 31122024143045 (31/12/2024 às 14:30:45)
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

// Funções de salvamento
function salvarProdutos() {
  localStorage.setItem("produtos", JSON.stringify(produtos));
}

function salvarLancamentos() {
  localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
}

function salvarCategorias() {
  localStorage.setItem("categorias", JSON.stringify(categorias));
}

// Função para remover feedback visual após sincronização
function removerFeedbackVisual() {
  const itensEstoque = document.querySelectorAll('.estoque-item.editando, .estoque-item.excluindo');
  itensEstoque.forEach(item => {
    item.classList.remove('editando', 'excluindo');
  });
  
  const itensFinanceiro = document.querySelectorAll('.lancamento-item.editando, .lancamento-item.excluindo');
  itensFinanceiro.forEach(item => {
    item.classList.remove('editando', 'excluindo');
  });
  
  document.body.classList.remove('sync-disabled');
}

// Função para recalcular estoque baseado nas movimentações
function recalcularEstoqueGlobal() {
  const movimentacoesEstoque = JSON.parse(localStorage.getItem('movimentacoesEstoque') || '[]');
  const estoqueCalculado = {};
  
  movimentacoesEstoque.forEach(mov => {
    if (!estoqueCalculado[mov.produto]) {
      estoqueCalculado[mov.produto] = 0;
    }
    
    if (mov.tipoMovimento === 'Entrada') {
      estoqueCalculado[mov.produto] += mov.quantidade;
    } else if (mov.tipoMovimento === 'Saída' || mov.tipoMovimento === 'Venda') {
      estoqueCalculado[mov.produto] -= mov.quantidade;
    }
  });
  
  produtos.length = 0;
  Object.keys(estoqueCalculado)
    .filter(nome => estoqueCalculado[nome] > 0)
    .forEach(nome => {
      produtos.push({
        nome: nome,
        quantidade: estoqueCalculado[nome]
      });
    });
  
  salvarProdutos();

}

// ===== INTEGRIDADE DE DADOS =====

// Função para verificar integridade dos dados
function verificarIntegridadeDados() {
    const lancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');
    const produtos = JSON.parse(localStorage.getItem('produtos') || '[]');
    const movimentacoes = JSON.parse(localStorage.getItem('movimentacoesEstoque') || '[]');
    const url = localStorage.getItem('googleSheetsWebAppUrl');
    
    const problemas = [];
    
    if (url && !url.includes('*')) {
        if (lancamentos.length === 0) {
            problemas.push('Lançamentos financeiros vazios');
        }
        
        if (produtos.length === 0 && movimentacoes.length === 0) {
            problemas.push('Estoque vazio');
        }
        
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
        
        if (typeof sincronizarTudo === 'function') {
            await sincronizarTudo();
            
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

// ===== TESTE DE CONEXÃO =====

// Função para testar conexão com Google Sheets com barra de progresso
async function testarConexaoSheets() {
    const url = getCurrentUrl();
    const btn = document.getElementById('btn-test-connection');
    const originalText = btn.textContent;
    
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
        const progressContainer = document.createElement('div');
        progressContainer.className = 'test-connection-progress';
        progressContainer.innerHTML = `
            <div class="progress-text"></div>
            <div class="progress-bar-container">
                <div class="progress-bar-fill"></div>
            </div>
        `;
        const sheetsActions = document.querySelector('.sheets-actions');
        sheetsActions.appendChild(progressContainer);
        
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span>';
        btn.classList.add('loading');
        
        const progressFill = progressContainer.querySelector('.progress-bar-fill');
        const progressText = progressContainer.querySelector('.progress-text');
        
        progressText.textContent = 'Conectando com Google Sheets...';
        progressFill.style.width = '30%';
        await new Promise(resolve => setTimeout(resolve, 800));
        
        progressText.textContent = 'Verificando configuração...';
        progressFill.style.width = '60%';
        await new Promise(resolve => setTimeout(resolve, 600));
        
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'testarScript' })
        });
        const result = await response.json();
        
        progressText.textContent = 'Finalizando teste...';
        progressFill.style.width = '100%';
        await new Promise(resolve => setTimeout(resolve, 400));
        
        progressContainer.remove();
        
        if (result.success) {
            btn.innerHTML = '✅ Conexão OK!';
            btn.classList.remove('loading');
            btn.classList.add('success');
            
            Swal.fire({
                icon: 'success',
                title: 'Conexão bem-sucedida!',
                text: result.message,
                confirmButtonColor: '#17acaf',
                background: '#2d3748',
                color: '#fff'
            });
        } else {
            btn.innerHTML = '❌ Falha';
            btn.classList.remove('loading');
            btn.classList.add('error');
            
            Swal.fire({
                icon: 'error',
                title: 'Falha na conexão',
                text: result.message,
                confirmButtonColor: '#e53e3e',
                background: '#2d3748',
                color: '#fff'
            });
        }
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('success', 'error');
            btn.disabled = false;
        }, 3000);
        
    } catch (error) {
        const progressContainer = document.querySelector('.test-connection-progress');
        if (progressContainer) progressContainer.remove();
        
        btn.innerHTML = '❌ Erro';
        btn.classList.remove('loading');
        btn.classList.add('error');
        
        Swal.fire({
            icon: 'error',
            title: 'Erro de conexão',
            text: error.message,
            confirmButtonColor: '#e53e3e',
            background: '#2d3748',
            color: '#fff'
        });
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('error');
            btn.disabled = false;
        }, 3000);
    }
}

// ===== SINCRONIZAÇÃO =====

// Função para gerar hash dos dados locais
function gerarHashDadosLocais() {
  const lancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');
  const produtos = JSON.parse(localStorage.getItem('produtos') || '[]');
  
  const dadosLocal = {
    totalFinanceiro: lancamentos.length,
    totalEstoque: produtos.length,
    idsFinanceiro: lancamentos.map(l => String(l.id || '')).filter(id => id).sort(),
    produtosEstoque: produtos.map(p => String(p.nome || '')).filter(nome => nome).sort()
  };
  
  return btoa(JSON.stringify(dadosLocal));
}

// Função para verificar se os dados estão atualizados
async function verificarDadosAtualizados() {
  const url = localStorage.getItem('googleSheetsWebAppUrl');
  
  if (!url || url.includes('*')) {
    console.log('URL não configurada - considerando dados atualizados');
    return true;
  }
  
  try {
    console.log('Verificando se dados locais estão sincronizados com Google Sheets...');
    const hashLocal = gerarHashDadosLocais();
    console.log('Hash local gerado:', hashLocal);
    
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
    console.log('Resultado da verificação de sincronização:', result);
    
    if (result.success) {
      const sincronizado = result.sincronizado;
      console.log('Dados estão sincronizados:', sincronizado);
      return sincronizado;
    } else {
      console.warn('Erro na verificação de sincronização:', result.message);
      return true; // Em caso de erro, considera sincronizado para evitar loops
    }
    
  } catch (error) {
    console.error('Erro ao verificar sincronização:', error);
    return true; // Em caso de erro, considera sincronizado para evitar loops
  }
}

// Função para verificar sincronização usando timestamps dos IDs únicos
async function verificarSincronizacaoInteligente() {
  const url = localStorage.getItem('googleSheetsWebAppUrl');
  
  if (!url || url.includes('*')) {
    console.log('URL não configurada - considerando dados sincronizados');
    return true;
  }
  
  try {
    // Usar nova verificação inteligente se disponível
    if (typeof window.verificarSincronizacaoInteligentePrecisa === 'function') {
      console.log('Usando verificação inteligente precisa...');
      return await window.verificarSincronizacaoInteligentePrecisa();
    }
    
    // Fallback para método antigo (timestamp)
    console.log('Usando verificação por timestamp (fallback)...');
    
    // Obter último ID local (timestamp mais recente)
    const lancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');
    const movimentacoes = JSON.parse(localStorage.getItem('movimentacoesEstoque') || '[]');
    
    let ultimoIdLocal = null;
    const todosIds = [...lancamentos.map(l => l.id), ...movimentacoes.map(m => m.id)]
      .filter(id => id && typeof id === 'string' && id.length === 14)
      .sort();
    
    if (todosIds.length > 0) {
      ultimoIdLocal = todosIds[todosIds.length - 1];
    }
    
    console.log('Último ID local:', ultimoIdLocal);
    
    // Verificar timestamp no Google Sheets
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ 
        action: 'verificarTimestamp',
        timestampLocal: ultimoIdLocal
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.dadosAtualizados;
    } else {
      console.warn('Erro na verificação:', result.message);
      return true; // Em caso de erro, considera sincronizado
    }
    
  } catch (error) {
    console.error('Erro ao verificar sincronização:', error);
    return true; // Em caso de erro, considera sincronizado
  }
}

// Função para executar sincronização automática se necessário
async function acionarSincronizacaoSeNecessario() {
  console.log('=== VERIFICANDO SINCRONIZAÇÃO NA INICIALIZAÇÃO ===');
  
  // Usar nova função de verificação se disponível
  const deveVerificar = typeof window.deveVerificarSincronizacao === 'function' 
    ? window.deveVerificarSincronizacao() 
    : (typeof window.precisaVerificarSincronizacao === 'function' ? window.precisaVerificarSincronizacao() : true);
  
  if (!deveVerificar) {
    console.log('Verificação recente encontrada - pulando verificação');
    if (typeof updateMiniIndicator === 'function') {
      updateMiniIndicator('connected-working');
    }
    return;
  }
  
  const dadosAtualizados = await verificarSincronizacaoInteligente();
  
  // Marcar timestamp da verificação
  if (typeof window.marcarUltimaVerificacao === 'function') {
    window.marcarUltimaVerificacao();
  } else if (typeof window.atualizarTimestampVerificacao === 'function') {
    window.atualizarTimestampVerificacao();
  }
  
  if (!dadosAtualizados) {
    console.log('DADOS DESATUALIZADOS DETECTADOS - Iniciando ressincronização automática');
    
    // Mostrar loading apenas quando sincronização é necessária
    if (typeof window.loadingManager !== 'undefined' && window.loadingManager) {
      window.loadingManager.startSyncLoading();
    }
    
    if (typeof updateMiniIndicator === 'function') {
      updateMiniIndicator('syncing');
    }
    
    setTimeout(async () => {
      if (typeof sincronizarTudo === 'function') {
        try {
          console.log('Executando ressincronização automática...');
          await sincronizarTudo();
          
          // Após sincronização, atualizar todos os módulos
          console.log('Atualizando módulos após sincronização...');
          
          // PRIMEIRO: Recarregar dados atualizados nas variáveis globais
          carregarDadosAtualizados();
          
          // SEGUNDO: Aguardar um pouco para garantir que os dados foram carregados
          setTimeout(() => {
            // Atualizar Financeiro
            if (typeof renderizarLancamentos === 'function') {
              renderizarLancamentos();
            }
            if (typeof renderizarResumoFinanceiro === 'function') {
              renderizarResumoFinanceiro();
            }
            
            // Atualizar Vendas
            if (typeof renderizarVendas === 'function') {
              renderizarVendas();
            }
            
            // Atualizar Estoque
            if (typeof renderizarProdutos === 'function') {
              renderizarProdutos();
            }
            
            // Atualizar Dashboard
            if (typeof renderizarDashboardResumo === 'function') {
              renderizarDashboardResumo();
            }
            
            // Atualizar Filtros (importante para os gráficos)
            if (typeof atualizarFiltroMesAno === 'function') {
              atualizarFiltroMesAno();
            }
            
            // TERCEIRO: Atualizar Gráficos por último, após todos os dados estarem carregados
            setTimeout(() => {
              if (typeof renderizarGrafico === 'function') {
                const ultimoGrafico = localStorage.getItem('ultimoGraficoSelecionado') || 'vendas';
                console.log('Renderizando gráfico após sincronização:', ultimoGrafico);
                renderizarGrafico(ultimoGrafico);
              }
            }, 200);
          }, 300);
          
          if (typeof mostrarNotificacaoSync === 'function') {
            mostrarNotificacaoSync('Dados atualizados!', 'success');
          }
        } catch (error) {
          console.error('Erro na sincronização automática:', error);
          if (typeof mostrarNotificacaoSync === 'function') {
            mostrarNotificacaoSync('Erro na sincronização automática', 'error');
          }
        }
      }
    }, 800);
  } else {
    console.log('Dados estão sincronizados - carregamento normal');
    
    if (typeof updateMiniIndicator === 'function') {
      updateMiniIndicator('connected-working');
    }
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  try {
    // Inicializar loading manager
    loadingManager = new LoadingManager();
    window.loadingManager = loadingManager;
    
    // Ativa apenas a aba dashboard ao iniciar
    document.querySelectorAll('.tab-section').forEach(tab => tab.classList.remove('active'));
    document.getElementById('dashboard').classList.add('active');
    
    // Carregar dados atualizados
    carregarDadosAtualizados();
    
    // Verificar integridade na inicialização
    setTimeout(() => {
        const verificacao = verificarIntegridadeDados();
        
        if (verificacao.temProblemas) {
            console.log('Problemas detectados na inicialização:', verificacao.problemas);
            
            if (verificacao.dadosVazios) {
                if (typeof mostrarNotificacaoSync === 'function') {
                    mostrarNotificacaoSync('Dados vazios detectados, sincronizando...', 'warning');
                }
                
                setTimeout(() => {
                    corrigirProblemasSincronizacao();
                }, 1000);
            }
        } else {
        
        }
    }, 3000);
    
    // Verificar se os dados estão vazios (possível reset de cookies)
    const lancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');
    const produtos = JSON.parse(localStorage.getItem('produtos') || '[]');
    const url = localStorage.getItem('googleSheetsWebAppUrl');
    
    if ((lancamentos.length === 0 || produtos.length === 0) && url && !url.includes('*')) {
      console.log('Dados vazios detectados, forçando sincronização...');
      if (typeof mostrarNotificacaoSync === 'function') {
        mostrarNotificacaoSync('Verificando sincronização...', 'info');
      }
      
      setTimeout(async () => {
        if (typeof sincronizarTudo === 'function') {
          await sincronizarTudo();
        }
      }, 2000);
    } else {
      // SEMPRE verificar se os dados estão atualizados após carregar a página
      setTimeout(() => {
        acionarSincronizacaoSeNecessario();
      }, 1000);
    }
    
    // Exemplo de JS para trocar o conteúdo da análise
    const tipoAnalise = document.getElementById('tipo-analise');
    if (tipoAnalise) {
      tipoAnalise.addEventListener('change', function () {
        const tipo = this.value;
        const conteudo = document.getElementById('analise-conteudo');
        if (tipo === 'vendas') {
          conteudo.textContent = 'Gráfico de vendas no período aqui.';
        } else if (tipo === 'fluxo') {
          conteudo.textContent = 'Fluxo de caixa aqui.';
        }
      });
    }
  } catch (error) {
    console.error('Erro na inicialização:', error);
  }
});

// ===== INICIALIZAÇÃO =====

// Instanciar o gerenciador de loading globalmente
let loadingManager;

// Expor todas as funções globalmente
window.mostrarNotificacaoSync = mostrarNotificacaoSync;
window.formatarMoedaBR = formatarMoedaBR;
window.gerarIdentificadorUnico = gerarIdentificadorUnico;
window.salvarProdutos = salvarProdutos;
window.salvarLancamentos = salvarLancamentos;
window.salvarCategorias = salvarCategorias;
window.removerFeedbackVisual = removerFeedbackVisual;
window.carregarDadosAtualizados = carregarDadosAtualizados;
window.recalcularEstoqueGlobal = recalcularEstoqueGlobal;
window.verificarIntegridadeDados = verificarIntegridadeDados;
window.corrigirProblemasSincronizacao = corrigirProblemasSincronizacao;
window.acionarSincronizacaoSeNecessario = acionarSincronizacaoSeNecessario;
window.verificarDadosAtualizados = verificarDadosAtualizados;
window.verificarSincronizacaoInteligente = verificarSincronizacaoInteligente;
window.gerarHashDadosLocais = gerarHashDadosLocais;
window.testarConexaoSheets = testarConexaoSheets;
window.LoadingManager = LoadingManager;
window.produtos = produtos;
window.lancamentos = lancamentos;
window.categorias = categorias;
window.filtroMes = filtroMes;
window.filtroAno = filtroAno;
