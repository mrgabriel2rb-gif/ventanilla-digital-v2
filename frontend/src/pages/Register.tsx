import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';

// 1. VARIABLE INTELIGENTE AÑADIDA AQUÍ
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Register = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Solo números
    if (value.length <= 10) {
      setTelefono(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (telefono.length !== 10) {
      setError('El teléfono debe tener estrictamente 10 dígitos.');
      return;
    }

    try {
      // 2. URL DINÁMICA APLICADA AQUÍ
      await axios.post(`${API_URL}/api/auth/register`, {
        nombre, email, password, telefono
      });
      setSuccess('Registro exitoso. Redirigiendo al login...');
      setTimeout(() => navigate('/login', { state: { email } }), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar el usuario');
    }
  };

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ padding: '2.5rem', width: '100%', maxWidth: '450px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--color-guinda)', fontSize: '1.75rem', fontWeight: 700 }}>Registro de Ciudadano</h2>
          <p style={{ color: 'var(--color-texto-secundario)', marginTop: '0.5rem' }}>Crea tu cuenta para reportar incidencias</p>
        </div>
        
        {error && (
          <div style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '0.75rem', borderRadius: 'var(--border-radius)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '0.75rem', borderRadius: 'var(--border-radius)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre Completo</label>
            <input 
              type="text" 
              className="form-control" 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required 
              placeholder="Juan Pérez"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <input 
              type="email" 
              className="form-control" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              placeholder="tu@email.com"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Teléfono (10 dígitos)</label>
            <input 
              type="text" 
              className="form-control" 
              value={telefono}
              onChange={handlePhoneChange}
              required 
              placeholder="5512345678"
            />
            <small style={{ color: 'var(--color-texto-secundario)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
              {telefono.length}/10 dígitos
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div className="input-icon-wrapper">
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-control" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                placeholder="••••••••"
              />
              <span className="input-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </span>
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Crear Cuenta
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--color-texto-secundario)' }}>¿Ya tienes cuenta? </span>
          <span 
            style={{ color: 'var(--color-dorado)', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => navigate('/login')}
          >
            Inicia sesión aquí
          </span>
        </div>
      </div>
    </div>
  );
};

export default Register;