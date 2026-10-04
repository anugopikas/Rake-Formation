const AUTH_KEY = 'rake-formation-auth-v1';
const USERS_KEY = 'rake-formation-users-v1';

export function getStoredAuth() {
  if (typeof window === 'undefined') return null;

  try {
    const value = localStorage.getItem(AUTH_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function saveAuth(user) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_KEY);
}

export function getStoredUsers() {
  if (typeof window === 'undefined') return [];

  try {
    const value = localStorage.getItem(USERS_KEY);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

export function saveStoredUsers(users) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getDemoUser() {
  return {
    id: 'ops-manager',
    name: 'Operations Manager',
    email: 'ops.manager@rakeformation.com',
    username: 'ops.manager',
    role: 'Operations Manager',
    avatar: 'OM',
    password: 'Admin@123',
    source: 'demo',
  };
}

export function getPasswordStrength(password = '') {
  let score = 0;

  if (!password) return { score: 0, label: 'Missing' };
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score, label: 'Weak' };
  if (score === 2) return { score, label: 'Fair' };
  if (score === 3) return { score, label: 'Good' };
  return { score, label: 'Strong' };
}

export function authenticateUser(email, password, role) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');

  if (!normalizedEmail || !normalizedPassword) {
    return null;
  }

  const userList = getStoredUsers();
  const match = userList.find((user) => {
    const sameEmail = String(user.email || '').toLowerCase() === normalizedEmail;
    const sameUsername = String(user.username || '').toLowerCase() === normalizedEmail;
    const validPassword = String(user.password || '') === normalizedPassword;
    return (sameEmail || sameUsername) && validPassword;
  });

  if (match && (!role || match.role === role)) {
    return {
      id: match.id,
      name: match.name,
      email: match.email,
      username: match.username,
      role: match.role,
      avatar: match.avatar,
      source: 'registered',
    };
  }

  const demoUser = getDemoUser();
  if (normalizedEmail === demoUser.email.toLowerCase() && normalizedPassword === demoUser.password && (!role || demoUser.role === role)) {
    return {
      id: demoUser.id,
      name: demoUser.name,
      email: demoUser.email,
      username: demoUser.username,
      role: demoUser.role,
      avatar: demoUser.avatar,
      source: 'demo',
    };
  }

  return null;
}

export function registerUser({ fullName, email, username, password, role = 'Operations Analyst' }) {
  const cleanName = String(fullName || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanUsername = String(username || '').trim();

  if (!cleanName) throw new Error('Full name is required.');
  if (!cleanEmail) throw new Error('Email is required.');
  if (!cleanUsername) throw new Error('Username is required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error('Please enter a valid email address.');
  if (password.length < 8) throw new Error('Password must be at least 8 characters long.');

  const strength = getPasswordStrength(password);
  if (strength.score < 3) {
    throw new Error('Use a stronger password with uppercase letters, numbers and a symbol.');
  }

  const existingUsers = getStoredUsers();
  const duplicate = existingUsers.some((user) => {
    return user.email.toLowerCase() === cleanEmail || user.username.toLowerCase() === cleanUsername.toLowerCase();
  });

  if (duplicate) {
    throw new Error('An account with this email or username already exists.');
  }

  const nextUser = {
    id: Date.now().toString(),
    name: cleanName,
    email: cleanEmail,
    username: cleanUsername,
    role,
    avatar: (cleanName.split(' ').map((part) => part[0]).slice(0, 2).join('') || 'RA').toUpperCase(),
    password,
  };

  saveStoredUsers([...existingUsers, nextUser]);

  return {
    id: nextUser.id,
    name: nextUser.name,
    email: nextUser.email,
    username: nextUser.username,
    role: nextUser.role,
    avatar: nextUser.avatar,
  };
}

export function requestPasswordReset(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error('Please enter your email address.');
  }

  const users = getStoredUsers();
  const exists = users.some((user) => user.email.toLowerCase() === normalizedEmail);
  const demoUser = getDemoUser();

  if (!exists && normalizedEmail !== demoUser.email.toLowerCase()) {
    return { queued: true, backendPending: true, message: 'Reset request recorded for future backend integration.' };
  }

  return { queued: true, backendPending: true, message: 'Password reset request captured. Connect the backend reset endpoint to send the actual email.' };
}
