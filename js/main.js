const produtos = JSON.parse(localStorage.getItem("produtos") || "[]");

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

// Expor função globalmente
window.gerarIdentificadorUnico = gerarIdentificadorUnico;

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

function salvarCategorias() {
  localStorage.setItem("categorias", JSON.stringify(categorias));
}
// Interface de categorias
function renderizarListaCategorias() {
  const div = document.getElementById("lista-categorias");
  if (!div) return;
  let html = "";
  ["receita", "despesa"].forEach(tipo => {
    html += `<h3 class='cat-titulo'>${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</h3>`;
    // Campo de adição de categoria logo abaixo do título
    html += `<div class='cat-add-div'><input type='text' id='add-cat-${tipo}' placeholder='Nova categoria...' class='cat-add-input'><button onclick="adicionarCategoria('${tipo}')">Adicionar</button></div>`;
    Object.keys(categorias[tipo]).forEach(cat => {
      const subs = categorias[tipo][cat];
      html += `
        <div class="cat-card" id="cat-${tipo}-${cat}">
          <div class="cat-header">
            <span class="cat-nome">${cat}</span>
            <span class="cat-sub-count">${subs.length} subcategorias</span>
            <div>
              <button class="cat-btn-editar" title="Editar" onclick="editarCategoria('${tipo}','${cat}')">✏️</button>
              <button class="cat-btn-remover" title="Remover" onclick="removerCategoria('${tipo}','${cat}')"><span class="cat-icon-remover">&#128465;</span></button>
            </div>
          </div>
          <ul class="cat-sub-lista">
            ${subs.map(sub => `
              <li class="cat-sub-item" id="sub-${tipo}-${cat}-${sub}">
                <span class="cat-sub-nome">${sub}</span>
                <div>
                  <button class="cat-btn-editar-sub" title="Editar" onclick="editarSubcategoria('${tipo}','${cat}','${sub}')">✏️</button>
                  <button class="cat-btn-remover-sub" title="Remover" onclick="removerSubcategoria('${tipo}','${cat}','${sub}')">🗑️</button>
                </div>
              </li>
            `).join("")}
          </ul>
        </div>
      `;
    });
  });
  div.innerHTML = html;
  // Botão + para adicionar subcategoria
  Object.keys(categorias).forEach(tipo => {
    Object.keys(categorias[tipo]).forEach(cat => {
      const subList = document.getElementById(`cat-${tipo}-${cat}`);
      if (subList) {
        const addSubDiv = document.createElement('div');
        addSubDiv.innerHTML = `<button class='btn-add-sub-plus' onclick="abrirPopupSubcategoria('${tipo}', '${cat}')">+</button>`;
        addSubDiv.classList.add('add-sub-div');
        subList.appendChild(addSubDiv);
      }
    });
  });
  // Adicionar categoria
  window.adicionarCategoria = function (tipo) {
    const input = document.getElementById('add-cat-' + tipo);
    const nome = input.value.trim();
    if (!nome) return alert('Digite o nome da categoria.');
    if (categorias[tipo][nome]) return alert('Categoria já existe!');
    categorias[tipo][nome] = [];
    salvarCategorias();
    renderizarListaCategorias();
    atualizarCategorias();
    atualizarCategoriaSubcategoriaForm();
  }

  // Abrir popup para adicionar subcategoria
  window.abrirPopupSubcategoria = function (tipo, cat) {
    Swal.fire({
      title: 'Nova Subcategoria',
      text: `Adicionar subcategoria para: ${cat}`,
      input: 'text',
      inputPlaceholder: 'Nome da subcategoria...',
      showCancelButton: true,
      confirmButtonText: 'Adicionar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#38a169',
      cancelButtonColor: '#4a5568',
      background: '#232b38',
      color: '#e2e8f0',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Digite o nome da subcategoria!';
        }
        if (categorias[tipo][cat].includes(value.trim())) {
          return 'Subcategoria já existe!';
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const nome = result.value.trim();
        categorias[tipo][cat].push(nome);
        salvarCategorias();
        renderizarListaCategorias();
        atualizarCategorias();
        atualizarCategoriaSubcategoriaForm();
        Swal.fire({
          title: 'Sucesso!',
          text: `Subcategoria "${nome}" adicionada!`,
          icon: 'success',
          confirmButtonColor: '#38a169',
          background: '#232b38',
          color: '#e2e8f0'
        });
      }
    });
  }

  // Editar categoria
  window.editarCategoria = function (tipo, cat) {
    const card = document.getElementById(`cat-${tipo}-${cat}`);
    if (!card) return;
    const nomeSpan = card.querySelector('.cat-nome');
    const oldNome = cat;
    nomeSpan.innerHTML = `<input type='text' value='${cat}' id='edit-cat-input-${tipo}-${cat}' class='cat-edit-input'> <button onclick="confirmarEditarCategoria('${tipo}','${cat}')">Salvar</button> <button onclick="renderizarListaCategorias()">Cancelar</button>`;
  }

  window.confirmarEditarCategoria = function (tipo, cat) {
    const input = document.getElementById(`edit-cat-input-${tipo}-${cat}`);
    const novoNome = input.value.trim();
    if (!novoNome) return alert('Digite o nome da categoria.');
    if (categorias[tipo][novoNome] && novoNome !== cat) return alert('Já existe uma categoria com esse nome!');
    categorias[tipo][novoNome] = categorias[tipo][cat];
    delete categorias[tipo][cat];
    salvarCategorias();
    renderizarListaCategorias();
    atualizarCategorias();
    atualizarCategoriaSubcategoriaForm();
  }

  // Editar subcategoria
  window.editarSubcategoria = function (tipo, cat, sub) {
    const subItem = document.getElementById(`sub-${tipo}-${cat}-${sub}`);
    if (!subItem) return;
    const nomeSpan = subItem.querySelector('.cat-sub-nome');
    nomeSpan.innerHTML = `<input type='text' value='${sub}' id='edit-sub-input-${tipo}-${cat}-${sub}' class='cat-edit-sub-input'> <button onclick="confirmarEditarSubcategoria('${tipo}','${cat}','${sub}')">Salvar</button> <button onclick="renderizarListaCategorias()">Cancelar</button>`;
  }

  window.confirmarEditarSubcategoria = function (tipo, cat, sub) {
    const input = document.getElementById(`edit-sub-input-${tipo}-${cat}-${sub}`);
    const novoNome = input.value.trim();
    if (!novoNome) return alert('Digite o nome da subcategoria.');
    if (categorias[tipo][cat].includes(novoNome) && novoNome !== sub) return alert('Já existe uma subcategoria com esse nome!');
    const idx = categorias[tipo][cat].indexOf(sub);
    if (idx !== -1) categorias[tipo][cat][idx] = novoNome;
    salvarCategorias();
    renderizarListaCategorias();
    atualizarCategorias();
    atualizarCategoriaSubcategoriaForm();
  }
}

window.removerCategoria = function (tipo, cat) {
  if (confirm(`Remover categoria '${cat}'?`)) {
    delete categorias[tipo][cat];
    salvarCategorias();
    renderizarListaCategorias();
    atualizarCategorias();
    atualizarCategoriaSubcategoriaForm();
  }
}

window.removerSubcategoria = function (tipo, cat, sub) {
  if (confirm(`Remover subcategoria '${sub}'?`)) {
    categorias[tipo][cat] = categorias[tipo][cat].filter(s => s !== sub);
    salvarCategorias();
    renderizarListaCategorias();
    atualizarCategorias();
    atualizarCategoriaSubcategoriaForm();
  }
}

function atualizarCategoriaSubcategoriaForm() {
  // Para o formulário de subcategoria
  const tipoSelect = document.getElementById("tipo-subcategoria");
  const categoriaSelect = document.getElementById("categoria-subcategoria");
  if (!tipoSelect || !categoriaSelect) return;
  categoriaSelect.innerHTML = "";
  const tipo = tipoSelect.value;
  Object.keys(categorias[tipo]).forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoriaSelect.appendChild(opt);
  });
}
let filtroMes = null;
let filtroAno = null;

function salvarProdutos() {
  localStorage.setItem("produtos", JSON.stringify(produtos));
}

function salvarLancamentos() {
  localStorage.setItem("lancamentos", JSON.stringify(lancamentos));
}

