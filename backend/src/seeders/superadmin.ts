import bcrypt from 'bcrypt';
import { Admin } from '../models/Admin';

export const seedSuperAdmin = async () => {
  try {
    const existingAdmin = await Admin.findOne({ where: { role: 'SuperAdmin' } });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('superadmin123', 10);
      await Admin.create({
        nombre: 'Super Administrador',
        email: 'superadmin@ventanilla.gob',
        password: hashedPassword,
        role: 'SuperAdmin',
      });
      console.log('SuperAdmin creado exitosamente.');
    } else {
      console.log('SuperAdmin ya existe.');
    }
  } catch (error) {
    console.error('Error creando SuperAdmin:', error);
  }
};
