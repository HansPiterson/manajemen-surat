const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token;
  }

  isAuthenticated() {
    return !!this.token;
  }

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  setUser(user) {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }

  logout() {
    this.setToken(null);
    this.setUser(null);
  }

  async request(endpoint, options = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { data: null, error: data.error || `HTTP ${response.status}` };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message || 'Network Error' };
    }
  }

  // Auth
  async login(email, password, kode_divisi) {
    const body = { email, password };
    if (kode_divisi) {
      body.kode_divisi = kode_divisi;
    }

    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    if (res.data) {
      this.setToken(res.data.token);
      this.setUser(res.data.user);
    }
    return res;
  }

  async register(email, password, nama_lengkap) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, nama_lengkap }),
    });
    if (res.data && res.data.user) {
      if (res.data.token) {
        this.setToken(res.data.token);
        this.setUser(res.data.user);
      }
    }
    return res;
  }

  async getProfile() {
    const res = await this.request('/auth/me');
    if (res.data && res.data.user) {
      this.setUser(res.data.user);
      return { data: res.data.user, error: null };
    }
    return res;
  }

  // Divisi
  async getDivisi() {
    return this.request('/divisi');
  }

  async createDivisi(data) {
    return this.request('/divisi', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDivisi(id, data) {
    return this.request(`/divisi/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDivisi(id) {
    return this.request(`/divisi/${id}`, {
      method: 'DELETE',
    });
  }

  // Surat
  async getSurat(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/surat?${params}`);
  }

  async getSuratById(id) {
    return this.request(`/surat/${id}`);
  }

  async getSuratByUuid(uuid) {
    return this.getSuratById(uuid);
  }

  async getSuratByNomor(nomorSurat) {
    return this.request(`/surat/by-nomor/${encodeURIComponent(nomorSurat)}`);
  }

  async createSurat(data) {
    return this.request('/surat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSurat(id, data) {
    return this.request(`/surat/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateStatusSurat(id, status) {
    return this.updateSurat(id, { status });
  }

  async deleteSurat(id) {
    return this.request(`/surat/${id}`, {
      method: 'DELETE',
    });
  }

  async getDashboard() {
    return this.request('/surat/stats/summary');
  }

  async getKurir() {
    return this.request('/users');
  }

  async approveKurir(id) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'approved' }),
    });
  }

  async deactivateKurir(id) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'nonaktif' }),
    });
  }

  async getPendingKurir() {
    return this.request('/users/pending-kurir');
  }

  async createUser(data) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id, data) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getPairingStatus() {
    return this.request('/pairing/status');
  }

  async createPairingToken() {
    return this.request('/pairing/token', {
      method: 'POST',
    });
  }

  async disconnectPairing() {
    return this.request('/pairing/connection', {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
