import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MapPin, Settings as SettingsIcon, BarChart2, Ticket as TicketIcon, LogOut, Trash2, Plus } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('tickets');
  
  const [clients, setClients] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [failureTypes, setFailureTypes] = useState([]);
  const [systemTypes, setSystemTypes] = useState([]);
  const [slaTargets, setSlaTargets] = useState([]);
  const [tickets, setTickets] = useState([]);
  
  const [users, setUsers] = useState([{ 
    id: 1, username: 'admin', password: '123', name: 'Administrador Global', role: 'Administrador', 
    clientId: 'ALL', permissions: ['crear_ticket', 'ver_dashboard', 'gestionar_ajustes', 'ver_mapa', 'cerrar_ticket'] 
  }]);
  
  const [labels, setLabels] = useState({
    ticket: 'Ticket', client: 'Cliente', sede: 'Sede', failureType: 'Tipo de Falla', systemType: 'Tipo de Sistema', user: 'Usuario', sla: 'Tiempo Meta (Días)'
  });

  const handleLogin = (e) => {
    e.preventDefault();
    const found = users.find(x => x.username === e.target.username.value && x.password === e.target.password.value);
    if (found) setCurrentUser(found); else alert('Credenciales incorrectas');
  };

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-lg w-96">
          <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">TechFix Login</h2>
          <div className="mb-4"><label className="block text-sm font-bold mb-2">Usuario</label><input name="username" type="text" required className="w-full border p-2 rounded" /></div>
          <div className="mb-6"><label className="block text-sm font-bold mb-2">Contraseña</label><input name="password" type="password" required className="w-full border p-2 rounded" /></div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded">Ingresar</button>
        </form>
      </div>
    );
  }

  const hasPerm = (p) => currentUser.permissions.includes('ALL') || currentUser.permissions.includes(p);
  const clientFiltered = (list) => currentUser.clientId === 'ALL' ? list : list.filter(x => x.clientId === currentUser.clientId || x.id === currentUser.clientId);

  return (
    <div className="flex h-screen bg-gray-100 flex-col md:flex-row overflow-hidden">
      <div className="w-full md:w-64 bg-blue-900 text-white flex flex-col">
        <div className="p-4 text-2xl font-bold border-b border-blue-800 text-center">TechFix</div>
        <div className="flex-1 overflow-y-auto">
          <button onClick={() => setActiveTab('tickets')} className={`w-full flex items-center p-4 hover:bg-blue-800 ${activeTab==='tickets'?'bg-blue-800':''}`}><TicketIcon className="mr-2"/> {labels.ticket}s</button>
          {hasPerm('ver_dashboard') && <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center p-4 hover:bg-blue-800 ${activeTab==='dashboard'?'bg-blue-800':''}`}><BarChart2 className="mr-2"/> Dashboard</button>}
          {hasPerm('ver_mapa') && <button onClick={() => setActiveTab('map')} className={`w-full flex items-center p-4 hover:bg-blue-800 ${activeTab==='map'?'bg-blue-800':''}`}><MapPin className="mr-2"/> Mapa</button>}
          {hasPerm('gestionar_ajustes') && <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center p-4 hover:bg-blue-800 ${activeTab==='settings'?'bg-blue-800':''}`}><SettingsIcon className="mr-2"/> Ajustes</button>}
        </div>
        <div className="p-4 border-t border-blue-800">
          <div className="mb-2 text-sm text-blue-300">User: {currentUser.name}</div>
          <button onClick={() => setCurrentUser(null)} className="w-full flex justify-center p-2 bg-red-600 rounded hover:bg-red-700"><LogOut size={16} className="mr-2"/> Salir</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {activeTab === 'tickets' && <TicketModule labels={labels} tickets={clientFiltered(tickets)} setTickets={setTickets} clients={clientFiltered(clients)} sedes={sedes} failureTypes={failureTypes} systemTypes={systemTypes} slaTargets={slaTargets} hasPerm={hasPerm} />}
        {activeTab === 'dashboard' && <DashboardModule labels={labels} tickets={clientFiltered(tickets)} clients={clientFiltered(clients)} sedes={sedes} />}
        {activeTab === 'map' && <MapModule users={users.filter(u => ['tecnico', 'técnico'].some(role => u.role.toLowerCase().includes(role)))} />}
        {activeTab === 'settings' && <SettingsModule labels={labels} setLabels={setLabels} clients={clients} setClients={setClients} sedes={sedes} setSedes={setSedes} failureTypes={failureTypes} setFailureTypes={setFailureTypes} systemTypes={systemTypes} setSystemTypes={setSystemTypes} slaTargets={slaTargets} setSlaTargets={setSlaTargets} users={users} setUsers={setUsers} currentUser={currentUser} />}
      </div>
    </div>
  );
}

