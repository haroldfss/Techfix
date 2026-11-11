let dataState = {
    tickets: [],
    clientes: [],
    sedes: [],
    usuarios: [],
    fallas: ["CCTV - Pérdida de Video", "Control de Acceso Bloqueado", "Alarma - Falsa Activación"],
    sistemas: ["CCTV (Dahua/Hikvision)", "Intrusión (AX PRO/DSC)", "Automatización (Sonoff)"]
};

const app = {
    map: null,
    init() {
        this.loadStorage();
        this.renderLists();
    },
    login(e) {
        e.preventDefault();
        const user = document.getElementById('login-user').value;
        const pass = document.getElementById('login-pass').value;
        if(user === "admin" && pass === "admin") {
            document.getElementById('login-view').classList.remove('active');
            document.getElementById('app-view').classList.add('active');
            this.navigateTo('dashboard');
        } else {
            alert("Usuario o contraseña incorrectos. Pruebe con: admin / admin");
        }
    },
    logout() {
        document.getElementById('app-view').classList.remove('active');
        document.getElementById('login-view').classList.add('active');
    },
    navigateTo(section) {
        document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
        document.getElementById(`view-${section}`).style.display = 'block';
        if(section === 'dashboard') this.renderDashboard();
        if(section === 'create-ticket') this.loadTicketSelectors();
        if(section === 'map') this.initMap();
    },
    toggleTab(tab) {
        document.querySelectorAll('.settings-panel').forEach(el => el.style.display = 'none');
        document.getElementById(`tab-${tab}`).style.display = 'block';
    },
    addClient(e) {
        e.preventDefault();
        const name = document.getElementById('new-client-name').value;
        const color = document.getElementById('new-client-color').value;
        dataState.clientes.push({ name, color });
        this.saveStorage();
        alert(`Cliente "${name}" creado exitosamente.`);
        e.target.reset();
        this.renderLists();
    },
    addSede(e) {
        e.preventDefault();
        const client = document.getElementById('sede-client-select').value;
        const sede = document.getElementById('new-sede-name').value;
        if(!client) { alert("Seleccione un cliente primero."); return; }
        dataState.sedes.push({ client, sede });
        this.saveStorage();
        alert(`Sede "${sede}" agregada.`);
        e.target.reset();
        this.renderLists();
    },
    addUser(e) {
        e.preventDefault();
        const name = document.getElementById('new-user-name').value;
        const role = document.getElementById('new-user-role').value;
        dataState.usuarios.push({ name, role });
        this.saveStorage();
        alert(`Usuario "${name}" registrado.`);
        e.target.reset();
        this.renderLists();
    },
    addFalla(e) {
        e.preventDefault();
        const falla = document.getElementById('new-falla-name').value;
        dataState.fallas.push(falla);
        this.saveStorage();
        alert(`Tipo de falla agregado.`);
        e.target.reset();
        this.renderLists();
    },
    saveTicket(e) {
        e.preventDefault();
        const ticket = {
            id: 'TK-' + Math.floor(Math.random() * 10000),
            cliente: document.getElementById('ticket-cliente').value,
            sede: document.getElementById('ticket-sede').value,
            sistema: document.getElementById('ticket-sistema').value,
            falla: document.getElementById('ticket-falla').value,
            desc: document.getElementById('ticket-desc').value,
            estado: 'Creado'
        };
        dataState.tickets.push(ticket);
        this.saveStorage();
        alert(`Ticket ${ticket.id} creado exitosamente.`);
        e.target.reset();
        this.navigateTo('tickets');
        this.renderTicketsTable();
    },
    loadTicketSelectors() {
        const fill = (id, arr) => {
            const el = document.getElementById(id);
            if(!el) return;
            el.innerHTML = '<option value="">Seleccione...</option>';
            arr.forEach(i => el.innerHTML += `<option value="${i}">${i}</option>`);
        };
        const clientEl = document.getElementById('ticket-cliente');
        if(clientEl) {
            clientEl.innerHTML = '<option value="">Seleccione Cliente...</option>';
            dataState.clientes.forEach(c => clientEl.innerHTML += `<option value="${c.name}">${c.name}</option>`);
        }
        fill('ticket-sistema', dataState.sistemas);
        fill('ticket-falla', dataState.fallas);
    },
    loadSedesForClient() {
        const client = document.getElementById('ticket-cliente').value;
        const sedeEl = document.getElementById('ticket-sede');
        if(!sedeEl) return;
        sedeEl.innerHTML = '<option value="">Seleccione Sede...</option>';
        dataState.sedes.filter(s => s.client === client).forEach(s => {
            sedeEl.innerHTML += `<option value="${s.sede}">${s.sede}</option>`;
        });
    },
    renderTicketsTable() {
        const tbody = document.getElementById('tickets-tbody');
        if(!tbody) return;
        if(dataState.tickets.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#999;">No hay tickets registrados.</td></tr>`;
            return;
        }
        tbody.innerHTML = '';
        dataState.tickets.forEach(t => {
            tbody.innerHTML += `<tr><td><strong>${t.id}</strong></td><td>${t.cliente}</td><td>${t.sede}</td><td>${t.sistema}</td><td>${t.falla}</td><td><span class="badge" style="background:#FF6B35;color:white;padding:2px 8px;border-radius:10px;">${t.estado}</span></td></tr>`;
        });
    },
    renderLists() {
        const listC = document.getElementById('list-clientes');
        const selectC = document.getElementById('sede-client-select');
        if(listC && selectC) {
            listC.innerHTML = '';
            selectC.innerHTML = '<option value="">Seleccione Cliente...</option>';
            dataState.clientes.forEach(c => {
                listC.innerHTML += `<li><span style="display:inline-block;width:12px;height:12px;background:${c.color};border-radius:50%;margin-right:5px;"></span><strong>${c.name}</strong></li>`;
                selectC.innerHTML += `<option value="${c.name}">${c.name}</option>`;
            });
        }
        const listS = document.getElementById('list-sedes');
        if(listS) {
            listS.innerHTML = '';
            dataState.sedes.forEach(s => {
                listS.innerHTML += `<li>${s.sede} <em style="color:#666;">(Cliente: ${s.client})</em></li>`;
            });
        }
        const listU = document.getElementById('list-usuarios');
        if(listU) {
            listU.innerHTML = '';
            dataState.usuarios.forEach(u => {
                listU.innerHTML += `<li><strong>${u.name}</strong> - <span style="background:#FF6B35;color:white;padding:2px 8px;border-radius:10px;font-size:0.75rem;">${u.role}</span></li>`;
            });
        }
        const listF = document.getElementById('list-fallas');
        if(listF) {
            listF.innerHTML = '';
            dataState.fallas.forEach(f => {
                listF.innerHTML += `<li>${f}</li>`;
            });
        }
        this.renderTicketsTable();
    },
    renderDashboard() {
        document.getElementById('kpi-tickets').innerText = dataState.tickets.length;
        document.getElementById('kpi-clientes').innerText = dataState.clientes.length;
        document.getElementById('kpi-sedes').innerText = dataState.sedes.length;
        document.getElementById('kpi-usuarios').innerText = dataState.usuarios.length;
    },
    initMap() {
        if(!this.map) {
            this.map = L.map('tech-map').setView([4.6097, -74.0817], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
        }
        setTimeout(() => this.map.invalidateSize(), 200);
    },
    saveStorage() {
        localStorage.setItem('servitrack_db_v3', JSON.stringify(dataState));
    },
    loadStorage() {
        const saved = localStorage.getItem('servitrack_db_v3');
        if(saved) { dataState = JSON.parse(saved); }
    }
};

window.onload = () => app.init();
