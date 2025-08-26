// Categorias - Gerenciamento de Categorias e Subcategorias
document.addEventListener("DOMContentLoaded", function () {
  
  // Obter referência do gerenciador de categorias
  const manager = window.categoriaManager;
  
  // Listener para atualizações automáticas
  if (manager) {
    manager.adicionarListener((categoriasAtualizadas) => {
      // Atualizar variável global para compatibilidade
      window.categorias = categoriasAtualizadas;
      categorias = categoriasAtualizadas;
      
      // Renderizar interface atualizada
      renderizarListaCategorias();
      
      // Notificar outros módulos
      atualizarCategorias();
      atualizarCategoriaSubcategoriaForm();
    });
  }
  
  // Interface de categorias
  function renderizarListaCategorias() {
    const div = document.getElementById("lista-categorias");
    if (!div) return;
    
    // Obter categorias atualizadas do gerenciador
    const categoriasAtuais = manager ? manager.obterCategorias() : categorias;
    
    let html = "";
    ["receita", "despesa"].forEach(tipo => {
      html += `<h3 class='cat-titulo'>${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</h3>`;
      // Campo de adição de categoria logo abaixo do título
      html += `<div class='cat-add-div'><input type='text' id='add-cat-${tipo}' placeholder='Nova categoria...' class='cat-add-input'><button onclick="adicionarCategoria('${tipo}')">Adicionar</button></div>`;
      Object.keys(categoriasAtuais[tipo]).forEach(cat => {
        const subs = categoriasAtuais[tipo][cat];
        html += `
          <div class="cat-card" id="cat-${tipo}-${cat}">
            <div class="cat-header">
              <div class="cat-info">
                <div class="cat-nome">${cat}</div>
                <div class="cat-sub-count">${subs.length} subcategorias</div>
              </div>
              <div class="cat-controls">
                <button class="cat-btn-editar" title="Editar" onclick="editarCategoria('${tipo}','${cat}')"><i class="fas fa-edit"></i></button>
                <button class="cat-btn-remover" title="Remover" onclick="removerCategoria('${tipo}','${cat}')"><i class="fas fa-trash"></i></button>
              </div>
            </div>
            <ul class="cat-sub-lista">
              ${subs.map(sub => `
                <li class="cat-sub-item" id="sub-${tipo}-${cat}-${sub}">
                  <span class="cat-sub-nome">${sub}</span>
                  <div>
                    <button class="cat-btn-editar-sub" title="Editar" onclick="editarSubcategoria('${tipo}','${cat}','${sub}')"><i class="fas fa-edit"></i></button>
                    <button class="cat-btn-remover-sub" title="Remover" onclick="removerSubcategoria('${tipo}','${cat}','${sub}')"><i class="fas fa-trash"></i></button>
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
    Object.keys(categoriasAtuais).forEach(tipo => {
      Object.keys(categoriasAtuais[tipo]).forEach(cat => {
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

  // Adicionar categoria usando o sistema centralizado
  window.adicionarCategoria = function (tipo) {
    const input = document.getElementById('add-cat-' + tipo);
    const nome = input.value.trim();
    
    if (!nome) {
      if (typeof mostrarNotificacaoSync === 'function') {
        mostrarNotificacaoSync('Digite o nome da categoria.', 'error');
      }
      return;
    }
    
    if (manager) {
      const resultado = manager.adicionarCategoria(tipo, nome);
      
      if (resultado.sucesso) {
        input.value = '';
        if (typeof mostrarNotificacaoSync === 'function') {
          mostrarNotificacaoSync(`Categoria "${resultado.categoria}" adicionada!`, 'success');
        }
        // O listener já vai atualizar a interface automaticamente
      } else {
        if (typeof mostrarNotificacaoSync === 'function') {
          mostrarNotificacaoSync(resultado.erro, 'error');
        }
      }
    } else {
      // Fallback para compatibilidade
      if (categorias[tipo][nome]) {
        alert('Categoria já existe!');
        return;
      }
      categorias[tipo][nome] = [];
      salvarCategorias();
      renderizarListaCategorias();
      atualizarCategorias();
      atualizarCategoriaSubcategoriaForm();
      input.value = '';
    }
  }

  // Abrir popup para adicionar subcategoria usando o sistema centralizado
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
        
        if (manager) {
          const subcategorias = manager.obterSubcategorias(tipo, cat);
          if (subcategorias.includes(value.trim())) {
            return 'Subcategoria já existe!';
          }
        } else if (categorias[tipo][cat].includes(value.trim())) {
          return 'Subcategoria já existe!';
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const nome = result.value.trim();
        
        if (manager) {
          const resultado = manager.adicionarSubcategoria(tipo, cat, nome);
          
          if (resultado.sucesso) {
            Swal.fire({
              title: 'Sucesso!',
              text: `Subcategoria "${nome}" adicionada!`,
              icon: 'success',
              confirmButtonColor: '#38a169',
              background: '#232b38',
              color: '#e2e8f0'
            });
            // O listener já vai atualizar a interface automaticamente
          } else {
            Swal.fire({
              title: 'Erro!',
              text: resultado.erro,
              icon: 'error',
              confirmButtonColor: '#e53e3e',
              background: '#232b38',
              color: '#e2e8f0'
            });
          }
        } else {
          // Fallback para compatibilidade
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
    
    if (manager) {
      const resultado = manager.editarCategoria(tipo, cat, novoNome);
      
      if (resultado.sucesso) {
        // Animação de sucesso
        input.style.borderColor = '#38a169';
        input.style.boxShadow = '0 0 0 3px rgba(56, 161, 105, 0.3)';
        
        // Notificação de sucesso
        if (typeof mostrarNotificacaoSync === 'function') {
          mostrarNotificacaoSync(`Categoria "${novoNome}" atualizada!`, 'success');
        }
        // O listener já vai atualizar a interface automaticamente
      } else {
        // Feedback visual para erro
        input.style.borderColor = '#ecc94b';
        input.style.boxShadow = '0 0 0 3px rgba(236, 201, 75, 0.3)';
        input.placeholder = resultado.erro;
        setTimeout(() => {
          input.style.borderColor = '';
          input.style.boxShadow = '';
          input.placeholder = 'Nome da categoria...';
        }, 2000);
      }
    } else {
      // Fallback para compatibilidade
      if (categorias[tipo][novoNome] && novoNome !== cat) {
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
      
      input.style.borderColor = '#38a169';
      input.style.boxShadow = '0 0 0 3px rgba(56, 161, 105, 0.3)';
      
      categorias[tipo][novoNome] = categorias[tipo][cat];
      delete categorias[tipo][cat];
      salvarCategorias();
      renderizarListaCategorias();
      atualizarCategorias();
      atualizarCategoriaSubcategoriaForm();
      
      if (typeof mostrarNotificacaoSync === 'function') {
        mostrarNotificacaoSync(`Categoria "${novoNome}" atualizada!`, 'success');
      }
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
    
    if (manager) {
      const resultado = manager.editarSubcategoria(tipo, cat, sub, novoNome);
      
      if (resultado.sucesso) {
        // Animação de sucesso
        input.style.borderColor = '#38a169';
        input.style.boxShadow = '0 0 0 3px rgba(56, 161, 105, 0.3)';
        
        // Notificação de sucesso
        if (typeof mostrarNotificacaoSync === 'function') {
          mostrarNotificacaoSync(`Subcategoria "${novoNome}" atualizada!`, 'success');
        }
        // O listener já vai atualizar a interface automaticamente
      } else {
        // Feedback visual para erro
        input.style.borderColor = '#ecc94b';
        input.style.boxShadow = '0 0 0 3px rgba(236, 201, 75, 0.3)';
        input.placeholder = resultado.erro;
        setTimeout(() => {
          input.style.borderColor = '';
          input.style.boxShadow = '';
          input.placeholder = 'Nome da subcategoria...';
        }, 2000);
      }
    } else {
      // Fallback para compatibilidade
      if (categorias[tipo][cat].includes(novoNome) && novoNome !== sub) {
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
      
      input.style.borderColor = '#38a169';
      input.style.boxShadow = '0 0 0 3px rgba(56, 161, 105, 0.3)';
      
      const idx = categorias[tipo][cat].indexOf(sub);
      if (idx !== -1) categorias[tipo][cat][idx] = novoNome;
      salvarCategorias();
      renderizarListaCategorias();
      atualizarCategorias();
      atualizarCategoriaSubcategoriaForm();
      
      if (typeof mostrarNotificacaoSync === 'function') {
        mostrarNotificacaoSync(`Subcategoria "${novoNome}" atualizada!`, 'success');
      }
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
        if (manager) {
          const resultado = manager.removerCategoria(tipo, cat);
          
          if (resultado.sucesso) {
            Swal.fire({
              title: 'Removida!',
              text: `Categoria "${cat}" foi removida.`,
              icon: 'success',
              confirmButtonColor: '#38a169',
              background: '#232b38',
              color: '#e2e8f0'
            });
            // O listener já vai atualizar a interface automaticamente
          } else {
            Swal.fire({
              title: 'Erro!',
              text: resultado.erro,
              icon: 'error',
              confirmButtonColor: '#e53e3e',
              background: '#232b38',
              color: '#e2e8f0'
            });
          }
        } else {
          // Fallback para compatibilidade
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
        if (manager) {
          const resultado = manager.removerSubcategoria(tipo, cat, sub);
          
          if (resultado.sucesso) {
            Swal.fire({
              title: 'Removida!',
              text: `Subcategoria "${sub}" foi removida.`,
              icon: 'success',
              confirmButtonColor: '#38a169',
              background: '#232b38',
              color: '#e2e8f0'
            });
            // O listener já vai atualizar a interface automaticamente
          } else {
            Swal.fire({
              title: 'Erro!',
              text: resultado.erro,
              icon: 'error',
              confirmButtonColor: '#e53e3e',
              background: '#232b38',
              color: '#e2e8f0'
            });
          }
        } else {
          // Fallback para compatibilidade
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
      }
    });
  }

  function atualizarCategoriaSubcategoriaForm() {
    // Obter categorias atualizadas do gerenciador
    const categoriasAtuais = manager ? manager.obterCategorias() : categorias;
    
    // Para o formulário de subcategoria
    const tipoSelect = document.getElementById("tipo-subcategoria");
    const categoriaSelect = document.getElementById("categoria-subcategoria");
    if (!tipoSelect || !categoriaSelect) return;
    categoriaSelect.innerHTML = "";
    const tipo = tipoSelect.value;
    Object.keys(categoriasAtuais[tipo]).forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categoriaSelect.appendChild(opt);
    });
  }

  function atualizarCategorias() {
    // Obter categorias atualizadas do gerenciador
    const categoriasAtuais = manager ? manager.obterCategorias() : categorias;
    
    // Atualizar variável global para compatibilidade
    window.categorias = categoriasAtuais;
    categorias = categoriasAtuais;
    
    // Atualizar selects do financeiro se existirem (nova interface)
    const tipoSelecionado = document.querySelector('input[name="tipo-lancamento"]:checked')?.value;
    const categoriaInput = document.getElementById("categoria-lancamento");
    const subcategoriaInput = document.getElementById("subcategoria-lancamento");
    
    if (!tipoSelecionado || !categoriaInput || !subcategoriaInput) return;
    
    categoriaInput.innerHTML = '<option value="">Selecione uma categoria...</option>';
    subcategoriaInput.innerHTML = '<option value="">Selecione uma subcategoria...</option>';
    
    const cats = categoriasAtuais[tipoSelecionado] || {};
    Object.keys(cats).forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categoriaInput.appendChild(opt);
    });
    
    // Atualizar subcategorias se houver categoria selecionada
    const cat = categoriaInput.value;
    if (cat) {
      const subs = (categoriasAtuais[tipoSelecionado] && categoriasAtuais[tipoSelecionado][cat]) ? categoriasAtuais[tipoSelecionado][cat] : [];
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