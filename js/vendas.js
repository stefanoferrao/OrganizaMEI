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
          <span class="venda-data">${dataFormatada}</span>
        </div>
      `;

      
      lista.appendChild(li);
    });
  }


  
  // Expor função globalmente
  window.renderizarVendas = renderizarVendas;
  
  // Renderizar vendas inicial se a aba estiver ativa
  if (document.getElementById('vendas')?.classList.contains('active')) {
    renderizarVendas();
  }
});