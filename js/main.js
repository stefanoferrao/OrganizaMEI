// Main.js - Arquivo principal (agora apenas com código essencial)
// Todo o código foi modularizado em arquivos específicos

// Função para gerar hash dos dados locais
function gerarHashDadosLocais() {
  const lancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');
  const produtos = JSON.parse(localStorage.getItem('produtos') || '[]');
  
  const dadosLocal = {
    totalFinanceiro: lancamentos.length,
    totalEstoque: produtos.length,
    idsFinanceiro: lancamentos.map(l => String(l.id || '')).filter(id => id).sort(),
    produtosEstoque: produtos.map(p => String(p.nome || '')).filter(nome => nome).sort()
  };
  
  return btoa(JSON.stringify(dadosLocal));
}

// Função para verificar se os dados estão atualizados
async function verificarDadosAtualizados() {
  const url = localStorage.getItem('googleSheetsWebAppUrl');
  
  if (!url || url.includes('*')) {
    return true;
  }
  
  try {
    const hashLocal = gerarHashDadosLocais();
    
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ 
        action: 'verificarSincronizacao',
        hashLocal: hashLocal
      })
    });
    
    const result = await response.json();
    return result.success ? result.sincronizado : true;
    
  } catch (error) {
    return true;
  }
}

// Função para acionar sincronização automática
async function acionarSincronizacaoSeNecessario() {
  // Verificar se já foi sincronizado recentemente (evitar loop)
  const ultimaVerificacao = localStorage.getItem('ultimaVerificacaoSync');
  const agora = Date.now();
  
  if (ultimaVerificacao && (agora - parseInt(ultimaVerificacao)) < 30000) {
    return; // Não verificar se foi há menos de 30 segundos
  }
  
  localStorage.setItem('ultimaVerificacaoSync', agora.toString());
  
  const dadosAtualizados = await verificarDadosAtualizados();
  
  if (!dadosAtualizados) {
    // Ativar loading manager se disponível
    if (typeof window.loadingManager !== 'undefined') {
      window.loadingManager.startSyncLoading();
    }
    
    if (typeof mostrarNotificacaoSync === 'function') {
      mostrarNotificacaoSync('Dados desatualizados - sincronizando...', 'info');
    }
    
    setTimeout(async () => {
      const btnSyncAll = document.getElementById('btn-sync-all');
      if (btnSyncAll && typeof sincronizarTudo === 'function') {
        try {
          await sincronizarTudo();
          localStorage.setItem('ultimaVerificacaoSync', Date.now().toString());
          
          // Desativar loading após sucesso
          setTimeout(() => {
            if (typeof window.loadingManager !== 'undefined') {
              window.loadingManager.stopSyncLoading();
            }
          }, 1500);
        } catch (error) {
          console.error('Erro na sincronização automática:', error);
          // Desativar loading em caso de erro
          if (typeof window.loadingManager !== 'undefined') {
            window.loadingManager.stopSyncLoading();
          }
        }
      }
    }, 2000);
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  try {
    // Ativa apenas a aba dashboard ao iniciar
    document.querySelectorAll('.tab-section').forEach(tab => tab.classList.remove('active'));
    document.getElementById('dashboard').classList.add('active');
    
    // Verificar se os dados estão atualizados após carregar a página
    setTimeout(() => {
      acionarSincronizacaoSeNecessario();
    }, 3000);
    
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

// Expor funções globalmente para integração com loading manager
window.acionarSincronizacaoSeNecessario = acionarSincronizacaoSeNecessario;
window.verificarDadosAtualizados = verificarDadosAtualizados;
window.gerarHashDadosLocais = gerarHashDadosLocais;

// F5 agora apenas recarrega a página normalmente (sem sincronização automática)
// document.addEventListener('keydown', function(event) {
//   if (event.key === 'F5') {
//     // Deixa o comportamento padrão do F5 (recarregar página)
//   }
// });
