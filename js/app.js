let dataState = {
    tickets: [],
    clientes: [],
    sedes: [],
    usuarios: [],
    fallas: ["CCTV - Pérdida de Video", "Control de Acceso Bloqueado", "Alarma - Falsa Activación", "Red - Sin Conexión", "Hardware - Daño Físico"],
    sistemas: ["CCTV (Dahua/Hikvision)", "Intrusión (AX PRO/DSC)", "Automatización (Sonoff)", "Control de Acceso"],
    currentUser: null,
    labels: { cliente: "Cliente", sede: "Sede", falla: "Tipo de Falla" }
};

const app = {
    charts: {},
    map: null,
    init() {
        this.loadLocalStorage();
        this.updateSelectors();
    },
    login() {
        const role = document.getElementById('login-role').value;
        dataState.currentUser = { role: role, name: "Usuario " + role };
        document.getElementById('login-view').classList.remove('active');
        document.getElementById('app-view').classList.add('active');
        document.getElementById('user-role-display').innerText = role.toUpperCase();
        this.applyPermissions(role);
        this.navigateTo(role === 'tecnico' ? 'tickets' : 'dashboard');
    },
    logout() {
        document.getElementById('app-view').classList.remove('active');
        document.getElementById('login-view').classList.add('active');
        dataState.currentUser = null;
    },
    applyPermissions(role) {
        document.getElementById('nav-dashboard').style.display = role === 'tecnico' ? 'none' : 'flex';
        document.getElementById('nav-create-ticket').style.display = role === 'tecnico' ? 'none' : 'flex';
        document.getElementById('nav-settings').style.display = role === 'tecnico' || role === 'operador' ? 'none' : 'flex';
        document.getElementById('nav-map').style.display = role === 'tecnico' ? 'none' : 'flex';
    },
    navigateTo(section) {
        document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
        document.getElementById(`view-${section}`).style.display = 'block';
        if (section === 'dashboard') this.renderDashboard();
        if (section === 'tickets') this.renderTickets();
        if (section === 'map') this.initMap();
    },
    toggleSettings(panel) {
        document.querySelectorAll('.settings-panel').forEach(el => el.style.display = 'none');
        document.getElementById(`settings-${panel}`).style.display = 'block';
    },
    addClient(e) {
        e.preventDefault();
        const name = document.getElementById('new-client-name').value;
        const color = document.getElementById('new-client-color').value;
        dataState.clientes.push({ name, color });
        this.saveLocalStorage();
        alert(`Cliente ${name} agregado correctamente.`);
        e.target.reset();
        this.updateSelectors();
    },
    addSede(e) {
        e.preventDefault();
        const client = document.getElementById('sede-client-select').value;
        const sede = document.getElementById('new-sede-name').value;
        if(!client) { alert("Seleccione un cliente primero."); return; }
        dataState.sedes.push({ client, sede });
        this.saveLocalStorage();
        alert(`Sede agregada a ${client}.`);
        e.target.reset();
        this.updateSelectors();
    },
    updateSelectors() {
        const fill = (id, arr, prop) => {
            const el = document.getElementById(id);
            if(!el) return;
            el.innerHTML = '<option value="">Seleccione...</option>';
            arr.forEach(i => {
                const val = prop ? i[prop] : i;
                el.innerHTML += `<option value="${val}">${val}</option>`;
            });
        };
        fill('ticket-cliente', dataState.clientes, 'name');
        fill('sede-client-select', dataState.clientes, 'name');
        fill('ticket-falla', dataState.fallas);
        fill('ticket-sistema', dataState.sistemas);
    },
    saveLocalStorage() {
        localStorage.setItem('servitrack_data', JSON.stringify(dataState));
    },
    loadLocalStorage() {
        const saved = localStorage.getItem('servitrack_data');
        if(saved) { dataState = JSON.parse(saved); }
    },
    renderDashboard() {
        document.getElementById('kpi-creados').innerText = dataState.tickets.length;
        document.getElementById('ai-insight-text').innerText = dataState.tickets.length === 0 ? 
            "Plataforma lista. Comience a registrar tickets y clientes en ajustes." : "Analizando operaciones en tiempo real...";
    },
    renderTickets() { },
    initMap() { }
};
window.onload = () => app.init();
