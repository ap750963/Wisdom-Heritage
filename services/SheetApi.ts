
import { ApiResponse, LoginResponse, User, UserRole, DashboardStats, CalendarEvent, Student, FeeSummary, ExamResult, AttendanceStats, Employee, FeeDashboardData, Expense, ExpenseDashboardData, ExamDefinition, SubjectDefinition, ScheduleEntry, Homework } from '../types';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzK7e_yn0ieWf_Ejc82vLkYNiyv5B-tHuoH7mSqaZbusJPGb6FWxjpWNyMBIPC8f9Z-zg/exec'; 

class SheetApiService {
  private baseUrl: string;
  private cachePrefix = 'wh_cache_';
  private CACHE_DURATION = 30 * 60 * 1000; 

  constructor(url: string) {
    this.baseUrl = url;
  }

  public async request<T>(action: string, payload: any = {}, useCache = false): Promise<ApiResponse<T>> {
    // Fix: Handle Unicode characters for btoa by encoding to UTF-8 first
    const payloadStr = JSON.stringify({ action, ...payload });
    const safeBase64 = btoa(encodeURIComponent(payloadStr).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
    }));
    const cacheKey = this.cachePrefix + safeBase64.substring(0, 32);
    
    if (useCache) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          const isStale = Date.now() - timestamp > this.CACHE_DURATION;
          if (!isStale) {
            this.fetchAndCache(action, payload, cacheKey); 
            return { success: true, data };
          }
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      }
    }

    return this.fetchAndCache<T>(action, payload, cacheKey);
  }

  private async fetchAndCache<T>(action: string, payload: any, cacheKey: string): Promise<ApiResponse<T>> {
    if (!this.baseUrl || this.baseUrl.includes('YOUR_NEW_DEPLOYMENT_ID_HERE')) {
      return { success: false, message: "API URL is not configured." };
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, ...payload }),
        redirect: 'follow'
      });

      const data = await response.json();
      
      // Fix: Ensure message is always a string to prevent [object Object] in alerts
      if (data && typeof data.message === 'object') {
        data.message = JSON.stringify(data.message);
      } else if (data && !data.message) {
        data.message = "";
      }

      if (data.success) {
        localStorage.setItem(cacheKey, JSON.stringify({ data: data.data, timestamp: Date.now() }));
      }
      return data;
    } catch (error) {
      console.error("API Request Failed", error);
      return { success: false, message: "Network error. Please check your connection or Script URL." };
    }
  }

  public clearCache(actionPrefix?: string) {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.cachePrefix)) localStorage.removeItem(key);
    });
  }

  // --- API Methods ---

  async getHomework(className: string, section: string, date?: string): Promise<ApiResponse<Homework[]>> {
    return this.request('getHomework', { className, section, date });
  }

  async addHomework(payload: { className: string, section: string, date: string, entries: { subject: string, content: string }[] }): Promise<ApiResponse<any>> {
    return this.request('addHomework', { homework: payload });
  }

  async deleteHomework(id: string): Promise<ApiResponse<any>> {
    return this.request('deleteHomework', { id });
  }

  async getSystemConfig(): Promise<ApiResponse<{ activeYear: string }>> {
    return this.request('getSystemConfig', {}, true);
  }

  async updateSystemConfig(activeYear: string): Promise<ApiResponse<any>> {
    const res = await this.request('updateSystemConfig', { activeYear });
    if (res.success) this.clearCache();
    return res;
  }

  async login(username: string, pass: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('login', { username, pass });
  }

  async getMyProfile(username: string): Promise<ApiResponse<User>> {
    return this.request<User>('getMyProfile', { username }, true);
  }

  async updatePassword(username: string, oldPassword: string, newPassword: string): Promise<ApiResponse<any>> {
    const res = await this.request('updatePassword', { username, oldPassword, newPassword });
    if (res.success) this.clearCache();
    return res;
  }

  async updateProfilePhoto(username: string, photoFile: File): Promise<ApiResponse<{photoUrl: string}>> {
    try {
        const base64String = await this.fileToBase64(photoFile);
        const photoBase64 = base64String.split(',')[1];
        const mimeType = photoFile.type;
        const res = await this.request<any>('updateProfilePhoto', { username, photoBase64, mimeType });
        if (res.success) this.clearCache();
        return res;
    } catch (e) {
        return { success: false, message: "File processing failed" };
    }
  }

  async getStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request<DashboardStats>('getStats', {}, true);
  }

  async getEvents(): Promise<ApiResponse<CalendarEvent[]>> {
    return this.request<CalendarEvent[]>('getEvents', {}, true);
  }

  async addEvent(event: Omit<CalendarEvent, 'id'>): Promise<ApiResponse<any>> {
    const res = await this.request('addEvent', { event });
    if (res.success) this.clearCache();
    return res;
  }

  async updateEvent(event: CalendarEvent): Promise<ApiResponse<any>> {
    const res = await this.request('updateEvent', { event });
    if (res.success) this.clearCache();
    return res;
  }

  async removeEvent(id: string): Promise<ApiResponse<any>> {
    const res = await this.request('removeEvent', { id });
    if (res.success) this.clearCache();
    return res;
  }

  async getNextAdmissionNumber(): Promise<ApiResponse<string>> {
    return this.request<string>('getNextAdmissionNumber');
  }

  async archiveStudent(admissionNo: string, deletedBy: string): Promise<ApiResponse<any>> {
    const res = await this.request('archiveStudent', { admissionNo, deletedBy });
    if (res.success) this.clearCache();
    return res;
  }

  async getStudents(currentUser?: User | null, bypassCache = false): Promise<ApiResponse<Student[]>> {
    return this.request<Student[]>('getStudents', {
        role: currentUser?.role,
        assignedClass: currentUser?.assignedClass || '',
        assignedSection: currentUser?.assignedSection || ''
    }, !bypassCache);
  }
  
  async getStudentDetails(admissionNo: string, currentUser?: User | null): Promise<ApiResponse<Student>> {
    return this.request<Student>('getStudentDetails', { 
        admissionNo,
        role: currentUser?.role,
        assignedClass: currentUser?.assignedClass || '',
        assignedSection: currentUser?.assignedSection || ''
    }, true);
  }

  async getFeeDashboard(): Promise<ApiResponse<FeeDashboardData>> {
    return this.request<FeeDashboardData>('getFeeDashboard', {}, true);
  }

  async collectFee(admissionNo: string, amount: number, mode: string, remarks: string): Promise<ApiResponse<any>> {
    const res = await this.request('collectFee', { admissionNo, amount, mode, remarks });
    if (res.success) this.clearCache();
    return res;
  }

  async addStudent(student: Omit<Student, 'photoUrl'>, photoFile?: File): Promise<ApiResponse<any>> {
    let photoBase64 = null;
    let photoMimeType = null;
    if (photoFile) {
      const base64String = await this.fileToBase64(photoFile);
      photoBase64 = base64String.split(',')[1];
      photoMimeType = photoFile.type;
    }
    const res = await this.request('addStudent', { student, photoBase64, photoMimeType });
    if (res.success) this.clearCache();
    return res;
  }

  async updateStudent(student: Student, photoFile?: File): Promise<ApiResponse<any>> {
    let photoBase64 = null;
    let photoMimeType = null;
    if (photoFile) {
      const base64String = await this.fileToBase64(photoFile);
      photoBase64 = base64String.split(',')[1];
      photoMimeType = photoFile.type;
    }
    const res = await this.request('updateStudent', { student, photoBase64, photoMimeType });
    if (res.success) this.clearCache();
    return res;
  }

  async getEmployees(): Promise<ApiResponse<Employee[]>> {
    return this.request<Employee[]>('getEmployees', {}, true);
  }

  async getEmployeeDetails(employeeId: string): Promise<ApiResponse<Employee>> {
    return this.request<Employee>('getEmployeeDetails', { employeeId }, true);
  }

  async getNextEmployeeId(): Promise<ApiResponse<string>> {
    return this.request<string>('getNextEmployeeId');
  }

  async addEmployee(employee: Employee, photoFile?: File): Promise<ApiResponse<any>> {
    let photoBase64 = null;
    let photoMimeType = null;
    if (photoFile) {
      const base64String = await this.fileToBase64(photoFile);
      photoBase64 = base64String.split(',')[1];
      photoMimeType = photoFile.type;
    }
    const res = await this.request('addEmployee', { employee, photoBase64, photoMimeType });
    if (res.success) this.clearCache();
    return res;
  }

  async updateEmployee(employee: Employee, photoFile?: File): Promise<ApiResponse<any>> {
    let photoBase64 = null;
    let photoMimeType = null;
    if (photoFile) {
      const base64String = await this.fileToBase64(photoFile);
      photoBase64 = base64String.split(',')[1];
      photoMimeType = photoFile.type;
    }
    const res = await this.request('updateEmployee', { employee, photoBase64, photoMimeType });
    if (res.success) this.clearCache();
    return res;
  }

  async deleteEmployee(employeeId: string, deletedBy: string): Promise<ApiResponse<any>> {
    const res = await this.request('deleteEmployee', { employeeId, deletedBy });
    if (res.success) this.clearCache();
    return res;
  }

  async getStaffAttendance(date: string): Promise<ApiResponse<(Employee & { status: string | null })[]>> {
    return this.request('getStaffAttendanceData', { date });
  }

  async markStaffAttendance(date: string, attendanceList: { employeeId: string, status: string }[]): Promise<ApiResponse<any>> {
    const res = await this.request('submitStaffAttendance', { date, attendanceList });
    if (res.success) this.clearCache();
    return res;
  }

  async getExpenses(): Promise<ApiResponse<ExpenseDashboardData>> {
    return this.request<ExpenseDashboardData>('getExpenses', {}, true);
  }

  async getNextExpenseReceiptNumber(): Promise<ApiResponse<string>> {
    return this.request<string>('getNextExpenseReceiptNumber');
  }

  async addExpense(expense: Expense): Promise<ApiResponse<any>> {
    const res = await this.request('addExpense', { expense });
    if (res.success) this.clearCache();
    return res;
  }

  async createExam(examName: string, subjects: SubjectDefinition[], createdBy: string): Promise<ApiResponse<any>> {
    const res = await this.request('createExam', { examName, subjects, createdBy });
    if (res.success) this.clearCache();
    return res;
  }

  async getExams(): Promise<ApiResponse<ExamDefinition[]>> {
    return this.request<ExamDefinition[]>('getExams', {}, true);
  }

  async getClassResults(examName: string, className: string, section: string): Promise<ApiResponse<Record<string, Record<string, number>>>> {
    return this.request<Record<string, Record<string, number>>>('getClassResults', { examName, className, section }, false);
  }

  async saveStudentMarks(admissionNo: string, examName: string, marks: any[], className: string, section: string): Promise<ApiResponse<any>> {
    const res = await this.request('saveStudentMarks', { admissionNo, examName, marks, className, section });
    if (res.success) this.clearCache();
    return res;
  }

  async addMarks(admissionNo: string, examName: string, marks: any[]): Promise<ApiResponse<any>> {
    const res = await this.request('addMarks', { admissionNo, examName, marks });
    if (res.success) this.clearCache();
    return res;
  }

  async getAttendanceData(params: { class: string; section: string; date: string; role?: string; assignedClass?: string; assignedSection?: string }): Promise<ApiResponse<any>> {
    return this.request<any>('getAttendanceData', params, false);
  }

  async markAttendance(admissionNo: string, status: 'Present' | 'Absent', date: string): Promise<ApiResponse<any>> {
    const res = await this.request('markAttendance', { admissionNo, status, date });
    if (res.success) this.clearCache();
    return res;
  }

  async markClassAttendance(className: string, section: string, date: string, attendanceList: any[]): Promise<ApiResponse<any>> {
    const res = await this.request('markAttendance', { class: className, section, date, attendanceList });
    if (res.success) this.clearCache();
    return res;
  }

  async exportAttendanceCSV(params: { class: string, section: string, startDate: string, endDate: string, teacherId: string }): Promise<ApiResponse<string>> {
    return this.request<string>('exportAttendanceCSV', params);
  }

  async getStudentFees(admissionNo: string, totalFees: number): Promise<ApiResponse<FeeSummary>> {
    return this.request<FeeSummary>('getStudentFees', { admissionNo, totalFees }, false);
  }
  async getStudentResults(admissionNo: string): Promise<ApiResponse<ExamResult[]>> {
    return this.request<ExamResult[]>('getStudentResults', { admissionNo }, false);
  }
  async getStudentAttendance(admissionNo: string): Promise<ApiResponse<AttendanceStats>> {
    return this.request<AttendanceStats>('getStudentAttendance', { admissionNo }, false);
  }
  async getEmployeeAttendance(employeeId: string): Promise<ApiResponse<AttendanceStats>> {
    return this.request<AttendanceStats>('getEmployeeAttendance', { employeeId }, false);
  }
  async getTeacherSchedule(teacherId: string): Promise<ApiResponse<ScheduleEntry[]>> {
    return this.request('getTeacherSchedule', { teacherId }, true);
  }
  async getClassSchedule(className: string, section: string): Promise<ApiResponse<ScheduleEntry[]>> {
    return this.request('getClassSchedule', { className, section }, true);
  }
  async getTeacherHolidays(staffId: string): Promise<ApiResponse<any[]>> {
    return this.request('getTeacherHolidays', { staffId }, true);
  }
  async setTeacherHoliday(staffId: string, date: string, description: string, markedBy: string): Promise<ApiResponse<any>> {
    const res = await this.request('setTeacherHoliday', { staffId, date, description, markedBy });
    if (res.success) this.clearCache();
    return res;
  }
  async removeTeacherHoliday(staffId: string, date: string): Promise<ApiResponse<any>> {
    const res = await this.request('removeTeacherHoliday', { staffId, date });
    if (res.success) this.clearCache();
    return res;
  }
  async updateTimeSlot(teacherId: string, oldSlot: string, newSlot: string): Promise<ApiResponse<any>> {
    const res = await this.request('updateTimeSlot', { teacherId, oldSlot, newSlot });
    if (res.success) this.clearCache();
    return res;
  }

  async saveSchedule(teacherId: string, teacherName: string, day: string, timeSlot: string, subject: string, className: string): Promise<ApiResponse<any>> {
    const res = await this.request('saveSchedule', { teacherId, teacherName, day, timeSlot, subject, className });
    if (res.success) this.clearCache();
    return res;
  }

  async deleteSchedule(day: string, timeSlot: string, className: string): Promise<ApiResponse<any>> {
    const res = await this.request('deleteSchedule', { day, timeSlot, className });
    if (res.success) this.clearCache();
    return res;
  }

  async getUserForEmployee(employeeId: string): Promise<ApiResponse<any>> {
    return this.request('getUserForEmployee', { employeeId });
  }
  async saveUserAccess(user: any): Promise<ApiResponse<any>> {
    const res = await this.request('saveUserAccess', { user });
    if (res.success) this.clearCache();
    return res;
  }
  async removeUserAccess(employeeId: string): Promise<ApiResponse<any>> {
    const res = await this.request('removeUserAccess', { employeeId });
    if (res.success) this.clearCache();
    return res;
  }

  async getUserForStudent(admissionNo: string): Promise<ApiResponse<any>> {
    return this.request('getUserForStudent', { admissionNo });
  }
  async saveStudentUserAccess(user: any): Promise<ApiResponse<any>> {
    const res = await this.request('saveStudentUserAccess', { user });
    if (res.success) this.clearCache();
    return res;
  }
  async removeStudentUserAccess(admissionNo: string): Promise<ApiResponse<any>> {
    const res = await this.request('removeStudentUserAccess', { admissionNo });
    if (res.success) this.clearCache();
    return res;
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
}

export const sheetApi = new SheetApiService(SCRIPT_URL);
