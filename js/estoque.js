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
          <button class="btn-saida" title="Saída" onclick="abrirSaidaProduto(${index})">
            <span class="icon-saida"><i class="fas fa-arrow-right"></i></span>
          </button>
          <button class="btn-movimentacoes" title="Ver Movimentações" onclick="abrirMovimentacoesProduto('${p.nome}')">
            <span class="icon-movimentacoes"><i class="fas fa-list"></i></span>
          </button>
        </div>
      `;
      lista.appendChild(item);
    });
    
    // Forçar recálculo de layout para evitar problemas de renderização
    setTimeout(() => {
      lista.style.transform = 'translateZ(0)';
      lista.offsetHeight; // Força reflow
      lista.style.transform = '';
    }, 50);
    
    atualizarSelectSaida();
    atualizarListaProdutos();
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
    if (document.body.classList.contains('sync-disabled')) {
      if (typeof mostrarNotificacaoSync === 'function') {
        mostrarNotificacaoSync('Aguarde a sincronização terminar', 'warning');
      }
      return;
    }
    
    if (!produtos[index]) {
      console.error('Produto não encontrado no índice:', index);
      if (typeof mostrarNotificacaoSync === 'function') {
        mostrarNotificacaoSync('Erro: Produto não encontrado', 'error');
      }
      return;
    }
    
    const modal = document.getElementById("saida-modal");
    const produtoInfo = document.getElementById("saida-modal-produto");
    const qtdInput = document.getElementById("saida-modal-quantidade");
    const valorInput = document.getElementById("saida-modal-valor");
    
    if (!modal || !produtoInfo || !qtdInput || !valorInput) {
      console.error('Elementos do modal de saída não encontrados');
      return;
    }
    
    modal.classList.remove('modal-hidden');
    produtoInfo.textContent = `${produtos[index].nome} (${produtos[index].quantidade} unidades disponíveis)`;
    qtdInput.value = "";
    valorInput.value = "";
    qtdInput.max = produtos[index].quantidade;
    
    // Validação em tempo real
    qtdInput.addEventListener('input', function() {
      const qtd = parseInt(this.value);
      if (qtd > produtos[index].quantidade) {
        this.style.borderColor = '#e53e3e';
      } else if (qtd > 0) {
        this.style.borderColor = '#48bb78';
      } else {
        this.style.borderColor = '#4a5568';
      }
    });
    
    qtdInput.focus();
    modal.dataset.produtoIndex = index;
  }

  // Variável para armazenar movimentações de estoque
  let movimentacoesEstoque = [];
  
  // Função para atualizar lista suspensa de produtos
  function atualizarListaProdutos() {
    const datalist = document.getElementById("produtos-lista");
    if (!datalist) return;
    
    datalist.innerHTML = "";
    
    // Carregar movimentações para obter todos os produtos já utilizados
    carregarMovimentacoes();
    const produtosUnicos = new Set();
    
    // Adicionar produtos do estoque atual
    if (produtos && Array.isArray(produtos)) {
      produtos.forEach(p => produtosUnicos.add(p.nome));
    }
    
    // Adicionar produtos das movimentações (incluindo os sem estoque)
    movimentacoesEstoque.forEach(mov => {
      if (mov.produto && mov.produto.trim()) {
        produtosUnicos.add(mov.produto.trim());
      }
    });
    
    // Criar options para o datalist
    Array.from(produtosUnicos).sort().forEach(nomeProduto => {
      const option = document.createElement("option");
      option.value = nomeProduto;
      datalist.appendChild(option);
    });
  }
  
  // Função para carregar movimentações
  function carregarMovimentacoes() {
    const salvas = localStorage.getItem('movimentacoesEstoque');
    if (salvas) {
      movimentacoesEstoque = JSON.parse(salvas);
    }
  }
  
  // Função para salvar movimentações
  function salvarMovimentacoes() {
    localStorage.setItem('movimentacoesEstoque', JSON.stringify(movimentacoesEstoque));
  }
  
  // Função para atualizar módulo financeiro após alterações nas movimentações
  function atualizarModuloFinanceiro() {
    if (typeof renderizarLancamentos === 'function') {
      renderizarLancamentos();
    }
    if (typeof renderizarResumoFinanceiro === 'function') {
      renderizarResumoFinanceiro();
    }
  }
  
  // Função para remover movimentação (CRUD direto)
  window.removerMovimentacao = async function(movimentacaoId) {
    if (document.body.classList.contains('sync-disabled')) {
      if (typeof mostrarNotificacaoSync === 'function') {
        mostrarNotificacaoSync('Aguarde a sincronização terminar', 'warning');
      }
      return;
    }
    
    console.log('=== INICIANDO EXCLUSÃO DIRETA DE MOVIMENTAÇÃO ===');
    console.log('ID da movimentação:', movimentacaoId);
    
    // Desabilitar botões CRUD
    document.body.classList.add('sync-disabled');
    
    try {
      // Carregar movimentações para encontrar a que será excluída
      carregarMovimentacoes();
      const movimentacao = movimentacoesEstoque.find(m => m.id === movimentacaoId);
      
      // Excluir do Google Sheets se disponível
      const estoqueAtivo = localStorage.getItem('estoqueGoogleSheetsAtivo') === 'true';
      if (estoqueAtivo && typeof excluirMovimentacaoEstoque === 'function') {
        const sucessoExclusao = await excluirMovimentacaoEstoque(movimentacaoId);
        if (!sucessoExclusao) {
          console.error('Falha ao excluir movimentação do Google Sheets');
          mostrarNotificacaoSync('Erro ao sincronizar exclusão', 'error');
          return;
        }
      }
      
      // Remover lançamento financeiro correspondente se for uma venda
      if (movimentacao && movimentacao.tipoMovimento === 'Venda' && typeof lancamentos !== 'undefined') {
        console.log('=== REMOVENDO LANÇAMENTO FINANCEIRO CORRESPONDENTE ===');
        const indexLancamento = lancamentos.findIndex(l => l.id === movimentacaoId);
        if (indexLancamento >= 0) {
          lancamentos.splice(indexLancamento, 1);
          if (typeof salvarLancamentos === 'function') {
            salvarLancamentos();
          }
          console.log('Lançamento financeiro removido:', movimentacaoId);
        }
      }
      
      // Remover da lista local
      const index = movimentacoesEstoque.findIndex(m => m.id === movimentacaoId);
      if (index >= 0) {
        movimentacoesEstoque.splice(index, 1);
        salvarMovimentacoes();
      }
      
      // Recalcular produtos baseado nas movimentações restantes
      recalcularEstoque();
      renderizarProdutos();
      
      // Atualizar módulo financeiro
      atualizarModuloFinanceiro();
      
      if (typeof mostrarNotificacaoSync === 'function') {
        mostrarNotificacaoSync('Movimentação excluída com sucesso!', 'success');
      }
      
      if (typeof renderizarDashboardResumo === 'function') {
        renderizarDashboardResumo();
      }
      
      console.log('=== EXCLUSÃO DIRETA CONCLUÍDA ===');
      
    } catch (error) {
      console.error('Erro na exclusão:', error);
      if (typeof mostrarNotificacaoSync === 'function') {
        mostrarNotificacaoSync('Erro na exclusão', 'error');
      }
    } finally {
      setTimeout(() => {
        document.body.classList.remove('sync-disabled');
      }, 1000);
    }
  };
  
  // Função para recalcular estoque baseado nas movimentações
  function recalcularEstoque() {
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
  }
  
  window.removerProduto = async function (index) {
    if (document.body.classList.contains('sync-disabled')) {
      if (typeof mostrarNotificacaoSync === 'function') {
        mostrarNotificacaoSync('Aguarde a sincronização terminar', 'warning');
      }
      return;
    }
    
    const produto = produtos[index];
    
    if (!produto) {
      console.error('Produto não encontrado no índice:', index);
      mostrarNotificacaoSync('Erro: Produto não encontrado', 'error');
      return;
    }
    
    console.log('=== INICIANDO EXCLUSÃO DE PRODUTO ===');
    console.log('Índice do produto:', index);
    console.log('Dados do produto:', produto);
    
    const result = await Swal.fire({
      title: 'Excluir Produto',
      html: `<div class="swal-content-container">
               <p class="swal-info-item"><strong>Produto:</strong> ${produto.nome}</p>
               <p class="swal-info-item"><strong>Quantidade:</strong> ${produto.quantidade} unidades</p>
               <p class="swal-warning-text"><i class="fas fa-exclamation-triangle"></i> Todas as movimentações deste produto serão excluídas!</p>
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
      const item = document.querySelectorAll('.estoque-item')[index];
      if (item) {
        item.classList.add('excluindo');
      }
      
      document.body.classList.add('sync-disabled');
      
      try {
        // Carregar e encontrar todas as movimentações do produto
        carregarMovimentacoes();
        const movimentacoesProduto = movimentacoesEstoque.filter(m => m.produto === produto.nome);
        
        // Excluir cada movimentação do Google Sheets
        const estoqueAtivo = localStorage.getItem('estoqueGoogleSheetsAtivo') === 'true';
        if (estoqueAtivo && typeof excluirMovimentacaoEstoque === 'function') {
          for (const mov of movimentacoesProduto) {
            const sucesso = await excluirMovimentacaoEstoque(mov.id);
            if (!sucesso) {
              console.error('Falha ao excluir movimentação:', mov.id);
            }
          }
        }
        
        // Remover todas as movimentações do produto localmente
        movimentacoesEstoque = movimentacoesEstoque.filter(m => m.produto !== produto.nome);
        salvarMovimentacoes();
        
        // Recalcular estoque
        recalcularEstoque();
        renderizarProdutos();
        atualizarListaProdutos();
        
        // Atualizar módulo financeiro
        atualizarModuloFinanceiro();
        
        if (typeof mostrarNotificacaoSync === 'function') {
          mostrarNotificacaoSync(`${produto.nome} foi removido completamente!`, 'success');
        }
        
        if (typeof renderizarDashboardResumo === 'function') {
          renderizarDashboardResumo();
        }
        
        console.log('=== EXCLUSÃO DE PRODUTO CONCLUÍDA ===');
        
      } catch (error) {
        if (item) {
          item.classList.remove('excluindo');
        }
        console.error('Erro na exclusão:', error);
        if (typeof mostrarNotificacaoSync === 'function') {
          mostrarNotificacaoSync('Erro na exclusão', 'error');
        }
      } finally {
        setTimeout(() => {
          document.body.classList.remove('sync-disabled');
        }, 1000);
      }
    }
  };

  window.abrirSaidaProduto = abrirSaidaProduto;

  // Adicionar evento para detectar produtos novos
  const produtoInput = document.getElementById("produto");
  if (produtoInput) {
    // Melhorar para mobile: adicionar atributos específicos
    produtoInput.setAttribute('inputmode', 'text');
    produtoInput.setAttribute('enterkeyhint', 'next');
    
    produtoInput.addEventListener('input', function() {
      const valor = this.value.trim();
      if (valor) {
        // Verificar se é um produto existente
        carregarMovimentacoes();
        const produtosExistentes = new Set();
        
        if (produtos && Array.isArray(produtos)) {
          produtos.forEach(p => produtosExistentes.add(p.nome.toLowerCase()));
        }
        
        movimentacoesEstoque.forEach(mov => {
          if (mov.produto && mov.produto.trim()) {
            produtosExistentes.add(mov.produto.trim().toLowerCase());
          }
        });
        
        const isNovo = !produtosExistentes.has(valor.toLowerCase());
        
        // Adicionar indicador visual para produto novo
        if (isNovo && valor.length > 2) {
          this.style.borderColor = '#f6ad55';
          this.title = 'Produto novo - será adicionado ao catálogo';
        } else {
          this.style.borderColor = '#4a5568';
          this.title = '';
        }
      }
    });
    
    // Limpar estilo quando perde o foco
    produtoInput.addEventListener('blur', function() {
      this.style.borderColor = '';
      this.title = '';
    });
    
    // Restaurar estilo quando ganha foco
    produtoInput.addEventListener('focus', function() {
      this.style.borderColor = '#17acaf';
    });
  }

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
          
          // Criar movimentação de entrada
          const movimentacaoId = window.gerarIdentificadorUnico();
          const movimentacao = {
            id: movimentacaoId,
            produto: nome,
            categoria: 'Entrada',
            quantidade: quantidade,
            valorUnitario: 0,
            valorTotal: 0,
            data: new Date().toLocaleDateString('pt-BR'),
            tipoMovimento: 'Entrada',
            observacoes: 'Entrada manual de produto'
          };
          
          // Carregar e adicionar movimentação
          carregarMovimentacoes();
          movimentacoesEstoque.push(movimentacao);
          salvarMovimentacoes();
          
          // Salvar movimentação no Google Sheets se disponível
          const estoqueAtivo = localStorage.getItem('estoqueGoogleSheetsAtivo') === 'true';
          if (estoqueAtivo && typeof adicionarMovimentacaoEstoque === 'function') {
            await adicionarMovimentacaoEstoque(movimentacao);
          }
          
          // Recalcular estoque baseado nas movimentações
          recalcularEstoque();
          renderizarProdutos();
          atualizarSelectSaida();
          atualizarListaProdutos();
          
          // Atualizar módulo financeiro
          atualizarModuloFinanceiro();
          
          // Forçar recálculo de layout após adicionar item
          setTimeout(() => {
            const lista = document.getElementById("estoque-lista");
            if (lista) {
              lista.style.height = 'auto';
              lista.offsetHeight; // Força reflow
            }
          }, 100);
          
          if (typeof renderizarDashboardResumo === 'function') {
            renderizarDashboardResumo();
          }
        } finally {
          // Reativar botões após operação
          setTimeout(() => {
            document.body.classList.remove('sync-disabled');
            // Forçar recálculo de layout
            forcarRecalculoLayout();
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
          
          // Gerar ID compartilhado para estoque e financeiro
          const idCompartilhado = window.gerarIdentificadorUnico();
          
          // Criar movimentação de saída
          const movimentacao = {
            id: idCompartilhado,
            produto: produtos[idx].nome,
            categoria: 'Saída',
            quantidade: qtd,
            valorUnitario: valor / qtd,
            valorTotal: valor,
            data: new Date().toLocaleDateString('pt-BR'),
            tipoMovimento: 'Venda',
            observacoes: 'Venda de produto'
          };
          
          // Carregar e adicionar movimentação
          carregarMovimentacoes();
          movimentacoesEstoque.push(movimentacao);
          salvarMovimentacoes();
          
          // Salvar movimentação no Google Sheets se disponível
          const estoqueAtivo = localStorage.getItem('estoqueGoogleSheetsAtivo') === 'true';
          if (estoqueAtivo && typeof adicionarMovimentacaoEstoque === 'function') {
            await adicionarMovimentacaoEstoque(movimentacao);
          }
          
          // Recalcular estoque baseado nas movimentações
          recalcularEstoque();
          renderizarProdutos();
          atualizarListaProdutos();
          
          // Atualizar módulo financeiro
          atualizarModuloFinanceiro();
          
          if (typeof renderizarDashboardResumo === 'function') {
            renderizarDashboardResumo();
          }
          
          // Registrar saída como lançamento financeiro com mesmo ID da movimentação
          const novoLancamento = {
            id: idCompartilhado,
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
        let erro = 'Erro: ';
        if (isNaN(qtd) || qtd <= 0) erro += 'Quantidade inválida. ';
        if (produtos[idx] && qtd > produtos[idx].quantidade) erro += 'Estoque insuficiente. ';
        if (isNaN(valor) || valor < 0) erro += 'Valor inválido.';
        
        if (typeof mostrarNotificacaoSync === 'function') {
          mostrarNotificacaoSync(erro, 'error');
        }
        
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

  // Funções para gerenciar produtos - VERSÃO ROBUSTA
  let produtoSendoGerenciado = null;
  
  window.abrirGerenciarProduto = function(index) {
    if (document.body.classList.contains('sync-disabled')) {
      if (typeof mostrarNotificacaoSync === 'function') {
        mostrarNotificacaoSync('Aguarde a sincronização terminar', 'warning');
      }
      return;
    }
    
    produtoSendoGerenciado = index;
    const produto = produtos[index];
    const modal = document.getElementById("gerenciar-modal");
    const produtoInfo = document.getElementById("gerenciar-modal-produto");
    
    console.log('=== ABRINDO GERENCIAMENTO DE PRODUTO ===');
    console.log('Índice do produto:', index);
    console.log('Dados do produto:', produto);
    
    produtoInfo.innerHTML = `<strong>${produto.nome}</strong><br>${produto.quantidade} unidades`;
    modal.classList.remove('modal-hidden');
  };
  
  window.fecharGerenciarModal = function() {
    document.getElementById("gerenciar-modal").classList.add('modal-hidden');
    produtoSendoGerenciado = null;
  };
  
  window.abrirEdicaoProduto = function() {
    if (produtoSendoGerenciado === null) return;
    
    const produto = produtos[produtoSendoGerenciado];
    const modal = document.getElementById("editar-produto-modal");
    const nomeInput = document.getElementById("editar-produto-nome");
    const quantidadeInput = document.getElementById("editar-produto-quantidade");
    
    nomeInput.value = produto.nome;
    quantidadeInput.value = produto.quantidade;
    
    document.getElementById("gerenciar-modal").classList.add('modal-hidden');
    modal.classList.remove('modal-hidden');
    nomeInput.focus();
  };
  
  window.fecharEdicaoProduto = function() {
    document.getElementById("editar-produto-modal").classList.add('modal-hidden');
    produtoSendoGerenciado = null;
  };
  
  window.confirmarExclusaoProduto = function() {
    if (produtoSendoGerenciado !== null) {
      document.getElementById("gerenciar-modal").classList.add('modal-hidden');
      removerProduto(produtoSendoGerenciado);
      produtoSendoGerenciado = null;
    }
  };
  
  // Formulário de edição de produto - VERSÃO ROBUSTA
  const editarProdutoForm = document.getElementById("editar-produto-form");
  if (editarProdutoForm) {
    editarProdutoForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      
      if (produtoSendoGerenciado === null) return;
      
      const nomeInput = document.getElementById("editar-produto-nome");
      const quantidadeInput = document.getElementById("editar-produto-quantidade");
      const novoNome = nomeInput.value.trim();
      const novaQuantidade = parseInt(quantidadeInput.value);
      
      if (!novoNome || novaQuantidade < 0) {
        if (typeof mostrarNotificacaoSync === 'function') {
          mostrarNotificacaoSync('Preencha todos os campos corretamente!', 'error');
        }
        return;
      }
      
      // Verificar se o novo nome já existe em outro produto
      const nomeExiste = produtos.findIndex((p, idx) => 
        p.nome.toLowerCase() === novoNome.toLowerCase() && idx !== produtoSendoGerenciado
      );
      
      if (nomeExiste >= 0) {
        if (typeof mostrarNotificacaoSync === 'function') {
          mostrarNotificacaoSync('Já existe um produto com este nome!', 'error');
        }
        return;
      }
      
      console.log('=== INICIANDO EDIÇÃO ROBUSTA DE PRODUTO ===');
      console.log('Índice do produto:', produtoSendoGerenciado);
      console.log('Produto original:', produtos[produtoSendoGerenciado]);
      console.log('Novos dados:', { nome: novoNome, quantidade: novaQuantidade });
      
      // Feedback visual imediato - aspecto cinza e reduzido
      const item = document.querySelectorAll('.estoque-item')[produtoSendoGerenciado];
      if (item) {
        item.classList.add('editando');
      }
      
      document.body.classList.add('sync-disabled');
      
      try {
        const produtoOriginal = { ...produtos[produtoSendoGerenciado] };
        const diferencaQuantidade = novaQuantidade - produtoOriginal.quantidade;
        
        // Atualizar produto localmente
        produtos[produtoSendoGerenciado].nome = novoNome;
        produtos[produtoSendoGerenciado].quantidade = novaQuantidade;
        
        // Carregar e atualizar nome do produto em todas as movimentações existentes
        carregarMovimentacoes();
        if (produtoOriginal.nome !== novoNome) {
          movimentacoesEstoque.forEach(mov => {
            if (mov.produto === produtoOriginal.nome) {
              mov.produto = novoNome;
            }
          });
        }
        
        // Se houve mudança na quantidade, registrar movimentação de ajuste
        const estoqueAtivo = localStorage.getItem('estoqueGoogleSheetsAtivo') === 'true';
        if (diferencaQuantidade !== 0) {
          const movimentacaoId = window.gerarIdentificadorUnico();
          const tipoMovimento = diferencaQuantidade > 0 ? 'Entrada' : 'Saída';
          const quantidadeMovimento = Math.abs(diferencaQuantidade);
          
          const movimentacao = {
            id: movimentacaoId,
            produto: novoNome,
            categoria: tipoMovimento,
            quantidade: quantidadeMovimento,
            valorUnitario: 0,
            valorTotal: 0,
            data: new Date().toLocaleDateString('pt-BR'),
            tipoMovimento: 'Ajuste',
            observacoes: `Ajuste de estoque: ${produtoOriginal.nome} -> ${novoNome}`
          };
          
          movimentacoesEstoque.push(movimentacao);
          
          console.log('Registrando movimentação de ajuste - ID:', movimentacaoId);
          console.log('Tipo de movimento:', tipoMovimento);
          console.log('Quantidade do movimento:', quantidadeMovimento);
          
          if (estoqueAtivo && typeof adicionarMovimentacaoEstoque === 'function') {
            const sucessoMovimentacao = await adicionarMovimentacaoEstoque(movimentacao);
            
            if (!sucessoMovimentacao) {
              console.error('Falha ao registrar movimentação de ajuste');
              mostrarNotificacaoSync('Erro ao sincronizar ajuste de estoque', 'error');
              // Reverter alteração local
              produtos[produtoSendoGerenciado] = produtoOriginal;
              return;
            }
            
            console.log('Movimentação de ajuste registrada com sucesso');
          }
        }
        
        salvarMovimentacoes();
        
        // Recalcular estoque baseado nas movimentações atualizadas
        recalcularEstoque();
        renderizarProdutos();
        atualizarListaProdutos();
        
        // Atualizar módulo financeiro
        atualizarModuloFinanceiro();
        
        if (typeof mostrarNotificacaoSync === 'function') {
          mostrarNotificacaoSync('Produto atualizado e sincronizado!', 'success');
        }
        
        if (typeof renderizarDashboardResumo === 'function') {
          renderizarDashboardResumo();
        }
        
        console.log('=== EDIÇÃO ROBUSTA DE PRODUTO CONCLUÍDA ===');
        console.log('Produto atualizado:', { nome: novoNome, quantidade: novaQuantidade });
        
        fecharEdicaoProduto();
      } catch (error) {
        // Em caso de erro, remover feedback visual
        if (item) {
          item.classList.remove('editando');
        }
        throw error;
      } finally {
        setTimeout(() => {
          document.body.classList.remove('sync-disabled');
        }, 1000);
      }
    });
  }

  // Função para forçar recálculo de layout
  function forcarRecalculoLayout() {
    const lista = document.getElementById("estoque-lista");
    if (lista) {
      // Força repaint e reflow
      lista.style.display = 'none';
      lista.offsetHeight;
      lista.style.display = '';
      
      // Força recálculo dos botões
      const botoes = lista.querySelectorAll('.btn-movimentacoes, .btn-saida, .btn-gerenciar');
      botoes.forEach(btn => {
        btn.style.position = 'relative';
        btn.style.zIndex = '15';
      });
    }
  }
  
  // Expor funções globalmente
  window.renderizarProdutos = renderizarProdutos;
  window.atualizarSelectSaida = atualizarSelectSaida;
  window.atualizarListaProdutos = atualizarListaProdutos;
  window.forcarRecalculoLayout = forcarRecalculoLayout;
  
  // Sincronizar movimentações do Google Sheets ao inicializar
  async function sincronizarMovimentacoesIniciais() {
    const estoqueAtivo = localStorage.getItem('estoqueGoogleSheetsAtivo') === 'true';
    if (estoqueAtivo && typeof sincronizarEstoque === 'function') {

      await sincronizarEstoque();
      
      // Após sincronizar, carregar movimentações do localStorage
      const movimentacoesSalvas = localStorage.getItem('movimentacoesEstoque');
      if (movimentacoesSalvas) {
        movimentacoesEstoque = JSON.parse(movimentacoesSalvas);

        recalcularEstoque();
        renderizarProdutos();
      }
    } else {
      // Mesmo sem Google Sheets, carregar movimentações locais
      carregarMovimentacoes();
      recalcularEstoque();
    }
  }
  
  // Observer para detectar mudanças no DOM e recalcular layout
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.target.id === 'estoque-lista') {
        // Aguardar um pouco para o DOM se estabilizar
        setTimeout(() => {
          forcarRecalculoLayout();
        }, 150);
      }
    });
  });
  
  // Observar mudanças na lista de estoque
  const estoqueListaElement = document.getElementById('estoque-lista');
  if (estoqueListaElement) {
    observer.observe(estoqueListaElement, {
      childList: true,
      subtree: true
    });
  }
  

  
  // Funções para modal de seleção de produto
  window.abrirSelecionarProdutoModal = function() {
    const modal = document.getElementById('selecionar-produto-modal');
    const lista = document.getElementById('produtos-modal-lista');
    const buscaInput = document.getElementById('busca-produto-input');
    
    // Carregar produtos
    carregarMovimentacoes();
    const produtosUnicos = new Set();
    
    if (produtos && Array.isArray(produtos)) {
      produtos.forEach(p => produtosUnicos.add(p.nome));
    }
    
    movimentacoesEstoque.forEach(mov => {
      if (mov.produto && mov.produto.trim()) {
        produtosUnicos.add(mov.produto.trim());
      }
    });
    
    const produtosArray = Array.from(produtosUnicos).sort();
    
    function renderizarProdutos(produtosFiltrados = produtosArray) {
      lista.innerHTML = '';
      
      if (produtosFiltrados.length === 0) {
        lista.innerHTML = '<div class="produtos-vazio">Nenhum produto encontrado</div>';
        return;
      }
      
      produtosFiltrados.forEach(produto => {
        const item = document.createElement('div');
        item.className = 'produto-item-modal';
        item.textContent = produto;
        item.addEventListener('click', () => {
          document.getElementById('produto').value = produto;
          fecharSelecionarProdutoModal();
          document.getElementById('quantidade').focus();
        });
        lista.appendChild(item);
      });
    }
    
    // Busca em tempo real
    buscaInput.value = '';
    buscaInput.addEventListener('input', function() {
      const termo = this.value.toLowerCase();
      const produtosFiltrados = produtosArray.filter(p => 
        p.toLowerCase().includes(termo)
      );
      renderizarProdutos(produtosFiltrados);
    });
    
    renderizarProdutos();
    modal.classList.remove('modal-hidden');
    buscaInput.focus();
  };
  
  window.fecharSelecionarProdutoModal = function() {
    document.getElementById('selecionar-produto-modal').classList.add('modal-hidden');
  };
  
  // Evento do botão de seleção
  const btnSelecionarProduto = document.getElementById('btn-selecionar-produto');
  if (btnSelecionarProduto) {
    btnSelecionarProduto.addEventListener('click', abrirSelecionarProdutoModal);
  }
  
  // Inicialização
  carregarMovimentacoes();
  recalcularEstoque();
  renderizarProdutos();
  atualizarListaProdutos();
  
  // Verificar se precisa sincronizar após reset de cookies
  const ultimaSincronizacao = localStorage.getItem('ultimaSincronizacaoEstoque');
  const agora = Date.now();
  
  // Se não há registro de sincronização ou foi há mais de 1 hora, forçar sincronização
  if (!ultimaSincronizacao || (agora - parseInt(ultimaSincronizacao)) > 3600000) {
    console.log('Forçando sincronização inicial do estoque...');
    setTimeout(sincronizarMovimentacoesIniciais, 2000);
  }
  
  // Variáveis para gerenciar movimentações
  let movimentacaoSendoGerenciada = null;
  
  // Funções para gerenciar movimentações individuais
  window.abrirMovimentacoesProduto = function(nomeProduto) {
    if (document.body.classList.contains('sync-disabled')) {
      if (typeof mostrarNotificacaoSync === 'function') {
        mostrarNotificacaoSync('Aguarde a sincronização terminar', 'warning');
      }
      return;
    }
    
    const modal = document.getElementById("movimentacoes-modal");
    const produtoNome = document.getElementById("movimentacoes-produto-nome");
    const lista = document.getElementById("movimentacoes-lista");
    
    produtoNome.innerHTML = `<strong>Movimentações de: ${nomeProduto}</strong>`;
    
    // Carregar e filtrar movimentações do produto
    carregarMovimentacoes();
    const movimentacoesProduto = movimentacoesEstoque
      .filter(m => m.produto === nomeProduto)
      .sort((a, b) => {
        // Converter datas DD/MM/AAAA para objetos Date para comparação
        const parseDate = (dateStr) => {
          if (!dateStr) return new Date(0);
          const [dia, mes, ano] = dateStr.split('/');
          return new Date(ano, mes - 1, dia);
        };
        
        const dataA = parseDate(a.data);
        const dataB = parseDate(b.data);
        
        // Ordenação decrescente por data (mais recente primeiro)
        const comparacaoData = dataB - dataA;
        
        // Se as datas são iguais, ordenar por ID decrescente
        if (comparacaoData === 0) {
          return (b.id || '').localeCompare(a.id || '', undefined, { numeric: true, sensitivity: 'base' });
        }
        
        return comparacaoData;
      });
    
    lista.innerHTML = "";
    if (movimentacoesProduto.length === 0) {
      lista.innerHTML = '<p style="text-align: center; color: #cbd5e0;">Nenhuma movimentação encontrada</p>';
    } else {
      movimentacoesProduto.forEach((mov, index) => {
        const item = document.createElement("div");
        item.classList.add("movimentacao-item");
        
        const tipoClass = mov.tipoMovimento === 'Entrada' ? 'entrada' : 'saida';
        const valorTotal = mov.valorTotal || (mov.valorUnitario * mov.quantidade) || 0;
        
        item.innerHTML = `
          <div class="movimentacao-info">
            <div class="movimentacao-tipo ${tipoClass}">
              ${mov.tipoMovimento} - ${mov.quantidade} unidades
            </div>
            <div class="movimentacao-detalhes">
              ${mov.data} | R$ ${valorTotal.toFixed(2)} | ${mov.observacoes || 'Sem observações'}
            </div>
          </div>
          <div class="movimentacao-acoes">
            <button class="btn-gerenciar-movimentacao" onclick="abrirGerenciarMovimentacao('${mov.id}')">
              <i class="fas fa-cog"></i>
            </button>
          </div>
        `;
        lista.appendChild(item);
      });
    }
    
    modal.classList.remove('modal-hidden');
    
    // Forçar scroll para o topo
    setTimeout(() => {
      modal.scrollTop = 0;
    }, 10);
  };
  
  window.fecharMovimentacoesModal = function() {
    document.getElementById("movimentacoes-modal").classList.add('modal-hidden');
  };
  
  window.abrirGerenciarMovimentacao = function(movimentacaoId) {
    carregarMovimentacoes();
    const movimentacao = movimentacoesEstoque.find(m => m.id === movimentacaoId);
    if (!movimentacao) return;
    
    movimentacaoSendoGerenciada = movimentacaoId;
    
    const modal = document.getElementById("gerenciar-movimentacao-modal");
    const info = document.getElementById("gerenciar-movimentacao-info");
    
    const valorTotal = movimentacao.valorTotal || (movimentacao.valorUnitario * movimentacao.quantidade) || 0;
    
    info.innerHTML = `
      <strong>${movimentacao.produto}</strong><br>
      ${movimentacao.tipoMovimento} - ${movimentacao.quantidade} unidades<br>
      ${movimentacao.data} | R$ ${valorTotal.toFixed(2)}
    `;
    
    document.getElementById("movimentacoes-modal").classList.add('modal-hidden');
    modal.classList.remove('modal-hidden');
  };
  
  window.fecharGerenciarMovimentacaoModal = function() {
    document.getElementById("gerenciar-movimentacao-modal").classList.add('modal-hidden');
    movimentacaoSendoGerenciada = null;
  };
  
  window.abrirEdicaoMovimentacao = function() {
    if (movimentacaoSendoGerenciada === null) return;
    
    carregarMovimentacoes();
    const movimentacao = movimentacoesEstoque.find(m => m.id === movimentacaoSendoGerenciada);
    if (!movimentacao) return;
    
    const modal = document.getElementById("editar-movimentacao-modal");
    const produtoInput = document.getElementById("editar-movimentacao-produto");
    const quantidadeInput = document.getElementById("editar-movimentacao-quantidade");
    const valorUnitarioInput = document.getElementById("editar-movimentacao-valor-unitario");
    const dataInput = document.getElementById("editar-movimentacao-data");
    const observacoesInput = document.getElementById("editar-movimentacao-observacoes");
    
    produtoInput.value = movimentacao.produto;
    quantidadeInput.value = movimentacao.quantidade;
    valorUnitarioInput.value = movimentacao.valorUnitario || 0;
    
    // Converter data para formato YYYY-MM-DD
    if (movimentacao.data && movimentacao.data.includes('/')) {
      const [dia, mes, ano] = movimentacao.data.split('/');
      dataInput.value = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    } else {
      dataInput.value = movimentacao.data;
    }
    
    observacoesInput.value = movimentacao.observacoes || '';
    
    document.getElementById("gerenciar-movimentacao-modal").classList.add('modal-hidden');
    modal.classList.remove('modal-hidden');
    produtoInput.focus();
  };
  
  window.fecharEdicaoMovimentacao = function() {
    document.getElementById("editar-movimentacao-modal").classList.add('modal-hidden');
    movimentacaoSendoGerenciada = null;
  };
  
  window.confirmarExclusaoMovimentacao = function() {
    if (movimentacaoSendoGerenciada !== null) {
      const movimentacaoId = movimentacaoSendoGerenciada;
      document.getElementById("gerenciar-movimentacao-modal").classList.add('modal-hidden');
      document.getElementById("movimentacoes-modal").classList.add('modal-hidden');
      removerMovimentacao(movimentacaoId);
      movimentacaoSendoGerenciada = null;
    }
  };
  
  // Formulário de edição de movimentação
  const editarMovimentacaoForm = document.getElementById("editar-movimentacao-form");
  if (editarMovimentacaoForm) {
    editarMovimentacaoForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      
      if (movimentacaoSendoGerenciada === null) return;
      
      const produtoInput = document.getElementById("editar-movimentacao-produto");
      const quantidadeInput = document.getElementById("editar-movimentacao-quantidade");
      const valorUnitarioInput = document.getElementById("editar-movimentacao-valor-unitario");
      const dataInput = document.getElementById("editar-movimentacao-data");
      const observacoesInput = document.getElementById("editar-movimentacao-observacoes");
      
      const produto = produtoInput.value.trim();
      const movimentacaoOriginal = movimentacoesEstoque.find(m => m.id === movimentacaoSendoGerenciada);
      const tipoMovimento = movimentacaoOriginal.tipoMovimento;
      const quantidade = parseInt(quantidadeInput.value);
      const valorUnitario = parseFloat(valorUnitarioInput.value) || 0;
      const data = dataInput.value;
      const observacoes = observacoesInput.value.trim();
      
      if (!produto || !quantidade || quantidade <= 0 || !data) {
        if (typeof mostrarNotificacaoSync === 'function') {
          mostrarNotificacaoSync('Preencha todos os campos obrigatórios!', 'error');
        }
        return;
      }
      
      document.body.classList.add('sync-disabled');
      
      try {
        // Converter data de YYYY-MM-DD para DD/MM/YYYY
        const [ano, mes, dia] = data.split('-');
        const dataFormatada = `${dia}/${mes}/${ano}`;
        
        // Carregar e atualizar movimentação localmente
        carregarMovimentacoes();
        const index = movimentacoesEstoque.findIndex(m => m.id === movimentacaoSendoGerenciada);
        if (index >= 0) {
          const movimentacaoAtualizada = {
            ...movimentacoesEstoque[index],
            produto,
            tipoMovimento,
            quantidade,
            valorUnitario,
            valorTotal: valorUnitario * quantidade,
            data: dataFormatada,
            observacoes
          };
          
          movimentacoesEstoque[index] = movimentacaoAtualizada;
          salvarMovimentacoes();
          
          // Editar no Google Sheets se disponível
          const estoqueAtivo = localStorage.getItem('estoqueGoogleSheetsAtivo') === 'true';
          if (estoqueAtivo && typeof editarMovimentacaoEstoqueSheets === 'function') {
            await editarMovimentacaoEstoqueSheets(movimentacaoAtualizada);
          }
          
          // Atualizar lançamento financeiro correspondente se for uma venda
          if (movimentacaoAtualizada.tipoMovimento === 'Venda' && typeof lancamentos !== 'undefined') {
            const indexLancamento = lancamentos.findIndex(l => l.id === movimentacaoSendoGerenciada);
            if (indexLancamento >= 0) {
              lancamentos[indexLancamento] = {
                ...lancamentos[indexLancamento],
                descricao: produto,
                quantidade: quantidade,
                valor: valorUnitario * quantidade,
                data: dataFormatada
              };
              if (typeof salvarLancamentos === 'function') {
                salvarLancamentos();
              }
            }
          }
          
          // Recalcular estoque
          recalcularEstoque();
          renderizarProdutos();
          atualizarListaProdutos();
          
          // Atualizar módulo financeiro
          atualizarModuloFinanceiro();
          
          if (typeof mostrarNotificacaoSync === 'function') {
            mostrarNotificacaoSync('Movimentação atualizada!', 'success');
          }
          
          if (typeof renderizarDashboardResumo === 'function') {
            renderizarDashboardResumo();
          }
          
          fecharEdicaoMovimentacao();
        }
      } catch (error) {
        console.error('Erro na edição:', error);
        if (typeof mostrarNotificacaoSync === 'function') {
          mostrarNotificacaoSync('Erro na edição', 'error');
        }
      } finally {
        setTimeout(() => {
          document.body.classList.remove('sync-disabled');
        }, 1000);
      }
    });
  }
  
  // Sincronizar movimentações iniciais
  setTimeout(sincronizarMovimentacoesIniciais, 1000);
  
  // Forçar recálculo inicial após carregamento completo
  setTimeout(() => {
    forcarRecalculoLayout();
    atualizarListaProdutos(); // Garantir que a lista seja atualizada na inicialização
  }, 2000);
});