function renderizarProdutos() {
  const lista = document.getElementById("estoque-lista");
  lista.innerHTML = "";
  produtos.forEach((p, index) => {
    const item = document.createElement("li");
    item.classList.add("estoque-item");
    item.innerHTML = `
      <div class="estoque-info">
        <span class="estoque-nome">${p.nome}</span>
        <span class="estoque-quantidade">${p.quantidade} <small>unidades</small></span>
      </div>
      <div class="estoque-acoes">
        <button class="btn-remover" title="Remover" onclick="removerProduto(${index})">
          <span class="icon-remover">&#128465;</span>
        </button>
        <button class="btn-saida" title="Saída" onclick="abrirSaidaProduto(${index})">
          <span class="icon-saida">&#8594;</span>
        </button>
      </div>
    `;
    lista.appendChild(item);
  });
  atualizarSelectSaida();
}

function atualizarSelectSaida() {
  const select = document.getElementById("saida-produto");
  if (!select) return;
  select.innerHTML = "";
  produtos.forEach((p, idx) => {
    const option = document.createElement("option");
    option.value = idx;
    option.textContent = `${p.nome} (${p.quantidade} unidades)`;
    select.appendChild(option);
  });
}

function renderizarLancamentos() {
  const lista = document.getElementById("financeiro-lista");
  if (!lista) return;
  lista.innerHTML = "";
  let filtrados = lancamentos.map((l, idx) => {
    let dataObj = null;
    if (l.data) {
      // Se a data está no formato DD/MM/AAAA
      if (l.data.includes('/')) {
        const [dia, mes, ano] = l.data.split('/');
        dataObj = new Date(ano, mes - 1, dia);
      } else {
        // Se ainda está no formato ISO
        dataObj = new Date(l.data);
      }
    }
    return {
      ...l,
      _originalIndex: idx,
      data: dataObj
    };
  });
  if (filtroMes && filtroAno) {
    filtrados = filtrados.filter(l => {
      if (!l.data) return false;
      const d = l.data;
      return d.getMonth() + 1 === Number(filtroMes) && d.getFullYear() === Number(filtroAno);
    });
  }
  filtrados = filtrados.sort((a, b) => {
    if (!a.data && !b.data) return 0;
    if (!a.data) return 1;
    if (!b.data) return -1;
    return b.data - a.data;
  });
  filtrados.forEach((l) => {
    const item = document.createElement("li");
    let tipoIcon = l.tipo === "receita" ? (l.categoria === "Vendas" ? "🛒" : "💰") : "💸";
    let tipoCor = l.tipo === "receita" ? (l.categoria === "Vendas" ? "#3182ce" : "#38a169") : "#e53e3e";
    item.classList.add('lancamento-item');
    item.style.background = tipoCor;
    item.innerHTML = `
      <span class="lancamento-info">
        <span class="lancamento-icon">${tipoIcon}</span>
        <span>
          <strong>${l.categoria || "-"}</strong> / <em>${l.subcategoria || "-"}</em><br>
          <span class="lancamento-descricao">${l.descricao}</span>
          ${l.quantidade && l.quantidade > 1 ? `<br><small>Qtd: ${l.quantidade}</small>` : ''}
        </span>
      </span>
      <span class="lancamento-valor-container">
        <span class="lancamento-valor" title="Valor unitário: R$ ${(l.valor / (l.quantidade || 1)).toFixed(2)}">R$ ${l.valor.toFixed(2)}</span><br>
         <span class="lancamento-data">${l.data ? (typeof l.data === 'string' && l.data.includes('/') ? l.data : l.data.toLocaleDateString('pt-BR')) : ""}</span>
      </span>
      <button onclick="removerLancamento(${l._originalIndex})" class="lancamento-btn-remover">&#128465;</button>
    `;
    lista.appendChild(item);
  });
  renderizarResumoFinanceiro();
}

function renderizarResumoFinanceiro() {
  const div = document.getElementById("resumo-financeiro");
  if (!div) return;
  let filtrados = lancamentos;
  if (filtroMes && filtroAno) {
    filtrados = lancamentos.filter(l => {
      if (!l.data) return false;
      let d;
      if (typeof l.data === 'string' && l.data.includes('/')) {
        const [dia, mes, ano] = l.data.split('/');
        d = new Date(ano, mes - 1, dia);
      } else {
        d = new Date(l.data);
      }
      return d.getMonth() + 1 === filtroMes && d.getFullYear() === filtroAno;
    });
  }
  const totalReceitas = filtrados.filter(l => l.tipo === "receita").reduce((acc, l) => acc + l.valor, 0);
  const totalDespesas = filtrados.filter(l => l.tipo === "despesa").reduce((acc, l) => acc + l.valor, 0);
  const saldo = totalReceitas - totalDespesas;
  div.innerHTML = `
    <strong>Receitas:</strong> R$ ${totalReceitas.toFixed(2)}<br>
    <strong>Despesas:</strong> R$ ${totalDespesas.toFixed(2)}<br>
    <strong>Saldo:</strong> R$ ${saldo.toFixed(2)}
  `;
}

async function removerLancamento(index) {
  const lancamento = lancamentos[index];
  
  // Remover imediatamente da interface para melhor UX
  lancamentos.splice(index, 1);
  salvarLancamentos();
  renderizarLancamentos();
  
  // Verificar sincronização com Google Sheets
  if (lancamento.id && typeof excluirLancamentoSheets === 'function') {
    try {
      // Atualizar indicador para "sincronizando"
      if (typeof updateSyncIndicator === 'function') {
        updateSyncIndicator('syncing');
      }
      
      const sucesso = await excluirLancamentoSheets(lancamento.id);
      
      if (sucesso) {
        // Item deletado com sucesso do Google Sheets
        if (typeof updateSyncIndicator === 'function') {
          updateSyncIndicator('success');
        }
      } else {
        // Erro ao deletar do Google Sheets - mostrar aviso
        if (typeof updateSyncIndicator === 'function') {
          updateSyncIndicator('error');
        }
        mostrarAvisoImportacao();
      }
    } catch (error) {
      console.error('Erro ao excluir do Google Sheets:', error);
      // Erro de conexão - mostrar aviso
      if (typeof updateSyncIndicator === 'function') {
        updateSyncIndicator('error');
      }
      mostrarAvisoImportacao();
    }
  } else {
    // Item sem ID ou função não disponível - mostrar aviso
    if (typeof updateSyncIndicator === 'function') {
      updateSyncIndicator('error');
    }
    mostrarAvisoImportacao();
  }
}

// Função para mostrar aviso de importação
function mostrarAvisoImportacao() {
  // Criar ou atualizar elemento de aviso
  let avisoElement = document.getElementById('aviso-importacao');
  
  if (!avisoElement) {
    avisoElement = document.createElement('div');
    avisoElement.id = 'aviso-importacao';
    avisoElement.className = 'aviso-importacao';
    
    // Inserir após o sync-indicator
    const syncContainer = document.querySelector('.sync-status-container');
    if (syncContainer) {
      syncContainer.appendChild(avisoElement);
    }
  }
  
  avisoElement.innerHTML = `
    <div class="aviso-content">
      <span class="aviso-icon">⚠️</span>
      <span class="aviso-texto">Item não sincronizado com a planilha. Recomendamos importar os dados novamente em "Configurações".</span>
      <button class="aviso-btn" onclick="irParaConfiguracoes()">Ir para Configurações</button>
      <button class="aviso-fechar" onclick="fecharAviso()">×</button>
    </div>
  `;
  
  avisoElement.style.display = 'block';
  
  // Auto-ocultar após 10 segundos
  setTimeout(() => {
    if (avisoElement) {
      avisoElement.style.display = 'none';
    }
  }, 10000);
}

// Função para ir para configurações
function irParaConfiguracoes() {
  changeTab('configuracoes');
  fecharAviso();
}

// Função para fechar aviso
function fecharAviso() {
  const avisoElement = document.getElementById('aviso-importacao');
  if (avisoElement) {
    avisoElement.style.display = 'none';
  }
}

window.removerLancamento = removerLancamento;
window.mostrarAvisoImportacao = mostrarAvisoImportacao;
window.irParaConfiguracoes = irParaConfiguracoes;
window.fecharAviso = fecharAviso;

function removerProduto(index) {
  produtos.splice(index, 1);
  salvarProdutos();
  renderizarProdutos();
}

window.removerProduto = function (index) {
  if (confirm('Tem certeza que deseja remover este produto do estoque?')) {
    if (confirm('Esta ação é irreversível. Deseja realmente excluir?')) {
      produtos.splice(index, 1);
      salvarProdutos();
      renderizarProdutos();
    }
  }
};