function TicketModule({ labels, tickets, setTickets, clients, sedes, failureTypes, systemTypes, slaTargets, hasPerm }) {
  const [showForm, setShowForm] = useState(false);
  const [selClient, setSelClient] = useState('');
  
  const handleCreate = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    setTickets([...tickets, {
      id: Date.now(), clientId: fd.get('client'), sede: fd.get('sede'), failureType: fd.get('failureType'),
      systemType: fd.get('systemType'), sla: fd.get('sla'), desc: fd.get('desc'), status: 'Creado', createdAt: new Date().toISOString(), closedAt: null
    }]);
    setShowForm(false);
  };

  const handleStatus = (id, st) => {
    setTickets(tickets.map(t => t.id === id ? { ...t, status: st, closedAt: st === 'Cumplido' ? new Date().toISOString() : t.closedAt } : t));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestión de {labels.ticket}s</h2>
        {hasPerm('crear_ticket') && <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center"><Plus size={16} className="mr-2"/> Nuevo {labels.ticket}</button>}
      </div>
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded shadow mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-bold mb-1">{labels.client}</label>
            <select name="client" required onChange={(e)=>setSelClient(e.target.value)} className="w-full border p-2 rounded"><option value="">Seleccione...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </div>
          <div><label className="block text-sm font-bold mb-1">{labels.sede}</label>
            <input list="sedes-list" name="sede" required className="w-full border p-2 rounded" placeholder="Escriba para buscar..." />
            <datalist id="sedes-list">{sedes.filter(s => s.clientId == selClient).map(s => <option key={s.id} value={s.name} />)}</datalist>
          </div>
          <div><label className="block text-sm font-bold mb-1">{labels.failureType}</label>
            <select name="failureType" required className="w-full border p-2 rounded"><option value="">Seleccione...</option>{failureTypes.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}</select>
          </div>
          <div><label className="block text-sm font-bold mb-1">{labels.systemType}</label>
            <select name="systemType" required className="w-full border p-2 rounded"><option value="">Seleccione...</option>{systemTypes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select>
          </div>
          <div><label className="block text-sm font-bold mb-1">{labels.sla}</label>
            <select name="sla" required className="w-full border p-2 rounded"><option value="">Seleccione...</option>{slaTargets.map(s => <option key={s.id} value={s.days}>{s.name} ({s.days} días)</option>)}</select>
          </div>
          <div className="md:col-span-2"><label className="block text-sm font-bold mb-1">Descripción</label><textarea name="desc" required className="w-full border p-2 rounded"></textarea></div>
          <div className="md:col-span-2 flex justify-end"><button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Guardar</button></div>
        </form>
      )}
      <div className="grid gap-4">
        {tickets.map(t => {
          const cli = clients.find(c => c.id == t.clientId);
          return (
          <div key={t.id} className="bg-white p-4 rounded shadow border-l-4" style={{borderLeftColor: t.status==='Cumplido'?'green':t.status==='En Proceso'?'orange':'#3b82f6'}}>
            <div className="flex justify-between">
              <span className="font-bold text-lg flex items-center gap-2">
                {cli && <div className="w-3 h-3 rounded-full" style={{backgroundColor: cli.color}}></div>}
                #{t.id.toString().slice(-4)} - {t.sede}
              </span>
              <span className={`px-2 py-1 text-xs font-bold rounded ${t.status==='Cumplido'?'bg-green-100 text-green-800':'bg-blue-100 text-blue-800'}`}>{t.status}</span>
            </div>
            <p className="text-gray-600 text-sm mt-1">{t.desc}</p>
            <div className="mt-4 flex gap-2">
              {t.status !== 'Cumplido' && hasPerm('cerrar_ticket') && (
                <><button onClick={()=>handleStatus(t.id, 'En Proceso')} className="bg-orange-100 text-orange-800 px-3 py-1 rounded text-sm font-bold">Iniciar</button>
                  <button onClick={()=>handleStatus(t.id, 'Cumplido')} className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-bold">Cerrar</button></>
              )}
            </div>
          </div>
        )})}
        {tickets.length === 0 && <p className="text-gray-500">No hay registros.</p>}
      </div>
    </div>
  );
}

