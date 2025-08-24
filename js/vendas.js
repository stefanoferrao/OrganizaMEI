// Vendas - Itens Vendidos
document.addEventListener("DOMContentLoaded", function () {
  
  // Variáveis de paginação
  let paginaAtualVendas = 1;
  let itensPorPaginaVendas = window.DaisyUIPagination ? window.DaisyUIPagination.loadItemsPerPage('Vendas') : 10;
  let totalItensVendas = 0;
  
  function renderizarVendas() {
    const lista = document.getElementById("vendas-lista");
    if (!lista) return;
    
    lista.innerHTML = "";
    
    let vendas = lancamentos.filter(l => l.tipo === "receita" && l.categoria === "Vendas");
    
    // Aplicar filtros de mês/ano
    const filtroMes = window.filtroMes || localStorage.getItem("filtroMes");
    const filtroAno = window.filtroAno || localStorage.getItem("filtroAno");
    
    if (filtroMes && filtroAno) {
      vendas = vendas.filter(l => {
        if (l.data) {
          let d;
          if (typeof l.data === 'string' && l.data.includes('/')) {
            const [dia, mes, ano] = l.data.split('/');
            d = new Date(ano, mes - 1, dia);
          } else {
            d = new Date(l.data);
          }
          if (!isNaN(d.getTime())) {
            // Se ambos são "todos", mostrar todos os dados
            if (filtroMes === "todos" && filtroAno === "todos") {
              return true;
            }
            // Se apenas o ano é "todos", filtrar apenas por mês
            if (filtroAno === "todos" && filtroMes !== "todos") {
              return d.getMonth() + 1 === Number(filtroMes);
            }
            // Se apenas o mês é "todos", filtrar apenas por ano
            if (filtroMes === "todos" && filtroAno !== "todos") {
              return d.getFullYear() === Number(filtroAno);
            }
            // Filtro normal por mês e ano específicos
            return d.getMonth() + 1 === Number(filtroMes) && d.getFullYear() === Number(filtroAno);
          }
        }
        return false;
      });
    }
    
    if (vendas.length === 0) {
      lista.innerHTML = '<li class="venda-empty">Nenhuma venda registrada para o período selecionado.</li>';
      return;
    }
    
    // Mapear vendas com objetos de data para ordenação
    vendas = vendas.map((v, idx) => {
      let dataObj = null;
      if (v.data) {
        // Se a data está no formato DD/MM/AAAA
        if (v.data.includes('/')) {
          const [dia, mes, ano] = v.data.split('/');
          dataObj = new Date(ano, mes - 1, dia);
        } else {
          // Se ainda está no formato ISO
          dataObj = new Date(v.data);
        }
      }
      return {
        ...v,
        _originalIndex: idx,
        data: dataObj
      };
    });
    
    // Ordenar por data e depois por ID (igual ao financeiro)
    vendas = vendas.sort((a, b) => {
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
    
    // Atualizar total de itens
    totalItensVendas = vendas.length;
    
    // Calcular itens da página atual
    const inicio = (paginaAtualVendas - 1) * itensPorPaginaVendas;
    const fim = inicio + itensPorPaginaVendas;
    const itensPagina = vendas.slice(inicio, fim);
    
    itensPagina.forEach((v, idx) => {
      const dataFormatada = v.data ? (v.data instanceof Date ? v.data.toLocaleDateString('pt-BR') : v.data) : '';
      const li = document.createElement('li');
      li.className = 'venda-item';
      li.innerHTML = `
        <span class="venda-icon"><i class="fas fa-shopping-cart"></i></span>
        <div class="venda-main">
          <span class="venda-produto">${v.descricao || v.subcategoria || '-'}</span>
          <span class="venda-quantidade">${v.quantidade ? v.quantidade + ' un.' : ''}</span>
        </div>
        <div class="venda-meta">
          <span class="venda-valor">R$ ${v.valor.toFixed(2).replace('.', ',')}</span>
          <span class="venda-data">${dataFormatada}</span>
        </div>
      `;

      
      lista.appendChild(li);
    });
    
    renderizarPaginacaoVendas();
  }

  // Funções de paginação para vendas
  function renderizarPaginacaoVendas() {
    const paginationContainer = document.getElementById('vendas-pagination');
    const paginationInfo = document.getElementById('vendas-pagination-info');
    const paginationPages = document.getElementById('vendas-pagination-pages');
    const prevBtn = document.getElementById('vendas-pagination-prev');
    const nextBtn = document.getElementById('vendas-pagination-next');
    
    if (!paginationContainer || !paginationPages) return;
    
    // Remover classe de carregamento se existir
    paginationContainer.classList.remove('vendas-pagination-loading');
    
    const totalPaginas = Math.ceil(totalItensVendas / itensPorPaginaVendas);
    
    // Mostrar informações se houver itens
    if (paginationInfo && totalItensVendas > 0) {
      const inicio = (paginaAtualVendas - 1) * itensPorPaginaVendas + 1;
      const fim = Math.min(paginaAtualVendas * itensPorPaginaVendas, totalItensVendas);
      
      const itemsRange = document.getElementById('vendas-items-range');
      const totalItemsSpan = document.getElementById('vendas-total-items');
      
      if (itemsRange) itemsRange.textContent = `${inicio}-${fim}`;
      if (totalItemsSpan) totalItemsSpan.textContent = totalItensVendas;
      
      paginationInfo.style.display = 'block';
    } else if (paginationInfo) {
      paginationInfo.style.display = 'none';
    }
    
    // Mostrar/ocultar paginação
    if (totalPaginas <= 1) {
      paginationContainer.style.display = 'none';
      return;
    }
    
    paginationContainer.style.display = 'flex';
    paginationContainer.setAttribute('role', 'navigation');
    paginationContainer.setAttribute('aria-label', 'Navegação de páginas de vendas');
    
    // Limpar páginas existentes
    paginationPages.innerHTML = '';
    
    // Botão anterior
    prevBtn.disabled = paginaAtualVendas === 1;
    prevBtn.setAttribute('aria-label', 'Página anterior');
    prevBtn.onclick = () => {
      if (paginaAtualVendas > 1) {
        const paginationContainer = document.getElementById('vendas-pagination');
        if (paginationContainer) {
          paginationContainer.classList.add('vendas-pagination-loading');
        }
        
        paginaAtualVendas--;
        
        setTimeout(() => {
          renderizarVendas();
        }, 100);
      }
    };
    
    // Botão próximo
    nextBtn.disabled = paginaAtualVendas === totalPaginas;
    nextBtn.setAttribute('aria-label', 'Próxima página');
    nextBtn.onclick = () => {
      if (paginaAtualVendas < totalPaginas) {
        const paginationContainer = document.getElementById('vendas-pagination');
        if (paginationContainer) {
          paginationContainer.classList.add('vendas-pagination-loading');
        }
        
        paginaAtualVendas++;
        
        setTimeout(() => {
          renderizarVendas();
        }, 100);
      }
    };
    
    // Gerar botões de página (simplificado)
    const maxPaginasVisiveis = 5;
    let inicioRange = Math.max(1, paginaAtualVendas - Math.floor(maxPaginasVisiveis / 2));
    let fimRange = Math.min(totalPaginas, inicioRange + maxPaginasVisiveis - 1);
    
    if (fimRange - inicioRange + 1 < maxPaginasVisiveis) {
      inicioRange = Math.max(1, fimRange - maxPaginasVisiveis + 1);
    }
    
    // Páginas do range
    for (let i = inicioRange; i <= fimRange; i++) {
      const btn = criarBotaoPaginaVendas(i);
      paginationPages.appendChild(btn);
    }
  }
  
  function criarBotaoPaginaVendas(numeroPagina) {
    const btn = document.createElement('button');
    btn.className = `join-item btn btn-outline ${numeroPagina === paginaAtualVendas ? 'btn-active' : ''}`;
    btn.textContent = numeroPagina;
    btn.setAttribute('aria-label', `Página ${numeroPagina}`);
    btn.onclick = () => {
      // Adicionar feedback visual durante navegação
      const paginationContainer = document.getElementById('vendas-pagination');
      if (paginationContainer) {
        paginationContainer.classList.add('vendas-pagination-loading');
      }
      
      paginaAtualVendas = numeroPagina;
      
      // Pequeno delay para mostrar o feedback visual
      setTimeout(() => {
        renderizarVendas();
      }, 100);
    };
    return btn;
  }
  
  function resetarPaginacaoVendas() {
    paginaAtualVendas = 1;
  }
  
  // Configurar seletor de itens por página
  function setupPaginacaoVendas() {
    if (window.DaisyUIPagination) {
      const vendasItemsSelect = document.getElementById('vendas-items-per-page-select');
      if (vendasItemsSelect) {
        itensPorPaginaVendas = window.DaisyUIPagination.setupItemsPerPageSelect(
          'vendas-items-per-page-select',
          'Vendas',
          (newValue) => {
            itensPorPaginaVendas = newValue;
            resetarPaginacaoVendas();
            renderizarVendas();
          }
        );
      }
    }
  }
  
  // Inicializar paginação
  setupPaginacaoVendas();

  
  // Expor funções globalmente
  window.renderizarVendas = renderizarVendas;
  window.resetarPaginacaoVendas = resetarPaginacaoVendas;
  window.setupPaginacaoVendas = setupPaginacaoVendas;
  
  // Renderizar vendas inicial se a aba estiver ativa
  if (document.getElementById('vendas')?.classList.contains('active')) {
    renderizarVendas();
  }
});