// Utilitários para Sincronização Transacional
// Garante consistência entre módulos estoque e financeiro

class TransactionManager {
  constructor() {
    this.activeTransactions = new Map();
    this.lockTimeout = 30000; // 30 segundos
  }

  // Gerar ID único para transação
  generateTransactionId() {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Iniciar transação com lock
  async startTransaction(operationType, data) {
    const transactionId = this.generateTransactionId();
    const lockKey = `${operationType}_${data.productId || data.id}`;
    
    // Verificar se já existe uma transação ativa para este item
    if (this.activeTransactions.has(lockKey)) {
      throw new Error(`Operação ${operationType} já em andamento para este item`);
    }
    
    // Criar lock
    const transaction = {
      id: transactionId,
      type: operationType,
      data: data,
      startTime: Date.now(),
      steps: []
    };
    
    this.activeTransactions.set(lockKey, transaction);
    
    // Auto-cleanup após timeout
    setTimeout(() => {
      if (this.activeTransactions.has(lockKey)) {
        console.warn(`Transação ${transactionId} expirou, removendo lock`);
        this.activeTransactions.delete(lockKey);
      }
    }, this.lockTimeout);
    
    return { transactionId, lockKey };
  }

  // Registrar passo da transação
  logStep(lockKey, step, success, error = null) {
    const transaction = this.activeTransactions.get(lockKey);
    if (transaction) {
      transaction.steps.push({
        step,
        success,
        error,
        timestamp: Date.now()
      });
    }
  }

  // Finalizar transação
  commitTransaction(lockKey) {
    const transaction = this.activeTransactions.get(lockKey);
    if (transaction) {
      console.log(`Transação ${transaction.id} finalizada com sucesso`);
      this.activeTransactions.delete(lockKey);
      return true;
    }
    return false;
  }

  // Reverter transação em caso de erro
  async rollbackTransaction(lockKey, rollbackSteps) {
    const transaction = this.activeTransactions.get(lockKey);
    if (!transaction) return false;

    console.log(`Iniciando rollback da transação ${transaction.id}`);
    
    try {
      // Executar passos de rollback em ordem reversa
      for (const rollbackStep of rollbackSteps.reverse()) {
        try {
          await rollbackStep();
          console.log(`Rollback step executado com sucesso`);
        } catch (error) {
          console.error(`Erro no rollback step:`, error);
        }
      }
    } finally {
      this.activeTransactions.delete(lockKey);
    }
    
    return true;
  }
}

// Instância global do gerenciador de transações
const transactionManager = new TransactionManager();

// Função para mostrar popup de classificação de quebra
function mostrarPopupClassificacaoQuebra(produto, quantidade) {
  return new Promise((resolve) => {
    // Obter subcategorias de quebra do módulo de categorias
    const categorias = window.categorias || JSON.parse(localStorage.getItem('categorias') || '{}');
    const subcategoriasQuebra = (categorias.despesa && categorias.despesa.Quebra) || ['Vencimento', 'Avaria', 'Perda', 'Roubo', 'Deterioração', 'Outros'];
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    // Gerar options dinamicamente
    const optionsHtml = subcategoriasQuebra.map(sub => 
      `<option value="${sub}">${sub}</option>`
    ).join('');
    
    modal.innerHTML = `
      <div class="modal-content classificacao-quebra-modal">
        <div class="modal-header">
          <h3>Classificação de Quebra</h3>
        </div>
        <div class="modal-body">
          <p><strong>Produto:</strong> ${produto}</p>
          <p><strong>Quantidade:</strong> ${quantidade} unidades</p>
          <p>Este produto tem valor zero. Selecione a subcategoria de quebra:</p>
          <div class="form-group">
            <label for="subcategoria-quebra">Subcategoria:</label>
            <select id="subcategoria-quebra" class="form-control">
              <option value="">Selecione uma subcategoria...</option>
              ${optionsHtml}
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="cancelar-quebra">Cancelar</button>
          <button type="button" class="btn btn-primary" id="confirmar-quebra">Confirmar</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const selectSubcategoria = modal.querySelector('#subcategoria-quebra');
    const btnCancelar = modal.querySelector('#cancelar-quebra');
    const btnConfirmar = modal.querySelector('#confirmar-quebra');
    
    btnCancelar.addEventListener('click', () => {
      document.body.removeChild(modal);
      resolve(null);
    });
    
    btnConfirmar.addEventListener('click', () => {
      const subcategoria = selectSubcategoria.value;
      if (!subcategoria) {
        if (typeof mostrarNotificacaoSync === 'function') {
          mostrarNotificacaoSync('Selecione uma subcategoria!', 'error');
        }
        return;
      }
      document.body.removeChild(modal);
      resolve(subcategoria);
    });
    
    // Focar no select
    setTimeout(() => selectSubcategoria.focus(), 100);
  });
}

// Função para registrar saída com transação atômica
async function registrarSaidaTransacional(produtoIndex, quantidade, valor) {
  if (!produtos[produtoIndex]) {
    throw new Error('Produto não encontrado');
  }

  const produto = produtos[produtoIndex];
  
  // Verificar se é produto com valor zero (quebra)
  let subcategoriaQuebra = null;
  if (valor === 0) {
    subcategoriaQuebra = await mostrarPopupClassificacaoQuebra(produto.nome, quantidade);
    if (!subcategoriaQuebra) {
      throw new Error('Operação cancelada pelo usuário');
    }
  }
  
  // Bloquear botões após confirmação da subcategoria
  document.body.classList.add('sync-disabled');
  
  const { transactionId, lockKey } = await transactionManager.startTransaction('saida_produto', {
    productId: produto.nome,
    quantidade,
    valor
  });

  const rollbackSteps = [];
  let idCompartilhado = null;

  try {
    // Gerar ID compartilhado
    idCompartilhado = window.gerarIdentificadorUnico();
    
    // PASSO 1: Registrar no módulo financeiro PRIMEIRO
    let novoLancamento;
    
    if (valor === 0) {
      // Produto com valor zero = Despesa categoria Quebra
      novoLancamento = {
        id: idCompartilhado,
        tipo: "despesa",
        categoria: "Quebra",
        subcategoria: subcategoriaQuebra,
        descricao: produto.nome,
        quantidade: quantidade,
        valor: 0,
        data: new Date().toLocaleDateString('pt-BR')
      };
    } else {
      // Produto com valor > 0 = Receita categoria Vendas
      novoLancamento = {
        id: idCompartilhado,
        tipo: "receita",
        categoria: "Vendas",
        subcategoria: "Produtos",
        descricao: produto.nome,
        quantidade: quantidade,
        valor: valor,
        data: new Date().toLocaleDateString('pt-BR')
      };
    }

    // Adicionar ao array de lançamentos
    lancamentos.push(novoLancamento);
    salvarLancamentos();
    transactionManager.logStep(lockKey, 'financeiro_local', true);

    // Rollback: remover lançamento local
    rollbackSteps.push(() => {
      const index = lancamentos.findIndex(l => l.id === idCompartilhado);
      if (index >= 0) {
        lancamentos.splice(index, 1);
        salvarLancamentos();
      }
    });

    // Sincronizar com Google Sheets (financeiro)
    if (typeof adicionarLancamentoSheets === 'function') {
      await adicionarLancamentoSheets(novoLancamento);
      transactionManager.logStep(lockKey, 'financeiro_sheets', true);

      // Rollback: remover do Google Sheets
      rollbackSteps.push(async () => {
        if (typeof excluirLancamentoSheets === 'function') {
          try {
            await excluirLancamentoSheets(idCompartilhado);
          } catch (error) {
            console.error('Erro no rollback financeiro sheets:', error);
          }
        }
      });
    }

    // PASSO 2: Registrar no módulo estoque DEPOIS
    const tipoMovimento = valor === 0 ? 'Quebra' : 'Venda';
    const observacoes = valor === 0 ? `Quebra de produto - ${subcategoriaQuebra}` : 'Venda de produto';
    
    const movimentacao = {
      id: idCompartilhado,
      produto: produto.nome,
      categoria: 'Saída',
      quantidade: quantidade,
      valorUnitario: quantidade > 0 ? valor / quantidade : 0,
      valorTotal: valor,
      data: new Date().toLocaleDateString('pt-BR'),
      tipoMovimento: tipoMovimento,
      observacoes: observacoes
    };

    // Carregar e adicionar movimentação
    const movimentacoesEstoque = JSON.parse(localStorage.getItem('movimentacoesEstoque') || '[]');
    movimentacoesEstoque.push(movimentacao);
    localStorage.setItem('movimentacoesEstoque', JSON.stringify(movimentacoesEstoque));
    transactionManager.logStep(lockKey, 'estoque_local', true);

    // Rollback: remover movimentação local
    rollbackSteps.push(() => {
      const movimentacoes = JSON.parse(localStorage.getItem('movimentacoesEstoque') || '[]');
      const index = movimentacoes.findIndex(m => m.id === idCompartilhado);
      if (index >= 0) {
        movimentacoes.splice(index, 1);
        localStorage.setItem('movimentacoesEstoque', JSON.stringify(movimentacoes));
      }
    });

    // Sincronizar com Google Sheets (estoque)
    const estoqueAtivo = localStorage.getItem('estoqueGoogleSheetsAtivo') === 'true';
    if (estoqueAtivo && typeof adicionarMovimentacaoEstoque === 'function') {
      await adicionarMovimentacaoEstoque(movimentacao);
      transactionManager.logStep(lockKey, 'estoque_sheets', true);

      // Rollback: remover do Google Sheets
      rollbackSteps.push(async () => {
        if (typeof excluirMovimentacaoEstoque === 'function') {
          try {
            await excluirMovimentacaoEstoque(idCompartilhado);
          } catch (error) {
            console.error('Erro no rollback estoque sheets:', error);
          }
        }
      });
    }

    // Finalizar transação
    transactionManager.commitTransaction(lockKey);
    
    // Atualizar estoque após transação
    if (typeof recalcularEstoque === 'function') {
      recalcularEstoque();
    } else if (typeof recalcularEstoqueGlobal === 'function') {
      recalcularEstoqueGlobal();
    }
    
    if (typeof renderizarProdutos === 'function') {
      renderizarProdutos();
    }
    
    return {
      success: true,
      transactionId,
      lancamentoId: idCompartilhado,
      movimentacaoId: idCompartilhado
    };

  } catch (error) {
    console.error(`Erro na transação ${transactionId}:`, error);
    transactionManager.logStep(lockKey, 'error', false, error.message);
    
    // Executar rollback
    await transactionManager.rollbackTransaction(lockKey, rollbackSteps);
    
    throw error;
  }
}

// Função para remover lançamento com transação atômica
async function removerLancamentoTransacional(lancamentoIndex) {
  const lancamento = lancamentos[lancamentoIndex];
  if (!lancamento) {
    throw new Error('Lançamento não encontrado');
  }

  const { transactionId, lockKey } = await transactionManager.startTransaction('remover_lancamento', {
    id: lancamento.id
  });

  const rollbackSteps = [];

  try {
    const eVenda = lancamento.categoria === 'Vendas' && lancamento.subcategoria === 'Produtos';
    
    // PASSO 1: Remover movimentação de estoque se for venda
    if (eVenda && lancamento.id) {
      const movimentacoesEstoque = JSON.parse(localStorage.getItem('movimentacoesEstoque') || '[]');
      const indexMovimentacao = movimentacoesEstoque.findIndex(m => m.id === lancamento.id);
      
      if (indexMovimentacao >= 0) {
        const movimentacaoBackup = { ...movimentacoesEstoque[indexMovimentacao] };
        
        // Remover do Google Sheets (estoque)
        const estoqueAtivo = localStorage.getItem('estoqueGoogleSheetsAtivo') === 'true';
        if (estoqueAtivo && typeof excluirMovimentacaoEstoque === 'function') {
          await excluirMovimentacaoEstoque(lancamento.id);
          transactionManager.logStep(lockKey, 'estoque_sheets_remove', true);

          // Rollback: restaurar no Google Sheets
          rollbackSteps.push(async () => {
            if (typeof adicionarMovimentacaoEstoque === 'function') {
              try {
                await adicionarMovimentacaoEstoque(movimentacaoBackup);
              } catch (error) {
                console.error('Erro no rollback estoque sheets:', error);
              }
            }
          });
        }

        // Remover localmente
        movimentacoesEstoque.splice(indexMovimentacao, 1);
        localStorage.setItem('movimentacoesEstoque', JSON.stringify(movimentacoesEstoque));
        transactionManager.logStep(lockKey, 'estoque_local_remove', true);
        
        // Rollback: restaurar movimentação local
        rollbackSteps.push(() => {
          const movimentacoes = JSON.parse(localStorage.getItem('movimentacoesEstoque') || '[]');
          movimentacoes.push(movimentacaoBackup);
          localStorage.setItem('movimentacoesEstoque', JSON.stringify(movimentacoes));
        });
      }
    }
    
    // PASSO 2: Remover lançamento financeiro
    const indexLancamento = lancamentos.findIndex(l => l.id === lancamento.id);
    if (indexLancamento >= 0) {
      const lancamentoBackup = { ...lancamentos[indexLancamento] };
      
      // Remover do Google Sheets (financeiro)
      if (typeof excluirLancamentoSheets === 'function') {
        await excluirLancamentoSheets(lancamento.id);
        transactionManager.logStep(lockKey, 'financeiro_sheets_remove', true);

        // Rollback: restaurar no Google Sheets
        rollbackSteps.push(async () => {
          if (typeof adicionarLancamentoSheets === 'function') {
            try {
              await adicionarLancamentoSheets(lancamentoBackup);
            } catch (error) {
              console.error('Erro no rollback financeiro sheets:', error);
            }
          }
        });
      }
      
      // Remover localmente
      lancamentos.splice(indexLancamento, 1);
      salvarLancamentos();
      transactionManager.logStep(lockKey, 'financeiro_local_remove', true);
      
      // Rollback: restaurar lançamento local
      rollbackSteps.push(() => {
        lancamentos.push(lancamentoBackup);
        salvarLancamentos();
      });
    }
    
    // Finalizar transação
    transactionManager.commitTransaction(lockKey);
    
    return {
      success: true,
      transactionId,
      removedLancamentoId: lancamento.id,
      removedMovimentacaoId: lancamento.id
    };

  } catch (error) {
    console.error(`Erro na transação ${transactionId}:`, error);
    transactionManager.logStep(lockKey, 'error', false, error.message);
    
    // Executar rollback
    await transactionManager.rollbackTransaction(lockKey, rollbackSteps);
    
    throw error;
  }
}

// Expor funções globalmente
window.registrarSaidaTransacional = registrarSaidaTransacional;
window.removerLancamentoTransacional = removerLancamentoTransacional;
window.transactionManager = transactionManager;