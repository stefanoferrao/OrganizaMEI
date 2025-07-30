// Google Apps Script - YumMetrics Financeiro
// 1. Vá para script.google.com
// 2. Crie um novo projeto
// 3. Cole este código
// 4. Salve e implante como Web App

// CONFIGURAÇÃO: Substitua pelo ID da sua planilha
const SHEET_ID = 'SUA_PLANILHA_ID';

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
      return deleteFinanceiroData(data.id);
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

function insertFinanceiroData(data) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    
    // Adicionar cabeçalhos se a planilha estiver vazia
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 8).setValues([['ID', 'Tipo', 'Categoria', 'Subcategoria', 'Descrição', 'Quantidade', 'Valor', 'Data Lançamento']]);
    }
    
    // Verificar se já existe um lançamento com o mesmo ID
    const identificador = data.id || gerarIdentificadorUnico();
    
    // Verificar duplicatas
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const idsExistentes = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
      if (idsExistentes.includes(identificador)) {
        return ContentService
          .createTextOutput(JSON.stringify({success: false, message: 'Lançamento já existe (ID duplicado)'}))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Formatar data para DD/MM/AAAA
    let dataFormatada = data.data;
    if (data.data) {
      const date = new Date(data.data);
      if (!isNaN(date.getTime())) {
        const dia = String(date.getDate()).padStart(2, '0');
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const ano = date.getFullYear();
        dataFormatada = `${dia}/${mes}/${ano}`;
      }
    }
    
    // Inserir dados financeiros
    sheet.appendRow([
      identificador,
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
        // Formatar data para DD/MM/AAAA
        let dataFormatada = data.data;
        if (data.data) {
          const date = new Date(data.data);
          if (!isNaN(date.getTime())) {
            const dia = String(date.getDate()).padStart(2, '0');
            const mes = String(date.getMonth() + 1).padStart(2, '0');
            const ano = date.getFullYear();
            dataFormatada = `${dia}/${mes}/${ano}`;
          }
        }
        
        rowsToInsert.push([
          identificador,
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
    
    // Encontrar linha com o ID
    const range = sheet.getRange(2, 1, lastRow - 1, 1);
    const values = range.getValues();
    
    for (let i = 0; i < values.length; i++) {
      if (values[i][0] === id) {
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