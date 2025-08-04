// Categorias - Gerenciamento de Categorias e Subcategorias
document.addEventListener("DOMContentLoaded", function () {
  
  // Interface de categorias
  function renderizarListaCategorias() {
    const div = document.getElementById("lista-categorias");
    if (!div) return;
    
    let html = "";
    ["receita", "despesa"].forEach(tipo => {
      html += `<h3 class='cat-titulo'>${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</h3>`;
      // Campo de adição de categoria logo abaixo do título
      html += `<div class='cat-add-div'><input type='text' id='add-cat-${tipo}' placeholder='Nova categoria...' class='cat-add-input'><button onclick="adicionarCategoria('${tipo}')">Adicionar</button></div>`;
      Object.keys(categorias[tipo]).forEach(cat => {
        const subs = categorias[tipo][cat];
        html += `
          <div class="cat-card" id="cat-${tipo}-${cat}">
            <div class="cat-header">
              <span class="cat-nome">${cat}</span>
              <span class="cat-sub-count">${subs.length} subcategorias</span>
              <div>
                <button class="cat-btn-editar" title="Editar" onclick="editarCategoria('${tipo}','${cat}')">✏️</button>
                <button class="cat-btn-remover" title="Remover" onclick="removerCategoria('${tipo}','${cat}')"><span class="cat-icon-remover">&#128465;</span></button>
              </div>
            </div>
            <ul class="cat-sub-lista">
              ${subs.map(sub => `
                <li class="cat-sub-item" id="sub-${tipo}-${cat}-${sub}">
                  <span class="cat-sub-nome">${sub}</span>
                  <div>
                    <button class="cat-btn-editar-sub" title="Editar" onclick="editarSubcategoria('${tipo}','${cat}','${sub}')">✏️</button>
                    <button class="cat-btn-remover-sub" title="Remover" onclick="removerSubcategoria('${tipo}','${cat}','${sub}')">🗑️</button>
                  </div>
                </li>
              `).join("")}
            </ul>
          </div>
        `;
      });
    });
    div.innerHTML = html;
    
    // Botão + para adicionar subcategoria
    Object.keys(categorias).forEach(tipo => {
      Object.keys(categorias[tipo]).forEach(cat => {
        const subList = document.getElementById(`cat-${tipo}-${cat}`);
        if (subList) {
          const addSubDiv = document.createElement('div');
          addSubDiv.innerHTML = `<button class='btn-add-sub-plus' onclick="abrirPopupSubcategoria('${tipo}', '${cat}')">+</button>`;
          addSubDiv.classList.add('add-sub-div');
          subList.appendChild(addSubDiv);
        }
      });
    });
  }

  // Adicionar categoria
  window.adicionarCategoria = function (tipo) {
    const input = document.getElementById('add-cat-' + tipo);
    const nome = input.value.trim();
    if (!nome) return alert('Digite o nome da categoria.');
    if (categorias[tipo][nome]) return alert('Categoria já existe!');
    categorias[tipo][nome] = [];
    salvarCategorias();
    renderizarListaCategorias();
    atualizarCategorias();
    atualizarCategoriaSubcategoriaForm();
  }

  // Abrir popup para adicionar subcategoria
  window.abrirPopupSubcategoria = function (tipo, cat) {
    Swal.fire({
      title: 'Nova Subcategoria',
      text: `Adicionar subcategoria para: ${cat}`,
      input: 'text',
      inputPlaceholder: 'Nome da subcategoria...',
      showCancelButton: true,
      confirmButtonText: 'Adicionar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#38a169',
      cancelButtonColor: '#4a5568',
      background: '#232b38',
      color: '#e2e8f0',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Digite o nome da subcategoria!';
        }
        if (categorias[tipo][cat].includes(value.trim())) {
          return 'Subcategoria já existe!';
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const nome = result.value.trim();
        categorias[tipo][cat].push(nome);
        salvarCategorias();
        renderizarListaCategorias();
        atualizarCategorias();
        atualizarCategoriaSubcategoriaForm();
        Swal.fire({
          title: 'Sucesso!',
          text: `Subcategoria "${nome}" adicionada!`,
          icon: 'success',
          confirmButtonColor: '#38a169',
          background: '#232b38',
          color: '#e2e8f0'
        });
      }
    });
  }

  // Editar categoria
  window.editarCategoria = function (tipo, cat) {
    const card = document.getElementById(`cat-${tipo}-${cat}`);
    if (!card) return;
    const nomeSpan = card.querySelector('.cat-nome');
    nomeSpan.innerHTML = `
      <div class="cat-edit-dialog">
        <input type='text' value='${cat}' id='edit-cat-input-${tipo}-${cat}' class='cat-edit-input' placeholder='Nome da categoria...'>
        <div class="cat-edit-actions">
          <button class="cat-btn-save" onclick="confirmarEditarCategoria('${tipo}','${cat}')">Salvar</button>
          <button class="cat-btn-cancel" onclick="renderizarListaCategorias()">Cancelar</button>
        </div>
      </div>
    `;
    // Focar no input e selecionar o texto
    setTimeout(() => {
      const input = document.getElementById(`edit-cat-input-${tipo}-${cat}`);
      if (input) {
        input.focus();
        input.select();
        // Adicionar eventos de teclado
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            confirmarEditarCategoria(tipo, cat);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            renderizarListaCategorias();
          }
        });
      }
    }, 100);
  }

  window.confirmarEditarCategoria = function (tipo, cat) {
    const input = document.getElementById(`edit-cat-input-${tipo}-${cat}`);
    const novoNome = input.value.trim();
    
    if (!novoNome) {
      // Feedback visual para campo vazio
      input.style.borderColor = '#e53e3e';
      input.style.boxShadow = '0 0 0 3px rgba(229, 62, 62, 0.3)';
      input.placeholder = 'Nome é obrigatório!';
      setTimeout(() => {
        input.style.borderColor = '';
        input.style.boxShadow = '';
        input.placeholder = 'Nome da categoria...';
      }, 2000);
      return;
    }
    
    if (categorias[tipo][novoNome] && novoNome !== cat) {
      // Feedback visual para nome duplicado
      input.style.borderColor = '#ecc94b';
      input.style.boxShadow = '0 0 0 3px rgba(236, 201, 75, 0.3)';
      input.placeholder = 'Nome já existe!';
      setTimeout(() => {
        input.style.borderColor = '';
        input.style.boxShadow = '';
        input.placeholder = 'Nome da categoria...';
      }, 2000);
      return;
    }
    
    // Animação de sucesso
    input.style.borderColor = '#38a169';
    input.style.boxShadow = '0 0 0 3px rgba(56, 161, 105, 0.3)';
    
    categorias[tipo][novoNome] = categorias[tipo][cat];
    delete categorias[tipo][cat];
    salvarCategorias();
    renderizarListaCategorias();
    atualizarCategorias();
    atualizarCategoriaSubcategoriaForm();
    
    // Notificação de sucesso (se Notyf estiver disponível)
    if (typeof notyf !== 'undefined') {
      notyf.success(`Categoria "${novoNome}" atualizada!`);
    }
  }

  // Editar subcategoria
  window.editarSubcategoria = function (tipo, cat, sub) {
    const subItem = document.getElementById(`sub-${tipo}-${cat}-${sub}`);
    if (!subItem) return;
    const nomeSpan = subItem.querySelector('.cat-sub-nome');
    nomeSpan.innerHTML = `
      <div class="cat-edit-dialog">
        <input type='text' value='${sub}' id='edit-sub-input-${tipo}-${cat}-${sub}' class='cat-edit-sub-input' placeholder='Nome da subcategoria...'>
        <div class="cat-edit-actions">
          <button class="cat-btn-save" onclick="confirmarEditarSubcategoria('${tipo}','${cat}','${sub}')">Salvar</button>
          <button class="cat-btn-cancel" onclick="renderizarListaCategorias()">Cancelar</button>
        </div>
      </div>
    `;
    // Focar no input e selecionar o texto
    setTimeout(() => {
      const input = document.getElementById(`edit-sub-input-${tipo}-${cat}-${sub}`);
      if (input) {
        input.focus();
        input.select();
        // Adicionar eventos de teclado
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            confirmarEditarSubcategoria(tipo, cat, sub);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            renderizarListaCategorias();
          }
        });
      }
    }, 100);
  }

  window.confirmarEditarSubcategoria = function (tipo, cat, sub) {
    const input = document.getElementById(`edit-sub-input-${tipo}-${cat}-${sub}`);
    const novoNome = input.value.trim();
    
    if (!novoNome) {
      // Feedback visual para campo vazio
      input.style.borderColor = '#e53e3e';
      input.style.boxShadow = '0 0 0 3px rgba(229, 62, 62, 0.3)';
      input.placeholder = 'Nome é obrigatório!';
      setTimeout(() => {
        input.style.borderColor = '';
        input.style.boxShadow = '';
        input.placeholder = 'Nome da subcategoria...';
      }, 2000);
      return;
    }
    
    if (categorias[tipo][cat].includes(novoNome) && novoNome !== sub) {
      // Feedback visual para nome duplicado
      input.style.borderColor = '#ecc94b';
      input.style.boxShadow = '0 0 0 3px rgba(236, 201, 75, 0.3)';
      input.placeholder = 'Nome já existe!';
      setTimeout(() => {
        input.style.borderColor = '';
        input.style.boxShadow = '';
        input.placeholder = 'Nome da subcategoria...';
      }, 2000);
      return;
    }
    
    // Animação de sucesso
    input.style.borderColor = '#38a169';
    input.style.boxShadow = '0 0 0 3px rgba(56, 161, 105, 0.3)';
    
    const idx = categorias[tipo][cat].indexOf(sub);
    if (idx !== -1) categorias[tipo][cat][idx] = novoNome;
    salvarCategorias();
    renderizarListaCategorias();
    atualizarCategorias();
    atualizarCategoriaSubcategoriaForm();
    
    // Notificação de sucesso (se Notyf estiver disponível)
    if (typeof notyf !== 'undefined') {
      notyf.success(`Subcategoria "${novoNome}" atualizada!`);
    }
  }

  window.removerCategoria = function (tipo, cat) {
    Swal.fire({
      title: 'Confirmar Exclusão',
      text: `Deseja remover a categoria "${cat}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, remover',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e53e3e',
      cancelButtonColor: '#4a5568',
      background: '#232b38',
      color: '#e2e8f0'
    }).then((result) => {
      if (result.isConfirmed) {
        delete categorias[tipo][cat];
        salvarCategorias();
        renderizarListaCategorias();
        atualizarCategorias();
        atualizarCategoriaSubcategoriaForm();
        Swal.fire({
          title: 'Removida!',
          text: `Categoria "${cat}" foi removida.`,
          icon: 'success',
          confirmButtonColor: '#38a169',
          background: '#232b38',
          color: '#e2e8f0'
        });
      }
    });
  }

  window.removerSubcategoria = function (tipo, cat, sub) {
    Swal.fire({
      title: 'Confirmar Exclusão',
      text: `Deseja remover a subcategoria "${sub}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, remover',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e53e3e',
      cancelButtonColor: '#4a5568',
      background: '#232b38',
      color: '#e2e8f0'
    }).then((result) => {
      if (result.isConfirmed) {
        categorias[tipo][cat] = categorias[tipo][cat].filter(s => s !== sub);
        salvarCategorias();
        renderizarListaCategorias();
        atualizarCategorias();
        atualizarCategoriaSubcategoriaForm();
        Swal.fire({
          title: 'Removida!',
          text: `Subcategoria "${sub}" foi removida.`,
          icon: 'success',
          confirmButtonColor: '#38a169',
          background: '#232b38',
          color: '#e2e8f0'
        });
      }
    });
  }

  function atualizarCategoriaSubcategoriaForm() {
    // Para o formulário de subcategoria
    const tipoSelect = document.getElementById("tipo-subcategoria");
    const categoriaSelect = document.getElementById("categoria-subcategoria");
    if (!tipoSelect || !categoriaSelect) return;
    categoriaSelect.innerHTML = "";
    const tipo = tipoSelect.value;
    Object.keys(categorias[tipo]).forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categoriaSelect.appendChild(opt);
    });
  }

  function atualizarCategorias() {
    // Atualizar selects do financeiro se existirem (nova interface)
    const tipoSelecionado = document.querySelector('input[name="tipo-lancamento"]:checked')?.value;
    const categoriaInput = document.getElementById("categoria-lancamento");
    const subcategoriaInput = document.getElementById("subcategoria-lancamento");
    
    if (!tipoSelecionado || !categoriaInput || !subcategoriaInput) return;
    
    categoriaInput.innerHTML = '<option value="">Selecione uma categoria...</option>';
    subcategoriaInput.innerHTML = '<option value="">Selecione uma subcategoria...</option>';
    
    const cats = categorias[tipoSelecionado] || {};
    Object.keys(cats).forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categoriaInput.appendChild(opt);
    });
    
    // Atualizar subcategorias se houver categoria selecionada
    const cat = categoriaInput.value;
    if (cat) {
      const subs = (categorias[tipoSelecionado] && categorias[tipoSelecionado][cat]) ? categorias[tipoSelecionado][cat] : [];
      subs.forEach(sub => {
        const opt = document.createElement("option");
        opt.value = sub;
        opt.textContent = sub;
        subcategoriaInput.appendChild(opt);
      });
    }
  }

  // Cadastro de categoria
  const formCategoria = document.getElementById("form-categoria");
  if (formCategoria) {
    formCategoria.addEventListener("submit", function (e) {
      e.preventDefault();
      const tipo = document.getElementById("tipo-categoria").value;
      const nome = document.getElementById("nome-categoria").value.trim();
      if (nome && !categorias[tipo][nome]) {
        categorias[tipo][nome] = [];
        salvarCategorias();
        renderizarListaCategorias();
        atualizarCategorias();
        atualizarCategoriaSubcategoriaForm();
        document.getElementById("nome-categoria").value = "";
      }
    });
    document.getElementById("tipo-categoria")?.addEventListener("change", atualizarCategoriaSubcategoriaForm);
  }

  // Cadastro de subcategoria
  const formSubcategoria = document.getElementById("form-subcategoria");
  if (formSubcategoria) {
    formSubcategoria.addEventListener("submit", function (e) {
      e.preventDefault();
      const tipo = document.getElementById("tipo-subcategoria").value;
      const cat = document.getElementById("categoria-subcategoria").value;
      const nome = document.getElementById("nome-subcategoria").value.trim();
      if (cat && nome && categorias[tipo][cat] && !categorias[tipo][cat].includes(nome)) {
        categorias[tipo][cat].push(nome);
        salvarCategorias();
        renderizarListaCategorias();
        atualizarCategorias();
        document.getElementById("nome-subcategoria").value = "";
      }
    });
    document.getElementById("tipo-subcategoria")?.addEventListener("change", atualizarCategoriaSubcategoriaForm);
    document.getElementById("categoria-subcategoria")?.addEventListener("change", atualizarCategoriaSubcategoriaForm);
  }

  // Expor funções globalmente
  window.renderizarListaCategorias = renderizarListaCategorias;
  window.atualizarCategoriaSubcategoriaForm = atualizarCategoriaSubcategoriaForm;
  window.atualizarCategorias = atualizarCategorias;
  
  // Inicializar
  renderizarListaCategorias();
  atualizarCategoriaSubcategoriaForm();
});