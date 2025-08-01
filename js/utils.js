// Utilitários compartilhados
const produtos = JSON.parse(localStorage.getItem("produtos") || "[]");
const lancamentos = JSON.parse(localStorage.getItem("lancamentos") || "[]");
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

// Expor funções globalmente
window.formatarMoedaBR = formatarMoedaBR;
window.gerarIdentificadorUnico = gerarIdentificadorUnico;
window.salvarProdutos = salvarProdutos;
window.salvarLancamentos = salvarLancamentos;
window.salvarCategorias = salvarCategorias;
window.produtos = produtos;
window.lancamentos = lancamentos;
window.categorias = categorias;
window.filtroMes = filtroMes;
window.filtroAno = filtroAno;