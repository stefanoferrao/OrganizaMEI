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

// Função para verificar e sincronizar se necessário
async function acionarSincronizacaoSeNecessario() {
  const ultimaVerificacao = localStorage.getItem('ultimaVerificacaoSync');
  const agora = Date.now();
  
  if (ultimaVerificacao && (agora - parseInt(ultimaVerificacao)) < 30000) {
    return;
  }
  
  localStorage.setItem('ultimaVerificacaoSync', agora.toString());
  
  const dadosAtualizados = await verificarDadosAtualizados();
  
  if (!dadosAtualizados) {
    if (typeof mostrarNotificacaoSync === 'function') {
      mostrarNotificacaoSync('Dados desatualizados - sincronizando...', 'info');
    }
    
    setTimeout(async () => {
      if (typeof sincronizarTudo === 'function') {
        try {
          await sincronizarTudo();
          localStorage.setItem('ultimaVerificacaoSync', Date.now().toString());
        } catch (error) {
          console.error('Erro na sincronização automática:', error);
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
    
    // Carregar dados atualizados
    if (typeof carregarDadosAtualizados === 'function') {
      carregarDadosAtualizados();
    }
    
    // Verificar se os dados estão vazios (possível reset de cookies)
    const lancamentos = JSON.parse(localStorage.getItem('lancamentos') || '[]');
    const produtos = JSON.parse(localStorage.getItem('produtos') || '[]');
    const url = localStorage.getItem('googleSheetsWebAppUrl');
    
    if ((lancamentos.length === 0 || produtos.length === 0) && url && !url.includes('*')) {
      console.log('Dados vazios detectados, forçando sincronização...');
      if (typeof mostrarNotificacaoSync === 'function') {
        mostrarNotificacaoSync('Dados não encontrados, sincronizando...', 'info');
      }
      
      setTimeout(async () => {
        if (typeof sincronizarTudo === 'function') {
          await sincronizarTudo();
        }
      }, 2000);
    } else {
      // Verificar se os dados estão atualizados após carregar a página
      setTimeout(() => {
        acionarSincronizacaoSeNecessario();
      }, 500);
    }
    
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
