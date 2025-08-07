// Main.js - Arquivo principal (agora apenas com código essencial)
// Todo o código foi modularizado em arquivos específicos

// Função para verificar e sincronizar se necessário
async function verificarESincronizar() {
  try {
    if (typeof verificarSincronizacaoAutomatica === 'function') {
      const estaSincronizado = await verificarSincronizacaoAutomatica();
      
      if (!estaSincronizado) {
        mostrarNotificacaoSync('Sincronizando', 'info');
        await sincronizarTudo();
      }
    }
  } catch (error) {
    console.error('Erro na verificação de sincronização:', error);
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  try {
    // Ativa apenas a aba dashboard ao iniciar
    document.querySelectorAll('.tab-section').forEach(tab => tab.classList.remove('active'));
    document.getElementById('dashboard').classList.add('active');
    
    // Inicialização com Promise.all para melhor performance
    await Promise.all([
      // Verificação automática de sincronização
      new Promise(resolve => {
        setTimeout(async () => {
          await verificarESincronizar();
          resolve();
        }, 1000);
      }),
      
      // Iniciar verificação periódica
      new Promise(resolve => {
        setTimeout(() => {
          if (typeof iniciarVerificacaoAutomatica === 'function') {
            iniciarVerificacaoAutomatica();
          }
          resolve();
        }, 2000);
      })
    ]);
    
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

// Interceptar F5 para verificar sincronização
document.addEventListener('keydown', async function(event) {
  if (event.key === 'F5') {
    event.preventDefault();
    await verificarESincronizar();
  }
});
