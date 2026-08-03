// REST API Client - replaces Supabase client
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  constructor() {
    this.baseURL = API_URL;
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
    return this.token || localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  }

  // Auth
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async register(email, password, nama_lengkap) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, nama_lengkap }),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Divisi
  async getDivisi() {
    return this.request('/divisi');
  }

  async getDivisiById(id) {
    return this.request(`/divisi/${id}`);
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
    const params = new URLSearchParams(filters);
    return this.request(`/surat?${params}`);
  }

  async getSuratById(id) {
    return this.request(`/surat/${id}`);
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

  async deleteSurat(id) {
    return this.request(`/surat/${id}`, {
      method: 'DELETE',
    });
  }

  async getSuratStats() {
    return this.request('/surat/stats/summary');
  }

  // Users
  async getUsers() {
    return this.request('/users');
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
}

export const apiClient = new ApiClient();
export default apiClient;
