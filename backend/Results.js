
function handleCreateExam({ examName, subjects, createdBy }) {
  const ss = getSpreadsheet('RESULTS');
  const sheet = getOrCreateSheet(ss, 'Registry', ['ExamID', 'ExamName', 'Admin', 'CreatedAt', 'Subjects_JSON']);
  const id = 'EX-' + Date.now();
  sheet.appendRow([id, examName, createdBy, new Date(), JSON.stringify(subjects)]);
  return success({ examId: id }, 'Exam created');
}

function handleGetExams() {
  const rows = getDataRows('RESULTS', 'Registry');
  return success(rows.map(r => ({ examId: r[0], examName: r[1], subjects: JSON.parse(r[4]) })));
}

function handleSaveStudentMarks({ admissionNo, examName, marks, className, section }) {
  const ss = getSpreadsheet('RESULTS');
  const sheetName = getClassSheetName(className, section);
  const sheet = getOrCreateSheet(ss, sheetName, ['AdmissionNo', 'ExamName', 'Subject', 'Obtained', 'Maximum', 'At']);
  const data = sheet.getDataRange().getValues();
  
  marks.forEach(m => {
    const idx = data.findIndex(r => String(r[0]) === String(admissionNo) && String(r[1]) === examName && String(r[2]) === m.subject);
    const row = [admissionNo, examName, m.subject, m.marks, m.maxMarks, new Date()];
    if (idx > -1) {
      sheet.getRange(idx + 1, 1, 1, 6).setValues([row]);
    } else {
      sheet.appendRow(row);
    }
  });
  return success(null, 'Marks saved');
}

/**
 * Wrapper for handleSaveStudentMarks that resolves student info first
 */
function handleAddMarks({ admissionNo, examName, marks }) {
  const students = getDataRows('STUDENTS', 'Master');
  const student = students.find(r => String(r[0]) === String(admissionNo));
  
  if (!student) return error('Student record not found');
  
  return handleSaveStudentMarks({
    admissionNo,
    examName,
    marks,
    className: student[3],
    section: student[4]
  });
}

function handleGetClassResults(d) {
  const sheetName = getClassSheetName(d.className, d.section);
  const rows = getDataRows('RESULTS', sheetName).filter(r => r[1] === d.examName);
  const grid = {};
  rows.forEach(r => {
    const adm = String(r[0]);
    if (!grid[adm]) grid[adm] = {};
    grid[adm][String(r[2])] = Number(r[3]);
  });
  return success(grid);
}

function handleGetStudentResults(d) {
  const s = getDataRows('STUDENTS', 'Master').find(r => String(r[0]) === String(d.admissionNo));
  if (!s) return success([]);
  
  const sheetName = getClassSheetName(s[3], s[4]);
  const rows = getDataRows('RESULTS', sheetName).filter(r => String(r[0]) === String(d.admissionNo));
  const grouped = {};
  rows.forEach(r => {
    if (!grouped[r[1]]) grouped[r[1]] = [];
    grouped[r[1]].push({ subject: r[2], marks: r[3], maxMarks: r[4] });
  });
  return success(Object.keys(grouped).map(name => ({ examName: name, subjects: grouped[name] })));
}
