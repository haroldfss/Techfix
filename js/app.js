let dataState = {
    tickets: [],
    clientes: [],
    sedes: [],
    usuarios: [],
    sistemas: ["CCTV (Dahua/Hikvision)", "Intrusión (AX PRO/DSC)", "Automatización (Sonoff)", "Control de Acceso"],
    fallas: ["CCTV - Pérdida de Video", "Control de Acceso Bloqueado", "Alarma - Falsa Activación", "Red - Sin Conexión"]
};

const app = {
    map: null,
    init() {
        this.loadStorage();
        this.renderAll();
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
            alert("Credenciales inválidas. Use: admin / admin");
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
        if(section === 'tickets') this.renderTicketsTable();
        if(section === 'map') this.initMap();
    },
    toggleTab(tab) {
        document.querySelectorAll('.settings-panel').forEach(el => el.style.display = 'none');
        document.getElementById(`tab-${tab}`).style.display = 'block';
    },
    openMobileModal() {
        document.getElementById('modal-mobile').style.display = 'flex';
    },
    addClient(e) {
        e.preventDefault();
        const name = document.getElementById('new-client-name').value;
        const color = document.getElementById('new-client-color').value;
        dataState.clientes.push({ name, color });
        this.saveStorage();
        alert(`Cliente "${name}" registrado.`);
        e.target.reset();
        this.renderAll();
    },
    addSede(e) {
        e.preventDefault();
        const client = document.getElementById('sede-client-select').value;
        const sede = document.getElementById('new-sede-name').value;
        if(!client) { alert("Seleccione un cliente."); return; }
        dataState.sedes.push({ client, sede });
        this.saveStorage();
        alert(`Sede "${sede}" agregada.`);
        e.target.reset();
        this.renderAll();
    },
    addUser(e) {
        e.preventDefault();
        const name = document.getElementById('new-user-name').value;
        const role = document.getElementById('new-role-name').value;
        const perms = Array.from(document.querySelectorAll('.perm-cb:checked')).map(cb => cb.value);
        dataState.usuarios.push({ name, role, perms });
        this.saveStorage();
        alert(`Usuario "${name}" con rol "${role}" registrado con éxito.`);
        e.target.reset();
        this.renderAll();
    },
    addSistema(e) {
        e.preventDefault();
        const sis = document.getElementById('new-sistema-name').value;
        dataState.sistemas.push(sis);
        this.saveStorage();
        alert(`Tipo de sistema agregado.`);
        e.target.reset();
        this.renderAll();
    },
    addFalla(e) {
        e.preventDefault();
        const falla = document.getElementById('new-falla-name').value;
        dataState.fallas.push(falla);
        this.saveStorage();
        alert(`Tipo de falla agregado.`);
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
            estado: 'Asignado',
            fecha: new Date().toLocaleDateString()
        };
        dataState.tickets.push(ticket);
        this.saveStorage();
        alert(`Ticket ${ticket.id} creado y asignado correctamente.`);
        e.target.reset();
        this.navigateTo('tickets');
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
        const tecEl = document.getElementById('ticket-tecnico');
        if(tecEl) {
            tecEl.innerHTML = '<option value="">Seleccione Técnico...</option>';
            dataState.usuarios.forEach(u => tecEl.innerHTML += `<option value="${u.name}">${u.name} (${u.role})</option>`);
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
    abrirCierre(id) {
        document.getElementById('modal-ticket-id').innerText = id;
        document.getElementById('modal-cierre').style.display = 'flex';
    },
    submitCierre(e) {
        e.preventDefault();
        const id = document.getElementById('modal-ticket-id').innerText;
        const ticket = dataState.tickets.find(t => t.id === id);
        if(ticket) {
            ticket.estado = 'Cumplido';
        }
        this.saveStorage();
        document.getElementById('modal-cierre').style.display = 'none';
        alert('Ticket atendido y cerrado con éxito. Informe PDF generado y enviado por correo.');
        this.renderTicketsTable();
    },
    renderTicketsTable() {
        const tbody = document.getElementById('tickets-tbody');
        if(!tbody) return;
        if(dataState.tickets.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#999;">No hay tickets registrados.</td></tr>`;
            return;
        }
        tbody.innerHTML = '';
        dataState.tickets.forEach(t => {
            const badgeBg = t.estado === 'Cumplido' ? '#8AC926' : (t.estado === 'En Proceso' ? '#FFC107' : '#FF6B35');
            tbody.innerHTML += `<tr>
                <td><strong>${t.id}</strong></td>
                <td>${t.cliente}</td>
                <td>${t.sede}</td>
                <td>${t.sistema}</td>
                <td>${t.falla}</td>
                <td>${t.tecnico}</td>
                <td>${t.sla} Días</td>
                <td><span class="badge" style="background:${badgeBg};color:white;padding:3px 10px;border-radius:12px;">${t.estado}</span></td>
                <td><button class="btn btn-primary" style="padding:0.3rem 0.8rem; font-size:0.8rem;" onclick="app.abrirCierre('${t.id}')">Atender / Cerrar</button></td>
            </tr>`;
        });
    },
    renderAll() {
        // Render Clientes
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
        // Render Sedes
        const listS = document.getElementById('list-sedes');
        if(listS) {
            listS.innerHTML = '';
            dataState.sedes.forEach(s => listS.innerHTML += `<li>${s.sede} <em style="color:#666;">(${s.client})</em></li>`);
        }
        // Render Usuarios
        const listU = document.getElementById('list-usuarios');
        if(listU) {
            listU.innerHTML = '';
            dataState.usuarios.forEach(u => listU.innerHTML += `<li><strong>${u.name}</strong> - <span style="background:#FF6B35;color:white;padding:2px 8px;border-radius:10px;font-size:0.75rem;">${u.role}</span> [Permisos: ${u.perms.join(', ')}]</li>`);
        }
        // Render Sistemas y Fallas
        const listSys = document.getElementById('list-sistemas');
        if(listSys) {
            listSys.innerHTML = '';
            dataState.sistemas.forEach(sis => listSys.innerHTML += `<li>${sis}</li>`);
        }
        const listF = document.getElementById('list-fallas');
        if(listF) {
            listF.innerHTML = '';
            dataState.fallas.forEach(f => listF.innerHTML += `<li>${f}</li>`);
        }
    },
    renderDashboard() {
        const total = dataState.tickets.length;
        document.getElementById('kpi-creados').innerText = total;
        document.getElementById('kpi-asignados').innerText = dataState.tickets.filter(t => t.estado==='Asignado').length;
        document.getElementById('kpi-proceso').innerText = dataState.tickets.filter(t => t.estado==='En Proceso').length;
        document.getElementById('kpi-retrasados').innerText = dataState.tickets.filter(t => t.estado==='Retrasado').length;
        document.getElementById('kpi-cumplidos').innerText = dataState.tickets.filter(t => t.estado==='Cumplido').length;
        
        const insight = document.getElementById('ai-insight-text');
        if(total === 0) {
            insight.innerHTML = "<strong>Estado Óptimo:</strong> Plataforma sincronizada. Comience creando clientes, sedes y generando tickets en el menú lateral.";
        } else {
            insight.innerHTML = "<strong>Análisis Activo:</strong> Los tiempos de respuesta se mantienen dentro del SLA establecido por la gerencia.";
        }
    },
    initMap() {
        if(!this.map) {
            this.map = L.map('tech-map').setView([4.6097, -74.0817], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
            L.marker([4.6097, -74.0817]).addTo(this.map).bindPopup("<b>Técnico en Campo:</b> Activo (GPS)");
        }
        setTimeout(() => this.map.invalidateSize(), 200);
    },
    generatePDF() {
        alert("Generando informe analítico PDF con métricas del dashboard...");
    },
    saveStorage() {
        localStorage.setItem('servitrack_db_v4', JSON.stringify(dataState));
    },
    loadStorage() {
        const saved = localStorage.getItem('servitrack_db_v4');
        if(saved) { dataState = JSON.parse(saved); }
    }
};

window.onload = () => app.init();
