import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Usuario } from '../models/Usuario';
import { Admin } from '../models/Admin';

const generateToken = (payload: any) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'super_secret_jwt_key_ventanilla', {
    expiresIn: '24h',
  });
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // First try Admin
    const admin = await Admin.findOne({ where: { email } });
    if (admin) {
      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });
      return res.json({
        token: generateToken({ id: admin.id, role: admin.role, type: 'admin' }),
        user: { id: admin.id, nombre: admin.nombre, role: admin.role, type: 'admin' }
      });
    }

    // Try Usuario
    const usuario = await Usuario.findOne({ where: { email } });
    if (usuario) {
      const valid = await bcrypt.compare(password, usuario.password);
      if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });
      return res.json({
        token: generateToken({ id: usuario.id, type: 'usuario' }),
        user: { id: usuario.id, nombre: usuario.nombre, type: 'usuario' }
      });
    }

    // Si no se encuentra en ninguno
    return res.status(404).json({ error: 'Usuario no encontrado' });
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' });
  }
};

export const registerUsuario = async (req: Request, res: Response) => {
  try {
    const { nombre, email, password, telefono } = req.body;

    // Validación estricta del teléfono
    if (!telefono || !/^\d{10}$/.test(telefono)) {
      return res.status(400).json({ error: 'El teléfono debe tener estrictamente 10 dígitos.' });
    }

    const existingUser = await Usuario.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'El email ya está registrado.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUsuario = await Usuario.create({
      nombre,
      email,
      password: hashedPassword,
      telefono,
    });

    return res.status(201).json({ message: 'Usuario registrado exitosamente', id: newUsuario.id });
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' });
  }
};
