import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { io, Socket } from 'socket.io-client';
import { LogOut, PlusCircle, Activity, X } from 'lucide-react';
import axios from 'axios';

// 1. VARIABLE INTELIGENTE AÑADIDA AQUÍ
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Reporte {
  id: number;
  asunto: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  createdAt: string;
}

const Dashboard = () => {
  const { user, logout, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchReportes = async () => {
    try {
      // 2. URL DINÁMICA APLICADA AQUÍ
      const response = await axios.get(`${API_URL}/api/reportes/mis-reportes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportes(response.data);
    } catch (err) {
      console.error('Error fetching reportes', err);
    }
  };

  const formatFolio = (id: number) => `Folio #${id.toString().padStart(4, '0')}`;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchReportes();

    // 3. URL DINÁMICA APLICADA AL SOCKET AQUÍ
    const newSocket = io(API_URL, {
      query: { token }
    });

    newSocket.on('reporteActualizado', (reporteActualizado: Reporte) => {
      setReportes((prev) => prev.map(r => r.id === reporteActualizado.id ? reporteActualizado : r));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user, navigate, token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateReporte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asunto || !descripcion) {
      setError('Por favor llena todos los campos.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // 4. URL DINÁMICA APLICADA AQUÍ
      await axios.post(`${API_URL}/api/reportes`, { asunto, descripcion }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsModalOpen(false);
      setAsunto('');
      setDescripcion('');
      fetchReportes(); // Reload reportes
    } catch (err) {
      setError('Ocurrió un error al crear el reporte.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (estado: string) => {
    switch(estado) {
      case 'Pendiente': return { bg: '#FEF3C7', color: '#92400E' };
      case 'En Proceso': return { bg: '#DBEAFE', color: '#1E40AF' };
      case 'Resuelto': return { bg: '#D1FAE5', color: '#065F46' };
      case 'Cancelado': return { bg: '#FEE2E2', color: '#991B1B' };
      default: return { bg: '#F3F4F6', color: '#374151' };
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="header-bar">
        <div className="header-title">
          <Activity size={24} />
          <span>Ventanilla <span className="gold-accent">Digital</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ fontWeight: 500, opacity: 0.9 }}>Hola, {user?.nombre}</span>
          <button onClick={handleLogout} className="btn" style={{ padding: '0.5rem 1rem', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
            <LogOut size={18} style={{ marginRight: '0.5rem' }} /> Salir
          </button>
        </div>
      </header>
      
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--color-guinda-dark)', fontWeight: 700 }}>Mis Reportes</h1>
          {user?.type === 'usuario' && (
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(true)}>
              <PlusCircle size={18} style={{ marginRight: '0.5rem' }} /> Nuevo Reporte
            </button>
          )}
        </div>
        
        {reportes.length === 0 ? (
          <div className="glass-panel animate-fade-in" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--color-texto-secundario)' }}>
            <Activity size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
            <p style={{ fontSize: '1.125rem' }}>No tienes reportes generados aún.</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Haz clic en "Nuevo Reporte" para comenzar.</p>
          </div>
        ) : (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {reportes.map((rep) => {
              const statusStyle = getStatusColor(rep.estado);
              return (
                <div key={rep.id} className="glass-panel hover-lift" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontWeight: 600, color: 'var(--color-guinda)', margin: 0, fontSize: '1.1rem' }}>{formatFolio(rep.id)} - {rep.asunto}</h3>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '9999px', 
                      fontSize: '0.75rem', 
                      fontWeight: 600,
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color
                    }}>
                      {rep.estado}
                    </span>
                  </div>
                  <p style={{ color: 'var(--color-texto-secundario)', fontSize: '0.9rem', flex: 1, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {rep.descripcion}
                  </p>
                  <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1rem', fontSize: '0.8rem', color: '#9CA3AF', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{new Date(rep.createdAt).toLocaleDateString()}</span>
                    <span>Prioridad: <strong style={{ color: rep.prioridad === 'Alta' ? '#991B1B' : rep.prioridad === 'Media' ? '#D97706' : '#059669' }}>{rep.prioridad}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal Nuevo Reporte */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
          padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ backgroundColor: '#fff', width: '100%', maxWidth: '500px', padding: '2rem', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: 'var(--color-guinda)', fontSize: '1.5rem', fontWeight: 600 }}>Crear Nuevo Reporte</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-texto-secundario)', padding: '0.25rem' }}>
                <X size={24} />
              </button>
            </div>

            {error && (
              <div style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '0.75rem', borderRadius: 'var(--border-radius)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateReporte}>
              <div className="form-group">
                <label className="form-label">Asunto</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  placeholder="Ej. Falla en alumbrado público"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción Detallada</label>
                <textarea 
                  className="form-control" 
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={4}
                  placeholder="Proporciona detalles sobre el problema, ubicación, etc."
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)} style={{ backgroundColor: '#F3F4F6', color: '#4B5563' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Enviando...' : 'Enviar Reporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;