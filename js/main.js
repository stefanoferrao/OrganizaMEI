// Main.js - Arquivo principal unificado
// Contém todas as funcionalidades essenciais do sistema

// ===== UTILITÁRIOS E DADOS GLOBAIS =====

// ===== SISTEMA CENTRALIZADO DE CATEGORIAS =====

/**
 * Sistema centralizado para gerenciar categorias e subcategorias
 * Garante sincronização entre todos os módulos (Financeiro, Categorias, Estoque)
 */
class CategoriaManager {
  constructor() {
    this.DEFAULT_CATEGORIES = {
      receita: {
        "Vendas": ["Produtos", "Serviços"],
        "Investimentos": ["Rendimentos", "Dividendos"],
        "Outros": ["Doações", "Reembolsos"]
      },
      despesa: {
        "Operacional": ["Aluguel", "Água"],
        "Pessoal": ["Salários", "Benefícios"],
        "Compras": ["Insumos", "Materiais"],
        "Quebra": ["Vencimento", "Avaria"],
        "Outros": ["Impostos", "Multas"]
      }
    };

    this.categorias = this.carregarCategorias();
    this.listeners = [];
  }

  /**
   * Carrega categorias do localStorage ou retorna categorias padrão
   */
  carregarCategorias() {
    try {
      const saved = localStorage.getItem('categorias');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Verificar estrutura e mesclar com categorias do financeiro se necessário
        if (parsed.receita && parsed.despesa) {
          return this.mesclarComCategoriasFinanceiro(parsed);
        }
      }
    } catch (e) {
      console.error('Erro ao carregar categorias:', e);
    }

