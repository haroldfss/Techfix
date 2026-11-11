let dataState = {
    tickets: [],
    clientes: [],
    sedes: [],
    usuarios: [],
    fallas: ["CCTV - Pérdida de Video", "Control de Acceso Bloqueado", "Alarma - Falsa Activación"],
    sistemas: ["CCTV (Dahua/Hikvision)", "Intrusión (AX PRO/DSC)", "Automatización (Sonoff)"],
    currentUser: null
};

const app = {
    init() {
        this.loadStorage();
        this.updateSelectors();
    },
    login() {
        const role = document.getElementById('login-role').value;
        dataState.currentUser = { role: role };
        document.getElementById('login-view').classList.remove('active');
        document.getElementById('app-view').classList.add('active');
        document.getElementById('user-role-display').innerText = role.toUpperCase();
        this.navigateTo('dashboard');
    },
    logout() {
        document.getElementById('app-view').classList.remove('active');
        document.getElementById('login-view').classList.add('active');
    },
    navigateTo(section) {
        document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
        document.getElementById(`view-${section}`).style.display = 'block';
        if(section === 'dashboard') this.renderDashboard();
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
        this.saveStorage();
        alert(`Cliente "${name}" creado exitosamente.`);
        e.target.reset();
        this.updateSelectors();
    },
    addSede(e) {
        e.preventDefault();
        const client = document.getElementById('sede-client-select').value;
        const sede = document.getElementById('new-sede-name').value;
        if(!client) { alert("Seleccione un cliente válido."); return; }
        dataState.sedes.push({ client, sede });
        this.saveStorage();
        alert(`Sede "${sede}" agregada al cliente ${client}.`);
        e.target.reset();
    },
    addUser(e) {
        e.preventDefault();
        const name = document.getElementById('new-user-name').value;
        const role = document.getElementById('new-user-role').value;
        dataState.usuarios.push({ name, role });
        this.saveStorage();
        alert(`Usuario "${name}" registrado con rol ${role.toUpperCase()}.`);
        e.target.reset();
    },
    addFalla(e) {
        e.preventDefault();
        const falla = document.getElementById('new-falla-name').value;
        dataState.fallas.push(falla);
        this.saveStorage();
        alert(`Tipo de falla "${falla}" agregada.`);
        e.target.reset();
    },
    updateSelectors() {
        const clientSelect = document.getElementById('sede-client-select');
        if(clientSelect) {
            clientSelect.innerHTML = '<option value="">Seleccione Cliente...</option>';
            dataState.clientes.forEach(c => {
                clientSelect.innerHTML += `<option value="${c.name}">${c.name}</option>`;
            });
        }
    },
    saveStorage() {
        localStorage.setItem('servitrack_db', JSON.stringify(dataState));
    },
    loadStorage() {
        const saved = localStorage.getItem('servitrack_db');
        if(saved) { dataState = JSON.parse(saved); }
    },
    renderDashboard() {
        document.getElementById('kpi-creados').innerText = dataState.tickets.length;
        document.getElementById('ai-insight-text').innerText = dataState.clientes.length === 0 ? 
            "Recomendación: Vaya a Ajustes y cree su primer cliente y sedes para iniciar operaciones." : 
            "Operación sincronizada con éxito. Monitoreando SLAs en tiempo real.";
    }
};

window.onload = () => app.init();
