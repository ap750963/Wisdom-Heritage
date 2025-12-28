
/**
 * CORE STORAGE UTILITIES - SESSION-ISOLATED ARCHITECTURE
 */

const PROPS = PropertiesService.getScriptProperties();
const CACHE = CacheService.getScriptCache();
const ROOT_FOLDER_NAME = 'Wisdom_Heritage_Cloud_ERP';

const MODULES = {
  STUDENTS: 'WH_Students_DB',
  EMPLOYEES: 'WH_Employees_DB',
  STUDENT_ATTENDANCE: 'WH_Student_Attendance_DB',
  EMPLOYEE_ATTENDANCE: 'WH_Employee_Attendance_DB',
  FEES: 'WH_Fees_DB',
  EXPENSES: 'WH_Expenses_DB',
  HOMEWORK: 'WH_Homework_DB',
  RESULTS: 'WH_Results_DB',
  EVENTS: 'WH_Events_DB',
  USERS: 'WH_Users_DB',
  DELETED_DATA: 'WH_Archive_DB'
};

/**
 * Gets or creates the session-specific folder
 */
function getDbFolder() {
  const session = PROPS.getProperty('WH_SESSION_YEAR') || '2024-25';
  const folderKey = `WH_FOLDER_ID_${session}`;
  let folderId = PROPS.getProperty(folderKey);

  if (folderId) {
    try {
      return DriveApp.getFolderById(folderId);
    } catch (e) {
      console.warn("Folder ID stored but not found in Drive. Re-locating...");
    }
  }

  let root;
  const roots = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  if (roots.hasNext()) {
    root = roots.next();
  } else {
    root = DriveApp.createFolder(ROOT_FOLDER_NAME);
  }

  const sessionFolderName = `Wisdom_Heritage_${session}`;
  const sessions = root.getFoldersByName(sessionFolderName);
  let sessionFolder;
  if (sessions.hasNext()) {
    sessionFolder = sessions.next();
  } else {
    sessionFolder = root.createFolder(sessionFolderName);
  }

  PROPS.setProperty(folderKey, sessionFolder.getId());
  return sessionFolder;
}

/**
 * Gets a spreadsheet for the current session
 */
function getSpreadsheet(moduleKey) {
  const session = PROPS.getProperty('WH_SESSION_YEAR') || '2024-25';
  const propKey = `SS_ID_${moduleKey}_${session}`;
  let id = PROPS.getProperty(propKey);
  
  if (id) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (e) {}
  }

  const folder = getDbFolder();
  const fileName = MODULES[moduleKey];
  const files = folder.getFilesByName(fileName);
  let ss;
  
  if (files.hasNext()) {
    ss = SpreadsheetApp.open(files.next());
  } else {
    ss = SpreadsheetApp.create(fileName);
    const file = DriveApp.getFileById(ss.getId());
    file.moveTo(folder);
  }
  
  PROPS.setProperty(propKey, ss.getId());
  return ss;
}

/**
 * Robust sheet retriever
 */
function getOrCreateSheet(ss, sheetName, headers = []) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers.length > 0) {
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f8fafc");
    }
  }
  return sheet;
}

function getClassSheetName(className, section) {
  if (!className) return "Unassigned";
  const name = `${className}-${section || 'A'}`.trim();
  return name.replace(/[\[\]\*\?\/\:\\]/g, '_'); // Sanitize for sheet name
}

function archiveRecord(moduleName, recordId, rowData, deletedBy) {
  const arcSS = getSpreadsheet('DELETED_DATA');
  const sheet = getOrCreateSheet(arcSS, 'Deleted_Log', ['DeletedAt', 'DeletedBy', 'Module', 'OriginalID', 'Data_JSON']);
  sheet.appendRow([new Date(), deletedBy || 'System', moduleName, recordId, JSON.stringify(rowData)]);
}

function runWithLock(callback) {
  const lock = LockService.getScriptLock();
  try {
    if (lock.tryLock(30000)) return callback();
    return error('Database busy. Try again later.');
  } catch (e) {
    return error('Lock Error: ' + e.toString());
  } finally {
    lock.releaseLock();
  }
}

function getDataRows(moduleKey, sheetName) {
  const ss = getSpreadsheet(moduleKey);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const vals = sheet.getDataRange().getValues();
  return vals.length > 1 ? vals.slice(1) : [];
}

function cacheGet(key) {
  try {
    const val = CACHE.get(key);
    return val ? JSON.parse(val) : null;
  } catch (e) { return null; }
}

function cachePut(key, data, ttl = 600) {
  try {
    const str = JSON.stringify(data);
    if (str.length < 100000) CACHE.put(key, str, ttl);
  } catch (e) {}
}

function cacheRemove(key) { CACHE.remove(key); }

function success(data = {}, msg = '') {
  // Fix: Ensure message is always a string to avoid [object Object] in alerts
  return ContentService.createTextOutput(JSON.stringify({ 
    success: true, 
    data, 
    message: msg ? String(msg) : "" 
  })).setMimeType(ContentService.MimeType.JSON);
}

function error(msg = 'Unknown error') {
  // Fix: Ensure message is always a string
  return ContentService.createTextOutput(JSON.stringify({ 
    success: false, 
    message: msg ? String(msg) : "An unknown error occurred" 
  })).setMimeType(ContentService.MimeType.JSON);
}

function uploadFile(base64, mime, filename, folderName) {
  if (!base64) return '';
  try {
    const decoded = Utilities.base64Decode(base64);
    const blob = Utilities.newBlob(decoded, mime, filename);
    const dbFolder = getDbFolder();
    const folders = dbFolder.getFoldersByName(folderName);
    const targetFolder = folders.hasNext() ? folders.next() : dbFolder.createFolder(folderName);
    const file = targetFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return `https://drive.google.com/thumbnail?id=${file.getId()}&sz=w1000`;
  } catch (e) { return ''; }
}
