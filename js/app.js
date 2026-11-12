let dataState = {
    tickets: [
        { id: 'TK-1001', cliente: 'Banco de Bogotá', sede: 'Sede Principal Calle 72', sistema: 'CCTV IP Dahua', falla: 'Pérdida de Enlace Video', tecnico: 'Carlos Pérez', sla: '1', estado: 'Asignado', fecha: '2026-11' },
        { id: 'TK-1002', cliente: 'Centro Comercial Andino', sede: 'Torre Administrativa Andino', sistema: 'Intrusión AX PRO', falla: 'Batería Baja Panel', tecnico: 'Oscar Muñoz', sla: '3', estado: 'Cumplido', fecha: '2026-11' }
    ],
    clientes: [
        { name: "Banco de Bogotá", color: "#1E3A8A", logo: "https://cdn-icons-png.flaticon.com/512/2830/2830284.png" },
        { name: "Centro Comercial Andino", color: "#FF6B35", logo: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }
    ],
    sedes: [
        { client: "Banco de Bogotá", sede: "Sede Principal Calle 72" },
        { client: "Banco de Bogotá", sede: "Sucursal Norte 170" },
        { client: "Centro Comercial Andino", sede: "Torre Administrativa Andino" },
        { client: "Centro Comercial Andino", sede: "Plazoleta de Comidas" }
    ],
    usuarios: [
        { name: "admin", pass: "admin", role: "Administrador", assignedClient: "TODOS", perms: ["Dashboard Gerencial", "Gestión de Tickets", "Nuevo Ticket", "Mapa Geolocalizado", "Ajustes & Parámetros"] },
        { name: "Carlos Pérez", pass: "1234", role: "Técnico", assignedClient: "Banco de Bogotá", perms: ["Gestión de Tickets", "Nuevo Ticket"] },
        { name: "Oscar Muñoz", pass: "1234", role: "Operador", assignedClient: "Centro Comercial Andino", perms: ["Dashboard Gerencial", "Gestión de Tickets"] }
    ],
    sistemas: ["CCTV IP Dahua", "Intrusión AX PRO", "Control de Acceso Biométrico"],
    fallas: ["Pérdida de Enlace Video", "Batería Baja Panel", "Falla Lector Biométrico"],
    slaList: [
        { desc: "Crítico - Urgente", days: 1 },
        { desc: "Estándar Operativo", days: 3 }
    ]
};

let currentUser = null;
let activeClientContext = "";

