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
    nomeSpan.innerHTML = `<input type='text' value='${cat}' id='edit-cat-input-${tipo}-${cat}' class='cat-edit-input'> <button onclick="confirmarEditarCategoria('${tipo}','${cat}')">Salvar</button> <button onclick="renderizarListaCategorias()">Cancelar</button>`;
  }

  window.confirmarEditarCategoria = function (tipo, cat) {
    const input = document.getElementById(`edit-cat-input-${tipo}-${cat}`);
    const novoNome = input.value.trim();
    if (!novoNome) return alert('Digite o nome da categoria.');
    if (categorias[tipo][novoNome] && novoNome !== cat) return alert('Já existe uma categoria com esse nome!');
    categorias[tipo][novoNome] = categorias[tipo][cat];
    delete categorias[tipo][cat];
    salvarCategorias();
    renderizarListaCategorias();
    atualizarCategorias();
    atualizarCategoriaSubcategoriaForm();
  }

  // Editar subcategoria
  window.editarSubcategoria = function (tipo, cat, sub) {
    const subItem = document.getElementById(`sub-${tipo}-${cat}-${sub}`);
    if (!subItem) return;
    const nomeSpan = subItem.querySelector('.cat-sub-nome');
    nomeSpan.innerHTML = `<input type='text' value='${sub}' id='edit-sub-input-${tipo}-${cat}-${sub}' class='cat-edit-sub-input'> <button onclick="confirmarEditarSubcategoria('${tipo}','${cat}','${sub}')">Salvar</button> <button onclick="renderizarListaCategorias()">Cancelar</button>`;
  }

  window.confirmarEditarSubcategoria = function (tipo, cat, sub) {
    const input = document.getElementById(`edit-sub-input-${tipo}-${cat}-${sub}`);
    const novoNome = input.value.trim();
    if (!novoNome) return alert('Digite o nome da subcategoria.');
    if (categorias[tipo][cat].includes(novoNome) && novoNome !== sub) return alert('Já existe uma subcategoria com esse nome!');
    const idx = categorias[tipo][cat].indexOf(sub);
    if (idx !== -1) categorias[tipo][cat][idx] = novoNome;
    salvarCategorias();
    renderizarListaCategorias();
    atualizarCategorias();
    atualizarCategoriaSubcategoriaForm();
  }

  window.removerCategoria = function (tipo, cat) {
    if (confirm(`Remover categoria '${cat}'?`)) {
      delete categorias[tipo][cat];
      salvarCategorias();
      renderizarListaCategorias();
      atualizarCategorias();
      atualizarCategoriaSubcategoriaForm();
    }
  }

  window.removerSubcategoria = function (tipo, cat, sub) {
    if (confirm(`Remover subcategoria '${sub}'?`)) {
      categorias[tipo][cat] = categorias[tipo][cat].filter(s => s !== sub);
      salvarCategorias();
      renderizarListaCategorias();
      atualizarCategorias();
      atualizarCategoriaSubcategoriaForm();
    }
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
    // Atualizar selects do financeiro se existirem
    const tipoInput = document.getElementById("tipo-lancamento");
    const categoriaInput = document.getElementById("categoria-lancamento");
    const subcategoriaInput = document.getElementById("subcategoria-lancamento");
    if (!tipoInput || !categoriaInput || !subcategoriaInput) return;
    
    categoriaInput.innerHTML = "";
    subcategoriaInput.innerHTML = "";
    const tipo = tipoInput.value;
    const cats = categorias[tipo] || {};
    Object.keys(cats).forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categoriaInput.appendChild(opt);
    });
    
    // Atualizar subcategorias
    const cat = categoriaInput.value;
    const subs = (categorias[tipo] && categorias[tipo][cat]) ? categorias[tipo][cat] : [];
    subs.forEach(sub => {
      const opt = document.createElement("option");
      opt.value = sub;
      opt.textContent = sub;
      subcategoriaInput.appendChild(opt);
    });
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