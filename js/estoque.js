// Estoque - Controle de Produtos
document.addEventListener("DOMContentLoaded", function () {
  

  
  function renderizarProdutos() {
    const lista = document.getElementById("estoque-lista");
    if (!lista) return;
    
    lista.innerHTML = "";
    if (!produtos || !Array.isArray(produtos)) return;
    
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
            <span class="icon-remover"><i class="fas fa-trash"></i></span>
          </button>
          <button class="btn-saida" title="Saída" onclick="abrirSaidaProduto(${index})">
            <span class="icon-saida"><i class="fas fa-arrow-right"></i></span>
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
    if (!produtos || !Array.isArray(produtos)) return;
    
    produtos.forEach((p, idx) => {
      const option = document.createElement("option");
      option.value = idx;
      option.textContent = `${p.nome} (${p.quantidade} unidades)`;
      select.appendChild(option);
    });
  }

  function abrirSaidaProduto(index) {
    // Verificar se os botões estão bloqueados
    if (document.body.classList.contains('sync-disabled')) {
      if (typeof mostrarNotificacaoSync === 'function') {
        mostrarNotificacaoSync('Aguarde a sincronização terminar', 'warning');
      }
      return;
    }
    
    const modal = document.getElementById("saida-modal");
    const produtoInfo = document.getElementById("saida-modal-produto");
    const qtdInput = document.getElementById("saida-modal-quantidade");
    const valorInput = document.getElementById("saida-modal-valor");
    modal.classList.remove('modal-hidden');
    produtoInfo.textContent = `${produtos[index].nome} (${produtos[index].quantidade} unidades disponíveis)`;
    qtdInput.value = "";
    valorInput.value = "";
    qtdInput.focus();
    modal.dataset.produtoIndex = index;
  }

  window.removerProduto = async function (index) {
    // Verificar se os botões estão bloqueados
    if (document.body.classList.contains('sync-disabled')) {
      if (typeof mostrarNotificacaoSync === 'function') {
        mostrarNotificacaoSync('Aguarde a sincronização terminar', 'warning');
      }
      return;
    }
    
    const produto = produtos[index];
    
    const result = await Swal.fire({
      title: 'Excluir Produto',
      html: `<div class="swal-content-container">
               <p class="swal-info-item"><strong>Produto:</strong> ${produto.nome}</p>
               <p class="swal-info-item"><strong>Quantidade:</strong> ${produto.quantidade} unidades</p>
               <p class="swal-warning-text"><i class="fas fa-exclamation-triangle"></i> Esta ação é irreversível!</p>
             </div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      customClass: {
        popup: 'swal-dark-popup',
        title: 'swal-dark-title',
        htmlContainer: 'swal-dark-content',
        confirmButton: 'swal-dark-confirm',
        cancelButton: 'swal-dark-cancel'
      },
      background: '#2d3748',
      color: '#e2e8f0',
      confirmButtonColor: '#e53e3e',
      cancelButtonColor: '#4a5568',
      focusConfirm: false,
      focusCancel: true
    });
    
    if (result.isConfirmed) {
      // Bloquear botões durante operação
      document.body.classList.add('sync-disabled');
      
      const quantidadeExcluida = produto.quantidade;
      
      // Feedback visual imediato
      const item = document.querySelectorAll('.estoque-item')[index];
      if (item) {
        item.classList.add('removendo');
      }
      
      try {
        // Registrar exclusão como movimentação de saída no Google Sheets
        const estoqueAtivo = localStorage.getItem('estoqueGoogleSheetsAtivo') === 'true';
        if (estoqueAtivo && typeof adicionarMovimentacaoEstoque === 'function') {
          const movimentacao = {
            id: gerarIdentificadorUnico(),
            produto: produto.nome,
            categoria: 'Saída',
            quantidade: quantidadeExcluida,
            valorUnitario: 0,
            valorTotal: 0,
            data: new Date().toLocaleDateString('pt-BR'),
            tipoMovimento: 'Exclusão',
            observacoes: 'Exclusão total do produto'
          };
          await adicionarMovimentacaoEstoque(movimentacao);
        }
        
        produtos.splice(index, 1);
        salvarProdutos();
        renderizarProdutos();
        
        // Notificação de sucesso
        if (typeof mostrarNotificacaoSync === 'function') {
          mostrarNotificacaoSync(`${produto.nome} foi removido do estoque com sucesso!`, 'success');
        }
        
        if (typeof renderizarDashboardResumo === 'function') {
          renderizarDashboardResumo();
        }
      } finally {
        // Reativar botões após operação
        setTimeout(() => {
          document.body.classList.remove('sync-disabled');
        }, 1000);
      }
    }
  };

  window.abrirSaidaProduto = abrirSaidaProduto;

  // Formulário de entrada de produto
  const form = document.getElementById("estoque-form");
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const nomeInput = document.getElementById("produto");
      const qtdInput = document.getElementById("quantidade");
      const nome = nomeInput.value.trim();
      const quantidade = parseInt(qtdInput.value);

      if (nome && quantidade >= 0) {
        // Bloquear botões durante operação
        document.body.classList.add('sync-disabled');
        
        try {
          // Feedback visual imediato - limpar campos
          nomeInput.value = "";
          qtdInput.value = "";
          
          // Verifica se já existe o produto
          const idx = produtos.findIndex(p => p.nome.toLowerCase() === nome.toLowerCase());
          if (idx >= 0) {
            // Se existe, adiciona a quantidade com feedback visual
            const novaQuantidade = produtos[idx].quantidade + quantidade;
            produtos[idx].quantidade = novaQuantidade;
            
            // Atualizar visualmente o item existente
            const item = document.querySelectorAll('.estoque-item')[idx];
            if (item) {
              const quantidadeSpan = item.querySelector('.estoque-quantidade');
              if (quantidadeSpan) {
                quantidadeSpan.innerHTML = `${novaQuantidade} <small>unidades</small>`;
                item.classList.add('sucesso');
                setTimeout(() => {
                  item.classList.remove('sucesso');
                }, 1000);
              }
            }
          } else {
            // Se não existe, cadastra novo com feedback visual
            produtos.push({ nome, quantidade });
            
            // Adicionar item visualmente de forma imediata
            const lista = document.getElementById("estoque-lista");
            if (lista) {
              const item = document.createElement("li");
              item.classList.add("estoque-item", "novo", "sucesso");
              item.innerHTML = `
                <div class="estoque-info">
                  <span class="estoque-nome">${nome}</span>
                  <span class="estoque-quantidade">${quantidade} <small>unidades</small></span>
                </div>
                <div class="estoque-acoes">
                  <button class="btn-remover" title="Remover" onclick="removerProduto(${produtos.length - 1})">
                    <span class="icon-remover"><i class="fas fa-trash"></i></span>
                  </button>
                  <button class="btn-saida" title="Saída" onclick="abrirSaidaProduto(${produtos.length - 1})">
                    <span class="icon-saida"><i class="fas fa-arrow-right"></i></span>
                  </button>
                </div>
              `;
              lista.appendChild(item);
              setTimeout(() => {
                item.classList.remove('sucesso');
              }, 1000);
            }
          }
          
          // Salvar movimentação no Google Sheets se disponível
          const estoqueAtivo = localStorage.getItem('estoqueGoogleSheetsAtivo') === 'true';
          if (estoqueAtivo && typeof adicionarMovimentacaoEstoque === 'function') {
            const movimentacao = {
              id: gerarIdentificadorUnico(),
              produto: nome,
              categoria: 'Entrada',
              quantidade: quantidade,
              valorUnitario: 0,
              valorTotal: 0,
              data: new Date().toLocaleDateString('pt-BR'),
              tipoMovimento: 'Entrada',
              observacoes: 'Entrada manual de produto'
            };
            await adicionarMovimentacaoEstoque(movimentacao);
          }
          
          salvarProdutos();
          atualizarSelectSaida();
          
          if (typeof renderizarDashboardResumo === 'function') {
            renderizarDashboardResumo();
          }
        } finally {
          // Reativar botões após operação
          setTimeout(() => {
            document.body.classList.remove('sync-disabled');
          }, 1000);
        }
      }
    });
  }

  // Modal saída de produto
  const saidaModal = document.getElementById("saida-modal");
  const saidaModalForm = document.getElementById("saida-modal-form");
  const saidaModalCancel = saidaModal?.querySelector(".modal-cancel");
  
  if (saidaModalForm) {
    saidaModalForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const idx = parseInt(saidaModal.dataset.produtoIndex);
      const qtdInput = document.getElementById("saida-modal-quantidade");
      const valorInput = document.getElementById("saida-modal-valor");
      const qtd = parseInt(qtdInput.value);
      const valor = parseFloat(valorInput.value);
      
      if (!isNaN(idx) && !isNaN(qtd) && qtd > 0 && produtos[idx].quantidade >= qtd && !isNaN(valor) && valor >= 0) {
        // Bloquear botões durante operação
        document.body.classList.add('sync-disabled');
        
        // Desabilitar botão para evitar cliques duplos
        const submitBtn = saidaModalForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processando...';
        
        try {
          // Feedback visual imediato - fechar modal
          saidaModal.classList.add('modal-hidden');
          
          // Feedback visual imediato - atualizar quantidade na tela
          const item = document.querySelectorAll('.estoque-item')[idx];
          if (item) {
            const quantidadeSpan = item.querySelector('.estoque-quantidade');
            const novaQuantidade = produtos[idx].quantidade - qtd;
            if (quantidadeSpan) {
              quantidadeSpan.innerHTML = `${novaQuantidade} <small>unidades</small>`;
              item.classList.add('sucesso');
              setTimeout(() => {
                item.classList.remove('sucesso');
              }, 1000);
            }
          }
          
          produtos[idx].quantidade -= qtd;
          
          // Salvar movimentação de saída no Google Sheets se disponível
          const estoqueAtivo = localStorage.getItem('estoqueGoogleSheetsAtivo') === 'true';
          if (estoqueAtivo && typeof adicionarMovimentacaoEstoque === 'function') {
            const movimentacao = {
              id: gerarIdentificadorUnico(),
              produto: produtos[idx].nome,
              categoria: 'Saída',
              quantidade: qtd,
              valorUnitario: valor / qtd,
              valorTotal: valor,
              data: new Date().toLocaleDateString('pt-BR'),
              tipoMovimento: 'Venda',
              observacoes: 'Venda de produto'
            };
            await adicionarMovimentacaoEstoque(movimentacao);
          }
          
          salvarProdutos();
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
          
          if (typeof adicionarLancamentoSheets === 'function') {
            adicionarLancamentoSheets(novoLancamento).then(sucesso => {
              if (sucesso && typeof updateSyncIndicator === 'function') {
                updateSyncIndicator('success');
              }
            });
          }
        } finally {
          // Reabilitar botão
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            // Reativar botões após operação
            document.body.classList.remove('sync-disabled');
          }, 1000);
        }
      } else {
        if (typeof mostrarNotificacaoSync === 'function') {
          mostrarNotificacaoSync('Preencha quantidade e valor válidos!', 'error');
        }
        
        // Reabilitar botão em caso de erro
        const submitBtn = saidaModalForm.querySelector('button[type="submit"]');
        if (submitBtn.disabled) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Confirmar Saída';
        }
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