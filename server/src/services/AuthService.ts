import { userRepository } from '../repositories/UserRepository';
import { LoginRequest, RegisterRequest, User, PublicUser } from '../types';
import * as bcrypt from 'bcryptjs';
import { generateToken } from '../utils/auth';

export class AuthService {
  public async login(loginData: LoginRequest): Promise<{ token: string; user: PublicUser } | null> {
    let user: User | undefined;
    
    if (loginData.phone) {
      user = userRepository.findByPhone(loginData.phone);
    } else if (loginData.email) {
      user = userRepository.findByEmail(loginData.email);
    }

    if (!user) return null;

    const isPasswordValid = bcrypt.compareSync(loginData.password, user.password);
    if (!isPasswordValid) return null;

    const token = generateToken({ id: user.id, role: user.role });
    return {
      token,
      user: userRepository.toPublicUserWithCoins(user),
    };
  }

  public async register(registerData: RegisterRequest): Promise<{ token: string; user: PublicUser } | null> {
    const existingPhone = userRepository.findByPhone(registerData.phone);
    if (existingPhone) {
      throw new Error('手机号已注册');
    }

    const existingEmail = userRepository.findByEmail(registerData.email);
    if (existingEmail) {
      throw new Error('邮箱已注册');
    }

    const user = userRepository.create(registerData);
    const token = generateToken({ id: user.id, role: user.role });

    return {
      token,
      user: userRepository.toPublicUserWithCoins(user),
    };
  }

  public getProfile(userId: string): PublicUser | null {
    const user = userRepository.findById(userId);
    if (!user) return null;
    return userRepository.toPublicUserWithCoins(user);
  }
}

export const authService = new AuthService();
