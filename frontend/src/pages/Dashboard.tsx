import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { io, Socket } from 'socket.io-client';
import { LogOut, PlusCircle, Activity, X } from 'lucide-react';
import axios from 'axios';

// 1. VARIABLE INTELIGENTE RESTAURADA AQUÍ
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
  
  // 2. COMA RESTAURADA PARA EVITAR ERROR EN NETLIFY
  const [, setSocket] = useState<Socket | null>(null);
  
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchReportes = async () => {
    try {
      // 3. URL DINÁMICA
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

    // 4. URL DINÁMICA (SOCKET)
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
      // 5. URL DINÁMICA
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

  return (
    <div className="min-h-screen flex-col">
      <header className="header-bar">
        <div className="header-title">
          <Activity size={24} />
          <span>Ventanilla <span className="gold-accent">Digital</span></span>
        </div>
        <div className="flex items-center gap-15">
          <span className="font-medium opacity-90">Hola, {user?.nombre}</span>
          <button onClick={handleLogout} className="btn bg-white-10 text-white border-white-20 py-04 px-1">
            <LogOut size={18} className="mr-05" /> Salir
          </button>
        </div>
      </header>
      
      <main className="flex-1 p-2 max-w-1200 mx-auto w-full">
        <div className="flex-between mb-2">
          <h1 className="text-2xl text-guinda-dark font-bold">Mis Reportes</h1>
          {user?.type === 'usuario' && (
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(true)}>
              <PlusCircle size={18} className="mr-05" /> Nuevo Reporte
            </button>
          )}
        </div>
        
        {reportes.length === 0 ? (
          <div className="glass-panel animate-fade-in p-4-2 text-center text-secondary">
            <Activity size={48} className="opacity-20 mx-auto mb-1" />
            <p className="text-lg">No tienes reportes generados aún.</p>
            <p className="text-sm mt-05">Haz clic en "Nuevo Reporte" para comenzar.</p>
          </div>
        ) : (
          <div className="animate-fade-in reportes-grid">
            {reportes.map((rep) => (
              <div key={rep.id} className="glass-panel hover-lift p-15 flex-col gap-1">
                <div className="flex-start">
                  <h3 className="font-semibold text-guinda m-0 text-md">{formatFolio(rep.id)} - {rep.asunto}</h3>
                  <span className={`py-02 px-075 rounded-full text-xs font-semibold ${getStatusClass(rep.estado)}`}>
                    {rep.estado}
                  </span>
                </div>
                <p className="text-secondary text-sm flex-1 m-0 line-clamp-3">
                  {rep.descripcion}
                </p>
                <div className="border-t-light pt-1 text-xs text-secondary flex-between">
                  <span>{new Date(rep.createdAt).toLocaleDateString()}</span>
                  <span>Prioridad: <strong className={getPriorityClass(rep.prioridad)}>{rep.prioridad}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Nuevo Reporte */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel animate-fade-in bg-white w-full max-w-500 p-2 rounded-lg shadow-modal">
            <div className="flex-between mb-15">
              <h2 className="m-0 text-guinda text-xl font-semibold">Crear Nuevo Reporte</h2>
              <button onClick={() => setIsModalOpen(false)} className="bg-transparent border-none cursor-pointer text-secondary p-025">
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="alert alert-error">
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
                  className="form-control resize-v" 
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={4}
                  placeholder="Proporciona detalles sobre el problema, ubicación, etc."
                />
              </div>

              <div className="flex justify-end gap-1 mt-2">
                <button type="button" className="btn bg-gray text-secondary" onClick={() => setIsModalOpen(false)}>
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