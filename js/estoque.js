// Estoque - Controle de Produtos
document.addEventListener("DOMContentLoaded", function () {
  
  function renderizarProdutos() {
    const lista = document.getElementById("estoque-lista");
    if (!lista) return;
    
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

  function abrirSaidaProduto(index) {
    const modal = document.getElementById("saida-modal");
    const produtoInfo = document.getElementById("saida-modal-produto");
    const qtdInput = document.getElementById("saida-modal-quantidade");
    modal.classList.remove('modal-hidden');
    produtoInfo.textContent = `${produtos[index].nome} (${produtos[index].quantidade} unidades disponíveis)`;
    qtdInput.value = "";
    qtdInput.focus();
    modal.dataset.produtoIndex = index;
  }

  window.removerProduto = function (index) {
    if (confirm('Tem certeza que deseja remover este produto do estoque?')) {
      if (confirm('Esta ação é irreversível. Deseja realmente excluir?')) {
        produtos.splice(index, 1);
        salvarProdutos();
        renderizarProdutos();
        if (typeof renderizarDashboardResumo === 'function') {
          renderizarDashboardResumo();
        }
      }
    }
  };

  window.abrirSaidaProduto = abrirSaidaProduto;

  // Formulário de entrada de produto
  const form = document.getElementById("estoque-form");
  if (form) {
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
        if (typeof renderizarDashboardResumo === 'function') {
          renderizarDashboardResumo();
        }
      }
    });
  }

  // Modal saída de produto
  const saidaModal = document.getElementById("saida-modal");
  const saidaModalForm = document.getElementById("saida-modal-form");
  const saidaModalCancel = saidaModal?.querySelector(".modal-cancel");
  
  if (saidaModalForm) {
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
        if (typeof renderizarDashboardResumo === 'function') {
          renderizarDashboardResumo();
        }
        
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
        
        // Atualizar outras seções se necessário
        if (typeof renderizarLancamentos === 'function') {
          renderizarLancamentos();
        }
        if (typeof renderizarVendas === 'function') {
          renderizarVendas();
        }
        
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
  }
  
  if (saidaModalCancel) {
    saidaModalCancel.addEventListener("click", function () {
      saidaModal.classList.add('modal-hidden');
    });
  }

  // Expor funções globalmente
  window.renderizarProdutos = renderizarProdutos;
  window.atualizarSelectSaida = atualizarSelectSaida;
  
  // Renderizar produtos inicial
  renderizarProdutos();
});