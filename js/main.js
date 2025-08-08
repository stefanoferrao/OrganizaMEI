// Main.js - Arquivo principal (agora apenas com código essencial)
// Todo o código foi modularizado em arquivos específicos

document.addEventListener("DOMContentLoaded", async function () {
  try {
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
          conteudo.textContent = 'Gráfico de vendas no período aqui.';
        } else if (tipo === 'fluxo') {
          conteudo.textContent = 'Fluxo de caixa aqui.';
        }
      });
    }
  } catch (error) {
    console.error('Erro na inicialização:', error);
  }
});

// F5 agora apenas recarrega a página normalmente (sem sincronização automática)
// document.addEventListener('keydown', function(event) {
//   if (event.key === 'F5') {
//     // Deixa o comportamento padrão do F5 (recarregar página)
//   }
// });
