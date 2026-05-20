import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

// 1. VARIABLE INTELIGENTE RESTAURADA AQUÍ
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 2. URL DINÁMICA APLICADA AQUÍ
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      const { user, token } = response.data;
      login(user, token);
      if (user.type === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        navigate('/register', { state: { email } });
      } else {
        setError(err.response?.data?.error || 'Error al iniciar sesión');
      }
    }
  };

  return (
    <div className="animate-fade-in min-h-screen flex-center p-2">
      <div className="glass-panel p-25 w-full max-w-400">
        <div className="text-center mb-2">
          <h2 className="text-guinda text-2xl font-bold">Iniciar Sesión</h2>
          <p className="text-secondary mt-05">Bienvenido a la Ventanilla Digital</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {location.state?.message && (
          <div className="alert alert-success">
            {location.state.message}
          </div>
        )}

        <form onSubmit={handleLogin}>
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
            <label className="form-label">Contraseña</label>
            <div className="input-icon-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
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
            Entrar
          </button>
        </form>

        <div className="text-center mt-15 text-sm">
          <span className="text-secondary">¿No tienes cuenta? </span>
          <span 
            className="text-dorado font-semibold cursor-pointer"
            onClick={() => navigate('/register')}
          >
            Regístrate
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;