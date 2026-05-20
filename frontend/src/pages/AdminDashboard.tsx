import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { LogOut, ShieldAlert, Users, History, Eye, X, Check } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

// 1. VARIABLE INTELIGENTE RESTAURADA AQUÍ
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Reporte {
  id: number;
  asunto: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  dependencia?: string;
  createdAt: string;
  usuario: { nombre: string; email: string; telefono: string };
}

interface AuditLog {
  id: number;
  accion: string;
  entidad: string;
  detalles: string;
  createdAt: string;
  admin: { nombre: string; email: string; role: string };
}

const formatFolio = (id: number) => `Folio #${id.toString().padStart(4, '0')}`;

const getStatusClass = (estado: string) => {
  switch(estado) {
    case 'Pendiente': return 'status-pendiente';
    case 'En Proceso': return 'status-proceso';
    case 'Resuelto': return 'status-resuelto';
    case 'Cancelado': return 'status-cancelado';
    default: return 'status-default';
  }
};

const getPriorityClass = (prioridad: string) => {
  switch(prioridad) {
    case 'Alta': return 'priority-alta';
    case 'Media': return 'priority-media';
    case 'Baja': return 'priority-baja';
    default: return '';
  }
};

const ReporteRow = ({ 
  reporte, 
  onSave, 
  onViewDetails 
}: { 
  reporte: Reporte, 
  onSave: (id: number, estado: string, prioridad: string, dependencia: string) => Promise<void>,
  onViewDetails: (reporte: Reporte) => void 
}) => {
  const [estado, setEstado] = useState(reporte.estado);
  const [prioridad, setPrioridad] = useState(reporte.prioridad);
  const [dependencia, setDependencia] = useState(reporte.dependencia || '');
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEstado(reporte.estado);
    setPrioridad(reporte.prioridad);
    setDependencia(reporte.dependencia || '');
    setIsModified(false);
  }, [reporte]);

  const handleSelectChange = (setter: any, val: string) => {
    setter(val);
    setIsModified(true); 
  };

  const handleApply = async () => {
    if (window.confirm('¿Estás seguro de aplicar este cambio?')) {
      setIsSaving(true);
      try {
        await onSave(reporte.id, estado, prioridad, dependencia);
        setIsModified(false);
      } catch (err) {
        setEstado(reporte.estado);
        setPrioridad(reporte.prioridad);
        setDependencia(reporte.dependencia || '');
        setIsModified(false);
      } finally {
        setIsSaving(false);
      }
    } else {
      setEstado(reporte.estado);
      setPrioridad(reporte.prioridad);
      setDependencia(reporte.dependencia || '');
      setIsModified(false);
    }
  };

  return (
    <tr className="border-b-light">
      <td className="cell-p font-semibold">{formatFolio(reporte.id)}</td>
      <td className="cell-p max-w-400">
        <div className="font-medium truncate-1">{reporte.asunto}</div>
      </td>
      <td className="cell-p">
        <select 
          value={estado} 
          onChange={(e) => handleSelectChange(setEstado, e.target.value)}
          className={`form-control py-04 px-08 text-sm font-semibold border-transparent ${getStatusClass(estado)}`}
        >
          <option value="Pendiente">Pendiente</option>
          <option value="En Proceso">En Proceso</option>
          <option value="Resuelto">Resuelto</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </td>
      <td className="cell-p">
        <select 
          value={prioridad} 
          onChange={(e) => handleSelectChange(setPrioridad, e.target.value)}
          className="form-control py-04 px-08 text-sm"
        >
          <option value="Baja">Baja</option>
          <option value="Media">Media</option>
          <option value="Alta">Alta</option>
        </select>
      </td>
      <td className="cell-p">
        <select 
          value={dependencia} 
          onChange={(e) => handleSelectChange(setDependencia, e.target.value)}
          className="form-control py-04 px-08 text-sm col-dependencia"
        >
          <option value="">Seleccionar...</option>
          <option value="Obras Públicas">Obras Públicas</option>
          <option value="Servicios Públicos">Servicios Públicos</option>
          <option value="SMAPAC (Agua Potable)">SMAPAC (Agua Potable)</option>
          <option value="Tránsito">Tránsito</option>
        </select>
      </td>
      <td className="cell-p text-center">
        {isModified ? (
          <button 
            onClick={handleApply}
            disabled={isSaving}
            className="btn-apply"
          >
            <Check size={16} /> Aplicar
          </button>
        ) : (
          <span className="text-sm text-secondary">-</span>
        )}
      </td>
      <td className="cell-p">
        <button 
          onClick={() => onViewDetails(reporte)}
          className="btn-action-icon text-guinda"
        >
          <Eye size={18} /> Detalles
        </button>
      </td>
    </tr>
  );
};


