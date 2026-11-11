let dataState = {
    clientes: [],
    sedes: [],
    usuarios: [],
    fallas: ["CCTV - Pérdida de Video", "Control de Acceso Bloqueado", "Alarma - Falsa Activación"]
};

const app = {
    init() {
        this.loadStorage();
        this.renderLists();
    },
    login(e) {
        e.preventDefault();
        const user = document.getElementById('login-user').value;
        const pass = document.getElementById('login-pass').value;
        
        // Validación de acceso
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
    renderLists() {
        // Render Clientes
        const listC = document.getElementById('list-clientes');
        const selectC = document.getElementById('sede-client-select');
        if(listC) {
            listC.innerHTML = '';
            selectC.innerHTML = '<option value="">Seleccione Cliente...</option>';
            dataState.clientes.forEach(c => {
                listC.innerHTML += `<li><span style="display:inline-block;width:12px;height:12px;background:${c.color};border-radius:50%;margin-right:5px;"></span><strong>${c.name}</strong></li>`;
                selectC.innerHTML += `<option value="${c.name}">${c.name}</option>`;
            });
        }
        // Render Sedes
        const listS = document.getElementById('list-sedes');
        if(listS) {
            listS.innerHTML = '';
            dataState.sedes.forEach(s => {
                listS.innerHTML += `<li>${s.sede} <em style="color:#666;">(Cliente: ${s.client})</em></li>`;
            });
        }
        // Render Usuarios
        const listU = document.getElementById('list-usuarios');
        if(listU) {
            listU.innerHTML = '';
            dataState.usuarios.forEach(u => {
                listU.innerHTML += `<li><strong>${u.name}</strong> - <span class="badge" style="background:#FF6B35;color:white;padding:2px 8px;border-radius:10px;font-size:0.75rem;">${u.role}</span></li>`;
            });
        }
        // Render Fallas
        const listF = document.getElementById('list-fallas');
        if(listF) {
            listF.innerHTML = '';
            dataState.fallas.forEach(f => {
                listF.innerHTML += `<li>${f}</li>`;
            });
        }
    },
    renderDashboard() {
        document.getElementById('kpi-clientes').innerText = dataState.clientes.length;
        document.getElementById('kpi-sedes').innerText = dataState.sedes.length;
        document.getElementById('kpi-usuarios').innerText = dataState.usuarios.length;
        document.getElementById('kpi-fallas').innerText = dataState.fallas.length;
    },
    saveStorage() {
        localStorage.setItem('servitrack_db_v2', JSON.stringify(dataState));
    },
    loadStorage() {
        const saved = localStorage.getItem('servitrack_db_v2');
        if(saved) { dataState = JSON.parse(saved); }
    }
};

window.onload = () => app.init();
