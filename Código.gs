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
      return deleteFinanceiroData(data.id);
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
      return deleteEstoqueData(data.produto);
    }
    
    if (data.action === 'testarScript') {
      return testarScript();
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
      .createTextOutput(JSON.stringify({success: true, message: 'Integração funcionando perfeitamente! Planilha: ' + nome}))
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
    
    const data = values.map(row => ({
      id: row[0],
      produto: row[1],
      categoria: row[2],
      quantidade: row[3],
      valorUnitario: row[4],
      valorTotal: row[5],
      data: row[6],
      tipoMovimento: row[7],
      observacoes: row[8]
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