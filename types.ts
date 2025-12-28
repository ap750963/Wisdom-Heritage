
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  MANAGEMENT = 'MANAGEMENT'
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  employeeId?: string;
  admissionNo?: string;
  assignedClass?: string;
  assignedSection?: string;
  password?: string;
  phone?: string;
  email?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'sports' | 'academic' | 'holiday' | 'other';
  audience?: 'all' | 'staff' | 'students';
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
  postedBy: string;
}

export interface ScheduleEntry {
  id: string;
  teacherId?: string;
  teacherName?: string;
  day: string;
  timeSlot: string;
  subject: string;
  className: string;
}

export interface Homework {
  id: string;
  className: string;
  section: string;
  date: string;
  subject: string;
  content: string;
  teacherName: string;
  timestamp: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  attendanceRate: number;
  revenue: string;
}

export interface Student {
  admissionNo: string;
  rollNo?: string;
  name: string;
  photoUrl: string;
  fatherName: string;
  motherName: string;
  dob: string;
  class: string;
  section: string;
  aadhaar: string;
  samagraId: string;
  address: string;
  phone1: string;
  phone2: string;
  joiningDate: string;
  totalFees: number;
  status: 'Active' | 'Left';
}

export interface Employee {
  employeeId: string;
  name: string;
  photoUrl?: string;
  fatherName: string;
  motherName: string;
  post: string;
  qualification: string;
  experience: string;
  joiningDate: string;
  salary: number;
  phone1: string;
  phone2?: string;
  email?: string;
  address: string;
  dob?: string;
  gender?: string;
  aadhaar?: string;
  pan?: string;
  bankAccount?: string;
  ifsc?: string;
}

export interface FeeRecord {
  date: string;
  amount: number;
  mode: string;
  remarks?: string;
  receiptNo?: string;
}

export interface FeeSummary {
  totalFees: number;
  paidFees: number;
  dueFees: number;
  history: FeeRecord[];
}

export interface FeeTransaction {
  date: string;
  admissionNo: string;
  studentName: string;
  studentClass: string;
  amount: number;
  mode: string;
  remarks: string;
  receiptNo?: string;
}

export interface FeeDashboardData {
  monthlyCollection: number;
  recentTransactions: FeeTransaction[];
}

export interface Expense {
  date: string;
  receiptNumber: string;
  category: 'Purchase' | 'Withdrawal' | 'Salary' | string;
  title: string; // Purpose
  amount: number;
  paymentMode: string;
  reference?: string; // Receipt reference / Transaction ID
  remarks?: string;
  approvedBy: string;
  linkedEmployeeId?: string;
  linkedEmployeeName?: string;
}

export interface ExpenseDashboardData {
  monthlyExpenses: number;
  recentExpenses: Expense[];
}

export interface SubjectResult {
  subject: string;
  marks: number;
  maxMarks: number;
}

export interface ExamResult {
  examName: string;
  subjects: SubjectResult[];
}

export interface SubjectDefinition {
  name: string;
  maxMarks: number;
}

export interface ExamDefinition {
  examId: string;
  examName: string;
  subjects: SubjectDefinition[];
}

export interface AttendanceRecord {
  date: string;
  status: 'Present' | 'Absent';
}

export interface AttendanceStats {
  presentCount: number;
  absentCount: number;
  totalDays: number;
  percentage: number;
  recentHistory: AttendanceRecord[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
