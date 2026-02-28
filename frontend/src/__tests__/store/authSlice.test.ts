import authReducer, { logout, clearError } from '../../store/slices/authSlice';

describe('authSlice reducer', () => {
  const initialState = {
    user: null,
    token: null,
    loading: false,
    error: null,
  };

  it('should return initial state', () => {
    const result = authReducer(undefined, { type: 'unknown' });
    // Token may come from localStorage, so check other fields
    expect(result.user).toBeNull();
    expect(result.loading).toBe(false);
    expect(result.error).toBeNull();
  });

  it('should handle logout', () => {
    const loggedInState = {
      user: { userId: '1', tenantId: 't1', email: 'a@b.com', name: 'Test', role: 'creator' as const, tier: 'free' as const, platforms: [] },
      token: 'abc123',
      loading: false,
      error: null,
    };

    const result = authReducer(loggedInState, logout());
    expect(result.user).toBeNull();
    expect(result.token).toBeNull();
    expect(result.error).toBeNull();
  });

  it('should handle clearError', () => {
    const errorState = {
      ...initialState,
      error: 'Something went wrong',
    };

    const result = authReducer(errorState, clearError());
    expect(result.error).toBeNull();
  });

  it('should set loading on login.pending', () => {
    const result = authReducer(initialState, { type: 'auth/login/pending' });
    expect(result.loading).toBe(true);
    expect(result.error).toBeNull();
  });

  it('should set user and token on login.fulfilled', () => {
    const payload = {
      token: 'new-token',
      user: { userId: '1', tenantId: 't1', email: 'a@b.com', name: 'New User', role: 'creator', tier: 'free', platforms: [] },
    };

    const result = authReducer(initialState, {
      type: 'auth/login/fulfilled',
      payload,
    });
    expect(result.loading).toBe(false);
    expect(result.user).toEqual(payload.user);
    expect(result.token).toBe('new-token');
  });

  it('should set error on login.rejected', () => {
    const result = authReducer(initialState, {
      type: 'auth/login/rejected',
      payload: 'Invalid credentials',
    });
    expect(result.loading).toBe(false);
    expect(result.error).toBe('Invalid credentials');
  });

  it('should set loading on register.pending', () => {
    const result = authReducer(initialState, { type: 'auth/register/pending' });
    expect(result.loading).toBe(true);
    expect(result.error).toBeNull();
  });

  it('should set user and token on register.fulfilled', () => {
    const payload = {
      token: 'reg-token',
      user: { userId: '2', tenantId: 't2', email: 'new@b.com', name: 'Registered', role: 'creator', tier: 'free', platforms: [] },
    };

    const result = authReducer(initialState, {
      type: 'auth/register/fulfilled',
      payload,
    });
    expect(result.loading).toBe(false);
    expect(result.user).toEqual(payload.user);
    expect(result.token).toBe('reg-token');
  });

  it('should set error on register.rejected', () => {
    const result = authReducer(initialState, {
      type: 'auth/register/rejected',
      payload: 'Email already exists',
    });
    expect(result.loading).toBe(false);
    expect(result.error).toBe('Email already exists');
  });

  it('should update user on fetchProfile.fulfilled', () => {
    const stateWithUser = {
      ...initialState,
      token: 'token',
      user: { userId: '1', tenantId: 't1', email: 'old@b.com', name: 'Old', role: 'creator' as const, tier: 'free' as const, platforms: [] },
    };

    const updatedUser = { userId: '1', tenantId: 't1', email: 'old@b.com', name: 'Updated Name', role: 'creator', tier: 'pro', platforms: ['youtube'] };

    const result = authReducer(stateWithUser, {
      type: 'auth/fetchProfile/fulfilled',
      payload: updatedUser,
    });
    expect(result.user?.name).toBe('Updated Name');
  });
});
