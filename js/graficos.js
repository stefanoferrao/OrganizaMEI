// Gráficos - Visualizações e Relatórios
document.addEventListener("DOMContentLoaded", function () {
  let chartInstance = null;
  
  // Registrar plugin de datalabels
  if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
  }

  // Função auxiliar para verificar filtros
  function aplicarFiltroData(d) {
    // Obter filtros mais atualizados
    const filtroMes = window.filtroMes || localStorage.getItem('filtroMes');
    const filtroAno = window.filtroAno || localStorage.getItem('filtroAno');
    
    if (!filtroMes || !filtroAno) {
      console.log('Filtros não definidos, mostrando todos os dados');
      return true;
    }
    
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
    const resultado = d.getMonth() + 1 === Number(filtroMes) && d.getFullYear() === Number(filtroAno);
    return resultado;
  }

  function renderizarGrafico(tipo) {
    const ctx = document.getElementById("graficoDinamico")?.getContext("2d");
    if (!ctx) return;
    
    // Sempre recarregar os dados mais atualizados do localStorage
    const lancamentosAtualizados = JSON.parse(localStorage.getItem('lancamentos') || '[]');
    const formatarMoedaBR = window.formatarMoedaBR;
    
    // Verificar se as variáveis globais estão disponíveis
    if (!formatarMoedaBR) {
      console.error('Função formatarMoedaBR não disponível, tentando novamente em 100ms');
      setTimeout(() => renderizarGrafico(tipo), 100);
      return;
    }
    
    if (lancamentosAtualizados.length === 0) {
      console.warn('Nenhum lançamento encontrado para renderizar gráfico');
      // Continuar para renderizar gráfico vazio
    }
    
    // Atualizar variável global com dados mais recentes
    window.lancamentos = lancamentosAtualizados;
    const lancamentos = lancamentosAtualizados;
    
    // Verificar filtros atuais
    const filtroAtual = {
      mes: window.filtroMes || localStorage.getItem('filtroMes'),
      ano: window.filtroAno || localStorage.getItem('filtroAno')
    };
    

    
    if (chartInstance) {
      chartInstance.destroy();
    }

    // Ocultar todos os containers especiais
    const dreContainer = document.getElementById('dre-container');
    const kpiContainer = document.getElementById('kpi-container');
    if (dreContainer) dreContainer.style.display = 'none';
    if (kpiContainer) kpiContainer.style.display = 'none';
    
    // Mostrar canvas por padrão
    const canvas = document.getElementById("graficoDinamico");
    if (canvas) canvas.style.display = 'block';

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
          
          // Aplicar filtro
          if (!aplicarFiltroData(d)) return;
          
          const chave = `${dia}/${mes}`;
          vendasPorDia[chave] = (vendasPorDia[chave] || 0) + l.valor;
        }
      });
      
      // Ordenar as datas corretamente (DD/MM)
      const anoReferencia = window.filtroAno === "todos" ? new Date().getFullYear() : (window.filtroAno || new Date().getFullYear());
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
      const ticketPorPeriodo = {}, qtdPorPeriodo = {};
      
      // Verificar se deve ser diário (mês específico selecionado) ou mensal (filtro "Todos")
      const filtroMes = window.filtroMes || localStorage.getItem('filtroMes');
      const isDiario = filtroMes && filtroMes !== "todos";
      
      lancamentos.forEach(l => {
        if (l.tipo === "receita" && l.categoria === "Vendas" && l.data) {
          let dia, mes, ano, d;
          if (typeof l.data === 'string' && l.data.includes('/')) {
            const [d1, m1, a1] = l.data.split('/');
            dia = d1;
            mes = m1;
            ano = a1;
            d = new Date(a1, m1 - 1, d1);
          } else {
            d = new Date(l.data);
            dia = String(d.getDate()).padStart(2, '0');
            mes = String(d.getMonth() + 1).padStart(2, '0');
            ano = String(d.getFullYear());
          }
          
          // Aplicar filtro
          if (!aplicarFiltroData(d)) return;
          
          // Definir chave baseada no tipo de agrupamento
          const chave = isDiario ? `${dia}/${mes}` : `${mes}/${ano}`;
          ticketPorPeriodo[chave] = (ticketPorPeriodo[chave] || 0) + l.valor;

          // Extrai quantidade da descrição
          const match = l.descricao.match(/(\d+)\s*unidade/i);
          const quantidade = match ? parseInt(match[1]) : 1;
          qtdPorPeriodo[chave] = (qtdPorPeriodo[chave] || 0) + quantidade;
        }
      });
      
      // Ordenar as chaves corretamente
      const chavesOrdenadas = Object.keys(ticketPorPeriodo).sort((a, b) => {
        if (isDiario) {
          // Para ordenação diária (DD/MM)
          const [diaA, mesA] = a.split('/');
          const [diaB, mesB] = b.split('/');
          const anoReferencia = window.filtroAno === "todos" ? new Date().getFullYear() : (window.filtroAno || new Date().getFullYear());
          const dataA = new Date(anoReferencia, mesA - 1, diaA);
          const dataB = new Date(anoReferencia, mesB - 1, diaB);
          return dataA - dataB;
        } else {
          // Para ordenação mensal (MM/YYYY)
          return a.localeCompare(b);
        }
      });
      
      chavesOrdenadas.forEach(k => {
        labels.push(k);
        data.push(ticketPorPeriodo[k] / qtdPorPeriodo[k]);
      });
      
      label = isDiario ? "Ticket médio diário" : "Ticket médio";
      
    } else if (tipo === "patrimonio") {
      let saldo = 0;
      const porData = {};
      
      // Filtrar lançamentos
      let lancamentosFiltrados = lancamentos.filter(l => {
        if (!l.data) return false;
        let d;
        if (typeof l.data === 'string' && l.data.includes('/')) {
          const [dia, mes, ano] = l.data.split('/');
          d = new Date(ano, mes - 1, dia);
        } else {
          d = new Date(l.data);
        }
        return aplicarFiltroData(d);
      });
      
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
      const fluxoPorPeriodo = {};
      
      // Verificar se deve ser diário (mês específico selecionado) ou mensal (filtro "Todos")
      const filtroMes = window.filtroMes || localStorage.getItem('filtroMes');
      const isDiario = filtroMes && filtroMes !== "todos";
      
      lancamentos.forEach(l => {
        if (l.data) {
          let dia, mes, ano, d;
          if (typeof l.data === 'string' && l.data.includes('/')) {
            const [d1, m1, a1] = l.data.split('/');
            dia = d1;
            mes = m1;
            ano = a1;
            d = new Date(a1, m1 - 1, d1);
          } else {
            d = new Date(l.data);
            dia = String(d.getDate()).padStart(2, '0');
            mes = String(d.getMonth() + 1).padStart(2, '0');
            ano = String(d.getFullYear());
          }
          
          // Aplicar filtro
          if (!aplicarFiltroData(d)) return;
          
          // Definir chave baseada no tipo de agrupamento
          const chave = isDiario ? `${dia}/${mes}` : `${mes}/${ano}`;
          fluxoPorPeriodo[chave] = (fluxoPorPeriodo[chave] || 0) + (l.tipo === "receita" ? l.valor : -l.valor);
        }
      });
      
      // Ordenar as chaves corretamente
      const chavesOrdenadas = Object.keys(fluxoPorPeriodo).sort((a, b) => {
        if (isDiario) {
          // Para ordenação diária (DD/MM)
          const [diaA, mesA] = a.split('/');
          const [diaB, mesB] = b.split('/');
          const anoReferencia = window.filtroAno === "todos" ? new Date().getFullYear() : (window.filtroAno || new Date().getFullYear());
          const dataA = new Date(anoReferencia, mesA - 1, diaA);
          const dataB = new Date(anoReferencia, mesB - 1, diaB);
          return dataA - dataB;
        } else {
          // Para ordenação mensal (MM/YYYY)
          return a.localeCompare(b);
        }
      });
      
      chavesOrdenadas.forEach(k => {
        labels.push(k);
        data.push(fluxoPorPeriodo[k]);
      });
      
      label = isDiario ? "Fluxo de caixa diário" : "Fluxo de caixa";
      
    } else if (tipo === "pizza-despesas") {
      chartType = "pie";
      const despesasPorCategoria = {};
      lancamentos.forEach(l => {
        if (l.tipo === "despesa" && l.categoria) {
          let d;
          if (typeof l.data === 'string' && l.data.includes('/')) {
            const [dia, mes, ano] = l.data.split('/');
            d = new Date(ano, mes - 1, dia);
          } else {
            d = new Date(l.data);
          }
          
          // Aplicar filtro
          if (!aplicarFiltroData(d)) return;
          
          despesasPorCategoria[l.categoria] = (despesasPorCategoria[l.categoria] || 0) + l.valor;
        }
      });
      Object.keys(despesasPorCategoria).forEach((cat, i) => {
        const valor = despesasPorCategoria[cat];
        labels.push(`${cat} - ${formatarMoedaBR(valor)}`);
        data.push(valor);
        backgroundColors.push(["#e53e3e", "#3182ce", "#38a169", "#ecc94b", "#805ad5", "#ed8936", "#319795", "#d53f8c"][i % 8]);
      });
      label = "Despesas por categoria";
      
    } else if (tipo === "pizza-receitas") {
      chartType = "pie";
      const receitasPorCategoria = {};
      lancamentos.forEach(l => {
        if (l.tipo === "receita" && l.categoria) {
          let d;
          if (typeof l.data === 'string' && l.data.includes('/')) {
            const [dia, mes, ano] = l.data.split('/');
            d = new Date(ano, mes - 1, dia);
          } else {
            d = new Date(l.data);
          }
          
          // Aplicar filtro
          if (!aplicarFiltroData(d)) return;
          
          receitasPorCategoria[l.categoria] = (receitasPorCategoria[l.categoria] || 0) + l.valor;
        }
      });
      Object.keys(receitasPorCategoria).forEach((cat, i) => {
        const valor = receitasPorCategoria[cat];
        labels.push(`${cat} - ${formatarMoedaBR(valor)}`);
        data.push(valor);
        backgroundColors.push(["#38a169", "#3182ce", "#e53e3e", "#ecc94b", "#805ad5", "#ed8936", "#319795", "#d53f8c"][i % 8]);
      });
      label = "Receitas por categoria";
      
    } else if (tipo === "pizza-despesas-sub") {
      chartType = "pie";
      const despesasPorSubcategoria = {};
      lancamentos.forEach(l => {
        if (l.tipo === "despesa" && l.subcategoria) {
          let d;
          if (typeof l.data === 'string' && l.data.includes('/')) {
            const [dia, mes, ano] = l.data.split('/');
            d = new Date(ano, mes - 1, dia);
          } else {
            d = new Date(l.data);
          }
          
          // Aplicar filtro
          if (!aplicarFiltroData(d)) return;
          
          const chave = `${l.categoria} - ${l.subcategoria}`;
          despesasPorSubcategoria[chave] = (despesasPorSubcategoria[chave] || 0) + l.valor;
        }
      });
      Object.keys(despesasPorSubcategoria).forEach((sub, i) => {
        const valor = despesasPorSubcategoria[sub];
        labels.push(`${sub} - ${formatarMoedaBR(valor)}`);
        data.push(valor);
        backgroundColors.push(["#e53e3e", "#3182ce", "#38a169", "#ecc94b", "#805ad5", "#ed8936", "#319795", "#d53f8c"][i % 8]);
      });
      label = "Despesas por subcategoria";
      
    } else if (tipo === "pizza-receitas-sub") {
      chartType = "pie";
      const receitasPorSubcategoria = {};
      lancamentos.forEach(l => {
        if (l.tipo === "receita" && l.subcategoria) {
          let d;
          if (typeof l.data === 'string' && l.data.includes('/')) {
            const [dia, mes, ano] = l.data.split('/');
            d = new Date(ano, mes - 1, dia);
          } else {
            d = new Date(l.data);
          }
          
          // Aplicar filtro
          if (!aplicarFiltroData(d)) return;
          
          const chave = `${l.categoria} - ${l.subcategoria}`;
          receitasPorSubcategoria[chave] = (receitasPorSubcategoria[chave] || 0) + l.valor;
        }
      });
      Object.keys(receitasPorSubcategoria).forEach((sub, i) => {
        const valor = receitasPorSubcategoria[sub];
        labels.push(`${sub} - ${formatarMoedaBR(valor)}`);
        data.push(valor);
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
      let filtrados = lancamentos.filter(l => {
        if (!l.data) return false;
        let d;
        if (typeof l.data === 'string' && l.data.includes('/')) {
          const [dia, mes, ano] = l.data.split('/');
          d = new Date(ano, mes - 1, dia);
        } else {
          d = new Date(l.data);
        }
        return aplicarFiltroData(d);
      });
      
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
      
      let periodo = 'Todos os períodos';
      if (window.filtroMes && window.filtroAno) {
        if (window.filtroMes === "todos" && window.filtroAno === "todos") {
          periodo = 'Todos os períodos';
        } else if (window.filtroAno === "todos" && window.filtroMes !== "todos") {
          periodo = `Mês ${String(window.filtroMes).padStart(2, '0')} - Todos os anos`;
        } else if (window.filtroMes === "todos" && window.filtroAno !== "todos") {
          periodo = `Ano ${window.filtroAno} - Todos os meses`;
        } else {
          periodo = `${String(window.filtroMes).padStart(2, '0')}/${window.filtroAno}`;
        }
      }
      
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
      
    } else if (tipo === "top-categorias-gastos") {
      const canvas = document.getElementById("graficoDinamico");
      canvas.style.display = 'block';
      const dreContainer = document.getElementById('dre-container');
      if (dreContainer) dreContainer.style.display = 'none';
      
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
        
        // Aplicar filtro
        if (!aplicarFiltroData(d)) return;
        
        if (!categoriasDespesas[l.categoria]) {
          categoriasDespesas[l.categoria] = 0;
        }
        categoriasDespesas[l.categoria] += l.valor;
      });
      
      const categoriasOrdenadas = Object.entries(categoriasDespesas)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8);
      
      const labels = categoriasOrdenadas.map(([categoria, valor]) => `${categoria} - ${formatarMoedaBR(valor)}`);
      const data = categoriasOrdenadas.map(([,valor]) => valor);
      const cores = ['#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#3182ce', '#805ad5', '#d53f8c', '#718096'];
      
      let tituloGrafico = 'Top Categorias de Gastos';
      if (window.filtroMes === "todos" && window.filtroAno === "todos") {
        tituloGrafico += ' - Todos os períodos';
      } else if (window.filtroAno === "todos" && window.filtroMes !== "todos") {
        tituloGrafico += ` - Mês ${String(window.filtroMes).padStart(2, '0')} (Todos os anos)`;
      } else if (window.filtroMes === "todos" && window.filtroAno !== "todos") {
        tituloGrafico += ` - ${window.filtroAno}`;
      } else {
        tituloGrafico += ` - ${String(window.filtroMes).padStart(2, '0')}/${window.filtroAno}`;
      }
      
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
            datalabels: {
              display: true,
              color: '#ffffff',
              font: {
                size: 12,
                weight: 'bold'
              },
              formatter: function(value) {
                return formatarMoedaBR(value);
              },
              anchor: 'end',
              align: 'right'
            },
            title: { display: true, text: tituloGrafico, color: "#e2e8f0", font: { size: 18 } },
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
      
    } else if (tipo === "evolucao-receitas-despesas") {
      const canvas = document.getElementById("graficoDinamico");
      canvas.style.display = 'block';
      const dreContainer = document.getElementById('dre-container');
      if (dreContainer) dreContainer.style.display = 'none';
      
      // Determinar período baseado nos filtros
      let anos = [];
      if (window.filtroAno === "todos") {
        // Obter todos os anos dos dados
        anos = Array.from(new Set(lancamentos.map(l => {
          if (!l.data) return null;
          let d;
          if (typeof l.data === 'string' && l.data.includes('/')) {
            const [dia, mes, ano] = l.data.split('/');
            d = new Date(ano, mes - 1, dia);
          } else {
            d = new Date(l.data);
          }
          return d.getFullYear();
        }).filter(a => a))).sort();
      } else {
        anos = [Number(window.filtroAno) || new Date().getFullYear()];
      }
      
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
        
        // Aplicar filtro
        if (!aplicarFiltroData(d)) return;
        
        const mesIndex = d.getMonth();
        if (l.tipo === 'receita') {
          receitasPorMes[mesIndex] += l.valor;
        } else {
          despesasPorMes[mesIndex] += l.valor;
        }
      });
      
      let tituloGrafico = 'Evolução Receitas vs Despesas';
      if (window.filtroMes === "todos" && window.filtroAno === "todos") {
        tituloGrafico += ' - Todos os períodos';
      } else if (window.filtroAno === "todos" && window.filtroMes !== "todos") {
        tituloGrafico += ` - Mês ${String(window.filtroMes).padStart(2, '0')} (Todos os anos)`;
      } else if (window.filtroMes === "todos" && window.filtroAno !== "todos") {
        tituloGrafico += ` - ${window.filtroAno}`;
      } else {
        tituloGrafico += ` - ${String(window.filtroMes).padStart(2, '0')}/${window.filtroAno}`;
      }
      
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
            title: { display: true, text: tituloGrafico, color: "#e2e8f0", font: { size: 18 } },
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
      
    } else if (tipo === "dre-detalhado") {
      const canvas = document.getElementById("graficoDinamico");
      canvas.style.display = 'none';
      
      let dreContainer = document.getElementById('dre-container');
      if (!dreContainer) {
        dreContainer = document.createElement('div');
        dreContainer.id = 'dre-container';
        canvas.parentNode.appendChild(dreContainer);
      }
      
      const meses = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
      const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      
      const categoriasExistentes = JSON.parse(localStorage.getItem('categorias')) || {
        receita: { "Vendas": [], "Investimentos": [], "Outros": [] },
        despesa: { "Operacional": [], "Pessoal": [], "Compras": [], "Outros": [] }
      };
      
      const dadosPorCategoria = { receita: {}, despesa: {} };
      
      Object.keys(categoriasExistentes.receita).forEach(cat => {
        dadosPorCategoria.receita[cat] = {};
        meses.forEach(m => dadosPorCategoria.receita[cat][m] = 0);
      });
      
      Object.keys(categoriasExistentes.despesa).forEach(cat => {
        dadosPorCategoria.despesa[cat] = {};
        meses.forEach(m => dadosPorCategoria.despesa[cat][m] = 0);
      });
      
      lancamentos.forEach(l => {
        if (!l.data) return;
        let d;
        if (typeof l.data === 'string' && l.data.includes('/')) {
          const [dia, m, a] = l.data.split('/');
          d = new Date(a, m - 1, dia);
        } else {
          d = new Date(l.data);
        }
        
        if (!aplicarFiltroData(d)) return;
        
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const categoria = l.categoria || 'Outros';
        
        if (l.tipo === 'receita' && dadosPorCategoria.receita[categoria]) {
          dadosPorCategoria.receita[categoria][mes] += l.valor;
        } else if (l.tipo === 'despesa' && dadosPorCategoria.despesa[categoria]) {
          dadosPorCategoria.despesa[categoria][mes] += l.valor;
        }
      });
      
      let tituloRelatorio = 'DRE Detalhado';
      if (window.filtroMes === "todos" && window.filtroAno === "todos") {
        tituloRelatorio += ' - Todos os períodos';
      } else if (window.filtroAno === "todos" && window.filtroMes !== "todos") {
        tituloRelatorio += ` - Mês ${String(window.filtroMes).padStart(2, '0')} (Todos os anos)`;
      } else if (window.filtroMes === "todos" && window.filtroAno !== "todos") {
        tituloRelatorio += ` - Ano ${window.filtroAno}`;
      } else {
        tituloRelatorio += ` - ${String(window.filtroMes).padStart(2, '0')}/${window.filtroAno}`;
      }
      
      let html = `
        <div class="dre-detalhado">
          <h3 class="dre-title">${tituloRelatorio}</h3>
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
      
      const meses = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
      const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      
      const dadosOrganizados = { receita: {}, despesa: {} };
      
      lancamentos.forEach(l => {
        if (!l.data || !l.categoria || !l.subcategoria) return;
        let d;
        if (typeof l.data === 'string' && l.data.includes('/')) {
          const [dia, m, a] = l.data.split('/');
          d = new Date(a, m - 1, dia);
        } else {
          d = new Date(l.data);
        }
        
        if (!aplicarFiltroData(d)) return;
        
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
      
      let tituloRelatorio = 'DRE Detalhado por Subcategorias';
      if (window.filtroMes === "todos" && window.filtroAno === "todos") {
        tituloRelatorio += ' - Todos os períodos';
      } else if (window.filtroAno === "todos" && window.filtroMes !== "todos") {
        tituloRelatorio += ` - Mês ${String(window.filtroMes).padStart(2, '0')} (Todos os anos)`;
      } else if (window.filtroMes === "todos" && window.filtroAno !== "todos") {
        tituloRelatorio += ` - Ano ${window.filtroAno}`;
      } else {
        tituloRelatorio += ` - ${String(window.filtroMes).padStart(2, '0')}/${window.filtroAno}`;
      }
      
      let html = `
        <div class="dre-detalhado">
          <h3 class="dre-title">${tituloRelatorio}</h3>
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
      
    } else if (tipo === "kpis-operacionais") {
      const canvas = document.getElementById("graficoDinamico");
      canvas.style.display = 'none';
      
      let kpiContainer = document.getElementById('kpi-container');
      if (!kpiContainer) {
        kpiContainer = document.createElement('div');
        kpiContainer.id = 'kpi-container';
        kpiContainer.className = 'kpis-operacionais';
        canvas.parentNode.appendChild(kpiContainer);
      }
      
      let totalReceitas = 0, totalDespesas = 0, totalVendas = 0;
      let receitasPorCategoria = {}, despesasPorCategoria = {};
      let diasComVendasSet = new Set(), transacoes = 0;
      let produtosMaisVendidos = {}, valoresVendas = [];
      let top5Gastos = {}, totalItensVendidos = 0;
      let primeiraData = null, diasVendasMensal = new Set();
      
      lancamentos.forEach(l => {
        let d;
        if (typeof l.data === 'string' && l.data.includes('/')) {
          const [dia, m, a] = l.data.split('/');
          d = new Date(a, m - 1, dia);
        } else {
          d = new Date(l.data);
        }
        
        if (!aplicarFiltroData(d)) return;
        
        if (!primeiraData || d < primeiraData) {
          primeiraData = d;
        }
        
        if (l.tipo === 'receita') {
          totalReceitas += l.valor;
          receitasPorCategoria[l.categoria] = (receitasPorCategoria[l.categoria] || 0) + l.valor;
          if (l.categoria === 'Vendas') {
            totalVendas += l.valor;
            transacoes++;
            valoresVendas.push(l.valor);
            diasComVendasSet.add(l.data);
            
            const mesAtual = new Date().getMonth() + 1;
            const anoAtual = new Date().getFullYear();
            if (d.getMonth() + 1 === mesAtual && d.getFullYear() === anoAtual) {
              diasVendasMensal.add(d.getDate());
            }
            
            const produto = l.descricao || l.subcategoria || 'Produto';
            const quantidade = l.quantidade || 1;
            produtosMaisVendidos[produto] = (produtosMaisVendidos[produto] || 0) + quantidade;
            totalItensVendidos += quantidade;
          }
        } else {
          totalDespesas += l.valor;
          despesasPorCategoria[l.categoria] = (despesasPorCategoria[l.categoria] || 0) + l.valor;
          top5Gastos[l.categoria] = (top5Gastos[l.categoria] || 0) + l.valor;
        }
      });
      
      const saldo = totalReceitas - totalDespesas;
      const ticketMedio = transacoes > 0 ? totalVendas / transacoes : 0;
      const margem = totalReceitas > 0 ? ((saldo / totalReceitas) * 100) : 0;
      const valorMedioPorItem = totalItensVendidos > 0 ? totalVendas / totalItensVendidos : 0;
      const hoje = new Date();
      const diasOperacao = primeiraData ? Math.ceil((hoje - primeiraData) / (1000 * 60 * 60 * 24)) : 0;
      const mediaDespesasMensal = totalDespesas / 12;
      const reservaEmergencia = mediaDespesasMensal > 0 ? (saldo / mediaDespesasMensal) : 0;
      const maiorReceita = Math.max(...Object.values(receitasPorCategoria));
      const concentracaoReceitas = totalReceitas > 0 ? (maiorReceita / totalReceitas * 100) : 0;
      
      let somaQuadrados = 0;
      valoresVendas.forEach(valor => {
        somaQuadrados += Math.pow(valor - ticketMedio, 2);
      });
      const variacao = valoresVendas.length > 1 ? Math.sqrt(somaQuadrados / (valoresVendas.length - 1)) : 0;
      
      let semaforoTexto = 'Situação Boa';
      let semaforoIcon = 'fa-check-circle';
      let semaforoCor = '#38a169';
      
      if (saldo < 0) {
        semaforoTexto = 'Atenção Necessária';
        semaforoIcon = 'fa-exclamation-circle';
        semaforoCor = '#e53e3e';
      } else if (saldo < totalDespesas * 0.1) {
        semaforoTexto = 'Situação Alerta';
        semaforoIcon = 'fa-exclamation-triangle';
        semaforoCor = '#ecc94b';
      }
      
      const topProdutos = Object.entries(produtosMaisVendidos)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);
      
      const topGastos = Object.entries(top5Gastos)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);
      
      let tituloKPI = 'KPIs Operacionais';
      if (window.filtroMes === "todos" && window.filtroAno === "todos") {
        tituloKPI += ' - Todos os períodos';
      } else if (window.filtroAno === "todos" && window.filtroMes !== "todos") {
        tituloKPI += ` - Mês ${String(window.filtroMes).padStart(2, '0')} (Todos os anos)`;
      } else if (window.filtroMes === "todos" && window.filtroAno !== "todos") {
        tituloKPI += ` - Ano ${window.filtroAno}`;
      } else {
        tituloKPI += ` - ${String(window.filtroMes).padStart(2, '0')}/${window.filtroAno}`;
      }
      
      const html = `
        <h3 class="kpi-title">${tituloKPI}</h3>
        <div class="kpi-grid">
            <div class="kpi-card receitas">
              <div class="kpi-icon"><i class="fas fa-coins"></i></div>
              <div class="kpi-content">
                <h4>Receitas Totais</h4>
                <div class="kpi-value">${formatarMoedaBR(totalReceitas)}</div>
              </div>
            </div>
            
            <div class="kpi-card saldo">
              <div class="kpi-icon"><i class="fas ${saldo >= 0 ? 'fa-chart-line' : 'fa-chart-area'}"></i></div>
              <div class="kpi-content">
                <h4>Saldo</h4>
                <div class="kpi-value ${saldo >= 0 ? 'positive' : 'negative'}">${formatarMoedaBR(saldo)}</div>
                <div class="kpi-subtitle">Receitas - Despesas</div>
              </div>
            </div>
            
            <div class="kpi-card margem">
              <div class="kpi-icon"><i class="fas fa-percentage"></i></div>
              <div class="kpi-content">
                <h4>Margem de Lucro</h4>
                <div class="kpi-value ${margem >= 0 ? 'positive' : 'negative'}">${margem.toFixed(1)}%</div>
                <div class="kpi-subtitle">Saldo / Receitas</div>
              </div>
            </div>
            
            <div class="kpi-card ticket">
              <div class="kpi-icon"><i class="fas fa-bullseye"></i></div>
              <div class="kpi-content">
                <h4>Ticket Médio</h4>
                <div class="kpi-value">${formatarMoedaBR(ticketMedio)}</div>
                <div class="kpi-subtitle">${transacoes} transações</div>
              </div>
            </div>
            
            <div class="kpi-card receitas">
              <div class="kpi-icon"><i class="fas fa-chart-pie"></i></div>
              <div class="kpi-content">
                <h4>Concentração Receitas</h4>
                <div class="kpi-value">${concentracaoReceitas.toFixed(1)}%</div>
                <div class="kpi-subtitle">Maior categoria sobre total</div>
              </div>
            </div>
            
            <div class="kpi-card margem">
              <div class="kpi-icon"><i class="fas fa-shield-alt"></i></div>
              <div class="kpi-content">
                <h4>Reserva Emergência</h4>
                <div class="kpi-value ${reservaEmergencia >= 6 ? 'positive' : reservaEmergencia >= 3 ? '' : 'negative'}">${reservaEmergencia.toFixed(1)}</div>
                <div class="kpi-subtitle">Meses de cobertura</div>
              </div>
            </div>
            
            <div class="kpi-card vendas">
              <div class="kpi-icon"><i class="fas fa-calendar-check"></i></div>
              <div class="kpi-content">
                <h4>Frequência Vendas</h4>
                <div class="kpi-value">${diasComVendasSet.size}</div>
                <div class="kpi-subtitle">Dias com vendas</div>
              </div>
            </div>
            
            <div class="kpi-card ticket">
              <div class="kpi-icon"><i class="fas fa-chart-bar"></i></div>
              <div class="kpi-content">
                <h4>Variação Ticket</h4>
                <div class="kpi-value">±${formatarMoedaBR(variacao)}</div>
                <div class="kpi-subtitle">Desvio padrão</div>
              </div>
            </div>
            
            <div class="kpi-card valor-medio">
              <div class="kpi-icon"><i class="fas fa-tag"></i></div>
              <div class="kpi-content">
                <h4>Valor Médio por Item</h4>
                <div class="kpi-value">${formatarMoedaBR(valorMedioPorItem)}</div>
                <div class="kpi-subtitle">${totalItensVendidos} itens vendidos</div>
              </div>
            </div>
            
            <div class="kpi-card saldo">
              <div class="kpi-icon"><i class="fas fa-calendar-alt"></i></div>
              <div class="kpi-content">
                <h4>Dias de Operação</h4>
                <div class="kpi-value">${diasOperacao}</div>
                <div class="kpi-subtitle">Desde ${primeiraData ? primeiraData.toLocaleDateString('pt-BR') : 'N/A'}</div>
              </div>
            </div>
            
            <div class="kpi-card ${semaforoCor === '#38a169' ? 'receitas' : semaforoCor === '#ecc94b' ? 'ticket' : 'despesas'}">
              <div class="kpi-icon"><i class="fas ${semaforoIcon} kpi-semaforo" data-color="${semaforoCor}"></i></div>
              <div class="kpi-content">
                <h4>Semáforo Financeiro</h4>
                <div class="kpi-value kpi-semaforo-text" data-color="${semaforoCor}">${semaforoTexto}</div>
                <div class="kpi-subtitle">Status geral</div>
              </div>
            </div>
            
            <div class="kpi-card produtos-chart">
              <div class="kpi-content-full">
                <h4>Top Produtos Vendidos</h4>
                <div class="ranking-container">
                  ${topProdutos.length > 0 ? topProdutos.map(([produto, qtd], index) => {
                    const maxQtd = Math.max(...topProdutos.map(([,q]) => q));
                    const largura = Math.max(20, (qtd / maxQtd) * 100);
                    return `
                      <div class="ranking-item">
                        <div class="ranking-position">${index + 1}º</div>
                        <div class="ranking-produto">${produto}</div>
                        <div class="ranking-bar">
                          <div class="ranking-bar-fill" data-width="${largura}"></div>
                          <div class="ranking-value">${qtd}</div>
                        </div>
                      </div>
                    `;
                  }).join('') : '<div class="no-data">Nenhum produto vendido</div>'}
                </div>
              </div>
            </div>
            
            <div class="kpi-card produtos-chart">
              <div class="kpi-content-full">
                <h4>Maiores Gastos</h4>
                <div class="ranking-container">
                  ${topGastos.length > 0 ? topGastos.map(([categoria, valor], i) => `
                    <div class="ranking-item">
                      <div class="ranking-position">${i + 1}º</div>
                      <div class="ranking-produto">${categoria}</div>
                      <div class="ranking-bar">
                        <div class="ranking-bar-fill" data-width="${(valor / topGastos[0][1]) * 100}"></div>
                        <div class="ranking-value">${formatarMoedaBR(valor)}</div>
                      </div>
                    </div>
                  `).join('') : '<div class="no-data">Nenhum gasto registrado</div>'}
                </div>
              </div>
            </div>
          </div>
      `;
      
      kpiContainer.style.display = 'block';
      kpiContainer.innerHTML = html;
      
      // Aplicar estilos dinâmicos após renderização
      setTimeout(() => {
        // Aplicar cores do semáforo
        const semaforoIcon = kpiContainer.querySelector('.kpi-semaforo');
        const semaforoText = kpiContainer.querySelector('.kpi-semaforo-text');
        if (semaforoIcon) {
          semaforoIcon.style.color = semaforoIcon.dataset.color;
        }
        if (semaforoText) {
          semaforoText.style.color = semaforoText.dataset.color;
        }
        
        // Aplicar larguras das barras de ranking
        const barFills = kpiContainer.querySelectorAll('.ranking-bar-fill[data-width]');
        barFills.forEach(bar => {
          bar.style.width = bar.dataset.width + '%';
        });
      }, 10);
      
      return;
    }

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
    // Carregar último gráfico selecionado
    const ultimoGrafico = localStorage.getItem('ultimoGraficoSelecionado');
    if (ultimoGrafico) {
      selectGrafico.value = ultimoGrafico;
    }
    
    selectGrafico.addEventListener("change", function () {
      localStorage.setItem('ultimoGraficoSelecionado', this.value);
      renderizarGrafico(this.value);
    });
  }

  // Renderiza o gráfico padrão ao abrir a aba
  if (document.getElementById("graficoDinamico")) {
    const ultimoGrafico = localStorage.getItem('ultimoGraficoSelecionado') || "vendas";
    const selectGrafico = document.getElementById("tipo-grafico");
    if (selectGrafico) {
      selectGrafico.value = ultimoGrafico;
    }
    renderizarGrafico(ultimoGrafico);
  }

  // Expor função globalmente
  window.renderizarGrafico = renderizarGrafico;
});