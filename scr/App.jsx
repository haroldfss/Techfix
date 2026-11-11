import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wrench, 
  ShieldCheck, 
  UserCheck, 
  PlusCircle, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  Camera, 
  FileText, 
  Download, 
  Send, 
  Settings, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  PlayCircle, 
  Layers, 
  Users, 
  Building2, 
  ChevronRight, 
  LogOut, 
  Smartphone, 
  Sparkles, 
  X, 
  Trash2, 
  Edit3, 
  Upload, 
  Check, 
  Navigation, 
  Mail, 
  Package, 
  BarChart2, 
  PieChart as PieIcon,
  RefreshCw,
  Info,
  Lock,
  User,
  Key,
  ShieldAlert,
  Sliders,
  Briefcase
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid
} from 'recharts';

// --- INITIAL MOCK DATA ---
const INITIAL_CLIENTS = [
  { id: 'c1', name: 'Banco Central Corp', logo: '🏦' },
  { id: 'c2', name: 'Supermercados El Rey', logo: '🛒' },
  { id: 'c3', name: 'Hospital San José', logo: '🏥' }
];

const INITIAL_SEDES = [
  { id: 's1', clientId: 'c1', name: 'Sede Principal - Centro', address: 'Av. Cra 7 # 32-10' },
  { id: 's2', clientId: 'c1', name: 'Sucursal Norte', address: 'Calle 140 # 19-45' },
  { id: 's3', clientId: 'c2', name: 'Plaza Las Américas', address: 'Transversal 71 # 6-30' },
  { id: 's4', clientId: 'c3', name: 'Urgencias Médicas', address: 'Calle 26 # 68-90' }
];

const INITIAL_SYSTEMS = [
  { id: 'sys1', name: 'HVAC / Aire Acondicionado', description: 'Sistemas de climatización e imbornales' },
  { id: 'sys2', name: 'Redes & Telecom', description: 'Cableado estructurado, switches y APs' },
  { id: 'sys3', name: 'Cámaras CCTV', description: 'Grabadores NVR, cámaras IP y domos' },
  { id: 'sys4', name: 'Electricidad & UPS', description: 'Tableros de distribución y respaldo' },
  { id: 'sys5', name: 'Control de Acceso', description: 'Torniquetes y biometría' }
];

const INITIAL_FAILURES = [
  { id: 'f1', name: 'Apagado repentino' },
  { id: 'f2', name: 'Sin señal de red' },
  { id: 'f3', name: 'Fuga de refrigerante' },
  { id: 'f4', name: 'Sobrecalentamiento' },
  { id: 'f5', name: 'Falla de energía' },
  { id: 'f6', name: 'Ruido anómalo' }
];

const DEFAULT_PERMISSIONS = {
  canCreateTickets: true,
  canViewDashboard: true,
  canManageCatalogs: false,
  canCloseTickets: true
};

const INITIAL_USERS = [
  {
    id: 'u1',
    name: 'Carlos Mendoza (Técnico)',
    username: 'carlos.m',
    password: '123',
    role: 'tecnico', // 'tecnico', 'operador', 'admin'
    assignedClientId: 'ALL', // 'ALL' or specific clientId e.g. 'c1'
    permissions: { canCreateTickets: false, canViewDashboard: true, canManageCatalogs: false, canCloseTickets: true }
  },
  {
    id: 'u2',
    name: 'Ana Gómez (Op Banco Central)',
    username: 'ana.op',
    password: '123',
    role: 'operador',
    assignedClientId: 'c1', // Restricted to Banco Central
    permissions: { canCreateTickets: true, canViewDashboard: true, canManageCatalogs: false, canCloseTickets: false }
  },
  {
    id: 'u3',
    name: 'Administrador General',
    username: 'admin',
    password: '123',
    role: 'admin',
    assignedClientId: 'ALL',
    permissions: { canCreateTickets: true, canViewDashboard: true, canManageCatalogs: true, canCloseTickets: true }
  },
  {
    id: 'u4',
    name: 'Roberto Silva (Técnico El Rey)',
    username: 'roberto.s',
    password: '123',
    role: 'tecnico',
    assignedClientId: 'c2', // Restricted to Supermercados El Rey
    permissions: { canCreateTickets: false, canViewDashboard: true, canManageCatalogs: false, canCloseTickets: true }
  }
];

