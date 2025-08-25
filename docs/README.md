# 🚀 **OrganizaMEI v6.0** - Sistema de Gestão para MEI

> Sistema modular e inteligente para controle financeiro, estoque e vendas com integração opcional ao Google Sheets, tutorial interativo, sistema de temas e sincronização inteligente.

## 📋 **Funcionalidades Principais**

### 🎓 **Tutorial Interativo Completo**
- Tutorial guiado com 12 passos
- Navegação automática entre abas
- Sistema de progresso visual com barra
- Opção de pular, voltar ou refazer tutorial
- Auto-inicialização para novos usuários
- Flexibilidade total de navegação

### 🎨 **Sistema de Temas Expandido**
- **Default**: Tema padrão azul/verde
- **Police**: Tema alternativo com design único
- **Office**: Tema corporativo profissional
- Transições suaves com overlay
- Configuração persistente no navegador
- Preview visual antes da seleção

### ⌨️ **Atalhos de Teclado Unificados**
- **Globais:** F1-F8 para navegação rápida entre abas
- **Financeiro:** F9, Ctrl+R/D/L, Ctrl+Enter, Esc
- **Gráficos:** ↑↓ para navegar entre tipos
- **Configurável:** Ativar/desativar atalhos e feedback
- **Inteligente:** Atalhos contextuais por aba

### 📱 **PWA (Progressive Web App) Avançado**
- Instalável como aplicativo nativo
- Funciona completamente offline
- Ícones personalizados para todos os tamanhos
- Tela cheia otimizada para mobile
- Categorizado como finance/business/productivity

### 💰 **Gestão Financeira Inteligente**
- Controle completo de receitas e despesas
- Sistema de categorias e subcategorias
- Lançamentos automáticos de vendas
- Relatórios DRE completos e detalhados
- KPIs e indicadores em tempo real
- Pesquisa avançada e filtros
- Paginação inteligente

### 📦 **Controle de Estoque Avançado**
- Cadastro e gestão completa de produtos
- Movimentações detalhadas (entrada/saída/venda)
- Integração automática com vendas e financeiro
- Histórico completo de movimentações
- Edição e exclusão de movimentações
- Sistema de quebras e perdas

### 📊 **Dashboard e Relatórios Completos**
- Visão geral em tempo real
- 15+ tipos de gráficos interativos
- Análises de tendências e evolução
- Filtros avançados por período
- Exportação para Excel
- DRE detalhado por subcategorias

### 🔗 **Integração Google Sheets Inteligente**
- Sincronização automática e inteligente
- Verificação por timestamp usando IDs únicos
- Backup automático na nuvem
- Detecção automática de abas
- Criação automática da aba Estoque
- Status visual em tempo real

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
- ✅ **Verificação automática** de dados desatualizados
- ✅ **Verificação por timestamp** usando IDs únicos (DDMMAAAAHHMMSS)
- ✅ **Loading inteligente** - tela de carregamento apenas quando necessário
- ✅ **Sincronização não invasiva** - executa apenas se dados estiverem desatualizados

### 📱 **Interface Moderna**
- ✅ **Design responsivo** para mobile
- ✅ **Tutorial interativo** para novos usuários
- ✅ **Sistema de temas** (Default e Police)
- ✅ **PWA** - Instalável como aplicativo
- ✅ **Atalhos de teclado** globais e contextuais
- ✅ **Filtros por período** (mês/ano)
- ✅ **Gráficos interativos** com Chart.js
- ✅ **Notificações visuais** de status
- ✅ **Loading manager** com feedback visual

### 🛡️ **Segurança e Backup**
- ✅ **Armazenamento local** (localStorage)
- ✅ **Backup automático** na nuvem
- ✅ **Exportação/Importação** de dados
- ✅ **URL criptografada** no navegador
- ✅ **Verificação de integridade** com hash
- ✅ **Sincronização otimizada** para evitar duplicatas

### 📊 **Relatórios e Análises**
- ✅ **DRE completo** (Demonstrativo do Resultado)
- ✅ **KPIs de performance** em tempo real
- ✅ **Gráficos de tendências** e evolução
- ✅ **Análise por categorias** e subcategorias

