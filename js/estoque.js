// Estoque - Controle de Produtos
document.addEventListener("DOMContentLoaded", function () {
  
  // Função para mostrar notificações rápidas
  function mostrarNotificacao(mensagem, tipo = 'sucesso') {
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao-estoque ${tipo}`;
    notificacao.textContent = mensagem;
    
    const isMobile = window.innerWidth <= 480;
    notificacao.style.cssText = `
      position: fixed;
      ${isMobile ? 'top: 10px; left: 10px; right: 10px;' : 'top: 20px; right: 20px;'}
      background: ${tipo === 'sucesso' ? '#2f855a' : '#e53e3e'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-weight: bold;
      transform: ${isMobile ? 'translateY(-100%)' : 'translateX(100%)'};
      transition: transform 0.3s ease;
      text-align: center;
    `;
    
    document.body.appendChild(notificacao);
    
    // Animar entrada
    setTimeout(() => {
      notificacao.style.transform = isMobile ? 'translateY(0)' : 'translateX(0)';
    }, 10);
    
    // Remover após 3 segundos
    setTimeout(() => {
      notificacao.style.transform = isMobile ? 'translateY(-100%)' : 'translateX(100%)';
      setTimeout(() => {
        if (notificacao.parentNode) {
          notificacao.parentNode.removeChild(notificacao);
        }
      }, 300);
    }, 3000);
  }
  
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
    if (!produtos || !Array.isArray(produtos)) return;
    
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
    const valorInput = document.getElementById("saida-modal-valor");
    modal.classList.remove('modal-hidden');
    produtoInfo.textContent = `${produtos[index].nome} (${produtos[index].quantidade} unidades disponíveis)`;
    qtdInput.value = "";
    valorInput.value = "";
    qtdInput.focus();
    modal.dataset.produtoIndex = index;
  }

  window.removerProduto = async function (index) {
    const produto = produtos[index];
    
    const result = await Swal.fire({
      title: '🗑️ Excluir Produto',
      html: `<div style="text-align: left; margin: 20px 0;">
               <p style="margin-bottom: 15px;"><strong>Produto:</strong> ${produto.nome}</p>
               <p style="margin-bottom: 15px;"><strong>Quantidade:</strong> ${produto.quantidade} unidades</p>
               <p style="color: #ff6b6b; font-weight: bold;">⚠️ Esta ação é irreversível!</p>
             </div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '🗑️ Sim, excluir',
      cancelButtonText: '❌ Cancelar',
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
      const quantidadeExcluida = produto.quantidade;
      
      // Feedback visual imediato
      const item = document.querySelectorAll('.estoque-item')[index];
      if (item) {
        item.classList.add('removendo');
      }
      
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
      
      // Notificação de sucesso com SweetAlert2
      Swal.fire({
        title: '✅ Produto Removido',
        text: `${produto.nome} foi removido do estoque com sucesso!`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        customClass: {
          popup: 'swal-dark-popup',
          title: 'swal-dark-title'
        },
        background: '#2d3748',
        color: '#e2e8f0',
        toast: true,
        position: 'top-end'
      });
      
      if (typeof renderizarDashboardResumo === 'function') {
        renderizarDashboardResumo();
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
                  <span class="icon-remover">&#128465;</span>
                </button>
                <button class="btn-saida" title="Saída" onclick="abrirSaidaProduto(${produtos.length - 1})">
                  <span class="icon-saida">&#8594;</span>
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
        
        if (idx >= 0) {
          mostrarNotificacao(`Estoque atualizado: +${quantidade} ${nome}`);
        } else {
          mostrarNotificacao(`Produto adicionado: ${nome}`);
        }
        
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
    saidaModalForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const idx = parseInt(saidaModal.dataset.produtoIndex);
      const qtdInput = document.getElementById("saida-modal-quantidade");
      const valorInput = document.getElementById("saida-modal-valor");
      const qtd = parseInt(qtdInput.value);
      const valor = parseFloat(valorInput.value);
      
      if (!isNaN(idx) && !isNaN(qtd) && qtd > 0 && produtos[idx].quantidade >= qtd && !isNaN(valor) && valor >= 0) {
        // Desabilitar botão para evitar cliques duplos
        const submitBtn = saidaModalForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processando...';
        
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
        
        // Adicionar automaticamente ao Google Sheets
        mostrarNotificacao(`Saída registrada: ${qtd} ${produtos[idx].nome}`);
        
        if (typeof adicionarLancamentoSheets === 'function') {
          adicionarLancamentoSheets(novoLancamento).then(sucesso => {
            if (sucesso && typeof updateSyncIndicator === 'function') {
              updateSyncIndicator('success');
            }
          });
        }
        
        // Reabilitar botão
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }, 1000);
      } else {
        mostrarNotificacao('Preencha quantidade e valor válidos!', 'erro');
        
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