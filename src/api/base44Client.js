// Mock implementation that replaces the original Base44 SDK client.
// This keeps the same public interface used across the app, but all data
// is stored locally in `localStorage`, without any external dependency.

const STORAGE_PREFIX = 'maintpro_';

const getStore = (name) => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_PREFIX + name);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const setStore = (name, value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_PREFIX + name, JSON.stringify(value));
};

const generateId = () => {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const sortByOrdering = (items, ordering, defaultField = 'created_date') => {
  if (!ordering) return items;
  const desc = ordering.startsWith('-');
  const field = ordering.replace(/^-/, '') || defaultField;
  return [...items].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (!av && !bv) return 0;
    if (!av) return 1;
    if (!bv) return -1;
    if (av === bv) return 0;
    return (av > bv ? 1 : -1) * (desc ? -1 : 1);
  });
};

const createEntityStore = (name) => {
  const storeKey = `entities_${name}`;

  return {
    async list(ordering, limit) {
      let items = getStore(storeKey);
      if (ordering) {
        items = sortByOrdering(items, ordering);
      }
      if (limit && Number.isFinite(limit)) {
        items = items.slice(0, limit);
      }
      return items;
    },

    async filter(criteria = {}, ordering) {
      let items = getStore(storeKey);
      items = items.filter((item) =>
        Object.entries(criteria).every(([key, value]) => `${item[key]}` === `${value}`)
      );
      if (ordering) {
        items = sortByOrdering(items, ordering);
      }
      return items;
    },

    async create(data) {
      const now = new Date().toISOString();
      const items = getStore(storeKey);
      const id = data.id || generateId();
      const newItem = { ...data, id, created_date: data.created_date || now };
      items.unshift(newItem);
      setStore(storeKey, items);
      return newItem;
    },

    async update(id, data) {
      const items = getStore(storeKey);
      const idx = items.findIndex((item) => `${item.id}` === `${id}`);
      if (idx === -1) {
        throw new Error(`Item not found in ${name}`);
      }
      const updated = {
        ...items[idx],
        ...data,
        id: items[idx].id,
        updated_date: new Date().toISOString(),
      };
      items[idx] = updated;
      setStore(storeKey, items);
      return updated;
    },

    async delete(id) {
      const items = getStore(storeKey);
      const filtered = items.filter((item) => `${item.id}` !== `${id}`);
      setStore(storeKey, filtered);
      return { success: true };
    },
  };
};

// Entities used by the app
const entities = {
  Equipment: createEntityStore('Equipment'),
  WorkOrder: createEntityStore('WorkOrder'),
  Inspection: createEntityStore('Inspection'),
  PreventivePlan: createEntityStore('PreventivePlan'),
};

// Simple auth facade – always authenticates a local demo user.
const AUTH_USER_KEY = STORAGE_PREFIX + 'auth_user';

const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(AUTH_USER_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // ignore
    }
  }
  const defaultUser = {
    id: 'demo-user',
    name: 'Demo Admin',
    email: 'demo@example.com',
    role: 'admin',
  };
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(defaultUser));
  return defaultUser;
};

const auth = {
  async me() {
    return getCurrentUser();
  },

  async logout(redirectUrl) {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_USER_KEY);
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    }
  },

  async redirectToLogin(redirectUrl) {
    // In this local version there is no external login,
    // so we just ensure there is a user and optionally redirect.
    getCurrentUser();
    if (typeof window !== 'undefined' && redirectUrl) {
      window.location.href = redirectUrl;
    }
  },
};

// File upload facade – stores files in memory and returns a blob URL.
// Note: URLs are not persisted across reloads, but they work during the session.
const inMemoryFiles = {};

const integrations = {
  Core: {
    async UploadFile({ file }) {
      if (typeof window === 'undefined') {
        return { file_url: '' };
      }
      const url = URL.createObjectURL(file);
      const id = generateId();
      inMemoryFiles[id] = { id, file, url };
      return { file_url: url };
    },
  },
};

export const base44 = {
  entities,
  auth,
  integrations,
};