### 🎯 **Verificação de Sincronização Inteligente**
- ✅ **Detecção automática** de dados desatualizados ao carregar a página
- ✅ **Comparação por timestamp** usando IDs únicos no formato DDMMAAAAHHMMSS
- ✅ **Sincronização condicional** - executa "Ressincronizar Tudo" apenas se necessário
- ✅ **Loading otimizado** - tela de carregamento aparece apenas durante sincronização
- ✅ **Experiência fluida** - usuário não percebe verificações quando dados estão atualizados
- ✅ **Verificação rápida** - compara apenas o último ID local vs. remoto
- ✅ **Fallback inteligente** - em caso de erro, não bloqueia o sistema

---

## 🔄 **Histórico de Versões**

### 🆕 **v6.0 (Atual)**
- 🔄 **Sincronização Inteligente Avançada:** Verificação automática com timestamps únicos
- 🎛️ **Loading Manager:** Sistema unificado de feedback visual
- 📱 **Otimizações Mobile:** Melhor suporte a teclado virtual e gestos
- 🎨 **Temas Expandidos:** Default, Police e Office com transições suaves
- ⌨️ **Atalhos Unificados:** Sistema completo de navegação por teclado
- 🎓 **Tutorial Completo:** 12 passos com navegação automática
- 📊 **Gráficos Avançados:** 15+ tipos com exportação Excel
- 🛠️ **Arquitetura Modular:** Código organizado e otimizado

### **v4.0**
- 🎓 Tutorial interativo completo
- 🎨 Sistema de temas avançado
- ⌨️ Atalhos de teclado unificados
- 📱 PWA com instalação nativa
- 🔄 Sincronização otimizada com hash
- 🎛️ Loading manager inteligente
- 📁 Arquitetura modular completa

### **v3.x**
- Integração com Google Sheets
- Sistema de categorias e subcategorias
- Gráficos interativos
- Controle de estoque avançado

### **v2.x**
- Interface responsiva
- Filtros por período
- Exportação/importação de dados
- Dashboard com KPIs

### **v1.x**
- Funcionalidades básicas
- Controle financeiro
- Estoque simples

---

## 🆕 **Novidades da Versão 5.2**

### 🎨 **Sistema de Temas Expandido**
- **Novos temas Beta:** Office e Police com designs únicos
- **Seletor aprimorado:** Interface mais intuitiva para escolha de temas
- **Transições melhoradas:** Efeitos visuais mais suaves na troca
- **Compatibilidade:** Migração automática de temas antigos

### 📱 **Otimizações Mobile Avançadas**
- **Teclado virtual:** Detecção inteligente e ajuste automático de layout
- **Gestos touch:** Melhor resposta a toques e navegação
- **Modais responsivos:** Adaptação automática ao teclado virtual
- **Performance:** Carregamento mais rápido em dispositivos móveis

### 🔄 **Sincronização Inteligente Aprimorada**
- **Verificação automática:** Detecção de dados desatualizados na inicialização
- **Sincronização condicional:** Executa apenas quando necessário
- **Feedback visual:** Indicadores de status em tempo real
- **Recuperação automática:** Correção inteligente de problemas de sincronização

### 📊 **GitHub Integration**
- **Changelog automático:** Visualização das últimas atualizações do repositório
- **Histórico completo:** Acesso a todas as mudanças e melhorias
- **Interface integrada:** Visualizador nativo dentro do sistema
- **Atualizações em tempo real:** Sempre informado sobre novas versões

### 🎓 **Tutorial e Onboarding Melhorados**
- **Navegação inteligente:** Tutorial navega automaticamente pelas abas
- **Progresso visual:** Barra de progresso e contador de etapas
- **Flexibilidade:** Opção de pular, voltar ou refazer
- **Auto-inicialização:** Inicia automaticamente para novos usuários

### ⌨️ **Sistema de Atalhos Unificado**
- **Atalhos globais:** F1-F8 ou 1-7 para navegação rápida
- **Contextuais:** Atalhos específicos para cada módulo
- **Configurável:** Ativar/desativar atalhos e feedback
- **Feedback visual:** Notificações dos atalhos executados

---

## 🆕 **Novidades da Versão 5.0**

### 🎯 **Interface Aprimorada**
- **Design refinado:** Interface mais limpa e intuitiva
- **Responsividade melhorada:** Melhor experiência em dispositivos móveis
- **Navegação otimizada:** Transições mais suaves entre seções
- **Acessibilidade:** Melhor suporte para navegação por teclado
- **Performance visual:** Carregamento mais rápido de elementos

