login(e) {
        e.preventDefault();
        // Limpiar espacios en blanco accidentales con .trim()
        const userIn = document.getElementById('login-user').value.trim();
        const passIn = document.getElementById('login-pass').value.trim();
        
        // Asegurar que dataState y usuarios estén inicializados
        if (!dataState.usuarios || dataState.usuarios.length === 0) {
            dataState.usuarios = [
                { name: "admin", pass: "admin", role: "Administrador", assignedClient: "TODOS", perms: ["Dashboard Gerencial", "Gestión de Tickets", "Nuevo Ticket", "Mapa Geolocalizado", "Ajustes & Parámetros"] }
            ];
        }

        // Buscar usuario ignorando mayúsculas/minúsculas en el nombre
        const found = dataState.usuarios.find(u => u.name.trim().toLowerCase() === userIn.toLowerCase() && u.pass.trim() === passIn);
        
        if(found) {
            currentUser = found;
            activeClientContext = found.assignedClient === "TODOS" ? "" : found.assignedClient;
            
            document.getElementById('login-view').classList.remove('active');
            document.getElementById('app-view').classList.add('active');
            
            this.applyUserPrivileges();
            
            // Redirección inicial según permisos
            if(currentUser.perms.includes("Dashboard Gerencial") || currentUser.role === "Administrador") {
                this.navigateTo('dashboard');
            } else {
                this.navigateTo('tickets');
            }
        } else {
            alert("Usuario o contraseña incorrectos. Verifique sus datos.");
        }
    },
