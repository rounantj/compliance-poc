import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getUserByEmail, createUser, updateUserLogin } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura-mude-em-producao';

// Usuário padrão
const DEFAULT_USER = {
  email: 'admin@teste.com',
  password: 'mdt1234@',
  name: 'Administrador',
};

export interface SessionUser {
  id: number;
  email: string;
  name: string;
}

export function createToken(user: SessionUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
}

export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  // Verificar se é o usuário padrão
  if (email === DEFAULT_USER.email && password === DEFAULT_USER.password) {
    let user = getUserByEmail(email);
    
    if (!user) {
      // Criar usuário padrão se não existir
      const hashedPassword = await bcrypt.hash(DEFAULT_USER.password, 10);
      createUser(email, DEFAULT_USER.name, undefined, undefined, hashedPassword);
      user = getUserByEmail(email);
    } else {
      updateUserLogin(user.id);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || 'Administrador',
    };
  }

  // Verificar usuário no banco
  const user = getUserByEmail(email);
  
  if (!user || !user.password) {
    return null;
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  
  if (!isValidPassword) {
    return null;
  }

  updateUserLogin(user.id);

  return {
    id: user.id,
    email: user.email,
    name: user.name || 'Usuário',
  };
}
