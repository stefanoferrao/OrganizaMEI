# 🚀 **OrganizaMEI** - Sistema Completo de Gestão para MEI

> Sistema modular e inteligente para controle financeiro, estoque e vendas com integração opcional ao Google Sheets.

## 📋 **Funcionalidades Principais**

### 💰 **Gestão Financeira Completa**
- Controle de receitas e despesas por categorias
- Lançamentos automáticos de vendas
- Relatórios DRE detalhados
- Indicadores de performance (KPIs)

### 📦 **Controle de Estoque Inteligente**
- Cadastro e controle de produtos
- Movimentações de entrada e saída
- Integração automática com vendas
- Histórico completo de movimentações

### 📊 **Dashboard e Relatórios**
- Visão geral em tempo real
- Gráficos interativos (Chart.js)
- Análises de tendências
- Filtros por período

### 🔗 **Integração Google Sheets (Opcional)**
- Sincronização automática de dados
- Backup na nuvem
- Acesso multiplataforma
- Detecção inteligente de abas

---

## ⚙️ **Configuração da Integração Google Sheets**

### 1. **Criar o Script no Google Apps Script**

1. Acesse [https://script.google.com](https://script.google.com)
2. Clique em **"Novo projeto"**
3. Apague qualquer conteúdo e cole o código do arquivo `Código.gs`
4. Substitua `'SUA_PLANILHA_ID'` pelo ID da sua planilha:
   - Abra sua planilha e copie a parte entre `/d/` e `/edit` da URL
   - Exemplo: `https://docs.google.com/spreadsheets/d/**ID_AQUI**/edit`
5. Salve o projeto (ex: **OrganizaMEI-Integração**)

### 2. **Publicar como Web App**

1. No menu: **"Implantar" > "Nova implantação"**
2. Tipo: **Aplicativo da web**
3. Configurações:
   - **Executar como:** você mesmo
   - **Quem tem acesso:** **Qualquer pessoa**
4. Clique em **"Implantar"**
5. **Copie a URL gerada**

### 3. **Conectar ao OrganizaMEI**

1. Abra o OrganizaMEI
2. Vá para **Configurações**
3. Na seção **Integração com Google Sheets**:
   - Cole a URL do Web App
   - Clique em **"Salvar URL"**
4. O sistema detectará automaticamente as abas disponíveis

### 4. **Funcionalidades Automáticas**

- ✅ **Lançamentos financeiros** sincronizados automaticamente
- ✅ **Vendas** geram receitas na planilha
- ✅ **Estoque** com aba dedicada (criação automática)
- ✅ **Exclusões** removidas da planilha
- ✅ **Sincronização bidirecional** completa

---

## 🔄 **Como Funciona a Integração**

### 💡 **Detecção Inteligente**
O sistema detecta automaticamente:
- ✅ **Aba principal** (dados financeiros)
- 🔍 **Aba "Estoque"** (se existir)
- ⚡ **Status de conexão** em tempo real

### ➕ **Adicionando Lançamentos**
1. **Financeiro** → Preencha o formulário → **"Adicionar"**
2. **Automático:**
   - Salva localmente
   - Envia para Google Sheets
   - Atualiza indicadores

### 📦 **Controle de Estoque**
1. **Entrada:** Cadastre produtos no estoque
2. **Saída/Venda:** Registra venda + lançamento financeiro
3. **Integração:** Movimentações salvas na aba "Estoque"

### 🔄 **Sincronização**
- **Automática:** Cada operação sincroniza instantaneamente
- **Manual:** Botão "Ressincronizar Tudo" nas configurações
- **Bidirecional:** Dados da planilha podem ser importados

---

## 📊 **Estrutura das Planilhas**

### 💰 **Aba Principal (Financeiro)**
| Coluna | Descrição | Exemplo |
|--------|-----------|----------|
| **ID** | Identificador único | 25122024143022 |
| **Tipo** | receita ou despesa | receita |
| **Categoria** | Categoria principal | vendas |
| **Subcategoria** | Subcategoria | iPhone |
| **Descrição** | Descrição detalhada | Venda iPhone 13 |
| **Quantidade** | Número de itens | 1 |
| **Valor** | Valor total (R$) | 2500.00 |
| **Data Lançamento** | Data (DD/MM/AAAA) | 25/12/2024 |

### 📦 **Aba "Estoque" (Opcional)**
| Coluna | Descrição | Exemplo |
|--------|-----------|----------|
| **ID** | Identificador único | 25122024143022 |
| **Produto** | Nome do produto | iPhone 13 |
| **Categoria** | Tipo de movimentação | Entrada/Saída |
| **Quantidade** | Quantidade movimentada | 5 |
| **Valor_Unitario** | Valor por unidade | 2500.00 |
| **Valor_Total** | Valor total | 12500.00 |
| **Data_Movimento** | Data da movimentação | 25/12/2024 |
| **Tipo_Movimento** | Entrada/Saída/Venda | Entrada |
| **Observacoes** | Observações | Entrada manual |

---

## ✨ **Funcionalidades Avançadas**

### 🔄 **Sincronização Inteligente**
- ✅ **Detecção automática** de abas na planilha
- ✅ **Criação automática** da aba Estoque
- ✅ **Sincronização bidirecional** completa
- ✅ **Prevenção de duplicatas** com IDs únicos
- ✅ **Status em tempo real** da conexão

### 📱 **Interface Moderna**
- ✅ **Design responsivo** para mobile
- ✅ **Tutorial interativo** para novos usuários
- ✅ **Filtros por período** (mês/ano)
- ✅ **Gráficos interativos** com Chart.js
- ✅ **Notificações visuais** de status

### 🛡️ **Segurança e Backup**
- ✅ **Armazenamento local** (localStorage)
- ✅ **Backup automático** na nuvem
- ✅ **Exportação/Importação** de dados
- ✅ **URL criptografada** no navegador

### 📊 **Relatórios e Análises**
- ✅ **DRE completo** (Demonstrativo do Resultado)
- ✅ **KPIs de performance** em tempo real
- ✅ **Gráficos de tendências** e evolução
- ✅ **Análise por categorias** e subcategorias

---

## 🔧 **Solução de Problemas**

### ❌ **Erro de Conexão**
**Sintomas:** Status "Erro de conexão" nas configurações

**Soluções:**
- ✅ Verifique se a **URL do Web App** está correta
- ✅ Confirme que o acesso está como **"Qualquer pessoa"**
- ✅ Reautorize as permissões no Google Apps Script
- ✅ Use o botão **"Testar Conexão"** nas configurações

### ❌ **Planilha Não Encontrada**
**Sintomas:** Erro "SHEET_ID não configurado"

**Soluções:**
- ✅ Verifique se substituiu `'SUA_PLANILHA_ID'` no código
- ✅ Confirme se o **ID da planilha** está correto
- ✅ Teste se você tem **permissão de edição** na planilha

### ❌ **Aba Estoque Não Detectada**
**Sintomas:** Status "❌" na aba Estoque

**Soluções:**
- ✅ Use o botão **"Criar Aba Estoque"** nas configurações
- ✅ Ou crie manualmente uma aba chamada **"Estoque"**
- ✅ Verifique se os **cabeçalhos** estão corretos

### ❌ **Dados Não Sincronizam**
**Sintomas:** Lançamentos não aparecem na planilha

**Soluções:**
- ✅ Verifique o **status de sincronização** na aba Financeiro
- ✅ Use **"Ressincronizar Tudo"** nas configurações
- ✅ Confirme se a planilha tem os **cabeçalhos corretos**
- ✅ Teste com **poucos registros** primeiro

---

## 🛡️ **Segurança e Privacidade**

### 🔒 **Proteção de Dados**
- 🔐 **URL criptografada** salva apenas no seu navegador
- 🌐 **Comunicação HTTPS** segura
- 👤 **Acesso privado** - apenas você acessa sua planilha
- 💾 **Dados locais** como backup principal

### 📋 **Recomendações**
- ✅ Use uma **planilha dedicada** ao OrganizaMEI
- ✅ **Não compartilhe** a URL do Web App
- ✅ Mantenha **backups regulares** dos dados
- ✅ Teste a integração com **dados de exemplo** primeiro

---

## 🚀 **Começando**

1. **Sem integração:** Abra o OrganizaMEI e comece a usar
2. **Com integração:** Configure o Google Sheets seguindo este guia
3. **Tutorial:** Use o tutorial interativo na primeira visita
4. **Suporte:** Consulte a documentação completa nos arquivos do projeto

### 📚 **Documentação Adicional**
- 📄 `ESTRUTURA-MODULAR.md` - Arquitetura do sistema
- 📦 `ESTOQUE-INTEGRATION.md` - Detalhes da integração de estoque
- ⚙️ Tutorial de configurações integrado no sistema

---

**OrganizaMEI v2.0** - Sistema completo de gestão para MEI com arquitetura modular e integração inteligente.