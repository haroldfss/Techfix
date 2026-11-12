let dataState = {
    tickets: [],
    clientes: [
        { name: "Banco de Bogotá", color: "#1E3A8A" },
        { name: "Centro Comercial Andino", color: "#FF6B35" }
    ],
    sedes: [
        { client: "Banco de Bogotá", sede: "Sede Principal Calle 72" },
        { client: "Centro Comercial Andino", sede: "Torre Administrativa" }
    ],
    usuarios: [
        { name: "Carlos Pérez", role: "Técnico Especialista", perms: ["Atender/Cerrar Tickets", "Ver Geolocalización"] },
        { name: "Oscar Muñoz", role: "Operador SLA", perms: ["Crear Tickets", "Ver Dashboard"] }
    ],
    sistemas: ["CCTV IP Dahua", "Intrusión AX PRO", "Control de Acceso Biométrico"],
    fallas: ["Pérdida de Enlace Video", "Batería Baja Panel", "Falla Lector Biométrico"],
    slaList: [
        { desc: "Crítico - Urgente", days: 1 },
        { desc: "Estándar Operativo", days: 3 }
    ]
};

const app = {
    charts: { tend: null, sist: null },
    map: null,
    init() {
        this.loadStorage();
        this.renderAll();
    },
    login(e) {
        e.preventDefault();
        const user = document.getElementById('login-user').value.trim();
        const pass = document.getElementById('login-pass').value.trim();
        if(user === "admin" && pass === "admin") {
            document.getElementById('login-view').classList.remove('active');
            document.getElementById('app-view').classList.add('active');
            this.navigateTo('dashboard');
        } else {
            alert("Credenciales incorrectas. Use: admin / admin");
        }
    },
    logout() {
        document.getElementById('app-view').classList.remove('active');
        document.getElementById('login-view').classList.add('active');
    },
    navigateTo(section) {
        // Ocultar todas las secciones y mostrar la seleccionada
        const sections = ['dashboard', 'tickets', 'create-ticket', 'map', 'settings'];
        sections.forEach(s => {
            const el = document.getElementById(`view-${s}`);
            if(el) el.style.display = 'none';
        });

        const target = document.getElementById(`view-${section}`);
        if(target) target.style.display = 'block';

        // Actualizar clase activa en el menú lateral
        document.querySelectorAll('.sidebar .nav-links li').forEach(li => li.classList.remove('active'));
        const menuLi = document.getElementById(`menu-${section}`);
        if(menuLi) menuLi.classList.add('active');

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
    },

    // --- CRUD CLIENTES & SEDES ---
    addClient(e) {
        e.preventDefault();
        const name = document.getElementById('new-client-name').value;
        const color = document.getElementById('new-client-color').value;
        dataState.clientes.push({ name, color });
        this.saveStorage();
        e.target.reset();
        this.renderAll();
        alert("Cliente registrado exitosamente.");
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
        alert("Sede agregada exitosamente.");
    },
    deleteSede(idx) {
        if(confirm("¿Desea eliminar esta sede?")) {
            dataState.sedes.splice(idx, 1);
            this.saveStorage();
            this.renderAll();
        }
    },

    // --- CRUD USUARIOS ---
    addUser(e) {
        e.preventDefault();
        const name = document.getElementById('new-user-name').value;
        const role = document.getElementById('new-role-name').value;
        const perms = Array.from(document.querySelectorAll('.perm-cb:checked')).map(cb => cb.value);
        dataState.usuarios.push({ name, role, perms });
        this.saveStorage();
        e.target.reset();
        document.querySelectorAll('.perm-cb').forEach(cb => cb.checked = false);
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

    // --- CRUD SISTEMAS & FALLAS & SLA ---
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

    // --- MODAL DE EDICIÓN ---
    openEditModal(type, idx) {
        document.getElementById('edit-type').value = type;
        document.getElementById('edit-index').value = idx;
        const g2 = document.getElementById('edit-group-2');
        g2.style.display = 'none';

        if(type === 'client') {
            document.getElementById('modal-edit-title').innerText = "Editar Cliente";
            document.getElementById('edit-value-1').value = dataState.clientes[idx].name;
            g2.style.display = 'block';
            document.getElementById('edit-value-2').value = dataState.clientes[idx].color;
        } else if(type === 'sede') {
            document.getElementById('modal-edit-title').innerText = "Editar Sede";
            document.getElementById('edit-value-1').value = dataState.sedes[idx].sede;
        } else if(type === 'user') {
            document.getElementById('modal-edit-title').innerText = "Editar Usuario y Rol";
            document.getElementById('edit-value-1').value = dataState.usuarios[idx].name;
            g2.style.display = 'block';
            document.getElementById('edit-value-2').value = dataState.usuarios[idx].role;
        } else if(type === 'sistema') {
            document.getElementById('modal-edit-title').innerText = "Editar Tipo de Sistema";
            document.getElementById('edit-value-1').value = dataState.sistemas[idx];
        } else if(type === 'falla') {
            document.getElementById('modal-edit-title').innerText = "Editar Tipo de Falla";
            document.getElementById('edit-value-1').value = dataState.fallas[idx];
        } else if(type === 'sla') {
            document.getElementById('modal-edit-title').innerText = "Editar SLA";
            document.getElementById('edit-value-1').value = dataState.slaList[idx].desc;
            g2.style.display = 'block';
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

        if(type === 'client') { dataState.clientes[idx].name = v1; dataState.clientes[idx].color = v2; }
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

    // --- TICKETS Y BÚSQUEDA ---
    loadTicketSelectors() {
        const clientEl = document.getElementById('ticket-cliente');
        clientEl.innerHTML = '';
        dataState.clientes.forEach(c => clientEl.innerHTML += `<option value="${c.name}">${c.name}</option>`);
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
        sedeEl.innerHTML = '';
        dataState.sedes.filter(s => s.client === client).forEach(s => {
            sedeEl.innerHTML += `<option value="${s.sede}">${s.sede}</option>`;
        });
    },
    filterClientDropdown() {
        const query = document.getElementById('search-client').value.toLowerCase();
        const select = document.getElementById('ticket-cliente');
        select.innerHTML = '';
        dataState.clientes.filter(c => c.name.toLowerCase().includes(query)).forEach(c => {
            select.innerHTML += `<option value="${c.name}">${c.name}</option>`;
        });
        this.loadSedesForClient();
    },
    filterSedeDropdown() {
        const query = document.getElementById('search-sede').value.toLowerCase();
        const client = document.getElementById('ticket-cliente').value;
        const select = document.getElementById('ticket-sede');
        select.innerHTML = '';
        dataState.sedes.filter(s => s.client === client && s.sede.toLowerCase().includes(query)).forEach(s => {
            select.innerHTML += `<option value="${s.sede}">${s.sede}</option>`;
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
        alert(`Ticket ${ticket.id} creado y asignado exitosamente.`);
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
        alert('Ticket cerrado con éxito. Informe PDF enviado por correo.');
        this.renderTicketsTable();
    },
    renderTicketsTable() {
        const tbody = document.getElementById('tickets-tbody');
        if(!tbody) return;
        if(dataState.tickets.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted);">No hay tickets registrados.</td></tr>`;
            return;
        }
        tbody.innerHTML = '';
        dataState.tickets.forEach(t => {
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
                <td><button class="btn btn-primary" style="padding:0.3rem 0.8rem; font-size:0.8rem;" onclick="app.abrirCierre('${t.id}')">Atender / Cerrar</button></td>
            </tr>`;
        });
    },

    // --- DASHBOARD & INSIGHTS ---
    renderDashboard() {
        const fMes = document.getElementById('filt-mes').value;
        const fCli = document.getElementById('filt-cliente').value;
        const fSed = document.getElementById('filt-sede').value;
        const fTec = document.getElementById('filt-tecnico').value;
        const fFal = document.getElementById('filt-falla').value;

        let filtered = dataState.tickets.filter(t => {
            if(fMes && t.fecha !== fMes) return false;
            if(fCli && t.cliente !== fCli) return false;
            if(fSed && t.sede !== fSed) return false;
            if(fTec && t.tecnico !== fTec) return false;
            if(fFal && t.falla !== fFal) return false;
            return true;
        });

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
        document.getElementById('kpi-tiempo').innerText = cumplidos > 0 ? "16.2h" : "0h";

        this.buildCharts(filtered);
    },
    buildCharts(filtered) {
        const ctxTend = document.getElementById('chart-tendencia').getContext('2d');
        if(this.charts.tend) this.charts.tend.destroy();
        this.charts.tend = new Chart(ctxTend, {
            type: 'line',
            data: {
                labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
                datasets: [{ label: 'Tickets Atendidos', data: [3, 7, 4, filtered.length], borderColor: '#FF6B35', backgroundColor: 'rgba(255,107,53,0.1)', fill: true, tension: 0.4 }]
            },
            options: { responsive: true, plugins: { title: { display: true, text: 'Tendencia Dinámica de Atención Operativa' } } }
        });

        const ctxSist = document.getElementById('chart-sistemas').getContext('2d');
        if(this.charts.sist) this.charts.sist.destroy();
        this.charts.sist = new Chart(ctxSist, {
            type: 'doughnut',
            data: {
                labels: dataState.sistemas,
                datasets: [{ data: [15, 9, 6], backgroundColor: ['#1E3A8A', '#FF6B35', '#10B981'] }]
            },
            options: { responsive: true, plugins: { title: { display: true, text: 'Proporción por Tipo de Sistema' } } }
        });
    },

    // --- RENDERIZADO GENERAL Y AJUSTES ---
    renderAll() {
        const tCli = document.getElementById('table-clientes');
        const sCli = document.getElementById('sede-client-select');
        const fCli = document.getElementById('filt-cliente');
        if(tCli && sCli && fCli) {
            tCli.innerHTML = ''; sCli.innerHTML = '<option value="">Seleccione Cliente...</option>'; fCli.innerHTML = '<option value="">Cliente (Todos)</option>';
            dataState.clientes.forEach((c, i) => {
                tCli.innerHTML += `<tr><td><strong>${c.name}</strong></td><td><span style="display:inline-block;width:15px;height:15px;background:${c.color};border-radius:4px;"></span></td><td><button class="btn btn-warning" onclick="app.openEditModal('client', ${i})" style="margin-right:5px;">Editar</button><button class="btn btn-danger" onclick="app.deleteClient(${i})">Eliminar</button></td></tr>`;
                sCli.innerHTML += `<option value="${c.name}">${c.name}</option>`;
                fCli.innerHTML += `<option value="${c.name}">${c.name}</option>`;
            });
        }

        const tSed = document.getElementById('table-sedes');
        const fSed = document.getElementById('filt-sede');
        if(tSed && fSed) {
            tSed.innerHTML = ''; fSed.innerHTML = '<option value="">Sede (Todas)</option>';
            dataState.sedes.forEach((s, i) => {
                tSed.innerHTML += `<tr><td><strong>${s.sede}</strong></td><td>${s.client}</td><td><button class="btn btn-warning" onclick="app.openEditModal('sede', ${i})" style="margin-right:5px;">Editar</button><button class="btn btn-danger" onclick="app.deleteSede(${i})">Eliminar</button></td></tr>`;
                fSed.innerHTML += `<option value="${s.sede}">${s.sede}</option>`;
            });
        }

        const tUsu = document.getElementById('table-usuarios');
        const fTec = document.getElementById('filt-tecnico');
        if(tUsu && fTec) {
            tUsu.innerHTML = ''; fTec.innerHTML = '<option value="">Técnico (Todos)</option>';
            dataState.usuarios.forEach((u, i) => {
                tUsu.innerHTML += `<tr><td><strong>${u.name}</strong></td><td>${u.role}</td><td><span style="font-size:0.8rem;color:var(--text-muted);">${u.perms.join(', ')}</span></td><td><button class="btn btn-warning" onclick="app.openEditModal('user', ${i})" style="margin-right:5px;">Editar</button><button class="btn btn-danger" onclick="app.deleteUser(${i})">Eliminar</button></td></tr>`;
                fTec.innerHTML += `<option value="${u.name}">${u.name}</option>`;
            });
        }

        const tSys = document.getElementById('table-sistemas');
        if(tSys) {
            tSys.innerHTML = '';
            dataState.sistemas.forEach((s, i) => {
                tSys.innerHTML += `<tr><td>${s}</td><td><button class="btn btn-warning" onclick="app.openEditModal('sistema', ${i})" style="margin-right:5px;">Editar</button><button class="btn btn-danger" onclick="app.deleteSistema(${i})">Eliminar</button></td></tr>`;
            });
        }

        const tFal = document.getElementById('table-fallas');
        const fFal = document.getElementById('filt-falla');
        if(tFal && fFal) {
            tFal.innerHTML = ''; fFal.innerHTML = '<option value="">Tipo Falla (Todas)</option>';
            dataState.fallas.forEach((f, i) => {
                tFal.innerHTML += `<tr><td>${f}</td><td><button class="btn btn-warning" onclick="app.openEditModal('falla', ${i})" style="margin-right:5px;">Editar</button><button class="btn btn-danger" onclick="app.deleteFalla(${i})">Eliminar</button></td></tr>`;
                fFal.innerHTML += `<option value="${f}">${f}</option>`;
            });
        }

        const tSla = document.getElementById('table-sla');
        if(tSla) {
            tSla.innerHTML = '';
            dataState.slaList.forEach((sla, i) => {
                tSla.innerHTML += `<tr><td>${sla.desc}</td><td><strong>${sla.days} Días</strong></td><td><button class="btn btn-warning" onclick="app.openEditModal('sla', ${i})" style="margin-right:5px;">Editar</button><button class="btn btn-danger" onclick="app.deleteSla(${i})">Eliminar</button></td></tr>`;
            });
        }

        this.renderDashboard();
    },
    initMap() {
        if(!this.map) {
            this.map = L.map('tech-map').setView([4.6097, -74.0817], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
            L.marker([4.6097, -74.0817]).addTo(this.map).bindPopup("<b>Técnico:</b> Carlos Pérez (En ruta GPS)");
        }
        setTimeout(() => this.map.invalidateSize(), 200);
    },
    generatePDF() {
        alert("Generando informe gerencial PDF con analítica ejecutiva...");
    },
    saveStorage() {
        localStorage.setItem('servitrack_db_v8', JSON.stringify(dataState));
    },
    loadStorage() {
        const saved = localStorage.getItem('servitrack_db_v8');
        if(saved) dataState = JSON.parse(saved);
    }
};

window.onload = () => app.init();
