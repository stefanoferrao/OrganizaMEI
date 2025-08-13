// Vendas - Itens Vendidos
document.addEventListener("DOMContentLoaded", function () {
  
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
    
    vendas.forEach((v, idx) => {
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
          <div class="venda-data-row">
            <span class="venda-data">${dataFormatada}</span>
            <span class="icon-editar-data" title="Editar data"><i class="fas fa-calendar-alt"></i></span>
            <div class="date-popup">
              <input type="date" value="${v.data && v.data instanceof Date ? v.data.toISOString().split('T')[0] : ''}" class="venda-data-input" />
              <div class="date-popup-actions">
                <button class="btn-salvar-data" title="Salvar"><i class="fas fa-check"></i></button>
                <button class="btn-cancelar-data" title="Cancelar"><i class="fas fa-times"></i></button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      const editarIcon = li.querySelector('.icon-editar-data');
      const popup = li.querySelector('.date-popup');
      const inputData = li.querySelector('.venda-data-input');
      const salvarBtn = li.querySelector('.btn-salvar-data');
      const cancelarBtn = li.querySelector('.btn-cancelar-data');
      
      // Abrir popup
      editarIcon.onclick = function (e) {
        e.stopPropagation();
        // Fechar outros popups abertos
        document.querySelectorAll('.date-popup.show').forEach(p => p.classList.remove('show'));
        popup.classList.add('show');
        inputData.focus();
      };
      
      // Salvar data
      const salvarData = function () {
        const novaData = inputData.value;
        if (!novaData) {
          alert('Por favor, selecione uma data válida.');
          return;
        }
        
        const vendaIndex = lancamentos.findIndex(l => {
          if (l.tipo !== "receita" || l.categoria !== "Vendas" || l.descricao !== v.descricao || Math.abs(l.valor - v.valor) >= 0.01) {
            return false;
          }
          
          // Comparar datas considerando os diferentes formatos
          let dataLancamento = l.data;
          let dataVenda = v.data;
          
          if (typeof dataLancamento === 'string' && dataLancamento.includes('/')) {
            const [dia, mes, ano] = dataLancamento.split('/');
            dataLancamento = new Date(ano, mes - 1, dia);
          } else if (typeof dataLancamento === 'string') {
            dataLancamento = new Date(dataLancamento);
          }
          
          if (dataVenda instanceof Date && dataLancamento instanceof Date) {
            return dataVenda.getTime() === dataLancamento.getTime();
          }
          
          return false;
        });
        
        if (vendaIndex !== -1) {
          // Converter de AAAA-MM-DD para DD/MM/AAAA
          const [ano, mes, dia] = novaData.split('-');
          lancamentos[vendaIndex].data = `${dia}/${mes}/${ano}`;
          salvarLancamentos();
          popup.classList.remove('show');
          renderizarVendas();
          if (typeof renderizarLancamentos === 'function') {
            renderizarLancamentos();
          }
          if (typeof renderizarDashboardResumo === 'function') {
            renderizarDashboardResumo();
          }
        } else {
          alert('Erro: não foi possível encontrar a venda para atualizar.');
        }
      };
      
      salvarBtn.onclick = salvarData;
      
      // Cancelar edição
      cancelarBtn.onclick = function () {
        popup.classList.remove('show');
      };
      
      // Salvar com Enter
      inputData.onkeydown = function (e) {
        if (e.key === 'Enter') {
          salvarData();
        } else if (e.key === 'Escape') {
          popup.classList.remove('show');
        }
      };
      
      lista.appendChild(li);
    });
  }

  // Fechar popups ao clicar fora
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.date-popup') && !e.target.closest('.icon-editar-data')) {
      document.querySelectorAll('.date-popup.show').forEach(popup => {
        popup.classList.remove('show');
      });
    }
  });
  
  // Expor função globalmente
  window.renderizarVendas = renderizarVendas;
  
  // Renderizar vendas inicial se a aba estiver ativa
  if (document.getElementById('vendas')?.classList.contains('active')) {
    renderizarVendas();
  }
});