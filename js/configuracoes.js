// Configurações - Importação/Exportação e Configurações Gerais
document.addEventListener("DOMContentLoaded", function () {
  
  // Função para mostrar README em popup
  function mostrarReadme() {
    const readmeContent = `
# Integração do **OrganizaMEI** com Google Sheets

## ✅ Etapas para configurar a integração

### 1. Criar o script no Google Apps Script

1. Acesse [https://script.google.com](https://script.google.com)
2. Clique em **"Novo projeto"**
3. Apague qualquer conteúdo e cole o código do arquivo \`Código.gs\`
4. Substitua o texto \`'SUA_PLANILHA_ID'\` pelo ID da sua planilha:

   * Para encontrar o ID, abra sua planilha e copie a parte entre \`/d/\` e \`/edit\` da URL:
     Exemplo: \`https://docs.google.com/spreadsheets/d/**ID_AQUI**/edit\`
5. Salve o projeto com um nome (ex: **OrganizaMEI-Financeiro**)

---

### 2. Publicar como Web App

1. No menu do projeto, clique em **"Implantar" > "Nova implantação"**
2. Escolha o tipo: **Aplicativo da web**
3. Preencha as opções:

   * **Executar como:** você mesmo (seu e-mail)
   * **Quem tem acesso:** **Qualquer pessoa**
4. Clique em **"Implantar"**
5. Copie a **URL gerada do Web App**

---

### 3. Conectar ao OrganizaMEI

1. Abra o **OrganizaMEI** no navegador
2. Vá até a guia **Financeiro**
3. Encontre a seção **Integração com Google Sheets**
4. Cole a **URL do Web App** no campo indicado
5. Clique em **"Salvar URL"**

---

### 4. Usar a integração automaticamente

* ✅ Ao **adicionar um lançamento** no OrganizaMEI, ele será automaticamente enviado ao Google Sheets
* ✅ Ao **registrar uma venda (saída de produto)**, será gerado um lançamento de receita e enviado automaticamente à planilha
* ✅ Ao **excluir um lançamento**, ele será automaticamente removido da planilha
* ✅ Você também pode clicar em **"Sincronizar com Planilha"** para carregar todos os dados da planilha para o sistema local (substituindo os dados atuais)

---

## Como a integração funciona

### ➕ Adicionando um lançamento:

1. Preencha o formulário na guia **Financeiro**
2. Clique em **"Adicionar"**
3. O sistema:

   * Salva localmente
   * Envia automaticamente para o Google Sheets
   * Atualiza o status de sincronização

### 🛒 Registrando uma venda:

1. Vá até a guia **Estoque**
2. Clique em **"Saída"** do produto
3. Informe a quantidade e o valor
4. O sistema:

   * Reduz o estoque
   * Gera um lançamento de receita
   * Envia automaticamente para o Google Sheets

### 🗑 Removendo um lançamento:

1. Clique no ícone de lixeira ao lado do lançamento
2. O sistema:

   * Remove localmente
   * Remove automaticamente da planilha

---

## Estrutura esperada da planilha

A planilha deve conter as seguintes colunas, nessa ordem:

* \`ID\` – Identificador único (formato DDMMAAAAHHMMSS)
* \`Tipo\` – receita ou despesa
* \`Categoria\` – ex: alimentação, vendas
* \`Subcategoria\` – ex: almoço, iPhone
* \`Descrição\` – descrição do lançamento
* \`Quantidade\` – número de itens
* \`Valor\` – valor total em R$
* \`Data Lançamento\` – formato: DD/MM/AAAA

---

## Funcionalidades disponíveis

* ✅ Envio automático de lançamentos ao Google Sheets
* ✅ Exclusão automática da planilha quando um lançamento é removido
* ✅ Sincronização completa dos dados da planilha para o sistema
* ✅ Registro automático de vendas como receita
* ✅ Interface simples e integrada ao OrganizaMEI
* ✅ Armazenamento seguro da URL no navegador
* ✅ Visualização do status de sincronização
* ✅ Compatível com dispositivos móveis
* ✅ Prevenção de duplicidade com IDs únicos

---

## Problemas comuns e como resolver

### ❌ Erro de CORS

* Verifique se:

  * A URL do Web App está correta
  * O acesso está configurado como **"Qualquer pessoa"**
  * As permissões foram autorizadas ao implantar

### ❌ Planilha não encontrada

* Confirme se:

  * O ID da planilha foi inserido corretamente no código
  * A planilha está ativa e acessível
  * Você tem permissão de edição

### ❌ Dados não aparecem no sistema

* Verifique se:

  * A planilha tem os cabeçalhos corretos (como listados acima)
  * Os dados estão no formato esperado
  * Está testando com poucos registros primeiro

---

## Segurança da integração

* A URL do Web App é salva apenas no seu navegador
* A comunicação é feita via **HTTPS**
* Apenas você acessa sua planilha
* Recomendamos o uso de uma planilha dedicada apenas ao **OrganizaMEI**
    `;
    
    // Converter markdown para HTML
    const htmlContent = readmeContent
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
      title: 'Guia de Integração Google Sheets',
      html: `<div class="readme-content">${htmlContent}</div>`,
      width: '80%',
      showCloseButton: true,
      showConfirmButton: false,
      background: '#232b38',
      color: '#e2e8f0',
      customClass: {
        popup: 'readme-popup'
      }
    });
  }
  
  // Adicionar event listener ao botão README
  const btnReadme = document.getElementById('btn-readme');
  if (btnReadme) {
    btnReadme.onclick = function(e) {
      e.preventDefault();
      mostrarReadme();
    };
  }
  
  // Verificar status do estoque quando a página carregar
  if (typeof atualizarStatusEstoque === 'function') {
    setTimeout(atualizarStatusEstoque, 1500);
  }
  
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
});