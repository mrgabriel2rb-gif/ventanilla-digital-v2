import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { LogOut, ShieldAlert, Users, History, Eye, X, Check } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

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

const getStatusColor = (estado: string) => {
  switch(estado) {
    case 'Pendiente': return { bg: '#FEF3C7', color: '#92400E' };
    case 'En Proceso': return { bg: '#DBEAFE', color: '#1E40AF' };
    case 'Resuelto': return { bg: '#D1FAE5', color: '#065F46' };
    case 'Cancelado': return { bg: '#FEE2E2', color: '#991B1B' };
    default: return { bg: '#F3F4F6', color: '#374151' };
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
    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
      <td style={{ padding: '1rem', fontWeight: 600 }}>{formatFolio(reporte.id)}</td>
      <td style={{ padding: '1rem', maxWidth: '200px' }}>
        <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{reporte.asunto}</div>
      </td>
      <td style={{ padding: '1rem' }}>
        <select 
          value={estado} 
          onChange={(e) => handleSelectChange(setEstado, e.target.value)}
          className="form-control" style={{ padding: '0.4rem', fontSize: '0.85rem', backgroundColor: getStatusColor(estado).bg, color: getStatusColor(estado).color, fontWeight: 600, border: '1px solid transparent' }}
        >
          <option value="Pendiente">Pendiente</option>
          <option value="En Proceso">En Proceso</option>
          <option value="Resuelto">Resuelto</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </td>
      <td style={{ padding: '1rem' }}>
        <select 
          value={prioridad} 
          onChange={(e) => handleSelectChange(setPrioridad, e.target.value)}
          className="form-control" style={{ padding: '0.4rem', fontSize: '0.85rem' }}
        >
          <option value="Baja">Baja</option>
          <option value="Media">Media</option>
          <option value="Alta">Alta</option>
        </select>
      </td>
      <td style={{ padding: '1rem' }}>
        <select 
          value={dependencia} 
          onChange={(e) => handleSelectChange(setDependencia, e.target.value)}
          className="form-control" style={{ padding: '0.4rem', fontSize: '0.85rem', width: '180px' }}
        >
          <option value="">Seleccionar...</option>
          <option value="Obras Públicas">Obras Públicas</option>
          <option value="Servicios Públicos">Servicios Públicos</option>
          <option value="SMAPAC (Agua Potable)">SMAPAC (Agua Potable)</option>
          <option value="Tránsito">Tránsito</option>
        </select>
      </td>
      <td style={{ padding: '1rem', textAlign: 'center' }}>
        {isModified ? (
          <button 
            onClick={handleApply}
            disabled={isSaving}
            style={{ padding: '0.4rem 0.8rem', backgroundColor: 'var(--color-dorado)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <Check size={16} /> Aplicar
          </button>
        ) : (
          <span style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)' }}>-</span>
        )}
      </td>
      <td style={{ padding: '1rem' }}>
        <button 
          onClick={() => onViewDetails(reporte)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-guinda)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}
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
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminNombre, setNewAdminNombre] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [registerMsg, setRegisterMsg] = useState('');

  const [selectedReporte, setSelectedReporte] = useState<Reporte | null>(null);

  const fetchReportes = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/admin/reportes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportes(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/admin/audit', {
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

    const newSocket = io('http://localhost:3000', {
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
    await axios.put(`http://localhost:3000/api/admin/reportes/${id}`, { estado, prioridad, dependencia }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  };

  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/admin/register', {
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="header-bar">
        <div className="header-title">
          <ShieldAlert size={24} />
          <span>Ventanilla <span className="gold-accent">Admin</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ fontWeight: 500, opacity: 0.9 }}>Hola, {user?.nombre} ({user?.role})</span>
          <button onClick={() => { logout(); navigate('/login'); }} className="btn" style={{ padding: '0.5rem 1rem', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
            <LogOut size={18} style={{ marginRight: '0.5rem' }} /> Salir
          </button>
        </div>
      </header>
      
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => setActiveTab('reportes')} className={`btn ${activeTab === 'reportes' ? 'btn-primary' : 'glass-panel'}`} style={activeTab !== 'reportes' ? { color: 'var(--color-texto)'} : {}}>
            Gestión de Reportes
          </button>
          {user?.role === 'SuperAdmin' && (
            <>
              <button onClick={() => setActiveTab('auditoria')} className={`btn ${activeTab === 'auditoria' ? 'btn-primary' : 'glass-panel'}`} style={activeTab !== 'auditoria' ? { color: 'var(--color-texto)'} : {}}>
                <History size={18} style={{ marginRight: '0.5rem' }}/> Auditoría
              </button>
              <button onClick={() => setActiveTab('registro')} className={`btn ${activeTab === 'registro' ? 'btn-primary' : 'glass-panel'}`} style={activeTab !== 'registro' ? { color: 'var(--color-texto)'} : {}}>
                <Users size={18} style={{ marginRight: '0.5rem' }}/> Registrar Admin
              </button>
            </>
          )}
        </div>

        {activeTab === 'reportes' && (
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
            <h2 style={{ color: 'var(--color-guinda-dark)', marginBottom: '1.5rem' }}>Todos los Reportes</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-dorado)' }}>
                    <th style={{ padding: '1rem', color: 'var(--color-texto-secundario)' }}>Folio</th>
                    <th style={{ padding: '1rem', color: 'var(--color-texto-secundario)' }}>Asunto</th>
                    <th style={{ padding: '1rem', color: 'var(--color-texto-secundario)' }}>Estado</th>
                    <th style={{ padding: '1rem', color: 'var(--color-texto-secundario)' }}>Prioridad</th>
                    <th style={{ padding: '1rem', color: 'var(--color-texto-secundario)' }}>Dependencia</th>
                    <th style={{ padding: '1rem', color: 'var(--color-texto-secundario)', textAlign: 'center' }}>Acciones</th>
                    <th style={{ padding: '1rem', color: 'var(--color-texto-secundario)' }}>Detalles</th>
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
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
            <h2 style={{ color: 'var(--color-guinda-dark)', marginBottom: '1.5rem' }}>Historial de Cambios (Audit Logs)</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-dorado)' }}>
                    <th style={{ padding: '1rem' }}>ID</th>
                    <th style={{ padding: '1rem' }}>Fecha</th>
                    <th style={{ padding: '1rem' }}>Admin</th>
                    <th style={{ padding: '1rem' }}>Acción</th>
                    <th style={{ padding: '1rem' }}>Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '1rem' }}>{log.id}</td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{new Date(log.createdAt).toLocaleString()}</td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{log.admin.nombre}</td>
                      <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-guinda)' }}>{log.accion}</td>
                      <td style={{ padding: '1rem' }}>{log.detalles}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'registro' && user?.role === 'SuperAdmin' && (
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '500px' }}>
            <h2 style={{ color: 'var(--color-guinda-dark)', marginBottom: '1.5rem' }}>Registrar Administrador</h2>
            {registerMsg && (
              <div style={{ backgroundColor: registerMsg.includes('exitosamente') ? '#D1FAE5' : '#FEE2E2', color: registerMsg.includes('exitosamente') ? '#065F46' : '#991B1B', padding: '0.75rem', borderRadius: 'var(--border-radius)', marginBottom: '1.5rem' }}>
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
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
          padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ backgroundColor: '#fff', width: '100%', maxWidth: '600px', padding: '2rem', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, color: 'var(--color-guinda)', fontSize: '1.5rem', fontWeight: 700 }}>{formatFolio(selectedReporte.id)}</h2>
                <div style={{ color: 'var(--color-texto-secundario)', marginTop: '0.25rem' }}>{new Date(selectedReporte.createdAt).toLocaleString()}</div>
              </div>
              <button onClick={() => setSelectedReporte(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-texto-secundario)', padding: '0.25rem' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-guinda-dark)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Información del Ciudadano</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                  <div><strong>Nombre:</strong> {selectedReporte.usuario.nombre}</div>
                  <div><strong>Teléfono:</strong> {selectedReporte.usuario.telefono}</div>
                  <div style={{ gridColumn: '1 / -1' }}><strong>Email:</strong> {selectedReporte.usuario.email}</div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-guinda-dark)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detalles del Reporte</h4>
                <div style={{ backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                  <div style={{ marginBottom: '0.75rem' }}><strong>Asunto:</strong> {selectedReporte.asunto}</div>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Descripción:</strong>
                    <p style={{ margin: '0.5rem 0 0 0', color: 'var(--color-texto-secundario)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{selectedReporte.descripcion}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '2rem', borderTop: '1px solid #E5E7EB', paddingTop: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <strong>Estado: </strong> 
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600, backgroundColor: getStatusColor(selectedReporte.estado).bg, color: getStatusColor(selectedReporte.estado).color }}>
                        {selectedReporte.estado}
                      </span>
                    </div>
                    <div>
                      <strong>Prioridad: </strong>
                      <span style={{ fontWeight: 600, color: selectedReporte.prioridad === 'Alta' ? '#991B1B' : selectedReporte.prioridad === 'Media' ? '#D97706' : '#059669' }}>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
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
