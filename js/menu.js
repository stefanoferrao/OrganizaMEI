// Menu hambúrguer responsivo e Sistema de Filtros
document.addEventListener('DOMContentLoaded', function() {
    // === MENU HAMBÚRGUER ===
    const menuToggle = document.createElement('button');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    menuToggle.setAttribute('aria-label', 'Abrir menu');
    
    const overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    
    document.body.appendChild(menuToggle);
    document.body.appendChild(overlay);
    
    const aside = document.querySelector('aside');
    
    function openMenu() {
        aside.classList.add('open');
        overlay.classList.add('active');
        menuToggle.innerHTML = '<i class="fas fa-times"></i>';
        menuToggle.setAttribute('aria-label', 'Fechar menu');
        document.body.style.overflow = 'hidden';
    }
    
    function closeMenu() {
        aside.classList.remove('open');
        overlay.classList.remove('active');
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        menuToggle.setAttribute('aria-label', 'Abrir menu');
        document.body.style.overflow = '';
    }
    
    menuToggle.addEventListener('click', function() {
        if (aside.classList.contains('open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });
    
    overlay.addEventListener('click', closeMenu);
    
    const navButtons = document.querySelectorAll('nav button');
    navButtons.forEach(button => {
        button.addEventListener('click', closeMenu);
    });
    
    window.addEventListener('resize', function() {
        if (window.innerWidth > 800) {
            closeMenu();
        }
    });

    // === SISTEMA DE FILTROS ===
    function atualizarFiltroMesAno() {
        const meses = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
        const filtroMes = document.getElementById("filtro-mes");
        const filtroAno = document.getElementById("filtro-ano");
        if (!filtroMes || !filtroAno) return;
        
        filtroMes.innerHTML = "";
        filtroAno.innerHTML = "";
        
        const optTodosMes = document.createElement("option");
        optTodosMes.value = "todos";
        optTodosMes.textContent = "Todos";
        filtroMes.appendChild(optTodosMes);
        
        const anos = Array.from(new Set(lancamentos.map(l => {
            if (!l.data) return "";
            if (typeof l.data === 'string' && l.data.includes('/')) {
                return l.data.split('/')[2];
            } else {
                return l.data.slice(0, 4);
            }
        }).filter(a => a)));
        
        const anoAtual = new Date().getFullYear();
        if (anos.length === 0) anos.push(anoAtual.toString());
        anos.sort();
        
        const optTodosAno = document.createElement("option");
        optTodosAno.value = "todos";
        optTodosAno.textContent = "Todos";
        filtroAno.appendChild(optTodosAno);
        
        meses.forEach(m => {
            const opt = document.createElement("option");
            opt.value = m;
            opt.textContent = m;
            filtroMes.appendChild(opt);
        });
        
        anos.forEach(a => {
            const opt = document.createElement("option");
            opt.value = a;
            opt.textContent = a;
            filtroAno.appendChild(opt);
        });
        
        const mesSalvo = localStorage.getItem("filtroMes") || meses[new Date().getMonth()];
        const anoSalvo = localStorage.getItem("filtroAno") || anoAtual.toString();
        filtroMes.value = mesSalvo;
        filtroAno.value = anoSalvo;
        window.filtroMes = mesSalvo;
        window.filtroAno = anoSalvo;
    }

    function atualizarTodasSecoes() {
        if (typeof renderizarLancamentos === 'function') renderizarLancamentos();
        if (typeof renderizarDashboardResumo === 'function') renderizarDashboardResumo();
        if (typeof renderizarVendas === 'function') renderizarVendas();
        if (typeof renderizarGrafico === 'function' && document.getElementById('graficos').classList.contains('active')) {
            const tipoGrafico = document.getElementById('tipo-grafico')?.value || 'vendas';
            renderizarGrafico(tipoGrafico);
        }
    }

    const filtroMesElement = document.getElementById("filtro-mes");
    const filtroAnoElement = document.getElementById("filtro-ano");
    
    if (filtroMesElement) {
        filtroMesElement.addEventListener("change", function () {
            const mes = this.value;
            const ano = document.getElementById("filtro-ano").value;
            localStorage.setItem("filtroMes", mes);
            localStorage.setItem("filtroAno", ano);
            window.filtroMes = mes;
            window.filtroAno = ano;
            atualizarTodasSecoes();
        });
    }
    
    if (filtroAnoElement) {
        filtroAnoElement.addEventListener("change", function () {
            const ano = this.value;
            const mes = document.getElementById("filtro-mes").value;
            localStorage.setItem("filtroMes", mes);
            localStorage.setItem("filtroAno", ano);
            window.filtroMes = mes;
            window.filtroAno = ano;
            atualizarTodasSecoes();
        });
    }

    const btnFiltrar = document.getElementById("btn-filtrar");
    if (btnFiltrar) {
        btnFiltrar.addEventListener("click", function () {
            localStorage.removeItem("filtroMes");
            localStorage.removeItem("filtroAno");
            window.filtroMes = null;
            window.filtroAno = null;
            document.getElementById("filtro-mes").value = "";
            document.getElementById("filtro-ano").value = "";
            atualizarTodasSecoes();
        });
    }

    window.atualizarFiltroMesAno = atualizarFiltroMesAno;
    atualizarFiltroMesAno();
});