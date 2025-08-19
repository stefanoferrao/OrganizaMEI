// Financeiro - Receitas e Despesas
document.addEventListener("DOMContentLoaded", function () {
  
  // Constants
  const DEBUG_MODE = false;
  const MAX_INITIALIZATION_ATTEMPTS = 50;
  const INITIALIZATION_RETRY_INTERVAL_MS = 100;
  const AUTO_HIDE_TIMEOUT_MS = 10000;
  
  const LABELS = {
    receitas: "Receitas:",
    despesas: "Despesas:",
    saldo: "Saldo:"
  };
  
  const DEFAULT_CATEGORIES = {
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
  
  // Global timeout management
  let categoriaTimeout = null;
  let subcategoriaTimeout = null;
  let avisoTimeout = null;
  let cachedFilteredResults = null;
  let termoPesquisa = '';
  
  // Authorization check
  function checkAuthorization() {
    // Basic authorization check - can be enhanced based on requirements
    return true; // Placeholder - implement actual authorization logic
  }
  
  // Secure logging function
  function secureLog(message, data = null) {
    if (DEBUG_MODE) {
      const sanitizedMessage = sanitizeForLog(message);
      if (data) {
        const sanitizedData = sanitizeForLog(data);
        console.log(sanitizedMessage, sanitizedData);
      } else {
        console.log(sanitizedMessage);
      }
    }
  }
  
  // Sanitization functions
  function sanitizeForLog(valor) {
    if (typeof valor === 'string') {
      return valor.replace(/[\r\n\t]/g, ' ').replace(/[<>]/g, '');
    }
    return valor;
  }
  
  function sanitizeHTML(str) {
    if (typeof str !== 'string') return str;
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  
  // Validation functions
  function isValidDate(dateString) {
    if (!dateString || typeof dateString !== 'string') return false;
    const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    if (!dateRegex.test(dateString)) return false;
    
    const [dia, mes, ano] = dateString.split('/').map(Number);
    return dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12 && ano >= 1900;
  }
  
  function parseDataLancamento(data) {
    if (!data) return null;
    
    let dataObj = null;
    if (typeof data === 'string' && data.includes('/')) {
      if (!isValidDate(data)) {
        console.warn('Data inválida detectada:', sanitizeForLog(data));
        return null;
      }
      const [dia, mes, ano] = data.split('/');
      dataObj = new Date(ano, mes - 1, dia);
    } else {
      dataObj = new Date(data);
    }
    
    if (isNaN(dataObj.getTime())) {
      console.warn('Data inválida detectada:', sanitizeForLog(data));
      return null;
    }
    
    return dataObj;
  }
  
  function obterCategorias() {
    if (typeof window.categorias !== 'undefined') {
      return window.categorias;
    }
    
    try {
      const categoriasLS = localStorage.getItem('categorias');
      if (categoriasLS) {
        return JSON.parse(categoriasLS);
      }
    } catch (e) {
      console.error('Erro ao carregar categorias do localStorage:', e);
    }
    
    return DEFAULT_CATEGORIES;
  }
  
  function filtrarLancamentos() {
    if (cachedFilteredResults && 
        !window.filtroMes && !window.filtroAno && !termoPesquisa) {
      return cachedFilteredResults;
    }
    
    let filtrados = lancamentos.map((l, idx) => {
      const dataObj = parseDataLancamento(l.data);
      return {
        ...l,
        _originalIndex: idx,
        data: dataObj
      };
    });
    
    // Filtro por mês/ano
    if (window.filtroMes || window.filtroAno) {
      const mesEhTodos = window.filtroMes === "todos";
      const anoEhTodos = window.filtroAno === "todos";
      
      filtrados = filtrados.filter(l => {
        if (!l.data) return false;
        const d = l.data;
        
        if (mesEhTodos && anoEhTodos) {
          return true;
        }
        
        if (anoEhTodos && !mesEhTodos) {
          return d.getMonth() + 1 === Number(window.filtroMes);
        }
        
        if (mesEhTodos && !anoEhTodos) {
          return d.getFullYear() === Number(window.filtroAno);
        }
        
        return d.getMonth() + 1 === Number(window.filtroMes) && d.getFullYear() === Number(window.filtroAno);
      });
    }
    
    // Filtro por pesquisa
    if (termoPesquisa) {
      const termo = termoPesquisa.toLowerCase();
      filtrados = filtrados.filter(l => {
        const descricao = (l.descricao || '').toLowerCase();
        const categoria = (l.categoria || '').toLowerCase();
        const subcategoria = (l.subcategoria || '').toLowerCase();
        const valor = (l.valor || 0).toString();
        
        return descricao.includes(termo) || 
               categoria.includes(termo) || 
               subcategoria.includes(termo) || 
               valor.includes(termo);
      });
    }
    
    cachedFilteredResults = filtrados;
    return filtrados;
  }
  
  function obterIconeTipo(tipo, categoria) {
    if (tipo === "receita") {
      return categoria === "Vendas" ? '<i class="fas fa-shopping-cart"></i>' : '<i class="fas fa-dollar-sign"></i>';
    }
    return '<i class="fas fa-credit-card"></i>';
  }

  function renderizarLancamentos() {
    const lista = document.getElementById("financeiro-lista");
    if (!lista) return;
    
    lista.innerHTML = "";
    let filtrados = filtrarLancamentos();
    
    filtrados = filtrados.sort((a, b) => {
      if (!a.data && !b.data) return 0;
      if (!a.data) return 1;
      if (!b.data) return -1;
      
      const diffData = b.data - a.data;
      if (diffData !== 0) return diffData;
      
      const idA = String(a.id || '');
      const idB = String(b.id || '');
      return idB.localeCompare(idA);
    });
    
    filtrados.forEach((l) => {
      const item = document.createElement("li");
      const tipoIcon = obterIconeTipo(l.tipo, l.categoria);
      const quantidadeSegura = Math.max(l.quantidade || 1, 1);
      const valorSeguro = (l.valor || 0);
      
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
      
      const dataFormatada = l.data ? (typeof l.data === 'string' && l.data.includes('/') ? l.data : l.data.toLocaleDateString('pt-BR')) : "";
      item.innerHTML = `
        <span class="lancamento-info">
          <span class="lancamento-icon">${tipoIcon}</span>
          <span>
            <strong>${sanitizeHTML(l.categoria || "-")}</strong> / <em>${sanitizeHTML(l.subcategoria || "-")}</em><br>
            <span class="lancamento-descricao">${sanitizeHTML(l.descricao)}</span>
            ${l.quantidade && l.quantidade > 1 ? `<br><small>Qtd: ${l.quantidade} - R$ ${(valorSeguro / quantidadeSegura).toFixed(2).replace('.', ',')} cada</small>` : ''}
          </span>
        </span>
        <span class="lancamento-valor-container">
          <span class="lancamento-valor" title="Valor unitário: R$ ${(valorSeguro / quantidadeSegura).toFixed(2).replace('.', ',')}">R$ ${valorSeguro.toFixed(2).replace('.', ',')}</span><br>
           <span class="lancamento-data">${sanitizeHTML(dataFormatada)}</span>
        </span>
        <button data-index="${l._originalIndex}" class="lancamento-btn-gerenciar"><i class="fas fa-cog"></i></button>
      `;
      
      const btn = item.querySelector('.lancamento-btn-gerenciar');
      if (btn) {
        btn.addEventListener('click', () => {
          if (checkAuthorization()) {
            window.abrirGerenciarLancamento(l._originalIndex);
          }
        });
      }
      
      lista.appendChild(item);
    });
    renderizarResumoFinanceiro(filtrados);
  }

  function renderizarResumoFinanceiro(filtrados = null) {
    const div = document.getElementById("resumo-financeiro");
    if (!div) return;
    
    if (!filtrados) {
      filtrados = filtrarLancamentos();
    }
    
    const { totalReceitas, totalDespesas } = filtrados.reduce((acc, l) => {
      const valor = l.valor || 0;
      if (l.tipo === "receita") {
        acc.totalReceitas += valor;
      } else if (l.tipo === "despesa") {
        acc.totalDespesas += valor;
      }
      return acc;
    }, { totalReceitas: 0, totalDespesas: 0 });
    
    const saldo = totalReceitas - totalDespesas;
    
    div.innerHTML = `
      <strong>${LABELS.receitas}</strong> R$ ${totalReceitas.toFixed(2).replace('.', ',')}<br>
      <strong>${LABELS.despesas}</strong> R$ ${totalDespesas.toFixed(2).replace('.', ',')}<br>
      <strong>${LABELS.saldo}</strong> R$ ${saldo.toFixed(2).replace('.', ',')}
    `;
  }

  async function removerLancamento(index) {
    if (!checkAuthorization()) {
      mostrarNotificacaoSync('Acesso negado', 'error');
      return;
    }
    
    const lancamento = lancamentos[index];
    
    if (!lancamento) {
      console.error('Lançamento não encontrado no índice:', index);
      mostrarNotificacaoSync('Erro: Lançamento não encontrado', 'error');
      return;
    }
    
    secureLog('=== INICIANDO EXCLUSÃO DE LANÇAMENTO ===');
    secureLog('ID do lançamento:', lancamento.id);
    secureLog('Categoria:', lancamento.categoria);
    
    document.body.classList.add('sync-disabled');
    
    const lista = document.getElementById("financeiro-lista");
    let itemParaRemover = null;
    
    if (lista) {
      const btnGerenciar = lista.querySelector(`button[data-index="${index}"]`);
      if (btnGerenciar) {
        itemParaRemover = btnGerenciar.closest('.lancamento-item');
      }
    }
    
    if (itemParaRemover) {
      itemParaRemover.classList.add('excluindo', 'processando');
      const lancamentoInfo = itemParaRemover.querySelector('.lancamento-info');
      if (lancamentoInfo) {
        lancamentoInfo.classList.add('processando');
      }
    }
    
    const eVenda = lancamento.categoria === 'Vendas' && lancamento.subcategoria === 'Produtos';
    if (eVenda && lancamento.id) {
      secureLog('=== REMOVENDO MOVIMENTAÇÃO DE ESTOQUE RELACIONADA ===');
      
      let movimentacoesEstoque = [];
      try {
        movimentacoesEstoque = JSON.parse(localStorage.getItem('movimentacoesEstoque') || '[]');
      } catch (error) {
        console.error('Erro ao carregar movimentações de estoque:', error);
        movimentacoesEstoque = [];
      }
      
      const indexMovimentacao = movimentacoesEstoque.findIndex(m => m.id === lancamento.id);
      if (indexMovimentacao >= 0) {
        const estoqueAtivo = localStorage.getItem('estoqueGoogleSheetsAtivo') === 'true';
        if (estoqueAtivo && typeof excluirMovimentacaoEstoque === 'function') {
          try {
            await excluirMovimentacaoEstoque(lancamento.id);
          } catch (error) {
            console.error('Erro ao remover movimentação do Google Sheets:', error);
          }
        }
        
        movimentacoesEstoque.splice(indexMovimentacao, 1);
        try {
          localStorage.setItem('movimentacoesEstoque', JSON.stringify(movimentacoesEstoque));
        } catch (error) {
          console.error('Erro ao salvar movimentações no localStorage:', error);
        }
        
        if (typeof recalcularEstoque === 'function') {
          recalcularEstoque();
        } else if (typeof recalcularEstoqueGlobal === 'function') {
          recalcularEstoqueGlobal();
        }
        
        if (typeof renderizarProdutos === 'function') {
          renderizarProdutos();
        }
      }
    }
    
    lancamentos.splice(index, 1);
    salvarLancamentos();
    cachedFilteredResults = null;
    
    if (itemParaRemover) {
      itemParaRemover.classList.add('saindo');
      setTimeout(() => {
        renderizarLancamentos();
      }, 300);
    } else {
      renderizarLancamentos();
    }
    
    if (typeof renderizarDashboardResumo === 'function') {
      renderizarDashboardResumo();
    }
    if (typeof atualizarFiltroMesAno === 'function') {
      atualizarFiltroMesAno();
    }
    
    const webAppUrl = localStorage.getItem('googleSheetsWebAppUrl');
    if (isValidWebAppUrl(webAppUrl) && lancamento.id && typeof excluirLancamentoSheets === 'function') {
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
    
    document.body.classList.remove('sync-disabled');
    const todosItems = document.querySelectorAll('.processando');
    todosItems.forEach(item => item.classList.remove('processando'));
  }

  function isValidWebAppUrl(url) {
    if (!url || typeof url !== 'string') return false;
    try {
      new URL(url);
      return !url.includes('YOUR_WEB_APP_URL') && url.trim() !== '';
    } catch {
      return false;
    }
  }

  function mostrarAvisoImportacao() {
    clearTimeout(avisoTimeout);
    
    let avisoElement = document.getElementById('aviso-importacao');
    
    if (!avisoElement) {
      avisoElement = document.createElement('div');
      avisoElement.id = 'aviso-importacao';
      avisoElement.className = 'aviso-importacao';
      
      const resumoFinanceiro = document.getElementById('resumo-financeiro');
      if (resumoFinanceiro) {
        resumoFinanceiro.parentNode.insertBefore(avisoElement, resumoFinanceiro.nextSibling);
      }
    }
    
    avisoElement.innerHTML = `
      <div class="aviso-content">
        <span class="aviso-icon"><i class="fas fa-exclamation-triangle" style="color: #ecc94b;"></i></span>
        <span class="aviso-texto">Item não sincronizado com a planilha. Recomendamos importar os dados novamente em "Configurações".</span>
        <button class="aviso-btn">Ir para Configurações</button>
        <button class="aviso-fechar">×</button>
      </div>
    `;
    
    const btnConfig = avisoElement.querySelector('.aviso-btn');
    const btnFechar = avisoElement.querySelector('.aviso-fechar');
    
    if (btnConfig) {
      btnConfig.addEventListener('click', irParaConfiguracoes);
    }
    if (btnFechar) {
      btnFechar.addEventListener('click', fecharAviso);
    }
    
    avisoElement.style.display = 'block';
    
    avisoTimeout = setTimeout(() => {
      if (avisoElement) {
        avisoElement.style.display = 'none';
      }
    }, AUTO_HIDE_TIMEOUT_MS);
  }

  function irParaConfiguracoes() {
    if (typeof changeTab === 'function') {
      changeTab('configuracoes');
    }
    fecharAviso();
  }

  function fecharAviso() {
    const avisoElement = document.getElementById('aviso-importacao');
    if (avisoElement) {
      avisoElement.style.display = 'none';
    }
    clearTimeout(avisoTimeout);
  }

  function validateFormData(data) {
    const { tipo, categoria, subcategoria, descricao, valor, data: dataInput } = data;
    
    if (!tipo) {
      mostrarNotificacaoSync('Selecione o tipo de lançamento (Receita ou Despesa)!', 'error');
      return false;
    }
    if (!categoria || categoria === '') {
      mostrarNotificacaoSync('Selecione uma categoria!', 'error');
      return false;
    }
    if (!subcategoria) {
      mostrarNotificacaoSync('Selecione uma subcategoria!', 'error');
      return false;
    }
    if (!descricao) {
      mostrarNotificacaoSync('Preencha a descrição!', 'error');
      return false;
    }
    if (!valor || valor <= 0 || isNaN(valor)) {
      mostrarNotificacaoSync('Preencha um valor válido maior que zero!', 'error');
      return false;
    }
    if (!dataInput) {
      mostrarNotificacaoSync('Selecione uma data!', 'error');
      return false;
    }
    
    return true;
  }

  function clearFormFields() {
    const elements = {
      tipoReceita: document.getElementById('tipo-receita'),
      categoria: document.getElementById("categoria-lancamento"),
      subcategoria: document.getElementById("subcategoria-lancamento"),
      descricao: document.getElementById("descricao-lancamento"),
      quantidade: document.getElementById("quantidade-lancamento"),
      valor: document.getElementById("valor-lancamento"),
      data: document.getElementById("data-lancamento")
    };
    
    if (elements.tipoReceita) elements.tipoReceita.checked = true;
    atualizarCategorias();
    if (elements.categoria) elements.categoria.value = "";
    if (elements.subcategoria) elements.subcategoria.value = "";
    if (elements.descricao) elements.descricao.value = "";
    if (elements.quantidade) elements.quantidade.value = "1";
    if (elements.valor) elements.valor.value = "";
    if (elements.data) elements.data.value = "";
  }

  function processNewLancamento(formData) {
    const { tipo, categoria, subcategoria, descricao, quantidade, valor, data } = formData;
    
    const [ano, mes, dia] = data.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;
    
    const novoLancamento = { 
      id: window.gerarIdentificadorUnico(),
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
    cachedFilteredResults = null;
    
    return novoLancamento;
  }

  async function syncToSheets(lancamento) {
    if (typeof adicionarLancamentoSheets === 'function') {
      try {
        await adicionarLancamentoSheets(lancamento);
      } catch (error) {
        console.error('Erro na sincronização:', error);
        mostrarNotificacaoSync('Erro na sincronização (item salvo localmente)', 'warning');
      }
    }
  }

  function atualizarCategorias() {
    const tipoInputs = document.querySelectorAll('input[name="tipo-lancamento"]');
    const categoriaInput = document.getElementById("categoria-lancamento");
    const subcategoriaInput = document.getElementById("subcategoria-lancamento");
    
    if (!tipoInputs.length || !categoriaInput || !subcategoriaInput) {
      console.warn('Elementos do formulário não encontrados para atualizar categorias');
      return;
    }
    
    const tipoSelecionado = document.querySelector('input[name="tipo-lancamento"]:checked')?.value;
    if (!tipoSelecionado) {
      console.warn('Nenhum tipo de lançamento selecionado');
      categoriaInput.innerHTML = '<option value="">Selecione uma categoria...</option>';
      subcategoriaInput.innerHTML = '<option value="">Selecione uma subcategoria...</option>';
      return;
    }
    
    categoriaInput.innerHTML = '<option value="">Selecione uma categoria...</option>';
    subcategoriaInput.innerHTML = '<option value="">Selecione uma subcategoria...</option>';
    
    const categoriasObj = obterCategorias();
    const cats = categoriasObj[tipoSelecionado] || {};
    
    Object.keys(cats).forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categoriaInput.appendChild(opt);
    });
    
    secureLog(`Categorias carregadas para ${tipoSelecionado}:`, Object.keys(cats));
    
    const categoriaGroup = document.querySelector('.form-group-categoria');
    if (categoriaGroup) {
      categoriaGroup.classList.add('updated');
      clearTimeout(categoriaTimeout);
      categoriaTimeout = setTimeout(() => {
        categoriaGroup.classList.remove('updated');
      }, 300);
    }
    
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
    
    const categoriasObj = obterCategorias();
    const subs = (categoriasObj[tipoSelecionado] && categoriasObj[tipoSelecionado][categoria]) ? categoriasObj[tipoSelecionado][categoria] : [];
    
    subs.forEach(sub => {
      const opt = document.createElement("option");
      opt.value = sub;
      opt.textContent = sub;
      subcategoriaInput.appendChild(opt);
    });
    
    secureLog(`Subcategorias carregadas para ${categoria}:`, subs);
    
    const subcategoriaGroup = document.querySelector('.form-group-subcategoria');
    if (subcategoriaGroup) {
      subcategoriaGroup.classList.add('updated');
      clearTimeout(subcategoriaTimeout);
      subcategoriaTimeout = setTimeout(() => {
        subcategoriaGroup.classList.remove('updated');
      }, 300);
    }
  }

  const tipoInputs = document.querySelectorAll('input[name="tipo-lancamento"]');
  const categoriaLancamento = document.getElementById("categoria-lancamento");
  
  tipoInputs.forEach(input => {
    input.addEventListener("change", atualizarCategorias);
  });
  
  if (categoriaLancamento) {
    categoriaLancamento.addEventListener("change", atualizarSubcategorias);
  }

  const financeiroForm = document.getElementById("financeiro-form-inner");
  if (financeiroForm) {
    financeiroForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      
      if (!checkAuthorization()) {
        mostrarNotificacaoSync('Acesso negado', 'error');
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const formElements = {
        tipoSelecionado: document.querySelector('input[name="tipo-lancamento"]:checked'),
        categoriaInput: document.getElementById("categoria-lancamento"),
        subcategoriaInput: document.getElementById("subcategoria-lancamento"),
        descInput: document.getElementById("descricao-lancamento"),
        quantidadeInput: document.getElementById("quantidade-lancamento"),
        valorInput: document.getElementById("valor-lancamento"),
        dataInput: document.getElementById("data-lancamento")
      };
      
      const formData = {
        tipo: formElements.tipoSelecionado?.value,
        categoria: formElements.categoriaInput.value.trim(),
        subcategoria: formElements.subcategoriaInput.value.trim(),
        descricao: formElements.descInput.value.trim(),
        quantidade: parseInt(formElements.quantidadeInput.value) || 1,
        valor: parseFloat(formElements.valorInput.value),
        data: formElements.dataInput.value
      };
      
      if (!validateFormData(formData)) {
        return;
      }
      
      document.body.classList.add('sync-disabled');
      
      clearFormFields();
      const novoLancamento = processNewLancamento(formData);
      
      renderizarLancamentos();
      
      const tipoTexto = formData.tipo === 'receita' ? 'Receita' : 'Despesa';
      mostrarNotificacaoSync(`${tipoTexto} adicionada: ${formData.descricao}`, 'success');
      
      if (typeof renderizarDashboardResumo === 'function') {
        renderizarDashboardResumo();
      }
      if (typeof atualizarFiltroMesAno === 'function') {
        atualizarFiltroMesAno();
      }
      
      await syncToSheets(novoLancamento);
      
      document.body.classList.remove('sync-disabled');
      const todosItems = document.querySelectorAll('.processando');
      todosItems.forEach(item => item.classList.remove('processando'));
    });
  }

  function setupFinanceiroFormToggle() {
    const header = document.getElementById('financeiro-form-header');
    const content = document.getElementById('financeiro-form-content');
    const arrow = document.getElementById('financeiro-form-arrow');
    
    if (header && content && arrow) {
      const savedState = loadFinanceiroFormState();
      content.style.display = savedState ? 'block' : 'none';
      arrow.classList.toggle('rotated', savedState);
      
      header.addEventListener('click', () => {
        const isVisible = content.style.display !== 'none';
        const newState = !isVisible;
        content.style.display = newState ? 'block' : 'none';
        arrow.classList.toggle('rotated', newState);
        
        saveFinanceiroFormState(newState);
      });
    }
  }
  
  function loadFinanceiroFormState() {
    const saved = localStorage.getItem('financeiroFormExpanded');
    return saved === null ? true : saved === 'true';
  }
  
  function saveFinanceiroFormState(expanded) {
    localStorage.setItem('financeiroFormExpanded', expanded.toString());
  }

  window.renderizarLancamentos = renderizarLancamentos;
  window.renderizarResumoFinanceiro = renderizarResumoFinanceiro;
  window.removerLancamento = removerLancamento;
  window.mostrarAvisoImportacao = mostrarAvisoImportacao;
  window.irParaConfiguracoes = irParaConfiguracoes;
  window.fecharAviso = fecharAviso;

  function verificarStatusSincronizacao() {
    const webAppUrl = localStorage.getItem('googleSheetsWebAppUrl');
    if (isValidWebAppUrl(webAppUrl)) {
      if (typeof verificarSincronizacaoAutomatica === 'function') {
        setTimeout(verificarSincronizacaoAutomatica, 1000);
      }
    }
  }
  
  let lancamentoSendoGerenciado = null;
  
  window.abrirGerenciarLancamento = function(index) {
    if (!checkAuthorization()) {
      mostrarNotificacaoSync('Acesso negado', 'error');
      return;
    }
    
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
      <strong>${tipoTexto}: ${sanitizeHTML(lancamento.descricao)}</strong><br>
      ${sanitizeHTML(lancamento.categoria)} / ${sanitizeHTML(lancamento.subcategoria)}<br>
      R$ ${(lancamento.valor || 0).toFixed(2).replace('.', ',')} - ${sanitizeHTML(dataFormatada)}
    `;
    modal.classList.remove('modal-hidden');
  };
  
  window.fecharGerenciarLancamentoModal = function() {
    document.getElementById("gerenciar-lancamento-modal").classList.add('modal-hidden');
    lancamentoSendoGerenciado = null;
  };
  
  window.abrirEdicaoLancamento = function() {
    if (!checkAuthorization()) {
      mostrarNotificacaoSync('Acesso negado', 'error');
      return;
    }
    
    if (lancamentoSendoGerenciado === null) return;
    
    const lancamento = lancamentos[lancamentoSendoGerenciado];
    const modal = document.getElementById("editar-lancamento-modal");
    
    document.getElementById('editar-tipo-receita').checked = lancamento.tipo === 'receita';
    document.getElementById('editar-tipo-despesa').checked = lancamento.tipo === 'despesa';
    
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
    if (!checkAuthorization()) {
      mostrarNotificacaoSync('Acesso negado', 'error');
      return;
    }
    
    if (lancamentoSendoGerenciado !== null) {
      const lancamento = lancamentos[lancamentoSendoGerenciado];
      document.getElementById("gerenciar-lancamento-modal").classList.add('modal-hidden');
      
      secureLog('=== INICIANDO EXCLUSÃO ROBUSTA ===');
      secureLog('ID do lançamento a ser excluído:', lancamento.id);
      
      removerLancamento(lancamentoSendoGerenciado);
      lancamentoSendoGerenciado = null;
    }
  };
  
  function atualizarCategoriasEdicao() {
    const tipoInputs = document.querySelectorAll('input[name="editar-tipo-lancamento"]');
    const categoriaInput = document.getElementById("editar-categoria-lancamento");
    const subcategoriaInput = document.getElementById("editar-subcategoria-lancamento");
    
    if (!tipoInputs.length || !categoriaInput || !subcategoriaInput) {
      console.warn('Elementos do formulário de edição não encontrados');
      return;
    }
    
    const tipoSelecionado = document.querySelector('input[name="editar-tipo-lancamento"]:checked')?.value;
    if (!tipoSelecionado) {
      console.warn('Nenhum tipo selecionado na edição');
      return;
    }
    
    categoriaInput.innerHTML = '<option value="">Selecione uma categoria...</option>';
    subcategoriaInput.innerHTML = '<option value="">Selecione uma subcategoria...</option>';
    
    const categoriasObj = obterCategorias();
    const cats = categoriasObj[tipoSelecionado] || {};
    
    Object.keys(cats).forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categoriaInput.appendChild(opt);
    });
    
    secureLog(`Categorias de edição carregadas para ${tipoSelecionado}:`, Object.keys(cats));
  }
  
  function atualizarSubcategoriasEdicao() {
    const tipoSelecionado = document.querySelector('input[name="editar-tipo-lancamento"]:checked')?.value;
    const categoriaInput = document.getElementById("editar-categoria-lancamento");
    const subcategoriaInput = document.getElementById("editar-subcategoria-lancamento");
    
    if (!tipoSelecionado || !categoriaInput || !subcategoriaInput) {
      console.warn('Elementos necessários para subcategorias de edição não encontrados');
      return;
    }
    
    subcategoriaInput.innerHTML = '<option value="">Selecione uma subcategoria...</option>';
    
    const categoria = categoriaInput.value;
    if (!categoria) return;
    
    const categoriasObj = obterCategorias();
    const subs = (categoriasObj[tipoSelecionado] && categoriasObj[tipoSelecionado][categoria]) ? categoriasObj[tipoSelecionado][categoria] : [];
    
    subs.forEach(sub => {
      const opt = document.createElement("option");
      opt.value = sub;
      opt.textContent = sub;
      subcategoriaInput.appendChild(opt);
    });
    
    secureLog(`Subcategorias de edição carregadas para ${categoria}:`, subs);
  }
  
  const editarTipoInputs = document.querySelectorAll('input[name="editar-tipo-lancamento"]');
  const editarCategoriaLancamento = document.getElementById("editar-categoria-lancamento");
  
  editarTipoInputs.forEach(input => {
    input.addEventListener("change", atualizarCategoriasEdicao);
  });
  
  if (editarCategoriaLancamento) {
    editarCategoriaLancamento.addEventListener("change", atualizarSubcategoriasEdicao);
  }
  
  const editarLancamentoForm = document.getElementById("editar-lancamento-form");
  if (editarLancamentoForm) {
    editarLancamentoForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      
      if (!checkAuthorization()) {
        mostrarNotificacaoSync('Acesso negado', 'error');
        return;
      }
      
      if (lancamentoSendoGerenciado === null) return;
      
      const formElements = {
        tipoSelecionado: document.querySelector('input[name="editar-tipo-lancamento"]:checked'),
        categoriaInput: document.getElementById("editar-categoria-lancamento"),
        subcategoriaInput: document.getElementById("editar-subcategoria-lancamento"),
        descInput: document.getElementById("editar-descricao-lancamento"),
        quantidadeInput: document.getElementById("editar-quantidade-lancamento"),
        valorInput: document.getElementById("editar-valor-lancamento"),
        dataInput: document.getElementById("editar-data-lancamento")
      };
      
      const formData = {
        tipo: formElements.tipoSelecionado?.value,
        categoria: formElements.categoriaInput.value.trim(),
        subcategoria: formElements.subcategoriaInput.value.trim(),
        descricao: formElements.descInput.value.trim(),
        quantidade: parseInt(formElements.quantidadeInput.value) || 1,
        valor: parseFloat(formElements.valorInput.value),
        data: formElements.dataInput.value
      };
      
      if (!validateFormData(formData)) {
        return;
      }
      
      document.body.classList.add('sync-disabled');
      
      const lista = document.getElementById("financeiro-lista");
      if (lista) {
        const btnGerenciar = lista.querySelector(`button[data-index="${lancamentoSendoGerenciado}"]`);
        if (btnGerenciar) {
          const item = btnGerenciar.closest('.lancamento-item');
          if (item) {
            item.classList.add('processando');
            const lancamentoInfo = item.querySelector('.lancamento-info');
            if (lancamentoInfo) {
              lancamentoInfo.classList.add('processando');
            }
          }
        }
      }
      
      const [ano, mes, dia] = formData.data.split('-');
      const dataFormatada = `${dia}/${mes}/${ano}`;
      
      const lancamentoAtualizado = {
        ...lancamentos[lancamentoSendoGerenciado],
        tipo: formData.tipo,
        categoria: formData.categoria,
        subcategoria: formData.subcategoria,
        descricao: formData.descricao,
        quantidade: formData.quantidade,
        valor: formData.valor,
        data: dataFormatada
      };
      
      lancamentos[lancamentoSendoGerenciado] = lancamentoAtualizado;
      salvarLancamentos();
      cachedFilteredResults = null;
      
      renderizarLancamentos();
      
      fecharEdicaoLancamento();
      
      mostrarNotificacaoSync('Lançamento atualizado!', 'success');
      
      if (typeof renderizarDashboardResumo === 'function') {
        renderizarDashboardResumo();
      }
      
      const eVenda = lancamentoAtualizado.categoria === 'Vendas' && lancamentoAtualizado.subcategoria === 'Produtos';
      if (eVenda && typeof editarMovimentacaoEstoque === 'function') {
        const quantidadeSegura = Math.max(lancamentoAtualizado.quantidade || 1, 1);
        const valorSeguro = lancamentoAtualizado.valor || 0;
        editarMovimentacaoEstoque({
          id: lancamentoAtualizado.id,
          produto: lancamentoAtualizado.descricao,
          categoria: 'Saída',
          quantidade: lancamentoAtualizado.quantidade,
          valorUnitario: valorSeguro / quantidadeSegura,
          valorTotal: valorSeguro,
          data: lancamentoAtualizado.data,
          tipoMovimento: 'Venda',
          observacoes: 'Venda de produto'
        }).catch(console.error);
      }
      
      if (typeof editarLancamentoSheets === 'function') {
        try {
          await editarLancamentoSheets(lancamentoAtualizado);
        } catch (error) {
          console.error('Erro na sincronização:', error);
          mostrarNotificacaoSync('Erro na sincronização (alteração salva localmente)', 'warning');
        }
      }
      
      document.body.classList.remove('sync-disabled');
      const todosItems = document.querySelectorAll('.processando');
      todosItems.forEach(item => item.classList.remove('processando'));
    });
  }

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
        document.querySelector('input[name="tipo-lancamento"]'),
        document.getElementById('categoria-lancamento'),
        document.getElementById('subcategoria-lancamento'),
        document.getElementById('descricao-lancamento'),
        document.getElementById('quantidade-lancamento'),
        document.getElementById('valor-lancamento'),
        document.getElementById('data-lancamento')
      ].filter(Boolean);
    }

    setupEventListeners() {
      this.formContent.addEventListener('click', (e) => {
        const focusableElements = this.formContent.querySelectorAll('input, select, button, textarea');
        const isClickOnFocusable = Array.from(focusableElements).some(el => el.contains(e.target));
        
        if (isClickOnFocusable) {
          this.isActive = true;
          this.formContent.classList.add('navigation-active');
        }
      });

      document.addEventListener('click', (e) => {
        if (!this.formContent.contains(e.target)) {
          this.isActive = false;
          this.formContent.classList.remove('navigation-active');
        }
      });

      this.fields.forEach((field, index) => {
        if (field) {
          field.addEventListener('keydown', (e) => {
            if (this.isActive && e.key === 'Tab') {
              this.handleTabNavigation(e, index);
            }
          });
        }
      });
    }

    handleTabNavigation(e, currentIndex) {
      const direction = e.shiftKey ? -1 : 1;
      const nextIndex = currentIndex + direction;
      
      if (nextIndex >= 0 && nextIndex < this.fields.length) {
        e.preventDefault();
        const nextField = this.fields[nextIndex];
        if (nextField && !nextField.disabled) {
          nextField.focus();
        }
      }
    }
  }

  function setupPesquisaFinanceiro() {
    const inputPesquisa = document.getElementById('pesquisa-financeiro');
    const btnLimpar = document.getElementById('limpar-pesquisa');
    
    if (!inputPesquisa || !btnLimpar) return;
    
    // Mostrar/ocultar botão limpar
    function toggleLimparButton() {
      if (inputPesquisa.value.trim()) {
        btnLimpar.classList.add('visible');
      } else {
        btnLimpar.classList.remove('visible');
      }
    }
    
    // Evento de pesquisa
    inputPesquisa.addEventListener('input', function() {
      termoPesquisa = this.value.trim();
      cachedFilteredResults = null;
      renderizarLancamentos();
      toggleLimparButton();
    });
    
    // Botão limpar
    btnLimpar.addEventListener('click', function() {
      inputPesquisa.value = '';
      termoPesquisa = '';
      cachedFilteredResults = null;
      renderizarLancamentos();
      toggleLimparButton();
      inputPesquisa.focus();
    });
    
    // Inicializar estado do botão
    toggleLimparButton();
  }

  function inicializarFinanceiro() {
    let tentativas = 0;
    
    function tentar() {
      tentativas++;
      
      if (tentativas > MAX_INITIALIZATION_ATTEMPTS) {
        console.error('Falha ao inicializar financeiro após múltiplas tentativas');
        return;
      }
      
      try {
        const categorias = obterCategorias();
        if (categorias && Object.keys(categorias).length > 0) {
          setupFinanceiroFormToggle();
          setupPesquisaFinanceiro();
          atualizarCategorias();
          renderizarLancamentos();
          verificarStatusSincronizacao();
          new FinanceiroNavigation();
          secureLog('Financeiro inicializado com sucesso');
        } else {
          setTimeout(tentar, INITIALIZATION_RETRY_INTERVAL_MS);
        }
      } catch (error) {
        console.error('Erro na inicialização do financeiro:', error);
        setTimeout(tentar, INITIALIZATION_RETRY_INTERVAL_MS);
      }
    }
    
    tentar();
  }

  inicializarFinanceiro();
});