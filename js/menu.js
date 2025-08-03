// Menu hambúrguer responsivo
document.addEventListener('DOMContentLoaded', function() {
    // Criar botão do menu
    const menuToggle = document.createElement('button');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '☰';
    menuToggle.setAttribute('aria-label', 'Abrir menu');
    
    // Criar overlay
    const overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    
    // Adicionar elementos ao DOM
    document.body.appendChild(menuToggle);
    document.body.appendChild(overlay);
    
    const aside = document.querySelector('aside');
    
    // Função para abrir menu
    function openMenu() {
        aside.classList.add('open');
        overlay.classList.add('active');
        menuToggle.innerHTML = '✕';
        menuToggle.setAttribute('aria-label', 'Fechar menu');
        // Prevenir scroll do body quando menu estiver aberto
        document.body.style.overflow = 'hidden';
    }
    
    // Função para fechar menu
    function closeMenu() {
        aside.classList.remove('open');
        overlay.classList.remove('active');
        menuToggle.innerHTML = '☰';
        menuToggle.setAttribute('aria-label', 'Abrir menu');
        // Restaurar scroll do body
        document.body.style.overflow = '';
    }
    
    // Event listeners
    menuToggle.addEventListener('click', function() {
        if (aside.classList.contains('open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });
    
    overlay.addEventListener('click', closeMenu);
    
    // Fechar menu ao clicar em um link de navegação
    const navButtons = document.querySelectorAll('nav button');
    navButtons.forEach(button => {
        button.addEventListener('click', closeMenu);
    });
    
    // Fechar menu ao redimensionar para desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 800) {
            closeMenu();
        }
    });
});