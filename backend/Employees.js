
function handleGetEmployees() {
  const rows = getDataRows('EMPLOYEES', 'Master');
  return success(rows.map(r => ({
    employeeId: String(r[0]), name: String(r[1]), post: String(r[2]), phone1: String(r[3]), email: String(r[4]), 
    joiningDate: String(r[5]), salary: Number(r[6]), fatherName: String(r[7]), motherName: String(r[8]), dob: String(r[9]), 
    gender: String(r[10]), qualification: String(r[11]), experience: String(r[12]), address: String(r[13]), 
    phone2: String(r[14]), aadhaar: String(r[15]), pan: String(r[16]), bankAccount: String(r[17]), ifsc: String(r[18]), photoUrl: String(r[19])
  })));
}

function handleGetEmployeeDetails(d) {
  const rows = getDataRows('EMPLOYEES', 'Master');
  const r = rows.find(row => String(row[0]) === String(d.employeeId));
  if (!r) return error('Not found');
  return success({
    employeeId: String(r[0]), name: String(r[1]), post: String(r[2]), phone1: String(r[3]), email: String(r[4]), 
    joiningDate: String(r[5]), salary: Number(r[6]), fatherName: String(r[7]), motherName: String(r[8]), dob: String(r[9]), 
    gender: String(r[10]), qualification: String(r[11]), experience: String(r[12]), address: String(r[13]), 
    phone2: String(r[14]), aadhaar: String(r[15]), pan: String(r[16]), bankAccount: String(r[17]), ifsc: String(r[18]), photoUrl: String(r[19])
  });
}

function handleAddEmployee({ employee: e, photoBase64, photoMimeType }) {
  const ss = getSpreadsheet('EMPLOYEES');
  const sheet = getOrCreateSheet(ss, 'Master');
  const photoUrl = uploadFile(photoBase64, photoMimeType, `emp_${e.employeeId}`, "Staff_Photos");
  sheet.appendRow([e.employeeId, e.name, e.post, e.phone1, e.email, e.joiningDate, Number(e.salary), e.fatherName, e.motherName, e.dob, e.gender, e.qualification, e.experience, e.address, e.phone2, e.aadhaar, e.pan, e.bankAccount, e.ifsc, photoUrl]);
  return success(null, 'Added');
}

function handleUpdateEmployee({ employee: e, photoBase64, photoMimeType }) {
  const ss = getSpreadsheet('EMPLOYEES');
  const sheet = ss.getSheetByName('Master');
  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => String(r[0]) === String(e.employeeId));
  if (idx === -1) return error('Not found');
  let pUrl = e.photoUrl;
  if (photoBase64) pUrl = uploadFile(photoBase64, photoMimeType, `emp_${e.employeeId}`, "Staff_Photos");
  const row = [e.employeeId, e.name, e.post, e.phone1, e.email, e.joiningDate, Number(e.salary), e.fatherName, e.motherName, e.dob, e.gender, e.qualification, e.experience, e.address, e.phone2, e.aadhaar, e.pan, e.bankAccount, e.ifsc, pUrl];
  sheet.getRange(idx + 1, 1, 1, row.length).setValues([row]);
  return success({ photoUrl: pUrl }, 'Updated');
}

function handleDeleteEmployee(d) {
  const ss = getSpreadsheet('EMPLOYEES');
  const sheet = ss.getSheetByName('Master');
  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => String(r[0]) === String(d.employeeId));
  if (idx > -1) {
    archiveRecord('EMPLOYEES', d.employeeId, data[idx], d.deletedBy);
    sheet.deleteRow(idx + 1);
    return success(null, 'Archived');
  }
  return error('Not found');
}

function handleGetNextEmployeeId() {
  const rows = getDataRows('EMPLOYEES', 'Master');
  const max = rows.reduce((m, r) => {
    const num = parseInt(String(r[0]).replace('EMP', ''));
    return isNaN(num) ? m : Math.max(m, num);
  }, 0);
  return success('EMP' + String(max + 1).padStart(3, '0'));
}

// --- Schedule & Holiday Handlers ---

function handleGetTeacherHolidays({ staffId }) {
  const rows = getDataRows('EMPLOYEE_ATTENDANCE', 'Holidays');
  return success(rows.filter(r => String(r[1]) === String(staffId)).map(r => ({
    date: String(r[0]), description: String(r[2])
  })));
}

function handleSetTeacherHoliday({ staffId, date, description, markedBy }) {
  const ss = getSpreadsheet('EMPLOYEE_ATTENDANCE');
  const sheet = getOrCreateSheet(ss, 'Holidays', ['Date', 'EmployeeID', 'Reason', 'MarkedBy', 'At']);
  sheet.appendRow([date, staffId, description, markedBy, new Date()]);
  return success(null, 'Leave recorded');
}

function handleGetTeacherSchedule({ teacherId }) {
  const rows = getDataRows('EMPLOYEES', 'Time_Table');
  return success(rows.filter(r => String(r[1]) === String(teacherId)).map(r => ({
    id: String(r[0]), teacherId: String(r[1]), teacherName: String(r[2]), day: String(r[3]), timeSlot: String(r[4]), subject: String(r[5]), className: String(r[6])
  })));
}

function handleGetClassSchedule({ className, section }) {
  const rows = getDataRows('EMPLOYEES', 'Time_Table');
  const target = `${className}-${section}`;
  return success(rows.filter(r => String(r[6]) === target).map(r => ({
    id: String(r[0]), teacherId: String(r[1]), teacherName: String(r[2]), day: String(r[3]), timeSlot: String(r[4]), subject: String(r[5]), className: String(r[6])
  })));
}

function handleSaveSchedule({ teacherId, teacherName, day, timeSlot, subject, className }) {
  const ss = getSpreadsheet('EMPLOYEES');
  const sheet = getOrCreateSheet(ss, 'Time_Table');
  const data = sheet.getDataRange().getValues();
  
  // Find duplicate slot for this class
  const idx = data.findIndex(r => String(r[3]) === day && String(r[4]) === timeSlot && String(r[6]) === className);
  const id = idx > -1 ? String(data[idx][0]) : 'SCH-' + Date.now();
  const row = [id, teacherId, teacherName, day, timeSlot, subject, className];
  
  if (idx > -1) {
    sheet.getRange(idx + 1, 1, 1, 7).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  return success(null, 'Schedule updated');
}

function handleDeleteSchedule({ day, timeSlot, className }) {
  const ss = getSpreadsheet('EMPLOYEES');
  const sheet = ss.getSheetByName('Time_Table');
  if (!sheet) return error('No table');
  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => String(r[3]) === day && String(r[4]) === timeSlot && String(r[6]) === className);
  if (idx > -1) {
    sheet.deleteRow(idx + 1);
    return success(null, 'Slot cleared');
  }
  return error('Not found');
}
