// ========================================
// CONFIGURAÇÃO ÚNICA - ALTERE APENAS AQUI
// ========================================
// Substitua 'SUA_PLANILHA_ID' pelo ID real da sua planilha
// Para encontrar o ID: abra sua planilha e copie a parte entre /d/ e /edit da URL
// Exemplo: https://docs.google.com/spreadsheets/d/1ABC123DEF456/edit
// O ID seria: 1ABC123DEF456

const SHEET_ID = 'SUA_PLANILHA_ID';

// ========================================
// NÃO ALTERE NADA ABAIXO DESTA LINHA
// ========================================

// Função para gerar identificador único no formato DDMMAAAAHHMMSS
function gerarIdentificadorUnico() {
  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const ano = agora.getFullYear();
  const hora = String(agora.getHours()).padStart(2, '0');
  const minuto = String(agora.getMinutes()).padStart(2, '0');
  const segundo = String(agora.getSeconds()).padStart(2, '0');
  
  return `${dia}${mes}${ano}${hora}${minuto}${segundo}`;
}

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'read') {
    return readFinanceiroData();
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({success: false, message: 'Ação não reconhecida'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    
    if (data.action === 'insert') {
      return insertFinanceiroData(data.data);
    }
    
    if (data.action === 'insertBatch') {
      return insertFinanceiroBatch(data.data);
    }
    
    if (data.action === 'delete') {
      return deleteByIdBothSheets(data.id);
    }
    
    if (data.action === 'deleteById') {
      return deleteByIdBothSheets(data.id);
    }
    
    if (data.action === 'update') {
      return updateFinanceiroData(data.data);
    }
    
    if (data.action === 'updateById') {
      return updateByIdBothSheets(data.data);
    }
    
    if (data.action === 'verificarSincronizacao') {
      return verificarSincronizacao(data.hashLocal);
    }
    
    if (data.action === 'verificarAbaEstoque') {
      return verificarAbaEstoque();
    }
    
    if (data.action === 'criarAbaEstoque') {
      return criarAbaEstoque();
    }
    
    if (data.action === 'insertEstoque') {
      return insertEstoqueData(data.data);
    }
    
    if (data.action === 'readEstoque') {
      return readEstoqueData();
    }
    
    if (data.action === 'deleteEstoque') {
      if (data.id) {
        return deleteEstoqueById(data.id);
      } else {
        return deleteEstoqueData(data.produto);
      }
    }
    
    if (data.action === 'updateEstoque') {
      return updateEstoqueData(data.data);
    }
    
    if (data.action === 'updateEstoqueById') {
      return updateEstoqueById(data.data);
    }
    
    if (data.action === 'deleteEstoqueById') {
      return deleteEstoqueById(data.id);
    }
    
    if (data.action === 'removerMovimentacaoEstoque') {
      return removerMovimentacaoEstoque(data.id);
    }
    
    if (data.action === 'editarMovimentacaoEstoque') {
      return editarMovimentacaoEstoque(data.data);
    }
    
    if (data.action === 'testarScript') {
      return testarScript();
    }
    
    if (data.action === 'verificarTimestamp') {
      return ContentService
        .createTextOutput(JSON.stringify(verificarTimestamp(data.timestampLocal)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Ação não reconhecida'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// FUNÇÃO ROBUSTA: Excluir por ID - Financeiro ou Estoque
function deleteByIdBothSheets(id) {
  try {
    if (!id) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'ID é obrigatório'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const planilha = SpreadsheetApp.openById(SHEET_ID);
    let deletedCount = 0;
    let messages = [];
    const targetId = String(id).replace(/^'/, '');
    
    console.log('Procurando item com ID:', targetId);
    
    // Excluir do Financeiro
    const abaFinanceiro = planilha.getSheetByName('Financeiro') || planilha.getActiveSheet();
    if (abaFinanceiro && abaFinanceiro.getLastRow() > 1) {
      const range = abaFinanceiro.getRange(2, 1, abaFinanceiro.getLastRow() - 1, 1);
      const values = range.getValues();
      
      for (let i = values.length - 1; i >= 0; i--) {
        const idPlanilha = String(values[i][0]).replace(/^'/, '');
        if (idPlanilha === targetId) {
          abaFinanceiro.deleteRow(i + 2);
          deletedCount++;
          messages.push('Financeiro');
          console.log('Item excluído do Financeiro, linha:', i + 2);
          break;
        }
      }
    }
    
    // Excluir do Estoque
    const abaEstoque = planilha.getSheetByName('Estoque');
    if (abaEstoque && abaEstoque.getLastRow() > 1) {
      const range = abaEstoque.getRange(2, 1, abaEstoque.getLastRow() - 1, 1);
      const values = range.getValues();
      
      for (let i = values.length - 1; i >= 0; i--) {
        const idPlanilha = String(values[i][0]).replace(/^'/, '');
        if (idPlanilha === targetId) {
          abaEstoque.deleteRow(i + 2);
          deletedCount++;
          messages.push('Estoque');
          console.log('Item excluído do Estoque, linha:', i + 2);
          break;
        }
      }
    }
    
    if (deletedCount > 0) {
      console.log('Exclusão bem-sucedida. Total excluído:', deletedCount);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true, 
          message: `Item excluído de: ${messages.join(', ')}`,
          deletedCount: deletedCount
        }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      console.log('Item não encontrado com ID:', targetId);
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Item não encontrado'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    console.error('Erro na exclusão:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// FUNÇÃO ROBUSTA: Excluir movimentação de estoque por ID
function removerMovimentacaoEstoque(id) {
  try {
    if (!id) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'ID é obrigatório'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const planilha = SpreadsheetApp.openById(SHEET_ID);
    let deletedCount = 0;
    let messages = [];
    const targetId = String(id).replace(/^'/, '');
    
    console.log('Procurando movimentação com ID:', targetId);
    
    // Excluir do Estoque
    const abaEstoque = planilha.getSheetByName('Estoque');
    if (abaEstoque && abaEstoque.getLastRow() > 1) {
      const range = abaEstoque.getRange(2, 1, abaEstoque.getLastRow() - 1, 1);
      const values = range.getValues();
      
      for (let i = values.length - 1; i >= 0; i--) {
        const idPlanilha = String(values[i][0]).replace(/^'/, '');
        if (idPlanilha === targetId) {
          abaEstoque.deleteRow(i + 2);
          deletedCount++;
          messages.push('Estoque');
          console.log('Movimentação excluída do Estoque, linha:', i + 2);
          break;
        }
      }
    }
    
    // Excluir do Financeiro usando o mesmo ID
    const abaFinanceiro = planilha.getSheetByName('Financeiro') || planilha.getActiveSheet();
    if (abaFinanceiro && abaFinanceiro.getLastRow() > 1) {
      const range = abaFinanceiro.getRange(2, 1, abaFinanceiro.getLastRow() - 1, 1);
      const values = range.getValues();
      
      for (let i = values.length - 1; i >= 0; i--) {
        const idPlanilha = String(values[i][0]).replace(/^'/, '');
        if (idPlanilha === targetId) {
          abaFinanceiro.deleteRow(i + 2);
          deletedCount++;
          messages.push('Financeiro');
          console.log('Lançamento excluído do Financeiro, linha:', i + 2);
          break;
        }
      }
    }
    
    if (deletedCount > 0) {
      console.log('Exclusão bem-sucedida. Total excluído:', deletedCount);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true, 
          message: `Movimentação excluída de: ${messages.join(', ')}`,
          deletedCount: deletedCount
        }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Movimentação não encontrada'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
      
  } catch (error) {
    console.error('Erro na exclusão de movimentação:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// FUNÇÃO ROBUSTA: Editar movimentação de estoque por ID
function editarMovimentacaoEstoque(dados) {
  try {
    if (!dados || !dados.id) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'ID é obrigatório para edição'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const planilha = SpreadsheetApp.openById(SHEET_ID);
    const abaEstoque = planilha.getSheetByName('Estoque');
    
    if (!abaEstoque || abaEstoque.getLastRow() <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Nenhuma movimentação para editar'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const targetId = String(dados.id).replace(/^'/, '');
    const range = abaEstoque.getRange(2, 1, abaEstoque.getLastRow() - 1, 9);
    const values = range.getValues();
    
    console.log('Procurando movimentação para editar com ID:', targetId);
    console.log('Dados para atualização:', dados);
    
    for (let i = 0; i < values.length; i++) {
      const idPlanilha = String(values[i][0]).replace(/^'/, '');
      if (idPlanilha === targetId) {
        abaEstoque.getRange(i + 2, 1, 1, 9).setValues([[
          "'" + dados.id,
          dados.produto,
          dados.categoria || '',
          dados.quantidade,
          dados.valorUnitario || 0,
          dados.valorTotal || 0,
          dados.data,
          dados.tipoMovimento,
          dados.observacoes || ''
        ]]);
        
        console.log('Movimentação de estoque atualizada, linha:', i + 2);
        return ContentService
          .createTextOutput(JSON.stringify({success: true, message: 'Movimentação atualizada com sucesso'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Movimentação não encontrada para edição'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Erro na edição de movimentação:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// FUNÇÃO ROBUSTA: Editar por ID em ambas as abas
function updateByIdBothSheets(data) {
  try {
    if (!data || !data.id) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'ID é obrigatório para edição'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const planilha = SpreadsheetApp.openById(SHEET_ID);
    let updatedCount = 0;
    let messages = [];
    const targetId = String(data.id).replace(/^'/, '');
    
    console.log('Procurando item para editar com ID:', targetId);
    console.log('Dados para atualização:', data);
    
    // Atualizar no Financeiro
    const abaFinanceiro = planilha.getSheetByName('Financeiro') || planilha.getActiveSheet();
    if (abaFinanceiro && abaFinanceiro.getLastRow() > 1) {
      const range = abaFinanceiro.getRange(2, 1, abaFinanceiro.getLastRow() - 1, 8);
      const values = range.getValues();
      
      for (let i = 0; i < values.length; i++) {
        const idPlanilha = String(values[i][0]).replace(/^'/, '');
        if (idPlanilha === targetId) {
          // Formatar data
          let dataFormatada = data.data;
          if (data.data && data.data.includes('/')) {
            dataFormatada = data.data;
          } else if (data.data) {
            const date = new Date(data.data);
            if (!isNaN(date.getTime())) {
              const dia = String(date.getDate()).padStart(2, '0');
              const mes = String(date.getMonth() + 1).padStart(2, '0');
              const ano = date.getFullYear();
              dataFormatada = `${dia}/${mes}/${ano}`;
            }
          }
          
          abaFinanceiro.getRange(i + 2, 1, 1, 8).setValues([[
            "'" + data.id,
            data.tipo,
            data.categoria,
            data.subcategoria,
            data.descricao,
            data.quantidade || 1,
            data.valor,
            dataFormatada
          ]]);
          
          updatedCount++;
          messages.push('Financeiro');
          console.log('Item atualizado no Financeiro, linha:', i + 2);
          break;
        }
      }
    }
    
    // Atualizar no Estoque (se for uma venda)
    if (data.categoria === 'Vendas' && data.subcategoria === 'Produtos') {
      const abaEstoque = planilha.getSheetByName('Estoque');
      if (abaEstoque && abaEstoque.getLastRow() > 1) {
        const range = abaEstoque.getRange(2, 1, abaEstoque.getLastRow() - 1, 9);
        const values = range.getValues();
        
        for (let i = 0; i < values.length; i++) {
          const idPlanilha = String(values[i][0]).replace(/^'/, '');
          if (idPlanilha === targetId) {
            abaEstoque.getRange(i + 2, 1, 1, 9).setValues([[
              data.id,
              data.descricao,
              'Saída',
              data.quantidade || 1,
              data.valor / (data.quantidade || 1),
              data.valor,
              data.data,
              'Venda',
              'Venda de produto'
            ]]);
            
            updatedCount++;
            messages.push('Estoque');
            console.log('Item atualizado no Estoque, linha:', i + 2);
            break;
          }
        }
      }
    }
    
    if (updatedCount > 0) {
      console.log('Atualização bem-sucedida. Total atualizado:', updatedCount);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true, 
          message: `Item atualizado em: ${messages.join(', ')}`,
          updatedCount: updatedCount
        }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      console.log('Item não encontrado para atualização com ID:', targetId);
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Item não encontrado para edição'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    console.error('Erro na atualização:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateFinanceiroData(data) {
  try {
    if (!data || !data.id) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'ID é obrigatório'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Nenhum dado para editar'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const targetId = String(data.id).replace(/^'/, '');
    const range = sheet.getRange(2, 1, lastRow - 1, 8);
    const values = range.getValues();
    
    for (let i = 0; i < values.length; i++) {
      const idPlanilha = String(values[i][0]).replace(/^'/, '');
      if (idPlanilha === targetId) {
        let dataFormatada = data.data;
        if (data.data && data.data.includes('/')) {
          dataFormatada = data.data;
        } else if (data.data) {
          const date = new Date(data.data);
          if (!isNaN(date.getTime())) {
            const dia = String(date.getDate()).padStart(2, '0');
            const mes = String(date.getMonth() + 1).padStart(2, '0');
            const ano = date.getFullYear();
            dataFormatada = `${dia}/${mes}/${ano}`;
          }
        }
        
        sheet.getRange(i + 2, 1, 1, 8).setValues([[
          "'" + data.id,
          data.tipo,
          data.categoria,
          data.subcategoria,
          data.descricao,
          data.quantidade || 1,
          data.valor,
          dataFormatada
        ]]);
        
        return ContentService
          .createTextOutput(JSON.stringify({success: true, message: 'Lançamento atualizado'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Item não encontrado'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// NOVA FUNÇÃO: Editar movimentação de estoque
function updateEstoqueData(data) {
  try {
    const planilha = SpreadsheetApp.openById(SHEET_ID);
    const aba = planilha.getSheetByName('Estoque');
    
    if (!aba) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Aba Estoque não encontrada'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const lastRow = aba.getLastRow();
    if (lastRow <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Nenhum dado para editar'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Encontrar linha com o ID
    const range = aba.getRange(2, 1, lastRow - 1, 9);
    const values = range.getValues();
    
    for (let i = 0; i < values.length; i++) {
      const idPlanilha = String(values[i][0]).replace(/^'/, '');
      if (idPlanilha === String(data.id)) {
        // Atualizar linha
        aba.getRange(i + 2, 1, 1, 9).setValues([[
          data.id,
          data.produto,
          data.categoria || '',
          data.quantidade,
          data.valorUnitario || 0,
          data.valorTotal || 0,
          data.data,
          data.tipoMovimento,
          data.observacoes || ''
        ]]);
        
        return ContentService
          .createTextOutput(JSON.stringify({success: true, message: 'Movimentação de estoque atualizada'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Movimentação não encontrada'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function deleteEstoqueById(id) {
  try {
    if (!id) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'ID é obrigatório'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const planilha = SpreadsheetApp.openById(SHEET_ID);
    const aba = planilha.getSheetByName('Estoque');
    
    if (!aba || aba.getLastRow() <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Nenhum dado para excluir'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const targetId = String(id).replace(/^'/, '');
    const range = aba.getRange(2, 1, aba.getLastRow() - 1, 1);
    const values = range.getValues();
    
    for (let i = values.length - 1; i >= 0; i--) {
      const idPlanilha = String(values[i][0]).replace(/^'/, '');
      if (idPlanilha === targetId) {
        aba.deleteRow(i + 2);
        return ContentService
          .createTextOutput(JSON.stringify({success: true, message: 'Item excluído'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Item não encontrado'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateEstoqueById(data) {
  try {
    if (!data || !data.id) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'ID é obrigatório'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const planilha = SpreadsheetApp.openById(SHEET_ID);
    const aba = planilha.getSheetByName('Estoque');
    
    if (!aba || aba.getLastRow() <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Nenhum dado para editar'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const targetId = String(data.id).replace(/^'/, '');
    const range = aba.getRange(2, 1, aba.getLastRow() - 1, 9);
    const values = range.getValues();
    
    for (let i = 0; i < values.length; i++) {
      const idPlanilha = String(values[i][0]).replace(/^'/, '');
      if (idPlanilha === targetId) {
        aba.getRange(i + 2, 1, 1, 9).setValues([[
          data.id,
          data.produto,
          data.categoria || '',
          data.quantidade,
          data.valorUnitario || 0,
          data.valorTotal || 0,
          data.data,
          data.tipoMovimento,
          data.observacoes || ''
        ]]);
        
        return ContentService
          .createTextOutput(JSON.stringify({success: true, message: 'Estoque atualizado'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Item não encontrado'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function verificarSincronizacao(hashLocal) {
  try {
    const planilha = SpreadsheetApp.openById(SHEET_ID);
    
    // Dados do Financeiro
    const abaFinanceiro = planilha.getSheetByName('Financeiro') || planilha.getActiveSheet();
    let dadosFinanceiro = [];
    if (abaFinanceiro && abaFinanceiro.getLastRow() > 1) {
      dadosFinanceiro = abaFinanceiro.getRange(2, 1, abaFinanceiro.getLastRow() - 1, 1).getValues().flat();
    }
    
    // Dados do Estoque
    const abaEstoque = planilha.getSheetByName('Estoque');
    let produtosEstoque = [];
    if (abaEstoque && abaEstoque.getLastRow() > 1) {
      const movimentacoes = abaEstoque.getRange(2, 1, abaEstoque.getLastRow() - 1, 9).getValues();
      const estoqueCalculado = {};
      
      movimentacoes.forEach(mov => {
        const produto = mov[1];
        const quantidade = mov[3];
        const tipo = mov[7];
        
        if (!estoqueCalculado[produto]) estoqueCalculado[produto] = 0;
        
        if (tipo === 'Entrada') {
          estoqueCalculado[produto] += quantidade;
        } else if (tipo === 'Saída' || tipo === 'Venda' || tipo === 'Exclusão') {
          estoqueCalculado[produto] -= quantidade;
        }
      });
      
      produtosEstoque = Object.keys(estoqueCalculado)
        .filter(nome => nome && estoqueCalculado[nome] > 0)
        .map(nome => String(nome))
        .sort();
    }
    
    const dadosSheets = {
      totalFinanceiro: dadosFinanceiro.length,
      totalEstoque: produtosEstoque.length,
      idsFinanceiro: dadosFinanceiro.map(id => String(id || '').replace(/^'/, '')).filter(id => id).sort(),
      produtosEstoque: produtosEstoque.filter(nome => nome).sort()
    };
    
    const hashSheets = Utilities.base64Encode(JSON.stringify(dadosSheets));
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        sincronizado: hashLocal === hashSheets,
        hashSheets: hashSheets,
        totalRegistros: dadosFinanceiro.length + produtosEstoque.length
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function insertFinanceiroData(data) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    
    // Adicionar cabeçalhos se a planilha estiver vazia
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 8).setValues([['ID', 'Tipo', 'Categoria', 'Subcategoria', 'Descrição', 'Quantidade', 'Valor', 'Data Lançamento']]);
    }
    
    // Verificar se já existe um lançamento com o mesmo ID
    const identificador = String(data.id || gerarIdentificadorUnico());
    
    // Verificar duplicatas
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const idsExistentes = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().map(String);
      if (idsExistentes.includes(identificador)) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Lançamento já existe (ID duplicado)'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Manter data no formato DD/MM/AAAA
    let dataFormatada = data.data;
    if (data.data) {
      // Se a data já está no formato DD/MM/AAAA, mantê-la
      if (data.data.includes('/')) {
        dataFormatada = data.data;
      } else {
        // Se está em outro formato (ISO), converter para DD/MM/AAAA
        const date = new Date(data.data);
        if (!isNaN(date.getTime())) {
          const dia = String(date.getDate()).padStart(2, '0');
          const mes = String(date.getMonth() + 1).padStart(2, '0');
          const ano = date.getFullYear();
          dataFormatada = `${dia}/${mes}/${ano}`;
        }
      }
    }
    
    // Inserir dados financeiros (forçar ID como texto com ')
    sheet.appendRow([
      "'" + identificador, // Adicionar ' para forçar como texto
      data.tipo, 
      data.categoria, 
      data.subcategoria, 
      data.descricao, 
      data.quantidade || 1,
      data.valor, 
      dataFormatada
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Lançamento inserido com sucesso'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function insertFinanceiroBatch(dataArray) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    
    // Adicionar cabeçalhos se a planilha estiver vazia
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 8).setValues([['ID', 'Tipo', 'Categoria', 'Subcategoria', 'Descrição', 'Quantidade', 'Valor', 'Data Lançamento']]);
    }
    
    // Verificar duplicatas
    const lastRow = sheet.getLastRow();
    let idsExistentes = [];
    if (lastRow > 1) {
      idsExistentes = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
    }
    
    const rowsToInsert = [];
    let inserted = 0;
    
    dataArray.forEach(data => {
      const identificador = data.id || gerarIdentificadorUnico();
      
      if (!idsExistentes.includes(identificador)) {
        // Manter data no formato DD/MM/AAAA
        let dataFormatada = data.data;
        if (data.data) {
          // Se a data já está no formato DD/MM/AAAA, mantê-la
          if (data.data.includes('/')) {
            dataFormatada = data.data;
          } else {
            // Se está em outro formato (ISO), converter para DD/MM/AAAA
            const date = new Date(data.data);
            if (!isNaN(date.getTime())) {
              const dia = String(date.getDate()).padStart(2, '0');
              const mes = String(date.getMonth() + 1).padStart(2, '0');
              const ano = date.getFullYear();
              dataFormatada = `${dia}/${mes}/${ano}`;
            }
          }
        }
        
        rowsToInsert.push([
          "'" + identificador, // Adicionar ' para forçar como texto
          data.tipo,
          data.categoria,
          data.subcategoria,
          data.descricao,
          data.quantidade || 1,
          data.valor,
          dataFormatada
        ]);
        inserted++;
      }
    });
    
    if (rowsToInsert.length > 0) {
      const startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, rowsToInsert.length, 8).setValues(rowsToInsert);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: `${inserted} lançamentos inseridos`, inserted: inserted}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function deleteFinanceiroData(id) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Nenhum dado para excluir'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Encontrar linha com o ID (comparar como string)
    const range = sheet.getRange(2, 1, lastRow - 1, 1);
    const values = range.getValues();
    
    for (let i = 0; i < values.length; i++) {
      const idPlanilha = String(values[i][0]).replace(/^'/, ''); // Remover ' se existir
      if (idPlanilha === String(id)) {
        sheet.deleteRow(i + 2); // +2 porque começamos na linha 2
        return ContentService
          .createTextOutput(JSON.stringify({success: true, message: 'Item excluído com sucesso'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Item não encontrado'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function readFinanceiroData() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({success: true, data: []}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Ler dados (pular cabeçalho)
    const range = sheet.getRange(2, 1, lastRow - 1, 8);
    const values = range.getValues();
    
    const data = values.map(row => ({
      id: row[0],
      tipo: row[1],
      categoria: row[2],
      subcategoria: row[3],
      descricao: row[4],
      quantidade: row[5],
      valor: row[6],
      data: row[7]
    }));
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, data: data}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Funções para Estoque
function verificarAbaEstoque() {
  try {
    const planilha = SpreadsheetApp.openById(SHEET_ID);
    const abas = planilha.getSheets();
    const temAbaEstoque = abas.some(aba => aba.getName().toLowerCase() === 'estoque');
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, temAbaEstoque: temAbaEstoque}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function testarScript() {
  try {
    if (!SHEET_ID || SHEET_ID === 'SUA_PLANILHA_ID') {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'SHEET_ID não configurado'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const planilha = SpreadsheetApp.openById(SHEET_ID);
    const nome = planilha.getName();
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Planilha: ' + nome}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function criarAbaEstoque() {
  try {
    if (!SHEET_ID || SHEET_ID === 'SUA_PLANILHA_ID') {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'SHEET_ID não configurado'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const planilha = SpreadsheetApp.openById(SHEET_ID);
    const abas = planilha.getSheets();
    const abaExistente = abas.find(aba => aba.getName().toLowerCase() === 'estoque');
    
    if (abaExistente) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Aba Estoque já existe'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const aba = planilha.insertSheet('Estoque');
    const cabecalhos = ['ID', 'Produto', 'Categoria', 'Quantidade', 'Valor_Unitario', 'Valor_Total', 'Data_Movimento', 'Tipo_Movimento', 'Observacoes'];
    aba.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Aba criada'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function insertEstoqueData(data) {
  try {
    const planilha = SpreadsheetApp.openById(SHEET_ID);
    let aba = planilha.getSheetByName('Estoque');
    
    if (!aba) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Aba Estoque não encontrada'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const identificador = data.id || gerarIdentificadorUnico();
    
    // Encontrar a última linha com dados reais nas colunas A:I
    let ultimaLinhaComDados = 1;
    const maxLinhas = aba.getLastRow();
    
    if (maxLinhas > 1) {
      const dados = aba.getRange(2, 1, maxLinhas - 1, 9).getValues();
      for (let i = dados.length - 1; i >= 0; i--) {
        const temDados = dados[i].some(celula => celula && celula.toString().trim() !== '');
        if (temDados) {
          ultimaLinhaComDados = i + 2;
          break;
        }
      }
    }
    
    const proximaLinha = ultimaLinhaComDados + 1;
    
    aba.getRange(proximaLinha, 1, 1, 9).setValues([[
      identificador,
      data.produto,
      data.categoria || '',
      data.quantidade,
      data.valorUnitario || 0,
      data.valorTotal || 0,
      data.data,
      data.tipoMovimento,
      data.observacoes || ''
    ]]);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Movimentação de estoque inserida'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function readEstoqueData() {
  try {
    const planilha = SpreadsheetApp.openById(SHEET_ID);
    const aba = planilha.getSheetByName('Estoque');
    
    if (!aba) {
      return ContentService
        .createTextOutput(JSON.stringify({success: true, data: []}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const lastRow = aba.getLastRow();
    if (lastRow <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({success: true, data: []}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const range = aba.getRange(2, 1, lastRow - 1, 9);
    const values = range.getValues();
    
    const data = values.map(row => {
      // Formatar data para DD/MM/AAAA
      let dataFormatada = row[6];
      if (row[6] instanceof Date) {
        const dia = String(row[6].getDate()).padStart(2, '0');
        const mes = String(row[6].getMonth() + 1).padStart(2, '0');
        const ano = row[6].getFullYear();
        dataFormatada = `${dia}/${mes}/${ano}`;
      } else if (row[6] && !String(row[6]).includes('/')) {
        // Se não é Date mas também não tem /, tentar converter
        const date = new Date(row[6]);
        if (!isNaN(date.getTime())) {
          const dia = String(date.getDate()).padStart(2, '0');
          const mes = String(date.getMonth() + 1).padStart(2, '0');
          const ano = date.getFullYear();
          dataFormatada = `${dia}/${mes}/${ano}`;
        }
      }
      
      return {
        id: row[0],
        produto: row[1],
        categoria: row[2],
        quantidade: row[3],
        valorUnitario: row[4],
        valorTotal: row[5],
        data: dataFormatada,
        tipoMovimento: row[7],
        observacoes: row[8]
      };
    });
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, data: data}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function deleteEstoqueData(nomeProduto) {
  try {
    const planilha = SpreadsheetApp.openById(SHEET_ID);
    const aba = planilha.getSheetByName('Estoque');
    
    if (!aba) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Aba Estoque não encontrada'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const lastRow = aba.getLastRow();
    if (lastRow <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Nenhum dado para excluir'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Encontrar e excluir todas as linhas com o produto especificado
    const range = aba.getRange(2, 1, lastRow - 1, 9);
    const values = range.getValues();
    let linhasExcluidas = 0;
    
    // Percorrer de trás para frente para não afetar os índices
    for (let i = values.length - 1; i >= 0; i--) {
      if (values[i][1] === nomeProduto) { // Coluna 1 é o produto (índice 1)
        aba.deleteRow(i + 2); // +2 porque começamos na linha 2
        linhasExcluidas++;
      }
    }
    
    if (linhasExcluidas > 0) {
      return ContentService
        .createTextOutput(JSON.stringify({success: true, message: `${linhasExcluidas} movimentações do produto excluídas`}))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, message: 'Produto não encontrado no estoque'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function verificarTimestamp(timestampLocal) {
  try {
    const planilha = SpreadsheetApp.openById(SHEET_ID);
    
    // Coletar todos os IDs de ambas as abas
    const todosIdsRemotos = [];
    
    // Verificar aba Financeiro
    const abaFinanceiro = planilha.getSheetByName('Financeiro') || planilha.getActiveSheet();
    if (abaFinanceiro && abaFinanceiro.getLastRow() > 1) {
      const dadosFinanceiro = abaFinanceiro.getRange(2, 1, abaFinanceiro.getLastRow() - 1, 1).getValues();
      dadosFinanceiro.forEach(row => {
        const id = String(row[0]).replace(/^'/, '');
        if (id && id.length === 14) { // Validar formato DDMMAAAAHHMMSS
          todosIdsRemotos.push(id);
        }
      });
    }
    
    // Verificar aba Estoque
    const abaEstoque = planilha.getSheetByName('Estoque');
    if (abaEstoque && abaEstoque.getLastRow() > 1) {
      const dadosEstoque = abaEstoque.getRange(2, 1, abaEstoque.getLastRow() - 1, 1).getValues();
      dadosEstoque.forEach(row => {
        const id = String(row[0]).replace(/^'/, '');
        if (id && id.length === 14) { // Validar formato DDMMAAAAHHMMSS
          todosIdsRemotos.push(id);
        }
      });
    }
    
    // Se não há dados remotos, considera atualizado
    if (todosIdsRemotos.length === 0) {
      return {
        success: true,
        dadosAtualizados: true,
        ultimoIdRemoto: null,
        timestampLocal: timestampLocal,
        totalRegistrosRemotos: 0
      };
    }
    
    // Ordenar IDs e pegar o mais recente
    todosIdsRemotos.sort();
    const ultimoIdRemoto = todosIdsRemotos[todosIdsRemotos.length - 1];
    
    // Comparar timestamps
    let dadosAtualizados = true;
    
    if (!timestampLocal) {
      // Se não há timestamp local, dados estão desatualizados
      dadosAtualizados = false;
    } else {
      // Comparar o último ID remoto com o local
      dadosAtualizados = ultimoIdRemoto <= timestampLocal;
    }
    
    console.log('Verificação de timestamp:');
    console.log('- Último ID remoto:', ultimoIdRemoto);
    console.log('- Timestamp local:', timestampLocal);
    console.log('- Dados atualizados:', dadosAtualizados);
    console.log('- Total registros remotos:', todosIdsRemotos.length);
    
    return {
      success: true,
      dadosAtualizados: dadosAtualizados,
      ultimoIdRemoto: ultimoIdRemoto,
      timestampLocal: timestampLocal,
      totalRegistrosRemotos: todosIdsRemotos.length
    };
    
  } catch (error) {
    console.error('Erro na verificação de timestamp:', error);
    return { success: false, message: error.toString() };
  }
}