    // Retornar categorias padrão mescladas com financeiro
    return this.mesclarComCategoriasFinanceiro(JSON.parse(JSON.stringify(this.DEFAULT_CATEGORIES)));
  }

  /**
   * Mescla categorias existentes com as do módulo financeiro
   */
  mesclarComCategoriasFinanceiro(categoriasBase) {
    try {
      const lancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');

      lancamentos.forEach(lancamento => {
        const { tipo, categoria, subcategoria } = lancamento;

        if (tipo && categoria && subcategoria) {
          // Garantir que a categoria existe
          if (!categoriasBase[tipo]) {
            categoriasBase[tipo] = {};
          }
          if (!categoriasBase[tipo][categoria]) {
            categoriasBase[tipo][categoria] = [];
          }

          // Adicionar subcategoria se não existir
          if (!categoriasBase[tipo][categoria].includes(subcategoria)) {
            categoriasBase[tipo][categoria].push(subcategoria);
          }
        }
      });
    } catch (e) {
      console.error('Erro ao mesclar categorias do financeiro:', e);
    }

    return categoriasBase;
  }

  /**
   * Salva categorias no localStorage e notifica listeners
   */
  salvarCategorias() {
    try {
      localStorage.setItem('categorias', JSON.stringify(this.categorias));
      this.notificarListeners();
      return true;
    } catch (e) {
      console.error('Erro ao salvar categorias:', e);
      return false;
    }
  }

  /**
   * Obtém todas as categorias
   */
  obterCategorias() {
    return this.categorias;
  }

  /**
   * Obtém categorias de um tipo específico
   */
  obterCategoriasPorTipo(tipo) {
    return this.categorias[tipo] || {};
  }

  /**
   * Obtém subcategorias de uma categoria específica
   */
  obterSubcategorias(tipo, categoria) {
    return (this.categorias[tipo] && this.categorias[tipo][categoria]) ? this.categorias[tipo][categoria] : [];
  }

  /**
   * Adiciona uma nova categoria
   */
  adicionarCategoria(tipo, nomeCategoria) {
    if (!tipo || !nomeCategoria || !nomeCategoria.trim()) {
      return { sucesso: false, erro: 'Tipo e nome da categoria são obrigatórios' };
    }

    const nome = nomeCategoria.trim();

    if (!this.categorias[tipo]) {
      this.categorias[tipo] = {};
    }

    if (this.categorias[tipo][nome]) {
      return { sucesso: false, erro: 'Categoria já existe' };
    }

    this.categorias[tipo][nome] = [];

    if (this.salvarCategorias()) {
      return { sucesso: true, categoria: nome };
    }

    return { sucesso: false, erro: 'Erro ao salvar categoria' };
  }

  /**
   * Adiciona uma nova subcategoria
   */
  adicionarSubcategoria(tipo, categoria, nomeSubcategoria) {
    if (!tipo || !categoria || !nomeSubcategoria || !nomeSubcategoria.trim()) {
      return { sucesso: false, erro: 'Todos os campos são obrigatórios' };
    }

    const nome = nomeSubcategoria.trim();

    if (!this.categorias[tipo] || !this.categorias[tipo][categoria]) {
      return { sucesso: false, erro: 'Categoria não encontrada' };
    }

    if (this.categorias[tipo][categoria].includes(nome)) {
      return { sucesso: false, erro: 'Subcategoria já existe' };
    }

    this.categorias[tipo][categoria].push(nome);

    if (this.salvarCategorias()) {
      return { sucesso: true, subcategoria: nome };
    }

    return { sucesso: false, erro: 'Erro ao salvar subcategoria' };
  }

  /**
   * Edita uma categoria existente
   */
  editarCategoria(tipo, categoriaAntiga, categoriaNova) {
    if (!tipo || !categoriaAntiga || !categoriaNova || !categoriaNova.trim()) {
      return { sucesso: false, erro: 'Todos os campos são obrigatórios' };
    }

    const novoNome = categoriaNova.trim();

    if (!this.categorias[tipo] || !this.categorias[tipo][categoriaAntiga]) {
      return { sucesso: false, erro: 'Categoria não encontrada' };
    }

    if (novoNome !== categoriaAntiga && this.categorias[tipo][novoNome]) {
      return { sucesso: false, erro: 'Nova categoria já existe' };
    }

    // Mover subcategorias para o novo nome
    this.categorias[tipo][novoNome] = this.categorias[tipo][categoriaAntiga];
    delete this.categorias[tipo][categoriaAntiga];

    if (this.salvarCategorias()) {
      return { sucesso: true, categoriaAntiga, categoriaNova: novoNome };
    }

    return { sucesso: false, erro: 'Erro ao salvar alteração' };
  }

  /**
   * Edita uma subcategoria existente
   */
  editarSubcategoria(tipo, categoria, subcategoriaAntiga, subcategoriaNova) {
    if (!tipo || !categoria || !subcategoriaAntiga || !subcategoriaNova || !subcategoriaNova.trim()) {
      return { sucesso: false, erro: 'Todos os campos são obrigatórios' };
    }

    const novoNome = subcategoriaNova.trim();

    if (!this.categorias[tipo] || !this.categorias[tipo][categoria]) {
      return { sucesso: false, erro: 'Categoria não encontrada' };
    }

    const subcategorias = this.categorias[tipo][categoria];
    const index = subcategorias.indexOf(subcategoriaAntiga);

    if (index === -1) {
      return { sucesso: false, erro: 'Subcategoria não encontrada' };
    }

    if (novoNome !== subcategoriaAntiga && subcategorias.includes(novoNome)) {
      return { sucesso: false, erro: 'Nova subcategoria já existe' };
    }

    subcategorias[index] = novoNome;

    if (this.salvarCategorias()) {
      return { sucesso: true, subcategoriaAntiga, subcategoriaNova: novoNome };
    }

    return { sucesso: false, erro: 'Erro ao salvar alteração' };
  }

  /**
   * Remove uma categoria
   */
  removerCategoria(tipo, categoria) {
    if (!tipo || !categoria) {
      return { sucesso: false, erro: 'Tipo e categoria são obrigatórios' };
    }

    if (!this.categorias[tipo] || !this.categorias[tipo][categoria]) {
      return { sucesso: false, erro: 'Categoria não encontrada' };
    }

    delete this.categorias[tipo][categoria];

    if (this.salvarCategorias()) {
      return { sucesso: true, categoria };
    }

    return { sucesso: false, erro: 'Erro ao salvar remoção' };
  }

  /**
   * Remove uma subcategoria
   */
  removerSubcategoria(tipo, categoria, subcategoria) {
    if (!tipo || !categoria || !subcategoria) {
      return { sucesso: false, erro: 'Todos os campos são obrigatórios' };
    }

    if (!this.categorias[tipo] || !this.categorias[tipo][categoria]) {
      return { sucesso: false, erro: 'Categoria não encontrada' };
    }

    const subcategorias = this.categorias[tipo][categoria];
    const index = subcategorias.indexOf(subcategoria);

    if (index === -1) {
      return { sucesso: false, erro: 'Subcategoria não encontrada' };
    }

    subcategorias.splice(index, 1);

    if (this.salvarCategorias()) {
      return { sucesso: true, subcategoria };
    }

    return { sucesso: false, erro: 'Erro ao salvar remoção' };
  }

  /**
   * Adiciona um listener para mudanças nas categorias
   */
  adicionarListener(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  /**
   * Remove um listener
   */
  removerListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notifica todos os listeners sobre mudanças
   */
  notificarListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.categorias);
      } catch (e) {
        console.error('Erro ao notificar listener:', e);
      }
    });
  }

  /**
   * Força sincronização com dados do financeiro
   */
  sincronizarComFinanceiro() {
    const categoriasAtualizadas = this.mesclarComCategoriasFinanceiro(this.categorias);
    this.categorias = categoriasAtualizadas;
    this.salvarCategorias();
  }
}

