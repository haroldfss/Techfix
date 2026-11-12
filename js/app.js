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
        { name: "Carlos Pérez", pass: "1234", role: "Técnico", assignedClient: "Banco de Bogotá", perms: ["Gestión de Tickets"] },
        { name: "Oscar Muñoz", pass: "1234", role: "Operador", assignedClient: "Centro Comercial Andino", perms: ["Dashboard Gerencial", "Gestión de Tickets", "Nuevo Ticket"] }
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
            // Bloquear contexto de cliente si el usuario tiene asignado uno exclusivo
            activeClientContext = (found.assignedClient && found.assignedClient !== "TODOS") ? found.assignedClient : "";
            
            document.getElementById('login-view').classList.remove('active');
            document.getElementById('app-view').classList.add('active');
            
            this.applyUserPrivileges();
            
            if(currentUser.perms.includes("Dashboard Gerencial") || currentUser.role === "Administrador") {
                this.navigateTo('dashboard');
            } else {
                this.navigateTo('tickets');
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

        const bottomNav = document.getElementById('mobile-bottom-nav');
        if(bottomNav) {
            bottomNav.querySelectorAll('button').forEach(btn => {
                const txt = btn.innerText.toLowerCase();
                if(txt.includes('dash') && !currentUser.perms.includes("Dashboard Gerencial") && currentUser.role !== "Administrador") {
                    btn.style.display = 'none';
                } else if(txt.includes('nuevo') && !currentUser.perms.includes("Nuevo Ticket") && currentUser.role !== "Administrador") {
                    btn.style.display = 'none';
                } else {
                    btn.style.display = 'flex';
                }
            });
        }

        const btnNewTop = document.getElementById('btn-new-ticket-top');
        if(btnNewTop) {
            btnNewTop.style.display = (currentUser.perms.includes("Nuevo Ticket") || currentUser.role === "Administrador") ? 'inline-flex' : 'none';
        }

        document.getElementById('sidebar-user-role-badge').innerText = `${currentUser.role} (${currentUser.assignedClient})`;
        
        // RESTRICCIÓN ESTRICTA DE INTERFAZ PARA USUARIOS NO ADMINISTRADORES
        if(currentUser.assignedClient && currentUser.assignedClient !== "TODOS") {
            const clientObj = dataState.clientes.find(c => c.name === currentUser.assignedClient);
            if(clientObj) this.applyClientBranding(clientObj);
            
            const gClientSel = document.getElementById('global-client-filter');
            if(gClientSel) {
                gClientSel.value = currentUser.assignedClient;
                // Si no es admin, deshabilitar el selector global para que no pueda cambiar de cliente
                if(currentUser.role !== "Administrador") {
                    gClientSel.disabled = true;
                }
            }
        } else {
            const gClientSel = document.getElementById('global-client-filter');
            if(gClientSel) gClientSel.disabled = false;
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
        if(currentUser && currentUser.assignedClient !== "TODOS" && currentUser.role !== "Administrador") {
            activeClientContext = currentUser.assignedClient;
            return;
        }
        activeClientContext = val;
        const clientObj = dataState.clientes.find(c => c.name === val);
        this.applyClientBranding(clientObj);
        this.updateSedeDropdowns();
        this.renderDashboard();
    },
    updateSedeDropdowns() {
        const sedeSelect = document.getElementById('filt-sede');
        if(!sedeSelect) return;
        sedeSelect.innerHTML = '<option value="">Sede (Todas)</option>';
        
        let targetSedes = dataState.sedes;
        let activeClient = (currentUser && currentUser.assignedClient && currentUser.assignedClient !== "TODOS") ? currentUser.assignedClient : activeClientContext;
        
        if(activeClient) {
            targetSedes = dataState.sedes.filter(s => s.client === activeClient);
        }
        
        targetSedes.forEach(s => {
            sedeSelect.innerHTML += `<option value="${s.sede}">${s.sede}</option>`;
        });
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
        const sections = ['dashboard', 'tickets', 'create-ticket', 'map', 'settings'];
        sections.forEach(s => {
            const el = document.getElementById(`view-${s}`);
            if(el) el.style.display = 'none';
        });

        const target = document.getElementById(`view-${section}`);
        if(target) target.style.display = 'block';

        document.querySelectorAll('.sidebar .nav-links li').forEach(li => li.classList.remove('active'));
        const menuLi = document.getElementById(`menu-${section.charAt(0).toUpperCase() + section.slice(1)}`);
        if(menuLi) menuLi.classList.add('active');

        document.querySelectorAll('.mobile-bottom-nav button').forEach(b => b.classList.remove('active'));
        const mobileBtn = document.getElementById(`mn-${section}`);
        if(mobileBtn) mobileBtn.classList.add('active');

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
        this.updateSedeDropdowns();
        alert("Sede agregada.");
    },
    deleteSede(idx) {
        if(confirm("¿Eliminar esta sede?")) {
            dataState.sedes.splice(idx, 1);
            this.saveStorage();
            this.renderAll();
            this.updateSedeDropdowns();
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
        document.querySelectorAll('.perm-cb').forEach(cb => cb.checked = false);
        this.renderAll();
        alert("Usuario registrado exitosamente.");
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
        const gPerms = document.getElementById('edit-group-perms');
        g2.style.display = 'block';
        gPerms.style.display = 'none';

        if(type === 'client') {
            document.getElementById('modal-edit-title').innerText = "Editar Cliente y Logo";
            document.getElementById('edit-value-1').value = dataState.clientes[idx].name;
            document.getElementById('edit-value-2').value = dataState.clientes[idx].logo;
        } else if(type === 'sede') {
            document.getElementById('modal-edit-title').innerText = "Editar Sede";
            document.getElementById('edit-value-1').value = dataState.sedes[idx].sede;
            g2.style.display = 'none';
        } else if(type === 'user') {
            document.getElementById('modal-edit-title').innerText = "Editar Usuario y Privilegios";
            document.getElementById('edit-value-1').value = dataState.usuarios[idx].name;
            document.getElementById('edit-value-2').value = dataState.usuarios[idx].pass;
            gPerms.style.display = 'block';
            
            const userPerms = dataState.usuarios[idx].perms || [];
            document.querySelectorAll('.edit-perm-cb').forEach(cb => {
                cb.checked = userPerms.includes(cb.value);
            });
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

        if(type === 'client') { 
            dataState.clientes[idx].name = v1; 
            dataState.clientes[idx].logo = v2; 
        } else if(type === 'sede') { 
            dataState.sedes[idx].sede = v1; 
        } else if(type === 'user') { 
            dataState.usuarios[idx].name = v1; 
            dataState.usuarios[idx].pass = v2; 
            const newPerms = Array.from(document.querySelectorAll('.edit-perm-cb:checked')).map(cb => cb.value);
            dataState.usuarios[idx].perms = newPerms;
        } else if(type === 'sistema') { 
            dataState.sistemas[idx] = v1; 
        } else if(type === 'falla') { 
            dataState.fallas[idx] = v1; 
        } else if(type === 'sla') { 
            dataState.slaList[idx].desc = v1; 
            dataState.slaList[idx].days = v2; 
        }

        this.saveStorage();
        document.getElementById('modal-edit').style.display = 'none';
        this.renderAll();
        alert("Cambios guardados con éxito.");
    },

    // --- TICKETS ---
    loadTicketSelectors() {
        const clientEl = document.getElementById('ticket-cliente');
        if(!clientEl) return;
        clientEl.innerHTML = '';
        
        let availableClients = dataState.clientes;
        if(currentUser && currentUser.assignedClient && currentUser.assignedClient !== "TODOS") {
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
        alert('Ticket cerrado.');
        this.renderTicketsTable();
    },
    renderTicketsTable() {
        const tbody = document.getElementById('tickets-tbody');
        if(!tbody) return;
        
        let filteredTickets = dataState.tickets;
        let activeClient = (currentUser && currentUser.assignedClient && currentUser.assignedClient !== "TODOS") ? currentUser.assignedClient : activeClientContext;
        
        if(activeClient) {
            filteredTickets = filteredTickets.filter(t => t.cliente === activeClient);
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
                <td><button class="btn btn-primary btn-sm" onclick="app.abrirCierre('${t.id}')">Atender</button></td>
            </tr>`;
        });
    },

    // --- DASHBOARD & INDICADORES CON RESTRICCIÓN ESTRICTA DE SEDES ---
    renderDashboard() {
        let filtered = dataState.tickets;
        
        // FORZAR FILTRADO ESTRICTO DE TICKETS POR CLIENTE ASIGNADO
        let activeClient = (currentUser && currentUser.assignedClient && currentUser.assignedClient !== "TODOS") ? currentUser.assignedClient : activeClientContext;
        
        if(activeClient) {
            filtered = filtered.filter(t => t.cliente === activeClient);
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

        this.buildIndicators(filtered);
    },
    buildIndicators(filtered) {
        let clientSedes = dataState.sedes;
        let activeClient = (currentUser && currentUser.assignedClient && currentUser.assignedClient !== "TODOS") ? currentUser.assignedClient : activeClientContext;
        
        // RESTRICCIÓN ABSOLUTA: Las sedes mostradas en los gráficos del dashboard deben pertenecer ÚNICAMENTE al cliente activo
        if(activeClient) {
            clientSedes = dataState.sedes.filter(s => s.client === activeClient);
        }
        
        const sedesList = clientSedes.map(s => s.sede);
        const sistemasList = dataState.sistemas;
        const tecnicosList = dataState.usuarios.map(u => u.name);

        const ticketSedeCounts = sedesList.map(sede => filtered.filter(t => t.sede === sede).length);
        if(this.charts.ticketSede) this.charts.ticketSede.destroy();
        this.charts.ticketSede = new Chart(document.getElementById('chart-ticket-sede').getContext('2d'), {
            type: 'bar',
            data: { labels: sedesList, datasets: [{ label: 'Tickets vs Sede', data: ticketSedeCounts, backgroundColor: '#1E3A8A' }] },
            options: { responsive: true, plugins: { title: { display: false } } }
        });
        document.getElementById('analysis-text-1').innerText = `Análisis: Concentración de ${filtered.length} tickets en sedes exclusivas. Recomendación: Evaluar mantenimiento preventivo en las sedes con mayor volumen.`;

        const fallasSedesCounts = sedesList.map(sede => filtered.filter(t => t.sede === sede && t.falla).length);
        if(this.charts.fallasSedes) this.charts.fallasSedes.destroy();
        this.charts.fallasSedes = new Chart(document.getElementById('chart-fallas-sedes').getContext('2d'), {
            type: 'bar',
            data: { labels: sedesList, datasets: [{ label: 'Fallas Reportadas', data: fallasSedesCounts, backgroundColor: '#EF4444' }] },
            options: { responsive: true, plugins: { title: { display: false } } }
        });
        document.getElementById('analysis-text-2').innerText = `Análisis: Correlación entre fallas e infraestructura de sedes. Recomendación: Revisar estabilidad de energía y redes en sitios críticos.`;

        const sistemasCounts = sistemasList.map(sis => filtered.filter(t => t.sistema === sis).length);
        if(this.charts.ticketSistemas) this.charts.ticketSistemas.destroy();
        this.charts.ticketSistemas = new Chart(document.getElementById('chart-ticket-sistemas').getContext('2d'), {
            type: 'doughnut',
            data: { labels: sistemasList, datasets: [{ data: sistemasCounts, backgroundColor: ['#1E3A8A', '#FF6B35', '#10B981', '#F59E0B'] }] },
            options: { responsive: true, plugins: { title: { display: false } } }
        });
        document.getElementById('analysis-text-3').innerText = `Análisis: Distribución por tecnologías afectadas. Recomendación: Priorizar auditorías sobre sistemas con mayor índice de fallas.`;

        const ticketTecCounts = tecnicosList.map(tec => filtered.filter(t => t.tecnico === tec).length);
        if(this.charts.ticketTecnico) this.charts.ticketTecnico.destroy();
        this.charts.ticketTecnico = new Chart(document.getElementById('chart-ticket-tecnico').getContext('2d'), {
            type: 'bar',
            data: { labels: tecnicosList, datasets: [{ label: 'Tickets Asignados', data: ticketTecCounts, backgroundColor: '#FF6B35' }] },
            options: { responsive: true, plugins: { title: { display: false } } }
        });
        document.getElementById('analysis-text-4').innerText = `Análisis: Carga laboral asignada al personal técnico. Recomendación: Balancear órdenes para evitar saturación en campo.`;

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
            options: { responsive: true, plugins: { title: { display: false } } }
        });
        document.getElementById('analysis-text-5').innerText = `Análisis: Cumplimiento de tiempos meta por técnico. Recomendación: Capacitar al personal para reducir el SLA promedio.`;

        if(this.charts.tendenciaSedes) this.charts.tendenciaSedes.destroy();
        this.charts.tendenciaSedes = new Chart(document.getElementById('chart-tendencia-sedes').getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
                datasets: [{ label: 'Sedes con Novedades', data: [1, 2, 2, filtered.length], borderColor: '#0A192F', backgroundColor: 'rgba(10,25,47,0.1)', fill: true, tension: 0.3 }]
            },
            options: { responsive: true, plugins: { title: { display: false } } }
        });
        document.getElementById('analysis-text-6').innerText = `Análisis: Evolución temporal de sedes impactadas. Recomendación: Establecer alertas tempranas ante picos de fallas.`;
    },

    // --- RENDERIZADO GENERAL ---
    renderAll() {
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

        const tCli = document.getElementById('table-clientes');
        if(tCli) {
            tCli.innerHTML = '';
            dataState.clientes.forEach((c, i) => {
                tCli.innerHTML += `<tr><td><strong>${c.name}</strong></td><td><span style="display:inline-block;width:15px;height:15px;background:${c.color};border-radius:4px;"></span></td><td><img src="${c.logo}" style="height:25px; object-fit:contain;"></td><td><button class="btn btn-warning btn-sm" onclick="app.openEditModal('client', ${i})" style="margin-right:4px;">Editar</button><button class="btn btn-danger btn-sm" onclick="app.deleteClient(${i})">Del</button></td></tr>`;
            });
        }

        const tSed = document.getElementById('table-sedes');
        if(tSed) {
            tSed.innerHTML = '';
            dataState.sedes.forEach((s, i) => {
                tSed.innerHTML += `<tr><td><strong>${s.sede}</strong></td><td>${s.client}</td><td><button class="btn btn-warning btn-sm" onclick="app.openEditModal('sede', ${i})" style="margin-right:4px;">Editar</button><button class="btn btn-danger btn-sm" onclick="app.deleteSede(${i})">Del</button></td></tr>`;
            });
        }

        this.updateSedeDropdowns();

        const tUsu = document.getElementById('table-usuarios');
        const fTec = document.getElementById('filt-tecnico');
        if(tUsu && fTec) {
            tUsu.innerHTML = ''; fTec.innerHTML = '<option value="">Técnico (Todos)</option>';
            dataState.usuarios.forEach((u, i) => {
                tUsu.innerHTML += `<tr><td><strong>${u.name}</strong></td><td>${u.role}</td><td>${u.assignedClient}</td><td><span style="font-size:0.85rem;color:var(--text-muted);">${u.perms.join(', ')}</span></td><td><button class="btn btn-warning btn-sm" onclick="app.openEditModal('user', ${i})" style="margin-right:4px;">Editar</button><button class="btn btn-danger btn-sm" onclick="app.deleteUser(${i})">Del</button></td></tr>`;
                fTec.innerHTML += `<option value="${u.name}">${u.name}</option>`;
            });
        }

        const tSys = document.getElementById('table-sistemas');
        if(tSys) {
            tSys.innerHTML = '';
            dataState.sistemas.forEach((s, i) => {
                tSys.innerHTML += `<tr><td>${s}</td><td><button class="btn btn-warning btn-sm" onclick="app.openEditModal('sistema', ${i})" style="margin-right:4px;">Editar</button><button class="btn btn-danger btn-sm" onclick="app.deleteSistema(${i})">Del</button></td></tr>`;
            });
        }

        const tFal = document.getElementById('table-fallas');
        if(tFal) {
            tFal.innerHTML = '';
            dataState.fallas.forEach((f, i) => {
                tFal.innerHTML += `<tr><td>${f}</td><td><button class="btn btn-warning btn-sm" onclick="app.openEditModal('falla', ${i})" style="margin-right:4px;">Editar</button><button class="btn btn-danger btn-sm" onclick="app.deleteFalla(${i})">Del</button></td></tr>`;
            });
        }

        const tSla = document.getElementById('table-sla');
        if(tSla) {
            tSla.innerHTML = '';
            dataState.slaList.forEach((sla, i) => {
                tSla.innerHTML += `<tr><td>${sla.desc}</td><td><strong>${sla.days} Días</strong></td><td><button class="btn btn-warning btn-sm" onclick="app.openEditModal('sla', ${i})" style="margin-right:4px;">Editar</button><button class="btn btn-danger btn-sm" onclick="app.deleteSla(${i})">Del</button></td></tr>`;
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
        alert("Generando informe PDF gerencial...");
    },
    saveStorage() {
        localStorage.setItem('servitrack_db_v16', JSON.stringify(dataState));
    },
    loadStorage() {
        const saved = localStorage.getItem('servitrack_db_v16');
        if(saved) dataState = JSON.parse(saved);
    }
};

window.onload = () => app.init();
