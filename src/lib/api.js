const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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

      if (!data.success) {
        return { data: null, error: data.message || 'API Error' };
      }

      return { data: data.data, error: null };
    } catch (err) {
      return { data: null, error: err.message || 'Network Error' };
    }
  }

  // Auth
  async login(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.data) {
      this.setToken(res.data.token);
      this.setUser(res.data.user);
    }
    return res;
  }

  async register(email, password, nama_lengkap, divisi_id) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, nama_lengkap, divisi_id }),
    });
    if (res.data) {
      this.setToken(res.data.token);
      this.setUser(res.data.user);
    }
    return res;
  }

  async getProfile() {
    return this.request('/auth/profile');
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

  async getSuratByUuid(uuid) {
    return this.request(`/surat/${uuid}`);
  }

  async createSurat(data) {
    return this.request('/surat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSurat(uuid, data) {
    return this.request(`/surat/${uuid}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateStatusSurat(uuid, status) {
    return this.request(`/surat/${uuid}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async syncSurat(uuid) {
    return this.request(`/surat/${uuid}/sync`, {
      method: 'POST',
    });
  }

  async uploadPhotoSurat(uuid, data) {
    return this.request(`/surat/${uuid}/photo`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteSurat(uuid) {
    return this.request(`/surat/${uuid}`, {
      method: 'DELETE',
    });
  }

  // Dashboard
  async getDashboard() {
    return this.request('/dashboard');
  }

  // Kurir
  async getKurir() {
    return this.request('/kurir');
  }

  async approveKurir(id) {
    return this.request(`/kurir/${id}/approve`, {
      method: 'PATCH',
    });
  }

  async deactivateKurir(id) {
    return this.request(`/kurir/${id}/deactivate`, {
      method: 'PATCH',
    });
  }
}

export const api = new ApiClient();
