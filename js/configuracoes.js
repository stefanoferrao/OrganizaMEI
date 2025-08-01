// Configurações - Importação/Exportação e Configurações Gerais
document.addEventListener("DOMContentLoaded", function () {
  
  const btnImportar = document.getElementById('btn-importar-dados');
  const btnExportarTodos = document.getElementById('btn-exportar-todos');
  
  // Novo: Botão para apagar todos os dados
  let btnApagarTodos = document.getElementById('btn-apagar-todos');
  if (!btnApagarTodos) {
    const div = document.querySelector('#configuracoes .tab-section, #configuracoes > div, #configuracoes');
    if (div) {
      btnApagarTodos = document.createElement('button');
      btnApagarTodos.id = 'btn-apagar-todos';
      btnApagarTodos.className = 'config-btn';
      btnApagarTodos.style.background = '#e53e3e';
      btnApagarTodos.style.marginTop = '16px';
      btnApagarTodos.textContent = 'Apagar TODOS os dados';
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
      text: 'Esta ação é IRREVERSÍVEL!',
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
});