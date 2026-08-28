/**
 * SafeSense AI — Backend API Client
 * All calls go through this module — never put credentials directly in components.
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

function getToken(): string | null {
  return localStorage.getItem('safesense_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...(init.headers as Record<string, string> ?? {}),
  };
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      detail = json.detail ?? detail;
    } catch {
      // ignore parse error
    }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'moderator' | 'admin';
  language: string;
  createdAt: string;
}

export async function apiRegister(email: string, password: string, name: string, language = 'en') {
  const data = await request<{ access_token: string; user: ApiUser }>(
    '/api/auth/register',
    { method: 'POST', body: JSON.stringify({ email, password, name, language }) },
  );
  localStorage.setItem('safesense_token', data.access_token);
  return data;
}

export async function apiLogin(email: string, password: string) {
  // OAuth2PasswordRequestForm requires form-encoded body
  const form = new URLSearchParams({ username: email, password });
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.detail ?? 'Login failed');
  }
  const data: { access_token: string; user: ApiUser } = await res.json();
  localStorage.setItem('safesense_token', data.access_token);
  return data;
}

export function apiLogout() {
  localStorage.removeItem('safesense_token');
  return request('/api/auth/logout', { method: 'POST' }).catch(() => { });
}

export function apiGetMe() {
  return request<ApiUser>('/api/auth/me');
}

export function apiUpdateProfile(body: { language?: string; name?: string }) {
  return request<{ id: string; name: string; language: string }>('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

// ─── Assessments ──────────────────────────────────────────────────────────

export function apiStartAssessment(language: string, interaction_mode: string) {
  return request<{ id: string; case_ref: string }>('/api/assessments/start', {
    method: 'POST',
    body: JSON.stringify({ language, interaction_mode }),
  });
}

export interface CompleteAssessmentPayload {
  messages: { role: string; content: string }[];
  combined_text: string;
  voice_metadata?: {
    speaking_rate_wpm?: number;
    speech_duration_seconds?: number;
    pause_count?: number;
    avg_pause_duration_ms?: number;
  } | null;
  structured_data?: Record<string, number> | null;
  is_demo?: boolean;
  demo_scenario?: string;
}

export function apiCompleteAssessment(id: string, payload: CompleteAssessmentPayload) {
  return request<any>(`/api/assessments/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function apiGetMyAssessments() {
  return request<any[]>('/api/assessments/mine');
}

export function apiGetAdminStats() {
  return request<{
    total_users: number;
    total_assessments: number;
    total_checkins: number;
    total_support_requests: number;
    pending_alerts: number;
    open_cases: number;
    average_score: number | null;
    risk_distribution: Record<string, number>;
    language_distribution: Record<string, number>;
  }>('/api/admin/stats');
}

export function apiGetAssessment(id: string) {
  return request<any>(`/api/assessments/${id}`);
}

// ─── Chat ─────────────────────────────────────────────────────────────────

export function apiCreateChatSession() {
  return request<{ session_id: string }>('/api/chat/session', { method: 'POST' });
}

export function apiSendChatMessage(sessionId: string, content: string, language = 'en') {
  return request<{ user_message: any; ai_message: any }>(`/api/chat/${sessionId}/message`, {
    method: 'POST',
    body: JSON.stringify({ content, language }),
  });
}

export function apiGetChatMessages(sessionId: string) {
  return request<{ session_id: string; messages: any[] }>(`/api/chat/${sessionId}/messages`);
}

export function apiClearChatSession(sessionId: string) {
  return request(`/api/chat/${sessionId}`, { method: 'DELETE' });
}

// ─── Check-ins ─────────────────────────────────────────────────────────────

export interface CheckInData {
  mood: number;
  stress_level: number;
  safety_level: number;
  emotional_wellbeing: number;
  support_needed: boolean;
  notes?: string;
}

export function apiSubmitCheckIn(data: CheckInData) {
  return request<any>('/api/checkins/today', { method: 'POST', body: JSON.stringify(data) });
}

export function apiGetTodayCheckIn() {
  return request<{ checked_in_today: boolean; data?: any }>('/api/checkins/today');
}

export function apiGetCheckInHistory() {
  return request<any[]>('/api/checkins/history');
}

// ─── Progress ─────────────────────────────────────────────────────────────

export function apiGetProgress() {
  return request<any>('/api/progress/summary');
}

// ─── Support Requests ─────────────────────────────────────────────────────

export function apiCreateSupportRequest(type: string, message?: string, assessment_id?: string) {
  return request<any>('/api/support/request', {
    method: 'POST',
    body: JSON.stringify({ request_type: type, message, assessment_id }),
  });
}

export function apiGetMySupportRequests() {
  return request<any[]>('/api/support/mine');
}

export function apiRequestFollowUp(assessment_id?: string, notes?: string) {
  return request<any>('/api/support/followup', {
    method: 'POST',
    body: JSON.stringify({ assessment_id, notes }),
  });
}

export function apiGetMyFollowUps() {
  return request<any[]>('/api/support/followups');
}

// ─── Moderator ─────────────────────────────────────────────────────────────

export function apiGetModeratorCases(risk?: string, status?: string) {
  const params = new URLSearchParams();
  if (risk) params.set('risk', risk);
  if (status) params.set('status', status);
  return request<any[]>(`/api/moderator/cases?${params}`);
}

export function apiGetModeratorCaseDetail(caseId: string) {
  return request<any>(`/api/moderator/cases/${caseId}`);
}

export function apiUpdateCase(caseId: string, data: Record<string, unknown>) {
  return request<any>(`/api/moderator/cases/${caseId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function apiGetAlerts() {
  return request<any[]>('/api/moderator/alerts');
}

export function apiAcknowledgeAlert(alertId: string) {
  return request<any>(`/api/moderator/alerts/${alertId}/acknowledge`, { method: 'POST' });
}

export function apiGetModeratorStats() {
  return request<any>('/api/moderator/stats');
}

export function apiGetAllSupportRequests() {
  return request<any[]>('/api/support/all');
}

export function apiUpdateSupportRequest(id: string, status: string, resolution_notes?: string) {
  return request<any>(`/api/support/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, resolution_notes }),
  });
}

// ─── Resources ─────────────────────────────────────────────────────────────

export function apiGetResources(category?: string) {
  const params = category ? `?category=${category}` : '';
  return request<any[]>(`/api/resources${params}`);
}

// ─── Admin ─────────────────────────────────────────────────────────────────

export function apiGetUsers() {
  return request<any[]>('/api/admin/users');
}

export function apiGetAuditLogs(limit = 100) {
  return request<any[]>(`/api/admin/audit-logs?limit=${limit}`);
}

export function apiGetSystemStats() {
  return request<any>('/api/admin/stats');
}
