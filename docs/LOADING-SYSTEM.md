# Sistema de Loading e Bloqueio de Interface

## Visão Geral

O sistema de loading foi implementado para bloquear automaticamente todos os botões e inputs da interface quando aparecer a mensagem "Dados desatualizados - sincronizando...". Isso garante que o usuário não possa interagir com a aplicação durante o processo de sincronização.

## Arquivos Implementados

### 1. `css/loading-overlay.css`
- Estilos para o overlay de carregamento
- Animações do spinner e efeitos visuais
- Estados desabilitados para botões e inputs
- Design responsivo para mobile

### 2. `js/loading-manager.js`
- Classe `LoadingManager` que gerencia o estado de loading
- Intercepta notificações de sincronização automaticamente
- Bloqueia/desbloqueia todos os elementos interativos
- Integração com as funções existentes de sincronização

## Como Funciona

### Detecção Automática
O sistema intercepta a função `mostrarNotificacaoSync` e detecta automaticamente quando:
- Mensagem contém "sincronizando" e tipo é "info" → **Ativa o loading**
- Mensagem contém "sincronizado" ou "sucesso" e tipo é "success" → **Desativa o loading**
- Tipo é "error" → **Desativa o loading**

### Bloqueio de Interface
Quando ativado, o sistema:
1. Mostra um overlay com spinner animado
2. Desabilita todos os botões, inputs e selects
3. Previne scroll da página
4. Salva o estado original dos elementos para restauração

### Integração com Sincronização
- Intercepta `acionarSincronizacaoSeNecessario()` do `main.js`
- Intercepta `sincronizarTudo()` do `sheets-integration.js`
- Garante que o loading seja mostrado durante todo o processo

## Uso Manual

```javascript
// Ativar loading manualmente
if (window.loadingManager) {
  window.loadingManager.startSyncLoading();
}

// Desativar loading manualmente
if (window.loadingManager) {
  window.loadingManager.stopSyncLoading();
}

// Verificar se está carregando
if (window.loadingManager && window.loadingManager.isCurrentlyLoading()) {
  console.log('Sistema está em loading');
}
```

## Personalização

### Mensagens
As mensagens podem ser personalizadas no método `showLoading()`:

```javascript
loadingManager.showLoading(
  'Sua mensagem principal',
  'Texto secundário'
);
```

### Estilos
Modifique `css/loading-overlay.css` para alterar:
- Cores do tema
- Animações do spinner
- Tamanhos e posicionamento
- Efeitos visuais

## Compatibilidade

- ✅ Funciona com todas as funções de sincronização existentes
- ✅ Mantém compatibilidade com notificações atuais
- ✅ Responsivo para desktop e mobile
- ✅ Não interfere com outras funcionalidades

## Segurança

- Previne interações acidentais durante sincronização
- Mantém estado original dos elementos
- Restaura interface corretamente após conclusão
- Trata erros e exceções adequadamente

## Manutenção

Para adicionar novos elementos que devem ser bloqueados:
1. Modifique `disableAllInteractions()` em `loading-manager.js`
2. Adicione seletores CSS específicos se necessário
3. Teste a restauração do estado original