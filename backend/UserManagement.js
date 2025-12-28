
/**
 * USER ACCESS MANAGEMENT
 */

function handleGetUserForEmployee({ employeeId }) {
  const u = getDataRows('USERS', 'Master').find(r => String(r[4]) === String(employeeId));
  return success(u ? { 
    username: String(u[0]), 
    password: String(u[1]), 
    role: String(u[2]), 
    name: String(u[3]), 
    employeeId: String(u[4]), 
    assignedClass: String(u[5]||''), 
    assignedSection: String(u[6]||'') 
  } : null);
}

function handleSaveUserAccess({ user: u }) {
  const ss = getSpreadsheet('USERS');
  const sheet = getOrCreateSheet(ss, 'Master', ['username', 'password', 'role', 'name', 'employeeId', 'assignedClass', 'assignedSection', 'photoUrl']);
  const rows = sheet.getDataRange().getValues();
  
  if (rows.some(r => String(r[0]) === u.username && String(r[4]) !== u.employeeId)) return error('Username already taken by another user.');

  let photoUrl = '';
  const empRows = getDataRows('EMPLOYEES', 'Master');
  const empRow = empRows.find(r => String(r[0]) === String(u.employeeId));
  if (empRow) {
    photoUrl = String(empRow[19] || '');
  }

  const idx = rows.findIndex(r => String(r[4]) === String(u.employeeId));
  if (idx > -1 && !photoUrl) {
    photoUrl = String(rows[idx][7] || '');
  }

  const rowData = [
    u.username, 
    u.password, 
    u.role, 
    u.name, 
    u.employeeId, 
    u.role === 'TEACHER' ? u.assignedClass : '', 
    u.role === 'TEACHER' ? u.assignedSection : '',
    photoUrl
  ];

  if (idx > -1) {
    sheet.getRange(idx + 1, 1, 1, 8).setValues([rowData]);
    return success(null, 'User access updated');
  }
  
  sheet.appendRow(rowData);
  return success(null, 'User access created');
}

function handleRemoveUserAccess({ employeeId }) {
  const ss = getSpreadsheet('USERS');
  const sheet = ss.getSheetByName('Master');
  if (!sheet) return error('User registry not found');
  
  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => String(r[4]) === String(employeeId));
  if (idx > -1) { 
    sheet.deleteRow(idx + 1); 
    return success(null, 'Access removed'); 
  }
  return error('User not found');
}

/**
 * STUDENT USER ACCESS
 */

function handleGetUserForStudent({ admissionNo }) {
  const sRows = getDataRows('STUDENTS', 'Master');
  const sRow = sRows.find(r => String(r[0]) === String(admissionNo));
  if (!sRow) return success(null);
  
  const className = String(sRow[3]);
  const classSheetName = `Students_${className}`;
  
  const ss = getSpreadsheet('USERS');
  const sheet = ss.getSheetByName(classSheetName);
  if (!sheet) return success(null);

  const u = sheet.getDataRange().getValues().find(r => String(r[4]) === String(admissionNo));
  return success(u ? { 
    username: String(u[0]), 
    password: String(u[1]), 
    role: 'STUDENT', 
    name: String(u[3]), 
    admissionNo: String(u[4]),
    assignedClass: className,
    assignedSection: String(sRow[4])
  } : null);
}

function handleSaveStudentUserAccess({ user: u }) {
  const ss = getSpreadsheet('USERS');
  const sheets = ss.getSheets();
  
  // Cross-check username uniqueness across all user sheets
  for (let s of sheets) {
    const name = s.getName();
    if (name === 'Master' || name.startsWith('Students_')) {
      const data = s.getDataRange().getValues();
      if (data.some(r => String(r[0]) === u.username && String(r[4]) !== u.admissionNo)) {
        return error('Username already taken');
      }
    }
  }

  const sRows = getDataRows('STUDENTS', 'Master');
  const sRow = sRows.find(r => String(r[0]) === String(u.admissionNo));
  if (!sRow) return error('Student record not found');
  
  const className = String(sRow[3]);
  const section = String(sRow[4]);
  const photoUrl = String(sRow[16] || '');
  const classSheetName = `Students_${className}`;
  
  const sheet = getOrCreateSheet(ss, classSheetName, ['Username', 'Password', 'Role', 'Name', 'AdmissionNo', 'Class', 'Section', 'Photo']);
  const rows = sheet.getDataRange().getValues();
  const idx = rows.findIndex(r => String(r[4]) === String(u.admissionNo));
  
  const rowData = [
    u.username, 
    u.password, 
    'STUDENT', 
    u.name, 
    u.admissionNo, 
    className, 
    section,
    photoUrl
  ];

  if (idx > -1) {
    sheet.getRange(idx + 1, 1, 1, 8).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  
  return success(null, 'Student access enabled');
}

function handleRemoveStudentUserAccess({ admissionNo }) {
  const sRows = getDataRows('STUDENTS', 'Master');
  const sRow = sRows.find(r => String(r[0]) === String(admissionNo));
  if (!sRow) return error('Student not found');

  const classSheetName = `Students_${sRow[3]}`;
  const ss = getSpreadsheet('USERS');
  const sheet = ss.getSheetByName(classSheetName);
  if (!sheet) return error('Access record not found');

  const rows = sheet.getDataRange().getValues();
  const idx = rows.findIndex(r => String(r[4]) === String(admissionNo));
  if (idx > -1) { 
    sheet.deleteRow(idx + 1); 
    return success(null, 'Access removed'); 
  }
  return error('User record not found in class sheet');
}
