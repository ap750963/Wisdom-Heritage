
function handleGetSystemConfig() {
  const ss = getSpreadsheet('USERS');
  const sheet = getOrCreateSheet(ss, 'Settings', ['Property', 'Value']);
  const data = sheet.getDataRange().getValues();
  const yr = data.find(r => r[0] === 'ACTIVE_SESSION_YEAR');
  return success({ activeYear: yr ? yr[1] : (PROPS.getProperty('WH_SESSION_YEAR') || '2024-25') });
}

function handleUpdateSystemConfig({ activeYear }) {
  const ss = getSpreadsheet('USERS');
  const sheet = getOrCreateSheet(ss, 'Settings');
  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => r[0] === 'ACTIVE_SESSION_YEAR');
  if (idx > -1) sheet.getRange(idx + 1, 2).setValue(activeYear);
  else sheet.appendRow(['ACTIVE_SESSION_YEAR', activeYear]);
  PROPS.setProperty('WH_SESSION_YEAR', activeYear);
  return success({ activeYear }, 'Session updated');
}

/**
 * ACADEMIC LIFECYCLE: START NEW YEAR
 * This function handles the creation of a new folder for the new session
 * and copies master data (Students, Employees, Users) while leaving logs fresh.
 */
function handleBackupAndNewYear({ newYear, confirmedBy }) {
  return runWithLock(() => {
    const oldYear = PROPS.getProperty('WH_SESSION_YEAR') || '2024-25';
    console.log(`Transitioning from ${oldYear} to ${newYear}...`);

    // 1. Switch Active Session Property
    PROPS.setProperty('WH_SESSION_YEAR', newYear);

    // 2. Re-initialize all spreadsheets in the NEW folder (getDbFolder will now return the new one)
    const newFolder = getDbFolder();
    
    // Define copy tasks for master data
    const MASTER_TASKS = [
      { module: 'STUDENTS', sheet: 'Master' },
      { module: 'EMPLOYEES', sheet: 'Master' },
      { module: 'USERS', sheet: 'Master' }
    ];

    MASTER_TASKS.forEach(task => {
      // Get data from OLD session
      const oldPropKey = `SS_ID_${task.module}_${oldYear}`;
      const oldId = PROPS.getProperty(oldPropKey);
      if (!oldId) return;

      const oldSS = SpreadsheetApp.openById(oldId);
      const oldSheet = oldSS.getSheetByName(task.sheet);
      if (!oldSheet) return;

      const data = oldSheet.getDataRange().getValues();
      
      // Paste data into NEW session spreadsheet
      const newSS = getSpreadsheet(task.module);
      const newSheet = getOrCreateSheet(newSS, task.sheet);
      newSheet.clear(); // Wipe potential default empty rows
      newSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
      newSheet.setFrozenRows(1);
    });

    // 3. Re-provision empty log sheets in new spreadsheets
    setup();

    return success({ folderUrl: newFolder.getUrl() }, `Wisdom Heritage successfully switched to ${newYear}.`);
  });
}
