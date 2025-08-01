// Filtros - Sistema de Filtros Mês/Ano
document.addEventListener("DOMContentLoaded", function () {
  
  // Filtro mês/ano persistente e funcional
  function atualizarFiltroMesAno() {
    const meses = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    const filtroMes = document.getElementById("filtro-mes");
    const filtroAno = document.getElementById("filtro-ano");
    if (!filtroMes || !filtroAno) return;
    
    filtroMes.innerHTML = "";
    filtroAno.innerHTML = "";
    
    // Descobre anos dos lançamentos
    const anos = Array.from(new Set(lancamentos.map(l => {
      if (!l.data) return "";
      if (typeof l.data === 'string' && l.data.includes('/')) {
        return l.data.split('/')[2]; // Pega o ano da data DD/MM/AAAA
      } else {
        return l.data.slice(0, 4); // Formato ISO
      }
    }).filter(a => a)));
    
    const anoAtual = new Date().getFullYear();
    if (anos.length === 0) anos.push(anoAtual.toString());
    anos.sort();
    
    meses.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      filtroMes.appendChild(opt);
    });
    
    anos.forEach(a => {
      const opt = document.createElement("option");
      opt.value = a;
      opt.textContent = a;
      filtroAno.appendChild(opt);
    });
    
    // Seleciona último mês/ano salvos
    const mesSalvo = localStorage.getItem("filtroMes") || meses[new Date().getMonth()];
    const anoSalvo = localStorage.getItem("filtroAno") || anoAtual.toString();
    filtroMes.value = mesSalvo;
    filtroAno.value = anoSalvo;
    window.filtroMes = mesSalvo;
    window.filtroAno = anoSalvo;
  }

  // Aplica filtro ao selecionar mês/ano
  const filtroMesElement = document.getElementById("filtro-mes");
  const filtroAnoElement = document.getElementById("filtro-ano");
  
  if (filtroMesElement) {
    filtroMesElement.addEventListener("change", function () {
      const mes = this.value;
      const ano = document.getElementById("filtro-ano").value;
      localStorage.setItem("filtroMes", mes);
      localStorage.setItem("filtroAno", ano);
      window.filtroMes = mes;
      window.filtroAno = ano;
      
      // Atualizar todas as seções
      if (typeof renderizarLancamentos === 'function') {
        renderizarLancamentos();
      }
      if (typeof renderizarDashboardResumo === 'function') {
        renderizarDashboardResumo();
      }
    });
  }
  
  if (filtroAnoElement) {
    filtroAnoElement.addEventListener("change", function () {
      const ano = this.value;
      const mes = document.getElementById("filtro-mes").value;
      localStorage.setItem("filtroMes", mes);
      localStorage.setItem("filtroAno", ano);
      window.filtroMes = mes;
      window.filtroAno = ano;
      
      // Atualizar todas as seções
      if (typeof renderizarLancamentos === 'function') {
        renderizarLancamentos();
      }
      if (typeof renderizarDashboardResumo === 'function') {
        renderizarDashboardResumo();
      }
    });
  }

  // Botão filtrar elimina filtro
  const btnFiltrar = document.getElementById("btn-filtrar");
  if (btnFiltrar) {
    btnFiltrar.addEventListener("click", function () {
      localStorage.removeItem("filtroMes");
      localStorage.removeItem("filtroAno");
      window.filtroMes = null;
      window.filtroAno = null;
      document.getElementById("filtro-mes").value = "";
      document.getElementById("filtro-ano").value = "";
      
      // Atualizar todas as seções
      if (typeof renderizarLancamentos === 'function') {
        renderizarLancamentos();
      }
      if (typeof renderizarDashboardResumo === 'function') {
        renderizarDashboardResumo();
      }
    });
  }

  // Expor função globalmente
  window.atualizarFiltroMesAno = atualizarFiltroMesAno;
  
  // Inicializar filtros
  atualizarFiltroMesAno();
});