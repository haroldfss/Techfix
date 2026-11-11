// Datos Base en Blanco según requerimiento (Cero datos precargados)
let dataState = {
    tickets: [],
    clientes: [],
    sedes: [],
    usuarios: [],
    fallas: ["CCTV - Pérdida de Video", "Control de Acceso Bloqueado", "Alarma - Falsa Activación", "Red - Sin Conexión", "Hardware - Daño Físico"],
    sistemas: ["CCTV (Dahua/Hikvision)", "Intrusión (AX PRO/DSC)", "Automatización (Sonoff)", "Control de Acceso"],
    currentUser: null,
    labels: {
        cliente: "Cliente",
        sede: "Sede",
        falla: "Tipo de Falla"
    }
};

const app = {
    charts: {},
    map: null,

    init() {
        console.log("ServiTrack Iniciado. Datos en blanco listos.");
        // Rellenar selectores vacios al arrancar
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
        // Reset visibility
        document.getElementById('nav-dashboard').style.display = 'flex';
        document.getElementById('nav-create-ticket').style.display = 'flex';
        document.getElementById('nav-settings').style.display = 'flex';
        document.getElementById('nav-map').style.display = 'flex';
        document.getElementById('group-tecnico').style.display = 'block';

        if (role === 'tecnico') {
            document.getElementById('nav-dashboard').style.display = 'none';
            document.getElementById('nav-create-ticket').style.display = 'none';
            document.getElementById('nav-settings').style.display = 'none';
            document.getElementById('nav-map').style.display = 'none';
        } else if (role === 'operador') {
            document.getElementById('nav-settings').style.display = 'none';
        }
    },

    navigateTo(section) {
        document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
        document.getElementById(`view-${section}`).style.display = 'block';
        
        // Hooks de sección
        if (section === 'dashboard') this.renderDashboard();
        if (section === 'tickets') this.renderTickets();
        if (section === 'map') this.initMap();
    },

    toggleSettings(panel) {
        document.querySelectorAll('.settings-panel').forEach(el => el.style.display = 'none');
        document.getElementById(`settings-${panel}`).style.display = 'block';
    },

    // ======== CORE: CREACIÓN DE TICKETS ========
    saveTicket(e) {
        e.preventDefault();
        const ticket = {
            id: 'TK-' + Math.floor(Math.random() * 10000),
            cliente: document.getElementById('ticket-cliente').value,
            sede: document.getElementById('ticket-sede').value,
            sistema: document.getElementById('ticket-sistema').value,
            falla: document.getElementById('ticket-falla').value,
            tecnico: document.getElementById('ticket-tecnico').value || 'Sin Asignar',
            meta: document.getElementById('ticket-meta').value,
            desc: document.getElementById('ticket-desc').value,
            estado: 'Creado',
            fecha: new Date().toISOString()
        };
        
        if (ticket.tecnico !== 'Sin Asignar') ticket.estado = 'Asignado';
        
        dataState.tickets.push(ticket);
        alert(`Ticket ${ticket.id} generado exitosamente.`);
        e.target.reset();
        this.navigateTo('tickets');
    },

    renderTickets() {
        const tbody = document.getElementById('tickets-tbody');
        tbody.innerHTML = '';
        
        // Filtro por usuario (Cliente especifico)
        let ticketsToRender = dataState.tickets;

        if (ticketsToRender.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#999;">No hay tickets registrados en el sistema.</td></tr>`;
            return;
        }

        ticketsToRender.forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${t.id}</strong></td>
                <td>${t.cliente}</td>
                <td>${t.sede}</td>
                <td>${t.sistema}</td>
                <td>${t.falla}</td>
                <td><span class="badge ${this.getBadgeColor(t.estado)}">${t.estado}</span></td>
                <td>
                    ${dataState.currentUser.role === 'tecnico' && t.estado !== 'Cumplido' ? 
                        `<button class="btn btn-primary" style="padding:0.3rem 0.8rem; font-size:0.8rem;" onclick="app.abrirCierre('${t.id}')">Atender/Cerrar</button>` : 
                        `<button class="btn btn-outline" style="padding:0.3rem 0.8rem; font-size:0.8rem;" onclick="alert('Detalles: ${t.desc}')">Ver</button>`
                    }
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    abrirCierre(id) {
        document.getElementById('modal-ticket-id').innerText = id;
        document.getElementById('modal-cierre').style.display = 'flex';
        // Simular Geolocalización
        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(() => {
                console.log("Geolocalización capturada para el cierre.");
            });
        }
    },

    submitCierre(e) {
        e.preventDefault();
        const id = document.getElementById('modal-ticket-id').innerText;
        const ticket = dataState.tickets.find(t => t.id === id);
        if(ticket) {
            ticket.estado = 'Cumplido';
            ticket.fechaCierre = new Date().toISOString();
        }
        document.getElementById('modal-cierre').style.display = 'none';
        alert('Ticket cerrado. Informe PDF simulado enviado al cliente.');
        this.renderTickets();
    },

    getBadgeColor(estado) {
        const map = {'Creado':'', 'Asignado':'badge-admin', 'En Proceso':'', 'Retrasado':'', 'Cumplido':''};
        if(estado==='Retrasado') return 'style="background:#EF476F;color:white;"';
        if(estado==='Cumplido') return 'style="background:#8AC926;color:white;"';
        if(estado==='En Proceso') return 'style="background:#FFC107;color:black;"';
        return map[estado] || 'badge-admin';
    },

    // ======== CONFIGURACIÓN Y AJUSTES ========
    addClient(e) {
        e.preventDefault();
        const name = document.getElementById('new-client-name').value;
        const color = document.getElementById('new-client-color').value;
        dataState.clientes.push({ name, color });
        alert(`Cliente ${name} creado.`);
        e.target.reset();
        this.updateSelectors();
    },
    
    addSede(e) {
        e.preventDefault();
        const client = document.getElementById('sede-client-select').value;
        const sede = document.getElementById('new-sede-name').value;
        dataState.sedes.push({ client, sede });
        alert(`Sede agregada a ${client}.`);
        e.target.reset();
        this.updateSelectors();
    },

    saveLabels() {
        dataState.labels.cliente = document.getElementById('edit-lbl-cliente').value;
        dataState.labels.sede = document.getElementById('edit-lbl-sede').value;
        dataState.labels.falla = document.getElementById('edit-lbl-falla').value;
        
        // Aplicar
        document.getElementById('label-ticket-client').innerText = dataState.labels.cliente;
        document.getElementById('label-ticket-sede').innerText = dataState.labels.sede;
        document.getElementById('label-ticket-falla').innerText = dataState.labels.falla;
        alert("Nombres de campos actualizados.");
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

    loadSedesForClient() {
        const client = document.getElementById('ticket-cliente').value;
        const el = document.getElementById('ticket-sede');
        el.innerHTML = '<option value="">Seleccione o Busque...</option>';
        dataState.sedes.filter(s => s.client === client).forEach(s => {
            el.innerHTML += `<option value="${s.sede}">${s.sede}</option>`;
        });
    },

    // ======== DASHBOARD Y ANALÍTICA ========
    renderDashboard() {
        // En blanco al inicio
        const total = dataState.tickets.length;
        document.getElementById('kpi-creados').innerText = total;
        document.getElementById('kpi-asignados').innerText = dataState.tickets.filter(t => t.estado==='Asignado').length;
        document.getElementById('kpi-proceso').innerText = dataState.tickets.filter(t => t.estado==='En Proceso').length;
        document.getElementById('kpi-retrasados').innerText = dataState.tickets.filter(t => t.estado==='Retrasado').length;
        document.getElementById('kpi-cumplidos').innerText = dataState.tickets.filter(t => t.estado==='Cumplido').length;

        // IA Recomendaciones
        const insightEl = document.getElementById('ai-insight-text');
        if(total === 0) {
            insightEl.innerText = "No hay datos históricos. La plataforma está lista para comenzar a registrar tickets.";
        } else {
            const retrasos = dataState.tickets.filter(t => t.estado==='Retrasado').length;
            if(retrasos > 0) {
                insightEl.innerHTML = `<strong style="color:red;">Alerta Analítica:</strong> Tienes ${retrasos} tickets retrasados. Se recomienda reasignar carga técnica inmediata para evitar incumplimientos SLA.`;
            } else {
                insightEl.innerHTML = `<strong style="color:green;">Operación Óptima:</strong> Los tiempos de cierre están dentro del rango de meta establecido.`;
            }
        }

        // Renderizado Seguro de Gráficos (Vacios si no hay data)
        this.buildCharts();
    },

    buildCharts() {
        const ctxTend = document.getElementById('chart-tendencia');
        if(this.charts.tend) this.charts.tend.destroy();
        this.charts.tend = new Chart(ctxTend, {
            type: 'line',
            data: { labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'], datasets: [{ label: 'Tickets Generados (Tendencia)', data: [0,0,0,0,0,0,dataState.tickets.length], borderColor: '#FF6B35', tension: 0.4 }] },
            options: { responsive: true, plugins: { title: { display: true, text: 'Tendencia Semanal de Tickets' } } }
        });

        const ctxSist = document.getElementById('chart-sistemas');
        if(this.charts.sist) this.charts.sist.destroy();
        this.charts.sist = new Chart(ctxSist, {
            type: 'doughnut',
            data: { labels: dataState.sistemas, datasets: [{ data: dataState.sistemas.map(() => 0), backgroundColor: ['#0B2545', '#FF6B35', '#FFC107', '#8AC926'] }] },
            options: { responsive: true, plugins: { title: { display: true, text: 'Tickets por Tipo de Sistema' } } }
        });
    },

    // ======== MAPA Y PDF ========
    initMap() {
        if(!this.map) {
            this.map = L.map('tech-map').setView([4.6097, -74.0817], 12); // Bogotá por defecto
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
        }
        setTimeout(() => this.map.invalidateSize(), 200);
    },

    generatePDF(elementId, filename) {
        const element = document.getElementById(elementId);
        const opt = {
            margin:       0.5,
            filename:     `${filename}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
        };
        html2pdf().set(opt).from(element).save();
    }
};

window.onload = () => app.init();
