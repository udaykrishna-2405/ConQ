// Auth Service
// Business logic for authentication and user management.
// Mock implementation for local dev. In production, replace with Cognito SDK calls.
// TODO: Replace mock auth with AWS Cognito AdminInitiateAuth / AdminCreateUser

import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from './userRepository';
import { User } from '../models/schemas';
import { generateToken } from '../utils/jwt';
import { hashPassword, verifyPassword } from '../utils/password';
import { AppError, NotFoundError } from '../middleware/errorHandler';

// In-memory credential store for mock auth (replaces Cognito in dev).
// In production, Cognito manages credentials entirely.
const credentialStore = new Map<string, { hash: string; salt: string; userId: string; tenantId: string }>();

export class AuthService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  /**
   * Register a new user. Creates credentials and user profile.
   * In production: Cognito AdminCreateUser + DynamoDB user record.
   */
  async register(params: {
    email: string;
    password: string;
    name: string;
    tenantId?: string;
    role?: 'admin' | 'creator' | 'viewer';
    tier?: 'free' | 'pro' | 'enterprise';
  }): Promise<{ user: User; token: string }> {
    const tenantId = params.tenantId || `tenant_${uuidv4().slice(0, 8)}`;
    const userId = uuidv4();
    const now = new Date().toISOString();

    // Check if email already exists for this tenant
    const credKey = `${tenantId}:${params.email}`;
    if (credentialStore.has(credKey)) {
      throw new AppError(409, 'User with this email already exists', 'USER_EXISTS');
    }

    // Hash password (mock Cognito credential storage)
    const { hash, salt } = hashPassword(params.password);
    credentialStore.set(credKey, { hash, salt, userId, tenantId });

    const user: User = {
      tenant_id: tenantId,
      user_id: userId,
      email: params.email,
      name: params.name,
      role: params.role || 'creator',
      tier: params.tier || 'free',
      platforms: [],
      created_at: now,
      updated_at: now,
    };

    await this.userRepo.createUser(user);

    const token = generateToken({
      userId: user.user_id,
      tenantId: user.tenant_id,
      email: user.email,
      role: user.role,
      tier: user.tier,
    });

    return { user, token };
  }

  /**
   * Login with email and password. Returns JWT token.
   * In production: Cognito AdminInitiateAuth returns Cognito tokens.
   */
  async login(params: {
    email: string;
    password: string;
    tenantId: string;
  }): Promise<{ user: User; token: string }> {
    const credKey = `${params.tenantId}:${params.email}`;
    const creds = credentialStore.get(credKey);

    if (!creds) {
      throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!verifyPassword(params.password, creds.hash, creds.salt)) {
      throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const user = await this.userRepo.getUserById(params.tenantId, creds.userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    const token = generateToken({
      userId: user.user_id,
      tenantId: user.tenant_id,
      email: user.email,
      role: user.role,
      tier: user.tier,
    });

    return { user, token };
  }

  /**
   * Get user profile by ID. Scoped to tenant.
   */
  async getProfile(tenantId: string, userId: string): Promise<User> {
    const user = await this.userRepo.getUserById(tenantId, userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    return user;
  }

  /**
   * Update user profile. Scoped to tenant.
   */
  async updateProfile(
    tenantId: string,
    userId: string,
    updates: { name?: string; platforms?: string[] }
  ): Promise<User> {
    await this.userRepo.updateUser(tenantId, userId, updates);
    return this.getProfile(tenantId, userId);
  }
}