const INITIAL_TICKETS = [
  {
    id: 'TK-1001',
    clientId: 'c1',
    clientName: 'Banco Central Corp',
    sede: 'Sede Principal - Centro',
    system: 'HVAC / Aire Acondicionado',
    failureType: 'Fuga de refrigerante',
    description: 'El aire acondicionado de la sala de servidores presenta fluctuaciones de temperatura y goteo constante.',
    reportedBy: 'Laura Restrepo (Administradora de Sede)',
    reportDate: '2026-11-09T08:30:00',
    targetHours: 4,
    status: 'Asignado', // Creado, Asignado, En Proceso, Retrasado, Cumplido
    assignedTechId: 'u1',
    assignedTechName: 'Carlos Mendoza (Técnico)',
    operatorCreated: 'Operador Central',
    activities: '',
    materials: '',
    photos: [],
    observations: '',
    gpsLocation: null,
    clientEmail: 'contacto@bancocentral.com',
    closedAt: null
  },
  {
    id: 'TK-1002',
    clientId: 'c2',
    clientName: 'Supermercados El Rey',
    sede: 'Plaza Las Américas',
    system: 'Cámaras CCTV',
    failureType: 'Sin señal de red',
    description: 'Cámara de pasillo 3 no transmite video al grabador NVR central.',
    reportedBy: 'Jorge Peña (Jefe de Seguridad)',
    reportDate: '2026-11-10T10:15:00',
    targetHours: 6,
    status: 'En Proceso',
    assignedTechId: 'u4',
    assignedTechName: 'Roberto Silva (Técnico El Rey)',
    operatorCreated: 'Operador Central',
    startedAt: '2026-11-10T11:00:00',
    activities: 'Revisión de cableado UTP y prueba de puerto POE.',
    materials: '10m Cable UTP Cat6, Conectores RJ45',
    photos: ['https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=400&q=80'],
    observations: 'Requerirá cambio de switch POE en mantenimiento programado.',
    gpsLocation: '4.6097, -74.0817',
    clientEmail: 'mantenimiento@elrey.com',
    closedAt: null
  },
  {
    id: 'TK-1003',
    clientId: 'c3',
    clientName: 'Hospital San José',
    sede: 'Urgencias Médicas',
    system: 'Electricidad & UPS',
    failureType: 'Sobrecalentamiento',
    description: 'UPS de respaldo emite alarma por alta temperatura ambiental.',
    reportedBy: 'Ing. Fernando Ruiz',
    reportDate: '2026-11-08T14:00:00',
    targetHours: 2,
    status: 'Retrasado',
    assignedTechId: 'u1',
    assignedTechName: 'Carlos Mendoza (Técnico)',
    operatorCreated: 'Operador Central',
    activities: '',
    materials: '',
    photos: [],
    observations: '',
    gpsLocation: null,
    clientEmail: 'biomedica@sanjose.org',
    closedAt: null
  },
  {
    id: 'TK-1004',
    clientId: 'c1',
    clientName: 'Banco Central Corp',
    sede: 'Sucursal Norte',
    system: 'Control de Acceso',
    failureType: 'Apagado repentino',
    description: 'Torniquete de ingreso principal no reconoce tarjetas magnéticas.',
    reportedBy: 'Recepción Central',
    reportDate: '2026-11-07T09:00:00',
    targetHours: 8,
    status: 'Cumplido',
    assignedTechId: 'u1',
    assignedTechName: 'Carlos Mendoza (Técnico)',
    operatorCreated: 'Operador Central',
    startedAt: '2026-11-07T10:00:00',
    activities: 'Reemplazo de fuente de poder 12V 5A y calibración de lector RFID.',
    materials: 'Fuente switching 12V, fusibles 2A',
    photos: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'],
    observations: 'Equipo probado satisfactoriamente con 20 usuarios.',
    gpsLocation: '4.7110, -74.0721',
    clientEmail: 'soporte@bancocentral.com',
    closedAt: '2026-11-07T12:30:00'
  }
];

const STATUS_COLORS = {
  Creado: { badge: 'bg-slate-700 text-slate-200' },
  Asignado: { badge: 'bg-blue-900/80 text-blue-200 border border-blue-700' },
  'En Proceso': { badge: 'bg-amber-900/80 text-amber-200 border border-amber-700' },
  Retrasado: { badge: 'bg-rose-900/80 text-rose-200 border border-rose-700' },
  Cumplido: { badge: 'bg-emerald-900/80 text-emerald-200 border border-emerald-700' }
};

const PIE_COLORS = ['#64748b', '#3b82f6', '#f59e0b', '#ef4444', '#10b981'];

