// Função para testar conexão com Google Sheets com barra de progresso
async function testarConexaoSheets() {
    const url = getCurrentUrl();
    const btn = document.getElementById('btn-test-connection');
    const originalText = btn.textContent;
    
    if (!url || url.includes('*')) {
        Swal.fire({
            icon: 'warning',
            title: 'URL não configurada',
            text: 'Configure a URL do Google Sheets primeiro',
            confirmButtonColor: '#17acaf',
            background: '#2d3748',
            color: '#fff'
        });
        return;
    }
    
    try {
        // Criar barra de progresso
        const progressContainer = document.createElement('div');
        progressContainer.className = 'test-connection-progress';
        progressContainer.innerHTML = `
            <div class="progress-text"></div>
            <div class="progress-bar-container">
                <div class="progress-bar-fill"></div>
            </div>
        `;
        const sheetsActions = document.querySelector('.sheets-actions');
        sheetsActions.appendChild(progressContainer);
        
        // Estado de carregamento
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span>';
        btn.classList.add('loading');
        
        // Animar progresso
        const progressFill = progressContainer.querySelector('.progress-bar-fill');
        const progressText = progressContainer.querySelector('.progress-text');
        
        progressText.textContent = 'Conectando com Google Sheets...';
        progressFill.style.width = '30%';
        await new Promise(resolve => setTimeout(resolve, 800));
        
        progressText.textContent = 'Verificando configuração...';
        progressFill.style.width = '60%';
        await new Promise(resolve => setTimeout(resolve, 600));
        
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'testarScript' })
        });
        const result = await response.json();
        
        progressText.textContent = 'Finalizando teste...';
        progressFill.style.width = '100%';
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Remover barra de progresso
        progressContainer.remove();
        
        if (result.success) {
            // Estado de sucesso
            btn.innerHTML = '✅ Conexão OK!';
            btn.classList.remove('loading');
            btn.classList.add('success');
            
            Swal.fire({
                icon: 'success',
                title: 'Conexão bem-sucedida!',
                text: result.message,
                confirmButtonColor: '#17acaf',
                background: '#2d3748',
                color: '#fff'
            });
        } else {
            // Estado de erro
            btn.innerHTML = '❌ Falha';
            btn.classList.remove('loading');
            btn.classList.add('error');
            
            Swal.fire({
                icon: 'error',
                title: 'Falha na conexão',
                text: result.message,
                confirmButtonColor: '#e53e3e',
                background: '#2d3748',
                color: '#fff'
            });
        }
        
        // Restaurar botão após 3 segundos
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('success', 'error');
            btn.disabled = false;
        }, 3000);
        
    } catch (error) {
        // Remover barra de progresso se existir
        const progressContainer = document.querySelector('.test-connection-progress');
        if (progressContainer) progressContainer.remove();
        
        // Estado de erro
        btn.innerHTML = '❌ Erro';
        btn.classList.remove('loading');
        btn.classList.add('error');
        
        Swal.fire({
            icon: 'error',
            title: 'Erro de conexão',
            text: error.message,
            confirmButtonColor: '#e53e3e',
            background: '#2d3748',
            color: '#fff'
        });
        
        // Restaurar botão após 3 segundos
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('error');
            btn.disabled = false;
        }, 3000);
    }
}

// Expor função globalmente
window.testarConexaoSheets = testarConexaoSheets;