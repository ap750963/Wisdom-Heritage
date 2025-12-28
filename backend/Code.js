
/**
 * MAIN ENTRY & ROUTER
 */

function setup() {
  console.log('--- Wisdom Heritage Initialization Started ---');
  const folder = getDbFolder();
  console.log('Target Folder: ' + folder.getName());
  
  // Provision USERS Module (Auth & Settings)
  const userSS = getSpreadsheet('USERS');
  const uSheet = getOrCreateSheet(userSS, 'Master', ['username', 'password', 'role', 'name', 'employeeId', 'assignedClass', 'assignedSection', 'photoUrl']);
  const userData = uSheet.getDataRange().getValues();
  if (!userData.some(r => String(r[0]).trim() === 'admin')) {
    uSheet.appendRow(['admin', 'admin123', 'ADMIN', 'System Administrator', 'ROOT-001', '', '', '']);
  }
  getOrCreateSheet(userSS, 'Settings', ['Property', 'Value']);

  // Provision All other Modules
  Object.keys(MODULES).forEach(key => {
    if (key === 'USERS') return;
    const ss = getSpreadsheet(key);
    
    if (key === 'STUDENTS') getOrCreateSheet(ss, 'Master', ['Admission No', 'Roll No', 'Name', 'Class', 'Section', 'Status', 'Father Name', 'Mother Name', 'DOB', 'Phone 1', 'Phone 2', 'Address', 'Aadhaar', 'Samagra ID', 'Joining Date', 'Total Fees', 'Photo URL']);
    if (key === 'EMPLOYEES') {
      getOrCreateSheet(ss, 'Master', ['Employee ID', 'Name', 'Post', 'Phone 1', 'Email', 'Joining Date', 'Salary', 'Father Name', 'Mother Name', 'DOB', 'Gender', 'Qualification', 'Experience', 'Address', 'Phone 2', 'Aadhaar', 'PAN', 'Bank Account', 'IFSC', 'Photo URL']);
      getOrCreateSheet(ss, 'Time_Table', ['ID', 'TeacherID', 'TeacherName', 'Day', 'Slot', 'Subject', 'Class']);
    }
    if (key === 'EVENTS') getOrCreateSheet(ss, 'Master', ['ID', 'Title', 'Date', 'Type', 'Audience']);
    if (key === 'FEES') getOrCreateSheet(ss, 'Collection_Log', ['Timestamp', 'AdmissionNo', 'Amount', 'Mode', 'Remarks', 'ReceiptNo']);
    if (key === 'EXPENSES') getOrCreateSheet(ss, 'Main_Ledger', ['Date', 'ReceiptNo', 'Category', 'Purpose', 'Amount', 'Mode', 'Ref', 'Remarks', 'ApprovedBy']);
    if (key === 'RESULTS') getOrCreateSheet(ss, 'Registry', ['ExamID', 'ExamName', 'Admin', 'CreatedAt', 'Subjects_JSON']);
    if (key === 'EMPLOYEE_ATTENDANCE') getOrCreateSheet(ss, 'Daily_Log', ['Date', 'EmployeeID', 'Status', 'Timestamp']);
    if (key === 'HOMEWORK') console.log('Homework module ready - Sheets created dynamically per class');
  });
  console.log('--- Initialization Complete ---');
}

function doGet(e) { 
  return success({ status: 'active', session: PROPS.getProperty('WH_SESSION_YEAR') || '2024-25' }, 'Wisdom Heritage API is online.'); 
}

function doPost(e) {
  try {
    if (!e.postData) return error('No payload received');
    const d = JSON.parse(e.postData.contents);
    const act = d.action;

    const ACTIONS = {
      // Auth & Profile
      'login': handleLogin, 
      'getMyProfile': handleGetMyProfile, 
      'updatePassword': handleUpdatePassword, 
      'updateProfilePhoto': handleUpdateProfilePhoto,
      
      // Dashboard
      'getStats': handleGetStats, 
      'getEvents': handleGetEvents, 
      'addEvent': handleAddEvent, 
      'updateEvent': handleUpdateEvent, 
      'removeEvent': handleRemoveEvent,
      
      // Students
      'getStudents': handleGetStudents, 
      'getStudentDetails': handleGetStudentDetails, 
      'addStudent': handleAddStudent, 
      'updateStudent': handleUpdateStudent, 
      'archiveStudent': handleArchiveStudent,
      'getNextAdmissionNumber': handleGetNextAdmissionNumber,
      
      // Attendance
      'getAttendanceData': handleGetAttendanceData, 
      'markAttendance': handleSubmitAttendance, 
      'getStudentAttendance': handleGetStudentAttendance,
      'getStaffAttendanceData': handleGetStaffAttendanceData, 
      'submitStaffAttendance': handleSubmitStaffAttendance,
      'getEmployeeAttendance': handleGetEmployeeAttendance,
      'notifyAbsentees': handleNotifyAbsentees,
      'exportAttendanceCSV': handleExportAttendanceCSV,
      
      // Fees
      'getFeeDashboard': handleGetFeeDashboard, 
      'getStudentFees': handleGetStudentFees, 
      'collectFee': handleCollectFee, 
      
      // Exams & Results
      'createExam': handleCreateExam, 
      'getExams': handleGetExams, 
      'getClassResults': handleGetClassResults,
      'saveStudentMarks': handleSaveStudentMarks, 
      'getStudentResults': handleGetStudentResults, 
      'addMarks': handleAddMarks,
      
      // Staff & HR
      'getEmployees': handleGetEmployees, 
      'getEmployeeDetails': handleGetEmployeeDetails,
      'addEmployee': handleAddEmployee, 
      'updateEmployee': handleUpdateEmployee, 
      'deleteEmployee': handleDeleteEmployee,
      'getNextEmployeeId': handleGetNextEmployeeId,
      'setTeacherHoliday': handleSetTeacherHoliday, 
      'getTeacherHolidays': handleGetTeacherHolidays,
      'removeTeacherHoliday': handleRemoveTeacherHoliday,
      'getTeacherSchedule': handleGetTeacherSchedule, 
      'getClassSchedule': handleGetClassSchedule,
      'saveSchedule': handleSaveSchedule, 
      'deleteSchedule': handleDeleteSchedule,
      
      // Finance
      'getExpenses': handleGetExpenses, 
      'getNextExpenseReceiptNumber': handleGetNextExpenseReceiptNumber, 
      'addExpense': handleAddExpense,
      
      // User Management
      'getUserForEmployee': handleGetUserForEmployee, 
      'saveUserAccess': handleSaveUserAccess, 
      'removeUserAccess': handleRemoveUserAccess,
      'getUserForStudent': handleGetUserForStudent, 
      'saveStudentUserAccess': handleSaveStudentUserAccess, 
      'removeStudentUserAccess': handleRemoveStudentUserAccess,
      
      // Admin
      'getSystemConfig': handleGetSystemConfig, 
      'updateSystemConfig': handleUpdateSystemConfig,
      'backupAndNewYear': handleBackupAndNewYear,
      
      // Learning
      'getHomework': handleGetHomework, 
      'addHomework': handleAddHomework,
      'deleteHomework': handleDeleteHomework
    };

    if (ACTIONS[act]) return ACTIONS[act](d);
    return error('Invalid action: ' + act);
  } catch (err) { 
    return error('Server Exception: ' + err.toString()); 
  }
}
