const API_BASE = '';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('hc_token');
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hc_token');
      localStorage.removeItem('hc_user');
      window.location.href = '/';
    }
    throw new Error('Session expired. Please log in again.');
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.message || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  // Auth
  async register(username: string, email: string, password: string) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    return handleResponse<{ access_token: string; token_type: string; user: { id: string; username: string; email: string; created_at: string } }>(res);
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<{ access_token: string; token_type: string; user: { id: string; username: string; email: string } }>(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/api/auth/me`, { headers: getHeaders() });
    return handleResponse<{ id: string; username: string; email: string }>(res);
  },

  // Chat
  async chat(message: string, conversationId?: string) {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ message, conversation_id: conversationId }),
    });
    return handleResponse<{ answer: string; sources: string[]; risk_level: string; disclaimer: string }>(res);
  },

  // Symptom Check
  async symptomCheck(symptoms: string[]) {
    const res = await fetch(`${API_BASE}/api/symptom-check`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ symptoms }),
    });
    return handleResponse<{ identified_symptoms: string[]; possible_causes: string[]; risk_level: string; warning_signs: string[]; recommended_action: string; disclaimer: string }>(res);
  },

  // Reports
  async uploadReport(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/api/reports/upload`, {
      method: 'POST', headers, body: formData,
    });
    return handleResponse<{ summary: string; extracted_info: Record<string, unknown>; explanations: string[]; disclaimer: string }>(res);
  },

  // Medicines
  async getMedicines(query: string) {
    const res = await fetch(`${API_BASE}/api/medicines?query=${encodeURIComponent(query)}`, { headers: getHeaders() });
    return handleResponse<{ medicine: string; information: string; disclaimer: string; source: string }>(res);
  },

  // Doctors
  async getDoctors() {
    const res = await fetch(`${API_BASE}/api/doctors`, { headers: getHeaders() });
    return handleResponse<{ doctors: { id: string; name: string; specialty: string; available_days: string[]; available_times: string[] }[] }>(res);
  },

  // Appointments
  async getAppointments() {
    const res = await fetch(`${API_BASE}/api/appointments`, { headers: getHeaders() });
    return handleResponse<{ appointments: Appointment[] }>(res);
  },
  async createAppointment(data: { doctor_id: string; date: string; time: string; reason: string }) {
    const res = await fetch(`${API_BASE}/api/appointments`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(data),
    });
    return handleResponse<Appointment>(res);
  },
  async updateAppointment(id: string, data: Partial<{ date: string; time: string; reason: string; status: string }>) {
    const res = await fetch(`${API_BASE}/api/appointments/${id}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(data),
    });
    return handleResponse<Appointment>(res);
  },
  async deleteAppointment(id: string) {
    const res = await fetch(`${API_BASE}/api/appointments/${id}`, {
      method: 'DELETE', headers: getHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  // Reminders
  async getReminders() {
    const res = await fetch(`${API_BASE}/api/reminders`, { headers: getHeaders() });
    return handleResponse<{ reminders: Reminder[] }>(res);
  },
  async createReminder(data: { medicine_name: string; dosage: string; time: string; date: string; frequency: string }) {
    const res = await fetch(`${API_BASE}/api/reminders`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(data),
    });
    return handleResponse<Reminder>(res);
  },
  async updateReminder(id: string, data: Partial<{ medicine_name: string; dosage: string; time: string; date: string; frequency: string; active: boolean }>) {
    const res = await fetch(`${API_BASE}/api/reminders/${id}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify(data),
    });
    return handleResponse<Reminder>(res);
  },
  async deleteReminder(id: string) {
    const res = await fetch(`${API_BASE}/api/reminders/${id}`, {
      method: 'DELETE', headers: getHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  // Chat History
  async getChatHistory() {
    const res = await fetch(`${API_BASE}/api/chat-history`, { headers: getHeaders() });
    return handleResponse<{ history: ChatHistoryEntry[] }>(res);
  },
  async deleteChatHistory(id: string) {
    const res = await fetch(`${API_BASE}/api/chat-history/${id}`, {
      method: 'DELETE', headers: getHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  // Health
  async health() {
    const res = await fetch(`${API_BASE}/api/health`);
    return handleResponse<{ status: string; database: string; rag: string; llm: string }>(res);
  },
};

import type { Appointment, Reminder, ChatHistoryEntry } from '@/types';
