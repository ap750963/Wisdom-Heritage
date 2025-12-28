
/**
 * AUTHENTICATION MODULE
 */

function handleLogin({ username, pass }) {
  if (!username || !pass) return error('Missing credentials');
  const u = String(username).trim();
  const p = String(pass).trim();

  // 1. Admin/Staff Check (Primary USERS Spreadsheet)
  const users = getDataRows('USERS', 'Master');
  const match = users.find(r => String(r[0]).trim() === u && String(r[1]).trim() === p);
  
  if (match) {
    return success({
      token: 'TK-' + Utilities.getUuid(),
      user: { 
        username: match[0], 
        role: match[2], 
        name: match[3], 
        id: match[0], 
        employeeId: match[4], 
        assignedClass: match[5], 
        assignedSection: match[6], 
        avatarUrl: match[7] 
      }
    });
  }

  // 2. Student Portal Check (Iterate dynamic student class user sheets)
  const ss = getSpreadsheet('USERS');
  const sheets = ss.getSheets();
  for (let s of sheets) {
    if (s.getName().startsWith('Students_') || s.getName().startsWith('Users_')) {
      const sMatch = s.getDataRange().getValues().slice(1).find(r => String(r[0]).trim() === u && String(r[1]).trim() === p);
      if (sMatch) {
        return success({
          token: 'ST-' + Utilities.getUuid(),
          user: { 
            username: sMatch[0], 
            role: 'STUDENT', 
            name: sMatch[3], 
            admissionNo: sMatch[4], 
            assignedClass: sMatch[5], 
            assignedSection: sMatch[6], 
            avatarUrl: sMatch[7] 
          }
        });
      }
    }
  }
  return error('Invalid username or password.');
}

function handleGetMyProfile({ username }) {
  const u = getDataRows('USERS', 'Master').find(r => String(r[0]) === username);
  if (u) return success({ username: u[0], role: u[2], name: u[3], employeeId: u[4], assignedClass: u[5], assignedSection: u[6], avatarUrl: u[7] });
  return error('User not found.');
}

function handleUpdatePassword({ username, oldPassword, newPassword }) {
  const ss = getSpreadsheet('USERS');
  const sheet = ss.getSheetByName('Master');
  const rows = sheet.getDataRange().getValues();
  const idx = rows.findIndex(r => String(r[0]) === username && String(r[1]) === oldPassword);
  if (idx === -1) return error('Incorrect current password');
  sheet.getRange(idx + 1, 2).setValue(newPassword);
  return success(null, 'Password updated');
}

function handleUpdateProfilePhoto({ username, photoBase64, mimeType }) {
  const photoUrl = uploadFile(photoBase64, mimeType, `ava_${username}`, "System_Avatars");
  const ss = getSpreadsheet('USERS');
  const sheet = ss.getSheetByName('Master');
  const rows = sheet.getDataRange().getValues();
  const idx = rows.findIndex(r => String(r[0]) === username);
  if (idx > -1) {
    sheet.getRange(idx + 1, 8).setValue(photoUrl);
    return success({ photoUrl });
  }
  return error('User not found');
}

function handleGetUserForEmployee(d) {
  const u = getDataRows('USERS', 'Master').find(r => String(r[4]) === String(d.employeeId));
  return success(u ? { username: u[0], password: u[1], role: u[2], assignedClass: u[5], assignedSection: u[6] } : null);
}

function handleSaveUserAccess({ user: u }) {
  const ss = getSpreadsheet('USERS');
  const sheet = getOrCreateSheet(ss, 'Master');
  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => String(r[4]) === String(u.employeeId));
  const row = [u.username, u.password, u.role, u.name, u.employeeId, u.assignedClass || '', u.assignedSection || '', ''];
  if (idx > -1) sheet.getRange(idx + 1, 1, 1, row.length).setValues([row]);
  else sheet.appendRow(row);
  return success(null, 'Access granted');
}

function handleRemoveUserAccess({ employeeId }) {
  const ss = getSpreadsheet('USERS');
  const sheet = ss.getSheetByName('Master');
  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => String(r[4]) === String(employeeId));
  if (idx > -1) { 
    sheet.deleteRow(idx + 1); 
    return success(null, 'Access revoked'); 
  }
  return error('User not found');
}

function handleGetUserForStudent(d) {
  const ss = getSpreadsheet('USERS');
  for (let s of ss.getSheets()) {
    if (s.getName().startsWith('Students_')) {
      const u = s.getDataRange().getValues().find(r => String(r[4]) === String(d.admissionNo));
      if (u) return success({ username: u[0], password: u[1] });
    }
  }
  return success(null);
}

function handleSaveStudentUserAccess({ user: u }) {
  const ss = getSpreadsheet('USERS');
  const sheet = getOrCreateSheet(ss, `Students_${u.assignedClass || 'General'}`, ['Username', 'Password', 'Role', 'Name', 'AdmissionNo', 'Class', 'Section', 'Photo']);
  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => String(r[4]) === String(u.admissionNo));
  const row = [u.username, u.password, 'STUDENT', u.name, u.admissionNo, u.assignedClass, u.assignedSection, ''];
  if (idx > -1) sheet.getRange(idx + 1, 1, 1, row.length).setValues([row]);
  else sheet.appendRow(row);
  return success(null, 'Student access enabled');
}

function handleRemoveStudentUserAccess(d) {
  const ss = getSpreadsheet('USERS');
  for (let s of ss.getSheets()) {
    if (s.getName().startsWith('Students_')) {
      const idx = s.getDataRange().getValues().findIndex(r => String(r[4]) === String(d.admissionNo));
      if (idx > -1) { 
        s.deleteRow(idx + 1); 
        return success(null, 'Access removed'); 
      }
    }
  }
  return error('User not found');
}