### 📱 **Melhorias Mobile e PWA**
- **Interface mobile:** Otimizações específicas para telas pequenas
- **Gestos touch:** Melhor resposta a toques e gestos
- **PWA aprimorado:** Instalação e funcionamento offline melhorados
- **Ícones atualizados:** Novos ícones para melhor identificação
- **Notificações:** Sistema de notificações mais eficiente

### 🔄 **Sistema de Sincronização Evoluído**
- **Sincronização inteligente:** Detecção automática de mudanças
- **Backup otimizado:** Sistema de backup mais confiável
- **Recuperação de dados:** Melhor tratamento de erros de conexão
- **Performance:** Sincronização mais rápida e eficiente
- **Status em tempo real:** Indicadores visuais de status melhorados

### 📊 **Dashboard e Relatórios Aprimorados**
- **Novos indicadores:** KPIs mais relevantes e precisos
- **Gráficos otimizados:** Visualizações mais claras e informativas
- **Filtros avançados:** Melhor controle de períodos e categorias
- **Exportação melhorada:** Novos formatos de exportação
- **Análises detalhadas:** Relatórios mais completos

### 🛠️ **Melhorias Técnicas**
- **Código otimizado:** Melhor performance e manutenibilidade
- **Correções de bugs:** Resolução de problemas identificados
- **Compatibilidade:** Melhor suporte a diferentes navegadores
- **Segurança:** Aprimoramentos na proteção de dados
- **Estabilidade:** Sistema mais robusto e confiável

---

## 📋 **Funcionalidades da Versão 4.0**

### 🎯 **Tutorial Interativo Completo**
- **Auto-inicialização:** Tutorial inicia automaticamente para novos usuários
- **Navegação guiada:** 12 passos cobrindo todas as funcionalidades
- **Progresso visual:** Barra de progresso e contador de etapas
- **Flexibilidade:** Opção de pular, voltar ou refazer o tutorial
- **Integração:** Tutorial navega automaticamente pelas abas

### 🎨 **Sistema de Temas Expandido**
- **Múltiplos temas:** Default, Police Beta e Office Beta disponíveis
- **Transições suaves:** Overlay de transição entre temas
- **Persistência:** Tema salvo automaticamente no navegador
- **Preview visual:** Visualização dos temas antes da seleção
- **Migração automática:** Conversão de temas antigos
- **Novos temas Beta:** Office (corporativo) e Police (alternativo)

### ⌨️ **Sistema de Atalhos Unificado**
- **Atalhos globais:** F1-F8 ou números 1-7 para navegação
- **Atalhos contextuais:** Específicos para cada aba
- **Feedback visual:** Notificações dos atalhos executados
- **Configurável:** Ativar/desativar atalhos e feedback
- **Inteligente:** Atalhos ativos apenas na aba correspondente

### 📱 **PWA (Progressive Web App)**
- **Instalável:** Funciona como aplicativo nativo
- **Offline:** Dados salvos localmente
- **Ícones personalizados:** Ícones específicos para diferentes tamanhos
- **Tela cheia:** Experiência imersiva no mobile
- **Categorização:** Listado nas categorias finance, business, productivity

### 🔄 **Sincronização Otimizada**
- **Verificação automática:** Detecta dados desatualizados
- **Hash de integridade:** Compara dados locais vs. nuvem
- **Loading inteligente:** Feedback visual durante sincronização
- **Prevenção de loops:** Evita sincronizações desnecessárias
- **Timestamp tracking:** Controle de última verificação

### 🎛️ **Interface Aprimorada**
- **Loading manager:** Sistema unificado de loading
- **Notificações melhoradas:** Sistema de notificações visuais
- **Animações suaves:** Transições e efeitos visuais
- **Responsividade:** Otimizado para todos os dispositivos
- **Acessibilidade:** Melhor suporte a navegação por teclado

### 🔧 **Arquitetura Modular**
- **Separação de responsabilidades:** Cada funcionalidade em arquivo próprio
- **Carregamento otimizado:** Scripts carregados com defer
- **Manutenibilidade:** Código organizado e documentado
- **Extensibilidade:** Fácil adição de novas funcionalidades
- **Performance:** Carregamento mais rápido e eficiente

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

