// Database Types for KIPL Compliance Platform

export type UserRole = 'kipl_admin' | 'kipl_user' | 'gramercy_viewer' | 'super_admin';
export type Organization = 'KIPL' | 'Gramercy';
export type ComplianceFrequency = 'Monthly' | 'Quarterly' | 'Half-yearly' | 'Yearly' | 'One-time' | 'As required';
export type ComplianceStatus = 'compliant' | 'due_60' | 'due_30' | 'due_7' | 'expired' | 'pending';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type AlertLevel = 'info' | 'warning' | 'urgent' | 'critical';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  organization: Organization;
  created_at: string;
  updated_at: string;
}

export interface Compliance {
  id: string;
  department: string;
  compliance_category: string;
  particulars: string;
  frequency: ComplianceFrequency;
  due_date: string;
  next_due_date: string | null;
  scope_applicable: boolean;
  remarks: string | null;
  owner_id: string | null;
  status: ComplianceStatus;
  priority: Priority;
  certificate_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  owner?: UserProfile; // Joined data
}

export interface Alert {
  id: string;
  compliance_id: string;
  alert_level: AlertLevel;
  alert_message: string;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
  compliance?: Compliance; // Joined data
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  changes: any;
  created_at: string;
  user?: UserProfile; // Joined data
}

export interface DashboardStats {
  total: number;
  compliant: number;
  due_60: number;
  due_30: number;
  due_7: number;
  expired: number;
  pending: number;
}

export interface ComplianceFormData {
  department: string;
  compliance_category: string;
  particulars: string;
  frequency: ComplianceFrequency;
  due_date: string;
  scope_applicable: boolean;
  remarks?: string;
  owner_id?: string;
}
