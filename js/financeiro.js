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
        <button onclick="removerLancamento(${l._originalIndex})" class="lancamento-btn-remover"><i class="fas fa-trash"></i></button>
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
      return;
    }
    
    // Feedback visual IMEDIATO - encontrar e marcar o item correto
    const lista = document.getElementById("financeiro-lista");
    const items = lista ? lista.querySelectorAll('.lancamento-item') : [];
    let itemParaRemover = null;
    
    // Encontrar o item correto baseado no índice original
    items.forEach((item, i) => {
      const btnRemover = item.querySelector('.lancamento-btn-remover');
      if (btnRemover && btnRemover.getAttribute('onclick') === `removerLancamento(${index})`) {
        itemParaRemover = item;
      }
    });
    
    // Aplicar feedback visual imediato
    if (itemParaRemover) {
      itemParaRemover.classList.add('removendo');
      // Desabilitar o botão para evitar cliques duplos
      const btnRemover = itemParaRemover.querySelector('.lancamento-btn-remover');
      if (btnRemover) {
        btnRemover.style.pointerEvents = 'none';
        btnRemover.style.opacity = '0.5';
      }
    }
    
    // Primeiro tentar excluir do Google Sheets (se configurado)
    let sucessoSheets = true;
    const webAppUrl = localStorage.getItem('googleSheetsWebAppUrl');
    
    if (webAppUrl && lancamento.id && typeof excluirLancamentoSheets === 'function') {
      try {
        // Mostrar notificação de sincronização
        if (typeof mostrarNotificacaoSync === 'function') {
          // mostrarNotificacaoSync('Sincronizando exclusão...', 'info');
        }
        
        console.log('Tentando excluir do Google Sheets - ID:', lancamento.id);
        sucessoSheets = await excluirLancamentoSheets(lancamento.id);
        console.log('Resultado da exclusão no Google Sheets:', sucessoSheets);
        
        if (sucessoSheets) {
          if (typeof mostrarNotificacaoSync === 'function') {
            mostrarNotificacaoSync('Item removido', 'success');
          }
        } else {
          console.warn('Falha ao excluir do Google Sheets, mas continuando com exclusão local');
          if (typeof mostrarNotificacaoSync === 'function') {
            mostrarNotificacaoSync('Erro ao sincronizar exclusão', 'warning');
          }
        }
      } catch (error) {
        console.error('Erro ao excluir do Google Sheets:', error);
        sucessoSheets = false;
        if (typeof mostrarNotificacaoSync === 'function') {
          mostrarNotificacaoSync('Erro de conexão na exclusão', 'warning');
        }
      }
    }
    
    // Sempre remover localmente (independente do resultado do Google Sheets)
    lancamentos.splice(index, 1);
    salvarLancamentos();
    
    // Animação de saída antes de re-renderizar
    if (itemParaRemover) {
      itemParaRemover.classList.remove('removendo');
      itemParaRemover.classList.add('saindo');
      
      // Re-renderizar após a animação
      setTimeout(() => {
        renderizarLancamentos();
        renderizarResumoFinanceiro();
      }, 300);
    } else {
      // Fallback se não encontrou o item
      renderizarLancamentos();
      renderizarResumoFinanceiro();
    }
    
    // Mostrar notificação de sucesso local
    // mostrarNotificacao('Lançamento removido com sucesso!');
    
    // Atualizar outras interfaces se disponíveis
    if (typeof renderizarDashboardResumo === 'function') {
      renderizarDashboardResumo();
    }
    if (typeof atualizarFiltroMesAno === 'function') {
      atualizarFiltroMesAno();
    }
    
    // Se houve erro no Google Sheets, mostrar aviso (mas não bloquear a exclusão local)
    if (webAppUrl && !sucessoSheets && lancamento.id) {
      setTimeout(() => {
        mostrarAvisoImportacao();
      }, 1000);
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
    
    if (!tipoInputs.length || !categoriaInput || !subcategoriaInput) return;
    
    // Obter tipo selecionado
    const tipoSelecionado = document.querySelector('input[name="tipo-lancamento"]:checked')?.value;
    if (!tipoSelecionado) return;
    
    // Limpar e popular categorias
    categoriaInput.innerHTML = '<option value="">Selecione uma categoria...</option>';
    subcategoriaInput.innerHTML = '<option value="">Selecione uma subcategoria...</option>';
    
    const cats = categorias[tipoSelecionado] || {};
    Object.keys(cats).forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categoriaInput.appendChild(opt);
    });
    
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
    
    const subs = (categorias[tipoSelecionado] && categorias[tipoSelecionado][categoria]) ? categorias[tipoSelecionado][categoria] : [];
    subs.forEach(sub => {
      const opt = document.createElement("option");
      opt.value = sub;
      opt.textContent = sub;
      subcategoriaInput.appendChild(opt);
    });
    
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
  const financeiroForm = document.getElementById("financeiro-form");
  if (financeiroForm) {
    financeiroForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const tipoSelecionado = document.querySelector('input[name="tipo-lancamento"]:checked');
      const categoriaInput = document.getElementById("categoria-lancamento");
      const subcategoriaInput = document.getElementById("subcategoria-lancamento");
      const descInput = document.getElementById("descricao-lancamento");
      const quantidadeInput = document.getElementById("quantidade-lancamento");
      const valorInput = document.getElementById("valor-lancamento");
      const dataInput = document.getElementById("data-lancamento");
      const submitBtn = financeiroForm.querySelector('button[type="submit"]');
      
      const tipo = tipoSelecionado?.value;
      const categoria = categoriaInput.value;
      const subcategoria = subcategoriaInput.value;
      const descricao = descInput.value.trim();
      const quantidade = parseInt(quantidadeInput.value) || 1;
      const valor = parseFloat(valorInput.value);
      const data = dataInput.value;
      
      if (tipo && categoria && subcategoria && descricao && valor > 0 && data) {
        // Feedback visual imediato - desabilitar botão e mostrar carregamento
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Adicionando...';
        
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
        
        // Feedback visual imediato - limpar campos
        document.getElementById('tipo-receita').checked = true;
        categoriaInput.value = "";
        subcategoriaInput.value = "";
        descInput.value = "";
        quantidadeInput.value = "1";
        valorInput.value = "";
        dataInput.value = "";
        atualizarCategorias();
        
        lancamentos.push(novoLancamento);
        salvarLancamentos();
        
        // Renderizar com animação para novo item
        const lista = document.getElementById("financeiro-lista");
        if (lista) {
          // Adicionar item temporário com animação
          const item = document.createElement("li");
          let tipoIcon = tipo === "receita" ? (categoria === "Vendas" ? '<i class="fas fa-shopping-cart"></i>' : '<i class="fas fa-dollar-sign"></i>') : '<i class="fas fa-credit-card"></i>';
          item.classList.add('lancamento-item', 'novo', 'sucesso');
          if (tipo === "receita") {
            if (categoria === "Vendas") {
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
                <strong>${categoria}</strong> / <em>${subcategoria}</em><br>
                <span class="lancamento-descricao">${descricao}</span>
                ${quantidade && quantidade > 1 ? `<br><small>Qtd: ${quantidade} - R$ ${(valor / quantidade).toFixed(2).replace('.', ',')} cada</small>` : ''}
              </span>
            </span>
            <span class="lancamento-valor-container">
              <span class="lancamento-valor" title="Valor unitário: R$ ${(valor / quantidade).toFixed(2).replace('.', ',')}">R$ ${valor.toFixed(2).replace('.', ',')}</span><br>
               <span class="lancamento-data">${dataFormatada}</span>
            </span>
            <button onclick="removerLancamento(${lancamentos.length - 1})" class="lancamento-btn-remover"><i class="fas fa-trash"></i></button>
          `;
          lista.insertBefore(item, lista.firstChild);
          
          // Remover classe de sucesso após animação
          setTimeout(() => {
            item.classList.remove('sucesso');
          }, 1000);
        }
        
        renderizarResumoFinanceiro();
        
        // Mostrar notificação de sucesso
        const tipoTexto = tipo === 'receita' ? 'Receita' : 'Despesa';
        mostrarNotificacaoSync(`${tipoTexto} adicionada: ${descricao}`, 'success');
        
        // Adicionar automaticamente ao Google Sheets
        if (typeof adicionarLancamentoSheets === 'function') {
          const sucesso = await adicionarLancamentoSheets(novoLancamento);
          if (sucesso && typeof mostrarNotificacaoSync === 'function') {
            // mostrarNotificacaoSync('Lançamento sincronizado', 'success');
          } else if (typeof mostrarNotificacaoSync === 'function') {
            // mostrarNotificacaoSync('Erro ao sincronizar com planilha', 'error');
          }
        }
        
        if (typeof renderizarDashboardResumo === 'function') {
          renderizarDashboardResumo();
        }
        if (typeof atualizarFiltroMesAno === 'function') {
          atualizarFiltroMesAno();
        }
        
        // Reabilitar botão
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }, 1000);
      } else {
        mostrarNotificacaoSync('Preencha todos os campos obrigatórios!', 'error');
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

  

  
  // Função para verificar status de sincronização
  function verificarStatusSincronizacao() {
    // Verificar se há URL configurada
    const webAppUrl = localStorage.getItem('googleSheetsWebAppUrl');
    if (!webAppUrl) {
      console.log('Google Sheets não configurado');
      return;
    }
    
    console.log('Google Sheets configurado');
  }
  
  // Expor função globalmente
  window.verificarStatusSincronizacao = verificarStatusSincronizacao;
  
  // Inicializar
  atualizarCategorias();
  renderizarLancamentos();
  verificarStatusSincronizacao();
});