# Estrutura Modular do OrganizaMEI

## 📁 Organização dos Arquivos

O projeto foi reorganizado em uma estrutura modular para melhor manutenibilidade e organização do código.

### 🎯 JavaScript Modular

#### `js/utils.js`
- **Responsabilidade**: Utilitários compartilhados
- **Conteúdo**: 
  - Funções de formatação (formatarMoedaBR)
  - Geração de IDs únicos
  - Variáveis globais (produtos, lancamentos, categorias)
  - Funções de salvamento no localStorage

#### `js/dashboard.js`
- **Responsabilidade**: Dashboard principal
- **Conteúdo**:
  - Renderização dos cards de resumo
  - Cálculos de KPIs
  - Saúde financeira

#### `js/estoque.js`
- **Responsabilidade**: Controle de estoque
- **Conteúdo**:
  - Gerenciamento de produtos
  - Entrada e saída de produtos
  - Modal de saída
  - Integração com vendas

#### `js/financeiro.js`
- **Responsabilidade**: Gestão financeira
- **Conteúdo**:
  - Lançamentos de receitas/despesas
  - Resumo financeiro
  - Sincronização com Google Sheets
  - Sistema de avisos

#### `js/vendas.js`
- **Responsabilidade**: Controle de vendas
- **Conteúdo**:
  - Listagem de vendas
  - Edição de datas
  - Filtros de vendas

#### `js/categorias.js`
- **Responsabilidade**: Gerenciamento de categorias
- **Conteúdo**:
  - CRUD de categorias e subcategorias
  - Interface de edição
  - Popups de confirmação

#### `js/graficos.js`
- **Responsabilidade**: Visualizações e relatórios
- **Conteúdo**:
  - Todos os tipos de gráficos
  - DRE (Demonstrativo do Resultado)
  - KPIs Dashboard
  - Charts.js integration

#### `js/configuracoes.js`
- **Responsabilidade**: Configurações do sistema
- **Conteúdo**:
  - Importação/exportação de dados
  - Limpeza de dados
  - Configurações gerais

#### `js/filtros.js`
- **Responsabilidade**: Sistema de filtros
- **Conteúdo**:
  - Filtros de mês/ano
  - Persistência de filtros
  - Atualização de dados filtrados

### 🎨 CSS Modular

#### `css/style.css`
- **Responsabilidade**: Estilos base
- **Conteúdo**: Layout geral, sidebar, navegação

#### `css/dashboard.css`
- **Responsabilidade**: Estilos do dashboard
- **Conteúdo**: Cards de resumo, grid responsivo

#### `css/estoque.css`
- **Responsabilidade**: Estilos do estoque
- **Conteúdo**: Lista de produtos, modal de saída

#### `css/financeiro.css`
- **Responsabilidade**: Estilos financeiros
- **Conteúdo**: Lançamentos, sincronização, avisos

#### `css/vendas.css`
- **Responsabilidade**: Estilos de vendas
- **Conteúdo**: Lista de vendas, edição inline

#### `css/categorias.css`
- **Responsabilidade**: Estilos de categorias
- **Conteúdo**: Cards de categorias, subcategorias

#### `css/graficos.css`
- **Responsabilidade**: Estilos de gráficos
- **Conteúdo**: Canvas, DRE, KPIs, tabelas

#### `css/configuracoes.css`
- **Responsabilidade**: Estilos de configurações
- **Conteúdo**: Botões, integração Google Sheets

#### `css/filtros.css`
- **Responsabilidade**: Estilos de filtros
- **Conteúdo**: Selects de mês/ano, responsividade

## 🔄 Fluxo de Carregamento

1. **utils.js** - Carrega primeiro (dependências base)
2. **filtros.js** - Sistema de filtros
3. **dashboard.js** - Dashboard principal
4. **estoque.js** - Controle de estoque
5. **financeiro.js** - Gestão financeira
6. **vendas.js** - Controle de vendas
7. **categorias.js** - Gerenciamento de categorias
8. **graficos.js** - Visualizações
9. **configuracoes.js** - Configurações
10. **sheets-integration.js** - Integração Google Sheets
11. **tutorial.js** - Sistema de tutorial

## 🔗 Comunicação Entre Módulos

### Funções Globais Expostas:
- `formatarMoedaBR()` - Formatação de moeda
- `gerarIdentificadorUnico()` - Geração de IDs
- `renderizarDashboardResumo()` - Atualização do dashboard
- `renderizarLancamentos()` - Atualização financeira
- `renderizarVendas()` - Atualização de vendas
- `atualizarFiltroMesAno()` - Atualização de filtros

### Variáveis Globais:
- `window.produtos` - Array de produtos
- `window.lancamentos` - Array de lançamentos
- `window.categorias` - Objeto de categorias
- `window.filtroMes` - Filtro de mês ativo
- `window.filtroAno` - Filtro de ano ativo

## 📱 Responsividade

Cada módulo CSS inclui:
- Breakpoints para mobile (480px)
- Breakpoints para tablet (800px)
- Touch targets adequados
- Layout flexível

## 🚀 Vantagens da Modularização

1. **Manutenibilidade**: Cada funcionalidade em arquivo separado
2. **Reutilização**: Código compartilhado em utils.js
3. **Performance**: Carregamento otimizado
4. **Organização**: Estrutura clara e lógica
5. **Escalabilidade**: Fácil adição de novos módulos
6. **Debug**: Isolamento de problemas por módulo

## 🔧 Como Adicionar Novos Módulos

1. Criar arquivo JS em `js/nome-modulo.js`
2. Criar arquivo CSS em `css/nome-modulo.css`
3. Adicionar imports no `index.html`
4. Expor funções necessárias via `window.`
5. Documentar no README

## 📋 Checklist de Migração

- ✅ Utilitários extraídos para utils.js
- ✅ Dashboard modularizado
- ✅ Estoque modularizado
- ✅ Financeiro modularizado
- ✅ Vendas modularizadas
- ✅ Categorias modularizadas
- ✅ Gráficos modularizados
- ✅ Configurações modularizadas
- ✅ Filtros modularizados
- ✅ CSS modularizado
- ✅ HTML atualizado
- ✅ Comunicação entre módulos testada