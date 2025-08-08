# Implementação da Verificação de Timestamp

## Alterações Realizadas

### 1. Arquivo `js/main.js` - ✅ IMPLEMENTADO
- Adicionada função `verificarDadosAtualizados()` que verifica se os dados locais estão sincronizados
- Adicionada função `acionarSincronizacaoSeNecessario()` que aciona o botão "btn-sync-all" automaticamente
- Verificação executada 3 segundos após carregar a página

### 2. Google Apps Script - ⚠️ PENDENTE
Você precisa adicionar o seguinte código ao seu arquivo `Código.gs`:

```javascript
// Adicione esta função
function verificarTimestamp(timestampLocal) {
  try {
    const planilha = SpreadsheetApp.openById('SUA_PLANILHA_ID');
    const aba = planilha.getSheetByName('Financeiro');
    
    if (!aba) {
      return { success: false, message: 'Aba Financeiro não encontrada' };
    }
    
    const ultimaModificacaoRemota = planilha.getLastUpdated().getTime();
    const timestampLocalNum = parseInt(timestampLocal);
    
    // Considera dados atualizados se a diferença for menor que 1 minuto
    const dadosAtualizados = (ultimaModificacaoRemota - timestampLocalNum) <= 60000;
    
    return {
      success: true,
      dadosAtualizados: dadosAtualizados,
      timestampRemoto: ultimaModificacaoRemota,
      timestampLocal: timestampLocalNum
    };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}
```

E adicione este case na sua função `doPost` existente:

```javascript
case 'verificarTimestamp':
  return ContentService
    .createTextOutput(JSON.stringify(verificarTimestamp(dados.timestampLocal)))
    .setMimeType(ContentService.MimeType.JSON);
```

## Como Funciona

1. **Ao carregar a página**: Aguarda 3 segundos e verifica se os dados estão atualizados
2. **Se estiver atualizado**: Não faz nada
3. **Se estiver desatualizado**: Aciona automaticamente o botão "Ressincronizar Tudo"
4. **Notificação**: Mostra notificação informando sobre a sincronização automática

## Configuração Necessária

1. Adicione o código do Google Apps Script ao seu `Código.gs`
2. Substitua `'SUA_PLANILHA_ID'` pelo ID real da sua planilha
3. Reimplante o Web App no Google Apps Script
4. Teste a funcionalidade recarregando a página do OrganizaMEI