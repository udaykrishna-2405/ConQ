// Auth Service
// Business logic for authentication and user management.
// Credentials are stored alongside the User record in DynamoDB (password_hash, password_salt).
// In production, replace with Cognito SDK calls (AdminInitiateAuth / AdminCreateUser).

import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from './userRepository';
import { User } from '../models/schemas';
import { generateTokenPair, rotateRefreshToken, revokeAllUserTokens, TokenPair } from '../utils/jwt';
import { hashPassword, verifyPassword } from '../utils/password';
import { AppError, NotFoundError } from '../middleware/errorHandler';

export class AuthService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  /**
   * Register a new user. Creates user record with hashed credentials in DynamoDB.
   * Returns access + refresh token pair.
   */
  async register(params: {
    email: string;
    password: string;
    name: string;
    tenantId?: string;
    role?: 'admin' | 'creator' | 'viewer';
    tier?: 'free' | 'pro' | 'enterprise';
  }): Promise<{ user: User; tokens: TokenPair }> {
    const tenantId = params.tenantId || `tenant_${uuidv4().slice(0, 8)}`;
    const userId = uuidv4();
    const now = new Date().toISOString();

    // Check if email already exists for this tenant
    const existingUser = await this.userRepo.getUserByEmail(tenantId, params.email);
    if (existingUser) {
      throw new AppError(409, 'User with this email already exists', 'USER_EXISTS');
    }

    // Hash password
    const { hash, salt } = hashPassword(params.password);

    const user: User = {
      tenant_id: tenantId,
      user_id: userId,
      email: params.email,
      name: params.name,
      role: params.role || 'creator',
      tier: params.tier || 'free',
      platforms: [],
      password_hash: hash,
      password_salt: salt,
      created_at: now,
      updated_at: now,
    };

    await this.userRepo.createUser(user);

    const tokens = generateTokenPair({
      userId: user.user_id,
      tenantId: user.tenant_id,
      email: user.email,
      role: user.role,
      tier: user.tier,
    });

    return { user: this.sanitizeUser(user), tokens };
  }

  /**
   * Login with email and password. Returns access + refresh token pair.
   */
  async login(params: {
    email: string;
    password: string;
    tenantId: string;
  }): Promise<{ user: User; tokens: TokenPair }> {
    const user = await this.userRepo.getUserByEmail(params.tenantId, params.email);

    if (!user || !user.password_hash || !user.password_salt) {
      throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!verifyPassword(params.password, user.password_hash, user.password_salt)) {
      throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const tokens = generateTokenPair({
      userId: user.user_id,
      tenantId: user.tenant_id,
      email: user.email,
      role: user.role,
      tier: user.tier,
    });

    return { user: this.sanitizeUser(user), tokens };
  }

  /**
   * Refresh an access token using a valid refresh token.
   * Implements token rotation: old refresh token is revoked, new pair issued.
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    const newTokens = rotateRefreshToken(refreshToken);
    if (!newTokens) {
      throw new AppError(401, 'Invalid or expired refresh token', 'REFRESH_TOKEN_INVALID');
    }
    return newTokens;
  }

  /**
   * Logout: revoke all refresh tokens for the user.
   */
  async logout(userId: string): Promise<void> {
    revokeAllUserTokens(userId);
  }

  /**
   * Get user profile by ID. Scoped to tenant.
   */
  async getProfile(tenantId: string, userId: string): Promise<User> {
    const user = await this.userRepo.getUserById(tenantId, userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    return this.sanitizeUser(user);
  }

  /**
   * Update user profile. Scoped to tenant.
   */
  async updateProfile(
    tenantId: string,
    userId: string,
    updates: { name?: string; platforms?: string[]; onboarding?: Record<string, unknown>; onboardingCompleted?: boolean }
  ): Promise<User> {
    const mapped: Record<string, unknown> = {};
    if (updates.name !== undefined) mapped.name = updates.name;
    if (updates.platforms !== undefined) mapped.platforms = updates.platforms;
    if (updates.onboarding !== undefined) mapped.onboarding = updates.onboarding;
    if (updates.onboardingCompleted !== undefined) mapped.onboarding_completed = updates.onboardingCompleted;
    await this.userRepo.updateUser(tenantId, userId, mapped as Partial<User>);
    return this.getProfile(tenantId, userId);
  }

  /**
   * Strip sensitive fields (password_hash, password_salt) before returning user data.
   */
  private sanitizeUser(user: User): User {
    const { password_hash: _h, password_salt: _s, ...safeUser } = user;
    return safeUser as User;
  }
}