export default function App() {
  // --- STATE MANAGEMENT ---
  const [currentUser, setCurrentUser] = useState(null); // Active logged-in user object
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets', 'create', 'dashboard', 'settings'
  
  // App DB State
  const [users, setUsers] = useState(INITIAL_USERS);
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [sedes, setSedes] = useState(INITIAL_SEDES);
  const [systems, setSystems] = useState(INITIAL_SYSTEMS);
  const [failures, setFailures] = useState(INITIAL_FAILURES);
  
  // Customization & Branding State
  const [branding, setBranding] = useState({
    companyName: 'TechFix Pro Mobile PWA',
    logoIcon: '🛠️'
  });

  // UI Modals & Notifications
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [pdfModalTicket, setPdfModalTicket] = useState(null);
  const [isMobileDeviceFrame, setIsMobileDeviceFrame] = useState(true);

  // Admin Modals for Users and System CRUD
  const [userModalData, setUserModalData] = useState(null); // null = closed, {} = new/editing
  const [systemModalData, setSystemModalData] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSede, setFilterSede] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSystem, setFilterSystem] = useState('');

  // Auto toast message clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg) => setToastMessage(msg);

  // --- LOGIN LOGIC WITH AUTH SIMULATION ---
  const handleLoginSubmit = (usernameInput, passwordInput) => {
    const foundUser = users.find(u => u.username === usernameInput && u.password === passwordInput);
    if (foundUser) {
      setCurrentUser(foundUser);
      if (foundUser.role === 'tecnico') setActiveTab('tickets');
      else setActiveTab('dashboard');
      showToast(`Bienvenido ${foundUser.name}`);
    } else {
      alert('Credenciales inválidas. Por favor intente con usuario: admin | clave: 123');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedTicket(null);
  };

  // --- CLIENT ACCESSIBILITY SCOPE HELPER ---
  // If user has assignedClientId !== 'ALL', restrict all queries to that client
  const isClientAccessRestricted = currentUser && currentUser.assignedClientId !== 'ALL';
  const userClientScopeId = currentUser ? currentUser.assignedClientId : 'ALL';

  // --- TICKET HANDLERS ---
  const handleUpdateTicketStatus = (ticketId, newStatus) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: newStatus,
          startedAt: newStatus === 'En Proceso' ? new Date().toISOString() : t.startedAt
        };
      }
      return t;
    }));
    showToast(`Estado actualizado a "${newStatus}"`);
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(prev => ({ ...prev, status: newStatus }));
    }
  };

  const handleAssignTech = (ticketId, techUserId) => {
    const techUser = users.find(u => u.id === techUserId);
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          assignedTechId: techUserId,
          assignedTechName: techUser ? techUser.name : 'Sin Asignar',
          status: techUserId ? 'Asignado' : 'Creado'
        };
      }
      return t;
    }));
    showToast(`Técnico asignado correctamente.`);
  };

  const handleCloseTicketSubmit = (ticketId, closeData) => {
    const now = new Date().toISOString();
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          ...closeData,
          status: 'Cumplido',
          closedAt: now
        };
      }
      return t;
    }));
    setSelectedTicket(null);
    showToast(`✅ Ticket ${ticketId} cerrado y reporte generado.`);
  };

  const handleCreateTicket = (newTicketData) => {
    const newId = `TK-${1000 + tickets.length + 1}`;
    const fullTicket = {
      id: newId,
      ...newTicketData,
      reportDate: new Date().toISOString(),
      status: newTicketData.assignedTechId ? 'Asignado' : 'Creado',
      operatorCreated: currentUser ? currentUser.name : 'Operador',
      activities: '',
      materials: '',
      photos: [],
      observations: '',
      gpsLocation: null,
      closedAt: null
    };
    setTickets([fullTicket, ...tickets]);
    showToast(`Ticket ${newId} creado con éxito.`);
    setActiveTab('tickets');
  };

  // --- ADMIN USER CRUD ---
  const handleSaveUser = (userData) => {
    if (userData.id) {
      // Edit
      setUsers(prev => prev.map(u => u.id === userData.id ? userData : u));
      showToast(`Usuario ${userData.username} actualizado.`);
    } else {
      // Create
      const newUser = {
        ...userData,
        id: `u_${Date.now()}`
      };
      setUsers([...users, newUser]);
      showToast(`Nuevo usuario ${userData.username} registrado.`);
    }
    setUserModalData(null);
  };

  const handleDeleteUser = (userId) => {
    if (users.length <= 1) {
      alert('No se puede eliminar el único usuario del sistema.');
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
    showToast('Usuario eliminado.');
  };

  // --- ADMIN SYSTEM CRUD ---
  const handleSaveSystem = (sysData) => {
    if (sysData.id) {
      setSystems(prev => prev.map(s => s.id === sysData.id ? sysData : s));
      showToast(`Sistema ${sysData.name} actualizado.`);
    } else {
      const newSys = { ...sysData, id: `sys_${Date.now()}` };
      setSystems([...systems, newSys]);
      showToast(`Sistema ${sysData.name} creado.`);
    }
    setSystemModalData(null);
  };

  const handleDeleteSystem = (sysId) => {
    setSystems(prev => prev.filter(s => s.id !== sysId));
    showToast('Sistema eliminado.');
  };

  // --- FILTERED TICKETS (RESPECTS CLIENT ISOLATION & ROLE) ---
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      // 1. Client Restricted Access Check
      if (isClientAccessRestricted && t.clientId !== userClientScopeId) {
        return false;
      }
      // 2. Role Technician View Restriction (Only assigned tickets)
      if (currentUser?.role === 'tecnico' && t.assignedTechId !== currentUser.id) {
        return false;
      }
      // 3. Search Term
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchSede = t.sede.toLowerCase().includes(q);
        const matchDesc = t.description.toLowerCase().includes(q);
        const matchFalla = t.failureType.toLowerCase().includes(q);
        const matchId = t.id.toLowerCase().includes(q);
        if (!matchSede && !matchDesc && !matchFalla && !matchId) return false;
      }
      // 4. Dropdowns
      if (filterSede && t.sede !== filterSede) return false;
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterSystem && t.system !== filterSystem) return false;

      return true;
    });
  }, [tickets, currentUser, isClientAccessRestricted, userClientScopeId, searchQuery, filterSede, filterStatus, filterSystem]);

  // --- DASHBOARD KPIS (RESPECTS CLIENT RESTRICTIONS) ---
  const kpiData = useMemo(() => {
    const scopeTickets = tickets.filter(t => !isClientAccessRestricted || t.clientId === userClientScopeId);
    
    const total = scopeTickets.length;
    const creados = scopeTickets.filter(t => t.status === 'Creado').length;
    const asignados = scopeTickets.filter(t => t.status === 'Asignado').length;
    const enProceso = scopeTickets.filter(t => t.status === 'En Proceso').length;
    const retrasados = scopeTickets.filter(t => t.status === 'Retrasado').length;
    const cumplidos = scopeTickets.filter(t => t.status === 'Cumplido').length;

    const pieData = [
      { name: 'Creado', value: creados },
      { name: 'Asignado', value: asignados },
      { name: 'En Proceso', value: enProceso },
      { name: 'Retrasado', value: retrasados },
      { name: 'Cumplido', value: cumplidos }
    ].filter(item => item.value > 0);

    // Tickets by Sede
    const sedeCounts = {};
    scopeTickets.forEach(t => {
      sedeCounts[t.sede] = (sedeCounts[t.sede] || 0) + 1;
    });
    const barSedeData = Object.keys(sedeCounts).map(key => ({
      sede: key.length > 14 ? key.substring(0, 14) + '..' : key,
      cantidad: sedeCounts[key]
    }));

    // Tickets by System
    const sysCounts = {};
    scopeTickets.forEach(t => {
      sysCounts[t.system] = (sysCounts[t.system] || 0) + 1;
    });
    const barSysData = Object.keys(sysCounts).map(key => ({
      name: key.length > 12 ? key.substring(0, 12) + '..' : key,
      tickets: sysCounts[key]
    }));

    return { total, creados, asignados, enProceso, retrasados, cumplidos, pieData, barSedeData, barSysData };
  }, [tickets, isClientAccessRestricted, userClientScopeId]);

  // --- LOGIN SCREEN IF NOT AUTHENTICATED ---
  if (!currentUser) {
    return (
      <LoginScreen
        users={users}
        branding={branding}
        onLogin={handleLoginSubmit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-0 sm:p-4 font-sans select-none">
      
      {/* FRAME TOGGLE HEADER (DESKTOP MODE) */}
      <div className="hidden sm:flex items-center gap-3 mb-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full text-xs text-slate-400">
        <Smartphone className="w-4 h-4 text-blue-400" />
        <span>Vista Móvil PWA Responsiva</span>
        <button
          onClick={() => setIsMobileDeviceFrame(!isMobileDeviceFrame)}
          className="ml-2 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-full text-white transition-colors"
        >
          {isMobileDeviceFrame ? 'Modo Pantalla Completa' : 'Modo Frame Móvil'}
        </button>
      </div>

      {/* MOBILE CONTAINER FRAME */}
      <div className={`w-full ${isMobileDeviceFrame ? 'max-w-[420px] sm:h-[840px] sm:rounded-[45px] sm:border-[10px] sm:border-slate-800 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]' : 'max-w-4xl min-h-screen sm:rounded-2xl'} bg-slate-900 flex flex-col relative overflow-hidden transition-all duration-300`}>
        
        {/* SMARTPHONE STATUS BAR */}
        {isMobileDeviceFrame && (
          <div className="w-full bg-slate-950 px-6 pt-3 pb-2 flex items-center justify-between text-[11px] text-slate-400 font-mono select-none z-30">
            <span>09:41</span>
            <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto" />
            <div className="flex items-center gap-1">
              <span className="text-[10px]">5G</span>
              <div className="w-3 h-2 bg-emerald-500 rounded-xs" />
            </div>
          </div>
        )}

        {/* TOP APP BAR */}
        <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between z-20 sticky top-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{branding.logoIcon}</span>
            <div>
              <h2 className="font-bold text-xs text-white leading-tight">{branding.companyName}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-semibold capitalize">
                  {currentUser.role}
                </span>
                {isClientAccessRestricted && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                    <Briefcase className="w-2.5 h-2.5" />
                    {clients.find(c => c.id === currentUser.assignedClientId)?.name || 'Cliente'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => showToast('📲 App lista para usar sin conexión (PWA).')}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1 transition-colors"
              title="Descargar/Instalar PWA"
            >
              <Download className="w-4 h-4 text-blue-400" />
            </button>
            
            <button
              onClick={handleLogout}
              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* TOAST NOTIFICATION POPUP */}
        {toastMessage && (
          <div className="absolute top-16 left-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-2xl shadow-xl z-50 flex items-center justify-between text-xs animate-in slide-in-from-top-4 duration-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-blue-700 rounded-lg">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* MAIN BODY CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">

          {/* TAB 1: TICKETS LIST */}
          {activeTab === 'tickets' && (
            <div className="space-y-3.5">
              
              {/* SEARCH & FILTER CONTROLS */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por Sede, falla o código..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* DROPDOWN FILTERS */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-slate-800/80 border border-slate-700/80 text-slate-300 rounded-xl p-2 focus:outline-none"
                  >
                    <option value="">Todos los Estados</option>
                    <option value="Creado">Creado</option>
                    <option value="Asignado">Asignado</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Retrasado">Retrasado</option>
                    <option value="Cumplido">Cumplido</option>
                  </select>

                  <select
                    value={filterSystem}
                    onChange={(e) => setFilterSystem(e.target.value)}
                    className="bg-slate-800/80 border border-slate-700/80 text-slate-300 rounded-xl p-2 focus:outline-none"
                  >
                    <option value="">Todos los Sistemas</option>
                    {systems.map((sys) => (
                      <option key={sys.id} value={sys.name}>{sys.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* LIST HEADER COUNTER */}
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
                <span>Total Encontrados: {filteredTickets.length} ticket(s)</span>
                {currentUser.role === 'tecnico' && (
                  <span className="text-blue-400">Asignados a ti</span>
                )}
              </div>

              {/* TICKETS LIST */}
              {filteredTickets.length === 0 ? (
                <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
                  <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-medium text-slate-300">No hay tickets registrados</p>
                  <p className="text-xs text-slate-500">Prueba ajustando los filtros de búsqueda</p>
                </div>
              ) : (
                filteredTickets.map(ticket => {
                  const statusStyle = STATUS_COLORS[ticket.status] || STATUS_COLORS.Creado;
                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 rounded-2xl p-4 transition-all duration-200 cursor-pointer relative overflow-hidden group shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-400 text-xs bg-blue-500/10 px-2 py-0.5 rounded-md">
                            {ticket.id}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyle.badge}`}>
                            {ticket.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(ticket.reportDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <h3 className="text-xs font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">
                        {ticket.sede}
                      </h3>

                      <p className="text-xs text-slate-300 line-clamp-2 mb-3">
                        {ticket.description}
                      </p>

                      <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="truncate max-w-[150px]">⚙️ {ticket.system}</span>
                        <span className="text-slate-300 font-medium truncate max-w-[120px]">👤 {ticket.assignedTechName}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: CREATE TICKET */}
          {activeTab === 'create' && (currentUser.permissions?.canCreateTickets || currentUser.role === 'admin') && (
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                <PlusCircle className="w-5 h-5" />
                <span>Registrar Nueva Novedad de Soporte</span>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const selectedSedeName = formData.get('sede');
                const selectedSedeObj = sedes.find(s => s.name === selectedSedeName);
                
                const techUser = users.find(u => u.id === formData.get('assignedTechId'));

                handleCreateTicket({
                  clientId: selectedSedeObj ? selectedSedeObj.clientId : 'c1',
                  clientName: clients.find(c => c.id === (selectedSedeObj ? selectedSedeObj.clientId : 'c1'))?.name || 'Cliente',
                  sede: selectedSedeName,
                  system: formData.get('system'),
                  failureType: formData.get('failureType'),
                  description: formData.get('description'),
                  reportedBy: formData.get('reportedBy'),
                  targetHours: parseInt(formData.get('targetHours') || 4),
                  assignedTechId: formData.get('assignedTechId'),
                  assignedTechName: techUser ? techUser.name : 'Sin Asignar',
                  clientEmail: formData.get('clientEmail')
                });
              }} className="space-y-3.5 text-xs">
                
                {/* AUTOCOMPLETE SEDE INPUT */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">1. Buscar o Seleccionar Sede *</label>
                  <input
                    list="sedes-list"
                    name="sede"
                    required
                    placeholder="Escribe para buscar sede..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <datalist id="sedes-list">
                    {sedes
                      .filter(s => !isClientAccessRestricted || s.clientId === userClientScopeId)
                      .map(s => (
                        <option key={s.id} value={s.name}>{s.address}</option>
                      ))}
                  </datalist>
                </div>

                {/* SYSTEM & FAILURE TYPE */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Tipo de Sistema *</label>
                    <select name="system" required className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none">
                      {systems.map((sys) => (
                        <option key={sys.id} value={sys.name}>{sys.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Tipo de Falla *</label>
                    <select name="failureType" required className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none">
                      {failures.map((f) => (
                        <option key={f.id} value={f.name}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Descripción de la Novedad *</label>
                  <textarea
                    name="description"
                    required
                    rows={3}
                    placeholder="Describa en detalle la falla reportada..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* REPORTED BY & EMAIL */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Reportado Por *</label>
                    <input
                      name="reportedBy"
                      required
                      placeholder="Nombre del usuario/contacto"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Correo Copia PDF *</label>
                    <input
                      type="email"
                      name="clientEmail"
                      required
                      placeholder="cliente@correo.com"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                    />
                  </div>
                </div>

                {/* ASSIGN TECHNICIAN & SLA */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Asignar Técnico</label>
                    <select name="assignedTechId" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none">
                      <option value="">Sin Asignar</option>
                      {users
                        .filter(u => u.role === 'tecnico')
                        .map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Tiempo Meta (Horas)</label>
                    <input
                      type="number"
                      name="targetHours"
                      defaultValue={4}
                      min={1}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Crear y Notificar Ticket</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: DASHBOARD */}
          {activeTab === 'dashboard' && (currentUser.permissions?.canViewDashboard || currentUser.role === 'admin') && (
            <div className="space-y-4">
              
              {/* KPIS SUMMARY */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total</span>
                  <span className="text-xl font-black text-white">{kpiData.total}</span>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl text-center">
                  <span className="text-[10px] text-amber-400 uppercase font-semibold block">En Proceso</span>
                  <span className="text-xl font-black text-amber-400">{kpiData.enProceso}</span>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl text-center">
                  <span className="text-[10px] text-emerald-400 uppercase font-semibold block">Cumplidos</span>
                  <span className="text-xl font-black text-emerald-400">{kpiData.cumplidos}</span>
                </div>
              </div>

              {/* PIE CHART: STATUS */}
              <div className="bg-slate-800/70 border border-slate-700/60 p-4 rounded-3xl space-y-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-blue-400" />
                  Estado General de Tickets
                </h3>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={kpiData.pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        innerRadius={30}
                        paddingAngle={4}
                      >
                        {kpiData.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 justify-center text-[10px]">
                  {kpiData.pieData.map((item, idx) => (
                    <span key={idx} className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-md text-slate-300">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      {item.name}: {item.value}
                    </span>
                  ))}
                </div>
              </div>

              {/* BAR CHART: SEDES */}
              <div className="bg-slate-800/70 border border-slate-700/60 p-4 rounded-3xl space-y-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                  Novedades por Sede
                </h3>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kpiData.barSedeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="sede" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                      <Bar dataKey="cantidad" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* BAR CHART: SYSTEMS */}
              <div className="bg-slate-800/70 border border-slate-700/60 p-4 rounded-3xl space-y-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Tickets por Tipo de Sistema
                </h3>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kpiData.barSysData} layout="vertical">
                      <XAxis type="number" stroke="#94a3b8" fontSize={9} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={80} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                      <Bar dataKey="tickets" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: ADMIN SETTINGS & MANAGEMENT */}
          {activeTab === 'settings' && currentUser.role === 'admin' && (
            <div className="space-y-4">
              
              {/* SECTION A: GESTIÓN DE USUARIOS */}
              <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    Gestión de Usuarios y Roles (CRUD)
                  </h3>
                  <button
                    onClick={() => setUserModalData({
                      name: '',
                      username: '',
                      password: '',
                      role: 'tecnico',
                      assignedClientId: 'ALL',
                      permissions: { ...DEFAULT_PERMISSIONS }
                    })}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    + Nuevo Usuario
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {users.map(u => (
                    <div key={u.id} className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{u.name}</span>
                          <span className="text-[10px] bg-slate-800 text-blue-300 font-mono px-1.5 py-0.5 rounded">
                            @{u.username}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="capitalize text-amber-400">Rol: {u.role}</span>
                          <span>•</span>
                          <span>
                            Cliente: {u.assignedClientId === 'ALL' ? 'Todos los Clientes' : clients.find(c => c.id === u.assignedClientId)?.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setUserModalData(u)}
                          className="p-1.5 text-blue-400 hover:text-white bg-slate-800 rounded-lg"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 bg-slate-800 rounded-lg"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION B: GESTIÓN DE TIPOS DE SISTEMA */}
              <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    Tipos de Sistema (CRUD)
                  </h3>
                  <button
                    onClick={() => setSystemModalData({ name: '', description: '' })}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    + Nuevo Sistema
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {systems.map(sys => (
                    <div key={sys.id} className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-white block">{sys.name}</span>
                        {sys.description && <span className="text-[10px] text-slate-400">{sys.description}</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSystemModalData(sys)}
                          className="p-1.5 text-blue-400 hover:text-white bg-slate-800 rounded-lg"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSystem(sys.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 bg-slate-800 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION C: OTRAs CONFIGURACIONES (SEDES, FALLAS, BRANDING) */}
              <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-3xl space-y-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  Catálogos Complementarios & Imagen Corporativa
                </h3>

                {/* SEDES */}
                <div className="border-t border-slate-700/60 pt-2 space-y-2 text-xs">
                  <span className="font-semibold text-slate-300 block">Sedes Registradas</span>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto">
                    {sedes.map(s => (
                      <div key={s.id} className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-xl">
                        <span className="text-slate-300">{s.name}</span>
                        <button
                          onClick={() => {
                            setSedes(sedes.filter(item => item.id !== s.id));
                            showToast('Sede eliminada');
                          }}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const name = e.target.elements.name.value;
                    if(name) {
                      setSedes([...sedes, { id: `s_${Date.now()}`, clientId: 'c1', name, address: 'Dirección Registrada' }]);
                      e.target.reset();
                      showToast('Sede agregada');
                    }
                  }} className="flex gap-2">
                    <input name="name" required placeholder="Nombre nueva sede..." className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-white" />
                    <button type="submit" className="bg-blue-600 px-3 py-1 rounded-xl text-white font-medium">+ Add</button>
                  </form>
                </div>

                {/* BRANDING */}
                <div className="border-t border-slate-700/60 pt-2 text-xs space-y-2">
                  <span className="font-semibold text-slate-300 block">Imagen Corporativa</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={branding.companyName}
                      onChange={(e) => setBranding({ ...branding, companyName: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                    />
                    <input
                      type="text"
                      value={branding.logoIcon}
                      onChange={(e) => setBranding({ ...branding, logoIcon: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>

              </div>

            </div>
          )}

        </main>

        {/* BOTTOM NAVIGATION BAR */}
        <nav className="bg-slate-950 border-t border-slate-800/80 px-2 py-2 flex items-center justify-around z-20">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${activeTab === 'tickets' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-medium">Tickets</span>
          </button>

          {(currentUser.permissions?.canCreateTickets || currentUser.role === 'admin') && (
            <button
              onClick={() => setActiveTab('create')}
              className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${activeTab === 'create' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <PlusCircle className="w-5 h-5" />
              <span className="text-[10px] font-medium">Crear</span>
            </button>
          )}

          {(currentUser.permissions?.canViewDashboard || currentUser.role === 'admin') && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <BarChart2 className="w-5 h-5" />
              <span className="text-[10px] font-medium">Dashboard</span>
            </button>
          )}

          {currentUser.role === 'admin' && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${activeTab === 'settings' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-[10px] font-medium">Ajustes</span>
            </button>
          )}
        </nav>

      </div>

      {/* TICKET DETAIL & CLOSING MODAL */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          currentUser={currentUser}
          users={users}
          onClose={() => setSelectedTicket(null)}
          onUpdateStatus={handleUpdateTicketStatus}
          onAssignTech={handleAssignTech}
          onCloseTicketSubmit={handleCloseTicketSubmit}
          onOpenPdfModal={(t) => setPdfModalTicket(t)}
        />
      )}

      {/* ADMIN USER MODAL (CREATE / EDIT USER) */}
      {userModalData && (
        <AdminUserModal
          user={userModalData}
          clients={clients}
          onClose={() => setUserModalData(null)}
          onSave={handleSaveUser}
        />
      )}

      {/* ADMIN SYSTEM TYPE MODAL */}
      {systemModalData && (
        <AdminSystemModal
          system={systemModalData}
          onClose={() => setSystemModalData(null)}
          onSave={handleSaveSystem}
        />
      )}

      {/* PDF REPORT MODAL */}
      {pdfModalTicket && (
        <PdfReportModal
          ticket={pdfModalTicket}
          branding={branding}
          onClose={() => setPdfModalTicket(null)}
          onDownload={() => {
            showToast('📄 Informe descargado en formato PDF.');
            setPdfModalTicket(null);
          }}
        />
      )}

    </div>
  );
}

// --- SUB-COMPONENT: LOGIN SCREEN WITH AUTH SIMULATION ---
function LoginScreen({ users, branding, onLogin }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123');

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl shadow-inner">
            {branding.logoIcon}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">{branding.companyName}</h1>
          <p className="text-slate-400 text-xs mt-1">Plataforma Móvil de Gestión de Servicio Técnico</p>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={(e) => {
          e.preventDefault();
          onLogin(username, password);
        }} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Usuario</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nombre de usuario"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña</label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg text-xs flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Iniciar Sesión</span>
          </button>
        </form>

        {/* QUICK ACCESS USER PRESETS DEMO */}
        <div className="mt-6 pt-5 border-t border-slate-800 space-y-2">
          <span className="text-[11px] text-slate-400 block text-center font-medium">Demostración: Selección Rápida de Perfil</span>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              onClick={() => onLogin('admin', '123')}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left"
            >
              <strong className="text-white block">👑 Admin General</strong>
              <span className="text-slate-400 text-[10px]">Acceso total</span>
            </button>

            <button
              onClick={() => onLogin('carlos.m', '123')}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left"
            >
              <strong className="text-white block">🛠️ Técnico Carlos</strong>
              <span className="text-slate-400 text-[10px]">Cierre y fotos</span>
            </button>

            <button
              onClick={() => onLogin('ana.op', '123')}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left col-span-2"
            >
              <strong className="text-white block">🏢 Op. Banco Central (Cliente Restringido)</strong>
              <span className="text-slate-400 text-[10px]">Solo ve datos de Banco Central</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- SUB-COMPONENT: ADMIN USER FORM MODAL ---
function AdminUserModal({ user, clients, onClose, onSave }) {
  const [formData, setFormData] = useState({
    id: user.id || null,
    name: user.name || '',
    username: user.username || '',
    password: user.password || '123',
    role: user.role || 'tecnico',
    assignedClientId: user.assignedClientId || 'ALL',
    permissions: user.permissions || {
      canCreateTickets: true,
      canViewDashboard: true,
      canManageCatalogs: false,
      canCloseTickets: true
    }
  });

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 z-50">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            {formData.id ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          onSave(formData);
        }} className="space-y-3">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Nombre Completo *</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Usuario *</label>
              <input
                required
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Contraseña *</label>
              <input
                required
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Rol del Usuario</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
              >
                <option value="tecnico">Técnico</option>
                <option value="operador">Operador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Cliente Asignado</label>
              <select
                value={formData.assignedClientId}
                onChange={(e) => setFormData({ ...formData, assignedClientId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
              >
                <option value="ALL">Todos los Clientes</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* CUSTOMIZABLE PERMISSIONS */}
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
            <span className="font-semibold text-slate-300 block">Permisos Customizables:</span>
            
            <label className="flex items-center gap-2 text-slate-400">
              <input
                type="checkbox"
                checked={formData.permissions.canCreateTickets}
                onChange={(e) => setFormData({
                  ...formData,
                  permissions: { ...formData.permissions, canCreateTickets: e.target.checked }
                })}
                className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
              />
              <span>Crear y Registrar Tickets</span>
            </label>

            <label className="flex items-center gap-2 text-slate-400">
              <input
                type="checkbox"
                checked={formData.permissions.canViewDashboard}
                onChange={(e) => setFormData({
                  ...formData,
                  permissions: { ...formData.permissions, canViewDashboard: e.target.checked }
                })}
                className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
              />
              <span>Visualizar Dashboard e Indicadores</span>
            </label>

            <label className="flex items-center gap-2 text-slate-400">
              <input
                type="checkbox"
                checked={formData.permissions.canCloseTickets}
                onChange={(e) => setFormData({
                  ...formData,
                  permissions: { ...formData.permissions, canCloseTickets: e.target.checked }
                })}
                className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
              />
              <span>Ejecutar Cierre y Reportes de Ticket</span>
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-800 py-2.5 rounded-xl font-medium text-slate-300">
              Cancelar
            </button>
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl font-medium text-white shadow-lg">
              Guardar Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: ADMIN SYSTEM TYPE MODAL ---
function AdminSystemModal({ system, onClose, onSave }) {
  const [name, setName] = useState(system.name || '');
  const [description, setDescription] = useState(system.description || '');

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 z-50">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            {system.id ? 'Editar Tipo de Sistema' : 'Crear Tipo de Sistema'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          onSave({ id: system.id, name, description });
        }} className="space-y-3">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Nombre del Sistema *</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Redes & Telecom"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Descripción</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Equipos de cómputo y routers"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-800 py-2.5 rounded-xl text-slate-300">
              Cancelar
            </button>
            <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-xl text-white font-medium shadow-lg">
              Guardar Sistema
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: TICKET DETAIL & CLOSING FORM ---
function TicketDetailModal({ ticket, currentUser, users, onClose, onUpdateStatus, onAssignTech, onCloseTicketSubmit, onOpenPdfModal }) {
  const [activities, setActivities] = useState(ticket.activities || '');
  const [materials, setMaterials] = useState(ticket.materials || '');
  const [observations, setObservations] = useState(ticket.observations || '');
  const [photos, setPhotos] = useState(ticket.photos || []);
  const [gpsLocation, setGpsLocation] = useState(ticket.gpsLocation || null);
  const [isCapturingGps, setIsCapturingGps] = useState(false);

  const handleSimulatePhoto = () => {
    const samplePhotos = [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80'
    ];
    const randomPic = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];
    setPhotos(prev => [...prev, randomPic]);
  };

  const handleCaptureGPS = () => {
    setIsCapturingGps(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
          setIsCapturingGps(false);
        },
        () => {
          setGpsLocation(`4.6097, -74.0817 (GPS Capturado)`);
          setIsCapturingGps(false);
        }
      );
    } else {
      setGpsLocation(`4.6097, -74.0817 (GPS Capturado)`);
      setIsCapturingGps(false);
    }
  };

  const statusStyle = STATUS_COLORS[ticket.status] || STATUS_COLORS.Creado;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* MODAL HEADER */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-blue-400 text-sm bg-blue-500/10 px-2.5 py-1 rounded-lg">
              {ticket.id}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusStyle.badge}`}>
              {ticket.status}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-800">
          
          <div className="space-y-2 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <h2 className="text-sm font-bold text-white">{ticket.sede}</h2>
            <p className="text-slate-300">{ticket.description}</p>
            
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <div><strong className="text-slate-300">Cliente:</strong> {ticket.clientName}</div>
              <div><strong className="text-slate-300">Sistema:</strong> {ticket.system}</div>
              <div><strong className="text-slate-300">Falla:</strong> {ticket.failureType}</div>
              <div><strong className="text-slate-300">Técnico:</strong> {ticket.assignedTechName}</div>
              <div><strong className="text-slate-300">Reportó:</strong> {ticket.reportedBy}</div>
              <div><strong className="text-slate-300">Correo Copia:</strong> {ticket.clientEmail}</div>
            </div>
          </div>

          {/* RE-ASSIGNMENT */}
          {(currentUser.role === 'admin' || currentUser.role === 'operador') && ticket.status !== 'Cumplido' && (
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 flex items-center justify-between gap-2">
              <span className="font-medium text-slate-300">Asignar Técnico:</span>
              <select
                value={ticket.assignedTechId || ''}
                onChange={(e) => onAssignTech(ticket.id, e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded-xl p-2 outline-none"
              >
                <option value="">Sin Asignar</option>
                {users.filter(u => u.role === 'tecnico').map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* TECHNICIAN START ACTION */}
          {currentUser.role === 'tecnico' && ticket.status === 'Asignado' && (
            <div className="text-center py-2">
              <button
                onClick={() => onUpdateStatus(ticket.id, 'En Proceso')}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
              >
                <PlayCircle className="w-5 h-5" />
                <span>Iniciar Actividades de Servicio Técnico</span>
              </button>
            </div>
          )}

          {/* FIELD CLOSING FORM */}
          {(ticket.status === 'En Proceso' || ticket.status === 'Cumplido') && (
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl space-y-3">
              <h3 className="font-bold text-white flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Informe de Ejecución y Cierre Técnico
              </h3>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Actividades Realizadas *</label>
                <textarea
                  value={activities}
                  onChange={(e) => setActivities(e.target.value)}
                  disabled={ticket.status === 'Cumplido'}
                  rows={3}
                  placeholder="Detalle los trabajos realizados..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white disabled:opacity-60 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Materiales Utilizados</label>
                <input
                  type="text"
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  disabled={ticket.status === 'Cumplido'}
                  placeholder="Ej. Cable Cat6, Conectores..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white disabled:opacity-60 outline-none"
                />
              </div>

              {/* PHOTOS */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-400 font-medium">Registro Fotográfico</label>
                  {ticket.status !== 'Cumplido' && (
                    <button
                      type="button"
                      onClick={handleSimulatePhoto}
                      className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 text-[11px]"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      + Adjuntar Foto
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {photos.map((src, i) => (
                    <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
                      <img src={src} alt="Evidencia" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {photos.length === 0 && (
                    <div className="col-span-3 bg-slate-900 border border-dashed border-slate-700 rounded-xl p-3 text-center text-slate-500">
                      Sin fotos adjuntas
                    </div>
                  )}
                </div>
              </div>

              {/* GPS GEOLOCATION */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-medium">Georeferenciación</label>
                  {ticket.status !== 'Cumplido' && (
                    <button
                      type="button"
                      onClick={handleCaptureGPS}
                      disabled={isCapturingGps}
                      className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 text-[11px]"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      {isCapturingGps ? 'Capturando...' : 'Capturar GPS'}
                    </button>
                  )}
                </div>

                <div className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{gpsLocation || 'GPS no registrado'}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Observaciones</label>
                <input
                  type="text"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  disabled={ticket.status === 'Cumplido'}
                  placeholder="Recomendaciones..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white disabled:opacity-60 outline-none"
                />
              </div>

              {/* CLOSE TICKET BUTTON */}
              {ticket.status !== 'Cumplido' && (currentUser.role === 'tecnico' || currentUser.role === 'admin') && (
                <button
                  type="button"
                  onClick={() => {
                    if (!activities) {
                      alert('Por favor ingrese las actividades realizadas.');
                      return;
                    }
                    onCloseTicketSubmit(ticket.id, {
                      activities,
                      materials,
                      photos,
                      gpsLocation: gpsLocation || '4.6097, -74.0817',
                      observations
                    });
                  }}
                  className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cerrar Ticket & Enviar Copia Email</span>
                </button>
              )}

              {/* PDF REPORT VIEW */}
              {ticket.status === 'Cumplido' && (
                <button
                  type="button"
                  onClick={() => onOpenPdfModal(ticket)}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Ver / Descargar Informe PDF</span>
                </button>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: PDF REPORT GENERATOR MODAL ---
function PdfReportModal({ ticket, branding, onClose, onDownload }) {
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 z-50">
      <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl font-sans">
        
        <div className="border-b pb-3 flex items-center justify-between border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{branding.logoIcon}</span>
            <div>
              <h1 className="font-bold text-sm text-slate-900">{branding.companyName}</h1>
              <p className="text-[10px] text-slate-500">Informe Técnico de Mantenimiento y Cierre</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {ticket.id}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div><strong className="text-slate-700">Cliente:</strong> {ticket.clientName}</div>
          <div><strong className="text-slate-700">Sede:</strong> {ticket.sede}</div>
          <div><strong className="text-slate-700">Fecha Cierre:</strong> {new Date(ticket.closedAt || Date.now()).toLocaleDateString('es-ES')}</div>
          <div><strong className="text-slate-700">Técnico:</strong> {ticket.assignedTechName}</div>
          <div><strong className="text-slate-700">Sistema:</strong> {ticket.system}</div>
          <div><strong className="text-slate-700">Falla:</strong> {ticket.failureType}</div>
        </div>

        <div className="space-y-2 text-xs">
          <div>
            <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">Actividades Realizadas</h4>
            <p className="bg-slate-50 p-2.5 rounded-xl text-slate-700 border border-slate-100">{ticket.activities || 'Sin registro'}</p>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">Materiales Utilizados</h4>
            <p className="bg-slate-50 p-2.5 rounded-xl text-slate-700 border border-slate-100">{ticket.materials || 'Ninguno'}</p>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">Georeferenciación GPS</h4>
            <p className="bg-slate-50 p-2.5 rounded-xl text-slate-700 border border-slate-100 font-mono text-[11px]">
              📍 {ticket.gpsLocation || '4.6097, -74.0817'}
            </p>
          </div>

          {ticket.photos && ticket.photos.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">Evidencia Fotográfica</h4>
              <div className="grid grid-cols-2 gap-2">
                {ticket.photos.map((p, idx) => (
                  <img key={idx} src={p} alt="Foto" className="w-full h-24 object-cover rounded-xl border border-slate-200" />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
          <div>
            <span>Firmado Digitalmente por:</span>
            <strong className="block text-slate-800 text-xs">{ticket.assignedTechName}</strong>
          </div>
          <div className="text-right">
            <span>Copia enviada a:</span>
            <strong className="block text-blue-600 text-xs">{ticket.clientEmail}</strong>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs"
          >
            Volver
          </button>
          <button
            onClick={onDownload}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}