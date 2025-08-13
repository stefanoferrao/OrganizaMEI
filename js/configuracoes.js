// Configurações - Importação/Exportação e Configurações Gerais
document.addEventListener("DOMContentLoaded", function () {
  
  // Sistema de Guias de Configurações
  function initConfigTabs() {
    const tabs = document.querySelectorAll('.config-tab');
    const contents = document.querySelectorAll('.config-tab-content');
    
    // Carregar guia salva ou usar 'geral' como padrão
    const savedTab = localStorage.getItem('activeConfigTab') || 'geral';
    switchConfigTab(savedTab);
    
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        switchConfigTab(tabId);
        localStorage.setItem('activeConfigTab', tabId);
      });
    });
    
    function switchConfigTab(tabId) {
      // Remover classe active de todas as guias e conteúdos
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      
      // Ativar guia e conteúdo selecionados
      const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
      const activeContent = document.getElementById(`config-${tabId}`);
      
      if (activeTab && activeContent) {
        activeTab.classList.add('active');
        activeContent.classList.add('active');
      }
    }
  }
  
  // Inicializar sistema de guias
  initConfigTabs();
  
  // Função para mostrar README em popup
  async function mostrarReadme() {
    try {
      const response = await fetch('docs/README.md');
      const readmeContent = await response.text();
      
      // Converter markdown para HTML
      const htmlContent = readmeContent
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/### (.*?)\n/g, '<h3>$1</h3>')
        .replace(/## (.*?)\n/g, '<h2>$1</h2>')
        .replace(/# (.*?)\n/g, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\`(.*?)\`/g, '<code>$1</code>')
        .replace(/\* (.*?)\n/g, '<li>$1</li>')
        .replace(/---\n/g, '<hr>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
      
      Swal.fire({
        title: 'OrganizaMEI - Documentação Completa',
        html: `<div class="readme-content">${htmlContent}</div>`,
        width: '90%',
        showCloseButton: true,
        showConfirmButton: false,
        background: '#232b38',
        color: '#e2e8f0',
        customClass: {
          popup: 'readme-popup'
        }
      });
    } catch (error) {
      console.error('Erro ao carregar README:', error);
      Swal.fire({
        title: 'Erro',
        text: 'Não foi possível carregar a documentação.',
        icon: 'error',
        background: '#232b38',
        color: '#e2e8f0'
      });
    }
  }
  
  // Adicionar event listener ao botão README
  const btnReadme = document.getElementById('btn-readme');
  if (btnReadme) {
    btnReadme.onclick = async function(e) {
      e.preventDefault();
      await mostrarReadme();
    };
  }
  
  // Verificar status do estoque quando a página carregar
  if (typeof atualizarStatusEstoque === 'function') {
    setTimeout(atualizarStatusEstoque, 1500);
  }
  
  // Função para adicionar novas guias programaticamente (para futuras implementações)
  window.addConfigTab = function(id, title, icon, content) {
    const tabsContainer = document.querySelector('.config-tabs');
    const contentContainer = document.querySelector('.config-content');
    
    if (tabsContainer && contentContainer) {
      // Criar nova guia
      const newTab = document.createElement('button');
      newTab.className = 'config-tab';
      newTab.setAttribute('data-tab', id);
      newTab.innerHTML = `<i class="${icon}"></i> ${title}`;
      tabsContainer.appendChild(newTab);
      
      // Criar novo conteúdo
      const newContent = document.createElement('div');
      newContent.id = `config-${id}`;
      newContent.className = 'config-tab-content';
      newContent.innerHTML = content;
      contentContainer.appendChild(newContent);
      
      // Reinicializar sistema de guias
      initConfigTabs();
    }
  };
  
  const btnImportar = document.getElementById('btn-importar-dados');
  const btnExportarTodos = document.getElementById('btn-exportar-todos');
  
  // Novo: Botão para apagar todos os dados
  let btnApagarTodos = document.getElementById('btn-apagar-todos');
  if (!btnApagarTodos) {
    const div = document.querySelector('.configuracoes-container');
    if (div) {
      btnApagarTodos = document.createElement('button');
      btnApagarTodos.id = 'btn-apagar-todos';
      btnApagarTodos.className = 'config-btn';
      btnApagarTodos.style.background = '#e53e3e';
      btnApagarTodos.style.marginTop = '16px';
      btnApagarTodos.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: #fff; margin-right: 8px !important;"></i> Apagar TODOS os dados desse dispositivo';
      div.appendChild(btnApagarTodos);
    }
  }

  if (btnImportar) btnImportar.onclick = function () {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = function (e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (evt) {
        try {
          const dados = JSON.parse(evt.target.result);
          if (confirm('Tem certeza que deseja importar e substituir TODOS os dados atuais?')) {
            if (dados.produtos) localStorage.setItem('produtos', JSON.stringify(dados.produtos));
            if (dados.lancamentos) localStorage.setItem('lancamentos', JSON.stringify(dados.lancamentos));
            if (dados.categorias) localStorage.setItem('categorias', JSON.stringify(dados.categorias));
            alert('Dados importados com sucesso! A página será recarregada.');
            location.reload();
          }
        } catch (err) {
          alert('Arquivo inválido!');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  if (btnExportarTodos) btnExportarTodos.onclick = function () {
    const dados = {
      produtos: JSON.parse(localStorage.getItem('produtos') || '[]'),
      lancamentos: JSON.parse(localStorage.getItem('lancamentos') || '[]'),
      categorias: JSON.parse(localStorage.getItem('categorias') || '{}')
    };
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dados-todos-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (btnApagarTodos) btnApagarTodos.onclick = function () {
    Swal.fire({
      title: 'Apagar TODOS os dados?',
      text: 'Esta ação é IRREVERSÍVEL! Os dados serão apagados do CACHE da página, e NÃO do banco de dados',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e53e3e',
      cancelButtonColor: '#4a5568',
      confirmButtonText: 'Sim, apagar tudo!',
      cancelButtonText: 'Cancelar',
      background: '#1a202c',
      color: '#e2e8f0'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Confirmação final',
          text: 'Deseja realmente apagar TODOS os dados? Esta ação não pode ser desfeita.',
          icon: 'error',
          showCancelButton: true,
          confirmButtonColor: '#e53e3e',
          cancelButtonColor: '#4a5568',
          confirmButtonText: 'APAGAR TUDO',
          cancelButtonText: 'Cancelar',
          background: '#1a202c',
          color: '#e2e8f0'
        }).then((finalResult) => {
          if (finalResult.isConfirmed) {
            localStorage.removeItem('produtos');
            localStorage.removeItem('lancamentos');
            localStorage.removeItem('categorias');
            Swal.fire({
              title: 'Dados apagados!',
              text: 'Todos os dados foram removidos. A página será recarregada.',
              icon: 'success',
              confirmButtonColor: '#38a169',
              background: '#1a202c',
              color: '#e2e8f0'
            }).then(() => {
              location.reload();
            });
          }
        });
      }
    });
  };
  
  // Exemplo de como adicionar uma nova guia (descomente para testar)
  // setTimeout(() => {
  //   window.addConfigTab('temas', 'Temas', 'fas fa-palette', `
  //     <div class="configuracoes-container">
  //       <h3><i class="fas fa-palette" style="color: #17acaf;"></i> Configurações de Tema</h3>
  //       <p style="color: #a0aec0; text-align: center;">Funcionalidade em desenvolvimento...</p>
  //     </div>
  //   `);
  // }, 1000);
});