function DashboardModule({ labels, tickets, clients, sedes }) {
  const [f, setF] = useState({ month: '', client: '', sede: '', status: '' });
  const ft = tickets.filter(t => (!f.month || new Date(t.createdAt).getMonth() + 1 == f.month) && (!f.client || t.clientId == f.client) && (!f.sede || t.sede == f.sede) && (!f.status || t.status == f.status));
  const closed = ft.filter(t => t.status === 'Cumplido' && t.closedAt);
  const avgHrs = closed.length ? closed.reduce((acc, t) => acc + (new Date(t.closedAt) - new Date(t.createdAt))/(1000*60*60), 0) / closed.length : 0;
  const delayed = ft.filter(t => t.status === 'Retrasado').length;
  
  let rec = "El sistema opera con normalidad. ¡Buen trabajo!";
  if (delayed > 0) rec = `ALERTA: Hay ${delayed} tickets retrasados. Reasigne personal técnico o ajuste Tiempos Meta.`;
  else if (avgHrs > 48) rec = `ATENCIÓN: Tiempo promedio alto (${avgHrs.toFixed(1)} hrs). Revise cuellos de botella en sedes con más tickets.`;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className={`p-4 rounded shadow mb-6 text-white font-bold ${delayed>0?'bg-red-500':avgHrs>48?'bg-orange-500':'bg-green-500'}`}>IA Recomendación: {rec}</div>
      <div className="bg-white p-4 rounded shadow mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <select onChange={e=>setF({...f, month: e.target.value})} className="border p-2 rounded"><option value="">Meses</option><option value="1">Ene</option><option value="2">Feb</option></select>
        <select onChange={e=>setF({...f, client: e.target.value})} className="border p-2 rounded"><option value="">Clientes</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <input type="text" placeholder={`Filtrar ${labels.sede}`} onChange={e=>setF({...f, sede: e.target.value})} className="border p-2 rounded"/>
        <select onChange={e=>setF({...f, status: e.target.value})} className="border p-2 rounded"><option value="">Estados</option><option value="Creado">Creado</option><option value="Cumplido">Cumplido</option></select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded shadow text-center"><div className="text-4xl font-bold text-blue-600">{ft.length}</div><div className="text-gray-500">Total {labels.ticket}s</div></div>
        <div className="bg-white p-6 rounded shadow text-center"><div className="text-4xl font-bold text-green-600">{closed.length}</div><div className="text-gray-500">Cumplidos</div></div>
        <div className="bg-white p-6 rounded shadow text-center"><div className="text-4xl font-bold text-purple-600">{avgHrs.toFixed(1)} h</div><div className="text-gray-500">Tiempo Prom. Cierre</div></div>
      </div>
      <div className="bg-white p-4 rounded shadow h-80">
        <h3 className="text-lg font-bold mb-4 text-center">Tendencia Mensual</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={[{name:'Semana 1', Creados: 5, Cerrados: 3}, {name:'Semana 2', Creados: ft.length, Cerrados: closed.length}]}>
            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend />
            <Line type="monotone" dataKey="Creados" stroke="#3b82f6" strokeWidth={3} /><Line type="monotone" dataKey="Cerrados" stroke="#10b981" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MapModule({ users }) {
  const defaultCenter = [4.6097, -74.0817];
  return (
    <div className="h-full flex flex-col"><h2 className="text-2xl font-bold mb-4">Ubicación Técnicos</h2>
      <div className="flex-1 bg-white p-2 rounded shadow overflow-hidden relative">
        <MapContainer center={defaultCenter} zoom={12} scrollWheelZoom={false} style={{height: '100%', width: '100%'}}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {users.map((u, i) => (
            <Marker key={u.id} position={[defaultCenter[0] + (i*0.01), defaultCenter[1] + (i*0.01)]}>
              <Popup><b>{u.name}</b><br/>Técnico</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

function SettingsModule({ labels, setLabels, clients, setClients, sedes, setSedes, failureTypes, setFailureTypes, systemTypes, setSystemTypes, slaTargets, setSlaTargets, users, setUsers, currentUser }) {
  const [subTab, setSubTab] = useState('clients');
  const add = (list, setList, e, extra = {}) => {
    e.preventDefault(); const fd = new FormData(e.target);
    const n = { id: Date.now().toString(), name: fd.get('name') };
    for(let k in extra) n[k] = fd.get(k) || extra[k];
    if(subTab === 'users') {
      n.permissions = ['crear_ticket', 'ver_dashboard', 'gestionar_ajustes', 'ver_mapa', 'cerrar_ticket'].filter(p => fd.get(p));
    }
    setList([...list, n]); e.target.reset();
  };
  const rm = (list, setList, id) => setList(list.filter(x => x.id !== id));

  return (
    <div><h2 className="text-2xl font-bold mb-6">Ajustes</h2>
      <div className="flex flex-wrap gap-2 mb-6">
        {[{id:'clients', n:labels.client}, {id:'sedes', n:labels.sede}, {id:'users', n:labels.user}, {id:'ft', n:labels.failureType}, {id:'st', n:labels.systemType}, {id:'sla', n:labels.sla}, {id:'labels', n:'Nombres'}].map(t => (
          <button key={t.id} onClick={()=>setSubTab(t.id)} className={`px-4 py-2 rounded font-bold ${subTab===t.id?'bg-blue-600 text-white':'bg-white text-gray-700 shadow'}`}>{t.n}</button>
        ))}
      </div>
      <div className="bg-white p-6 rounded shadow">
        {subTab === 'clients' && (
          <div><form onSubmit={e=>add(clients, setClients, e, {color:'#3b82f6', logo:''})} className="flex gap-4 items-end mb-6">
            <div className="flex-1"><label className="block text-sm font-bold">Nombre {labels.client}</label><input name="name" required className="w-full border p-2 rounded" /></div>
            <div><label className="block text-sm font-bold">Color</label><input type="color" name="color" className="w-16 h-10 border p-1 rounded" /></div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
          </form><ul>{clients.map(c => <li key={c.id} className="flex justify-between p-2 border-b"><span className="flex items-center gap-2"><div className="w-4 h-4 rounded-full" style={{backgroundColor: c.color}}></div>{c.name}</span><button onClick={()=>rm(clients, setClients, c.id)} className="text-red-500"><Trash2 size={16}/></button></li>)}</ul></div>
        )}
        {subTab === 'sedes' && (
          <div><form onSubmit={e=>add(sedes, setSedes, e, {clientId:''})} className="flex gap-4 items-end mb-6">
            <div className="flex-1"><label className="block text-sm font-bold">Nombre {labels.sede}</label><input name="name" required className="w-full border p-2 rounded" /></div>
            <div className="flex-1"><label className="block text-sm font-bold">{labels.client}</label><select name="clientId" required className="w-full border p-2 rounded"><option value="">Seleccione...</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
          </form><ul>{sedes.map(c => <li key={c.id} className="flex justify-between p-2 border-b">{c.name} <button onClick={()=>rm(sedes, setSedes, c.id)} className="text-red-500"><Trash2 size={16}/></button></li>)}</ul></div>
        )}
        {subTab === 'users' && (
          <div><form onSubmit={e=>add(users, setUsers, e, {username:'', password:'', role:'', clientId:'ALL'})} className="grid grid-cols-2 gap-4 mb-6 border-b pb-6">
            <div><label className="block text-sm font-bold">Nombre</label><input name="name" required className="w-full border p-2 rounded" /></div>
            <div><label className="block text-sm font-bold">Usuario</label><input name="username" required className="w-full border p-2 rounded" /></div>
            <div><label className="block text-sm font-bold">Contraseña</label><input name="password" required className="w-full border p-2 rounded" /></div>
            <div><label className="block text-sm font-bold">Rol</label><input name="role" required className="w-full border p-2 rounded" /></div>
            <div className="col-span-2"><label className="block text-sm font-bold">{labels.client} (Aislamiento)</label><select name="clientId" required className="w-full border p-2 rounded"><option value="ALL">Acceso Total</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="col-span-2"><label className="block text-sm font-bold mb-2">Permisos Múltiples</label><div className="flex flex-wrap gap-4">{['crear_ticket', 'ver_dashboard', 'gestionar_ajustes', 'ver_mapa', 'cerrar_ticket'].map(p=><label key={p} className="flex items-center gap-1 cursor-pointer bg-gray-100 p-2 rounded"><input type="checkbox" name={p} value="1" /> {p.replace('_', ' ').toUpperCase()}</label>)}</div></div>
            <div className="col-span-2 flex justify-end"><button className="bg-blue-600 text-white px-4 py-2 rounded">Add</button></div>
          </form><ul>{users.map(c => <li key={c.id} className="flex justify-between p-2 border-b"><div><b>{c.name}</b> ({c.role})</div> {c.id!==1 && <button onClick={()=>rm(users, setUsers, c.id)} className="text-red-500"><Trash2 size={16}/></button>}</li>)}</ul></div>
        )}
        {subTab === 'ft' && (
          <div><form onSubmit={e=>add(failureTypes, setFailureTypes, e)} className="flex gap-4 items-end mb-6"><div className="flex-1"><label className="block text-sm font-bold">Nombre {labels.failureType}</label><input name="name" required className="w-full border p-2 rounded" /></div><button className="bg-blue-600 text-white px-4 py-2 rounded">Add</button></form><ul>{failureTypes.map(c => <li key={c.id} className="flex justify-between p-2 border-b">{c.name} <button onClick={()=>rm(failureTypes, setFailureTypes, c.id)} className="text-red-500"><Trash2 size={16}/></button></li>)}</ul></div>
        )}
        {subTab === 'st' && (
          <div><form onSubmit={e=>add(systemTypes, setSystemTypes, e)} className="flex gap-4 items-end mb-6"><div className="flex-1"><label className="block text-sm font-bold">Nombre {labels.systemType}</label><input name="name" required className="w-full border p-2 rounded" /></div><button className="bg-blue-600 text-white px-4 py-2 rounded">Add</button></form><ul>{systemTypes.map(c => <li key={c.id} className="flex justify-between p-2 border-b">{c.name} <button onClick={()=>rm(systemTypes, setSystemTypes, c.id)} className="text-red-500"><Trash2 size={16}/></button></li>)}</ul></div>
        )}
        {subTab === 'sla' && (
          <div><form onSubmit={e=>add(slaTargets, setSlaTargets, e, {days:1})} className="flex gap-4 items-end mb-6"><div className="flex-1"><label className="block text-sm font-bold">Nombre {labels.sla}</label><input name="name" required className="w-full border p-2 rounded" /></div><div className="flex-1"><label className="block text-sm font-bold">Días</label><input type="number" name="days" required className="w-full border p-2 rounded" /></div><button className="bg-blue-600 text-white px-4 py-2 rounded">Add</button></form><ul>{slaTargets.map(c => <li key={c.id} className="flex justify-between p-2 border-b">{c.name} - <b>{c.days} días</b> <button onClick={()=>rm(slaTargets, setSlaTargets, c.id)} className="text-red-500"><Trash2 size={16}/></button></li>)}</ul></div>
        )}
        {subTab === 'labels' && (
          <div className="grid grid-cols-2 gap-4">{Object.keys(labels).map(k => (<div key={k}><label className="block text-sm font-bold">Etiqueta "{k}"</label><input value={labels[k]} onChange={e=>setLabels({...labels, [k]: e.target.value})} className="w-full border p-2 rounded bg-yellow-50" /></div>))}</div>
        )}
      </div>
    </div>
  );
}