1. **Primeira visita:** O tutorial interativo será iniciado automaticamente
2. **Sem integração:** Abra o OrganizaMEI e comece a usar localmente
3. **Com integração:** Configure o Google Sheets seguindo este guia
4. **Personalização:** Escolha seu tema preferido nas configurações
5. **Atalhos:** Ative os atalhos de teclado para maior produtividade
6. **PWA:** Instale como aplicativo através do navegador
7. **Suporte:** Consulte a documentação completa nos arquivos do projeto

### ⌨️ **Atalhos Principais**
- **F1-F8:** Navegação rápida entre abas
- **1-7:** Navegação alternativa entre abas
- **Financeiro:** ← → (receita/despesa), Enter (enviar), Esc (limpar)
- **Gráficos:** ↑ ↓ (navegar tipos de gráfico)

### 🎨 **Temas Disponíveis**
- **Default:** Tema padrão com cores azul/verde
- **Police Beta:** Tema alternativo com visual diferenciado
- **Office Beta:** Tema corporativo com design profissional

## 💻 **Requisitos e Compatibilidade**

### 🌐 **Navegadores Suportados**
- ✅ **Chrome/Chromium** 80+ (recomendado)
- ✅ **Firefox** 75+
- ✅ **Safari** 13+
- ✅ **Edge** 80+
- ✅ **Opera** 67+

### 📱 **Dispositivos**
- ✅ **Desktop:** Windows, macOS, Linux
- ✅ **Mobile:** Android 7+, iOS 13+
- ✅ **Tablet:** Otimizado para tablets
- ✅ **PWA:** Instalável em todos os dispositivos

### 🔌 **Conectividade**
- ✅ **Offline:** Funciona completamente offline
- ✅ **Online:** Sincronização com Google Sheets
- ✅ **Baixa conectividade:** Otimizado para conexões lentas

### 💾 **Armazenamento**
- **Local:** localStorage do navegador
- **Nuvem:** Google Sheets (opcional)
- **Backup:** Exportação em JSON
- **Capacidade:** Ilimitada (limitada pelo navegador)

### 📚 **Documentação Adicional**
- 📄 `ESTRUTURA-MODULAR.md` - Arquitetura do sistema
- 📦 `ESTOQUE-INTEGRATION.md` - Detalhes da integração de estoque
- ⌨️ `ATALHOS-GLOBAL.md` - Sistema de atalhos de teclado
- 🎨 `FONT-AWESOME-MIGRATION.md` - Migração de ícones
- 🔄 `LOADING-SYSTEM.md` - Sistema de loading
- 🕰️ `IMPLEMENTACAO-TIMESTAMP.md` - Sistema de timestamps
- 🎓 `TUTORIAL-CONFIGURACOES.md` - Tutorial e configurações
- ⚙️ Tutorial de configurações integrado no sistema

### 📁 **Estrutura de Arquivos**
```
OrganizaMEI/
├── css/                    Estilos modulares
│   ├── style.css              Estilos principais
│   ├── dashboard.css          Dashboard
│   ├── tutorial.css           Tutorial interativo
│   ├── pwa.css               PWA styles
│   ├── mobile-modals.css      Modais responsivos
│   ├── readme-viewer.css      Visualizador de documentação
│   └── ...
├── js/                     JavaScript modular
│   ├── main.js               Arquivo principal unificado
│   ├── configuracoes.js      Sistema de configurações
│   ├── dashboard.js          Dashboard e KPIs
│   ├── estoque.js            Controle de estoque
│   ├── financeiro.js         Gestão financeira
│   ├── vendas.js             Histórico de vendas
│   ├── graficos.js           Relatórios e gráficos
│   ├── categorias.js         Gestão de categorias
│   ├── sheets-integration.js Integração Google Sheets
│   └── menu.js               Navegação e menus
├── themes/                 Temas visuais
│   ├── police.css            Tema Police Beta
│   └── office.css            Tema Office Beta
├── src/                    Recursos
│   ├── favicon/              Ícones PWA completos
│   └── OrganizaMEI.png       Logo principal
├── docs/                   Documentação
│   ├── README.md             Documentação principal
│   ├── DOCUMENTAÇÃO.md       Documentação técnica
│   └── SINCRONIZACAO-MELHORIAS.md
├── index.html              Arquivo principal
└── Código.gs               Script Google Apps Script
```

---

**OrganizaMEI v6.0** - Sistema completo de gestão para MEI com sincronização inteligente, tutorial interativo, temas expandidos e arquitetura modular otimizada.