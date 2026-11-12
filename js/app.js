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
        
        const found = dataState.usuarios.find(u => u.name === userIn && u.pass === passIn);
        if(found) {
            currentUser = found;
            activeClientContext = found.assignedClient === "TODOS" ? "" : found.assignedClient;
            
            document.getElementById('login-view').classList.remove('active');
            document.getElementById('app-view').classList.add('active');
            
            // Aplicar restricciones de privilegios en el menú lateral
            this.applyUserPrivileges();
            this.navigateTo('dashboard');
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
        
        // Si tiene un cliente asignado restrictivo, configurar contexto y color
        if(currentUser.assignedClient !== "TODOS") {
            const clientObj = dataState.clientes.find(c => c.name === currentUser.assignedClient);
            if(clientObj) {
                this.applyClientBranding(clientObj);
            }
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

    // --- CRUD CLIENTES & LOGO ---
    addClient(e) {
        e.preventDefault();
        const name = document.getElementById('new-client-name').value;
        const color = document.getElementById('new-client-color').value;
        const logo = document.getElementById('new-client-logo').value;
        dataState.clientes.push({ name, color, logo });
        this.saveStorage();
        e.target.reset();
        this.renderAll();
        alert("Cliente y logotipo guardados con éxito.");
    },
    deleteClient(idx) {
        if(confirm("¿Desea eliminar este cliente?")) {
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
        alert("Sede agregada a la sede del cliente.");
    },
    deleteSede(idx) {
        if(confirm("¿Desea eliminar esta sede?")) {
            dataState.sedes.splice(idx, 1);
            this.saveStorage();
            this.renderAll();
        }
    },

    // --- CRUD USUARIOS & PRIVILEGIOS ---
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
        document.querySelectorAll('.perm-cb').forEach(cb => cb.checked = false);
        this.renderAll();
        alert("Usuario registrado con sus privilegios y cliente asignado.");
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

    // --- MODAL EDICIÓN ---
    openEditModal(type, idx) {
        document.getElementById('edit-type').value = type;
        document.getElementById('edit-index').value = idx;
        const g2 = document.getElementById('edit-group-2');
        g2.style.display = 'block';

        if(type === 'client') {
            document.getElementById('modal-edit-title').innerText = "Editar Cliente y Logo";
            document.getElementById('edit-value-1').value = dataState.clientes[idx].name;
            document.getElementById('edit-value-2').value = dataState.clientes[idx].logo;
        } else if(type === 'sede') {
            document.getElementById('modal-edit-title').innerText = "Editar Sede";
            document.getElementById('edit-value-1').value = dataState.sedes[idx].sede;
            g2.style.display = 'none';
        } else if(type === 'user') {
            document.getElementById('modal-edit-title').innerText = "Editar Usuario y Rol";
            document.getElementById('edit-value-1').value = dataState.usuarios[idx].name;
            document.getElementById('edit-value-2').value = dataState.usuarios[idx].role;
        } else if(type === 'sistema') {
            document.getElementById('modal-edit-title').innerText = "Editar Sistema";
            document.getElementById('edit-value-1').value = dataState.sistemas[idx];
            g2.style.display = 'none';
        } else if(type === 'falla') {
            document.getElementById('modal-edit-title').innerText = "Editar Falla";
            document.getElementById('edit-value-1').value = dataState.fallas[idx];
            g2.style.display = 'none';
        } else if(type === 'sla') {
            document.getElementById('modal-edit-title').innerText = "Editar SLA";
            document.getElementById('edit-value-1').value = dataState.slaList[idx].desc;
            document.getElementById('edit-value-2').value = dataState.slaList[idx].days;
        }
        document.getElementById('modal-edit').style.display = 'flex';
    },
    saveEdit(e) {
        e.preventDefault();
        const type = document.getElementById('edit-type').value;
        const idx = parseInt(document.getElementById('edit-index').value);
        const v1 = document.getElementById('edit-value-1').value;
        const v2 = document.getElementById('edit-value-2').value;

        if(type === 'client') { dataState.clientes[idx].name = v1; dataState.clientes[idx].logo = v2; }
        else if(type === 'sede') { dataState.sedes[idx].sede = v1; }
        else if(type === 'user') { dataState.usuarios[idx].name = v1; dataState.usuarios[idx].role = v2; }
        else if(type === 'sistema') { dataState.sistemas[idx] = v1; }
        else if(type === 'falla') { dataState.fallas[idx] = v1; }
        else if(type === 'sla') { dataState.slaList[idx].desc = v1; dataState.slaList[idx].days = v2; }

        this.saveStorage();
        document.getElementById('modal-edit').style.display = 'none';
        this.renderAll();
        alert("Cambios guardados con éxito.");
    },

    // --- TICKETS CON RESTRICCIÓN DE CLIENTE ---
    loadTicketSelectors() {
        const clientEl = document.getElementById('ticket-cliente');
        if(!clientEl) return;
        clientEl.innerHTML = '';
        
        let availableClients = dataState.clientes;
        if(currentUser && currentUser.assignedClient !== "TODOS") {
            availableClients = dataState.clientes.filter(c => c.name === currentUser.assignedClient);
        }
        
        availableClients.forEach(c => clientEl.innerHTML += `<option value="${c.name}">${c.name}</option>`);
        this.loadSedesForClient();

        const sisEl = document.getElementById('ticket-sistema');
        sisEl.innerHTML = '';
        dataState.sistemas.forEach(s => sisEl.innerHTML += `<option value="${s}">${s}</option>`);

        const fallaEl = document.getElementById('ticket-falla');
        fallaEl.innerHTML = '';
        dataState.fallas.forEach(f => fallaEl.innerHTML += `<option value="${f}">${f}</option>`);

        const tecEl = document.getElementById('ticket-tecnico');
        tecEl.innerHTML = '';
        dataState.usuarios.forEach(u => tecEl.innerHTML += `<option value="${u.name}">${u.name} (${u.role})</option>`);

        const slaEl = document.getElementById('ticket-sla');
        slaEl.innerHTML = '';
        dataState.slaList.forEach(s => slaEl.innerHTML += `<option value="${s.days}">${s.desc} (${s.days} Días)</option>`);
    },
    loadSedesForClient() {
        const client = document.getElementById('ticket-cliente').value;
        const sedeEl = document.getElementById('ticket-sede');
        if(!sedeEl) return;
        sedeEl.innerHTML = '';
        // Filtrar estrictamente las sedes que pertenecen a este cliente
        dataState.sedes.filter(s => s.client === client).forEach(s => {
            sedeEl.innerHTML += `<option value="${s.sede}">${s.sede}</option>`;
        });
    },
    saveTicket(e) {
        e.preventDefault();
        const ticket = {
            id: 'TK-' + Math.floor(Math.random() * 9000 + 1000),
            cliente: document.getElementById('ticket-cliente').value,
            sede: document.getElementById('ticket-sede').value,
            sistema: document.getElementById('ticket-sistema').value,
            falla: document.getElementById('ticket-falla').value,
            tecnico: document.getElementById('ticket-tecnico').value,
            sla: document.getElementById('ticket-sla').value,
            desc: document.getElementById('ticket-desc').value,
            estado: 'Asignado',
            fecha: '2026-11'
        };
        dataState.tickets.push(ticket);
        this.saveStorage();
        alert(`Ticket ${ticket.id} creado con éxito.`);
        e.target.reset();
        this.navigateTo('tickets');
    },
    abrirCierre(id) {
        document.getElementById('modal-ticket-id').innerText = id;
        document.getElementById('modal-cierre').style.display = 'flex';
    },
    submitCierre(e) {
        e.preventDefault();
        const id = document.getElementById('modal-ticket-id').innerText;
        const ticket = dataState.tickets.find(t => t.id === id);
        if(ticket) ticket.estado = 'Cumplido';
        this.saveStorage();
        document.getElementById('modal-cierre').style.display = 'none';
        alert('Ticket cerrado. Informe PDF enviado.');
        this.renderTicketsTable();
    },
    renderTicketsTable() {
        const tbody = document.getElementById('tickets-tbody');
        if(!tbody) return;
        
        let filteredTickets = dataState.tickets;
        if(activeClientContext) {
            filteredTickets = filteredTickets.filter(t => t.cliente === activeClientContext);
        } else if(currentUser && currentUser.assignedClient !== "TODOS") {
            filteredTickets = filteredTickets.filter(t => t.cliente === currentUser.assignedClient);
        }

        if(filteredTickets.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted);">No hay tickets registrados para este cliente.</td></tr>`;
            return;
        }
        tbody.innerHTML = '';
        filteredTickets.forEach(t => {
            const bg = t.estado === 'Cumplido' ? 'var(--success)' : 'var(--accent)';
            tbody.innerHTML += `<tr>
                <td><strong>${t.id}</strong></td>
                <td>${t.cliente}</td>
                <td>${t.sede}</td>
                <td>${t.sistema}</td>
                <td>${t.falla}</td>
                <td>${t.tecnico}</td>
                <td>${t.sla} Días</td>
                <td><span class="badge" style="background:${bg}">${t.estado}</span></td>
                <td><button class="btn btn-primary" style="padding:0.3rem 0.8rem; font-size:0.8rem;" onclick="app.abrirCierre('${t.id}')">Atender</button></td>
            </tr>`;
        });
    },

    // --- DASHBOARD & ANÁLISIS INDEPENDIENTE POR INDICADOR ---
    renderDashboard() {
        let filtered = dataState.tickets;
        
        // Aplicar restricción por cliente activo o usuario asignado
        if(activeClientContext) {
            filtered = filtered.filter(t => t.cliente === activeClientContext);
        } else if(currentUser && currentUser.assignedClient !== "TODOS") {
            filtered = filtered.filter(t => t.cliente === currentUser.assignedClient);
        }

        const fSed = document.getElementById('filt-sede').value;
        const fTec = document.getElementById('filt-tecnico').value;

        if(fSed) filtered = filtered.filter(t => t.sede === fSed);
        if(fTec) filtered = filtered.filter(t => t.tecnico === fTec);

        const creados = filtered.length;
        const asignados = filtered.filter(t => t.estado === 'Asignado').length;
        const proceso = filtered.filter(t => t.estado === 'En Proceso').length;
        const retrasados = filtered.filter(t => t.estado === 'Retrasado').length;
        const cumplidos = filtered.filter(t => t.estado === 'Cumplido').length;

        document.getElementById('kpi-creados').innerText = creados;
        document.getElementById('kpi-asignados').innerText = asignados;
        document.getElementById('kpi-proceso').innerText = proceso;
        document.getElementById('kpi-retrasados').innerText = retrasados;
        document.getElementById('kpi-cumplidos').innerText = cumplidos;
        document.getElementById('kpi-tiempo').innerText = cumplidos > 0 ? "14.2h" : "0h";

        this.buildIndependentAnalysis(creados, asignados, proceso, retrasados, cumplidos);
        this.buildIndicators(filtered);
    },
    buildIndependentAnalysis(creados, asignados, proceso, retrasados, cumplidos) {
        const container = document.getElementById('independent-analysis-container');
        if(!container) return;

        container.innerHTML = `
            <div class="indicator-analysis-card" style="border-left-color: var(--primary);">
                <h4><i class="fas fa-ticket-alt" style="color: var(--primary);"></i> Análisis Indicador Creados (${creados})</h4>
                <p><strong>Análisis Independiente:</strong> Refleja el volumen total de novedades ingresadas para el cliente seleccionado.</p>
                <p><strong>Recomendación:</strong> Valide las tendencias de apertura para anticipar mantenimientos preventivos en sedes críticas.</p>
            </div>
            <div class="indicator-analysis-card" style="border-left-color: var(--secondary);">
                <h4><i class="fas fa-user-clock" style="color: var(--secondary);"></i> Análisis Indicador Asignados (${asignados})</h4>
                <p><strong>Análisis Independiente:</strong> Muestra los reportes pendientes de ejecución inicial en campo.</p>
                <p><strong>Recomendación:</strong> Verifique la disponibilidad geográfica de los técnicos en el mapa para reducir tiempos de desplazamiento.</p>
            </div>
            <div class="indicator-analysis-card" style="border-left-color: var(--warning);">
                <h4><i class="fas fa-spinner" style="color: var(--warning);"></i> Análisis Indicador En Proceso (${proceso})</h4>
                <p><strong>Análisis Independiente:</strong> Mide los diagnósticos activos y reparaciones en curso.</p>
                <p><strong>Recomendación:</strong> Controle el uso de repuestos y supervise el estatus de conectividad de los sistemas.</p>
            </div>
            <div class="indicator-analysis-card" style="border-left-color: var(--danger);">
                <h4><i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i> Análisis Indicador Retrasados (${retrasados})</h4>
                <p><strong>Análisis Independiente:</strong> Alerta sobre tickets que excedieron el tiempo meta SLA establecido.</p>
                <p><strong>Recomendación:</strong> Reasigne personal técnico de manera inmediata para mitigar impacto en el servicio del cliente.</p>
            </div>
            <div class="indicator-analysis-card" style="border-left-color: var(--success);">
                <h4><i class="fas fa-check-circle" style="color: var(--success);"></i> Análisis Indicador Cumplidos (${cumplidos})</h4>
                <p><strong>Análisis Independiente:</strong> Evalúa la efectividad en el cierre y reporte formal al cliente.</p>
                <p><strong>Recomendación:</strong> Mantenga el estándar de calidad y verifique las firmas de conformidad.</p>
            </div>
        `;
    },
    buildIndicators(filtered) {
        // Filtrar sedes del cliente activo
        let clientSedes = dataState.sedes;
        let activeClient = activeClientContext || (currentUser && currentUser.assignedClient !== "TODOS" ? currentUser.assignedClient : "");
        if(activeClient) {
            clientSedes = dataState.sedes.filter(s => s.client === activeClient);
        }
        const sedesList = clientSedes.map(s => s.sede);
        const sistemasList = dataState.sistemas;
        const tecnicosList = dataState.usuarios.map(u => u.name);

        // 1. Ticket vs Sede
        const ticketSedeCounts = sedesList.map(sede => filtered.filter(t => t.sede === sede).length);
        if(this.charts.ticketSede) this.charts.ticketSede.destroy();
        this.charts.ticketSede = new Chart(document.getElementById('chart-ticket-sede').getContext('2d'), {
            type: 'bar',
            data: { labels: sedesList, datasets: [{ label: 'Tickets vs Sede', data: ticketSedeCounts, backgroundColor: '#1E3A8A' }] },
            options: { responsive: true, plugins: { title: { display: true, text: '1. Indicador: Tickets vs Sede (Exclusivo Cliente)' } } }
        });

        // 2. Fallas de sistema vs Sedes
        const fallasSedesCounts = sedesList.map(sede => filtered.filter(t => t.sede === sede && t.falla).length);
        if(this.charts.fallasSedes) this.charts.fallasSedes.destroy();
        this.charts.fallasSedes = new Chart(document.getElementById('chart-fallas-sedes').getContext('2d'), {
            type: 'bar',
            data: { labels: sedesList, datasets: [{ label: 'Fallas Reportadas', data: fallasSedesCounts, backgroundColor: '#EF4444' }] },
            options: { responsive: true, plugins: { title: { display: true, text: '2. Indicador: Fallas de Sistema vs Sedes' } } }
        });

        // 3. Cantidad de ticket generados por tipo de sistemas
        const sistemasCounts = sistemasList.map(sis => filtered.filter(t => t.sistema === sis).length);
        if(this.charts.ticketSistemas) this.charts.ticketSistemas.destroy();
        this.charts.ticketSistemas = new Chart(document.getElementById('chart-ticket-sistemas').getContext('2d'), {
            type: 'doughnut',
            data: { labels: sistemasList, datasets: [{ data: sistemasCounts, backgroundColor: ['#1E3A8A', '#FF6B35', '#10B981', '#F59E0B'] }] },
            options: { responsive: true, plugins: { title: { display: true, text: '3. Indicador: Tickets por Tipo de Sistema' } } }
        });

        // 4. Ticket vs Técnico
        const ticketTecCounts = tecnicosList.map(tec => filtered.filter(t => t.tecnico === tec).length);
        if(this.charts.ticketTecnico) this.charts.ticketTecnico.destroy();
        this.charts.ticketTecnico = new Chart(document.getElementById('chart-ticket-tecnico').getContext('2d'), {
            type: 'bar',
            data: { labels: tecnicosList, datasets: [{ label: 'Tickets Asignados', data: ticketTecCounts, backgroundColor: '#FF6B35' }] },
            options: { responsive: true, plugins: { title: { display: true, text: '4. Indicador: Tickets vs Técnico' } } }
        });

        // 5. Ticket vs Técnico vs SLA
        const slaTecProm = tecnicosList.map(tec => {
            const tecTickets = filtered.filter(t => t.tecnico === tec);
            if(tecTickets.length === 0) return 0;
            const suma = tecTickets.reduce((acc, curr) => acc + parseFloat(curr.sla || 0), 0);
            return (suma / tecTickets.length).toFixed(1);
        });
        if(this.charts.ticketTecSla) this.charts.ticketTecSla.destroy();
        this.charts.ticketTecSla = new Chart(document.getElementById('chart-ticket-tec-sla').getContext('2d'), {
            type: 'bar',
            data: { labels: tecnicosList, datasets: [{ label: 'Promedio SLA (Días)', data: slaTecProm, backgroundColor: '#10B981' }] },
            options: { responsive: true, plugins: { title: { display: true, text: '5. Indicador: Ticket vs Técnico vs SLA' } } }
        });

        // 6. Tendencia de sedes con falla vs tiempo
        if(this.charts.tendenciaSedes) this.charts.tendenciaSedes.destroy();
        this.charts.tendenciaSedes = new Chart(document.getElementById('chart-tendencia-sedes').getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
                datasets: [{ label: 'Sedes con Novedades', data: [1, 2, 2, filtered.length], borderColor: '#0A192F', backgroundColor: 'rgba(10,25,47,0.1)', fill: true, tension: 0.3 }]
            },
            options: { responsive: true, plugins: { title: { display: true, text: '6. Indicador: Tendencia de Sedes con Falla vs Tiempo' } } }
        });
    },

    // --- RENDERIZADO GENERAL ---
    renderAll() {
        // Selector Global de Clientes y Selector de Sedes en Ajustes
        const gClientSel = document.getElementById('global-client-filter');
        const sCli = document.getElementById('sede-client-select');
        const uClientSel = document.getElementById('new-user-client');

        if(gClientSel) {
            gClientSel.innerHTML = '<option value="">Todos los Clientes (Vista Master)</option>';
            dataState.clientes.forEach(c => gClientSel.innerHTML += `<option value="${c.name}">${c.name}</option>`);
            gClientSel.value = activeClientContext;
        }
        if(sCli) {
            sCli.innerHTML = '<option value="">Seleccione Cliente...</option>';
            dataState.clientes.forEach(c => sCli.innerHTML += `<option value="${c.name}">${c.name}</option>`);
        }
        if(uClientSel) {
            uClientSel.innerHTML = '<option value="TODOS">Asignar Todos los Clientes (Master)</option>';
            dataState.clientes.forEach(c => uClientSel.innerHTML += `<option value="${c.name}">${c.name}</option>`);
        }

        // Tablas Clientes
        const tCli = document.getElementById('table-clientes');
        if(tCli) {
            tCli.innerHTML = '';
            dataState.clientes.forEach((c, i) => {
                tCli.innerHTML += `<tr><td><strong>${c.name}</strong></td><td><span style="display:inline-block;width:15px;height:15px;background:${c.color};border-radius:4px;"></span></td><td><img src="${c.logo}" style="height:25px; object-fit:contain;"></td><td><button class="btn btn-warning" onclick="app.openEditModal('client', ${i})" style="margin-right:4px;">Editar</button><button class="btn btn-danger" onclick="app.deleteClient(${i})">Del</button></td></tr>`;
            });
        }

        // Tablas Sedes
        const tSed = document.getElementById('table-sedes');
        const fSed = document.getElementById('filt-sede');
        if(tSed && fSed) {
            tSed.innerHTML = ''; fSed.innerHTML = '<option value="">Sede (Todas)</option>';
            dataState.sedes.forEach((s, i) => {
                tSed.innerHTML += `<tr><td><strong>${s.sede}</strong></td><td>${s.client}</td><td><button class="btn btn-warning" onclick="app.openEditModal('sede', ${i})" style="margin-right:4px;">Editar</button><button class="btn btn-danger" onclick="app.deleteSede(${i})">Del</button></td></tr>`;
                fSed.innerHTML += `<option value="${s.sede}">${s.sede}</option>`;
            });
        }

        // Tablas Usuarios
        const tUsu = document.getElementById('table-usuarios');
        const fTec = document.getElementById('filt-tecnico');
        if(tUsu && fTec) {
            tUsu.innerHTML = ''; fTec.innerHTML = '<option value="">Técnico (Todos)</option>';
            dataState.usuarios.forEach((u, i) => {
                tUsu.innerHTML += `<tr><td><strong>${u.name}</strong></td><td>${u.role}</td><td>${u.assignedClient}</td><td><span style="font-size:0.8rem;color:var(--text-muted);">${u.perms.join(', ')}</span></td><td><button class="btn btn-warning" onclick="app.openEditModal('user', ${i})" style="margin-right:4px;">Editar</button><button class="btn btn-danger" onclick="app.deleteUser(${i})">Del</button></td></tr>`;
                fTec.innerHTML += `<option value="${u.name}">${u.name}</option>`;
            });
        }

        // Sistemas
        const tSys = document.getElementById('table-sistemas');
        if(tSys) {
            tSys.innerHTML = '';
            dataState.sistemas.forEach((s, i) => {
                tSys.innerHTML += `<tr><td>${s}</td><td><button class="btn btn-warning" onclick="app.openEditModal('sistema', ${i})" style="margin-right:4px;">Editar</button><button class="btn btn-danger" onclick="app.deleteSistema(${i})">Del</button></td></tr>`;
            });
        }

        // Fallas
        const tFal = document.getElementById('table-fallas');
        if(tFal) {
            tFal.innerHTML = '';
            dataState.fallas.forEach((f, i) => {
                tFal.innerHTML += `<tr><td>${f}</td><td><button class="btn btn-warning" onclick="app.openEditModal('falla', ${i})" style="margin-right:4px;">Editar</button><button class="btn btn-danger" onclick="app.deleteFalla(${i})">Del</button></td></tr>`;
            });
        }

        // SLA
        const tSla = document.getElementById('table-sla');
        if(tSla) {
            tSla.innerHTML = '';
            dataState.slaList.forEach((sla, i) => {
                tSla.innerHTML += `<tr><td>${sla.desc}</td><td><strong>${sla.days} Días</strong></td><td><button class="btn btn-warning" onclick="app.openEditModal('sla', ${i})" style="margin-right:4px;">Editar</button><button class="btn btn-danger" onclick="app.deleteSla(${i})">Del</button></td></tr>`;
            });
        }

        this.renderDashboard();
    },
    initMap() {
        if(!this.map) {
            this.map = L.map('tech-map').setView([4.6097, -74.0817], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
            L.marker([4.6097, -74.0817]).addTo(this.map).bindPopup("<b>Técnico:</b> Carlos Pérez (GPS Activo)");
        }
        setTimeout(() => this.map.invalidateSize(), 200);
    },
    generatePDF() {
        alert("Generando informe PDF gerencial multi-cliente...");
    },
    saveStorage() {
        localStorage.setItem('servitrack_db_v11', JSON.stringify(dataState));
    },
    loadStorage() {
        const saved = localStorage.getItem('servitrack_db_v11');
        if(saved) dataState = JSON.parse(saved);
    }
};

window.onload = () => app.init();
