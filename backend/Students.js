
function handleGetStudents({ role, assignedClass, assignedSection }) {
  let rows = getDataRows('STUDENTS', 'Master');
  if (role === 'TEACHER') {
    rows = rows.filter(r => String(r[3]) === String(assignedClass) && String(r[4]) === String(assignedSection));
  }
  return success(rows.map(r => ({
    admissionNo: String(r[0]), rollNo: String(r[1]), name: String(r[2]), class: String(r[3]), section: String(r[4]), 
    status: String(r[5]), fatherName: String(r[6]), motherName: String(r[7]), dob: String(r[8]), phone1: String(r[9]), 
    phone2: String(r[10]), address: String(r[11]), aadhaar: String(r[12]), samagraId: String(r[13]), 
    joiningDate: String(r[14]), totalFees: Number(r[15]), photoUrl: String(r[16])
  })));
}

function handleGetStudentDetails(d) {
  const rows = getDataRows('STUDENTS', 'Master');
  const r = rows.find(row => String(row[0]) === String(d.admissionNo));
  if (!r) return error('Not found');
  return success({
    admissionNo: String(r[0]), rollNo: String(r[1]), name: String(r[2]), class: String(r[3]), section: String(r[4]), 
    status: String(r[5]), fatherName: String(r[6]), motherName: String(r[7]), dob: String(r[8]), phone1: String(r[9]), 
    phone2: String(r[10]), address: String(r[11]), aadhaar: String(r[12]), samagraId: String(r[13]), 
    joiningDate: String(r[14]), totalFees: Number(r[15]), photoUrl: String(r[16])
  });
}

function handleGetNextAdmissionNumber() {
  const rows = getDataRows('STUDENTS', 'Master');
  const year = new Date().getFullYear().toString();
  const max = rows.reduce((m, r) => {
    const id = String(r[0]);
    return id.startsWith(year) ? Math.max(m, parseInt(id.substring(4))) : m;
  }, 0);
  return success(year + String(max + 1).padStart(3, '0'));
}

function handleAddStudent({ student: s, photoBase64, photoMimeType }) {
  return runWithLock(() => {
    const ss = getSpreadsheet('STUDENTS');
    const sheet = getOrCreateSheet(ss, 'Master');
    const photoUrl = uploadFile(photoBase64, photoMimeType, `stud_${s.admissionNo}`, "Student_Photos");
    sheet.appendRow([s.admissionNo, s.rollNo, s.name, s.class, s.section, 'Active', s.fatherName, s.motherName, s.dob, s.phone1, s.phone2, s.address, s.aadhaar, s.samagraId, s.joiningDate, s.totalFees, photoUrl]);
    return success(null, 'Student registered');
  });
}

function handleUpdateStudent({ student: s, photoBase64, photoMimeType }) {
  return runWithLock(() => {
    const ss = getSpreadsheet('STUDENTS');
    const sheet = ss.getSheetByName('Master');
    const data = sheet.getDataRange().getValues();
    const idx = data.findIndex(r => String(r[0]) === String(s.admissionNo));
    if (idx === -1) return error('Not found');
    let pUrl = s.photoUrl;
    if (photoBase64) pUrl = uploadFile(photoBase64, photoMimeType, `stud_${s.admissionNo}`, "Student_Photos");
    const row = [s.admissionNo, s.rollNo, s.name, s.class, s.section, s.status, s.fatherName, s.motherName, s.dob, s.phone1, s.phone2, s.address, s.aadhaar, s.samagraId, s.joiningDate, s.totalFees, pUrl];
    sheet.getRange(idx + 1, 1, 1, row.length).setValues([row]);
    return success({ photoUrl: pUrl }, 'Updated');
  });
}

function handleArchiveStudent(d) {
  const ss = getSpreadsheet('STUDENTS');
  const sheet = ss.getSheetByName('Master');
  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => String(r[0]) === String(d.admissionNo));
  if (idx > -1) {
    archiveRecord('STUDENTS', d.admissionNo, data[idx], d.deletedBy);
    sheet.deleteRow(idx + 1);
    return success(null, 'Archived');
  }
  return error('Not found');
}
