// Utilitários compartilhados
// Função para carregar dados atualizados do localStorage
function carregarDadosAtualizados() {
  try {
    window.produtos = JSON.parse(localStorage.getItem("produtos") || "[]");
    window.lancamentos = JSON.parse(localStorage.getItem("lancamentos") || "[]");
    
    // Verificar se os dados são válidos
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
    
    console.log('Dados carregados - Produtos:', window.produtos.length, 'Lançamentos:', window.lancamentos.length);
    return { produtos: window.produtos, lancamentos: window.lancamentos };
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    // Em caso de erro, resetar dados
    window.produtos = [];
    window.lancamentos = [];
    localStorage.setItem("produtos", "[]");
    localStorage.setItem("lancamentos", "[]");
    return { produtos: [], lancamentos: [] };
  }
}

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

// Função para formatar moeda brasileira
function formatarMoedaBR(valor) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Função para gerar identificador único
function gerarIdentificadorUnico() {
  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const ano = agora.getFullYear();
  const hora = String(agora.getHours()).padStart(2, '0');
  const minuto = String(agora.getMinutes()).padStart(2, '0');
  const segundo = String(agora.getSeconds()).padStart(2, '0');
  const milissegundo = String(agora.getMilliseconds()).padStart(3, '0');
  
  return `${dia}${mes}${ano}${hora}${minuto}${segundo}${milissegundo}`;
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
  // Remover classes de feedback visual de todos os itens
  const itensEstoque = document.querySelectorAll('.estoque-item.editando, .estoque-item.excluindo');
  itensEstoque.forEach(item => {
    item.classList.remove('editando', 'excluindo');
  });
  
  const itensFinanceiro = document.querySelectorAll('.lancamento-item.editando, .lancamento-item.excluindo');
  itensFinanceiro.forEach(item => {
    item.classList.remove('editando', 'excluindo');
  });
  
  // Remover classe de sincronização desabilitada
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
  
  // Atualizar array de produtos
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
  console.log('Estoque recalculado:', produtos.length, 'produtos');
}

// Expor funções globalmente
window.formatarMoedaBR = formatarMoedaBR;
window.gerarIdentificadorUnico = gerarIdentificadorUnico;
window.salvarProdutos = salvarProdutos;
window.salvarLancamentos = salvarLancamentos;
window.salvarCategorias = salvarCategorias;
window.removerFeedbackVisual = removerFeedbackVisual;
window.carregarDadosAtualizados = carregarDadosAtualizados;
window.recalcularEstoqueGlobal = recalcularEstoqueGlobal;
window.produtos = produtos;
window.lancamentos = lancamentos;
window.categorias = categorias;
window.filtroMes = filtroMes;
window.filtroAno = filtroAno;