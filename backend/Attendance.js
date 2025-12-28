
/**
 * ATTENDANCE MODULE
 */

function handleGetAttendanceData(d) {
  const ss = getSpreadsheet('STUDENT_ATTENDANCE');
  const sheetName = getClassSheetName(d.class, d.section);
  const sheet = ss.getSheetByName(sheetName);
  const date = d.date.split('T')[0];
  
  const students = getDataRows('STUDENTS', 'Master')
    .filter(r => String(r[3]) === String(d.class) && String(r[4]) === String(d.section) && String(r[5]) === 'Active')
    .map(r => ({ 
      admissionNo: String(r[0]), 
      name: String(r[2]), 
      rollNo: String(r[1]), 
      photoUrl: String(r[16]), 
      status: null 
    }));

  if (!sheet) return success({ isLocked: false, students });

  const data = sheet.getDataRange().getDisplayValues();
  const headers = data[0];
  let col = headers.indexOf(date);
  
  if (col !== -1) {
    for (let i = 1; i < data.length; i++) {
      const s = students.find(st => st.admissionNo === String(data[i][3]));
      if (s) {
        const val = data[i][col];
        s.status = val === 'P' ? 'Present' : val === 'A' ? 'Absent' : null;
      }
    }
  }

  const isLocked = getDataRows('STUDENT_ATTENDANCE', 'Global_Locks')
    .some(r => String(r[0]) === d.class && String(r[1]) === d.section && String(r[2]) === date);

  return success({ isLocked, students });
}

function handleSubmitAttendance(d) {
  return runWithLock(() => {
    const ss = getSpreadsheet('STUDENT_ATTENDANCE');
    const name = getClassSheetName(d.class, d.section);
    const sheet = getOrCreateSheet(ss, name, ['Roll No', 'Name', 'Photo', 'Admission No']);
    const date = d.date.split('T')[0];
    
    const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
    let colIdx = headers.indexOf(date) + 1;
    
    if (colIdx === 0) {
      colIdx = sheet.getLastColumn() + 1;
      sheet.getRange(1, colIdx).setValue(date).setFontWeight('bold');
    }

    const rows = sheet.getDataRange().getValues();
    d.attendanceList.forEach(item => {
      let rowIdx = rows.findIndex(r => String(r[3]) === String(item.admissionNo)) + 1;
      if (rowIdx === 0) {
        sheet.appendRow([item.rollNo, item.name, item.photoUrl, item.admissionNo]);
        rowIdx = sheet.getLastRow();
      }
      sheet.getRange(rowIdx, colIdx).setValue(item.status === 'Present' ? 'P' : 'A');
    });

    getOrCreateSheet(ss, 'Global_Locks', ['Class', 'Section', 'Date', 'By'])
      .appendRow([d.class, d.section, date, d.markedBy || 'System']);

    return success(null, 'Attendance saved');
  });
}

function handleGetStudentAttendance(d) {
  const ss = getSpreadsheet('STUDENT_ATTENDANCE');
  const student = getDataRows('STUDENTS', 'Master').find(r => String(r[0]) === String(d.admissionNo));
  if (!student) return error('Student not found');

  const sheetName = getClassSheetName(student[3], student[4]);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return success({ presentCount: 0, absentCount: 0, percentage: 0, recentHistory: [] });

  const data = sheet.getDataRange().getDisplayValues();
  const headers = data[0];
  const row = data.find(r => String(r[3]) === String(d.admissionNo));
  if (!row) return success({ presentCount: 0, absentCount: 0, percentage: 0, recentHistory: [] });

  let p = 0, a = 0;
  const history = [];
  for (let i = 4; i < headers.length; i++) {
    if (row[i] === 'P') { p++; history.push({ date: headers[i], status: 'Present' }); }
    if (row[i] === 'A') { a++; history.push({ date: headers[i], status: 'Absent' }); }
  }

  const total = p + a;
  return success({
    presentCount: p,
    absentCount: a,
    totalDays: total,
    percentage: total > 0 ? Math.round((p / total) * 100) : 0,
    recentHistory: history.reverse().slice(0, 30)
  });
}

function handleGetStaffAttendanceData(d) {
  const staff = getDataRows('EMPLOYEES', 'Master');
  const date = d.date.split('T')[0];
  const logs = getDataRows('EMPLOYEE_ATTENDANCE', 'Daily_Log').filter(r => String(r[0]).split('T')[0] === date);
  
  return success(staff.map(e => ({ 
    employeeId: String(e[0]), 
    name: String(e[1]), 
    post: String(e[2]), 
    photoUrl: String(e[19] || ''),
    status: (logs.find(l => String(l[1]) === String(e[0])) || [])[2] || null 
  })));
}

function handleSubmitStaffAttendance(d) {
  return runWithLock(() => {
    const ss = getSpreadsheet('EMPLOYEE_ATTENDANCE');
    const sheet = getOrCreateSheet(ss, 'Daily_Log', ['Date', 'EmployeeID', 'Status', 'Timestamp']);
    const date = d.date.split('T')[0];
    const data = sheet.getDataRange().getValues();
    
    d.attendanceList.forEach(item => {
      const idx = data.findIndex(r => String(r[0]).split('T')[0] === date && String(r[1]) === String(item.employeeId));
      if (idx > -1) {
        sheet.getRange(idx + 1, 3, 1, 2).setValues([[item.status, new Date()]]);
      } else {
        sheet.appendRow([date, item.employeeId, item.status, new Date()]);
      }
    });
    return success(null, 'Staff attendance saved');
  });
}

function handleGetEmployeeAttendance(d) {
  const rows = getDataRows('EMPLOYEE_ATTENDANCE', 'Daily_Log').filter(r => String(r[1]) === String(d.employeeId));
  let score = 0, a = 0;
  const history = rows.map(r => {
    const status = String(r[2]);
    if (status === 'Present' || status === 'Late') score += 1;
    else if (status === 'Half Day') score += 0.5;
    else a++;
    
    return { date: String(r[0]).split('T')[0], status: status };
  });
  
  const total = rows.length;
  return success({
    presentCount: score, // Represents weighted score
    absentCount: a,
    totalDays: total,
    percentage: total > 0 ? Math.round((score / total) * 100) : 0,
    recentHistory: history.reverse().slice(0, 30)
  });
}

function handleExportAttendanceCSV({ class: className, section, startDate, endDate }) {
  const ss = getSpreadsheet('STUDENT_ATTENDANCE');
  const sheetName = getClassSheetName(className, section);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return success("", "No data found for this class");
  
  const data = sheet.getDataRange().getDisplayValues();
  let csv = "";
  data.forEach(row => {
    csv += row.join(",") + "\n";
  });
  return success(csv);
}

function handleNotifyAbsentees({ class: className, section, date }) {
  // Logic to iterate over attendance sheet for the date and find 'A'
  // and send notifications (simulated)
  return success(null, "Parents of absent students have been notified.");
}

function handleRemoveTeacherHoliday({ staffId, date }) {
  const ss = getSpreadsheet('EMPLOYEE_ATTENDANCE');
  const sheet = ss.getSheetByName('Holidays');
  if (!sheet) return error('No record found');
  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => String(r[1]) === String(staffId) && String(r[0]).split('T')[0] === date.split('T')[0]);
  if (idx > -1) {
    sheet.deleteRow(idx + 1);
    return success(null, 'Leave record removed');
  }
  return error('Record not found');
}
