let dataState = {
    tickets: [],
    clientes: [{ name: "Banco de Bogotá", color: "#1E3A8A" }],
    sedes: [{ client: "Banco de Bogotá", sede: "Sede Principal" }],
    usuarios: [{ name: "Carlos Pérez", role: "Técnico" }],
    sistemas: ["CCTV IP Dahua", "Intrusión AX PRO"],
    fallas: ["Pérdida de Video", "Falla de Panel"]
};

const app = {
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
            alert("Usuario o contraseña incorrectos. Use: admin / admin");
        }
    },
    logout() {
        document.getElementById('app-view').classList.remove('active');
        document.getElementById('login-view').classList.add('active');
    },
    navigateTo(section) {
        document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
        document.getElementById(`view-${section}`).classList.add('active');
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
    openMobileModal() { alert("Aplicación PWA lista para instalar desde el navegador."); },
    
    addClient(e) {
        e.preventDefault();
        const name = document.getElementById('new-client-name').value;
        const color = document.getElementById('new-client-color').value;
        dataState.clientes.push({ name, color });
        this.saveStorage();
        e.target.reset();
        this.renderAll();
        alert("Cliente guardado.");
    },
    addUser(e) {
        e.preventDefault();
        const name = document.getElementById('new-user-name').value;
        const role = document.getElementById('new-role-name').value;
        dataState.usuarios.push({ name, role });
        this.saveStorage();
        e.target.reset();
        this.renderAll();
        alert("Usuario guardado.");
    },
    addSistema(e) {
        e.preventDefault();
        const sis = document.getElementById('new-sistema-name').value;
        dataState.sistemas.push(sis);
        this.saveStorage();
        e.target.reset();
        this.renderAll();
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
            estado: 'Asignado'
        };
        dataState.tickets.push(ticket);
        this.saveStorage();
        alert(`Ticket ${ticket.id} creado.`);
        e.target.reset();
        this.navigateTo('tickets');
    },
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
        dataState.usuarios.forEach(u => tecEl.innerHTML += `<option value="${u.name}">${u.name}</option>`);
    },
    loadSedesForClient() {
        const client = document.getElementById('ticket-cliente').value;
        const sedeEl = document.getElementById('ticket-sede');
        sedeEl.innerHTML = '';
        dataState.sedes.filter(s => s.client === client).forEach(s => {
            sedeEl.innerHTML += `<option value="${s.sede}">${s.sede}</option>`;
        });
    },
    renderTicketsTable() {
        const tbody = document.getElementById('tickets-tbody');
        tbody.innerHTML = dataState.tickets.length === 0 ? `<tr><td colspan="9" style="text-align:center; color:#64748B;">No hay tickets registrados.</td></tr>` : '';
        dataState.tickets.forEach(t => {
            tbody.innerHTML += `<tr><td><strong>${t.id}</strong></td><td>${t.cliente}</td><td>${t.sede}</td><td>${t.sistema}</td><td>${t.falla}</td><td>${t.tecnico}</td><td>${t.sla}D</td><td><span class="badge">${t.estado}</span></td><td><button class="btn btn-primary" style="padding:0.2rem 0.6rem;font-size:0.75rem;" onclick="alert('Atendiendo ticket')">Atender</button></td></tr>`;
        });
    },
    renderAll() {
        const tCli = document.getElementById('table-clientes');
        if(tCli) {
            tCli.innerHTML = '';
            dataState.clientes.forEach(c => tCli.innerHTML += `<tr><td>${c.name}</td><td><span style="background:${c.color};width:12px;height:12px;display:inline-block;border-radius:2px;"></span></td><td>-</td></tr>`);
        }
        const tUsu = document.getElementById('table-usuarios');
        if(tUsu) {
            tUsu.innerHTML = '';
            dataState.usuarios.forEach(u => tUsu.innerHTML += `<tr><td>${u.name}</td><td>${u.role}</td><td>-</td></tr>`);
        }
        const tSys = document.getElementById('table-sistemas');
        if(tSys) {
            tSys.innerHTML = '';
            dataState.sistemas.forEach(s => tSys.innerHTML += `<tr><td>${s}</td><td>-</td></tr>`);
        }
        this.renderDashboard();
    },
    renderDashboard() {
        document.getElementById('kpi-creados').innerText = dataState.tickets.length;
        document.getElementById('kpi-asignados').innerText = dataState.tickets.filter(t => t.estado==='Asignado').length;
    },
    initMap() {
        if(!this.map) {
            this.map = L.map('tech-map').setView([4.6097, -74.0817], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
        }
        setTimeout(() => this.map.invalidateSize(), 200);
    },
    generatePDF() { alert("Generando reporte PDF..."); },
    saveStorage() { localStorage.setItem('servitrack_db_v6', JSON.stringify(dataState)); },
    loadStorage() { const saved = localStorage.getItem('servitrack_db_v6'); if(saved) dataState = JSON.parse(saved); }
};

window.onload = () => app.init();
