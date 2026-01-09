// Mock user service for development/testing
// In production, this would be replaced with actual database operations

const mockUsers = new Map();
let nextUserId = 1;

class MockUserService {
  // Find user by email
  static async findByEmail(email) {
    for (const [id, user] of mockUsers) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  // Find user by username
  static async findByUsername(username) {
    for (const [id, user] of mockUsers) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }

  // Find user by ID
  static async findById(id) {
    return mockUsers.get(parseInt(id)) || null;
  }

  // Create new user
  static async create(userData) {
    const user = {
      id: nextUserId++,
      email: userData.email,
      username: userData.username,
      first_name: userData.first_name,
      last_name: userData.last_name,
      avatar_url: userData.avatar_url || null,
      password: userData.password, // In production, this would be hashed
      balance_cents: 0,
      is_verified: false,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockUsers.set(user.id, user);
    return user;
  }

  // Authenticate user
  static async authenticate(email, password) {
    const user = await this.findByEmail(email);
    if (user && user.password === password) { // In production, compare hashed passwords
      return user;
    }
    return null;
  }

  // Generate JWT token (mock)
  static async generateToken(user) {
    // In production, this would use JWT
    return `mock-token-${user.id}-${Date.now()}`;
  }

  // Update user profile
  static async updateProfile(userId, updateData) {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    Object.assign(user, updateData, { updated_at: new Date().toISOString() });
    mockUsers.set(user.id, user);
    return user;
  }

  // Change password
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.password !== currentPassword) { // In production, compare hashed passwords
      throw new Error('Current password is incorrect');
    }

    user.password = newPassword; // In production, hash the password
    user.updated_at = new Date().toISOString();
    mockUsers.set(user.id, user);
    return true;
  }

  // Reset password with token
  static async resetPasswordWithToken(token, newPassword) {
    // In production, this would validate the token and find the user
    // For now, just return success
    return true;
  }

  // Delete user account
  static async deleteAccount(userId) {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    mockUsers.delete(userId);
    return true;
  }

  // Get leaderboard
  static async getLeaderboard(limit = 20) {
    const users = Array.from(mockUsers.values())
      .sort((a, b) => (b.balance_cents || 0) - (a.balance_cents || 0))
      .slice(0, limit);

    return users.map(user => ({
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar_url: user.avatar_url,
      balance_cents: user.balance_cents,
      total_bets_won: 0,
      total_bets_placed: 0
    }));
  }

  // Get all users (for debugging)
  static getAllUsers() {
    return Array.from(mockUsers.values());
  }

  // Clear all users (for testing)
  static clearAllUsers() {
    mockUsers.clear();
    nextUserId = 1;
  }
}

export default MockUserService;
