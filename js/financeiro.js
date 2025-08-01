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
    
    if (window.filtroMes && window.filtroAno) {
      filtrados = filtrados.filter(l => {
        if (!l.data) return false;
        const d = l.data;
        return d.getMonth() + 1 === Number(window.filtroMes) && d.getFullYear() === Number(window.filtroAno);
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
          <span class="lancamento-valor" title="Valor unitário: R$ ${(l.valor / (l.quantidade || 1)).toFixed(2).replace('.', ',')}">R$ ${l.valor.toFixed(2).replace('.', ',')}</span><br>
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
        return d.getMonth() + 1 === window.filtroMes && d.getFullYear() === window.filtroAno;
      });
    }
    
    const totalReceitas = filtrados.filter(l => l.tipo === "receita").reduce((acc, l) => acc + l.valor, 0);
    const totalDespesas = filtrados.filter(l => l.tipo === "despesa").reduce((acc, l) => acc + l.valor, 0);
    const saldo = totalReceitas - totalDespesas;
    
    div.innerHTML = `
      <strong>Receitas:</strong> R$ ${totalReceitas.toFixed(2).replace('.', ',')}<br>
      <strong>Despesas:</strong> R$ ${totalDespesas.toFixed(2).replace('.', ',')}<br>
      <strong>Saldo:</strong> R$ ${saldo.toFixed(2).replace('.', ',')}
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

  // Event listeners
  const tipoLancamento = document.getElementById("tipo-lancamento");
  const categoriaLancamento = document.getElementById("categoria-lancamento");
  
  if (tipoLancamento) {
    tipoLancamento.addEventListener("change", atualizarCategorias);
  }
  
  if (categoriaLancamento) {
    categoriaLancamento.addEventListener("change", atualizarSubcategorias);
  }

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
        
        if (typeof renderizarDashboardResumo === 'function') {
          renderizarDashboardResumo();
        }
        if (typeof atualizarFiltroMesAno === 'function') {
          atualizarFiltroMesAno();
        }
      }
    });
  }

  // Expor funções globalmente
  window.renderizarLancamentos = renderizarLancamentos;
  window.renderizarResumoFinanceiro = renderizarResumoFinanceiro;
  window.removerLancamento = removerLancamento;
  window.mostrarAvisoImportacao = mostrarAvisoImportacao;
  window.irParaConfiguracoes = irParaConfiguracoes;
  window.fecharAviso = fecharAviso;
  
  // Inicializar
  atualizarCategorias();
  renderizarLancamentos();
});