// Instância global do gerenciador de categorias
const categoriaManager = new CategoriaManager();

// Inicializar dados
let produtos = JSON.parse(localStorage.getItem("produtos") || "[]");
let lancamentos = JSON.parse(localStorage.getItem("lancamentos") || "[]");
let categorias = categoriaManager.obterCategorias();

// Variáveis globais de filtro
let filtroMes = null;
let filtroAno = null;

// ===== LOADING MANAGER REMOVIDO =====
// Agora usa o sistema de sincronização global do sync-global.js

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
        "Operacional": ["Aluguel", "Água"],
        "Pessoal": ["Salários", "Benefícios"],
        "Compras": ["Insumos", "Materiais"],
        "Quebra": ["Vencimento", "Avaria"],
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

// Sistema de notificação global unificado - Integrado com sistema global
function mostrarNotificacaoSync(message, type = 'info') {
  // Aguardar o DaisyUI estar carregado
  if (window.DaisyUINotifications) {
    return window.DaisyUINotifications.show(message, type);
  } else {
    // Fallback temporário até o DaisyUI carregar
    console.log(`Notificação (${type}): ${message}`);
    setTimeout(() => {
      if (window.DaisyUINotifications) {
        window.DaisyUINotifications.show(message, type);
      }
    }, 100);
  }
}

