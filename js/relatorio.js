// Relatórios - Funcionalidades para geração de relatórios fiscais
document.addEventListener("DOMContentLoaded", function () {
  
  // Inicializar seção de relatórios
  function inicializarRelatorios() {
    renderizarRelatorios();
  }

  // Renderizar interface de relatórios
  function renderizarRelatorios() {
    const container = document.getElementById('relatorios-content');
    if (!container) return;

    const html = `
      <div class="relatorio-container">
        <div class="relatorio-header">
          <i class="fas fa-file-alt"></i>
          <h3>Relatórios Fiscais</h3>
        </div>
        
        <div class="relatorio-cards">
          <div class="relatorio-card" onclick="abrirRelatorioMEI()">
            <div class="relatorio-card-icon">
              <i class="fas fa-file-excel"></i>
            </div>
            <div class="relatorio-card-title">Relatório MEI Excel</div>
            <div class="relatorio-card-description">
              Gere um relatório completo em Excel para facilitar sua declaração anual de MEI (DASN-SIMEI).
            </div>
            <ul class="relatorio-card-features">
              <li><i class="fas fa-check"></i> Resumo executivo com indicadores</li>
              <li><i class="fas fa-check"></i> Receitas mensais organizadas</li>
              <li><i class="fas fa-check"></i> Despesas categorizadas</li>
              <li><i class="fas fa-check"></i> Dados formatados para DASN-SIMEI</li>
              <li><i class="fas fa-check"></i> Alertas sobre limite MEI</li>
            </ul>
            <div class="relatorio-card-action">
              <button class="relatorio-card-button">
                <i class="fas fa-download"></i>
                Gerar Relatório
              </button>
              <div class="relatorio-card-status disponivel">
                <i class="fas fa-check-circle"></i>
                Disponível
              </div>
            </div>
          </div>

          <div class="relatorio-card relatorio-card-disabled">
            <div class="relatorio-card-icon">
              <i class="fas fa-file-pdf"></i>
            </div>
            <div class="relatorio-card-title">Relatório DRE PDF</div>
            <div class="relatorio-card-description">
              Demonstrativo do Resultado do Exercício em formato PDF profissional para apresentações.
            </div>
            <ul class="relatorio-card-features">
              <li><i class="fas fa-clock"></i> Formatação profissional</li>
              <li><i class="fas fa-clock"></i> Gráficos integrados</li>
              <li><i class="fas fa-clock"></i> Comparativo anual</li>
              <li><i class="fas fa-clock"></i> Análise de tendências</li>
            </ul>
            <div class="relatorio-card-action">
              <button class="relatorio-card-button" disabled>
                <i class="fas fa-clock"></i>
                Em Breve
              </button>
              <div class="relatorio-card-status em-breve">
                <i class="fas fa-clock"></i>
                Em desenvolvimento
              </div>
            </div>
          </div>

          <div class="relatorio-card relatorio-card-disabled">
            <div class="relatorio-card-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="relatorio-card-title">Relatório de Performance</div>
            <div class="relatorio-card-description">
              Análise detalhada de performance do negócio com KPIs e métricas operacionais.
            </div>
            <ul class="relatorio-card-features">
              <li><i class="fas fa-clock"></i> KPIs operacionais</li>
              <li><i class="fas fa-clock"></i> Análise de crescimento</li>
              <li><i class="fas fa-clock"></i> Projeções futuras</li>
              <li><i class="fas fa-clock"></i> Benchmarks do setor</li>
            </ul>
            <div class="relatorio-card-action">
              <button class="relatorio-card-button" disabled>
                <i class="fas fa-clock"></i>
                Em Breve
              </button>
              <div class="relatorio-card-status em-breve">
                <i class="fas fa-clock"></i>
                Em desenvolvimento
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // Função para abrir relatório MEI
  function abrirRelatorioMEI() {
    if (document.body.classList.contains('page-loading')) {
      if (typeof mostrarNotificacaoSync === 'function') {
        mostrarNotificacaoSync('Aguarde o carregamento da página', 'warning');
      }
      return;
    }
    renderizarRelatorioMEI();
  }

  // Renderizar interface do relatório MEI
  function renderizarRelatorioMEI() {
    const container = document.getElementById('relatorios-content');
    if (!container) return;

    // Obter anos com dados
    const anosComDados = obterAnosComDados();
    
    if (anosComDados.length === 0) {
      container.innerHTML = `
        <div class="relatorio-mei-interface">
          <h3 class="relatorio-title">
            <i class="fas fa-file-excel"></i>
            Relatório MEI para Declaração
          </h3>
          <div class="relatorio-info" style="border-color: #e53e3e; background: rgba(229, 62, 62, 0.1);">
            <p><i class="fas fa-exclamation-triangle" style="color: #e53e3e;"></i> Nenhum dado financeiro encontrado para gerar relatório</p>
          </div>
          <button onclick="renderizarRelatorios()" class="btn-voltar">
            <i class="fas fa-arrow-left"></i> Voltar aos Relatórios
          </button>
        </div>
      `;
      return;
    }
    
    // Interface para geração do relatório
    const opcoesAnos = anosComDados.map(ano => `<option value="${ano}">${ano}</option>`).join('');
    const html = `
      <div class="relatorio-mei-interface">
        <h3 class="relatorio-title">
          <i class="fas fa-file-excel"></i>
          Relatório MEI para Declaração
        </h3>
        
        <div class="relatorio-info">
          <p><i class="fas fa-info-circle"></i> Gere um relatório completo em Excel para facilitar sua declaração de MEI</p>
        </div>
        
        <div class="relatorio-controls">
          <div class="form-group">
            <label for="ano-relatorio-mei">
              <i class="fas fa-calendar-alt"></i>
              Selecione o ano:
            </label>
            <select id="ano-relatorio-mei" class="select-ano">
              ${opcoesAnos}
            </select>
          </div>
          
          <button id="btn-gerar-relatorio-mei" class="btn-gerar-relatorio">
            <i class="fas fa-download"></i>
            Gerar Relatório Excel
          </button>
        </div>
        
        <div class="relatorio-features">
          <h4>O relatório inclui:</h4>
          <ul>
            <li><i class="fas fa-check"></i> Resumo executivo com indicadores principais</li>
            <li><i class="fas fa-check"></i> Receitas mensais organizadas por tipo</li>
            <li><i class="fas fa-check"></i> Despesas categorizadas para dedução</li>
            <li><i class="fas fa-check"></i> Dados formatados para DASN-SIMEI</li>
            <li><i class="fas fa-check"></i> Alertas sobre limite MEI (R$ 81.000/ano)</li>
            <li><i class="fas fa-check"></i> Cálculo de margem de lucro</li>
          </ul>
        </div>
        
        <button onclick="renderizarRelatorios()" class="btn-voltar">
          <i class="fas fa-arrow-left"></i> Voltar aos Relatórios
        </button>
      </div>
    `;
    
    container.innerHTML = html;
    
    // Event listener para gerar relatório
    const btnGerar = document.getElementById('btn-gerar-relatorio-mei');
    if (btnGerar) {
      btnGerar.addEventListener('click', function() {
        const ano = parseInt(document.getElementById('ano-relatorio-mei').value);
        gerarRelatorioMEIExcel(ano);
      });
    }
  }

  // Função para obter anos com dados
  function obterAnosComDados() {
    const lancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');
    const anos = new Set();
    
    lancamentos.forEach(l => {
      if (!l.data) return;
      let d;
      if (typeof l.data === 'string' && l.data.includes('/')) {
        const [dia, mes, anoData] = l.data.split('/');
        d = new Date(anoData, mes - 1, dia);
      } else {
        d = new Date(l.data);
      }
      if (!isNaN(d.getTime())) {
        anos.add(d.getFullYear());
      }
    });
    
    return Array.from(anos).sort((a, b) => b - a);
  }
  
  // Função para gerar relatório MEI Excel
  function gerarRelatorioMEIExcel(ano) {
    if (document.body.classList.contains('page-loading')) {
      if (typeof mostrarNotificacaoSync === 'function') {
        mostrarNotificacaoSync('Aguarde o carregamento da página', 'warning');
      }
      return;
    }
    
    const btn = document.getElementById('btn-gerar-relatorio-mei');
    const originalText = btn.innerHTML;
    
    // Verificar se há dados para o ano
    const lancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');
    const temDados = lancamentos.some(l => {
      if (!l.data) return false;
      let d;
      if (typeof l.data === 'string' && l.data.includes('/')) {
        const [dia, mes, anoData] = l.data.split('/');
        d = new Date(anoData, mes - 1, dia);
      } else {
        d = new Date(l.data);
      }
      return d.getFullYear() === ano;
    });
    
    if (!temDados) {
      if (typeof mostrarNotificacaoSync === 'function') {
        mostrarNotificacaoSync(`Nenhum dado encontrado para ${ano}`, 'warning');
      }
      return;
    }
    
    // Mostrar loading
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
    
    setTimeout(() => {
      try {
        const dadosRelatorio = processarDadosMEI(ano, lancamentos);
        exportarRelatorioMEI(dadosRelatorio, ano);
        
        if (typeof mostrarNotificacaoSync === 'function') {
          mostrarNotificacaoSync(`Relatório MEI ${ano} gerado com sucesso!`, 'success');
        }
      } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        if (typeof mostrarNotificacaoSync === 'function') {
          mostrarNotificacaoSync('Erro ao gerar relatório: ' + error.message, 'error');
        }
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }, 500);
  }
  
  function processarDadosMEI(ano, lancamentos) {
    const limiteAnualMEI = 81000;
    
    // Filtrar lançamentos do ano
    const lancamentosAno = lancamentos.filter(l => {
      if (!l.data) return false;
      let d;
      if (typeof l.data === 'string' && l.data.includes('/')) {
        const [dia, mes, anoData] = l.data.split('/');
        d = new Date(anoData, mes - 1, dia);
      } else {
        d = new Date(l.data);
      }
      return d.getFullYear() === ano;
    });
    
    // Processar receitas mensais
    const receitasMensais = Array(12).fill(0).map((_, i) => ({
      mes: i + 1,
      nome: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
             'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][i],
      vendas: 0,
      servicos: 0,
      outros: 0,
      total: 0
    }));
    
    // Processar despesas por categoria
    const despesasPorCategoria = {};
    
    lancamentosAno.forEach(l => {
      let d;
      if (typeof l.data === 'string' && l.data.includes('/')) {
        const [dia, mes, anoData] = l.data.split('/');
        d = new Date(anoData, mes - 1, dia);
      } else {
        d = new Date(l.data);
      }
      
      const mes = d.getMonth();
      const valor = l.valor || 0;
      
      if (l.tipo === 'receita') {
        if (l.categoria === 'Vendas') {
          if (l.subcategoria === 'Produtos') {
            receitasMensais[mes].vendas += valor;
          } else {
            receitasMensais[mes].servicos += valor;
          }
        } else {
          receitasMensais[mes].outros += valor;
        }
        receitasMensais[mes].total += valor;
      } else if (l.tipo === 'despesa') {
        const categoria = l.categoria || 'Outros';
        if (!despesasPorCategoria[categoria]) {
          despesasPorCategoria[categoria] = { total: 0, itens: [] };
        }
        despesasPorCategoria[categoria].total += valor;
        despesasPorCategoria[categoria].itens.push({
          data: l.data,
          descricao: l.descricao,
          subcategoria: l.subcategoria,
          valor: valor,
          id: l.id
        });
      }
    });
    
    // Calcular resumo anual
    const totalReceitas = receitasMensais.reduce((acc, mes) => acc + mes.total, 0);
    const totalDespesas = Object.values(despesasPorCategoria).reduce((acc, cat) => acc + cat.total, 0);
    const lucroLiquido = totalReceitas - totalDespesas;
    const percentualLimite = (totalReceitas / limiteAnualMEI) * 100;
    const margemLucro = totalReceitas > 0 ? ((lucroLiquido / totalReceitas) * 100) : 0;
    
    // Gerar alertas
    const alertas = [];
    if (percentualLimite > 80) {
      alertas.push(`Receita anual em ${percentualLimite.toFixed(1)}% do limite MEI`);
    }
    if (percentualLimite > 100) {
      alertas.push('LIMITE MEI ULTRAPASSADO! Considere migrar para ME');
    }
    if (margemLucro < 10) {
      alertas.push('Margem de lucro baixa. Revise custos e preços');
    }
    
    return {
      ano,
      receitasMensais,
      despesasPorCategoria,
      resumoAnual: {
        totalReceitas,
        totalDespesas,
        lucroLiquido,
        percentualLimite,
        margemLucro
      },
      alertas,
      limiteAnualMEI
    };
  }
  
  function exportarRelatorioMEI(dados, ano) {
    const wb = XLSX.utils.book_new();
    
    // Aba 1: Resumo Executivo
    const resumoData = [
      ['RELATÓRIO MEI - RESUMO EXECUTIVO', '', '', ''],
      ['Ano:', dados.ano, '', ''],
      ['Gerado em:', new Date().toLocaleDateString('pt-BR'), '', ''],
      ['', '', '', ''],
      ['INDICADORES PRINCIPAIS', '', '', ''],
      ['Total de Receitas:', `R$ ${dados.resumoAnual.totalReceitas.toFixed(2).replace('.', ',')}`, '', ''],
      ['Total de Despesas:', `R$ ${dados.resumoAnual.totalDespesas.toFixed(2).replace('.', ',')}`, '', ''],
      ['Lucro Líquido:', `R$ ${dados.resumoAnual.lucroLiquido.toFixed(2).replace('.', ',')}`, '', ''],
      ['', '', '', ''],
      ['LIMITE MEI', '', '', ''],
      ['Limite Anual:', `R$ ${dados.limiteAnualMEI.toFixed(2).replace('.', ',')}`, '', ''],
      ['Percentual Utilizado:', `${dados.resumoAnual.percentualLimite.toFixed(1)}%`, '', ''],
      ['Margem de Lucro:', `${dados.resumoAnual.margemLucro.toFixed(1)}%`, '', '']
    ];
    
    if (dados.alertas.length > 0) {
      resumoData.push(['', '', '', '']);
      resumoData.push(['ALERTAS', '', '', '']);
      dados.alertas.forEach(alerta => {
        resumoData.push([alerta, '', '', '']);
      });
    }
    
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
    
    // Aba 2: Receitas Mensais
    const receitasData = [
      ['MÊS', 'VENDAS', 'SERVIÇOS', 'OUTROS', 'TOTAL MENSAL'],
      ...dados.receitasMensais.map(mes => [
        mes.nome,
        mes.vendas.toFixed(2).replace('.', ','),
        mes.servicos.toFixed(2).replace('.', ','),
        mes.outros.toFixed(2).replace('.', ','),
        mes.total.toFixed(2).replace('.', ',')
      ])
    ];
    
    const totais = dados.receitasMensais.reduce((acc, mes) => ({
      vendas: acc.vendas + mes.vendas,
      servicos: acc.servicos + mes.servicos,
      outros: acc.outros + mes.outros,
      total: acc.total + mes.total
    }), { vendas: 0, servicos: 0, outros: 0, total: 0 });
    
    receitasData.push([
      'TOTAL',
      totais.vendas.toFixed(2).replace('.', ','),
      totais.servicos.toFixed(2).replace('.', ','),
      totais.outros.toFixed(2).replace('.', ','),
      totais.total.toFixed(2).replace('.', ',')
    ]);
    
    const wsReceitas = XLSX.utils.aoa_to_sheet(receitasData);
    XLSX.utils.book_append_sheet(wb, wsReceitas, 'Receitas Mensais');
    
    // Aba 3: Despesas
    const despesasData = [['CATEGORIA', 'TOTAL', 'DETALHAMENTO']];
    
    Object.entries(dados.despesasPorCategoria).forEach(([categoria, dadosCat]) => {
      despesasData.push([categoria, dadosCat.total.toFixed(2).replace('.', ','), '']);
      
      dadosCat.itens.forEach(item => {
        let dataHora = item.data;
        
        // Se tem ID, extrair data e hora do ID (formato DDMMAAAAHHMMSS)
        if (item.id && item.id.length === 14) {
          const dia = item.id.substring(0, 2);
          const mes = item.id.substring(2, 4);
          const ano = item.id.substring(4, 8);
          const hora = item.id.substring(8, 10);
          const minuto = item.id.substring(10, 12);
          dataHora = `${dia}/${mes}/${ano} - ${hora}:${minuto}`;
        } else {
          // Fallback para formato padrão
          let dataOriginal;
          if (typeof item.data === 'string' && item.data.includes('/')) {
            const [dia, mes, ano] = item.data.split('/');
            dataOriginal = new Date(ano, mes - 1, dia, 12, 0, 0);
          } else {
            dataOriginal = new Date(item.data);
          }
          const dataFormatada = dataOriginal.toLocaleDateString('pt-BR');
          const horaFormatada = dataOriginal.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          dataHora = `${dataFormatada} - ${horaFormatada}`;
        }
        
        despesasData.push([
          '',
          '',
          `${dataHora} | ${item.descricao} - R$ ${item.valor.toFixed(2).replace('.', ',')}`
        ]);
      });
      
      despesasData.push(['', '', '']);
    });
    
    const wsDespesas = XLSX.utils.aoa_to_sheet(despesasData);
    XLSX.utils.book_append_sheet(wb, wsDespesas, 'Despesas');
    
    // Aba 4: DASN-SIMEI
    const dasnData = [
      ['DADOS PARA DASN-SIMEI', '', ''],
      ['', '', ''],
      ['Receita Bruta Total:', `R$ ${dados.resumoAnual.totalReceitas.toFixed(2).replace('.', ',')}`, ''],
      ['', '', ''],
      ['RECEITAS POR TIPO:', '', ''],
      ['Venda de Mercadorias:', `R$ ${totais.vendas.toFixed(2).replace('.', ',')}`, ''],
      ['Prestação de Serviços:', `R$ ${totais.servicos.toFixed(2).replace('.', ',')}`, ''],
      ['Outras Receitas:', `R$ ${totais.outros.toFixed(2).replace('.', ',')}`, ''],
      ['', '', ''],
      ['OBSERVAÇÕES:', '', ''],
      ['- Manter comprovantes por 5 anos', '', ''],
      ['- Declarar até 31/05 do ano seguinte', '', ''],
      ['- Emitir nota fiscal quando solicitado', '', '']
    ];
    
    const wsDasn = XLSX.utils.aoa_to_sheet(dasnData);
    XLSX.utils.book_append_sheet(wb, wsDasn, 'DASN-SIMEI');
    
    // Salvar arquivo
    const nomeArquivo = `Relatorio_MEI_${ano}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`;
    XLSX.writeFile(wb, nomeArquivo);
  }

  // Expor funções globalmente
  window.inicializarRelatorios = inicializarRelatorios;
  window.renderizarRelatorios = renderizarRelatorios;
  window.abrirRelatorioMEI = abrirRelatorioMEI;
  window.gerarRelatorioMEIExcel = gerarRelatorioMEIExcel;

  // Inicializar quando a página carregar
  inicializarRelatorios();
});