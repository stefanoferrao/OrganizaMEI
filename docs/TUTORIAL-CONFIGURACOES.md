# 🎓 **Tutorial Completo de Configurações** - OrganizaMEI v2.0

## 🚀 **Introdução**

Este tutorial abrangente guiará você através de todas as configurações disponíveis no OrganizaMEI v2.0, desde a configuração básica até recursos avançados de integração com Google Sheets.

---

## 📋 **Índice**

1. [🎯 Primeiros Passos](#-primeiros-passos)
2. [🔗 Configuração Google Sheets](#-configuração-google-sheets)
3. [📦 Integração de Estoque](#-integração-de-estoque)
4. [💾 Gerenciamento de Dados](#-gerenciamento-de-dados)
5. [🎨 Personalização](#-personalização)
6. [🔧 Solução de Problemas](#-solução-de-problemas)
7. [🚀 Recursos Avançados](#-recursos-avançados)

---

## 🎯 **Primeiros Passos**

### 🎓 **Tutorial Interativo**
1. **Primeira visita**: O tutorial inicia automaticamente
2. **Refazer tutorial**: 
   - Vá para **Configurações**
   - Clique em **"🎓 Refazer Tutorial"**
3. **Pular etapas**: Use o botão "Pular Tutorial" se necessário

### 📱 **Interface Principal**
- **Sidebar**: Navegação entre módulos
- **Filtros**: Controle de período (mês/ano)
- **Dashboard**: Visão geral dos dados
- **Abas**: Estoque, Financeiro, Vendas, etc.

### 💾 **Armazenamento de Dados**
- **Local**: Dados salvos no navegador (localStorage)
- **Nuvem**: Integração opcional com Google Sheets
- **Backup**: Exportação/importação de dados

---

## 🔗 **Configuração Google Sheets**

### 📋 **Pré-requisitos**
- Conta Google ativa
- Planilha Google Sheets criada
- Permissões de edição na planilha

### 🛠️ **Passo 1: Criar Script no Google Apps Script**

1. **Acessar Google Apps Script**:
   - Vá para [https://script.google.com](https://script.google.com)
   - Faça login com sua conta Google

2. **Criar Novo Projeto**:
   - Clique em **"Novo projeto"**
   - Nomeie o projeto (ex: "OrganizaMEI-Integração")

3. **Configurar o Código**:
   - Apague o conteúdo padrão
   - Cole o código do arquivo `Código.gs` do projeto
   - **IMPORTANTE**: Substitua `'SUA_PLANILHA_ID'` pelo ID real da sua planilha

4. **Encontrar ID da Planilha**:
   - Abra sua planilha Google Sheets
   - Na URL, copie a parte entre `/d/` e `/edit`
   - Exemplo: `https://docs.google.com/spreadsheets/d/1ABC123DEF456/edit`
   - ID seria: `1ABC123DEF456`

5. **Salvar o Projeto**:
   - Pressione `Ctrl+S` ou clique no ícone de salvar
   - Confirme o nome do projeto

### 🚀 **Passo 2: Publicar como Web App**

1. **Iniciar Implantação**:
   - No menu superior, clique em **"Implantar"**
   - Selecione **"Nova implantação"**

2. **Configurar Tipo**:
   - Clique no ícone de engrenagem ⚙️
   - Selecione **"Aplicativo da web"**

3. **Definir Permissões**:
   - **Executar como**: Você mesmo (seu e-mail)
   - **Quem tem acesso**: **Qualquer pessoa**
   - ⚠️ **Importante**: Deve ser "Qualquer pessoa" para funcionar

4. **Autorizar Permissões**:
   - Clique em **"Implantar"**
   - Se solicitado, clique em **"Autorizar acesso"**
   - Faça login e aceite as permissões

5. **Copiar URL**:
   - Copie a **URL do aplicativo da web**
   - Guarde esta URL (você precisará dela no OrganizaMEI)

### 🔗 **Passo 3: Conectar ao OrganizaMEI**

1. **Acessar Configurações**:
   - Abra o OrganizaMEI
   - Clique na aba **"Configurações"**

2. **Localizar Seção de Integração**:
   - Encontre **"🔗 Integração com Google Sheets"**
   - Verifique o status atual

3. **Inserir URL**:
   - Cole a URL do Web App no campo **"URL do Web App"**
   - Clique em **"💾 Salvar URL"**

4. **Verificar Conexão**:
   - Aguarde a validação automática
   - Status deve mudar para **"✅ Conectado e funcionando"**
   - Use **"🔍 Testar Conexão"** se necessário

### 📊 **Passo 4: Verificar Status das Abas**

Após conectar, você verá o status das abas:

- **💰 Financeiro**: ✅ (sempre ativo quando conectado)
- **📦 Estoque**: ✅ ou ❌ (dependendo da existência da aba)

---

## 📦 **Integração de Estoque**

### 🔍 **Detecção Automática**

O sistema detecta automaticamente se existe uma aba "Estoque" na planilha:

- **✅ Detectada**: Integração ativa automaticamente
- **❌ Não encontrada**: Opção de criar automaticamente

### ⚡ **Criação Automática da Aba Estoque**

1. **Verificar Status**:
   - Na seção de integração, veja o status da aba Estoque
   - Se mostrar ❌, o botão **"Criar Aba"** estará disponível

2. **Criar Aba Automaticamente**:
   - Clique em **"Criar Aba Estoque"**
   - Aguarde a confirmação (2-3 segundos)
   - Status deve mudar para ✅

3. **Estrutura Criada**:
   A aba será criada com as colunas:
   ```
   ID | Produto | Categoria | Quantidade | Valor_Unitario | 
   Valor_Total | Data_Movimento | Tipo_Movimento | Observacoes
   ```

### 🔧 **Criação Manual (Alternativa)**

Se preferir criar manualmente:

1. **Abrir Planilha**: Vá para sua planilha Google Sheets
2. **Nova Aba**: Clique no "+" e nomeie como **"Estoque"** (exato)
3. **Cabeçalhos**: Adicione os cabeçalhos na primeira linha
4. **Recarregar**: Volte ao OrganizaMEI e recarregue a página

### 🔄 **Funcionalidades da Integração de Estoque**

Com a aba ativa, você terá:

- **Entrada de Produtos**: Registrada automaticamente
- **Saídas/Vendas**: Movimentações sincronizadas
- **Histórico Completo**: Todas as operações registradas
- **Backup Automático**: Dados seguros na nuvem
- **Acesso Multiplataforma**: Dados disponíveis em qualquer dispositivo

---

## 💾 **Gerenciamento de Dados**

### 📤 **Exportação de Dados**

1. **Exportar Todos os Dados**:
   - Vá para **Configurações**
   - Clique em **"Exportar todos dados"** (se disponível)
   - Arquivo JSON será baixado automaticamente

2. **Conteúdo do Export**:
   - Produtos e estoque
   - Lançamentos financeiros
   - Categorias e subcategorias
   - Configurações do sistema

### 📥 **Importação de Dados**

1. **Importar Dados**:
   - Clique em **"Importar Dados"** (se disponível)
   - Selecione arquivo JSON válido
   - Confirme a substituição dos dados atuais

2. **⚠️ Cuidados**:
   - A importação **substitui** todos os dados atuais
   - Faça backup antes de importar
   - Verifique se o arquivo é compatível

### 🗑️ **Limpeza de Dados**

1. **Apagar Todos os Dados**:
   - Botão vermelho **"Apagar TODOS os dados"**
   - Confirmação dupla necessária
   - **⚠️ IRREVERSÍVEL** - use com cuidado

2. **O que é Apagado**:
   - Dados do localStorage (cache local)
   - **NÃO apaga** dados do Google Sheets
   - Sistema volta ao estado inicial

### 🔄 **Sincronização**

1. **Ressincronizar Tudo**:
   - Botão **"🔄 Ressincronizar Tudo"**
   - Baixa dados da planilha para o sistema
   - Substitui dados locais pelos da nuvem

2. **Quando Usar**:
   - Após editar dados diretamente na planilha
   - Para resolver problemas de sincronização
   - Para atualizar dados em novo dispositivo

---

## 🎨 **Personalização**

### 📅 **Filtros de Data**

1. **Localização**: Sidebar esquerda, acima da navegação
2. **Filtro por Mês**: Dropdown com meses do ano
3. **Filtro por Ano**: Dropdown com anos disponíveis
4. **Aplicar**: Botão **"Filtrar"** para aplicar seleção
5. **Persistência**: Filtros são salvos entre sessões

### 🎯 **Categorias Personalizadas**

1. **Acessar**: Aba **"Categorias"**
2. **Adicionar**: Formulário para novas categorias
3. **Subcategorias**: Cada categoria pode ter subcategorias
4. **Editar**: Clique no nome para editar
5. **Excluir**: Botão de lixeira (com confirmação)

### 📊 **Dashboard Personalizado**

O dashboard se adapta automaticamente aos seus dados:
- **Cards de Resumo**: Receitas, despesas, saldo
- **Produtos em Estoque**: Lista dinâmica
- **Métricas**: Calculadas em tempo real
- **Responsivo**: Adapta-se ao tamanho da tela

---

## 🔧 **Solução de Problemas**

### ❌ **Problemas de Conexão**

**Sintoma**: Status "Erro de conexão"

**Soluções**:
1. **Verificar URL**: Confirme se a URL do Web App está correta
2. **Testar Conexão**: Use o botão "🔍 Testar Conexão"
3. **Permissões**: Verifique se o acesso está como "Qualquer pessoa"
4. **Reautorizar**: Reimplante o Web App se necessário

### 📊 **Dados Não Sincronizam**

**Sintoma**: Lançamentos não aparecem na planilha

**Soluções**:
1. **Status de Sincronização**: Verifique indicador na aba Financeiro
2. **Ressincronizar**: Use "🔄 Ressincronizar Tudo"
3. **Cabeçalhos**: Confirme se a planilha tem cabeçalhos corretos
4. **Teste Simples**: Adicione um lançamento de teste

### 📦 **Estoque Não Detectado**

**Sintoma**: Status ❌ na aba Estoque

**Soluções**:
1. **Criar Automaticamente**: Use botão "Criar Aba Estoque"
2. **Nome Correto**: Verifique se a aba se chama exatamente "Estoque"
3. **Aguardar**: Detecção pode levar 3-5 segundos
4. **Recarregar**: Recarregue a página do OrganizaMEI

### 🔄 **Tutorial Não Funciona**

**Sintoma**: Tutorial não inicia ou trava

**Soluções**:
1. **Recarregar Página**: F5 ou Ctrl+R
2. **Limpar Cache**: Ctrl+Shift+R
3. **Navegador**: Teste em navegador diferente
4. **JavaScript**: Verifique se JavaScript está habilitado

---

## 🚀 **Recursos Avançados**

### 📊 **Relatórios DRE**

1. **Acessar**: Aba **"Gráficos"**
2. **Selecionar**: "DRE - Demonstrativo do Resultado"
3. **Visualizar**: Relatório completo com receitas e despesas
4. **Filtrar**: Use filtros de data para períodos específicos

### 📈 **Gráficos Interativos**

Disponíveis 15+ tipos de gráficos:
- **Vendas no período**
- **Ticket médio**
- **Evolução do patrimônio**
- **Fluxo de caixa**
- **Top categorias de gastos**
- **Gráficos de pizza** (receitas/despesas)
- **KPIs Dashboard**

### 🔍 **Análises Avançadas**

1. **Filtros Inteligentes**: Combine mês/ano para análises específicas
2. **Comparativos**: Compare períodos diferentes
3. **Tendências**: Visualize evolução temporal
4. **Performance**: Analise categorias mais rentáveis

### 📱 **Uso Mobile**

O sistema é totalmente responsivo:
- **Touch Friendly**: Botões otimizados para toque
- **Layout Adaptativo**: Interface se adapta à tela
- **Navegação Simplificada**: Menu colapsável
- **Performance**: Carregamento otimizado

### 🔐 **Segurança e Privacidade**

1. **Dados Locais**: Armazenados apenas no seu navegador
2. **URL Criptografada**: Salva com segurança
3. **HTTPS**: Comunicação segura com Google Sheets
4. **Acesso Privado**: Apenas você acessa seus dados

---

## 🎯 **Dicas de Uso Avançado**

### 💡 **Melhores Práticas**

1. **Backup Regular**: Exporte dados periodicamente
2. **Categorização**: Use categorias consistentes
3. **Descrições Claras**: Facilita análises futuras
4. **Filtros**: Use filtros para análises específicas
5. **Sincronização**: Mantenha dados sincronizados

### 🚀 **Otimização de Performance**

1. **Filtros de Data**: Use para reduzir volume de dados
2. **Limpeza Periódica**: Remova dados desnecessários
3. **Sincronização Seletiva**: Sincronize apenas quando necessário
4. **Cache Local**: Aproveite o armazenamento local

### 📊 **Análises Estratégicas**

1. **Tendências Mensais**: Compare meses para identificar padrões
2. **Categorias Rentáveis**: Identifique fontes de receita
3. **Controle de Gastos**: Monitore categorias de despesas
4. **Fluxo de Caixa**: Acompanhe entrada e saída de recursos

---

## 🆘 **Suporte e Recursos**

### 📚 **Documentação**

- **README.md**: Guia geral do sistema
- **ESTRUTURA-MODULAR.md**: Arquitetura técnica
- **ESTOQUE-INTEGRATION.md**: Detalhes da integração de estoque
- **Este tutorial**: Configurações completas

### 🔧 **Ferramentas de Diagnóstico**

- **Testar Conexão**: Valida integração Google Sheets
- **Status em Tempo Real**: Monitoramento contínuo
- **Logs de Erro**: Informações técnicas detalhadas
- **Recovery Automático**: Sistema se recupera de erros

### 🎓 **Aprendizado Contínuo**

- **Tutorial Interativo**: Sempre disponível
- **Tooltips Contextuais**: Ajuda em cada funcionalidade
- **Feedback Visual**: Sistema indica status das operações
- **Documentação Integrada**: README acessível nas configurações

---

## 🎉 **Conclusão**

O OrganizaMEI v2.0 oferece uma solução completa e flexível para gestão de MEI, com recursos que vão desde o controle básico até integrações avançadas com Google Sheets. 

**Principais benefícios**:
- ✅ **Flexibilidade**: Funciona com ou sem integração
- ✅ **Simplicidade**: Interface intuitiva e tutorial interativo
- ✅ **Robustez**: Sistema modular e confiável
- ✅ **Escalabilidade**: Cresce com seu negócio
- ✅ **Segurança**: Dados protegidos e backup automático

**Próximos passos**:
1. Configure a integração Google Sheets se desejar backup na nuvem
2. Explore todas as funcionalidades através do tutorial
3. Personalize categorias conforme seu negócio
4. Use relatórios para análises estratégicas

---

**OrganizaMEI v2.0** - Sua gestão empresarial simplificada e inteligente! 🚀