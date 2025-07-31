# Integração YumMetrics com Google Sheets

## Como configurar a integração com Google Sheets

### 1. Configurar o Google Apps Script

1. Acesse [script.google.com](https://script.google.com)
2. Clique em "Novo projeto"
3. Cole o código do arquivo `Código.gs` no editor
4. **IMPORTANTE**: Substitua `'SUA_PLANILHA_ID'` pelo ID real da sua planilha do Google Sheets
   - Para encontrar o ID da planilha, abra sua planilha no Google Sheets
   - O ID está na URL: `https://docs.google.com/spreadsheets/d/[ID_DA_PLANILHA]/edit`
5. Salve o projeto com um nome (ex: "YumMetrics-Financeiro")

### 2. Implantar como Web App

1. No Google Apps Script, clique em "Implantar" > "Nova implantação"
2. Escolha o tipo: "Aplicativo da web"
3. Configure:
   - **Executar como**: Eu (seu email)
   - **Quem tem acesso**: Qualquer pessoa
4. Clique em "Implantar"
5. **Copie a URL do Web App** que será gerada

### 3. Configurar no YumMetrics

1. Abra o YumMetrics no navegador
2. Vá para a guia "Financeiro"
3. Na seção "Integração com Google Sheets":
   - Cole a URL do Web App no campo
   - Clique em "Salvar URL"

### 4. Usar a integração

#### Adição automática ao Google Sheets:
- **NOVO**: Quando você clicar em "Adicionar" na seção Financeiro, o lançamento será automaticamente enviado para o Google Sheets
- **NOVO**: Quando você registrar uma saída de produto (venda), ela também será automaticamente enviada para o Google Sheets
- **NOVO**: Quando você remover um lançamento, ele também será removido automaticamente do Google Sheets

#### Sincronizar dados da planilha:
- Clique em "Sincronizar com Planilha" para importar todos os dados do Google Sheets para o sistema local
- Esta função substitui os dados locais pelos dados da planilha

## Como Funciona a Integração Automática

### Quando você adiciona um lançamento:
1. Preenche o formulário na seção "Financeiro"
2. Clica em "Adicionar"
3. O sistema:
   - Salva o lançamento localmente
   - **Automaticamente** envia para o Google Sheets
   - Atualiza o indicador visual de sincronização

### Quando você registra uma venda:
1. Vai para "Estoque" e clica no botão de saída de um produto
2. Informa quantidade e valor
3. O sistema:
   - Reduz o estoque
   - Cria um lançamento de receita automaticamente
   - **Automaticamente** envia para o Google Sheets

### Quando você remove um lançamento:
1. Clica no botão de lixeira ao lado do lançamento
2. O sistema:
   - Remove o lançamento localmente
   - **Automaticamente** remove do Google Sheets

## Estrutura da Planilha

A planilha terá as seguintes colunas:
- **ID**: Identificador único do lançamento (formato: DDMMAAAAHHMMSS)
- **Tipo**: receita ou despesa
- **Categoria**: Categoria do lançamento
- **Subcategoria**: Subcategoria do lançamento
- **Descrição**: Descrição do lançamento
- **Quantidade**: Quantidade de itens
- **Valor**: Valor em reais
- **Data Lançamento**: Data do lançamento financeiro (formato DD/MM/AAAA)

## Funcionalidades

- ✅ **Adição automática**: Lançamentos são automaticamente enviados ao Google Sheets quando criados
- ✅ **Remoção automática**: Lançamentos são automaticamente removidos do Google Sheets quando excluídos
- ✅ **Sincronização bidirecional**: Importação de dados da planilha para o sistema local
- ✅ **Vendas automáticas**: Saídas de produtos são automaticamente registradas como vendas no Google Sheets
- ✅ Interface integrada na guia Financeiro
- ✅ Configuração persistente da URL
- ✅ Feedback visual das operações
- ✅ Compatível com dispositivos móveis
- ✅ IDs únicos para evitar duplicações

## Solução de Problemas

### Erro de CORS
Se aparecer erro de CORS, verifique se:
1. A URL do Web App está correta
2. O Web App foi implantado com acesso "Qualquer pessoa"
3. Você autorizou as permissões necessárias no Google Apps Script

### Planilha não encontrada
1. Verifique se o ID da planilha no código está correto
2. Certifique-se de que a planilha existe e está acessível
3. Verifique se você tem permissões de edição na planilha

### Dados não aparecem
1. Verifique se a planilha tem os cabeçalhos corretos
2. Confirme se os dados estão no formato esperado
3. Teste primeiro com poucos registros

## Segurança

- A URL do Web App é salva localmente no navegador
- Os dados são transmitidos via HTTPS
- Apenas você tem acesso aos dados da sua planilha
- Recomenda-se usar uma planilha dedicada para o YumMetrics