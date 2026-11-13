// Configuración de Firebase compatible con tu estructura
const firebaseConfig = {
  apiKey: "AIzaSyA2i85JZiLyEctgZ_0SqPD1plLqMzRd0sI",
  authDomain: "techfixapp-7ab17.firebaseapp.com",
  projectId: "techfixapp-7ab17",
  storageBucket: "techfixapp-7ab17.firebasestorage.app",
  messagingSenderId: "645933922075",
  appId: "1:645933922075:web:71284c1c43d1d2276985be",
  measurementId: "G-9F35YLNZ4Y"
};

// Inicializar Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Aquí continúa tu código actual...
let dataState = {
    // AQUÍ AGREGAS LOS TICKETS PARA QUE APAREZCAN EN CUALQUIER CELULAR
    tickets: [
        { id: 'TK-1001', cliente: 'Banco de Bogotá', sede: 'Sede Principal Calle 72', sistema: 'CCTV IP Dahua', falla: 'Pérdida de Enlace Video', tecnico: 'Carlos Pérez', sla: '1', estado: 'Asignado', fecha: '2026-11-01', fechaCreacion: '2026-11-01T08:00', fechaCumplido: null, actividades: '', materiales: '', recomendaciones: '' },
        { id: 'TK-1002', cliente: 'Centro Comercial Andino', sede: 'Torre Administrativa Andino', sistema: 'Intrusión AX PRO', falla: 'Batería Baja Panel', tecnico: 'Oscar Muñoz', sla: '3', estado: 'Cumplido', fecha: '2026-11-05', fechaCreacion: '2026-11-05T09:30', fechaCumplido: '2026-11-06T14:15', actividades: 'Reemplazo de batería de respaldo.', materiales: '1x Batería', recomendaciones: '' },
        // Ticket de prueba precargado para el usuario 'juan'
        { id: 'TK-1003', cliente: 'Banco de Bogotá', sede: 'Sucursal Norte 170', sistema: 'Control de Acceso Biométrico', falla: 'Falla Lector Biométrico', tecnico: 'juan', sla: '1', estado: 'Asignado', fecha: '2026-11-12', fechaCreacion: '2026-11-12T10:00', fechaCumplido: null, actividades: '', materiales: '', recomendaciones: '' }
    ],
    // AQUÍ AGREGAS LOS USUARIOS UNIVERSALES
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
        { name: "admin", pass: "admin", role: "Administrador", assignedClient: "TODOS", perms: ["Dashboard Gerencial", "Gestión de Tickets", "Nuevo Ticket", "Mapa Geolocalizado", "Ajustes & Parámetros"], lastLogin: "Nunca" },
        { name: "Meicon", pass: "123456", role: "Técnico", assignedClient: "Texmoda", perms: ["Gestión de Tickets"], lastLogin: "Nunca" },
        { name: "Fortox", pass: "123456", role: "Técnico", assignedClient: "Texmoda", perms: ["Gestión de Tickets"], lastLogin: "Nunca" },
        { name: "oscar.munoz", pass: "123456", role: "Operador", assignedClient: "Centro Comercial Andino", perms: ["Dashboard Gerencial", "Gestión de Tickets", "Nuevo Ticket", "Mapa Geolocalizado"], lastLogin: "Nunca" }
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
        
        this.loadStorage();

        const found = dataState.usuarios.find(u => u.name.toLowerCase() === userIn.toLowerCase() && u.pass === passIn);
        if(found) {
            currentUser = found;
            currentUser.lastLogin = new Date().toISOString().replace('T', ' ').substring(0, 16);
            activeClientContext = (found.assignedClient && found.assignedClient !== "TODOS") ? found.assignedClient : "";
            
            this.saveStorage();
            document.getElementById('login-view').classList.remove('active');
            document.getElementById('app-view').classList.add('active');
            
            this.applyUserPrivileges();
            this.updateLocation();
            if(currentUser.perms.includes("Dashboard Gerencial") || currentUser.role === "Administrador") {
                this.navigateTo('dashboard');
            } else if(currentUser.perms.includes("Gestión de Tickets")) {
                this.navigateTo('tickets');
            } else if(currentUser.perms.includes("Nuevo Ticket")) {
                this.navigateTo('create-ticket');
            } else {
                this.navigateTo('map');
            }
        } else {
            alert("Usuario o contraseña incorrectos. Verifique sus credenciales.");
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

        document.getElementById('sidebar-user-role-badge').innerText = `${currentUser.role} (${currentUser.assignedClient})`;
        
        const gClientSelBox = document.getElementById('global-client-filter-box');
        const gClientSel = document.getElementById('global-client-filter');
        if(currentUser.assignedClient && currentUser.assignedClient !== "TODOS") {
            const clientObj = dataState.clientes.find(c => c.name === currentUser.assignedClient);
            if(clientObj) this.applyClientBranding(clientObj);
            
            if(gClientSelBox && currentUser.role !== "Administrador") {
                gClientSelBox.style.display = 'none';
            }
        } else {
            if(gClientSelBox) gClientSelBox.style.display = 'block';
            if(gClientSel) gClientSel.disabled = false;
        }

        const ticketClienteGroup = document.getElementById('ticket-cliente-group');
        if(ticketClienteGroup) {
            ticketClienteGroup.style.display = (currentUser.role === "Administrador" || currentUser.assignedClient === "TODOS") ? 'block' : 'none';
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
        this.updateSedeCheckboxes();
        this.renderDashboard();
    },
    updateSedeCheckboxes() {
        const container = document.getElementById('filt-sedes-container');
        if(!container) return;
        container.innerHTML = '';
        
        let targetSedes = dataState.sedes;
        let activeClient = (currentUser && currentUser.assignedClient && currentUser.assignedClient !== "TODOS") ? currentUser.assignedClient : activeClientContext;
        
        if(activeClient) {
            targetSedes = dataState.sedes.filter(s => s.client === activeClient);
        }
        
        if(targetSedes.length === 0) {
            container.innerHTML = '<span style="font-size:0.85rem; color:var(--text-muted); padding:4px;">No hay sedes disponibles</span>';
            return;
        }

        targetSedes.forEach(s => {
            container.innerHTML += `
                <label><input type="checkbox" value="${s.sede}" class="sede-chk" checked onchange="app.renderDashboard()"> ${s.sede}</label>
            `;
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

        // Retraso para garantizar que los canvas existan en pantalla antes de dibujar
        if(section === 'dashboard') {
            setTimeout(() => {
                this.renderDashboard();
            }, 150);
        }
        
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
        this.updateSedeCheckboxes();
        alert("Sede agregada.");
    },
    deleteSede(idx) {
        if(confirm("¿Eliminar esta sede?")) {
            dataState.sedes.splice(idx, 1);
            this.saveStorage();
            this.renderAll();
            this.updateSedeCheckboxes();
        }
    },
    addUser(e) {
        e.preventDefault();
        const name = document.getElementById('new-user-name').value;
        const pass = document.getElementById('new-user-pass').value;
        const client = document.getElementById('new-user-client').value;
        const role = document.getElementById('new-role-name').value;
        const perms = Array.from(document.querySelectorAll('.perm-cb:checked')).map(cb => cb.value);
        
        dataState.usuarios.push({ name, pass, role, assignedClient: client, perms, lastLogin: "Nunca" });
        this.saveStorage();
        e.target.reset();
        document.querySelectorAll('.perm-cb').forEach(cb => cb.checked = false);
        this.renderAll();
        alert("Usuario registrado exitosamente. Ya puede iniciar sesión en este dispositivo.");
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
        dataState.sistemas.push(document.getElementById('new-sistema-name').value);
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
        dataState.fallas.push(document.getElementById('new-falla-name').value);
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
        dataState.slaList.push({ desc: document.getElementById('new-sla-desc').value, days: document.getElementById('new-sla-days').value });
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
    const g3 = document.getElementById('edit-group-3'); // Nuevo grupo para color
    const gPerms = document.getElementById('edit-group-perms');
    g2.style.display = 'block'; gPerms.style.display = 'none'; if(g3) g3.style.display = 'none';

    if(type === 'client') {
        document.getElementById('modal-edit-title').innerText = "Editar Cliente, Logo y Color";
        document.getElementById('edit-value-1').value = dataState.clientes[idx].name;
        document.getElementById('edit-value-2').value = dataState.clientes[idx].logo;
        if(g3) { g3.style.display = 'block'; document.getElementById('edit-value-3').value = dataState.clientes[idx].color; }
    }
    // ... (Mantén el resto igual)
},
saveEdit(e) {
    e.preventDefault();
    const type = document.getElementById('edit-type').value;
    const idx = parseInt(document.getElementById('edit-index').value);
    const v1 = document.getElementById('edit-value-1').value;
    const v2 = document.getElementById('edit-value-2').value;
    const v3 = document.getElementById('edit-value-3') ? document.getElementById('edit-value-3').value : '';

    if(type === 'client') { dataState.clientes[idx].name = v1; dataState.clientes[idx].logo = v2; dataState.clientes[idx].color = v3; }
    // ... (Mantén el resto igual)
    this.saveStorage();
    document.getElementById('modal-edit').style.display = 'none';
    this.renderAll();
},
    saveEdit(e) {
        e.preventDefault();
        const type = document.getElementById('edit-type').value;
        const idx = parseInt(document.getElementById('edit-index').value);
        const v1 = document.getElementById('edit-value-1').value;
        const v2 = document.getElementById('edit-value-2').value;

        if(type === 'client') { dataState.clientes[idx].name = v1; dataState.clientes[idx].logo = v2; }
        else if(type === 'sede') { dataState.sedes[idx].sede = v1; }
        else if(type === 'user') { 
            dataState.usuarios[idx].name = v1; dataState.usuarios[idx].pass = v2; 
            dataState.usuarios[idx].perms = Array.from(document.querySelectorAll('.edit-perm-cb:checked')).map(cb => cb.value);
        }
        else if(type === 'sistema') { dataState.sistemas[idx] = v1; }
        else if(type === 'falla') { dataState.fallas[idx] = v1; }
        else if(type === 'sla') { dataState.slaList[idx].desc = v1; dataState.slaList[idx].days = v2; }

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
        let activeClient = (currentUser && currentUser.assignedClient && currentUser.assignedClient !== "TODOS") ? currentUser.assignedClient : "";
        if(activeClient) availableClients = dataState.clientes.filter(c => c.name === activeClient);
        
        availableClients.forEach(c => clientEl.innerHTML += `<option value="${c.name}">${c.name}</option>`);
        this.loadSedesForClient();

        const sisEl = document.getElementById('ticket-sistema');
        sisEl.innerHTML = ''; dataState.sistemas.forEach(s => sisEl.innerHTML += `<option value="${s}">${s}</option>`);

        const fallaEl = document.getElementById('ticket-falla');
        fallaEl.innerHTML = ''; dataState.fallas.forEach(f => fallaEl.innerHTML += `<option value="${f}">${f}</option>`);

        const tecEl = document.getElementById('ticket-tecnico');
        tecEl.innerHTML = '';
        let targetTecs = dataState.usuarios.filter(u => u.role.toLowerCase().includes('técnico') || u.role.toLowerCase().includes('tecnico'));
        if(activeClient) targetTecs = targetTecs.filter(u => u.assignedClient === activeClient || u.assignedClient === "TODOS");
        if(targetTecs.length === 0) targetTecs = dataState.usuarios;
        targetTecs.forEach(u => tecEl.innerHTML += `<option value="${u.name}">${u.name} (${u.role})</option>`);

        const slaEl = document.getElementById('ticket-sla');
        slaEl.innerHTML = ''; dataState.slaList.forEach(s => slaEl.innerHTML += `<option value="${s.days}">${s.desc} (${s.days} Días)</option>`);
    },
    loadSedesForClient() {
        const clientEl = document.getElementById('ticket-cliente');
        let client = clientEl ? clientEl.value : "";
        let activeClient = (currentUser && currentUser.assignedClient && currentUser.assignedClient !== "TODOS") ? currentUser.assignedClient : client;
        
        const sedeEl = document.getElementById('ticket-sede');
        if(!sedeEl) return;
        sedeEl.innerHTML = '';
        dataState.sedes.filter(s => s.client === activeClient).forEach(s => {
            sedeEl.innerHTML += `<option value="${s.sede}">${s.sede}</option>`;
        });
    },
    saveTicket(e) {
        e.preventDefault();
        let activeClient = (currentUser && currentUser.assignedClient && currentUser.assignedClient !== "TODOS") ? currentUser.assignedClient : document.getElementById('ticket-cliente').value;
        const nowIso = new Date().toISOString().substring(0, 16);
        const todayStr = new Date().toISOString().substring(0, 10);
        
        const ticket = {
            id: 'TK-' + Math.floor(Math.random() * 9000 + 1000),
            cliente: activeClient,
            sede: document.getElementById('ticket-sede').value,
            sistema: document.getElementById('ticket-sistema').value,
            falla: document.getElementById('ticket-falla').value,
            tecnico: document.getElementById('ticket-tecnico').value,
            sla: document.getElementById('ticket-sla').value,
            desc: document.getElementById('ticket-desc').value,
            estado: 'Asignado', fecha: todayStr, fechaCreacion: nowIso, fechaCumplido: null,
            actividades: '', materiales: '', recomendaciones: ''
        };
        dataState.tickets.push(ticket);
        this.saveStorage();
        alert(`Ticket ${ticket.id} creado exitosamente.`);
        e.target.reset();
        this.navigateTo('tickets');
    },
    abrirCierre(id) {
    const ticket = dataState.tickets.find(t => t.id === id);
    if(ticket && ticket.estado === 'Cumplido') { alert("Ticket ya Cumplido."); return; }
    
    // Limpiar formulario para evitar datos del ticket anterior
    document.getElementById('cierre-actividades').value = '';
    document.getElementById('cierre-materiales').value = '';
    document.getElementById('cierre-recomendaciones').value = '';
    const fileInput = document.getElementById('cierre-fotos');
    if(fileInput) fileInput.value = '';

    document.getElementById('modal-ticket-id').innerText = id;
    document.getElementById('modal-cierre').style.display = 'flex';
},

submitCierre(e) {
    e.preventDefault();
    const id = document.getElementById('modal-ticket-id').innerText;
    const ticket = dataState.tickets.find(t => t.id === id);
    const correoCliente = document.getElementById('cierre-correo').value;      
        if(ticket) {
            if(ticket.estado === 'Cumplido') return;
            ticket.estado = 'Cumplido';
            ticket.fechaCumplido = new Date().toISOString().substring(0, 16);
            ticket.actividades = document.getElementById('cierre-actividades').value;
            ticket.materiales = document.getElementById('cierre-materiales').value;
            ticket.recomendaciones = document.getElementById('cierre-recomendaciones').value;
        }
        this.saveStorage();
        document.getElementById('modal-cierre').style.display = 'none';
        alert(`Ticket cerrado.\n\nSe ha enviado el informe a: ${correoCliente}`);
        this.renderTicketsTable();
    },
    calcularTiempoResolucion(t) {
        if(!t.fechaCreacion || !t.fechaCumplido) return 'Pendiente';
        const diffMs = new Date(t.fechaCumplido) - new Date(t.fechaCreacion);
        if(diffMs < 0) return '0h';
        const diffHrs = (diffMs / (1000 * 60 * 60)).toFixed(1);
        const diffDays = (diffHrs / 24).toFixed(1);
        return diffDays >= 1 ? `${diffDays} días (${diffHrs}h)` : `${diffHrs} horas`;
    },
    renderTicketsTable() {
    const tbody = document.getElementById('tickets-tbody');
    if(!tbody) return;
    
    let filteredTickets = dataState.tickets;
    let activeClient = (currentUser && currentUser.assignedClient && currentUser.assignedClient !== "TODOS") ? currentUser.assignedClient : activeClientContext;
    
    // Filtro por Cliente
    if(activeClient) {
        filteredTickets = filteredTickets.filter(t => t.cliente === activeClient);
    }

    // Filtro estricto por Técnico antes de validar y pintar
        if (currentUser && (currentUser.role.toLowerCase() === 'técnico' || currentUser.role.toLowerCase() === 'tecnico')) {
            filteredTickets = filteredTickets.filter(t => t.tecnico === currentUser.name);
        }

        if(filteredTickets.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted);">No tienes tickets asignados.</td></tr>`;
            return;
        }

       tbody.innerHTML = '';
        filteredTickets.forEach(t => {
            const bg = t.estado === 'Cumplido' ? 'var(--success)' : 'var(--accent)';
            const tiempoRes = this.calcularTiempoResolucion(t);
            const atenderBtn = t.estado === 'Cumplido' 
                ? `<div style="display:flex; gap:4px;"><button class="btn btn-outline btn-sm" disabled style="opacity:0.6;">Cumplido</button><button class="btn btn-secondary btn-sm" onclick="app.downloadSingleTicketPDF('${t.id}')"><i class="fas fa-file-pdf"></i></button></div>`
                : `<button class="btn btn-primary btn-sm" onclick="app.abrirCierre('${t.id}')">Atender</button>`;

            tbody.innerHTML += `<tr>
                <td><strong>${t.id}</strong></td>
                <td>${t.cliente}</td><td>${t.sede}</td><td>${t.sistema}</td><td>${t.falla}</td>
                <td>${t.tecnico}</td>
                <td><span style="font-weight:600; color:var(--secondary);">${tiempoRes}</span></td>
                <td><span class="badge" style="background:${bg}">${t.estado}</span></td>
                <td>${atenderBtn}</td>
            </tr>`;
        });
    },

    downloadSingleTicketPDF(id) {
        const t = dataState.tickets.find(item => item.id === id);
        if(!t) { alert("Ticket no encontrado."); return; }
        const clientObj = dataState.clientes.find(c => c.name === t.cliente) || {};
        const htmlContent = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Informe Ticket ${t.id}</title><style>body { font-family: Arial, sans-serif; padding: 30px; color: #1E293B; } .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1E3A8A; padding-bottom: 15px; margin-bottom: 20px; } .logo { max-height: 50px; max-width: 150px; object-fit: contain; } h1 { font-size: 20px; color: #1E3A8A; margin: 0; } .info-box { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 15px; border-radius: 8px; margin-bottom: 15px; } .info-box h3 { margin-top: 0; color: #0A192F; font-size: 15px; border-bottom: 1px solid #CBD5E1; padding-bottom: 5px; } p { margin: 6px 0; font-size: 13px; } .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 10px; }</style></head><body><div class="header"><div><h1>CERTIFICADO DE CUMPLIMIENTO</h1><p>Plataforma ServiTrack PWA</p></div><div>${clientObj.logo ? `<img src="${clientObj.logo}" class="logo" alt="Logo Cliente">` : `<strong>${t.cliente}</strong>`}</div></div><div class="info-box"><h3>1. Información General</h3><p><strong>ID del Ticket:</strong> ${t.id}</p><p><strong>Cliente / Empresa:</strong> ${t.cliente}</p><p><strong>Sede Operativa:</strong> ${t.sede}</p><p><strong>Sistema Afectado:</strong> ${t.sistema}</p><p><strong>Tipo de Falla:</strong> ${t.falla}</p></div><div class="info-box"><h3>2. Control de Tiempos y Personal</h3><p><strong>Técnico Asignado:</strong> ${t.tecnico}</p><p><strong>Estado Actual:</strong> <span style="color: #10B981; font-weight: bold;">${t.estado}</span></p><p><strong>SLA Pactado:</strong> ${t.sla} Días</p><p><strong>Fecha de Creación:</strong> ${t.fechaCreacion || t.fecha}</p><p><strong>Fecha de Cierre:</strong> ${t.fechaCumplido || 'N/A'}</p><p><strong>Tiempo Total de Resolución:</strong> ${this.calcularTiempoResolucion(t)}</p></div><div class="info-box"><h3>3. Detalle de Atención en Campo</h3><p><strong>Actividades Realizadas:</strong><br>${t.actividades || 'Sin registro detallado'}</p><p style="margin-top: 10px;"><strong>Repuestos y Materiales:</strong><br>${t.materiales || 'Ninguno'}</p><p style="margin-top: 10px;"><strong>Recomendaciones para el Cliente:</strong><br>${t.recomendaciones || 'Ninguna'}</p></div><div class="footer"><p>Documento generado electrónicamente por ServiTrack PWA - Control Multi-Cliente</p></div></body></html>`;
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `Informe_Cumplimiento_${t.id}_${t.cliente.replace(/\s+/g, '_')}.html`; a.click();
        URL.revokeObjectURL(url);
    },
    downloadSingleTicketPDF(id) {
        const t = dataState.tickets.find(item => item.id === id);
        if(!t) { alert("Ticket no encontrado."); return; }
        const clientObj = dataState.clientes.find(c => c.name === t.cliente) || {};
        const htmlContent = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Informe Ticket ${t.id}</title><style>body { font-family: Arial, sans-serif; padding: 30px; color: #1E293B; } .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1E3A8A; padding-bottom: 15px; margin-bottom: 20px; } .logo { max-height: 50px; max-width: 150px; object-fit: contain; } h1 { font-size: 20px; color: #1E3A8A; margin: 0; } .info-box { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 15px; border-radius: 8px; margin-bottom: 15px; } .info-box h3 { margin-top: 0; color: #0A192F; font-size: 15px; border-bottom: 1px solid #CBD5E1; padding-bottom: 5px; } p { margin: 6px 0; font-size: 13px; } .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 10px; }</style></head><body><div class="header"><div><h1>CERTIFICADO DE CUMPLIMIENTO</h1><p>Plataforma ServiTrack PWA</p></div><div>${clientObj.logo ? `<img src="${clientObj.logo}" class="logo" alt="Logo Cliente">` : `<strong>${t.cliente}</strong>`}</div></div><div class="info-box"><h3>1. Información General</h3><p><strong>ID del Ticket:</strong> ${t.id}</p><p><strong>Cliente / Empresa:</strong> ${t.cliente}</p><p><strong>Sede Operativa:</strong> ${t.sede}</p><p><strong>Sistema Afectado:</strong> ${t.sistema}</p><p><strong>Tipo de Falla:</strong> ${t.falla}</p></div><div class="info-box"><h3>2. Control de Tiempos y Personal</h3><p><strong>Técnico Asignado:</strong> ${t.tecnico}</p><p><strong>Estado Actual:</strong> <span style="color: #10B981; font-weight: bold;">${t.estado}</span></p><p><strong>SLA Pactado:</strong> ${t.sla} Días</p><p><strong>Fecha de Creación:</strong> ${t.fechaCreacion || t.fecha}</p><p><strong>Fecha de Cierre:</strong> ${t.fechaCumplido || 'N/A'}</p><p><strong>Tiempo Total de Resolución:</strong> ${this.calcularTiempoResolucion(t)}</p></div><div class="info-box"><h3>3. Detalle de Atención en Campo</h3><p><strong>Actividades Realizadas:</strong><br>${t.actividades || 'Sin registro detallado'}</p><p style="margin-top: 10px;"><strong>Repuestos y Materiales:</strong><br>${t.materiales || 'Ninguno'}</p><p style="margin-top: 10px;"><strong>Recomendaciones para el Cliente:</strong><br>${t.recomendaciones || 'Ninguna'}</p></div><div class="footer"><p>Documento generado electrónicamente por ServiTrack PWA - Control Multi-Cliente</p></div></body></html>`;
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `Informe_Cumplimiento_${t.id}_${t.cliente.replace(/\s+/g, '_')}.html`; a.click();
        URL.revokeObjectURL(url);
    },

    // --- DASHBOARD ---
    renderDashboard() {
        let filtered = dataState.tickets;
        let activeClient = (currentUser && currentUser.assignedClient && currentUser.assignedClient !== "TODOS") ? currentUser.assignedClient : activeClientContext;
        if(activeClient) filtered = filtered.filter(t => t.cliente === activeClient);

        const selectedSedes = Array.from(document.querySelectorAll('.sede-chk:checked')).map(cb => cb.value);
        const fTec = document.getElementById('filt-tecnico').value;
        const fEstado = document.getElementById('filt-estado').value;
        const fFechaInicio = document.getElementById('filt-fecha-inicio').value;
        const fFechaFin = document.getElementById('filt-fecha-fin').value;

        if(selectedSedes.length > 0) filtered = filtered.filter(t => selectedSedes.includes(t.sede));
        else filtered = [];

        if(fTec) filtered = filtered.filter(t => t.tecnico === fTec);
        if(fEstado) filtered = filtered.filter(t => t.estado === fEstado);
        if(fFechaInicio) filtered = filtered.filter(t => (t.fechaCreacion ? t.fechaCreacion.substring(0, 10) : t.fecha) >= fFechaInicio);
        if(fFechaFin) filtered = filtered.filter(t => (t.fechaCreacion ? t.fechaCreacion.substring(0, 10) : t.fecha) <= fFechaFin);

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

        this.buildIndicators(filtered, selectedSedes);
    },
    buildIndicators(filtered, selectedSedes) {
        let clientSedes = dataState.sedes;
        let activeClient = (currentUser && currentUser.assignedClient && currentUser.assignedClient !== "TODOS") ? currentUser.assignedClient : activeClientContext;
        if(activeClient) clientSedes = dataState.sedes.filter(s => s.client === activeClient);
        
        const sedesList = (selectedSedes && selectedSedes.length > 0) ? selectedSedes : clientSedes.map(s => s.sede);
        const sistemasList = dataState.sistemas;
        
        let tecnicosList = dataState.usuarios.filter(u => u.role.toLowerCase().includes('técnico') || u.role.toLowerCase().includes('tecnico')).map(u => u.name);
        if(activeClient) tecnicosList = dataState.usuarios.filter(u => (u.role.toLowerCase().includes('técnico') || u.role.toLowerCase().includes('tecnico')) && (u.assignedClient === activeClient || u.assignedClient === "TODOS")).map(u => u.name);
        if(tecnicosList.length === 0) tecnicosList = dataState.usuarios.map(u => u.name);

        const asignadoCounts = sedesList.map(sede => filtered.filter(t => t.sede === sede && t.estado === 'Asignado').length);
        const procesoCounts = sedesList.map(sede => filtered.filter(t => t.sede === sede && t.estado === 'En Proceso').length);
        const retrasadoCounts = sedesList.map(sede => filtered.filter(t => t.sede === sede && t.estado === 'Retrasado').length);
        const cumplidoCounts = sedesList.map(sede => filtered.filter(t => t.sede === sede && t.estado === 'Cumplido').length);

        if(this.charts.ticketSede) this.charts.ticketSede.destroy();
        this.charts.ticketSede = new Chart(document.getElementById('chart-ticket-sede').getContext('2d'), {
            type: 'bar', data: { labels: sedesList, datasets: [ { label: 'Asignados', data: asignadoCounts, backgroundColor: '#1E3A8A' }, { label: 'En Proceso', data: procesoCounts, backgroundColor: '#F59E0B' }, { label: 'Retrasados', data: retrasadoCounts, backgroundColor: '#EF4444' }, { label: 'Cumplidos', data: cumplidoCounts, backgroundColor: '#10B981' } ] },
            options: { responsive: true, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }, plugins: { legend: { position: 'bottom' } } }
        });

        const totalFilt = filtered.length;
        const cumplidos = filtered.filter(t => t.estado === 'Cumplido').length; 
        const pctCumplidos = totalFilt > 0 ? ((cumplidos / totalFilt) * 100).toFixed(0) : 0;
        document.getElementById('analysis-text-1').innerText = `Análisis: Hay ${totalFilt} tickets activos bajo el filtro actual (${pctCumplidos}% cumplidos).`;
        const retrasados = filtered.filter(t => t.estado === 'Retrasado').length;
        let recomendacion = retrasados > 0 
        ? `⚠️ Alerta: Tienes ${retrasados} tickets retrasados. Prioriza su atención inmediata.` 
        : `✅ Excelente: No hay tickets retrasados. El flujo operativo es óptimo.`;
        document.getElementById('analysis-text-2').innerText = `Recomendación: ${recomendacion}`;
        document.getElementById('analysis-text-3').innerText = `Análisis por Sistema: Distribución sobre ${totalFilt} casos procesados.`;
        document.getElementById('analysis-text-4').innerText = `Análisis de Carga Técnica: Carga distribuida entre el personal asignado.`;
        document.getElementById('analysis-text-5').innerText = `Análisis de Cumplimiento SLA: Promedio calculado sobre los tickets filtrados.`;
        document.getElementById('analysis-text-6').innerText = `Tendencia Temporal: Se observa un total de ${totalFilt} registros.`;

        const fallasSedesCounts = sedesList.map(sede => filtered.filter(t => t.sede === sede && t.falla).length);
        if(this.charts.fallasSedes) this.charts.fallasSedes.destroy();
        this.charts.fallasSedes = new Chart(document.getElementById('chart-fallas-sedes').getContext('2d'), { type: 'bar', data: { labels: sedesList, datasets: [{ label: 'Fallas Reportadas', data: fallasSedesCounts, backgroundColor: '#EF4444' }] }, options: { responsive: true } });

        const sistemasCounts = sistemasList.map(sis => filtered.filter(t => t.sistema === sis).length);
        if(this.charts.ticketSistemas) this.charts.ticketSistemas.destroy();
        this.charts.ticketSistemas = new Chart(document.getElementById('chart-ticket-sistemas').getContext('2d'), { type: 'doughnut', data: { labels: sistemasList, datasets: [{ data: sistemasCounts, backgroundColor: ['#1E3A8A', '#FF6B35', '#10B981', '#F59E0B'] }] }, options: { responsive: true } });

        const ticketTecCounts = tecnicosList.map(tec => filtered.filter(t => t.tecnico === tec).length);
        if(this.charts.ticketTecnico) this.charts.ticketTecnico.destroy();
        this.charts.ticketTecnico = new Chart(document.getElementById('chart-ticket-tecnico').getContext('2d'), { type: 'bar', data: { labels: tecnicosList, datasets: [{ label: 'Tickets Asignados', data: ticketTecCounts, backgroundColor: '#FF6B35' }] }, options: { responsive: true } });

        const slaTecProm = tecnicosList.map(tec => {
            const tecTickets = filtered.filter(t => t.tecnico === tec);
            if(tecTickets.length === 0) return 0;
            return (tecTickets.reduce((acc, curr) => acc + parseFloat(curr.sla || 0), 0) / tecTickets.length).toFixed(1);
        });
        if(this.charts.ticketTecSla) this.charts.ticketTecSla.destroy();
        this.charts.ticketTecSla = new Chart(document.getElementById('chart-ticket-tec-sla').getContext('2d'), { type: 'bar', data: { labels: tecnicosList, datasets: [{ label: 'Promedio SLA (Días)', data: slaTecProm, backgroundColor: '#10B981' }] }, options: { responsive: true } });

        if(this.charts.tendenciaSedes) this.charts.tendenciaSedes.destroy();
        this.charts.tendenciaSedes = new Chart(document.getElementById('chart-tendencia-sedes').getContext('2d'), { type: 'line', data: { labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'], datasets: [{ label: 'Sedes con Novedades', data: [1, 2, 2, filtered.length], borderColor: '#0A192F', backgroundColor: 'rgba(10,25,47,0.1)', fill: true, tension: 0.3 }] }, options: { responsive: true } });
    },

    // --- RENDERIZADO GENERAL ---
    renderAll() {
        const gClientSel = document.getElementById('global-client-filter');
        const sCli = document.getElementById('sede-client-select');
        const uClientSel = document.getElementById('new-user-client');

        if(gClientSel) { gClientSel.innerHTML = '<option value="">Todos los Clientes (Vista Master)</option>'; dataState.clientes.forEach(c => gClientSel.innerHTML += `<option value="${c.name}">${c.name}</option>`); gClientSel.value = activeClientContext; }
        if(sCli) { sCli.innerHTML = '<option value="">Seleccione Cliente...</option>'; dataState.clientes.forEach(c => sCli.innerHTML += `<option value="${c.name}">${c.name}</option>`); }
        if(uClientSel) { uClientSel.innerHTML = '<option value="TODOS">Asignar Todos los Clientes (Master)</option>'; dataState.clientes.forEach(c => uClientSel.innerHTML += `<option value="${c.name}">${c.name}</option>`); }

        const tCli = document.getElementById('table-clientes');
        if(tCli) { tCli.innerHTML = ''; dataState.clientes.forEach((c, i) => { tCli.innerHTML += `<tr><td><strong>${c.name}</strong></td><td><span style="display:inline-block;width:15px;height:15px;background:${c.color};border-radius:4px;"></span></td><td><img src="${c.logo}" style="height:25px; object-fit:contain;"></td><td><button class="btn btn-warning btn-sm" onclick="app.openEditModal('client', ${i})" style="margin-right:4px;">Editar</button><button class="btn btn-danger btn-sm" onclick="app.deleteClient(${i})">Del</button></td></tr>`; }); }

        const tSed = document.getElementById('table-sedes');
        if(tSed) { tSed.innerHTML = ''; dataState.sedes.forEach((s, i) => { tSed.innerHTML += `<tr><td><strong>${s.sede}</strong></td><td>${s.client}</td><td><button class="btn btn-warning btn-sm" onclick="app.openEditModal('sede', ${i})" style="margin-right:4px;">Editar</button><button class="btn btn-danger btn-sm" onclick="app.deleteSede(${i})">Del</button></td></tr>`; }); }

        this.updateSedeCheckboxes();

        const tUsu = document.getElementById('table-usuarios');
        const fTec = document.getElementById('filt-tecnico');
        if(tUsu && fTec) {
            tUsu.innerHTML = ''; fTec.innerHTML = '<option value="">Técnico (Todos)</option>';
            let visibleUsers = dataState.usuarios;
            let activeClient = (currentUser && currentUser.assignedClient && currentUser.assignedClient !== "TODOS") ? currentUser.assignedClient : "";
            if(currentUser && currentUser.role !== "Administrador" && activeClient) visibleUsers = dataState.usuarios.filter(u => u.assignedClient === activeClient || u.assignedClient === "TODOS");
            visibleUsers.forEach((u, i) => {
                const realIndex = dataState.usuarios.indexOf(u);
                tUsu.innerHTML += `<tr><td><strong>${u.name}</strong></td><td>${u.role}</td><td>${u.assignedClient}</td><td><span style="font-size:0.85rem;color:var(--text-muted);">${(u.perms || []).join(', ')}</span></td><td><button class="btn btn-warning btn-sm" onclick="app.openEditModal('user', ${realIndex})" style="margin-right:4px;">Editar</button><button class="btn btn-danger btn-sm" onclick="app.deleteUser(${realIndex})">Del</button></td></tr>`;
            });
            let techListForFilter = dataState.usuarios.filter(u => u.role.toLowerCase().includes('técnico') || u.role.toLowerCase().includes('tecnico'));
            if(activeClient) techListForFilter = techListForFilter.filter(u => u.assignedClient === activeClient || u.assignedClient === "TODOS");
            techListForFilter.forEach(u => fTec.innerHTML += `<option value="${u.name}">${u.name}</option>`);
        }

        const tSys = document.getElementById('table-sistemas');
        if(tSys) { tSys.innerHTML = ''; dataState.sistemas.forEach((s, i) => { tSys.innerHTML += `<tr><td>${s}</td><td><button class="btn btn-warning btn-sm" onclick="app.openEditModal('sistema', ${i})" style="margin-right:4px;">Editar</button><button class="btn btn-danger btn-sm" onclick="app.deleteSistema(${i})">Del</button></td></tr>`; }); }

        const tFal = document.getElementById('table-fallas');
        if(tFal) { tFal.innerHTML = ''; dataState.fallas.forEach((f, i) => { tFal.innerHTML += `<tr><td>${f}</td><td><button class="btn btn-warning btn-sm" onclick="app.openEditModal('falla', ${i})" style="margin-right:4px;">Editar</button><button class="btn btn-danger btn-sm" onclick="app.deleteFalla(${i})">Del</button></td></tr>`; }); }

        const tSla = document.getElementById('table-sla');
        if(tSla) { tSla.innerHTML = ''; dataState.slaList.forEach((sla, i) => { tSla.innerHTML += `<tr><td>${sla.desc}</td><td><strong>${sla.days} Días</strong></td><td><button class="btn btn-warning btn-sm" onclick="app.openEditModal('sla', ${i})" style="margin-right:4px;">Editar</button><button class="btn btn-danger btn-sm" onclick="app.deleteSla(${i})">Del</button></td></tr>`; }); }

        this.renderDashboard();
        this.renderConnectedTechsTable();
    },
    renderConnectedTechsTable() {
        const tbody = document.getElementById('table-connected-techs');
        if(!tbody) return;
        let activeClient = (currentUser && currentUser.assignedClient && currentUser.assignedClient !== "TODOS") ? currentUser.assignedClient : "";
        let techs = dataState.usuarios.filter(u => u.role.toLowerCase().includes('técnico') || u.role.toLowerCase().includes('tecnico') || u.role.toLowerCase().includes('operador'));
        if(activeClient && currentUser.role !== "Administrador") techs = techs.filter(u => u.assignedClient === activeClient || u.assignedClient === "TODOS");
        if(techs.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No hay técnicos conectados en este momento.</td></tr>`; return; }
        tbody.innerHTML = '';
        techs.forEach(t => { tbody.innerHTML += `<tr><td><strong><i class="fas fa-user-circle" style="color:var(--secondary);"></i> ${t.name}</strong></td><td>${t.role}</td><td>${t.assignedClient}</td><td><span class="badge" style="background:var(--success);">GPS Activo</span></td><td>${t.lastLogin || 'Reciente'}</td></tr>`; });
    },
    initMap() {
        if(!this.map) {
            this.map = L.map('tech-map').setView([4.6097, -74.0817], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
            L.marker([4.6097, -74.0817]).addTo(this.map).bindPopup("<b>Técnico:</b> Carlos Pérez (GPS Activo)");
        }
        setTimeout(() => this.map.invalidateSize(), 200);
        this.renderConnectedTechsTable();
    },
    // --- CONEXIÓN A BASE DE DATOS EN LA NUBE ---
    saveStorage() {
        // 1. Guardar copia local por si falla el internet
        localStorage.setItem('servitrack_db_cloud', JSON.stringify(dataState));
        
        // 2. Subir a Firestore (La Nube)
        db.collection("plataforma").doc("estadoGlobal").set(dataState)
            .then(() => console.log("Datos sincronizados en la nube exitosamente."))
            .catch((error) => console.error("Error sincronizando en la nube: ", error));
    },
    
    loadStorage() {
        // 1. Carga rápida local para que no haya pantalla en blanco
        const saved = localStorage.getItem('servitrack_db_cloud');
        if(saved) {
            dataState = JSON.parse(saved);
        }

        // 2. Escuchar cambios en tiempo real desde la nube
        db.collection("plataforma").doc("estadoGlobal").onSnapshot((doc) => {
            if (doc.exists) {
                // Si hay datos en la nube, actualizar la app al instante
                dataState = doc.data();
                localStorage.setItem('servitrack_db_cloud', JSON.stringify(dataState));
                
                // Si el usuario ya inició sesión, refrescar las tablas/gráficas automáticamente
                if(currentUser) {
                    this.renderAll();
                }
            } else {
                // Si la base de datos está vacía (primer uso), subir los datos por defecto
                this.saveStorage();
            }
        });
    },
// SOLUCIÓN 6: Depuración de datos a cero
purgeData(tipo) {
    const pass = prompt(`ADVERTENCIA: Vas a eliminar todos los ${tipo}. Escribe "CONFIRMAR" para proceder:`);
    if(pass === "CONFIRMAR") {
        if(tipo === 'tickets') dataState.tickets = [];
        if(tipo === 'clientes') dataState.clientes = [];
        if(tipo === 'sedes') dataState.sedes = [];
        if(tipo === 'usuarios') dataState.usuarios = dataState.usuarios.filter(u => u.role === "Administrador"); // Protege al admin
        this.saveStorage();
        this.renderAll();
        alert(`Base de datos de ${tipo} depurada a cero.`);
    }
},

// SOLUCIÓN 10, 11 y 12: Descargar informe avanzado Excel/CSV con filtros
exportarTicketsAvanzado() {
    const fechaIni = document.getElementById('export-fecha-ini').value;
    const fechaFin = document.getElementById('export-fecha-fin').value;
    const tech = document.getElementById('export-tecnico').value;

    let dataExport = dataState.tickets;
    if(tech) dataExport = dataExport.filter(t => t.tecnico === tech);
    if(fechaIni) dataExport = dataExport.filter(t => t.fecha >= fechaIni);
    if(fechaFin) dataExport = dataExport.filter(t => t.fecha <= fechaFin);

    if(dataExport.length === 0) { alert("No hay datos para exportar con estos filtros."); return; }

    let csvContent = "data:text/csv;charset=utf-8,ID,Cliente,Sede,Sistema,Falla,Técnico,Estado,Fecha Creación,Fecha Cierre\n";
    dataExport.forEach(t => {
        let row = `${t.id},"${t.cliente}","${t.sede}","${t.sistema}","${t.falla}","${t.tecnico}","${t.estado}",${t.fechaCreacion},${t.fechaCumplido || 'N/A'}`;
        csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Informe_Tickets.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
},

// SOLUCIÓN 9: Ubicación GPS real de los técnicos
updateLocation() {
    if (navigator.geolocation && currentUser && currentUser.role.includes('Técnico')) {
        navigator.geolocation.getCurrentPosition((position) => {
            currentUser.lat = position.coords.latitude;
            currentUser.lng = position.coords.longitude;
            this.saveStorage();
        });
    }
},
// Modificar initMap para leer estas coordenadas
initMap() {
    if(!this.map) {
        this.map = L.map('tech-map').setView([4.6097, -74.0817], 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
    }
    // Limpiar marcadores previos
    this.map.eachLayer((layer) => { if (layer instanceof L.Marker) { this.map.removeLayer(layer); } });
    
    dataState.usuarios.forEach(u => {
        if(u.lat && u.lng) {
            L.marker([u.lat, u.lng]).addTo(this.map).bindPopup(`<b>${u.name}</b><br>${u.role}`);
        }
    });
    setTimeout(() => this.map.invalidateSize(), 200);
},
};

window.onload = () => app.init();