const app = {
    charts: { ticketSede: null, fallasSedes: null, ticketSistemas: null, ticketTecnico: null, ticketTecSla: null, tendenciaSedes: null },
    map: null,
    init() {
        this.loadStorage();
        this.renderAll();
    },
    login(e) {
        e.preventDefault();
        const userIn = document.getElementById('login-user').value.trim();
        const passIn = document.getElementById('login-pass').value.trim();
        
        const found = dataState.usuarios.find(u => u.name.toLowerCase() === userIn.toLowerCase() && u.pass === passIn);
        if(found) {
            currentUser = found;
            activeClientContext = found.assignedClient === "TODOS" ? "" : found.assignedClient;
            
            document.getElementById('login-view').classList.remove('active');
            document.getElementById('app-view').classList.add('active');
            
            this.applyUserPrivileges();
            
            // Si el rol es técnico o no tiene permiso de Dashboard, redirigir directo a Gestión de Tickets
            if(currentUser.role.toLowerCase().includes('técnico') || !currentUser.perms.includes('Dashboard Gerencial')) {
                this.navigateTo('tickets');
            } else {
                this.navigateTo('dashboard');
            }
        } else {
            alert("Usuario o contraseña incorrectos.");
        }
    },
    logout() {
        currentUser = null;
        activeClientContext = "";
        document.getElementById('app-view').classList.remove('active');
        document.getElementById('login-view').classList.add('active');
    },
    applyUserPrivileges() {
        if(!currentUser) return;
        const allLinks = document.querySelectorAll('.sidebar .nav-links li');
        allLinks.forEach(li => {
            const text = li.innerText.trim();
            if(text.includes('Instalar')) return;
            if(currentUser.perms.includes(text) || currentUser.role === "Administrador") {
                li.style.display = 'flex';
            } else {
                li.style.display = 'none';
            }
        });
        document.getElementById('sidebar-user-role-badge').innerText = `${currentUser.role} (${currentUser.assignedClient})`;
        
        if(currentUser.assignedClient !== "TODOS") {
            const clientObj = dataState.clientes.find(c => c.name === currentUser.assignedClient);
            if(clientObj) this.applyClientBranding(clientObj);
        }
    },
    applyClientBranding(clientObj) {
        const logoImg = document.getElementById('sidebar-client-logo');
        const brandTitle = document.getElementById('sidebar-title-brand');
        if(clientObj && clientObj.logo) {
            logoImg.src = clientObj.logo;
            logoImg.style.display = 'block';
            brandTitle.style.display = 'none';
        } else {
            if(logoImg) logoImg.style.display = 'none';
            if(brandTitle) brandTitle.style.display = 'block';
        }
        
        if(clientObj && clientObj.color) {
            document.documentElement.style.setProperty('--primary', clientObj.color);
            document.documentElement.style.setProperty('--secondary', clientObj.color);
        } else {
            document.documentElement.style.setProperty('--primary', '#0A192F');
            document.documentElement.style.setProperty('--secondary', '#1E3A8A');
        }
    },
    changeActiveClientContext() {
        const val = document.getElementById('global-client-filter').value;
        activeClientContext = val;
        const clientObj = dataState.clientes.find(c => c.name === val);
        this.applyClientBranding(clientObj);
        this.renderDashboard();
    },
    toggleAnalysis(boxId, btn) {
        const box = document.getElementById(boxId);
        if(box.style.display === 'none') {
            box.style.display = 'block';
            btn.innerHTML = '<i class="fas fa-eye-slash"></i> Ocultar Análisis';
        } else {
            box.style.display = 'none';
            btn.innerHTML = '<i class="fas fa-eye"></i> Mostrar Análisis';
        }
    },
    toggleMobileMenu() {
        const sb = document.getElementById('sidebar');
        if(sb) sb.classList.toggle('mobile-open');
    },
    closeMobileMenuOnClick() {
        if(window.innerWidth <= 900) {
            const sb = document.getElementById('sidebar');
            if(sb) sb.classList.remove('mobile-open');
        }
    },
    navigateTo(section) {
        // Bloquear acceso al dashboard si es técnico o no tiene permiso
        if(section === 'dashboard' && currentUser && (currentUser.role.toLowerCase().includes('técnico') || !currentUser.perms.includes('Dashboard Gerencial'))) {
            alert("Acceso restringido: El perfil técnico no tiene visualización de Dashboard.");
            this.navigateTo('tickets');
            return;
        }

        const sections = ['dashboard', 'tickets', 'create-ticket', 'map', 'settings'];
        sections.forEach(s => {
            const el = document.getElementById(`view-${s}`);
            if(el) el.style.display = 'none';
        });

        const target = document.getElementById(`view-${section}`);
        if(target) target.style.display = 'block';

        document.querySelectorAll('.sidebar .nav-links li').forEach(li => li.classList.remove('active'));
        const menuLi = document.getElementById(`menu-${section}`);
        if(menuLi) menuLi.classList.add('active');

        this.closeMobileMenuOnClick();

        if(section === 'dashboard') this.renderDashboard();
        if(section === 'create-ticket') this.loadTicketSelectors();
        if(section === 'tickets') this.renderTicketsTable();
        if(section === 'map') this.initMap();
    },
    switchTab(tab, btn) {
        document.querySelectorAll('.settings-tab-content').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.settings-tabs button').forEach(b => b.classList.remove('active-tab'));
        document.getElementById(`tab-${tab}`).style.display = 'block';
        btn.classList.add('active-tab');
    },
    openMobileModal() {
        document.getElementById('modal-mobile').style.display = 'flex';
        this.closeMobileMenuOnClick();
    },

    // --- CRUD ---
    addClient(e) {
        e.preventDefault();
        const name = document.getElementById('new-client-name').value;
        const color = document.getElementById('new-client-color').value;
        const logo = document.getElementById('new-client-logo').value;
        dataState.clientes.push({ name, color, logo });
        this.saveStorage();
        e.target.reset();
        this.renderAll();
        alert("Cliente y logotipo guardados.");
    },
    deleteClient(idx) {
        if(confirm("¿Eliminar este cliente?")) {
            dataState.clientes.splice(idx, 1);
            this.saveStorage();
            this.renderAll();
        }
    },
    addSede(e) {
        e.preventDefault();
        const client = document.getElementById('sede-client-select').value;
        const sede = document.getElementById('new-sede-name').value;
        if(!client) { alert("Seleccione un cliente."); return; }
        dataState.sedes.push({ client, sede });
        this.saveStorage();
        e.target.reset();
        this.renderAll();
        alert("Sede agregada.");
    },
    deleteSede(idx) {
        if(confirm("¿Eliminar esta sede?")) {
            dataState.sedes.splice(idx, 1);
            this.saveStorage();
            this.renderAll();
        }
    },
    addUser(e) {
        e.preventDefault();
        const name = document.getElementById('new-user-name').value;
        const pass = document.getElementById('new-user-pass').value;
        const client = document.getElementById('new-user-client').value;
        const role = document.getElementById('new-role-name').value;
        const perms = Array.from(document.querySelectorAll('.perm-cb:checked')).map(cb => cb.value);
        
        dataState.usuarios.push({ name, pass, role, assignedClient: client, perms });
        this.saveStorage();
        e.target.reset();
        document.querySelectorAll('.perm-cb').forEach(cb => cb.checked = true);
        this.renderAll();
        alert("Usuario registrado con éxito.");
    },
    deleteUser(idx) {
        if(confirm("¿Desea eliminar este usuario?")) {
            dataState.usuarios.splice(idx, 1);
            this.saveStorage();
            this.renderAll();
        }
    },
    addSistema(e) {
        e.preventDefault();
        const sis = document.getElementById('new-sistema-name').value;
        dataState.sistemas.push(sis);
        this.saveStorage();
        e.target.reset();
        this.renderAll();
    },
    deleteSistema(idx) {
        dataState.sistemas.splice(idx, 1);
        this.saveStorage();
        this.renderAll();
    },
    addFalla(e) {
        e.preventDefault();
        const falla = document.getElementById('new-falla-name').value;
        dataState.fallas.push(falla);
        this.saveStorage();
        e.target.reset();
        this.renderAll();
    },
    deleteFalla(idx) {
        dataState.fallas.splice(idx, 1);
        this.saveStorage();
        this.renderAll();
    },
    addSla(e) {
        e.preventDefault();
        const desc = document.getElementById('new-sla-desc').value;
        const days = document.getElementById('new-sla-days').value;
        dataState.slaList.push({ desc, days });
        this.saveStorage();
        e.target.reset();
        this.renderAll();
    },
    deleteSla(idx) {
        dataState.slaList.splice(idx, 1);
        this.saveStorage();
        this.renderAll();
    },

    // --- MODAL EDICIÓN CON PRIVILEGIOS Y CONTRASEÑA ---
    openEditModal(type, idx) {
        document.getElementById('edit-type').value = type;
        document.getElementById('edit-index').value = idx;
        const g2 = document.getElementById('edit-group-2');
        const permGroup = document.getElementById('edit-permissions-group');
        g2.style.display = 'block';
        permGroup.style.display = 'none';

        if(type === 'client') {
            document.getElementById('modal-edit-title').innerText = "Editar Cliente y Logo";
            document.getElementById('edit-value-1').value = dataState.clientes[idx].
