// Gráficos - Visualizações e Relatórios
document.addEventListener("DOMContentLoaded", function () {
  let chartInstance = null;
  
  // Registrar plugin de datalabels
  if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
  }

  function renderizarGrafico(tipo) {
    const ctx = document.getElementById("graficoDinamico")?.getContext("2d");
    if (!ctx) return;
    
    if (chartInstance) {
      chartInstance.destroy();
    }

    let data = [], labels = [], label = '', chartType = "line", backgroundColors = [];

    if (tipo === "vendas") {
      const vendasPorDia = {};
      lancamentos.forEach(l => {
        if (l.tipo === "receita" && l.categoria === "Vendas" && l.data) {
          let d, dia, mes;
          if (typeof l.data === 'string' && l.data.includes('/')) {
            const [d1, m1, a1] = l.data.split('/');
            d = new Date(a1, m1 - 1, d1);
            dia = String(d1).padStart(2, '0');
            mes = String(m1).padStart(2, '0');
          } else if (typeof l.data === 'string') {
            d = new Date(l.data);
            dia = String(d.getDate()).padStart(2, '0');
            mes = String(d.getMonth() + 1).padStart(2, '0');
          } else {
            d = new Date(l.data);
            dia = String(d.getDate()).padStart(2, '0');
            mes = String(d.getMonth() + 1).padStart(2, '0');
          }
          
          // Filtra pelo mês/ano selecionado
          if (window.filtroMes && window.filtroAno) {
            if (d.getMonth() + 1 !== Number(window.filtroMes) || d.getFullYear() !== Number(window.filtroAno)) {
              return;
            }
          }
          const chave = `${dia}/${mes}`;
          vendasPorDia[chave] = (vendasPorDia[chave] || 0) + l.valor;
        }
      });
      
      // Ordenar as datas corretamente (DD/MM)
      const anoReferencia = window.filtroAno || new Date().getFullYear();
      Object.keys(vendasPorDia).sort((a, b) => {
        const [diaA, mesA] = a.split('/');
        const [diaB, mesB] = b.split('/');
        const dataA = new Date(anoReferencia, mesA - 1, diaA);
        const dataB = new Date(anoReferencia, mesB - 1, diaB);
        return dataA - dataB;
      }).forEach(k => {
        labels.push(k);
        data.push(vendasPorDia[k]);
      });
      label = "Vendas no período";
      
    } else if (tipo === "ticket") {
      const ticketPorMes = {}, qtdPorMes = {};
      lancamentos.forEach(l => {
        if (l.tipo === "receita" && l.categoria === "Vendas" && l.data) {
          let mes, ano, d;
          if (typeof l.data === 'string' && l.data.includes('/')) {
            const [dia, m, a] = l.data.split('/');
            mes = m;
            ano = a;
            d = new Date(a, m - 1, dia);
          } else {
            const [a, m] = l.data.split("-");
            mes = m;
            ano = a;
            d = new Date(l.data);
          }
          
          // Aplicar filtro de mês/ano se definido
          if (window.filtroMes && window.filtroAno) {
            if (d.getMonth() + 1 !== Number(window.filtroMes) || d.getFullYear() !== Number(window.filtroAno)) {
              return;
            }
          }
          
          const chave = `${mes}/${ano}`;
          ticketPorMes[chave] = (ticketPorMes[chave] || 0) + l.valor;

          // Extrai quantidade da descrição
          const match = l.descricao.match(/(\d+)\s*unidade/i);
          const quantidade = match ? parseInt(match[1]) : 1;
          qtdPorMes[chave] = (qtdPorMes[chave] || 0) + quantidade;
        }
      });
      Object.keys(ticketPorMes).sort().forEach(k => {
        labels.push(k);
        data.push(ticketPorMes[k] / qtdPorMes[k]);
      });
      label = "Ticket médio";
      
    } else if (tipo === "patrimonio") {
      let saldo = 0;
      const porData = {};
      
      // Filtrar lançamentos por mês/ano se definido
      let lancamentosFiltrados = lancamentos.filter(l => l.data);
      if (window.filtroMes && window.filtroAno) {
        lancamentosFiltrados = lancamentosFiltrados.filter(l => {
          let d;
          if (typeof l.data === 'string' && l.data.includes('/')) {
            const [dia, mes, ano] = l.data.split('/');
            d = new Date(ano, mes - 1, dia);
          } else {
            d = new Date(l.data);
          }
          return d.getMonth() + 1 === Number(window.filtroMes) && d.getFullYear() === Number(window.filtroAno);
        });
      }
      
      lancamentosFiltrados
        .sort((a, b) => {
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
          return dataA - dataB;
        })
        .forEach(l => {
          saldo += l.tipo === "receita" ? l.valor : -l.valor;
          const dataFormatada = typeof l.data === 'string' && l.data.includes('/') ? l.data : new Date(l.data).toLocaleDateString('pt-BR');
          porData[dataFormatada] = saldo;
        });
      Object.keys(porData).forEach(k => {
        labels.push(k);
        data.push(porData[k]);
      });
      label = "Evolução do patrimônio";
      
    } else if (tipo === "fluxo") {
      const fluxoPorMes = {};
      lancamentos.forEach(l => {
        if (l.data) {
          let mes, ano, d;
          if (typeof l.data === 'string' && l.data.includes('/')) {
            const [dia, m, a] = l.data.split('/');
            mes = m;
            ano = a;
            d = new Date(a, m - 1, dia);
          } else {
            const [a, m] = l.data.split("-");
            mes = m;
            ano = a;
            d = new Date(l.data);
          }
          
          // Aplicar filtro de mês/ano se definido
          if (window.filtroMes && window.filtroAno) {
            if (d.getMonth() + 1 !== Number(window.filtroMes) || d.getFullYear() !== Number(window.filtroAno)) {
              return;
            }
          }
          
          const chave = `${mes}/${ano}`;
          fluxoPorMes[chave] = (fluxoPorMes[chave] || 0) + (l.tipo === "receita" ? l.valor : -l.valor);
        }
      });
      Object.keys(fluxoPorMes).sort().forEach(k => {
        labels.push(k);
        data.push(fluxoPorMes[k]);
      });
      label = "Fluxo de caixa";
      
    } else if (tipo === "pizza-despesas") {
      chartType = "pie";
      const despesasPorCategoria = {};
      lancamentos.forEach(l => {
        if (l.tipo === "despesa" && l.categoria) {
          // Aplicar filtro de mês/ano se definido
          if (window.filtroMes && window.filtroAno) {
            let d;
            if (typeof l.data === 'string' && l.data.includes('/')) {
              const [dia, mes, ano] = l.data.split('/');
              d = new Date(ano, mes - 1, dia);
            } else {
              d = new Date(l.data);
            }
            if (d.getMonth() + 1 !== Number(window.filtroMes) || d.getFullYear() !== Number(window.filtroAno)) {
              return;
            }
          }
          despesasPorCategoria[l.categoria] = (despesasPorCategoria[l.categoria] || 0) + l.valor;
        }
      });
      Object.keys(despesasPorCategoria).forEach((cat, i) => {
        labels.push(cat);
        data.push(despesasPorCategoria[cat]);
        backgroundColors.push(["#e53e3e", "#3182ce", "#38a169", "#ecc94b", "#805ad5", "#ed8936", "#319795", "#d53f8c"][i % 8]);
      });
      label = "Despesas por categoria";
      
    } else if (tipo === "pizza-receitas") {
      chartType = "pie";
      const receitasPorCategoria = {};
      lancamentos.forEach(l => {
        if (l.tipo === "receita" && l.categoria) {
          // Aplicar filtro de mês/ano se definido
          if (window.filtroMes && window.filtroAno) {
            let d;
            if (typeof l.data === 'string' && l.data.includes('/')) {
              const [dia, mes, ano] = l.data.split('/');
              d = new Date(ano, mes - 1, dia);
            } else {
              d = new Date(l.data);
            }
            if (d.getMonth() + 1 !== Number(window.filtroMes) || d.getFullYear() !== Number(window.filtroAno)) {
              return;
            }
          }
          receitasPorCategoria[l.categoria] = (receitasPorCategoria[l.categoria] || 0) + l.valor;
        }
      });
      Object.keys(receitasPorCategoria).forEach((cat, i) => {
        labels.push(cat);
        data.push(receitasPorCategoria[cat]);
        backgroundColors.push(["#38a169", "#3182ce", "#e53e3e", "#ecc94b", "#805ad5", "#ed8936", "#319795", "#d53f8c"][i % 8]);
      });
      label = "Receitas por categoria";
      
    } else if (tipo === "pizza-despesas-sub") {
      chartType = "pie";
      const despesasPorSubcategoria = {};
      lancamentos.forEach(l => {
        if (l.tipo === "despesa" && l.subcategoria) {
          // Aplicar filtro de mês/ano se definido
          if (window.filtroMes && window.filtroAno) {
            let d;
            if (typeof l.data === 'string' && l.data.includes('/')) {
              const [dia, mes, ano] = l.data.split('/');
              d = new Date(ano, mes - 1, dia);
            } else {
              d = new Date(l.data);
            }
            if (d.getMonth() + 1 !== Number(window.filtroMes) || d.getFullYear() !== Number(window.filtroAno)) {
              return;
            }
          }
          const chave = `${l.categoria} - ${l.subcategoria}`;
          despesasPorSubcategoria[chave] = (despesasPorSubcategoria[chave] || 0) + l.valor;
        }
      });
      Object.keys(despesasPorSubcategoria).forEach((sub, i) => {
        labels.push(sub);
        data.push(despesasPorSubcategoria[sub]);
        backgroundColors.push(["#e53e3e", "#3182ce", "#38a169", "#ecc94b", "#805ad5", "#ed8936", "#319795", "#d53f8c"][i % 8]);
      });
      label = "Despesas por subcategoria";
      
    } else if (tipo === "pizza-receitas-sub") {
      chartType = "pie";
      const receitasPorSubcategoria = {};
      lancamentos.forEach(l => {
        if (l.tipo === "receita" && l.subcategoria) {
          // Aplicar filtro de mês/ano se definido
          if (window.filtroMes && window.filtroAno) {
            let d;
            if (typeof l.data === 'string' && l.data.includes('/')) {
              const [dia, mes, ano] = l.data.split('/');
              d = new Date(ano, mes - 1, dia);
            } else {
              d = new Date(l.data);
            }
            if (d.getMonth() + 1 !== Number(window.filtroMes) || d.getFullYear() !== Number(window.filtroAno)) {
              return;
            }
          }
          const chave = `${l.categoria} - ${l.subcategoria}`;
          receitasPorSubcategoria[chave] = (receitasPorSubcategoria[chave] || 0) + l.valor;
        }
      });
      Object.keys(receitasPorSubcategoria).forEach((sub, i) => {
        labels.push(sub);
        data.push(receitasPorSubcategoria[sub]);
        backgroundColors.push(["#38a169", "#3182ce", "#e53e3e", "#ecc94b", "#805ad5", "#ed8936", "#319795", "#d53f8c"][i % 8]);
      });
      label = "Receitas por subcategoria";
      
    } else if (tipo === "dre") {
      // DRE - Demonstrativo do Resultado do Exercício
      const canvas = document.getElementById("graficoDinamico");
      canvas.style.display = 'none';
      
      // Criar container para DRE
      let dreContainer = document.getElementById('dre-container');
      if (!dreContainer) {
        dreContainer = document.createElement('div');
        dreContainer.id = 'dre-container';
        canvas.parentNode.appendChild(dreContainer);
      }
      
      // Calcular dados do DRE
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
          return d.getMonth() + 1 === Number(window.filtroMes) && d.getFullYear() === Number(window.filtroAno);
        });
      }
      
      const receitas = filtrados.filter(l => l.tipo === 'receita');
      const despesas = filtrados.filter(l => l.tipo === 'despesa');
      
      const receitaBruta = receitas.reduce((acc, l) => acc + l.valor, 0);
      const totalDespesas = despesas.reduce((acc, l) => acc + l.valor, 0);
      const lucroLiquido = receitaBruta - totalDespesas;
      
      // Agrupar receitas por categoria
      const receitasPorCategoria = {};
      receitas.forEach(l => {
        if (!receitasPorCategoria[l.categoria]) receitasPorCategoria[l.categoria] = 0;
        receitasPorCategoria[l.categoria] += l.valor;
      });
      
      // Agrupar despesas por categoria
      const despesasPorCategoria = {};
      despesas.forEach(l => {
        if (!despesasPorCategoria[l.categoria]) despesasPorCategoria[l.categoria] = 0;
        despesasPorCategoria[l.categoria] += l.valor;
      });
      
      const periodo = window.filtroMes && window.filtroAno ? 
        `${String(window.filtroMes).padStart(2, '0')}/${window.filtroAno}` : 'Todos os períodos';
      
      dreContainer.style.display = 'block';
      dreContainer.innerHTML = `
        <div class="dre-report">
          <h3 class="dre-title">DRE - Demonstrativo do Resultado do Exercício</h3>
          <p class="dre-period">Período: ${periodo}</p>
          
          <div class="dre-section">
            <h4 class="dre-section-title">RECEITAS</h4>
            ${Object.entries(receitasPorCategoria).map(([cat, valor]) => 
              `<div class="dre-line"><span>${cat}</span><span>R$ ${valor.toFixed(2).replace('.', ',')}</span></div>`
            ).join('')}
            <div class="dre-line dre-total"><span>RECEITA BRUTA</span><span>R$ ${receitaBruta.toFixed(2).replace('.', ',')}</span></div>
          </div>
          
          <div class="dre-section">
            <h4 class="dre-section-title">DESPESAS</h4>
            ${Object.entries(despesasPorCategoria).map(([cat, valor]) => 
              `<div class="dre-line"><span>${cat}</span><span>(R$ ${valor.toFixed(2).replace('.', ',')})</span></div>`
            ).join('')}
            <div class="dre-line dre-total"><span>TOTAL DESPESAS</span><span>(R$ ${totalDespesas.toFixed(2).replace('.', ',')})</span></div>
          </div>
          
          <div class="dre-section">
            <div class="dre-line dre-result ${lucroLiquido >= 0 ? 'positive' : 'negative'}">
              <span>RESULTADO LÍQUIDO</span>
              <span>R$ ${lucroLiquido.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </div>
      `;
      
      return; // Não criar gráfico para DRE
      
    } else if (tipo === "dre-detalhado") {
      const canvas = document.getElementById("graficoDinamico");
      canvas.style.display = 'none';
      
      let dreContainer = document.getElementById('dre-container');
      if (!dreContainer) {
        dreContainer = document.createElement('div');
        dreContainer.id = 'dre-container';
        canvas.parentNode.appendChild(dreContainer);
      }
      
      const ano = window.filtroAno || new Date().getFullYear();
      const meses = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
      const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      
      // Usar categorias existentes do sistema
      const categoriasExistentes = JSON.parse(localStorage.getItem('categorias')) || {
        receita: { "Vendas": [], "Investimentos": [], "Outros": [] },
        despesa: { "Operacional": [], "Pessoal": [], "Compras": [], "Outros": [] }
      };
      
      // Inicializar dados
      const dadosPorCategoria = { receita: {}, despesa: {} };
      
      // Inicializar todas as categorias existentes
      Object.keys(categoriasExistentes.receita).forEach(cat => {
        dadosPorCategoria.receita[cat] = {};
        meses.forEach(m => dadosPorCategoria.receita[cat][m] = 0);
      });
      
      Object.keys(categoriasExistentes.despesa).forEach(cat => {
        dadosPorCategoria.despesa[cat] = {};
        meses.forEach(m => dadosPorCategoria.despesa[cat][m] = 0);
      });
      
      // Processar lançamentos
      lancamentos.forEach(l => {
        if (!l.data) return;
        let d;
        if (typeof l.data === 'string' && l.data.includes('/')) {
          const [dia, m, a] = l.data.split('/');
          d = new Date(a, m - 1, dia);
        } else {
          d = new Date(l.data);
        }
        
        if (d.getFullYear() !== Number(ano)) return;
        
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const categoria = l.categoria || 'Outros';
        
        if (l.tipo === 'receita' && dadosPorCategoria.receita[categoria]) {
          dadosPorCategoria.receita[categoria][mes] += l.valor;
        } else if (l.tipo === 'despesa' && dadosPorCategoria.despesa[categoria]) {
          dadosPorCategoria.despesa[categoria][mes] += l.valor;
        }
      });
      
      // Gerar HTML
      let html = `
        <div class="dre-detalhado">
          <h3 class="dre-title">DRE Detalhado - Ano ${ano}</h3>
          <div class="dre-table-container">
            <table class="dre-table">
              <thead>
                <tr class="dre-header">
                  <th class="dre-cell"></th>
                  ${nomesMeses.map(m => `<th class="dre-cell">${m}</th>`).join('')}
                  <th class="dre-cell">Total</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      // Receitas
      html += '<tr class="dre-section-header receitas"><td colspan="14">RECEITAS</td></tr>';
      let totalReceitasPorMes = meses.map(() => 0);
      
      Object.keys(categoriasExistentes.receita).forEach(cat => {
        html += `<tr class="dre-row"><td class="dre-cell dre-categoria">${cat}</td>`;
        let totalCategoria = 0;
        
        meses.forEach((mes, i) => {
          const valor = dadosPorCategoria.receita[cat] ? dadosPorCategoria.receita[cat][mes] : 0;
          totalReceitasPorMes[i] += valor;
          totalCategoria += valor;
          html += `<td class="dre-cell dre-receita">${formatarMoedaBR(valor)}</td>`;
        });
        
        html += `<td class="dre-cell dre-receita dre-total">${formatarMoedaBR(totalCategoria)}</td></tr>`;
      });
      
      html += '<tr class="dre-subtotal"><td class="dre-cell">Total de Receitas</td>';
      const totalReceitas = totalReceitasPorMes.reduce((a, b) => a + b, 0);
      totalReceitasPorMes.forEach(total => {
        html += `<td class="dre-cell dre-receita">${formatarMoedaBR(total)}</td>`;
      });
      html += `<td class="dre-cell dre-receita dre-total">${formatarMoedaBR(totalReceitas)}</td></tr>`;
      
      // Despesas
      html += '<tr class="dre-section-header despesas"><td colspan="14">DESPESAS</td></tr>';
      let totalDespesasPorMes = meses.map(() => 0);
      
      Object.keys(categoriasExistentes.despesa).forEach(cat => {
        html += `<tr class="dre-row"><td class="dre-cell dre-categoria">${cat}</td>`;
        let totalCategoria = 0;
        
        meses.forEach((mes, i) => {
          const valor = dadosPorCategoria.despesa[cat] ? dadosPorCategoria.despesa[cat][mes] : 0;
          totalDespesasPorMes[i] += valor;
          totalCategoria += valor;
          html += `<td class="dre-cell dre-despesa">${formatarMoedaBR(valor)}</td>`;
        });
        
        html += `<td class="dre-cell dre-despesa dre-total">${formatarMoedaBR(totalCategoria)}</td></tr>`;
      });
      
      html += '<tr class="dre-subtotal"><td class="dre-cell">Total de Despesas</td>';
      const totalDespesas = totalDespesasPorMes.reduce((a, b) => a + b, 0);
      totalDespesasPorMes.forEach(total => {
        html += `<td class="dre-cell dre-despesa">${formatarMoedaBR(total)}</td>`;
      });
      html += `<td class="dre-cell dre-despesa dre-total">${formatarMoedaBR(totalDespesas)}</td></tr>`;
      
      // Saldo
      html += '<tr class="dre-result-row"><td class="dre-cell">Saldo</td>';
      const saldoTotal = totalReceitas - totalDespesas;
      
      meses.forEach((mes, i) => {
        const saldoMes = totalReceitasPorMes[i] - totalDespesasPorMes[i];
        html += `<td class="dre-cell dre-resultado ${saldoMes >= 0 ? 'positive' : 'negative'}">${formatarMoedaBR(saldoMes)}</td>`;
      });
      
      html += `<td class="dre-cell dre-resultado dre-total ${saldoTotal >= 0 ? 'positive' : 'negative'}">${formatarMoedaBR(saldoTotal)}</td></tr>`;
      
      html += '</tbody></table></div></div>';
      dreContainer.style.display = 'block';
      dreContainer.innerHTML = html;
      
      return;
      
    } else if (tipo === "dre-detalhado-subcategorias") {
      const canvas = document.getElementById("graficoDinamico");
      canvas.style.display = 'none';
      
      let dreContainer = document.getElementById('dre-container');
      if (!dreContainer) {
        dreContainer = document.createElement('div');
        dreContainer.id = 'dre-container';
        canvas.parentNode.appendChild(dreContainer);
      }
      
      const ano = window.filtroAno || new Date().getFullYear();
      const meses = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
      const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      
      const categoriasExistentes = JSON.parse(localStorage.getItem('categorias')) || {
        receita: { "Vendas": [], "Investimentos": [], "Outros": [] },
        despesa: { "Operacional": [], "Pessoal": [], "Compras": [], "Outros": [] }
      };
      
      // Organizar dados por categoria e subcategoria
      const dadosOrganizados = { receita: {}, despesa: {} };
      
      // Processar lançamentos
      lancamentos.forEach(l => {
        if (!l.data || !l.categoria || !l.subcategoria) return;
        let d;
        if (typeof l.data === 'string' && l.data.includes('/')) {
          const [dia, m, a] = l.data.split('/');
          d = new Date(a, m - 1, dia);
        } else {
          d = new Date(l.data);
        }
        
        if (d.getFullYear() !== Number(ano)) return;
        
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        
        if (!dadosOrganizados[l.tipo][l.categoria]) {
          dadosOrganizados[l.tipo][l.categoria] = {};
        }
        if (!dadosOrganizados[l.tipo][l.categoria][l.subcategoria]) {
          dadosOrganizados[l.tipo][l.categoria][l.subcategoria] = {};
          meses.forEach(m => dadosOrganizados[l.tipo][l.categoria][l.subcategoria][m] = 0);
        }
        
        dadosOrganizados[l.tipo][l.categoria][l.subcategoria][mes] += l.valor;
      });
      
      // Gerar HTML
      let html = `
        <div class="dre-detalhado">
          <h3 class="dre-title">DRE Detalhado por Subcategorias - Ano ${ano}</h3>
          <div class="dre-table-container">
            <table class="dre-table">
              <thead>
                <tr class="dre-header">
                  <th class="dre-cell"></th>
                  ${nomesMeses.map(m => `<th class="dre-cell">${m}</th>`).join('')}
                  <th class="dre-cell">Total</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      // Receitas por categoria e subcategoria
      html += '<tr class="dre-section-header receitas"><td colspan="14">RECEITAS</td></tr>';
      let totalReceitasPorMes = meses.map(() => 0);
      
      Object.keys(dadosOrganizados.receita).sort().forEach(categoria => {
        html += `<tr class="dre-categoria-header"><td class="dre-cell dre-categoria-nome" colspan="14">${categoria}</td></tr>`;
        
        Object.keys(dadosOrganizados.receita[categoria]).sort().forEach(subcategoria => {
          html += `<tr class="dre-row"><td class="dre-cell dre-subcategoria">${subcategoria}</td>`;
          let totalSubcategoria = 0;
          
          meses.forEach((mes, i) => {
            const valor = dadosOrganizados.receita[categoria][subcategoria][mes];
            totalReceitasPorMes[i] += valor;
            totalSubcategoria += valor;
            html += `<td class="dre-cell dre-receita">${formatarMoedaBR(valor)}</td>`;
          });
          
          html += `<td class="dre-cell dre-receita dre-total">${formatarMoedaBR(totalSubcategoria)}</td></tr>`;
        });
      });
      
      html += '<tr class="dre-subtotal"><td class="dre-cell">Total de Receitas</td>';
      const totalReceitas = totalReceitasPorMes.reduce((a, b) => a + b, 0);
      totalReceitasPorMes.forEach(total => {
        html += `<td class="dre-cell dre-receita">${formatarMoedaBR(total)}</td>`;
      });
      html += `<td class="dre-cell dre-receita dre-total">${formatarMoedaBR(totalReceitas)}</td></tr>`;
      
      // Despesas por categoria e subcategoria
      html += '<tr class="dre-section-header despesas"><td colspan="14">DESPESAS</td></tr>';
      let totalDespesasPorMes = meses.map(() => 0);
      
      Object.keys(dadosOrganizados.despesa).sort().forEach(categoria => {
        html += `<tr class="dre-categoria-header"><td class="dre-cell dre-categoria-nome" colspan="14">${categoria}</td></tr>`;
        
        Object.keys(dadosOrganizados.despesa[categoria]).sort().forEach(subcategoria => {
          html += `<tr class="dre-row"><td class="dre-cell dre-subcategoria">${subcategoria}</td>`;
          let totalSubcategoria = 0;
          
          meses.forEach((mes, i) => {
            const valor = dadosOrganizados.despesa[categoria][subcategoria][mes];
            totalDespesasPorMes[i] += valor;
            totalSubcategoria += valor;
            html += `<td class="dre-cell dre-despesa">${formatarMoedaBR(valor)}</td>`;
          });
          
          html += `<td class="dre-cell dre-despesa dre-total">${formatarMoedaBR(totalSubcategoria)}</td></tr>`;
        });
      });
      
      html += '<tr class="dre-subtotal"><td class="dre-cell">Total de Despesas</td>';
      const totalDespesas = totalDespesasPorMes.reduce((a, b) => a + b, 0);
      totalDespesasPorMes.forEach(total => {
        html += `<td class="dre-cell dre-despesa">${formatarMoedaBR(total)}</td>`;
      });
      html += `<td class="dre-cell dre-despesa dre-total">${formatarMoedaBR(totalDespesas)}</td></tr>`;
      
      // Saldo
      html += '<tr class="dre-result-row"><td class="dre-cell">Saldo</td>';
      const saldoTotal = totalReceitas - totalDespesas;
      
      meses.forEach((mes, i) => {
        const saldoMes = totalReceitasPorMes[i] - totalDespesasPorMes[i];
        html += `<td class="dre-cell dre-resultado ${saldoMes >= 0 ? 'positive' : 'negative'}">${formatarMoedaBR(saldoMes)}</td>`;
      });
      
      html += `<td class="dre-cell dre-resultado dre-total ${saldoTotal >= 0 ? 'positive' : 'negative'}">${formatarMoedaBR(saldoTotal)}</td></tr>`;
      
      html += '</tbody></table></div></div>';
      dreContainer.style.display = 'block';
      dreContainer.innerHTML = html;
      
      return;
      
    } else if (tipo === "evolucao-receitas-despesas") {
      const canvas = document.getElementById("graficoDinamico");
      canvas.style.display = 'block';
      const dreContainer = document.getElementById('dre-container');
      if (dreContainer) dreContainer.style.display = 'none';
      
      const ano = window.filtroAno || new Date().getFullYear();
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const receitasPorMes = new Array(12).fill(0);
      const despesasPorMes = new Array(12).fill(0);
      
      lancamentos.forEach(l => {
        let d;
        if (typeof l.data === 'string' && l.data.includes('/')) {
          const [dia, m, a] = l.data.split('/');
          d = new Date(a, m - 1, dia);
        } else {
          d = new Date(l.data);
        }
        
        if (d.getFullYear() === Number(ano)) {
          const mesIndex = d.getMonth();
          if (l.tipo === 'receita') {
            receitasPorMes[mesIndex] += l.valor;
          } else {
            despesasPorMes[mesIndex] += l.valor;
          }
        }
      });
      
      chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: meses,
          datasets: [{
            label: 'Receitas',
            data: receitasPorMes,
            borderColor: '#17acaf',
            backgroundColor: 'rgba(23, 172, 175, 0.1)',
            tension: 0.3,
            fill: false,
            pointBackgroundColor: '#3182ce',
            pointBorderColor: '#38a169',
            pointRadius: 5,
            datalabels: {
              display: true,
              align: 'top',
              offset: 8,
              color: '#17acaf',
              font: {
                size: 10,
                weight: 'bold'
              },
              formatter: function(value) {
                return formatarMoedaBR(value);
              }
            }
          }, {
            label: 'Despesas',
            data: despesasPorMes,
            borderColor: '#e53e3e',
            backgroundColor: 'rgba(229, 62, 62, 0.1)',
            tension: 0.3,
            fill: false,
            pointBackgroundColor: '#3182ce',
            pointBorderColor: '#e53e3e',
            pointRadius: 5,
            datalabels: {
              display: true,
              align: 'bottom',
              offset: 8,
              color: '#e53e3e',
              font: {
                size: 10,
                weight: 'bold'
              },
              formatter: function(value) {
                return formatarMoedaBR(value);
              }
            }
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { labels: { color: "#e2e8f0", font: { weight: 'bold', size: 15 } } },
            title: { display: true, text: `Evolução Receitas vs Despesas - ${ano}`, color: "#e2e8f0", font: { size: 18 } },
            tooltip: {
              backgroundColor: "#232b38",
              titleColor: "#17acaf",
              bodyColor: "#e2e8f0",
              borderColor: "#3182ce",
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': ' + formatarMoedaBR(context.parsed.y);
                }
              }
            },
            datalabels: {
              display: false // Desabilitar globalmente, usar configuração por dataset
            }
          },
          scales: {
            x: {
              ticks: { color: "#e2e8f0", font: { weight: 'bold' } },
              grid: { color: "#2d3748" }
            },
            y: {
              ticks: { 
                color: "#e2e8f0", 
                font: { weight: 'bold' },
                callback: function(value) {
                  return formatarMoedaBR(value);
                }
              },
              grid: { color: "#2d3748" }
            }
          }
        }
      });
      return;
      
    } else if (tipo === "top-categorias-gastos") {
      const canvas = document.getElementById("graficoDinamico");
      canvas.style.display = 'block';
      const dreContainer = document.getElementById('dre-container');
      if (dreContainer) dreContainer.style.display = 'none';
      
      const ano = window.filtroAno || new Date().getFullYear();
      const categoriasDespesas = {};
      
      lancamentos.forEach(l => {
        if (l.tipo !== 'despesa') return;
        let d;
        if (typeof l.data === 'string' && l.data.includes('/')) {
          const [dia, m, a] = l.data.split('/');
          d = new Date(a, m - 1, dia);
        } else {
          d = new Date(l.data);
        }
        
        if (d.getFullYear() === Number(ano)) {
          if (!categoriasDespesas[l.categoria]) {
            categoriasDespesas[l.categoria] = 0;
          }
          categoriasDespesas[l.categoria] += l.valor;
        }
      });
      
      const categoriasOrdenadas = Object.entries(categoriasDespesas)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8);
      
      const labels = categoriasOrdenadas.map(([categoria]) => categoria);
      const data = categoriasOrdenadas.map(([,valor]) => valor);
      const cores = ['#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#3182ce', '#805ad5', '#d53f8c', '#718096'];
      
      chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Gastos por Categoria',
            data,
            backgroundColor: cores.slice(0, data.length),
            borderColor: cores.slice(0, data.length),
            borderWidth: 1
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: {
            legend: { display: false },
            title: { display: true, text: `Top Categorias de Gastos - ${ano}`, color: "#e2e8f0", font: { size: 18 } },
            tooltip: {
              backgroundColor: "#232b38",
              titleColor: "#17acaf",
              bodyColor: "#e2e8f0",
              borderColor: "#3182ce",
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  return formatarMoedaBR(context.parsed.x);
                }
              }
            }
          },
          scales: {
            x: {
              ticks: { 
                color: "#e2e8f0", 
                font: { weight: 'bold' },
                callback: function(value) {
                  return formatarMoedaBR(value);
                }
              },
              grid: { color: "#2d3748" }
            },
            y: {
              ticks: { color: "#e2e8f0", font: { weight: 'bold' } },
              grid: { color: "#2d3748" }
            }
          }
        }
      });
      return;
      
    } else if (tipo === "kpis-dashboard") {
      const canvas = document.getElementById("graficoDinamico");
      canvas.style.display = 'none';
      
      let kpiContainer = document.getElementById('kpi-container');
      if (!kpiContainer) {
        kpiContainer = document.createElement('div');
        kpiContainer.id = 'kpi-container';
        canvas.parentNode.appendChild(kpiContainer);
      }
      
      const ano = window.filtroAno || new Date().getFullYear();
      const mes = window.filtroMes || new Date().getMonth() + 1;
      
      let totalReceitas = 0, totalDespesas = 0, totalVendas = 0, ticketMedio = 0;
      let receitasAnoAnterior = 0, despesasAnoAnterior = 0;
      let transacoes = 0;
      
      lancamentos.forEach(l => {
        let d;
        if (typeof l.data === 'string' && l.data.includes('/')) {
          const [dia, m, a] = l.data.split('/');
          d = new Date(a, m - 1, dia);
        } else {
          d = new Date(l.data);
        }
        
        if (d.getFullYear() === Number(ano)) {
          if (l.tipo === 'receita') {
            totalReceitas += l.valor;
            if (l.categoria === 'Vendas') {
              totalVendas += l.valor;
              transacoes++;
            }
          } else {
            totalDespesas += l.valor;
          }
        } else if (d.getFullYear() === Number(ano) - 1) {
          if (l.tipo === 'receita') {
            receitasAnoAnterior += l.valor;
          } else {
            despesasAnoAnterior += l.valor;
          }
        }
      });
      
      ticketMedio = transacoes > 0 ? totalVendas / transacoes : 0;
      const saldo = totalReceitas - totalDespesas;
      const margem = totalReceitas > 0 ? ((saldo / totalReceitas) * 100) : 0;
      const crescimentoReceitas = receitasAnoAnterior > 0 ? (((totalReceitas - receitasAnoAnterior) / receitasAnoAnterior) * 100) : 0;
      const crescimentoDespesas = despesasAnoAnterior > 0 ? (((totalDespesas - despesasAnoAnterior) / despesasAnoAnterior) * 100) : 0;
      
      const html = `
        <div class="kpi-dashboard">
          <h3 class="kpi-title">Indicadores de Performance - ${ano}</h3>
          <div class="kpi-grid">
            <div class="kpi-card receitas">
              <div class="kpi-icon">💰</div>
              <div class="kpi-content">
                <h4>Receitas Totais</h4>
                <div class="kpi-value">${formatarMoedaBR(totalReceitas)}</div>
                <div class="kpi-change ${crescimentoReceitas >= 0 ? 'positive' : 'negative'}">
                  ${crescimentoReceitas >= 0 ? '↗' : '↘'} ${Math.abs(crescimentoReceitas).toFixed(1)}% vs ano anterior
                </div>
              </div>
            </div>
            
            <div class="kpi-card despesas">
              <div class="kpi-icon">💸</div>
              <div class="kpi-content">
                <h4>Despesas Totais</h4>
                <div class="kpi-value">${formatarMoedaBR(totalDespesas)}</div>
                <div class="kpi-change ${crescimentoDespesas <= 0 ? 'positive' : 'negative'}">
                  ${crescimentoDespesas >= 0 ? '↗' : '↘'} ${Math.abs(crescimentoDespesas).toFixed(1)}% vs ano anterior
                </div>
              </div>
            </div>
            
            <div class="kpi-card saldo">
              <div class="kpi-icon">${saldo >= 0 ? '📈' : '📉'}</div>
              <div class="kpi-content">
                <h4>Saldo</h4>
                <div class="kpi-value ${saldo >= 0 ? 'positive' : 'negative'}">${formatarMoedaBR(saldo)}</div>
                <div class="kpi-subtitle">Receitas - Despesas</div>
              </div>
            </div>
            
            <div class="kpi-card margem">
              <div class="kpi-icon">📊</div>
              <div class="kpi-content">
                <h4>Margem de Lucro</h4>
                <div class="kpi-value ${margem >= 0 ? 'positive' : 'negative'}">${margem.toFixed(1)}%</div>
                <div class="kpi-subtitle">Saldo / Receitas</div>
              </div>
            </div>
            
            <div class="kpi-card vendas">
              <div class="kpi-icon">🛒</div>
              <div class="kpi-content">
                <h4>Vendas</h4>
                <div class="kpi-value">${formatarMoedaBR(totalVendas)}</div>
                <div class="kpi-subtitle">${transacoes} transações</div>
              </div>
            </div>
            
            <div class="kpi-card ticket">
              <div class="kpi-icon">🎯</div>
              <div class="kpi-content">
                <h4>Ticket Médio</h4>
                <div class="kpi-value">${formatarMoedaBR(ticketMedio)}</div>
                <div class="kpi-subtitle">Por transação</div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      kpiContainer.style.display = 'block';
      kpiContainer.innerHTML = html;
      return;
    }

    // Mostrar canvas novamente para outros gráficos
    const canvas = document.getElementById("graficoDinamico");
    if (canvas) canvas.style.display = 'block';
    const dreContainer = document.getElementById('dre-container');
    if (dreContainer) dreContainer.style.display = 'none';
    const kpiContainer = document.getElementById('kpi-container');
    if (kpiContainer) kpiContainer.style.display = 'none';

    chartInstance = new Chart(ctx, {
      type: chartType,
      data: {
        labels,
        datasets: [{
          label,
          data,
          borderColor: chartType === "pie" ? "#232b38" : "#17acaf",
          backgroundColor: chartType === "pie" ? backgroundColors : "rgba(23, 172, 175, 0.18)",
          tension: 0.3,
          fill: false,
          pointBackgroundColor: "#3182ce",
          pointBorderColor: "#17acaf",
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: "#e2e8f0", font: { weight: 'bold', size: 15 } } },
          title: { display: false },
          tooltip: {
            backgroundColor: "#232b38",
            titleColor: "#17acaf",
            bodyColor: "#e2e8f0",
            borderColor: "#3182ce",
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + formatarMoedaBR(context.parsed.y);
              }
            }
          },
          datalabels: (chartType === "line" && ['vendas', 'ticket', 'patrimonio', 'fluxo'].includes(tipo)) ? {
            display: true,
            align: 'bottom',
            offset: 8,
            color: '#e2e8f0',
            font: {
              size: 11,
              weight: 'bold'
            },
            formatter: function(value) {
              return formatarMoedaBR(value);
            }
          } : false
        },
        layout: { padding: 16 },
        scales: chartType === "pie" ? {} : {
          x: {
            ticks: { color: "#e2e8f0", font: { weight: 'bold' } },
            grid: { color: "#2d3748" }
          },
          y: {
            ticks: { 
              color: "#e2e8f0", 
              font: { weight: 'bold' },
              callback: function(value) {
                return formatarMoedaBR(value);
              }
            },
            grid: { color: "#2d3748" }
          }
        },
        backgroundColor: "#232b38"
      }
    });
  }

  // Evento para trocar o gráfico
  const selectGrafico = document.getElementById("tipo-grafico");
  if (selectGrafico) {
    selectGrafico.addEventListener("change", function () {
      renderizarGrafico(this.value);
    });
  }

  // Renderiza o gráfico padrão ao abrir a aba
  if (document.getElementById("graficoDinamico")) {
    renderizarGrafico(document.getElementById("tipo-grafico")?.value || "vendas");
  }

  // Expor função globalmente
  window.renderizarGrafico = renderizarGrafico;
});