// README Viewer - Visualização estilo GitHub
class ReadmeViewer {
  constructor() {
    this.readmeContent = '';
    this.init();
  }

  init() {
    // Adicionar event listener ao botão README se existir
    const btnReadme = document.getElementById('btn-readme');
    console.log('Botão README encontrado:', btnReadme);
    if (btnReadme) {
      btnReadme.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Clique no botão README detectado');
        this.showReadme();
      });
    } else {
      console.log('Botão README não encontrado, tentando novamente em 1 segundo...');
      setTimeout(() => {
        const btnReadme2 = document.getElementById('btn-readme');
        if (btnReadme2) {
          console.log('Botão README encontrado na segunda tentativa');
          btnReadme2.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Clique no botão README detectado (segunda tentativa)');
            this.showReadme();
          });
        }
      }, 1000);
    }
  }

  async loadReadmeContent() {
    try {
      const response = await fetch('docs/README.md');
      if (!response.ok) throw new Error('README não encontrado');
      this.readmeContent = await response.text();
      return this.readmeContent;
    } catch (error) {
      console.error('Erro ao carregar README:', error);
      throw error;
    }
  }

  parseMarkdown(markdown) {
    let html = markdown;

    // Code blocks (deve vir antes de inline code)
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Lists
    html = this.parseLists(html);

    // Blockquotes
    html = html.replace(/^> (.*$)/gim, '<blockquote><p>$1</p></blockquote>');

    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr>');

    // Tables
    html = this.parseTables(html);

    // Emojis
    html = this.parseEmojis(html);

    // Processar parágrafos de forma mais inteligente
    const lines = html.split('\n');
    let result = [];
    let inParagraph = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        if (inParagraph) {
          result.push('</p>');
          inParagraph = false;
        }
      } else if (line.match(/^<(h[1-6]|hr|ul|blockquote|pre|table)/)) {
        if (inParagraph) {
          result.push('</p>');
          inParagraph = false;
        }
        result.push(line);
      } else if (line.match(/^<\/(ul|blockquote|pre|table)/)) {
        result.push(line);
      } else {
        if (!inParagraph && !line.match(/^<\//)) {
          result.push('<p>');
          inParagraph = true;
        }
        result.push(line);
      }
    }
    
    if (inParagraph) {
      result.push('</p>');
    }
    
    html = result.join('\n');

    return html;
  }

  parseTables(html) {
    const lines = html.split('\n');
    let result = [];
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      
      // Detectar início de tabela
      if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('|') && lines[i + 1].includes('-')) {
        const headerCells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
        const headerRow = '<tr>' + headerCells.map(cell => `<th>${cell}</th>`).join('') + '</tr>';
        
        i += 2; // Pular linha de separação
        let bodyRows = '';
        
        // Processar linhas da tabela
        while (i < lines.length && lines[i].includes('|')) {
          const cells = lines[i].split('|').map(cell => cell.trim()).filter(cell => cell);
          bodyRows += '<tr>' + cells.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
          i++;
        }
        
        result.push(`<table><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table>`);
      } else {
        result.push(line);
        i++;
      }
    }
    
    return result.join('\n');
  }

  parseLists(html) {
    const lines = html.split('\n');
    let result = [];
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.match(/^- (.+)$/)) {
        if (!inList) {
          result.push('<ul>');
          inList = true;
        }
        result.push('<li>' + line.substring(2) + '</li>');
      } else {
        if (inList) {
          result.push('</ul>');
          inList = false;
        }
        result.push(line);
      }
    }
    
    if (inList) {
      result.push('</ul>');
    }
    
    return result.join('\n');
  }

  parseEmojis(html) {
    const emojiMap = {
      ':rocket:': '🚀',
      ':clipboard:': '📋',
      ':graduation_cap:': '🎓',
      ':art:': '🎨',
      ':keyboard:': '⌨️',
      ':iphone:': '📱',
      ':moneybag:': '💰',
      ':package:': '📦',
      ':bar_chart:': '📊',
      ':link:': '🔗',
      ':gear:': '⚙️',
      ':arrows_counterclockwise:': '🔄',
      ':sparkles:': '✨',
      ':new:': '🆕',
      ':x:': '❌',
      ':white_check_mark:': '✅',
      ':warning:': '⚠️',
      ':shield:': '🛡️',
      ':computer:': '💻',
      ':books:': '📚',
      ':file_folder:': '📁'
    };

    Object.keys(emojiMap).forEach(emoji => {
      const regex = new RegExp(emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      html = html.replace(regex, `<span class="emoji">${emojiMap[emoji]}</span>`);
    });

    return html;
  }

  async showReadme() {
    console.log('showReadme() chamado');
    try {
      // Mostrar loading
      Swal.fire({
        title: 'Carregando documentação...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
        background: '#0d1117',
        color: '#e6edf3'
      });

      // Carregar conteúdo do README
      const markdownContent = await this.loadReadmeContent();
      
      // Converter markdown para HTML
      const htmlContent = this.parseMarkdown(markdownContent);

      // Fechar loading e mostrar README
      Swal.close();

      // Detectar se é dispositivo móvel
      const isMobile = window.innerWidth <= 768;
      const isSmallMobile = window.innerWidth <= 480;
      
      Swal.fire({
        title: isMobile ? 'Documentação' : 'OrganizaMEI - Documentação Completa',
        html: `<div class="readme-viewer">${htmlContent}</div>`,
        width: isSmallMobile ? '95%' : isMobile ? '92%' : '90%',
        showCloseButton: true,
        showConfirmButton: false,
        background: '#232b38',
        color: '#e2e8f0',
        customClass: {
          popup: 'readme-popup'
        },
        // Configurações específicas para mobile
        ...(isMobile && {
          heightAuto: false,
          scrollbarPadding: false
        })
      });

    } catch (error) {
      Swal.close();
      console.error('Erro ao exibir README:', error);
      
      Swal.fire({
        title: 'Erro',
        text: 'Não foi possível carregar a documentação. Verifique se o arquivo README.md existe na pasta docs/',
        icon: 'error',
        background: '#0d1117',
        color: '#e6edf3',
        confirmButtonColor: '#f85149'
      });
    }
  }

  // Método público para uso externo
  static async show() {
    const viewer = new ReadmeViewer();
    await viewer.showReadme();
  }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM carregado, inicializando ReadmeViewer');
  new ReadmeViewer();
});

// Fallback para garantir inicialização
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado (fallback), inicializando ReadmeViewer');
    new ReadmeViewer();
  });
} else {
  console.log('DOM já carregado, inicializando ReadmeViewer imediatamente');
  new ReadmeViewer();
}

// Exportar para uso global
window.ReadmeViewer = ReadmeViewer;