// Aliases globais para compatibilidade
window.showNotification = (message, type) => mostrarNotificacaoSync(message, type);
window.notify = (message, type) => mostrarNotificacaoSync(message, type);

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
  return categoriaManager.salvarCategorias();
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
    } else if (mov.tipoMovimento === 'Saída' || mov.tipoMovimento === 'Venda' || mov.tipoMovimento === 'Quebra') {
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
    dadosVazios: lancamentos.length === 0 && produtos.length === 0 && movimentacoes.length === 0
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

    // Usar sistema de sincronização global
    if (typeof window.startGlobalSync === 'function') {
      window.startGlobalSync('auto');
      return; // Sair aqui pois o sistema global cuidará de tudo
    }

    if (typeof updateMiniIndicator === 'function') {
      updateMiniIndicator('syncing');
    }

    setTimeout(async () => {
      // O sistema global já cuidou da sincronização completa
      console.log('Sincronização automática delegada ao sistema global');
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
    // Aplicar classe de carregamento para desabilitar botões
    document.body.classList.add('page-loading');

    // Sistema de loading agora é gerenciado pelo sync-global.js

    // Ativa apenas a aba dashboard ao iniciar
    document.querySelectorAll('.tab-section').forEach(tab => tab.classList.remove('active'));
    document.getElementById('dashboard').classList.add('active');

    // Carregar dados atualizados
    carregarDadosAtualizados();

    // Sincronizar categorias com dados do financeiro na inicialização
    if (categoriaManager) {
      categoriaManager.sincronizarComFinanceiro();

      // Adicionar listener para atualizar todos os módulos quando categorias mudarem
      categoriaManager.adicionarListener((categoriasAtualizadas) => {
        // Atualizar variáveis globais
        window.categorias = categoriasAtualizadas;
        categorias = categoriasAtualizadas;

        // Atualizar módulo financeiro
        if (typeof atualizarCategorias === 'function') {
          setTimeout(() => atualizarCategorias(), 100);
        }

        // Atualizar outros módulos que dependem de categorias
        if (typeof atualizarCategoriasEdicao === 'function') {
          setTimeout(() => atualizarCategoriasEdicao(), 100);
        }

        // Notificar outros módulos sobre a atualização
        const evento = new CustomEvent('categoriasAtualizadas', {
          detail: { categorias: categoriasAtualizadas }
        });
        document.dispatchEvent(evento);

        console.log('Categorias sincronizadas em todos os módulos');
      });
    }

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
    const movimentacoes = JSON.parse(localStorage.getItem('movimentacoesEstoque') || '[]');
    const url = localStorage.getItem('googleSheetsWebAppUrl');

    // Considerar dados vazios apenas se:
    // 1. Não há lançamentos financeiros E
    // 2. Não há produtos E não há movimentações de estoque
    const dadosVazios = lancamentos.length === 0 && produtos.length === 0 && movimentacoes.length === 0;

    if (dadosVazios && url && !url.includes('*')) {
      console.log('Dados vazios detectados, forçando sincronização...');
      if (typeof mostrarNotificacaoSync === 'function') {
        mostrarNotificacaoSync('Verificando sincronização...', 'info');
      }

      setTimeout(async () => {
        if (typeof window.startGlobalSync === 'function') {
          window.startGlobalSync('auto');
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

    // Remover classe de carregamento após inicialização completa
    // Aguardar que todos os módulos sejam carregados
    const enableButtons = () => {
      document.body.classList.remove('page-loading');
      console.log('Página totalmente carregada - botões reabilitados');

      // Disparar evento customizado para notificar outros módulos
      const event = new CustomEvent('pageFullyLoaded', {
        detail: { timestamp: Date.now() }
      });
      document.dispatchEvent(event);
    };

    // Aguardar carregamento de todos os módulos críticos
    let modulesLoaded = 0;
    const totalModules = 3; // estoque, relatorio, financeiro

    const checkModulesLoaded = () => {
      modulesLoaded++;
      if (modulesLoaded >= totalModules) {
        setTimeout(enableButtons, 1000); // Aguardar mais 1 segundo após todos os módulos
      }
    };

    // Verificar se funções dos módulos estão disponíveis
    const checkModule = (moduleName, checkFunction) => {
      if (typeof checkFunction === 'function') {
        console.log(`Módulo ${moduleName} carregado`);
        checkModulesLoaded();
      } else {
        setTimeout(() => checkModule(moduleName, checkFunction), 100);
      }
    };

    // Verificar módulos principais
    setTimeout(() => {
      checkModule('estoque', window.renderizarProdutos);
      checkModule('relatorio', window.renderizarRelatorios);
      checkModule('financeiro', window.renderizarLancamentos);
    }, 500);

    // Fallback: remover classe após 5 segundos independentemente
    setTimeout(() => {
      if (document.body.classList.contains('page-loading')) {
        console.warn('Timeout atingido - forçando habilitação dos botões');
        enableButtons();
      }
    }, 5000);

  } catch (error) {
    console.error('Erro na inicialização:', error);
    // Remover classe de carregamento mesmo em caso de erro
    setTimeout(() => {
      document.body.classList.remove('page-loading');
      console.log('Botões reabilitados após erro na inicialização');
    }, 3000);
  }
});

// ===== INICIALIZAÇÃO =====

// Loading manager removido - agora usa sistema global

// Função global para forçar habilitação dos botões (para debug)
window.forceEnableButtons = function () {
  document.body.classList.remove('page-loading');
  console.log('Botões forçadamente habilitados');
};

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

window.produtos = produtos;
window.lancamentos = lancamentos;
window.categorias = categorias;
window.filtroMes = filtroMes;
window.filtroAno = filtroAno;

// Expor sistema de categorias globalmente
window.categoriaManager = categoriaManager;
window.CategoriaManager = CategoriaManager;

// Função global para forçar sincronização de categorias
window.sincronizarCategorias = function () {
  if (categoriaManager) {
    categoriaManager.sincronizarComFinanceiro();
    console.log('Categorias sincronizadas manualmente');
    return true;
  }
  return false;
};

// Função para obter categorias atualizadas (compatibilidade)
window.obterCategoriasAtualizadas = function () {
  return categoriaManager ? categoriaManager.obterCategorias() : categorias;
};

// Função de compatibilidade - sincronizarTudo agora usa o sistema global
window.sincronizarTudo = async function() {
  if (typeof window.startGlobalSync === 'function') {
    console.log('🔄 Executando sincronização completa via sistema global');
    return window.startGlobalSync('manual');
  } else {
    console.error('❌ Sistema de sincronização global não disponível');
    throw new Error('Sistema de sincronização global não inicializado');
  }
};

// ===== DAISYUI GLOBAL SYSTEM =====

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
function mostrarNotificacaoSyncDaisyUI(message, type = 'info') {
  return window.DaisyUINotifications.show(message, type);
}

// Aliases globais
window.showDaisyNotification = (message, type) => window.DaisyUINotifications.show(message, type);
window.daisyNotify = (message, type) => window.DaisyUINotifications.show(message, type);

// Expor função globalmente para compatibilidade
window.mostrarNotificacaoSyncDaisyUI = mostrarNotificacaoSyncDaisyUI;

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

// Sistema de Paginação Global
class DaisyUIPagination {
  constructor() {
    this.defaultItemsPerPage = 10;
  }

  // Salvar quantidade de itens por página para um módulo específico
  saveItemsPerPage(module, itemsPerPage) {
    localStorage.setItem(`itensPorPagina${module}`, itemsPerPage);
  }

  // Carregar quantidade de itens por página para um módulo específico
  loadItemsPerPage(module) {
    return parseInt(localStorage.getItem(`itensPorPagina${module}`)) || this.defaultItemsPerPage;
  }

  // Configurar select de itens por página
  setupItemsPerPageSelect(selectId, module, callback) {
    const select = document.getElementById(selectId);
    if (!select) return;

    // Carregar valor salvo
    const savedValue = this.loadItemsPerPage(module);
    select.value = savedValue;

    // Adicionar evento de mudança
    select.addEventListener('change', () => {
      const newValue = parseInt(select.value);
      this.saveItemsPerPage(module, newValue);
      if (callback) callback(newValue);
    });

    return savedValue;
  }
}

// Instância global
window.DaisyUIPagination = new DaisyUIPagination();