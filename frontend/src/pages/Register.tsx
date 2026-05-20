import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';

// 1. VARIABLE INTELIGENTE RESTAURADA AQUÍ
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Register = () => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
      setError('Usuario no encontrado. Por favor, regístrate.');
    }
  }, [location.state]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strict 10-digit validation
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(telefono)) {
      setError('El teléfono debe contener exactamente 10 dígitos numéricos.');
      return;
    }

    try {
      // 2. URL DINÁMICA APLICADA AQUÍ
      await axios.post(`${API_URL}/api/auth/register`, {
        nombre, email, telefono, password
      });
      setSuccess(true);
      setError('');
      setTimeout(() => {
        navigate('/login', { state: { message: 'Registro exitoso. Ahora puedes iniciar sesión.' } });
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar ciudadano');
    }
  };

  return (
    <div className="animate-fade-in min-h-screen flex-center p-2">
      <div className="glass-panel p-25 w-full max-w-450">
        <div className="text-center mb-2">
          <h2 className="text-guinda text-2xl font-bold">Registro de Ciudadano</h2>
          <p className="text-secondary mt-05">Crea tu cuenta para reportar incidencias</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            Registro completado. Redirigiendo al login...
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Nombre Completo</label>
            <input 
              type="text" 
              className="form-control" 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required 
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
            />
          </div>

          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input 
              type="tel" 
              className="form-control" 
              value={telefono}
              onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0,10))}
              placeholder="10 dígitos"
              required 
            />
            <small className="text-secondary text-xs mt-025">Ej. 9811234567 (Solo números)</small>
          </div>
          
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div className="input-icon-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                minLength={6}
              />
              <div 
                className="input-icon" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full mt-1">
            Registrarme
          </button>
        </form>

        <div className="text-center mt-15 text-sm">
          <span className="text-secondary">¿Ya tienes cuenta? </span>
          <span 
            className="text-dorado font-semibold cursor-pointer"
            onClick={() => navigate('/login')}
          >
            Iniciar Sesión
          </span>
        </div>
      </div>
    </div>
  );
};

export default Register;