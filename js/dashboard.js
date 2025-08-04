// Dashboard - Visão Geral com Efeitos Visuais
document.addEventListener("DOMContentLoaded", function () {
  
  function renderizarDashboardResumo() {
    const div = document.getElementById("dashboard-resumo");
    if (!div) return;
    
    const totalProdutos = produtos.length;
    const totalItensEstoque = produtos.reduce((acc, p) => acc + p.quantidade, 0);
    const totalReceitas = lancamentos.filter(l => l.tipo === "receita").reduce((acc, l) => acc + l.valor, 0);
    const totalDespesas = lancamentos.filter(l => l.tipo === "despesa").reduce((acc, l) => acc + l.valor, 0);
    const saldo = totalReceitas - totalDespesas;
    
    let vendasMes = 0;
    const filtroMes = window.filtroMes || localStorage.getItem("filtroMes");
    const filtroAno = window.filtroAno || localStorage.getItem("filtroAno");
    if (filtroMes && filtroAno) {
      vendasMes = lancamentos.filter(l => {
        if (l.tipo === "receita" && l.categoria === "Vendas" && l.data) {
          let d;
          if (typeof l.data === 'string' && l.data.includes('/')) {
            const [dia, mes, ano] = l.data.split('/');
            d = new Date(ano, mes - 1, dia);
          } else {
            d = new Date(l.data);
          }
          if (!isNaN(d.getTime())) {
            return d.getMonth() + 1 === Number(filtroMes) && d.getFullYear() === Number(filtroAno);
          }
        }
        return false;
      }).reduce((acc, l) => acc + l.valor, 0);
    }
    
    // Cálculo do Valor Médio por Item e Total em Vendas
    const vendasTotais = lancamentos.filter(l => l.tipo === "receita" && l.categoria === "Vendas");
    const totalItensVendidos = vendasTotais.reduce((acc, l) => acc + (l.quantidade || 1), 0);
    const valorMedioItem = totalItensVendidos > 0 ? vendasTotais.reduce((acc, l) => acc + l.valor, 0) / totalItensVendidos : 0;
    const totalVendasProdutos = lancamentos.filter(l => l.tipo === "receita" && l.categoria === "Vendas" && l.subcategoria === "Produtos").reduce((acc, l) => acc + l.valor, 0);
    
    // Cálculo da Saúde Financeira (0-100)
    let saudeScore = 0;
    if (saldo > 0) saudeScore += 40;
    if (totalReceitas > totalDespesas) saudeScore += 30;
    if (vendasMes > 0 || totalReceitas > 0) saudeScore += 20;
    if (produtos.length > 0) saudeScore += 10;
    const saudeTexto = saudeScore >= 80 ? "Excelente" : saudeScore >= 60 ? "Boa" : saudeScore >= 40 ? "Regular" : "Atenção";
    
    div.innerHTML = `
    <div class="dashboard-container">
      <!-- Primeira linha: Vendas no Mês, Receitas, Despesas, Saldo -->
      <div class="dashboard-card dashboard-card-vendas" data-card="0">
        <span class="dashboard-icon">🛒</span>
        <span class="dashboard-label dashboard-label-vendas">Vendas no Mês</span>
        <span class="dashboard-value dashboard-value-vendas">R$ ${vendasMes.toFixed(2).replace('.', ',')}</span>
        <span class="dashboard-periodo">${filtroMes && filtroAno ? `Referente a ${filtroMes.toString().padStart(2, '0')}/${filtroAno}` : 'Escolha o mês'}</span>
      </div>
      <div class="dashboard-card dashboard-card-receitas" data-card="1">
        <span class="dashboard-icon">💰</span>
        <span class="dashboard-label dashboard-label-receitas">Receitas</span>
        <span class="dashboard-value dashboard-value-receitas">R$ ${totalReceitas.toFixed(2).replace('.', ',')}</span>
        <span class="dashboard-periodo">Total em vendas: R$ ${totalVendasProdutos.toFixed(2).replace('.', ',')}</span>
      </div>
      <div class="dashboard-card dashboard-card-despesas" data-card="2">
        <span class="dashboard-icon">💸</span>
        <span class="dashboard-label dashboard-label-despesas">Despesas</span>
        <span class="dashboard-value dashboard-value-despesas">R$ ${totalDespesas.toFixed(2).replace('.', ',')}</span>
      </div>
      <div class="dashboard-card dashboard-card-saldo ${saldo >= 0 ? 'dashboard-card-saldo-positivo' : 'dashboard-card-saldo-negativo'}" data-card="3">
        <span class="dashboard-icon">🧮</span>
        <span class="dashboard-label dashboard-label-saldo">Saldo</span>
        <span class="dashboard-value dashboard-value-saldo">R$ ${saldo.toFixed(2).replace('.', ',')}</span>
      </div>
      <!-- Segunda linha: Produtos, Itens em Estoque, Valor Médio por item, Saúde Financeira -->
      <div class="dashboard-card dashboard-card-produtos" data-card="4">
        <span class="dashboard-icon">📦</span>
        <span class="dashboard-label dashboard-label-produtos">Produtos</span>
        <span class="dashboard-value dashboard-value-produtos">${totalProdutos}</span>
      </div>
      <div class="dashboard-card dashboard-card-estoque" data-card="5">
        <span class="dashboard-icon">🗃️</span>
        <span class="dashboard-label dashboard-label-estoque">Itens em Estoque</span>
        <span class="dashboard-value dashboard-value-estoque">${totalItensEstoque}</span>
      </div>
      <div class="dashboard-card dashboard-card-valor-medio" data-card="6">
        <span class="dashboard-icon">💎</span>
        <span class="dashboard-label dashboard-label-valor-medio">Valor Médio por Item</span>
        <span class="dashboard-value dashboard-value-valor-medio">R$ ${valorMedioItem.toFixed(2).replace('.', ',')}</span>
        <span class="dashboard-periodo">${totalItensVendidos} itens vendidos</span>
      </div>
      <div class="dashboard-card dashboard-card-saude ${saudeScore >= 80 ? 'dashboard-card-saude-excelente' : saudeScore >= 60 ? 'dashboard-card-saude-boa' : saudeScore >= 40 ? 'dashboard-card-saude-regular' : 'dashboard-card-saude-atencao'}" data-card="7">
        <span class="dashboard-icon">💚</span>
        <span class="dashboard-label dashboard-label-saude">Saúde Financeira</span>
        <span class="dashboard-value dashboard-value-saude">${saudeScore}%</span>
        <span class="dashboard-periodo">${saudeTexto}</span>
      </div>
    </div>
  `;
  
    // Animação sequencial dos cards
    const container = div.querySelector('.dashboard-container');
    const cards = div.querySelectorAll('.dashboard-card');
    
    // Adiciona classe de animação ao container
    if (container) {
      container.classList.add('animate');
    }
    
    // Anima cards sequencialmente
    cards.forEach((card, index) => {
      card.classList.add('animate');
      setTimeout(() => {
        card.style.animation = `scaleIn 0.5s ease-out forwards`;
      }, index * 100);
    });
  }

  // Função para animar entrada do dashboard
  function animarEntradaDashboard() {
    const resumoDiv = document.getElementById('dashboard-resumo');
    if (resumoDiv) {
      resumoDiv.classList.add('animate');
    }
  }
  
  // Expor funções globalmente
  window.renderizarDashboardResumo = renderizarDashboardResumo;
  window.animarEntradaDashboard = animarEntradaDashboard;
  
  // Renderizar dashboard inicial
  renderizarDashboardResumo();
});