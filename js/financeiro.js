// Financeiro - Receitas e Despesas
document.addEventListener("DOMContentLoaded", function () {
  

  
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
    
    if (window.filtroMes || window.filtroAno) {
      filtrados = filtrados.filter(l => {
        if (!l.data) return false;
        const d = l.data;
        
        // Se ambos são "todos", mostrar todos os dados
        if (window.filtroMes === "todos" && window.filtroAno === "todos") {
          return true;
        }
        
        // Se apenas o ano é "todos", filtrar apenas por mês
        if (window.filtroAno === "todos" && window.filtroMes !== "todos") {
          return d.getMonth() + 1 === Number(window.filtroMes);
        }
        
        // Se apenas o mês é "todos", filtrar apenas por ano
        if (window.filtroMes === "todos" && window.filtroAno !== "todos") {
          return d.getFullYear() === Number(window.filtroAno);
        }
        
        // Filtro normal por mês e ano específicos
        return d.getMonth() + 1 === Number(window.filtroMes) && d.getFullYear() === Number(window.filtroAno);
      });
    }
    
    filtrados = filtrados.sort((a, b) => {
      if (!a.data && !b.data) return 0;
      if (!a.data) return 1;
      if (!b.data) return -1;
      
      // Primeiro critério: ordenar por data (mais recente primeiro)
      const diffData = b.data - a.data;
      if (diffData !== 0) return diffData;
      
      // Segundo critério: se as datas são iguais, ordenar por ID (mais recente primeiro)
      const idA = String(a.id || '');
      const idB = String(b.id || '');
      return idB.localeCompare(idA);
    });
    
    filtrados.forEach((l) => {
      const item = document.createElement("li");
      let tipoIcon = l.tipo === "receita" ? (l.categoria === "Vendas" ? '<i class="fas fa-shopping-cart"></i>' : '<i class="fas fa-dollar-sign"></i>') : '<i class="fas fa-credit-card"></i>';
      item.classList.add('lancamento-item');
      if (l.tipo === "receita") {
        if (l.categoria === "Vendas") {
          item.classList.add('receita-vendas');
        } else {
          item.classList.add('receita');
        }
      } else {
        item.classList.add('despesa');
      }
      item.innerHTML = `
        <span class="lancamento-info">
          <span class="lancamento-icon">${tipoIcon}</span>
          <span>
            <strong>${l.categoria || "-"}</strong> / <em>${l.subcategoria || "-"}</em><br>
            <span class="lancamento-descricao">${l.descricao}</span>
            ${l.quantidade && l.quantidade > 1 ? `<br><small>Qtd: ${l.quantidade} - R$ ${(l.valor / l.quantidade).toFixed(2).replace('.', ',')} cada</small>` : ''}
          </span>
        </span>
        <span class="lancamento-valor-container">
          <span class="lancamento-valor" title="Valor unitário: R$ ${(l.valor / (l.quantidade || 1)).toFixed(2).replace('.', ',')}">R$ ${l.valor.toFixed(2).replace('.', ',')}</span><br>
           <span class="lancamento-data">${l.data ? (typeof l.data === 'string' && l.data.includes('/') ? l.data : l.data.toLocaleDateString('pt-BR')) : ""}</span>
        </span>
        <button onclick="abrirGerenciarLancamento(${l._originalIndex})" class="lancamento-btn-gerenciar"><i class="fas fa-cog"></i></button>
      `;
      lista.appendChild(item);
    });
    renderizarResumoFinanceiro();
  }

  function renderizarResumoFinanceiro() {
    const div = document.getElementById("resumo-financeiro");
    if (!div) return;
    
    let filtrados = lancamentos;
    if (window.filtroMes || window.filtroAno) {
      filtrados = lancamentos.filter(l => {
        if (!l.data) return false;
        let d;
        if (typeof l.data === 'string' && l.data.includes('/')) {
          const [dia, mes, ano] = l.data.split('/');
          d = new Date(ano, mes - 1, dia);
        } else {
          d = new Date(l.data);
        }
        
        // Se ambos são "todos", mostrar todos os dados
        if (window.filtroMes === "todos" && window.filtroAno === "todos") {
          return true;
        }
        
        // Se apenas o ano é "todos", filtrar apenas por mês
        if (window.filtroAno === "todos" && window.filtroMes !== "todos") {
          return d.getMonth() + 1 === Number(window.filtroMes);
        }
        
        // Se apenas o mês é "todos", filtrar apenas por ano
        if (window.filtroMes === "todos" && window.filtroAno !== "todos") {
          return d.getFullYear() === Number(window.filtroAno);
        }
        
        // Filtro normal por mês e ano específicos
        return d.getMonth() + 1 === Number(window.filtroMes) && d.getFullYear() === Number(window.filtroAno);
      });
    }
    
    const totalReceitas = filtrados.filter(l => l.tipo === "receita").reduce((acc, l) => acc + l.valor, 0);
    const totalDespesas = filtrados.filter(l => l.tipo === "despesa").reduce((acc, l) => acc + l.valor, 0);
    const saldo = totalReceitas - totalDespesas;
    
    const receitasLabel = "Receitas:";
    const despesasLabel = "Despesas:";
    const saldoLabel = "Saldo:";
    
    div.innerHTML = `
      <strong>${receitasLabel}</strong> R$ ${totalReceitas.toFixed(2).replace('.', ',')}<br>
      <strong>${despesasLabel}</strong> R$ ${totalDespesas.toFixed(2).replace('.', ',')}<br>
      <strong>${saldoLabel}</strong> R$ ${saldo.toFixed(2).replace('.', ',')}
    `;
  }

  async function removerLancamento(index) {
    const lancamento = lancamentos[index];
    
    if (!lancamento) {
      console.error('Lançamento não encontrado no índice:', index);
      mostrarNotificacaoSync('Erro: Lançamento não encontrado', 'error');
      return;
    }
    
    console.log('=== INICIANDO EXCLUSÃO DE LANÇAMENTO ===');
    console.log('ID do lançamento:', lancamento.id);
    console.log('Categoria:', lancamento.categoria, 'Subcategoria:', lancamento.subcategoria);
    
    // Desabilitar todos os botões CRUD imediatamente
    document.body.classList.add('sync-disabled');
    
    // Feedback visual IMEDIATO - encontrar e marcar o item correto
    const lista = document.getElementById("financeiro-lista");
    const items = lista ? lista.querySelectorAll('.lancamento-item') : [];
    let itemParaRemover = null;
    
    items.forEach((item, i) => {
      const btnGerenciar = item.querySelector('.lancamento-btn-gerenciar');
      if (btnGerenciar && btnGerenciar.getAttribute('onclick') === `abrirGerenciarLancamento(${index})`) {
        itemParaRemover = item;
      }
    });
    
    // Aplicar efeito visual imediato
    if (itemParaRemover) {
      itemParaRemover.classList.add('excluindo', 'processando');
      const lancamentoInfo = itemParaRemover.querySelector('.lancamento-info');
      if (lancamentoInfo) {
        lancamentoInfo.classList.add('processando');
      }
    }
    
    // Verificar se é uma venda de produto para atualizar estoque
    const eVenda = lancamento.categoria === 'Vendas' && lancamento.subcategoria === 'Produtos';
    if (eVenda && lancamento.id) {
      console.log('=== REMOVENDO MOVIMENTAÇÃO DE ESTOQUE RELACIONADA ===');
      console.log('Produto:', lancamento.descricao);
      
      // Carregar movimentações de estoque
      const movimentacoesEstoque = JSON.parse(localStorage.getItem('movimentacoesEstoque') || '[]');
      
      // Encontrar e remover a movimentação correspondente
      const indexMovimentacao = movimentacoesEstoque.findIndex(m => m.id === lancamento.id);
      if (indexMovimentacao >= 0) {
        console.log('Movimentação encontrada no índice:', indexMovimentacao);
        
        // Remover movimentação do Google Sheets se disponível
        const estoqueAtivo = localStorage.getItem('estoqueGoogleSheetsAtivo') === 'true';
        if (estoqueAtivo && typeof excluirMovimentacaoEstoque === 'function') {
          try {
            await excluirMovimentacaoEstoque(lancamento.id);
            console.log('Movimentação removida do Google Sheets');
          } catch (error) {
            console.error('Erro ao remover movimentação do Google Sheets:', error);
          }
        }
        
        // Remover movimentação localmente
        movimentacoesEstoque.splice(indexMovimentacao, 1);
        localStorage.setItem('movimentacoesEstoque', JSON.stringify(movimentacoesEstoque));
        
        // Recalcular estoque baseado nas movimentações restantes
        if (typeof recalcularEstoque === 'function') {
          recalcularEstoque();
        } else if (typeof recalcularEstoqueGlobal === 'function') {
          recalcularEstoqueGlobal();
        }
        
        // Atualizar interface do estoque se estiver visível
        if (typeof renderizarProdutos === 'function') {
          renderizarProdutos();
        }
        
        console.log('=== ESTOQUE ATUALIZADO APÓS EXCLUSÃO ===');
      } else {
        console.log('Movimentação não encontrada para o ID:', lancamento.id);
      }
    }
    
    // Remover lançamento localmente IMEDIATAMENTE
    lancamentos.splice(index, 1);
    salvarLancamentos();
    
    // Animação de saída e re-renderização imediata
    if (itemParaRemover) {
      itemParaRemover.classList.add('saindo');
      setTimeout(() => {
        renderizarLancamentos();
        renderizarResumoFinanceiro();
      }, 300);
    } else {
      renderizarLancamentos();
      renderizarResumoFinanceiro();
    }
    
    // Atualizar outras interfaces
    if (typeof renderizarDashboardResumo === 'function') {
      renderizarDashboardResumo();
    }
    if (typeof atualizarFiltroMesAno === 'function') {
      atualizarFiltroMesAno();
    }
    
    // Sincronização em background
    const webAppUrl = localStorage.getItem('googleSheetsWebAppUrl');
    if (webAppUrl && lancamento.id && typeof excluirLancamentoSheets === 'function') {
      try {
        await excluirLancamentoSheets(lancamento.id);
        mostrarNotificacaoSync('Item excluído e sincronizado!', 'success');
      } catch (error) {
        console.error('Erro na sincronização:', error);
        mostrarNotificacaoSync('Item excluído (erro na sincronização)', 'warning');
      }
    } else {
      mostrarNotificacaoSync('Item excluído!', 'success');
    }
    
    // Reabilitar botões CRUD e remover feedback visual
    document.body.classList.remove('sync-disabled');
    const todosItems = document.querySelectorAll('.processando');
    todosItems.forEach(item => item.classList.remove('processando'));
    
    console.log('=== EXCLUSÃO DE LANÇAMENTO CONCLUÍDA ===');
  }

  // Função para mostrar aviso de importação
  function mostrarAvisoImportacao() {
    // Criar ou atualizar elemento de aviso
    let avisoElement = document.getElementById('aviso-importacao');
    
    if (!avisoElement) {
      avisoElement = document.createElement('div');
      avisoElement.id = 'aviso-importacao';
      avisoElement.className = 'aviso-importacao';
      
      // Inserir após o resumo financeiro
      const resumoFinanceiro = document.getElementById('resumo-financeiro');
      if (resumoFinanceiro) {
        resumoFinanceiro.parentNode.insertBefore(avisoElement, resumoFinanceiro.nextSibling);
      }
    }
    
    avisoElement.innerHTML = `
      <div class="aviso-content">
        <span class="aviso-icon"><i class="fas fa-exclamation-triangle" style="color: #ecc94b;"></i></span>
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

  // Categorias e subcategorias com nova interface
  function atualizarCategorias() {
    const tipoInputs = document.querySelectorAll('input[name="tipo-lancamento"]');
    const categoriaInput = document.getElementById("categoria-lancamento");
    const subcategoriaInput = document.getElementById("subcategoria-lancamento");
    
    if (!tipoInputs.length || !categoriaInput || !subcategoriaInput) {
      console.warn('Elementos do formulário não encontrados para atualizar categorias');
      return;
    }
    
    // Obter tipo selecionado
    const tipoSelecionado = document.querySelector('input[name="tipo-lancamento"]:checked')?.value;
    if (!tipoSelecionado) {
      console.warn('Nenhum tipo de lançamento selecionado');
      // Limpar categorias se não há tipo selecionado
      categoriaInput.innerHTML = '<option value="">Selecione uma categoria...</option>';
      subcategoriaInput.innerHTML = '<option value="">Selecione uma subcategoria...</option>';
      return;
    }
    
    // Limpar e popular categorias
    categoriaInput.innerHTML = '<option value="">Selecione uma categoria...</option>';
    subcategoriaInput.innerHTML = '<option value="">Selecione uma subcategoria...</option>';
    
    // Verificar se as categorias estão definidas - tentar múltiplas fontes
    let categoriasObj = null;
    
    if (typeof window.categorias !== 'undefined') {
      categoriasObj = window.categorias;
    } else if (typeof categorias !== 'undefined') {
      categoriasObj = categorias;
    } else {
      // Tentar carregar do localStorage diretamente
      try {
        const categoriasLS = localStorage.getItem('categorias');
        if (categoriasLS) {
          categoriasObj = JSON.parse(categoriasLS);
        }
      } catch (e) {
        console.error('Erro ao carregar categorias do localStorage:', e);
      }
    }
    
    if (!categoriasObj) {
      console.error('Objeto categorias não está disponível em nenhuma fonte');
      // Usar categorias padrão como fallback
      categoriasObj = {
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
      console.log('Usando categorias padrão como fallback');
    }
    
    const cats = categoriasObj[tipoSelecionado] || {};
    Object.keys(cats).forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categoriaInput.appendChild(opt);
    });
    
    console.log(`Categorias carregadas para ${tipoSelecionado}:`, Object.keys(cats));
    
    // Adicionar classe de atualização para animação
    const categoriaGroup = document.querySelector('.form-group-categoria');
    if (categoriaGroup) {
      categoriaGroup.classList.add('updated');
      setTimeout(() => categoriaGroup.classList.remove('updated'), 300);
    }
    
    // Resetar subcategoria
    atualizarSubcategorias();
  }

  function atualizarSubcategorias() {
    const tipoSelecionado = document.querySelector('input[name="tipo-lancamento"]:checked')?.value;
    const categoriaInput = document.getElementById("categoria-lancamento");
    const subcategoriaInput = document.getElementById("subcategoria-lancamento");
    
    if (!tipoSelecionado || !categoriaInput || !subcategoriaInput) return;
    
    subcategoriaInput.innerHTML = '<option value="">Selecione uma subcategoria...</option>';
    
    const categoria = categoriaInput.value;
    if (!categoria) return;
    
    // Obter categorias de forma robusta
    let categoriasObj = null;
    
    if (typeof window.categorias !== 'undefined') {
      categoriasObj = window.categorias;
    } else if (typeof categorias !== 'undefined') {
      categoriasObj = categorias;
    } else {
      try {
        const categoriasLS = localStorage.getItem('categorias');
        if (categoriasLS) {
          categoriasObj = JSON.parse(categoriasLS);
        }
      } catch (e) {
        console.error('Erro ao carregar categorias do localStorage:', e);
      }
    }
    
    if (!categoriasObj) {
      console.error('Categorias não disponíveis para subcategorias');
      return;
    }
    
    const subs = (categoriasObj[tipoSelecionado] && categoriasObj[tipoSelecionado][categoria]) ? categoriasObj[tipoSelecionado][categoria] : [];
    subs.forEach(sub => {
      const opt = document.createElement("option");
      opt.value = sub;
      opt.textContent = sub;
      subcategoriaInput.appendChild(opt);
    });
    
    console.log(`Subcategorias carregadas para ${categoria}:`, subs);
    
    // Adicionar classe de atualização para animação
    const subcategoriaGroup = document.querySelector('.form-group-subcategoria');
    if (subcategoriaGroup) {
      subcategoriaGroup.classList.add('updated');
      setTimeout(() => subcategoriaGroup.classList.remove('updated'), 300);
    }
  }

  // Event listeners para nova interface
  const tipoInputs = document.querySelectorAll('input[name="tipo-lancamento"]');
  const categoriaLancamento = document.getElementById("categoria-lancamento");
  
  // Listener para mudança de tipo (receita/despesa)
  tipoInputs.forEach(input => {
    input.addEventListener("change", atualizarCategorias);
  });
  
  // Listener para mudança de categoria
  if (categoriaLancamento) {
    categoriaLancamento.addEventListener("change", atualizarSubcategorias);
  }

  // Formulário de receitas/despesas
  const financeiroForm = document.getElementById("financeiro-form-inner");
  if (financeiroForm) {
    financeiroForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      
      // Aguardar um momento para garantir que os valores estejam atualizados
      // especialmente quando usando navegação por atalhos
      await new Promise(resolve => setTimeout(resolve, 10));
      const tipoSelecionado = document.querySelector('input[name="tipo-lancamento"]:checked');
      const categoriaInput = document.getElementById("categoria-lancamento");
      const subcategoriaInput = document.getElementById("subcategoria-lancamento");
      const descInput = document.getElementById("descricao-lancamento");
      const quantidadeInput = document.getElementById("quantidade-lancamento");
      const valorInput = document.getElementById("valor-lancamento");
      const dataInput = document.getElementById("data-lancamento");
      const submitBtn = financeiroForm.querySelector('button[type="submit"]');
      
      const tipo = tipoSelecionado?.value;
      const categoria = categoriaInput.value.trim();
      const subcategoria = subcategoriaInput.value.trim();
      const descricao = descInput.value.trim();
      const quantidade = parseInt(quantidadeInput.value) || 1;
      const valor = parseFloat(valorInput.value);
      const data = dataInput.value;
      
      // Debug detalhado dos valores
      console.log('=== DEBUG VALIDAÇÃO FORMULÁRIO ===');
      console.log('Tipo:', tipo);
      console.log('Categoria raw:', categoriaInput.value);
      console.log('Categoria trimmed:', categoria);
      console.log('Subcategoria:', subcategoria);
      console.log('Selected index categoria:', categoriaInput.selectedIndex);
      console.log('Selected option text:', categoriaInput.options[categoriaInput.selectedIndex]?.text);
      
      // Validação mais rigorosa dos campos
      if (!tipo) {
        mostrarNotificacaoSync('Selecione o tipo de lançamento (Receita ou Despesa)!', 'error');
        return;
      }
      if (!categoria || categoria === '' || categoriaInput.selectedIndex <= 0) {
        console.warn('Categoria não selecionada adequadamente - falha silenciosa');
        return; // Falha silenciosa para evitar erro indevido nos atalhos
      }
      if (!subcategoria) {
        mostrarNotificacaoSync('Selecione uma subcategoria!', 'error');
        return;
      }
      if (!descricao) {
        mostrarNotificacaoSync('Preencha a descrição!', 'error');
        return;
      }
      if (!valor || valor <= 0 || isNaN(valor)) {
        mostrarNotificacaoSync('Preencha um valor válido maior que zero!', 'error');
        return;
      }
      if (!data) {
        mostrarNotificacaoSync('Selecione uma data!', 'error');
        return;
      }
      
      // Se chegou até aqui, todos os campos estão válidos
        // Desabilitar todos os botões CRUD imediatamente
        document.body.classList.add('sync-disabled');
        
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
        
        // Limpar campos imediatamente
        document.getElementById('tipo-receita').checked = true;
        atualizarCategorias(); // Atualizar categorias ANTES de limpar
        categoriaInput.value = "";
        subcategoriaInput.value = "";
        descInput.value = "";
        quantidadeInput.value = "1";
        valorInput.value = "";
        dataInput.value = "";
        
        // Adicionar localmente IMEDIATAMENTE
        lancamentos.push(novoLancamento);
        salvarLancamentos();
        
        // Renderizar imediatamente com animação
        renderizarLancamentos();
        renderizarResumoFinanceiro();
        
        // Mostrar notificação imediata
        const tipoTexto = tipo === 'receita' ? 'Receita' : 'Despesa';
        mostrarNotificacaoSync(`${tipoTexto} adicionada: ${descricao}`, 'success');
        
        // Atualizar outras interfaces
        if (typeof renderizarDashboardResumo === 'function') {
          renderizarDashboardResumo();
        }
        if (typeof atualizarFiltroMesAno === 'function') {
          atualizarFiltroMesAno();
        }
        
        // Sincronização em background
        if (typeof adicionarLancamentoSheets === 'function') {
          try {
            await adicionarLancamentoSheets(novoLancamento);
          } catch (error) {
            console.error('Erro na sincronização:', error);
            mostrarNotificacaoSync('Erro na sincronização (item salvo localmente)', 'warning');
          }
        }
        
        // Reabilitar botões CRUD e remover feedback visual
        document.body.classList.remove('sync-disabled');
        const todosItems = document.querySelectorAll('.processando');
        todosItems.forEach(item => item.classList.remove('processando'));
    });
  }

  // Função para controlar recolher/expandir do formulário
  function setupFinanceiroFormToggle() {
    const header = document.getElementById('financeiro-form-header');
    const content = document.getElementById('financeiro-form-content');
    const arrow = document.getElementById('financeiro-form-arrow');
    
    if (header && content && arrow) {
      // Restaurar estado salvo
      const savedState = loadFinanceiroFormState();
      content.style.display = savedState ? 'block' : 'none';
      arrow.classList.toggle('rotated', savedState);
      
      header.addEventListener('click', () => {
        const isVisible = content.style.display !== 'none';
        const newState = !isVisible;
        content.style.display = newState ? 'block' : 'none';
        arrow.classList.toggle('rotated', newState);
        
        // Salvar novo estado
        saveFinanceiroFormState(newState);
      });
    }
  }
  
  function loadFinanceiroFormState() {
    return localStorage.getItem('financeiroFormExpanded') !== 'false';
  }
  
  function saveFinanceiroFormState(expanded) {
    localStorage.setItem('financeiroFormExpanded', expanded.toString());
  }

  // Expor funções globalmente
  window.renderizarLancamentos = renderizarLancamentos;
  window.renderizarResumoFinanceiro = renderizarResumoFinanceiro;
  window.removerLancamento = removerLancamento;
  window.mostrarAvisoImportacao = mostrarAvisoImportacao;
  window.irParaConfiguracoes = irParaConfiguracoes;
  window.fecharAviso = fecharAviso;

  

  
  // Função para verificar status de sincronização
  function verificarStatusSincronizacao() {
    const webAppUrl = localStorage.getItem('googleSheetsWebAppUrl');
    if (webAppUrl && !webAppUrl.includes('*')) {
      // Verificar status de sincronização se necessário
      if (typeof verificarSincronizacaoAutomatica === 'function') {
        setTimeout(verificarSincronizacaoAutomatica, 1000);
      }
    }
  }
  
  // Funções para gerenciar lançamentos
  let lancamentoSendoGerenciado = null;
  
  window.abrirGerenciarLancamento = function(index) {
    if (document.body.classList.contains('sync-disabled')) {
      if (typeof mostrarNotificacaoSync === 'function') {
        mostrarNotificacaoSync('Aguarde a sincronização terminar', 'warning');
      }
      return;
    }
    
    lancamentoSendoGerenciado = index;
    const lancamento = lancamentos[index];
    const modal = document.getElementById("gerenciar-lancamento-modal");
    const lancamentoInfo = document.getElementById("gerenciar-lancamento-info");
    
    const tipoTexto = lancamento.tipo === 'receita' ? 'Receita' : 'Despesa';
    const dataFormatada = typeof lancamento.data === 'string' && lancamento.data.includes('/') ? 
      lancamento.data : 
      new Date(lancamento.data).toLocaleDateString('pt-BR');
    
    lancamentoInfo.innerHTML = `
      <strong>${tipoTexto}: ${lancamento.descricao}</strong><br>
      ${lancamento.categoria} / ${lancamento.subcategoria}<br>
      R$ ${lancamento.valor.toFixed(2).replace('.', ',')} - ${dataFormatada}
    `;
    modal.classList.remove('modal-hidden');
  };
  
  window.fecharGerenciarLancamentoModal = function() {
    document.getElementById("gerenciar-lancamento-modal").classList.add('modal-hidden');
    lancamentoSendoGerenciado = null;
  };
  
  window.abrirEdicaoLancamento = function() {
    if (lancamentoSendoGerenciado === null) return;
    
    const lancamento = lancamentos[lancamentoSendoGerenciado];
    const modal = document.getElementById("editar-lancamento-modal");
    
    // Preencher formulário
    document.getElementById('editar-tipo-receita').checked = lancamento.tipo === 'receita';
    document.getElementById('editar-tipo-despesa').checked = lancamento.tipo === 'despesa';
    
    // Atualizar categorias para o tipo selecionado
    atualizarCategoriasEdicao();
    
    setTimeout(() => {
      document.getElementById('editar-categoria-lancamento').value = lancamento.categoria || '';
      atualizarSubcategoriasEdicao();
      
      setTimeout(() => {
        document.getElementById('editar-subcategoria-lancamento').value = lancamento.subcategoria || '';
      }, 100);
    }, 100);
    
    document.getElementById('editar-descricao-lancamento').value = lancamento.descricao || '';
    document.getElementById('editar-quantidade-lancamento').value = lancamento.quantidade || 1;
    document.getElementById('editar-valor-lancamento').value = lancamento.valor || '';
    
    // Converter data para formato YYYY-MM-DD
    if (lancamento.data) {
      let dataFormatada;
      if (typeof lancamento.data === 'string' && lancamento.data.includes('/')) {
        const [dia, mes, ano] = lancamento.data.split('/');
        dataFormatada = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      } else {
        const d = new Date(lancamento.data);
        dataFormatada = d.toISOString().split('T')[0];
      }
      document.getElementById('editar-data-lancamento').value = dataFormatada;
    }
    
    document.getElementById("gerenciar-lancamento-modal").classList.add('modal-hidden');
    modal.classList.remove('modal-hidden');
  };
  
  window.fecharEdicaoLancamento = function() {
    document.getElementById("editar-lancamento-modal").classList.add('modal-hidden');
    lancamentoSendoGerenciado = null;
  };
  
  window.confirmarExclusaoLancamento = async function() {
    if (lancamentoSendoGerenciado !== null) {
      const lancamento = lancamentos[lancamentoSendoGerenciado];
      document.getElementById("gerenciar-lancamento-modal").classList.add('modal-hidden');
      
      console.log('=== INICIANDO EXCLUSÃO ROBUSTA ===');
      console.log('ID do lançamento a ser excluído:', lancamento.id);
      console.log('Dados do lançamento:', lancamento);
      
      // A função removerLancamento já cuida da exclusão robusta
      // incluindo estoque se necessário
      removerLancamento(lancamentoSendoGerenciado);
      lancamentoSendoGerenciado = null;
    }
  };
  
  // Funções para atualizar categorias na edição
  function atualizarCategoriasEdicao() {
    const tipoInputs = document.querySelectorAll('input[name="editar-tipo-lancamento"]');
    const categoriaInput = document.getElementById("editar-categoria-lancamento");
    const subcategoriaInput = document.getElementById("editar-subcategoria-lancamento");
    
    if (!tipoInputs.length || !categoriaInput || !subcategoriaInput) return;
    
    const tipoSelecionado = document.querySelector('input[name="editar-tipo-lancamento"]:checked')?.value;
    if (!tipoSelecionado) return;
    
    categoriaInput.innerHTML = '<option value="">Selecione uma categoria...</option>';
    subcategoriaInput.innerHTML = '<option value="">Selecione uma subcategoria...</option>';
    
    const cats = categorias[tipoSelecionado] || {};
    Object.keys(cats).forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categoriaInput.appendChild(opt);
    });
  }
  
  function atualizarSubcategoriasEdicao() {
    const tipoSelecionado = document.querySelector('input[name="editar-tipo-lancamento"]:checked')?.value;
    const categoriaInput = document.getElementById("editar-categoria-lancamento");
    const subcategoriaInput = document.getElementById("editar-subcategoria-lancamento");
    
    if (!tipoSelecionado || !categoriaInput || !subcategoriaInput) return;
    
    subcategoriaInput.innerHTML = '<option value="">Selecione uma subcategoria...</option>';
    
    const categoria = categoriaInput.value;
    if (!categoria) return;
    
    const subs = (categorias[tipoSelecionado] && categorias[tipoSelecionado][categoria]) ? categorias[tipoSelecionado][categoria] : [];
    subs.forEach(sub => {
      const opt = document.createElement("option");
      opt.value = sub;
      opt.textContent = sub;
      subcategoriaInput.appendChild(opt);
    });
  }
  
  // Event listeners para edição
  const editarTipoInputs = document.querySelectorAll('input[name="editar-tipo-lancamento"]');
  const editarCategoriaLancamento = document.getElementById("editar-categoria-lancamento");
  
  editarTipoInputs.forEach(input => {
    input.addEventListener("change", atualizarCategoriasEdicao);
  });
  
  if (editarCategoriaLancamento) {
    editarCategoriaLancamento.addEventListener("change", atualizarSubcategoriasEdicao);
  }
  
  // Formulário de edição de lançamento
  const editarLancamentoForm = document.getElementById("editar-lancamento-form");
  if (editarLancamentoForm) {
    editarLancamentoForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      
      if (lancamentoSendoGerenciado === null) return;
      
      const tipoSelecionado = document.querySelector('input[name="editar-tipo-lancamento"]:checked');
      const categoriaInput = document.getElementById("editar-categoria-lancamento");
      const subcategoriaInput = document.getElementById("editar-subcategoria-lancamento");
      const descInput = document.getElementById("editar-descricao-lancamento");
      const quantidadeInput = document.getElementById("editar-quantidade-lancamento");
      const valorInput = document.getElementById("editar-valor-lancamento");
      const dataInput = document.getElementById("editar-data-lancamento");
      
      const tipo = tipoSelecionado?.value;
      const categoria = categoriaInput.value.trim();
      const subcategoria = subcategoriaInput.value.trim();
      const descricao = descInput.value.trim();
      const quantidade = parseInt(quantidadeInput.value) || 1;
      const valor = parseFloat(valorInput.value);
      const data = dataInput.value;
      
      // Validação detalhada dos campos
      if (!tipo) {
        mostrarNotificacaoSync('Selecione o tipo de lançamento!', 'error');
        return;
      }
      if (!categoria) {
        mostrarNotificacaoSync('Selecione uma categoria!', 'error');
        return;
      }
      if (!subcategoria) {
        mostrarNotificacaoSync('Selecione uma subcategoria!', 'error');
        return;
      }
      if (!descricao) {
        mostrarNotificacaoSync('Preencha a descrição!', 'error');
        return;
      }
      if (!valor || valor <= 0 || isNaN(valor)) {
        mostrarNotificacaoSync('Preencha um valor válido maior que zero!', 'error');
        return;
      }
      if (!data) {
        mostrarNotificacaoSync('Selecione uma data!', 'error');
        return;
      }
      
      // Desabilitar todos os botões CRUD imediatamente
      document.body.classList.add('sync-disabled');
      
      // Aplicar feedback visual ao item sendo editado
      const lista = document.getElementById("financeiro-lista");
      const items = lista ? lista.querySelectorAll('.lancamento-item') : [];
      items.forEach((item, i) => {
        const btnGerenciar = item.querySelector('.lancamento-btn-gerenciar');
        if (btnGerenciar && btnGerenciar.getAttribute('onclick') === `abrirGerenciarLancamento(${lancamentoSendoGerenciado})`) {
          item.classList.add('processando');
          const lancamentoInfo = item.querySelector('.lancamento-info');
          if (lancamentoInfo) {
            lancamentoInfo.classList.add('processando');
          }
        }
      });
      
      // Aplicar feedback visual ao último item adicionado
      setTimeout(() => {
        const lista = document.getElementById("financeiro-lista");
        const primeiroItem = lista?.querySelector('.lancamento-item');
        if (primeiroItem) {
          primeiroItem.classList.add('processando');
          const lancamentoInfo = primeiroItem.querySelector('.lancamento-info');
          if (lancamentoInfo) {
            lancamentoInfo.classList.add('processando');
          }
        }
      }, 100);
      
      // Converter data de AAAA-MM-DD para DD/MM/AAAA
      const [ano, mes, dia] = data.split('-');
      const dataFormatada = `${dia}/${mes}/${ano}`;
      
      // Atualizar lançamento IMEDIATAMENTE
      const lancamentoAtualizado = {
        ...lancamentos[lancamentoSendoGerenciado],
        tipo,
        categoria,
        subcategoria,
        descricao,
        quantidade,
        valor,
        data: dataFormatada
      };
      
      lancamentos[lancamentoSendoGerenciado] = lancamentoAtualizado;
      salvarLancamentos();
      
      // Re-renderizar imediatamente
      renderizarLancamentos();
      
      // Fechar modal imediatamente
      fecharEdicaoLancamento();
      
      // Mostrar notificação imediata
      mostrarNotificacaoSync('Lançamento atualizado!', 'success');
      
      // Atualizar outras interfaces
      if (typeof renderizarDashboardResumo === 'function') {
        renderizarDashboardResumo();
      }
      
      // Editar também no estoque se for venda (em background)
      const eVenda = lancamentoAtualizado.categoria === 'Vendas' && lancamentoAtualizado.subcategoria === 'Produtos';
      if (eVenda && typeof editarMovimentacaoEstoque === 'function') {
        editarMovimentacaoEstoque({
          id: lancamentoAtualizado.id,
          produto: lancamentoAtualizado.descricao,
          categoria: 'Saída',
          quantidade: lancamentoAtualizado.quantidade,
          valorUnitario: lancamentoAtualizado.valor / lancamentoAtualizado.quantidade,
          valorTotal: lancamentoAtualizado.valor,
          data: lancamentoAtualizado.data,
          tipoMovimento: 'Venda',
          observacoes: 'Venda de produto'
        }).catch(console.error);
      }
      
      // Sincronização em background
      if (typeof editarLancamentoSheets === 'function') {
        try {
          await editarLancamentoSheets(lancamentoAtualizado);
        } catch (error) {
          console.error('Erro na sincronização:', error);
          mostrarNotificacaoSync('Erro na sincronização (alteração salva localmente)', 'warning');
        }
      }
      
      // Reabilitar botões CRUD e remover feedback visual
      document.body.classList.remove('sync-disabled');
      const todosItems = document.querySelectorAll('.processando');
      todosItems.forEach(item => item.classList.remove('processando'));
    });
  }



  // Funções para controlar overlay de sincronização
  window.mostrarOverlaySync = function(titulo, mensagem) {
    const overlay = document.getElementById('sync-overlay');
    if (overlay) {
      const titleElement = overlay.querySelector('.sync-overlay-title');
      const messageElement = overlay.querySelector('.sync-overlay-message');
      
      if (titleElement) titleElement.textContent = titulo || 'Sincronizando...';
      if (messageElement) messageElement.textContent = mensagem || 'Aguarde enquanto processamos sua solicitação';
      
      overlay.classList.add('active');
    }
  };
  
  window.ocultarOverlaySync = function() {
    const overlay = document.getElementById('sync-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  };

  // ===== NAVEGAÇÃO NATIVA TIPO PLANILHA =====
  
  class FinanceiroNavigation {
    constructor() {
      this.formContent = null;
      this.fields = [];
      this.isActive = false;
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }

    setup() {
      this.formContent = document.getElementById('financeiro-form-content');
      if (!this.formContent) return;

      this.setupFields();
      this.setupEventListeners();
    }

    setupFields() {
      this.fields = [
        () => document.querySelector('input[name="tipo-lancamento"]:checked'),
        () => document.getElementById('categoria-lancamento'),
        () => document.getElementById('subcategoria-lancamento'),
        () => document.getElementById('descricao-lancamento'),
        () => document.getElementById('quantidade-lancamento'),
        () => document.getElementById('valor-lancamento'),
        () => document.getElementById('data-lancamento')
      ];
    }

    setupEventListeners() {
      // Ativar navegação apenas quando clicar dentro do conteúdo do formulário
      this.formContent.addEventListener('click', (e) => {
        // Verificar se o clique foi em um elemento focalizável dentro do form-content
        const focusableElements = this.formContent.querySelectorAll('input, select, button, textarea');
        const isClickOnFocusable = Array.from(focusableElements).some(el => el.contains(e.target));
        
        if (isClickOnFocusable) {
          this.isActive = true;
          this.formContent.classList.add('navigation-active');
        }
      });

      // Desativar navegação quando clicar fora do conteúdo do formulário
      document.addEventListener('click', (e) => {
        if (!this.formContent.contains(e.target)) {
          this.isActive = false;
          this.formContent.classList.remove('navigation-active');
        }
      });

      // Configurar navegação Tab apenas nos campos do formulário
      this.fields.forEach((fieldFn, index) => {
        const field = fieldFn();
        if (!field) return;

        field.addEventListener('keydown', (e) => {
          if (!this.isActive) return;

          if (e.key === 'Tab') {
            e.preventDefault();
            this.focusNextField(index, e.shiftKey);
          } else if (e.key === 'Enter') {
            e.preventDefault();
            if (index === this.fields.length - 1) {
              this.submitAndReset();
            } else {
              this.focusNextField(index, false);
            }
          }
        });
      });

      // Interceptar Tab no botão de submit para manter navegação dentro do form-content
      const submitBtn = this.formContent.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.addEventListener('keydown', (e) => {
          if (!this.isActive) return;
          
          if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
              // Shift+Tab: voltar para o último campo
              this.focusNextField(this.fields.length - 1, false);
            } else {
              // Tab: ir para o primeiro campo
              this.focusNextField(-1, false);
            }
          } else if (e.key === 'Enter') {
            e.preventDefault();
            this.submitAndReset();
          }
        });
      }
    }

    focusNextField(currentIndex, reverse = false) {
      const direction = reverse ? -1 : 1;
      let nextIndex = currentIndex + direction;
      
      if (nextIndex < 0) nextIndex = this.fields.length - 1;
      if (nextIndex >= this.fields.length) nextIndex = 0;

      const nextField = this.fields[nextIndex]();
      if (nextField) {
        nextField.focus();
        if (nextField.select) nextField.select();
      }
    }

    submitAndReset() {
      const submitBtn = this.formContent.querySelector('button[type="submit"]');
      if (submitBtn && !submitBtn.disabled) {
        // Forçar atualização dos valores antes do submit
        const categoriaInput = document.getElementById('categoria-lancamento');
        const subcategoriaInput = document.getElementById('subcategoria-lancamento');
        
        // Disparar eventos change para garantir sincronização
        if (categoriaInput) categoriaInput.dispatchEvent(new Event('change'));
        if (subcategoriaInput) subcategoriaInput.dispatchEvent(new Event('change'));
        
        // Aguardar um momento para os eventos serem processados
        setTimeout(() => {
          submitBtn.click();
          
          setTimeout(() => {
            this.resetToFirst();
          }, 100);
        }, 50);
      }
    }

    resetToFirst() {
      const firstField = document.querySelector('input[name="tipo-lancamento"]:checked');
      if (firstField) {
        firstField.focus();
      }
    }
  }

  // Inicializar navegação
  setTimeout(() => {
    new FinanceiroNavigation();
  }, 500);

  // Inicializar com verificação de categorias
  function inicializarFinanceiro() {
    // Garantir que as categorias estejam disponíveis
    if (typeof window.categorias === 'undefined' && typeof categorias === 'undefined') {
      console.log('Aguardando carregamento das categorias...');
      setTimeout(inicializarFinanceiro, 100);
      return;
    }
    
    console.log('Inicializando módulo financeiro...');
    setupFinanceiroFormToggle();
    atualizarCategorias();
    renderizarLancamentos();
  }
  
  // Inicializar com delay para garantir que main.js carregou
  setTimeout(inicializarFinanceiro, 50);
});