function abrirSaidaProduto(index) {
  // Abre modal de saída
  const modal = document.getElementById("saida-modal");
  const produtoInfo = document.getElementById("saida-modal-produto");
  const qtdInput = document.getElementById("saida-modal-quantidade");
  modal.classList.remove('modal-hidden');
  produtoInfo.textContent = `${produtos[index].nome} (${produtos[index].quantidade} unidades disponíveis)`;
  qtdInput.value = "";
  qtdInput.focus();
  modal.dataset.produtoIndex = index;
}

function registrarSaidaProduto(e) {
  e.preventDefault();
  const select = document.getElementById("saida-produto");
  const qtdInput = document.getElementById("saida-quantidade");
  const idx = parseInt(select.value);
  const qtd = parseInt(qtdInput.value);
  if (!isNaN(idx) && !isNaN(qtd) && qtd > 0 && produtos[idx].quantidade >= qtd) {
    produtos[idx].quantidade -= qtd;
    salvarProdutos();
    renderizarProdutos();
    qtdInput.value = "";
  } else {
    alert("Quantidade inválida ou insuficiente!");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // Renderiza lista de vendas
  function formatarDataBR(dataStr) {
    if (!dataStr) return "";
    const [ano, mes, dia] = dataStr.split("-");
    if (ano && mes && dia) return `${dia}/${mes}/${ano}`;
    return dataStr;
  }
  function renderizarVendas() {
    const lista = document.getElementById("vendas-lista");
    if (!lista) return;
    lista.innerHTML = "";
    
    const vendas = lancamentos.filter(l => l.tipo === "receita" && l.categoria === "Vendas");
    if (vendas.length === 0) {
      lista.innerHTML = '<li class="venda-empty">Nenhuma venda registrada.</li>';
      return;
    }
    
    vendas.sort((a, b) => {
      if (!a.data && !b.data) return 0;
      if (!a.data) return 1;
      if (!b.data) return -1;
      
      let dataA, dataB;
      if (typeof a.data === 'string' && a.data.includes('/')) {
        const [dia, mes, ano] = a.data.split('/');
        dataA = new Date(ano, mes - 1, dia);
      } else {
        dataA = new Date(a.data);
      }
      
      if (typeof b.data === 'string' && b.data.includes('/')) {
        const [dia, mes, ano] = b.data.split('/');
        dataB = new Date(ano, mes - 1, dia);
      } else {
        dataB = new Date(b.data);
      }
      
      return dataB - dataA;
    });
    
    vendas.forEach((v, idx) => {
      const dataFormatada = v.data ? (typeof v.data === 'string' && v.data.includes('/') ? v.data : new Date(v.data).toLocaleDateString('pt-BR')) : '';
      const li = document.createElement('li');
      li.className = 'venda-item';
      li.innerHTML = `
        <span class="venda-icon">🛒</span>
        <div class="venda-main">
          <span class="venda-produto">${v.descricao || v.subcategoria || '-'}</span>
          <span class="venda-quantidade">${v.quantidade ? v.quantidade + ' un.' : ''}</span>
        </div>
        <div class="venda-meta">
          <span class="venda-valor">R$ ${v.valor.toFixed(2)}</span>
          <span class="venda-data-row">
            <span class="venda-data">${dataFormatada}</span>
            <span class="icon-editar-data" title="Editar data">🗓️</span>
            <input type="date" value="${v.data && typeof v.data === 'string' && v.data.includes('/') ? v.data.split('/').reverse().join('-') : v.data || ''}" class="venda-data-input" style="display: none;" />
            <span class="icon-salvar-data" title="Salvar data" style="display: none;">✔️</span>
          </span>
        </div>
      `;
      
      const editarIcon = li.querySelector('.icon-editar-data');
      const inputData = li.querySelector('.venda-data-input');
      const salvarIcon = li.querySelector('.icon-salvar-data');
      const labelData = li.querySelector('.venda-data');
      
      editarIcon.onclick = function () {
        inputData.style.display = 'inline';
        salvarIcon.style.display = 'inline';
        editarIcon.style.display = 'none';
        labelData.style.display = 'none';
        inputData.focus();
      };
      
      salvarIcon.onclick = function () {
        const novaData = inputData.value;
        if (!novaData) {
          alert('Por favor, selecione uma data válida.');
          return;
        }
        
        const vendaIndex = lancamentos.findIndex(l => 
          l.tipo === "receita" && 
          l.categoria === "Vendas" && 
          l.descricao === v.descricao && 
          Math.abs(l.valor - v.valor) < 0.01 && 
          l.data === v.data
        );
        
        if (vendaIndex !== -1) {
          // Converter de AAAA-MM-DD para DD/MM/AAAA
          const [ano, mes, dia] = novaData.split('-');
          lancamentos[vendaIndex].data = `${dia}/${mes}/${ano}`;
          salvarLancamentos();
          renderizarVendas();
          renderizarLancamentos();
          renderizarDashboardResumo();
        } else {
          alert('Erro: não foi possível encontrar a venda para atualizar.');
        }
      };
      
      inputData.onkeydown = function (e) {
        if (e.key === 'Enter') {
          salvarIcon.onclick();
        }
      };
      
      lista.appendChild(li);
    });
  }

  // Expor renderizarVendas globalmente
  window.renderizarVendas = renderizarVendas;
  
  // Atualiza vendas ao trocar para aba
  document.querySelectorAll('button[onclick^="changeTab("]')
    .forEach(btn => {
      btn.addEventListener('click', function () {
        const tab = btn.getAttribute('onclick');
        if (tab.includes("vendas")) {
          setTimeout(() => renderizarVendas(), 100);
        }
        if (tab.includes("dashboard")) {
          setTimeout(() => {
            atualizarFiltroMesAno();
            renderizarLancamentos();
            renderizarDashboardResumo();
          }, 100);
        }
      });
    });

  // Renderiza vendas ao iniciar se aba estiver ativa
  if (document.getElementById('vendas').classList.contains('active')) {
    renderizarVendas();
  }
  // Cadastro de categoria
  const formCategoria = document.getElementById("form-categoria");
  if (formCategoria) {
    formCategoria.addEventListener("submit", function (e) {
      e.preventDefault();
      const tipo = document.getElementById("tipo-categoria").value;
      const nome = document.getElementById("nome-categoria").value.trim();
      if (nome && !categorias[tipo][nome]) {
        categorias[tipo][nome] = [];
        salvarCategorias();
        renderizarListaCategorias();
        atualizarCategorias();
        atualizarCategoriaSubcategoriaForm();
        document.getElementById("nome-categoria").value = "";
      }
    });
    document.getElementById("tipo-categoria").addEventListener("change", atualizarCategoriaSubcategoriaForm);
  }

  // Cadastro de subcategoria
  const formSubcategoria = document.getElementById("form-subcategoria");
  if (formSubcategoria) {
    formSubcategoria.addEventListener("submit", function (e) {
      e.preventDefault();
      const tipo = document.getElementById("tipo-subcategoria").value;
      const cat = document.getElementById("categoria-subcategoria").value;
      const nome = document.getElementById("nome-subcategoria").value.trim();
      if (cat && nome && categorias[tipo][cat] && !categorias[tipo][cat].includes(nome)) {
        categorias[tipo][cat].push(nome);
        salvarCategorias();
        renderizarListaCategorias();
        atualizarCategorias();
        document.getElementById("nome-subcategoria").value = "";
      }
    });
    document.getElementById("tipo-subcategoria").addEventListener("change", atualizarCategoriaSubcategoriaForm);
    document.getElementById("categoria-subcategoria").addEventListener("change", atualizarCategoriaSubcategoriaForm);
  }

  renderizarListaCategorias();
  atualizarCategoriaSubcategoriaForm();
  // Ativa apenas a aba dashboard ao iniciar
  document.querySelectorAll('.tab-section').forEach(tab => tab.classList.remove('active'));
  document.getElementById('dashboard').classList.add('active');

  renderizarProdutos();

  renderizarLancamentos();

  atualizarSelectSaida();

  renderizarDashboardResumo();

  const form = document.getElementById("estoque-form");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const nomeInput = document.getElementById("produto");
    const qtdInput = document.getElementById("quantidade");
    const nome = nomeInput.value.trim();
    const quantidade = parseInt(qtdInput.value);

    if (nome && quantidade > 0) {
      // Verifica se já existe o produto
      const idx = produtos.findIndex(p => p.nome.toLowerCase() === nome.toLowerCase());
      if (idx >= 0) {
        // Se existe, adiciona a quantidade
        produtos[idx].quantidade += quantidade;
      } else {
        // Se não existe, cadastra novo
        produtos.push({ nome, quantidade });
      }
      salvarProdutos();
      renderizarProdutos();
      nomeInput.value = "";
      qtdInput.value = "";
      renderizarDashboardResumo();
    }
  });

  // Modal saída de produto
  const saidaModal = document.getElementById("saida-modal");
  const saidaModalForm = document.getElementById("saida-modal-form");
  const saidaModalCancel = saidaModal.querySelector(".modal-cancel");
  saidaModalForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const idx = parseInt(saidaModal.dataset.produtoIndex);
    const qtdInput = document.getElementById("saida-modal-quantidade");
    const valorInput = document.getElementById("saida-modal-valor");
    const qtd = parseInt(qtdInput.value);
    const valor = parseFloat(valorInput.value);
    if (!isNaN(idx) && !isNaN(qtd) && qtd > 0 && produtos[idx].quantidade >= qtd && !isNaN(valor) && valor >= 0) {
      produtos[idx].quantidade -= qtd;
      salvarProdutos();
      renderizarProdutos();
      renderizarDashboardResumo();
      // Registrar saída como lançamento financeiro
      const novoLancamento = {
        id: gerarIdentificadorUnico(),
        tipo: "receita",
        categoria: "Vendas",
        subcategoria: "Produtos",
        descricao: produtos[idx].nome,
        quantidade: qtd,
        valor: valor,
        data: new Date().toLocaleDateString('pt-BR')
      };
      
      lancamentos.push(novoLancamento);
      salvarLancamentos();
      renderizarLancamentos();
      
      // Adicionar automaticamente ao Google Sheets
      if (typeof adicionarLancamentoSheets === 'function') {
        adicionarLancamentoSheets(novoLancamento).then(sucesso => {
          if (sucesso && typeof updateSyncIndicator === 'function') {
            updateSyncIndicator('success');
          }
        });
      }
      saidaModal.classList.add('modal-hidden');
    } else {
      alert("Preencha quantidade e valor válidos, e verifique o estoque!");
    }
  });
  saidaModalCancel.addEventListener("click", function () {
    saidaModal.classList.add('modal-hidden');
  });

  // Formulário de receitas/despesas
  const financeiroForm = document.getElementById("financeiro-form");
  if (financeiroForm) {
    financeiroForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const tipoInput = document.getElementById("tipo-lancamento");
      const categoriaInput = document.getElementById("categoria-lancamento");
      const subcategoriaInput = document.getElementById("subcategoria-lancamento");
      const descInput = document.getElementById("descricao-lancamento");
      const quantidadeInput = document.getElementById("quantidade-lancamento");
      const valorInput = document.getElementById("valor-lancamento");
      const dataInput = document.getElementById("data-lancamento");
      const tipo = tipoInput.value;
      const categoria = categoriaInput.value;
      const subcategoria = subcategoriaInput.value;
      const descricao = descInput.value.trim();
      const quantidade = parseInt(quantidadeInput.value) || 1;
      const valor = parseFloat(valorInput.value);
      const data = dataInput.value;
      if ((tipo === "receita" || tipo === "despesa") && categoria && subcategoria && descricao && valor > 0 && data) {
        // Converter data de AAAA-MM-DD para DD/MM/AAAA
        const [ano, mes, dia] = data.split('-');
        const dataFormatada = `${dia}/${mes}/${ano}`;
        
        const novoLancamento = { 
          id: gerarIdentificadorUnico(),
          tipo, 
          categoria, 
          subcategoria, 
          descricao, 
          quantidade, 
          valor, 
          data: dataFormatada 
        };
        
        lancamentos.push(novoLancamento);
        salvarLancamentos();
        renderizarLancamentos();
        
        // Adicionar automaticamente ao Google Sheets
        if (typeof adicionarLancamentoSheets === 'function') {
          const sucesso = await adicionarLancamentoSheets(novoLancamento);
          if (sucesso && typeof updateSyncIndicator === 'function') {
            updateSyncIndicator('success');
          }
        }
        
        tipoInput.value = "receita";
        categoriaInput.value = "";
        subcategoriaInput.value = "";
        descInput.value = "";
        quantidadeInput.value = "1";
        valorInput.value = "";
        dataInput.value = "";
        renderizarDashboardResumo();
        atualizarFiltroMesAno();
      }
    });
  }
  // Categorias e subcategorias
  function atualizarCategorias() {
    const tipoInput = document.getElementById("tipo-lancamento");
    const categoriaInput = document.getElementById("categoria-lancamento");
    const subcategoriaInput = document.getElementById("subcategoria-lancamento");
    if (!tipoInput || !categoriaInput || !subcategoriaInput) return;
    categoriaInput.innerHTML = "";
    subcategoriaInput.innerHTML = "";
    const tipo = tipoInput.value;
    const cats = categorias[tipo] || {};
    Object.keys(cats).forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categoriaInput.appendChild(opt);
    });
    atualizarSubcategorias();
  }

  function atualizarSubcategorias() {
    const tipoInput = document.getElementById("tipo-lancamento");
    const categoriaInput = document.getElementById("categoria-lancamento");
    const subcategoriaInput = document.getElementById("subcategoria-lancamento");
    if (!tipoInput || !categoriaInput || !subcategoriaInput) return;
    subcategoriaInput.innerHTML = "";
    const tipo = tipoInput.value;
    const cat = categoriaInput.value;
    const subs = (categorias[tipo] && categorias[tipo][cat]) ? categorias[tipo][cat] : [];
    subs.forEach(sub => {
      const opt = document.createElement("option");
      opt.value = sub;
      opt.textContent = sub;
      subcategoriaInput.appendChild(opt);
    });
  }

  document.getElementById("tipo-lancamento").addEventListener("change", function () {
    atualizarCategorias();
  });
  document.getElementById("categoria-lancamento").addEventListener("change", function () {
    atualizarSubcategorias();
  });
  atualizarCategorias();
  // Filtro mês/ano persistente e funcional
  function atualizarFiltroMesAno() {
    const meses = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    const filtroMes = document.getElementById("filtro-mes");
    const filtroAno = document.getElementById("filtro-ano");
    if (!filtroMes || !filtroAno) return;
    filtroMes.innerHTML = "";
    filtroAno.innerHTML = "";
    // Descobre anos dos lançamentos
    const anos = Array.from(new Set(lancamentos.map(l => {
      if (!l.data) return "";
      if (typeof l.data === 'string' && l.data.includes('/')) {
        return l.data.split('/')[2]; // Pega o ano da data DD/MM/AAAA
      } else {
        return l.data.slice(0, 4); // Formato ISO
      }
    }).filter(a => a)));
    const anoAtual = new Date().getFullYear();
    if (anos.length === 0) anos.push(anoAtual.toString());
    anos.sort();
    meses.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      filtroMes.appendChild(opt);
    });
    anos.forEach(a => {
      const opt = document.createElement("option");
      opt.value = a;
      opt.textContent = a;
      filtroAno.appendChild(opt);
    });
    // Seleciona último mês/ano salvos
    const mesSalvo = localStorage.getItem("filtroMes") || meses[new Date().getMonth()];
    const anoSalvo = localStorage.getItem("filtroAno") || anoAtual.toString();
    filtroMes.value = mesSalvo;
    filtroAno.value = anoSalvo;
    window.filtroMes = mesSalvo;
    window.filtroAno = anoSalvo;
  }

  atualizarFiltroMesAno();

  // Aplica filtro ao selecionar mês/ano
  document.getElementById("filtro-mes").addEventListener("change", function () {
    const mes = this.value;
    const ano = document.getElementById("filtro-ano").value;
    localStorage.setItem("filtroMes", mes);
    localStorage.setItem("filtroAno", ano);
    window.filtroMes = mes;
    window.filtroAno = ano;
    renderizarLancamentos();
    renderizarDashboardResumo();
  });
  document.getElementById("filtro-ano").addEventListener("change", function () {
    const ano = this.value;
    const mes = document.getElementById("filtro-mes").value;
    localStorage.setItem("filtroMes", mes);
    localStorage.setItem("filtroAno", ano);
    window.filtroMes = mes;
    window.filtroAno = ano;
    renderizarLancamentos();
    renderizarDashboardResumo();
  });

  // Botão filtrar elimina filtro
  document.getElementById("btn-filtrar").addEventListener("click", function () {
    localStorage.removeItem("filtroMes");
    localStorage.removeItem("filtroAno");
    window.filtroMes = null;
    window.filtroAno = null;
    document.getElementById("filtro-mes").value = "";
    document.getElementById("filtro-ano").value = "";
    renderizarLancamentos();
    renderizarDashboardResumo();
  });
  function renderizarDashboardResumo() {
    const div = document.getElementById("dashboard-resumo");
    if (!div) return;
    const totalProdutos = produtos.length;
    const totalItensEstoque = produtos.reduce((acc, p) => acc + p.quantidade, 0);
    const totalReceitas = lancamentos.filter(l => l.tipo === "receita").reduce((acc, l) => acc + l.valor, 0);
    const totalDespesas = lancamentos.filter(l => l.tipo === "despesa").reduce((acc, l) => acc + l.valor, 0);
    const saldo = totalReceitas - totalDespesas;
    let vendasMes = 0;
    if (window.filtroMes && window.filtroAno) {
      vendasMes = lancamentos.filter(l => {
        if (l.tipo === "receita" && l.categoria === "Vendas" && l.data) {
          let d;
          if (typeof l.data === 'string' && l.data.includes('/')) {
            const [dia, mes, ano] = l.data.split('/');
            d = new Date(ano, mes - 1, dia);
          } else {
            d = new Date(l.data);
          }
          if (!isNaN(d.getTime())) {
            return d.getMonth() + 1 === Number(window.filtroMes) && d.getFullYear() === Number(window.filtroAno);
          }
        }
        return false;
      }).reduce((acc, l) => acc + l.valor, 0);
    }
    div.innerHTML = `
    <div class="dashboard-container">
      <div class="dashboard-card dashboard-card-produtos">
        <span class="dashboard-icon">📦</span>
        <span class="dashboard-label dashboard-label-produtos">Produtos</span>
        <span class="dashboard-value dashboard-value-produtos">${totalProdutos}</span>
      </div>
      <div class="dashboard-card dashboard-card-estoque">
        <span class="dashboard-icon">🗃️</span>
        <span class="dashboard-label dashboard-label-estoque">Itens em Estoque</span>
        <span class="dashboard-value dashboard-value-estoque">${totalItensEstoque}</span>
      </div>
      <div class="dashboard-card dashboard-card-vendas">
        <span class="dashboard-icon">🛒</span>
        <span class="dashboard-label dashboard-label-vendas">Vendas no mês</span>
        <span class="dashboard-value dashboard-value-vendas">R$ ${vendasMes.toFixed(2)}</span>
        <span class="dashboard-periodo">${filtroMes && filtroAno ? `Referente a ${filtroMes.toString().padStart(2, '0')}/${filtroAno}` : 'Escolha o mês'}</span>
      </div>
      <div class="dashboard-card dashboard-card-receitas">
        <span class="dashboard-icon">💰</span>
        <span class="dashboard-label dashboard-label-receitas">Receitas</span>
        <span class="dashboard-value dashboard-value-receitas">R$ ${totalReceitas.toFixed(2)}</span>
      </div>
      <div class="dashboard-card dashboard-card-despesas">
        <span class="dashboard-icon">💸</span>
        <span class="dashboard-label dashboard-label-despesas">Despesas</span>
        <span class="dashboard-value dashboard-value-despesas">R$ ${totalDespesas.toFixed(2)}</span>
      </div>
      <div class="dashboard-card dashboard-card-saldo ${saldo >= 0 ? 'dashboard-card-saldo-positivo' : 'dashboard-card-saldo-negativo'}">
        <span class="dashboard-icon">🧮</span>
        <span class="dashboard-label dashboard-label-saldo">Saldo</span>
        <span class="dashboard-value dashboard-value-saldo">R$ ${saldo.toFixed(2)}</span>
      </div>
    </div>
  `;
  }

  const ctx = document.getElementById("fluxoCaixaChart");
  if (ctx) {
    new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Semana 1", "Semana 2", "Semana 3", "Semana 4"],
        datasets: [{
          label: "Fluxo de Caixa",
          data: [500, 900, 400, 800],
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(118, 28, 28, 0.39)",
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: "black" } }
        },
        scales: {
          x: { ticks: { color: "black" } },
          y: { ticks: { color: "black" } }
        }
      }
    });
  }

  // Exemplo de JS para trocar o conteúdo da análise
  document.getElementById('tipo-analise').addEventListener('change', function () {
    const tipo = this.value;
    const conteudo = document.getElementById('analise-conteudo');
    if (tipo === 'vendas') {
      conteudo.innerHTML = '<p>Gráfico de vendas no período aqui.</p>';
      // Aqui você pode chamar a função que renderiza o gráfico de vendas
    } else if (tipo === 'fluxo') {
      conteudo.innerHTML = '<p>Fluxo de caixa aqui.</p>';
      // Aqui você pode chamar a função que renderiza o fluxo de caixa
    }
  });

  const btnImportar = document.getElementById('btn-importar-dados');
  const btnExportarTodos = document.getElementById('btn-exportar-todos');
  // Novo: Botão para apagar todos os dados
  let btnApagarTodos = document.getElementById('btn-apagar-todos');
  if (!btnApagarTodos) {
    const div = document.querySelector('#configuracoes .tab-section, #configuracoes > div, #configuracoes');
    if (div) {
      btnApagarTodos = document.createElement('button');
      btnApagarTodos.id = 'btn-apagar-todos';
      btnApagarTodos.className = 'config-btn';
      btnApagarTodos.style.background = '#e53e3e';
      btnApagarTodos.style.marginTop = '16px';
      btnApagarTodos.textContent = 'Apagar TODOS os dados';
      div.appendChild(btnApagarTodos);
    }
  }

  if (btnImportar) btnImportar.onclick = function () {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = function (e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (evt) {
        try {
          const dados = JSON.parse(evt.target.result);
          if (confirm('Tem certeza que deseja importar e substituir TODOS os dados atuais?')) {
            if (dados.produtos) localStorage.setItem('produtos', JSON.stringify(dados.produtos));
            if (dados.lancamentos) localStorage.setItem('lancamentos', JSON.stringify(dados.lancamentos));
            if (dados.categorias) localStorage.setItem('categorias', JSON.stringify(dados.categorias));
            alert('Dados importados com sucesso! A página será recarregada.');
            location.reload();
          }
        } catch (err) {
          alert('Arquivo inválido!');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };



  if (btnExportarTodos) btnExportarTodos.onclick = function () {
    const dados = {
      produtos: JSON.parse(localStorage.getItem('produtos') || '[]'),
      lancamentos: JSON.parse(localStorage.getItem('lancamentos') || '[]'),
      categorias: JSON.parse(localStorage.getItem('categorias') || '{}')
    };
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dados-todos-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (btnApagarTodos) btnApagarTodos.onclick = function () {
    Swal.fire({
      title: 'Apagar TODOS os dados?',
      text: 'Esta ação é IRREVERSÍVEL!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e53e3e',
      cancelButtonColor: '#4a5568',
      confirmButtonText: 'Sim, apagar tudo!',
      cancelButtonText: 'Cancelar',
      background: '#1a202c',
      color: '#e2e8f0'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Confirmação final',
          text: 'Deseja realmente apagar TODOS os dados? Esta ação não pode ser desfeita.',
          icon: 'error',
          showCancelButton: true,
          confirmButtonColor: '#e53e3e',
          cancelButtonColor: '#4a5568',
          confirmButtonText: 'APAGAR TUDO',
          cancelButtonText: 'Cancelar',
          background: '#1a202c',
          color: '#e2e8f0'
        }).then((finalResult) => {
          if (finalResult.isConfirmed) {
            localStorage.removeItem('produtos');
            localStorage.removeItem('lancamentos');
            localStorage.removeItem('categorias');
            Swal.fire({
              title: 'Dados apagados!',
              text: 'Todos os dados foram removidos. A página será recarregada.',
              icon: 'success',
              confirmButtonColor: '#38a169',
              background: '#1a202c',
              color: '#e2e8f0'
            }).then(() => {
              location.reload();
            });
          }
        });
      }
    });
  };

  let chartInstance = null;

  function renderizarGrafico(tipo) {
    const ctx = document.getElementById("graficoDinamico").getContext("2d");
    if (chartInstance) {
      chartInstance.destroy();
    }

    let data = [], labels = [], label = '', chartType = "line", backgroundColors = [];

    if (tipo === "vendas") {
      const vendasPorDia = {};
      lancamentos.forEach(l => {
        if (l.tipo === "receita" && l.categoria === "Vendas" && l.data) {
          let d, dia, mes;
          if (typeof l.data === 'string' && l.data.includes('/')) {
            const [d1, m1, a1] = l.data.split('/');
            d = new Date(a1, m1 - 1, d1);
            dia = d1;
            mes = m1;
          } else {
            d = new Date(l.data);
            const [ano, m2, d2] = l.data.split("-");
            dia = d2;
            mes = m2;
          }
          
          // Filtra pelo mês/ano selecionado
          if (window.filtroMes && window.filtroAno) {
            if (d.getMonth() + 1 !== Number(window.filtroMes) || d.getFullYear() !== Number(window.filtroAno)) {
              return;
            }
          }
          const chave = `${dia}/${mes}`;
          vendasPorDia[chave] = (vendasPorDia[chave] || 0) + l.valor;
        }
      });
      Object.keys(vendasPorDia).sort().forEach(k => {
        labels.push(k);
        data.push(vendasPorDia[k]);
      });
      label = "Vendas no período";
    } else if (tipo === "ticket") {
      const ticketPorMes = {}, qtdPorMes = {};
      lancamentos.forEach(l => {
        if (l.tipo === "receita" && l.categoria === "Vendas" && l.data) {
          let mes, ano;
          if (typeof l.data === 'string' && l.data.includes('/')) {
            const [dia, m, a] = l.data.split('/');
            mes = m;
            ano = a;
          } else {
            const [a, m] = l.data.split("-");
            mes = m;
            ano = a;
          }
          const chave = `${mes}/${ano}`;
          ticketPorMes[chave] = (ticketPorMes[chave] || 0) + l.valor;

          // Extrai quantidade da descrição
          const match = l.descricao.match(/(\d+)\s*unidade/i);
          const quantidade = match ? parseInt(match[1]) : 1;
          qtdPorMes[chave] = (qtdPorMes[chave] || 0) + quantidade;
        }
      });
      Object.keys(ticketPorMes).sort().forEach(k => {
        labels.push(k);
        data.push(ticketPorMes[k] / qtdPorMes[k]);
      });
      label = "Ticket médio";
    } else if (tipo === "patrimonio") {
      let saldo = 0;
      const porData = {};
      lancamentos
        .filter(l => l.data)
        .sort((a, b) => {
          let dataA, dataB;
          if (typeof a.data === 'string' && a.data.includes('/')) {
            const [dia, mes, ano] = a.data.split('/');
            dataA = new Date(ano, mes - 1, dia);
          } else {
            dataA = new Date(a.data);
          }
          if (typeof b.data === 'string' && b.data.includes('/')) {
            const [dia, mes, ano] = b.data.split('/');
            dataB = new Date(ano, mes - 1, dia);
          } else {
            dataB = new Date(b.data);
          }
          return dataA - dataB;
        })
        .forEach(l => {
          saldo += l.tipo === "receita" ? l.valor : -l.valor;
          const dataFormatada = typeof l.data === 'string' && l.data.includes('/') ? l.data : new Date(l.data).toLocaleDateString('pt-BR');
          porData[dataFormatada] = saldo;
        });
      Object.keys(porData).forEach(k => {
        labels.push(k);
        data.push(porData[k]);
      });
      label = "Evolução do patrimônio";
    } else if (tipo === "fluxo") {
      const fluxoPorMes = {};
      lancamentos.forEach(l => {
        if (l.data) {
          let mes, ano;
          if (typeof l.data === 'string' && l.data.includes('/')) {
            const [dia, m, a] = l.data.split('/');
            mes = m;
            ano = a;
          } else {
            const [a, m] = l.data.split("-");
            mes = m;
            ano = a;
          }
          const chave = `${mes}/${ano}`;
          fluxoPorMes[chave] = (fluxoPorMes[chave] || 0) + (l.tipo === "receita" ? l.valor : -l.valor);
        }
      });
      Object.keys(fluxoPorMes).sort().forEach(k => {
        labels.push(k);
        data.push(fluxoPorMes[k]);
      });
      label = "Fluxo de caixa";
    } else if (tipo === "pizza-despesas") {
      chartType = "pie";
      const despesasPorCategoria = {};
      lancamentos.forEach(l => {
        if (l.tipo === "despesa" && l.categoria) {
          despesasPorCategoria[l.categoria] = (despesasPorCategoria[l.categoria] || 0) + l.valor;
        }
      });
      Object.keys(despesasPorCategoria).forEach((cat, i) => {
        labels.push(cat);
        data.push(despesasPorCategoria[cat]);
        backgroundColors.push(["#e53e3e", "#3182ce", "#38a169", "#ecc94b", "#805ad5", "#ed8936", "#319795", "#d53f8c"][i % 8]);
      });
      label = "Despesas por categoria";
    } else if (tipo === "pizza-receitas") {
      chartType = "pie";
      const receitasPorCategoria = {};
      lancamentos.forEach(l => {
        if (l.tipo === "receita" && l.categoria) {
          receitasPorCategoria[l.categoria] = (receitasPorCategoria[l.categoria] || 0) + l.valor;
        }
      });
      Object.keys(receitasPorCategoria).forEach((cat, i) => {
        labels.push(cat);
        data.push(receitasPorCategoria[cat]);
        backgroundColors.push(["#38a169", "#3182ce", "#e53e3e", "#ecc94b", "#805ad5", "#ed8936", "#319795", "#d53f8c"][i % 8]);
      });
      label = "Receitas por categoria";
    } else if (tipo === "pizza-despesas-sub") {
      chartType = "pie";
      const despesasPorSubcategoria = {};
      lancamentos.forEach(l => {
        if (l.tipo === "despesa" && l.subcategoria) {
          const chave = `${l.categoria} - ${l.subcategoria}`;
          despesasPorSubcategoria[chave] = (despesasPorSubcategoria[chave] || 0) + l.valor;
        }
      });
      Object.keys(despesasPorSubcategoria).forEach((sub, i) => {
        labels.push(sub);
        data.push(despesasPorSubcategoria[sub]);
        backgroundColors.push(["#e53e3e", "#3182ce", "#38a169", "#ecc94b", "#805ad5", "#ed8936", "#319795", "#d53f8c"][i % 8]);
      });
      label = "Despesas por subcategoria";
    } else if (tipo === "pizza-receitas-sub") {
      chartType = "pie";
      const receitasPorSubcategoria = {};
      lancamentos.forEach(l => {
        if (l.tipo === "receita" && l.subcategoria) {
          const chave = `${l.categoria} - ${l.subcategoria}`;
          receitasPorSubcategoria[chave] = (receitasPorSubcategoria[chave] || 0) + l.valor;
        }
      });
      Object.keys(receitasPorSubcategoria).forEach((sub, i) => {
        labels.push(sub);
        data.push(receitasPorSubcategoria[sub]);
        backgroundColors.push(["#38a169", "#3182ce", "#e53e3e", "#ecc94b", "#805ad5", "#ed8936", "#319795", "#d53f8c"][i % 8]);
      });
      label = "Receitas por subcategoria";
    } else if (tipo === "dre") {
      // DRE - Demonstrativo do Resultado do Exercício
      const canvas = document.getElementById("graficoDinamico");
      canvas.style.display = 'none';
      
      // Criar container para DRE
      let dreContainer = document.getElementById('dre-container');
      if (!dreContainer) {
        dreContainer = document.createElement('div');
        dreContainer.id = 'dre-container';
        canvas.parentNode.appendChild(dreContainer);
      }
      
      // Calcular dados do DRE
      let filtrados = lancamentos;
      if (window.filtroMes && window.filtroAno) {
        filtrados = lancamentos.filter(l => {
          if (!l.data) return false;
          let d;
          if (typeof l.data === 'string' && l.data.includes('/')) {
            const [dia, mes, ano] = l.data.split('/');
            d = new Date(ano, mes - 1, dia);
          } else {
            d = new Date(l.data);
          }
          return d.getMonth() + 1 === Number(window.filtroMes) && d.getFullYear() === Number(window.filtroAno);
        });
      }
      
      const receitas = filtrados.filter(l => l.tipo === 'receita');
      const despesas = filtrados.filter(l => l.tipo === 'despesa');
      
      const receitaBruta = receitas.reduce((acc, l) => acc + l.valor, 0);
      const totalDespesas = despesas.reduce((acc, l) => acc + l.valor, 0);
      const lucroLiquido = receitaBruta - totalDespesas;
      
      // Agrupar receitas por categoria
      const receitasPorCategoria = {};
      receitas.forEach(l => {
        if (!receitasPorCategoria[l.categoria]) receitasPorCategoria[l.categoria] = 0;
        receitasPorCategoria[l.categoria] += l.valor;
      });
      
      // Agrupar despesas por categoria
      const despesasPorCategoria = {};
      despesas.forEach(l => {
        if (!despesasPorCategoria[l.categoria]) despesasPorCategoria[l.categoria] = 0;
        despesasPorCategoria[l.categoria] += l.valor;
      });
      
      const periodo = window.filtroMes && window.filtroAno ? 
        `${String(window.filtroMes).padStart(2, '0')}/${window.filtroAno}` : 'Todos os períodos';
      
      dreContainer.style.display = 'block';
      dreContainer.innerHTML = `
        <div class="dre-report">
          <h3 class="dre-title">DRE - Demonstrativo do Resultado do Exercício</h3>
          <p class="dre-period">Período: ${periodo}</p>
          
          <div class="dre-section">
            <h4 class="dre-section-title">RECEITAS</h4>
            ${Object.entries(receitasPorCategoria).map(([cat, valor]) => 
              `<div class="dre-line"><span>${cat}</span><span>R$ ${valor.toFixed(2)}</span></div>`
            ).join('')}
            <div class="dre-line dre-total"><span>RECEITA BRUTA</span><span>R$ ${receitaBruta.toFixed(2)}</span></div>
          </div>
          
          <div class="dre-section">
            <h4 class="dre-section-title">DESPESAS</h4>
            ${Object.entries(despesasPorCategoria).map(([cat, valor]) => 
              `<div class="dre-line"><span>${cat}</span><span>(R$ ${valor.toFixed(2)})</span></div>`
            ).join('')}
            <div class="dre-line dre-total"><span>TOTAL DESPESAS</span><span>(R$ ${totalDespesas.toFixed(2)})</span></div>
          </div>
          
          <div class="dre-section">
            <div class="dre-line dre-result ${lucroLiquido >= 0 ? 'positive' : 'negative'}">
              <span>RESULTADO LÍQUIDO</span>
              <span>R$ ${lucroLiquido.toFixed(2)}</span>
            </div>
          </div>
        </div>
      `;
      
      return; // Não criar gráfico para DRE
    } else if (tipo === "dre-detalhado") {
      const canvas = document.getElementById("graficoDinamico");
      canvas.style.display = 'none';
      
      let dreContainer = document.getElementById('dre-container');
      if (!dreContainer) {
        dreContainer = document.createElement('div');
        dreContainer.id = 'dre-container';
        canvas.parentNode.appendChild(dreContainer);
      }
      
      const ano = window.filtroAno || new Date().getFullYear();
      const meses = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
      const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      
      // Usar categorias existentes do sistema
      const categoriasExistentes = JSON.parse(localStorage.getItem('categorias')) || {
        receita: { "Vendas": [], "Investimentos": [], "Outros": [] },
        despesa: { "Operacional": [], "Pessoal": [], "Compras": [], "Outros": [] }
      };
      
      // Inicializar dados
      const dadosPorCategoria = { receita: {}, despesa: {} };
      
      // Inicializar todas as categorias existentes
      Object.keys(categoriasExistentes.receita).forEach(cat => {
        dadosPorCategoria.receita[cat] = {};
        meses.forEach(m => dadosPorCategoria.receita[cat][m] = 0);
      });
      
      Object.keys(categoriasExistentes.despesa).forEach(cat => {
        dadosPorCategoria.despesa[cat] = {};
        meses.forEach(m => dadosPorCategoria.despesa[cat][m] = 0);
      });
      
      // Processar lançamentos
      lancamentos.forEach(l => {
        if (!l.data) return;
        let d;
        if (typeof l.data === 'string' && l.data.includes('/')) {
          const [dia, m, a] = l.data.split('/');
          d = new Date(a, m - 1, dia);
        } else {
          d = new Date(l.data);
        }
        
        if (d.getFullYear() !== Number(ano)) return;
        
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const categoria = l.categoria || 'Outros';
        
        if (l.tipo === 'receita' && dadosPorCategoria.receita[categoria]) {
          dadosPorCategoria.receita[categoria][mes] += l.valor;
        } else if (l.tipo === 'despesa' && dadosPorCategoria.despesa[categoria]) {
          dadosPorCategoria.despesa[categoria][mes] += l.valor;
        }
      });
      
      // Gerar HTML
      let html = `
        <div class="dre-detalhado">
          <h3 class="dre-title">DRE Detalhado - Ano ${ano}</h3>
          <div class="dre-table-container">
            <table class="dre-table">
              <thead>
                <tr class="dre-header">
                  <th class="dre-cell"></th>
                  ${nomesMeses.map(m => `<th class="dre-cell">${m}</th>`).join('')}
                  <th class="dre-cell">Total</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      // Receitas
      html += '<tr class="dre-section-header receitas"><td colspan="14">RECEITAS</td></tr>';
      let totalReceitasPorMes = meses.map(() => 0);
      
      Object.keys(categoriasExistentes.receita).forEach(cat => {
        html += `<tr class="dre-row"><td class="dre-cell dre-categoria">${cat}</td>`;
        let totalCategoria = 0;
        
        meses.forEach((mes, i) => {
          const valor = dadosPorCategoria.receita[cat] ? dadosPorCategoria.receita[cat][mes] : 0;
          totalReceitasPorMes[i] += valor;
          totalCategoria += valor;
          html += `<td class="dre-cell dre-receita">R$ ${valor.toFixed(2)}</td>`;
        });
        
        html += `<td class="dre-cell dre-receita dre-total">R$ ${totalCategoria.toFixed(2)}</td></tr>`;
      });
      
      html += '<tr class="dre-subtotal"><td class="dre-cell">Total de Receitas</td>';
      const totalReceitas = totalReceitasPorMes.reduce((a, b) => a + b, 0);
      totalReceitasPorMes.forEach(total => {
        html += `<td class="dre-cell dre-receita">R$ ${total.toFixed(2)}</td>`;
      });
      html += `<td class="dre-cell dre-receita dre-total">R$ ${totalReceitas.toFixed(2)}</td></tr>`;
      
      // Despesas
      html += '<tr class="dre-section-header despesas"><td colspan="14">DESPESAS</td></tr>';
      let totalDespesasPorMes = meses.map(() => 0);
      
      Object.keys(categoriasExistentes.despesa).forEach(cat => {
        html += `<tr class="dre-row"><td class="dre-cell dre-categoria">${cat}</td>`;
        let totalCategoria = 0;
        
        meses.forEach((mes, i) => {
          const valor = dadosPorCategoria.despesa[cat] ? dadosPorCategoria.despesa[cat][mes] : 0;
          totalDespesasPorMes[i] += valor;
          totalCategoria += valor;
          html += `<td class="dre-cell dre-despesa">R$ ${valor.toFixed(2)}</td>`;
        });
        
        html += `<td class="dre-cell dre-despesa dre-total">R$ ${totalCategoria.toFixed(2)}</td></tr>`;
      });
      
      html += '<tr class="dre-subtotal"><td class="dre-cell">Total de Despesas</td>';
      const totalDespesas = totalDespesasPorMes.reduce((a, b) => a + b, 0);
      totalDespesasPorMes.forEach(total => {
        html += `<td class="dre-cell dre-despesa">R$ ${total.toFixed(2)}</td>`;
      });
      html += `<td class="dre-cell dre-despesa dre-total">R$ ${totalDespesas.toFixed(2)}</td></tr>`;
      
      // Saldo
      html += '<tr class="dre-result-row"><td class="dre-cell">Saldo</td>';
      const saldoTotal = totalReceitas - totalDespesas;
      
      meses.forEach((mes, i) => {
        const saldoMes = totalReceitasPorMes[i] - totalDespesasPorMes[i];
        html += `<td class="dre-cell dre-resultado ${saldoMes >= 0 ? 'positive' : 'negative'}">R$ ${saldoMes.toFixed(2)}</td>`;
      });
      
      html += `<td class="dre-cell dre-resultado dre-total ${saldoTotal >= 0 ? 'positive' : 'negative'}">R$ ${saldoTotal.toFixed(2)}</td></tr>`;
      
      html += '</tbody></table></div></div>';
      dreContainer.style.display = 'block';
      dreContainer.innerHTML = html;
      
      return;
    } else if (tipo === "dre-detalhado-subcategorias") {
      const canvas = document.getElementById("graficoDinamico");
      canvas.style.display = 'none';
      
      let dreContainer = document.getElementById('dre-container');
      if (!dreContainer) {
        dreContainer = document.createElement('div');
        dreContainer.id = 'dre-container';
        canvas.parentNode.appendChild(dreContainer);
      }
      
      const ano = window.filtroAno || new Date().getFullYear();
      const meses = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
      const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      
      const categoriasExistentes = JSON.parse(localStorage.getItem('categorias')) || {
        receita: { "Vendas": [], "Investimentos": [], "Outros": [] },
        despesa: { "Operacional": [], "Pessoal": [], "Compras": [], "Outros": [] }
      };
      
      // Organizar dados por categoria e subcategoria
      const dadosOrganizados = { receita: {}, despesa: {} };
      
      // Processar lançamentos
      lancamentos.forEach(l => {
        if (!l.data || !l.categoria || !l.subcategoria) return;
        let d;
        if (typeof l.data === 'string' && l.data.includes('/')) {
          const [dia, m, a] = l.data.split('/');
          d = new Date(a, m - 1, dia);
        } else {
          d = new Date(l.data);
        }
        
        if (d.getFullYear() !== Number(ano)) return;
        
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        
        if (!dadosOrganizados[l.tipo][l.categoria]) {
          dadosOrganizados[l.tipo][l.categoria] = {};
        }
        if (!dadosOrganizados[l.tipo][l.categoria][l.subcategoria]) {
          dadosOrganizados[l.tipo][l.categoria][l.subcategoria] = {};
          meses.forEach(m => dadosOrganizados[l.tipo][l.categoria][l.subcategoria][m] = 0);
        }
        
        dadosOrganizados[l.tipo][l.categoria][l.subcategoria][mes] += l.valor;
      });
      
      // Gerar HTML
      let html = `
        <div class="dre-detalhado">
          <h3 class="dre-title">DRE Detalhado por Subcategorias - Ano ${ano}</h3>
          <div class="dre-table-container">
            <table class="dre-table">
              <thead>
                <tr class="dre-header">
                  <th class="dre-cell"></th>
                  ${nomesMeses.map(m => `<th class="dre-cell">${m}</th>`).join('')}
                  <th class="dre-cell">Total</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      // Receitas por categoria e subcategoria
      html += '<tr class="dre-section-header receitas"><td colspan="14">RECEITAS</td></tr>';
      let totalReceitasPorMes = meses.map(() => 0);
      
      Object.keys(dadosOrganizados.receita).sort().forEach(categoria => {
        html += `<tr class="dre-categoria-header"><td class="dre-cell dre-categoria-nome" colspan="14">${categoria}</td></tr>`;
        
        Object.keys(dadosOrganizados.receita[categoria]).sort().forEach(subcategoria => {
          html += `<tr class="dre-row"><td class="dre-cell dre-subcategoria">${subcategoria}</td>`;
          let totalSubcategoria = 0;
          
          meses.forEach((mes, i) => {
            const valor = dadosOrganizados.receita[categoria][subcategoria][mes];
            totalReceitasPorMes[i] += valor;
            totalSubcategoria += valor;
            html += `<td class="dre-cell dre-receita">R$ ${valor.toFixed(2)}</td>`;
          });
          
          html += `<td class="dre-cell dre-receita dre-total">R$ ${totalSubcategoria.toFixed(2)}</td></tr>`;
        });
      });
      
      html += '<tr class="dre-subtotal"><td class="dre-cell">Total de Receitas</td>';
      const totalReceitas = totalReceitasPorMes.reduce((a, b) => a + b, 0);
      totalReceitasPorMes.forEach(total => {
        html += `<td class="dre-cell dre-receita">R$ ${total.toFixed(2)}</td>`;
      });
      html += `<td class="dre-cell dre-receita dre-total">R$ ${totalReceitas.toFixed(2)}</td></tr>`;
      
      // Despesas por categoria e subcategoria
      html += '<tr class="dre-section-header despesas"><td colspan="14">DESPESAS</td></tr>';
      let totalDespesasPorMes = meses.map(() => 0);
      
      Object.keys(dadosOrganizados.despesa).sort().forEach(categoria => {
        html += `<tr class="dre-categoria-header"><td class="dre-cell dre-categoria-nome" colspan="14">${categoria}</td></tr>`;
        
        Object.keys(dadosOrganizados.despesa[categoria]).sort().forEach(subcategoria => {
          html += `<tr class="dre-row"><td class="dre-cell dre-subcategoria">${subcategoria}</td>`;
          let totalSubcategoria = 0;
          
          meses.forEach((mes, i) => {
            const valor = dadosOrganizados.despesa[categoria][subcategoria][mes];
            totalDespesasPorMes[i] += valor;
            totalSubcategoria += valor;
            html += `<td class="dre-cell dre-despesa">R$ ${valor.toFixed(2)}</td>`;
          });
          
          html += `<td class="dre-cell dre-despesa dre-total">R$ ${totalSubcategoria.toFixed(2)}</td></tr>`;
        });
      });
      
      html += '<tr class="dre-subtotal"><td class="dre-cell">Total de Despesas</td>';
      const totalDespesas = totalDespesasPorMes.reduce((a, b) => a + b, 0);
      totalDespesasPorMes.forEach(total => {
        html += `<td class="dre-cell dre-despesa">R$ ${total.toFixed(2)}</td>`;
      });
      html += `<td class="dre-cell dre-despesa dre-total">R$ ${totalDespesas.toFixed(2)}</td></tr>`;
      
      // Saldo
      html += '<tr class="dre-result-row"><td class="dre-cell">Saldo</td>';
      const saldoTotal = totalReceitas - totalDespesas;
      
      meses.forEach((mes, i) => {
        const saldoMes = totalReceitasPorMes[i] - totalDespesasPorMes[i];
        html += `<td class="dre-cell dre-resultado ${saldoMes >= 0 ? 'positive' : 'negative'}">R$ ${saldoMes.toFixed(2)}</td>`;
      });
      
      html += `<td class="dre-cell dre-resultado dre-total ${saldoTotal >= 0 ? 'positive' : 'negative'}">R$ ${saldoTotal.toFixed(2)}</td></tr>`;
      
      html += '</tbody></table></div></div>';
      dreContainer.style.display = 'block';
      dreContainer.innerHTML = html;
      
      return;
    }

    // Mostrar canvas novamente para outros gráficos
    const canvas = document.getElementById("graficoDinamico");
    if (canvas) canvas.style.display = 'block';
    const dreContainer = document.getElementById('dre-container');
    if (dreContainer) dreContainer.style.display = 'none';

    chartInstance = new Chart(ctx, {
      type: chartType,
      data: {
        labels,
        datasets: [{
          label,
          data,
          borderColor: chartType === "pie" ? "#232b38" : "#38a169",
          backgroundColor: chartType === "pie" ? backgroundColors : "rgba(56, 161, 105, 0.18)",
          tension: 0.3,
          fill: false,
          pointBackgroundColor: "#3182ce",
          pointBorderColor: "#38a169",
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: "#e2e8f0", font: { weight: 'bold', size: 15 } } },
          title: { display: false },
          tooltip: {
            backgroundColor: "#232b38",
            titleColor: "#38a169",
            bodyColor: "#e2e8f0",
            borderColor: "#3182ce",
            borderWidth: 1
          }
        },
        layout: { padding: 16 },
        scales: chartType === "pie" ? {} : {
          x: {
            ticks: { color: "#e2e8f0", font: { weight: 'bold' } },
            grid: { color: "#2d3748" }
          },
          y: {
            ticks: { color: "#e2e8f0", font: { weight: 'bold' } },
            grid: { color: "#2d3748" }
          }
        },
        backgroundColor: "#232b38"
      }
    });
  }

  // Evento para trocar o gráfico
  const selectGrafico = document.getElementById("tipo-grafico");
  if (selectGrafico) {
    selectGrafico.addEventListener("change", function () {
      renderizarGrafico(this.value);
    });
  }

  // Renderiza o gráfico padrão ao abrir a aba
  if (document.getElementById("graficoDinamico")) {
    renderizarGrafico(document.getElementById("tipo-grafico").value);
  }
});

  // Evento para trocar o gráfico
  const selectGrafico = document.getElementById("tipo-grafico");
  if (selectGrafico) {
    selectGrafico.addEventListener("change", function () {
      renderizarGrafico(this.value);
    });
  }

  // Renderiza o gráfico padrão ao abrir a aba
  if (document.getElementById("graficoDinamico")) {
    renderizarGrafico(document.getElementById("tipo-grafico").value);
  }
