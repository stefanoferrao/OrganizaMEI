# Integração do **OrganizaMEI** com Google Sheets

## ✅ Etapas para configurar a integração

### 1. Criar o script no Google Apps Script

1. Acesse [https://script.google.com](https://script.google.com)
2. Clique em **“Novo projeto”**
3. Apague qualquer conteúdo e cole o código do arquivo `Código.gs`
4. Substitua o texto `'SUA_PLANILHA_ID'` pelo ID da sua planilha:

   * Para encontrar o ID, abra sua planilha e copie a parte entre `/d/` e `/edit` da URL:
     Exemplo: `https://docs.google.com/spreadsheets/d/**ID_AQUI**/edit`
5. Salve o projeto com um nome (ex: **OrganizaMEI-Financeiro**)

---

### 2. Publicar como Web App

1. No menu do projeto, clique em **“Implantar” > “Nova implantação”**
2. Escolha o tipo: **Aplicativo da web**
3. Preencha as opções:

   * **Executar como:** você mesmo (seu e-mail)
   * **Quem tem acesso:** **Qualquer pessoa**
4. Clique em **“Implantar”**
5. Copie a **URL gerada do Web App**

---

### 3. Conectar ao OrganizaMEI

1. Abra o **OrganizaMEI** no navegador
2. Vá até a guia **Financeiro**
3. Encontre a seção **Integração com Google Sheets**
4. Cole a **URL do Web App** no campo indicado
5. Clique em **“Salvar URL”**

---

### 4. Usar a integração automaticamente

* ✅ Ao **adicionar um lançamento** no OrganizaMEI, ele será automaticamente enviado ao Google Sheets
* ✅ Ao **registrar uma venda (saída de produto)**, será gerado um lançamento de receita e enviado automaticamente à planilha
* ✅ Ao **excluir um lançamento**, ele será automaticamente removido da planilha
* ✅ Você também pode clicar em **“Sincronizar com Planilha”** para carregar todos os dados da planilha para o sistema local (substituindo os dados atuais)

---

## Como a integração funciona

### ➕ Adicionando um lançamento:

1. Preencha o formulário na guia **Financeiro**
2. Clique em **“Adicionar”**
3. O sistema:

   * Salva localmente
   * Envia automaticamente para o Google Sheets
   * Atualiza o status de sincronização

### 🛒 Registrando uma venda:

1. Vá até a guia **Estoque**
2. Clique em **“Saída”** do produto
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

* `ID` – Identificador único (formato DDMMAAAAHHMMSS)
* `Tipo` – receita ou despesa
* `Categoria` – ex: alimentação, vendas
* `Subcategoria` – ex: almoço, iPhone
* `Descrição` – descrição do lançamento
* `Quantidade` – número de itens
* `Valor` – valor total em R\$
* `Data Lançamento` – formato: DD/MM/AAAA

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
  * O acesso está configurado como **“Qualquer pessoa”**
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