const AdminDashboard = () => {
  const { user, logout, token } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  
  const [activeTab, setActiveTab] = useState<'reportes'|'auditoria'|'registro'>('reportes');
  
  // 2. COMA RESTAURADA PARA EVITAR ERROR EN NETLIFY
  const [, setSocket] = useState<Socket | null>(null);
  
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminNombre, setNewAdminNombre] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [registerMsg, setRegisterMsg] = useState('');

  const [selectedReporte, setSelectedReporte] = useState<Reporte | null>(null);

  const fetchReportes = async () => {
    try {
      // 3. URL DINÁMICA
      const res = await axios.get(`${API_URL}/api/admin/reportes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportes(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchLogs = async () => {
    try {
      // 4. URL DINÁMICA
      const res = await axios.get(`${API_URL}/api/admin/audit`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      navigate('/login');
      return;
    }
    
    fetchReportes();
    
    if (user.role === 'SuperAdmin') {
      fetchLogs();
    }

    // 5. URL DINÁMICA (SOCKET)
    const newSocket = io(API_URL, {
      query: { token }
    });

    newSocket.on('reporteActualizado', (reporteActualizado: Reporte) => {
      setReportes(prev => prev.map(r => r.id === reporteActualizado.id ? reporteActualizado : r));
      if (user.role === 'SuperAdmin') {
         fetchLogs();
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user, navigate, token]);

  const updateReporteValues = async (id: number, estado: string, prioridad: string, dependencia: string) => {
    // 6. URL DINÁMICA
    await axios.put(`${API_URL}/api/admin/reportes/${id}`, { estado, prioridad, dependencia }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  };

  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 7. URL DINÁMICA
      await axios.post(`${API_URL}/api/admin/register`, {
        nombre: newAdminNombre,
        email: newAdminEmail,
        password: newAdminPassword
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setRegisterMsg('¡Administrador registrado exitosamente!');
      setNewAdminNombre(''); setNewAdminEmail(''); setNewAdminPassword('');
      setTimeout(() => setRegisterMsg(''), 3000);
    } catch (err: any) {
      setRegisterMsg(err.response?.data?.error || 'Error al registrar.');
    }
  };

  return (
    <div className="min-h-screen flex-col">
      <header className="header-bar">
        <div className="header-title">
          <ShieldAlert size={24} />
          <span>Ventanilla <span className="gold-accent">Admin</span></span>
        </div>
        <div className="flex items-center gap-15">
          <span className="font-medium opacity-90">Hola, {user?.nombre} ({user?.role})</span>
          <button onClick={() => { logout(); navigate('/login'); }} className="btn bg-white-10 text-white border-white-20 py-04 px-1">
            <LogOut size={18} className="mr-05" /> Salir
          </button>
        </div>
      </header>
      
      <main className="flex-1 p-2 max-w-1400 mx-auto w-full">
        <div className="flex gap-1 mb-2">
          <button onClick={() => setActiveTab('reportes')} className={`btn ${activeTab === 'reportes' ? 'btn-primary' : 'glass-panel text-primary'}`}>
            Gestión de Reportes
          </button>
          {user?.role === 'SuperAdmin' && (
            <>
              <button onClick={() => setActiveTab('auditoria')} className={`btn ${activeTab === 'auditoria' ? 'btn-primary' : 'glass-panel text-primary'}`}>
                <History size={18} className="mr-05"/> Auditoría
              </button>
              <button onClick={() => setActiveTab('registro')} className={`btn ${activeTab === 'registro' ? 'btn-primary' : 'glass-panel text-primary'}`}>
                <Users size={18} className="mr-05"/> Registrar Admin
              </button>
            </>
          )}
        </div>

        {activeTab === 'reportes' && (
          <div className="glass-panel animate-fade-in p-2">
            <h2 className="text-guinda-dark mb-15">Todos los Reportes</h2>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr className="border-b-gold">
                    <th className="cell-p text-secondary">Folio</th>
                    <th className="cell-p text-secondary">Asunto</th>
                    <th className="cell-p text-secondary">Estado</th>
                    <th className="cell-p text-secondary">Prioridad</th>
                    <th className="cell-p text-secondary">Dependencia</th>
                    <th className="cell-p text-secondary text-center">Acciones</th>
                    <th className="cell-p text-secondary">Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {reportes.map(rep => (
                    <ReporteRow 
                      key={rep.id} 
                      reporte={rep} 
                      onSave={updateReporteValues} 
                      onViewDetails={setSelectedReporte}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'auditoria' && user?.role === 'SuperAdmin' && (
          <div className="glass-panel animate-fade-in p-2">
            <h2 className="text-guinda-dark mb-15">Historial de Cambios (Audit Logs)</h2>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr className="border-b-gold">
                    <th className="cell-p">ID</th>
                    <th className="cell-p">Fecha</th>
                    <th className="cell-p">Admin</th>
                    <th className="cell-p">Acción</th>
                    <th className="cell-p">Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b-light">
                      <td className="cell-p">{log.id}</td>
                      <td className="cell-p text-sm">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="cell-p font-semibold">{log.admin.nombre}</td>
                      <td className="cell-p font-semibold text-guinda">{log.accion}</td>
                      <td className="cell-p">{log.detalles}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'registro' && user?.role === 'SuperAdmin' && (
          <div className="glass-panel animate-fade-in p-2 max-w-500">
            <h2 className="text-guinda-dark mb-15">Registrar Administrador</h2>
            {registerMsg && (
              <div className={`alert ${registerMsg.includes('exitosamente') ? 'alert-success' : 'alert-error'}`}>
                {registerMsg}
              </div>
            )}
            <form onSubmit={handleRegisterAdmin}>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input required type="text" className="form-control" value={newAdminNombre} onChange={e=>setNewAdminNombre(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input required type="email" className="form-control" value={newAdminEmail} onChange={e=>setNewAdminEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña Temporal</label>
                <input required type="password" className="form-control" value={newAdminPassword} onChange={e=>setNewAdminPassword(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-secondary">Crear Admin</button>
            </form>
          </div>
        )}
      </main>

      {/* Modal Detalles del Reporte */}
      {selectedReporte && (
        <div className="modal-overlay">
          <div className="glass-panel animate-fade-in bg-white w-full max-w-600 p-2 rounded-lg shadow-modal">
            <div className="flex-start mb-15 border-b-light pb-1">
              <div>
                <h2 className="m-0 text-guinda text-xl font-bold">{formatFolio(selectedReporte.id)}</h2>
                <div className="text-secondary mt-025">{new Date(selectedReporte.createdAt).toLocaleString()}</div>
              </div>
              <button onClick={() => setSelectedReporte(null)} className="bg-transparent border-none cursor-pointer text-secondary p-025">
                <X size={24} />
              </button>
            </div>

            <div className="flex-col gap-15">
              <div>
                <h4 className="m-0 mb-05 text-guinda-dark text-sm uppercase tracking-wide">Información del Ciudadano</h4>
                <div className="grid-2-col bg-light p-1 rounded-md border-light">
                  <div><strong>Nombre:</strong> {selectedReporte.usuario.nombre}</div>
                  <div><strong>Teléfono:</strong> {selectedReporte.usuario.telefono}</div>
                  <div className="col-span-full"><strong>Email:</strong> {selectedReporte.usuario.email}</div>
                </div>
              </div>

              <div>
                <h4 className="m-0 mb-05 text-guinda-dark text-sm uppercase tracking-wide">Detalles del Reporte</h4>
                <div className="bg-light p-1 rounded-md border-light">
                  <div className="mb-05"><strong>Asunto:</strong> {selectedReporte.asunto}</div>
                  <div className="mb-1">
                    <strong>Descripción:</strong>
                    <p className="m-0 mt-05 text-secondary pre-wrap">{selectedReporte.descripcion}</p>
                  </div>
                  <div className="flex gap-2 border-t-light pt-1 flex-wrap">
                    <div>
                      <strong>Estado: </strong> 
                      <span className={`py-02 px-06 rounded-full text-xs font-semibold ${getStatusClass(selectedReporte.estado)}`}>
                        {selectedReporte.estado}
                      </span>
                    </div>
                    <div>
                      <strong>Prioridad: </strong>
                      <span className={`font-semibold ${getPriorityClass(selectedReporte.prioridad)}`}>
                        {selectedReporte.prioridad}
                      </span>
                    </div>
                    <div>
                      <strong>Dependencia: </strong>
                      <span>{selectedReporte.dependencia || 'No asignada'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedReporte(null)}>
                Cerrar Detalles
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;