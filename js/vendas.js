// Vendas - Itens Vendidos
document.addEventListener("DOMContentLoaded", function () {
  
  function renderizarVendas() {
    const lista = document.getElementById("vendas-lista");
    if (!lista) return;
    
    lista.innerHTML = "";
    
    const vendas = lancamentos.filter(l => l.tipo === "receita" && l.categoria === "Vendas");
    if (vendas.length === 0) {
      lista.innerHTML = '<li class="venda-empty">Nenhuma venda registrada.</li>';
      return;
    }
    
    vendas.sort((a, b) => {
      if (!a.data && !b.data) return 0;
      if (!a.data) return 1;
      if (!b.data) return -1;
      
      let dataA, dataB;
      if (typeof a.data === 'string' && a.data.includes('/')) {
        const [dia, mes, ano] = a.data.split('/');
        dataA = new Date(ano, mes - 1, dia);
      } else {
        dataA = new Date(a.data);
      }
      
      if (typeof b.data === 'string' && b.data.includes('/')) {
        const [dia, mes, ano] = b.data.split('/');
        dataB = new Date(ano, mes - 1, dia);
      } else {
        dataB = new Date(b.data);
      }
      
      return dataB - dataA;
    });
    
    vendas.forEach((v, idx) => {
      const dataFormatada = v.data ? (typeof v.data === 'string' && v.data.includes('/') ? v.data : new Date(v.data).toLocaleDateString('pt-BR')) : '';
      const li = document.createElement('li');
      li.className = 'venda-item';
      li.innerHTML = `
        <span class="venda-icon">🛒</span>
        <div class="venda-main">
          <span class="venda-produto">${v.descricao || v.subcategoria || '-'}</span>
          <span class="venda-quantidade">${v.quantidade ? v.quantidade + ' un.' : ''}</span>
        </div>
        <div class="venda-meta">
          <span class="venda-valor">R$ ${v.valor.toFixed(2).replace('.', ',')}</span>
          <div class="venda-data-row">
            <span class="venda-data">${dataFormatada}</span>
            <span class="icon-editar-data" title="Editar data">🗓️</span>
            <div class="date-popup">
              <input type="date" value="${v.data && typeof v.data === 'string' && v.data.includes('/') ? v.data.split('/').reverse().join('-') : v.data || ''}" class="venda-data-input" />
              <div class="date-popup-actions">
                <button class="btn-salvar-data" title="Salvar">✓</button>
                <button class="btn-cancelar-data" title="Cancelar">✕</button>
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
        
        const vendaIndex = lancamentos.findIndex(l => 
          l.tipo === "receita" && 
          l.categoria === "Vendas" && 
          l.descricao === v.descricao && 
          Math.abs(l.valor - v.valor) < 0.01 && 
          l.data === v.data
        );
        
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