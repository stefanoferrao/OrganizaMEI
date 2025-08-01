// Main.js - Arquivo principal (agora apenas com código essencial)
// Todo o código foi modularizado em arquivos específicos

document.addEventListener("DOMContentLoaded", function () {
  // Ativa apenas a aba dashboard ao iniciar
  document.querySelectorAll('.tab-section').forEach(tab => tab.classList.remove('active'));
  document.getElementById('dashboard').classList.add('active');
  
  // Exemplo de JS para trocar o conteúdo da análise
  const tipoAnalise = document.getElementById('tipo-analise');
  if (tipoAnalise) {
    tipoAnalise.addEventListener('change', function () {
      const tipo = this.value;
      const conteudo = document.getElementById('analise-conteudo');
      if (tipo === 'vendas') {
        conteudo.innerHTML = '<p>Gráfico de vendas no período aqui.</p>';
        // Aqui você pode chamar a função que renderiza o gráfico de vendas
      } else if (tipo === 'fluxo') {
        conteudo.innerHTML = '<p>Fluxo de caixa aqui.</p>';
        // Aqui você pode chamar a função que renderiza o fluxo de caixa
      }
    });
  }
});