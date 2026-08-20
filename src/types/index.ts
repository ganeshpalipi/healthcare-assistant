export interface User {
  id: string;
  username: string;
  email: string;
  created_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
  risk_level?: string;
  disclaimer?: string;
}

export interface ChatResponse {
  answer: string;
  sources: string[];
  risk_level: string;
  disclaimer: string;
}

export interface SymptomCheckResponse {
  identified_symptoms: string[];
  possible_causes: string[];
  risk_level: string;
  warning_signs: string[];
  recommended_action: string;
  disclaimer: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  available_days: string[];
  available_times: string[];
}

export interface Appointment {
  id: string;
  doctor: Doctor;
  date: string;
  time: string;
  reason: string;
  status: string;
  user_id?: string;
  created_at?: string;
}

export interface Reminder {
  id: string;
  medicine_name: string;
  dosage: string;
  time: string;
  date: string;
  frequency: string;
  active: boolean;
  user_id?: string;
  created_at?: string;
}

export interface ChatHistoryEntry {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
  sources?: string[];
}

export interface ReportAnalysis {
  summary: string;
  extracted_info: Record<string, unknown>;
  explanations: string[];
  disclaimer: string;
}

export interface MedicineInfo {
  medicine: string;
  information: string;
  disclaimer: string;
  source: string;
}

export type PageKey = 'landing' | 'login' | 'register' | 'dashboard' | 'chat' | 'symptoms' | 'reports' | 'medicines' | 'appointments' | 'reminders' | 'history' | 'profile' | 'settings';

export interface NavItem {
  key: PageKey;
  label: string;
  icon: string;
  requireAuth?: boolean;
}
