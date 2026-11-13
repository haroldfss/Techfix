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
      document.addEventListener('click', (e) => {
    const sb = document.getElementById('sidebar');
    const hamburgerBtn = document.querySelector('.fa-bars') || document.querySelector('.menu-toggle');
    if (window.innerWidth <= 900 && sb && sb.classList.contains('mobile-open')) {
        if (!sb.contains(e.target) && (!hamburgerBtn || !hamburgerBtn.contains(e.target))) {
            sb.classList.remove('mobile-open');
        }
    }
});
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
        
        let targetSedes = dataState.sedes;
        let activeClient = (currentUser && currentUser.assignedClient && currentUser.assignedClient !== "TODOS") ? currentUser.assignedClient : activeClientContext;
        
        if(activeClient) targetSedes = dataState.sedes.filter(s => s.client === activeClient);
        
        if(targetSedes.length === 0) {
            container.innerHTML = '<span style="font-size:0.85rem; color:var(--text-muted); padding:4px;">No hay sedes disponibles</span>';
            return;
        }

        // Botón "Marcar Todas" dinámico para todos los roles
        let htmlContent = `<div style="margin-bottom:8px;"><button class="btn btn-sm btn-outline" style="width:100%; border-color:var(--secondary); color:var(--secondary);" onclick="document.querySelectorAll('.sede-chk').forEach(cb => cb.checked = true); app.renderDashboard();">☑️ Seleccionar Todas las Sedes</button></div>`;
        
        targetSedes.forEach(s => {
            htmlContent += `<label style="display:block; margin-bottom:5px;"><input type="checkbox" value="${s.sede}" class="sede-chk" checked onchange="app.renderDashboard()"> ${s.sede}</label>`;
        });
        
        container.innerHTML = htmlContent;
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
    const sb = document.getElementById('sidebar');
    if(sb) sb.classList.remove('mobile-open');
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
        const clientEl = document.getElementById('sistema-client');
        const client = clientEl ? clientEl.value : 'GLOBAL';
        const name = document.getElementById('new-sistema-name').value;
        dataState.sistemas.push({ client, name });
        this.saveStorage(); e.target.reset(); this.renderAll();
    },
    addFalla(e) {
        e.preventDefault();
        const clientEl = document.getElementById('falla-client');
        const client = clientEl ? clientEl.value : 'GLOBAL';
        const name = document.getElementById('new-falla-name').value;
        dataState.fallas.push({ client, name });
        this.saveStorage(); e.target.reset(); this.renderAll();
    },
    addSla(e) {
        e.preventDefault();
        const clientEl = document.getElementById('sla-client');
        const client = clientEl ? clientEl.value : 'GLOBAL';
        const desc = document.getElementById('new-sla-desc').value;
        const days = document.getElementById('new-sla-days').value;
        dataState.slaList.push({ client, desc, days });
        this.saveStorage(); e.target.reset(); this.renderAll();
    },
    deleteSistema(idx) {
        dataState.sistemas.splice(idx, 1);
        this.saveStorage();
        this.renderAll();
    },
    addFalla(e) {
        e.preventDefault();
        const client = document.getElementById('falla-client').value;
        const name = document.getElementById('new-falla-name').value;
        dataState.fallas.push({ client, name });
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
        const client = document.getElementById('sla-client').value;
        const desc = document.getElementById('new-sla-desc').value;
        const days = document.getElementById('new-sla-days').value;
        dataState.slaList.push({ client, desc, days });
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
    const g3 = document.getElementById('edit-group-3');
    const gPerms = document.getElementById('edit-group-perms');
    
    if(g2) g2.style.display = 'block';
    if(g3) g3.style.display = 'none';
    if(gPerms) gPerms.style.display = 'none';

    if(type === 'client') {
        document.getElementById('modal-edit-title').innerText = "Editar Cliente, Logo y Color";
        document.getElementById('edit-label-1').innerText = "Nombre del Cliente";
        document.getElementById('edit-value-1').value = dataState.clientes[idx].name || '';
        document.getElementById('edit-label-2').innerText = "URL del Logotipo";
        document.getElementById('edit-value-2').value = dataState.clientes[idx].logo || '';
        if(g3) {
            g3.style.display = 'block';
            document.getElementById('edit-value-3').value = dataState.clientes[idx].color || '#1E3A8A';
        }
    } else if(type === 'sede') {
        document.getElementById('modal-edit-title').innerText = "Editar Sede";
        document.getElementById('edit-label-1').innerText = "Nombre de la Sede";
        document.getElementById('edit-value-1').value = dataState.sedes[idx].sede || '';
        if(g2) g2.style.display = 'none';
    } else if(type === 'user') {
        document.getElementById('modal-edit-title').innerText = "Editar Usuario y Privilegios";
        document.getElementById('edit-label-1').innerText = "Nombre de Usuario";
        document.getElementById('edit-value-1').value = dataState.usuarios[idx].name || '';
        document.getElementById('edit-label-2').innerText = "Contraseña";
        document.getElementById('edit-value-2').value = dataState.usuarios[idx].pass || '';
        if(gPerms) gPerms.style.display = 'block';
        const userPerms = dataState.usuarios[idx].perms || [];
        document.querySelectorAll('.edit-perm-cb').forEach(cb => cb.checked = userPerms.includes(cb.value));
    } else if(type === 'sistema') {
        document.getElementById('modal-edit-title').innerText = "Editar Sistema";
        document.getElementById('edit-label-1').innerText = "Nombre del Sistema";
        document.getElementById('edit-value-1').value = dataState.sistemas[idx] || '';
        if(g2) g2.style.display = 'none';
    } else if(type === 'falla') {
        document.getElementById('modal-edit-title').innerText = "Editar Falla";
        document.getElementById('edit-label-1').innerText = "Descripción de la Falla";
        document.getElementById('edit-value-1').value = dataState.fallas[idx] || '';
        if(g2) g2.style.display = 'none';
    } else if(type === 'sla') {
        document.getElementById('modal-edit-title').innerText = "Editar SLA";
        document.getElementById('edit-label-1').innerText = "Descripción SLA";
        document.getElementById('edit-value-1').value = dataState.slaList[idx].desc || '';
        document.getElementById('edit-label-2').innerText = "Días Meta";
        document.getElementById('edit-value-2').value = dataState.slaList[idx].days || '';
    }
    
    const modal = document.getElementById('modal-edit');
    if(modal) modal.style.display = 'flex';
},
saveEdit(e) {
    e.preventDefault();
    const type = document.getElementById('edit-type').value;
    const idx = parseInt(document.getElementById('edit-index').value);
    const v1 = document.getElementById('edit-value-1') ? document.getElementById('edit-value-1').value : '';
    const v2 = document.getElementById('edit-value-2') ? document.getElementById('edit-value-2').value : '';
    const v3 = document.getElementById('edit-value-3') ? document.getElementById('edit-value-3').value : '';

    if(type === 'client') { 
        dataState.clientes[idx].name = v1; 
        dataState.clientes[idx].logo = v2; 
        if(v3) dataState.clientes[idx].color = v3; 
    }
    else if(type === 'sede') { 
        dataState.sedes[idx].sede = v1; 
    }
    else if(type === 'user') { 
        dataState.usuarios[idx].name = v1; 
        dataState.usuarios[idx].pass = v2; 
        dataState.usuarios[idx].perms = Array.from(document.querySelectorAll('.edit-perm-cb:checked')).map(cb => cb.value);
    }
    else if(type === 'sistema') { 
        dataState.sistemas[idx] = v1; 
    }
    else if(type === 'falla') { 
        dataState.fallas[idx] = v1; 
    }
    else if(type === 'sla') { 
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
        let selectedClient = clientEl.value;

        // Cargar Sistemas filtrados por cliente o globales
        const sisEl = document.getElementById('ticket-sistema');
        if(sisEl) {
            sisEl.innerHTML = ''; 
            dataState.sistemas.forEach(s => {
                const sName = typeof s === 'object' ? s.name : s;
                const sClient = typeof s === 'object' ? (s.client || 'GLOBAL') : 'GLOBAL';
                if(sClient === 'GLOBAL' || sClient === selectedClient) {
                    sisEl.innerHTML += `<option value="${sName}">${sName}</option>`;
                }
            });
        }

        // Cargar Fallas filtradas por cliente o globales
        const fallaEl = document.getElementById('ticket-falla');
        if(fallaEl) {
            fallaEl.innerHTML = ''; 
            dataState.fallas.forEach(f => {
                const fName = typeof f === 'object' ? f.name : f;
                const fClient = typeof f === 'object' ? (f.client || 'GLOBAL') : 'GLOBAL';
                if(fClient === 'GLOBAL' || fClient === selectedClient) {
                    fallaEl.innerHTML += `<option value="${fName}">${fName}</option>`;
                }
            });
        }

        // Cargar SLAs filtrados por cliente o globales
        const slaEl = document.getElementById('ticket-sla');
        if(slaEl) {
            slaEl.innerHTML = ''; 
            dataState.slaList.forEach(sla => {
                const slaClient = sla.client || 'GLOBAL';
                if(slaClient === 'GLOBAL' || slaClient === selectedClient) {
                    slaEl.innerHTML += `<option value="${sla.days}">${sla.desc} (${sla.days} Días)</option>`;
                }
            });
        }

        this.loadSedesForClient();
    },
    loadSedesForClient() {
        const clientEl = document.getElementById('ticket-cliente');
        let client = clientEl ? clientEl.value : "";
        const sedeEl = document.getElementById('ticket-sede');
        if(!sedeEl) return;
        
        sedeEl.innerHTML = '';
        // Filtrar sedes del cliente
        const sedesFiltradas = dataState.sedes.filter(s => s.client === client || !s.client);
        if (sedesFiltradas.length === 0) {
            sedeEl.innerHTML = `<option value="">No hay sedes (Agregue en Ajustes)</option>`;
        } else {
            sedesFiltradas.forEach(s => {
                sedeEl.innerHTML += `<option value="${s.sede}">${s.sede}</option>`;
            });
        }
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
    if(!ticket) { alert("Ticket no encontrado."); return; }
    
    // Limpiar campos del modal
    document.getElementById('cierre-actividades').value = ticket.actividades || '';
    document.getElementById('cierre-materiales').value = ticket.materiales || '';
    document.getElementById('cierre-recomendaciones').value = ticket.recomendaciones || '';
    const fileInput = document.getElementById('cierre-fotos');
    if(fileInput) fileInput.value = '';

    document.getElementById('modal-ticket-id').innerText = id;
    document.getElementById('modal-cierre').style.display = 'flex';
},

submitCierre(e) {
        e.preventDefault();
        const id = document.getElementById('modal-ticket-id').innerText;
        const ticket = dataState.tickets.find(t => t.id === id);
        const correo = document.getElementById('cierre-correo').value;
        const inputFiles = document.getElementById('cierre-fotos');
        
        if (!ticket || ticket.estado === 'Cumplido') { alert("Ticket inválido o ya cerrado."); return; }

        ticket.estado = 'Cumplido';
        ticket.fechaCumplido = new Date().toISOString().substring(0, 16);
        ticket.actividades = document.getElementById('cierre-actividades').value;
        ticket.materiales = document.getElementById('cierre-materiales').value;
        ticket.recomendaciones = document.getElementById('cierre-recomendaciones').value;
        ticket.fotos = [];

        if (inputFiles && inputFiles.files.length > 0) {
            let filesLoaded = 0;
            Array.from(inputFiles.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const scale = 500 / img.width;
                        canvas.width = 500; canvas.height = img.height * scale;
                        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                        ticket.fotos.push(canvas.toDataURL('image/jpeg', 0.5));
                        filesLoaded++;
                        if (filesLoaded === inputFiles.files.length) this.finalizarCierreProceso(ticket, correo);
                    };
                    img.onerror = () => { filesLoaded++; if(filesLoaded === inputFiles.files.length) this.finalizarCierreProceso(ticket, correo); };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        } else {
            this.finalizarCierreProceso(ticket, correo);
        }
    },
    finalizarCierreProceso(ticket, correo) {
        this.saveStorage();
        document.getElementById('modal-cierre').style.display = 'none';
        this.downloadSingleTicketPDF(ticket.id); // Descarga el PDF con las fotos insertadas
        window.location.href = `mailto:${correo}?subject=Cierre Ticket ${ticket.id}&body=Ticket cerrado exitosamente. Adjunte el PDF descargado.`;
        alert("¡Ticket cerrado y guardado exitosamente!");
        this.renderAll();
    },
    finalizarCierreProceso(ticket, correoCliente) {
        this.saveStorage();
        const modal = document.getElementById('modal-cierre');
        if(modal) modal.style.display = 'none';
        
        this.downloadSingleTicketPDF(ticket.id);
        
        const asunto = encodeURIComponent(`Informe de Cumplimiento - Ticket ${ticket.id}`);
        const cuerpo = encodeURIComponent(`Hola,\n\nSe ha completado satisfactoriamente el servicio del ticket ${ticket.id} (${ticket.sede}).\n\n- Actividades: ${ticket.actividades}\n- Materiales: ${ticket.materiales}\n\nPor favor adjunte el archivo PDF descargado.\n\nAtentamente,\nSoporte Técnico ServiTrack`);
        
        window.location.href = `mailto:${correoCliente}?subject=${asunto}&body=${cuerpo}`;
        alert(`¡Ticket ${ticket.id} cerrado con éxito! Informe generado con fotos y correo preparado.`);
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
        
        let fotosHtml = '';
        if (t.fotos && t.fotos.length > 0) {
            fotosHtml = '<h3>4. Evidencia Fotográfica</h3><div style="display:flex; flex-wrap:wrap; gap:15px; margin-top: 10px;">';
            t.fotos.forEach((f, idx) => {
                fotosHtml += `<div style="border:1px solid #CBD5E1; padding:8px; border-radius:6px; background:#fff;"><img src="${f}" style="max-height:220px; max-width:280px; object-fit:contain; display:block;" /><p style="font-size:12px; font-weight:bold; text-align:center; margin:8px 0 0 0; color:#1E3A8A;">Foto #${idx + 1}</p></div>`;
            });
            fotosHtml += '</div>';
        }

        const htmlContent = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Informe Ticket ${t.id}</title><style>body { font-family: Arial, sans-serif; padding: 30px; color: #1E293B; } .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1E3A8A; padding-bottom: 15px; margin-bottom: 20px; } .logo { max-height: 55px; max-width: 180px; object-fit: contain; } h1 { font-size: 22px; color: #1E3A8A; margin: 0; } .info-box { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 15px; border-radius: 8px; margin-bottom: 15px; } .info-box h3 { margin-top: 0; color: #0A192F; font-size: 16px; border-bottom: 1px solid #CBD5E1; padding-bottom: 6px; } p { margin: 8px 0; font-size: 14px; } .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 10px; }</style></head><body><div class="header"><div><h1>CERTIFICADO DE CUMPLIMIENTO</h1><p style="margin-top:4px;">Plataforma ServiTrack PWA</p></div><div>${clientObj.logo ? `<img src="${clientObj.logo}" class="logo" alt="Logo Cliente">` : `<strong>${t.cliente}</strong>`}</div></div><div class="info-box"><h3>1. Información General</h3><p><strong>ID del Ticket:</strong> ${t.id}</p><p><strong>Cliente / Empresa:</strong> ${t.cliente}</p><p><strong>Sede Operativa:</strong> ${t.sede}</p><p><strong>Sistema Afectado:</strong> ${t.sistema}</p><p><strong>Tipo de Falla:</strong> ${t.falla}</p></div><div class="info-box"><h3>2. Control de Tiempos y Personal</h3><p><strong>Técnico Asignado:</strong> ${t.tecnico}</p><p><strong>Estado Actual:</strong> <span style="color: #10B981; font-weight: bold;">${t.estado}</span></p><p><strong>SLA Pactado:</strong> ${t.sla} Días</p><p><strong>Fecha de Creación:</strong> ${t.fechaCreacion || t.fecha}</p><p><strong>Fecha de Cierre:</strong> ${t.fechaCumplido || 'N/A'}</p><p><strong>Tiempo Total de Resolución:</strong> ${this.calcularTiempoResolucion(t)}</p></div><div class="info-box"><h3>3. Detalle de Atención en Campo</h3><p><strong>Actividades Realizadas:</strong><br>${t.actividades || 'Sin registro'}</p><p style="margin-top: 12px;"><strong>Repuestos y Materiales:</strong><br>${t.materiales || 'Ninguno'}</p><p style="margin-top: 12px;"><strong>Recomendaciones para el Cliente:</strong><br>${t.recomendaciones || 'Ninguna'}</p></div>${fotosHtml ? `<div class="info-box">${fotosHtml}</div>` : ''}<div class="footer"><p>Documento generado electrónicamente por ServiTrack PWA - Control Multi-Cliente</p></div></body></html>`;
        
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
                
        document.getElementById('analysis-text-1').innerText = `Análisis: Hay ${totalFilt} tickets activos (${pctCumplidos}% de efectividad de cumplimiento).`;
        
        const retrasados = filtered.filter(t => t.estado === 'Retrasado').length;
        document.getElementById('analysis-text-2').innerText = retrasados > 0 
            ? `⚠️ Alerta: Tienes ${retrasados} tickets retrasados. Prioriza su atención operativa inmediata.` 
            : `✅ Excelente: No hay tickets retrasados. El flujo de servicio es óptimo.`;

        const fallasPorSis = sistemasList.map(sis => ({sis, count: filtered.filter(t => t.sistema === sis).length})).sort((a,b)=>b.count-a.count);
        document.getElementById('analysis-text-3').innerText = (fallasPorSis[0] && fallasPorSis[0].count > 0)
            ? `🛠️ Mantenimiento: "${fallasPorSis[0].sis}" presenta la mayor carga de fallas (${fallasPorSis[0].count} casos).` 
            : `Distribución de sistemas estable.`;

        document.getElementById('analysis-text-4').innerText = `Carga Técnica: Revisa la gráfica de barras para balancear asignaciones si un técnico supera significativamente al resto.`;
        
        const avgSla = filtered.length > 0 ? (filtered.reduce((suma, t) => suma + parseFloat(t.sla || 0), 0) / filtered.length).toFixed(1) : 0;
        document.getElementById('analysis-text-5').innerText = `Cumplimiento SLA: El tiempo promedio proyectado de resolución general es de ${avgSla} días.`;
        
        document.getElementById('analysis-text-6').innerText = `Tendencia: Histórico de ${totalFilt} registros. Vigila variaciones bruscas en la curva.`;
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
        // 1. Rellenar TODOS los selectores de clientes sin duplicar
        const selectoresConfig = [
            { id: 'ticket-cliente', defaultText: 'Todos los Clientes (Vista Master)' },
            { id: 'sede-client', defaultText: 'Seleccione Cliente...' },
            { id: 'user-client', defaultText: 'Asignar Todos los Clientes (Master)' },
            { id: 'sistema-client', defaultText: '🌐 Todos los Clientes' },
            { id: 'falla-client', defaultText: '🌐 Todos los Clientes' },
            { id: 'sla-client', defaultText: '🌐 Todos los Clientes' },
            { id: 'purge-client-select', defaultText: '⚠️ TODOS LOS TICKETS' }
        ];

        selectoresConfig.forEach(config => {
            const el = document.getElementById(config.id);
            if (el) {
                const currentVal = el.value;
                // Formateamos el valor por defecto dependiendo del select
                const defaultVal = config.id === 'purge-client-select' ? 'TODOS' : (config.id.includes('sistema') || config.id.includes('falla') || config.id.includes('sla') ? 'GLOBAL' : (config.id === 'sede-client' ? '' : 'TODOS'));
                
                // LIMPIEZA ABSOLUTA y opción por defecto
                el.innerHTML = `<option value="${defaultVal}">${config.defaultText}</option>`;
                
                // Inyectar clientes actualizados
                dataState.clientes.forEach(c => {
                    el.innerHTML += `<option value="${c.name}">${c.name}</option>`;
                });
                
                // Mantener la selección previa si existía
                if (currentVal) el.value = currentVal;
            }
        });
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
        // Validar nuevo privilegio
        if (!currentUser.perms.includes("Borrar Datos") && currentUser.role !== "Administrador") {
            alert("No tienes el privilegio 'Borrar Datos' asignado a tu usuario.");
            return;
        }

        const confirmacion = prompt(`ADVERTENCIA: Vas a eliminar ${tipo}. Escribe "CONFIRMAR":`);
        if (confirmacion === "CONFIRMAR") {
            if (tipo === 'tickets') {
                const clienteBorrar = document.getElementById('purge-client-select').value;
                if (clienteBorrar === "TODOS") {
                    dataState.tickets = [];
                    alert("Todos los tickets de la base de datos han sido borrados.");
                } else {
                    const inicial = dataState.tickets.length;
                    dataState.tickets = dataState.tickets.filter(t => t.cliente !== clienteBorrar);
                    alert(`Se eliminaron ${inicial - dataState.tickets.length} tickets de ${clienteBorrar}.`);
                }
            } else if (tipo === 'clientes') {
                dataState.clientes = []; dataState.sedes = [];
                alert("Todos los clientes y sedes han sido borrados.");
            }
            this.saveStorage();
            this.renderAll();
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
        if (navigator.geolocation && currentUser) {
            navigator.geolocation.getCurrentPosition(pos => {
                const userIndex = dataState.usuarios.findIndex(u => u.name === currentUser.name);
                if (userIndex !== -1) {
                    dataState.usuarios[userIndex].lat = pos.coords.latitude;
                    dataState.usuarios[userIndex].lng = pos.coords.longitude;
                    this.saveStorage();
                }
            });
                () => console.log("Permiso GPS denegado."));
        },
  // Llenar tabla de usuarios conectados
        const tOnline = document.getElementById('table-online-users');
        if (tOnline) {
            tOnline.innerHTML = '';
            dataState.usuarios.forEach(u => {
                const isOnline = u.lat && u.lng ? '<span style="color:#10B981;">🟢 Conectado GPS</span>' : '<span style="color:#EF4444;">🔴 Sin GPS</span>';
                const lastLog = u.lastLogin ? u.lastLogin : 'Nunca';
                const uClient = u.assignedClient || 'TODOS';
                tOnline.innerHTML += `<tr>
                    <td><strong>${u.name}</strong></td>
                    <td>${u.role}</td>
                    <td>${uClient}</td>
                    <td>${isOnline}</td>
                    <td>${lastLog}</td>
                </tr>`;
            });
        }
    },
    initMap() {
        if (!this.map) {
            this.map = L.map('tech-map').setView([4.6097, -74.0817], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
        }
        // Limpiar pines antiguos
        this.map.eachLayer(layer => { if (layer instanceof L.Marker) this.map.removeLayer(layer); });
        
        // Dibujar todos los usuarios logeados con coordenadas
        dataState.usuarios.forEach(u => {
            if (u.lat && u.lng) {
                L.marker([u.lat, u.lng]).addTo(this.map)
                 .bindPopup(`<b>${u.name}</b><br>Rol: ${u.role}<br>Última conexión: ${u.lastLogin || 'Reciente'}`);
            }
        });
        setTimeout(() => this.map.invalidateSize(), 400); // Fuerza ajuste responsive
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
