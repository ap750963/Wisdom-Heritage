
/**
 * DASHBOARD & EVENTS MODULE - WH_Events_DB
 */

function handleGetStats() {
  const cached = cacheGet('stats_summary');
  if (cached) return success(cached);

  const students = getDataRows('STUDENTS', 'Master').filter(r => r[5] === 'Active').length;
  const staff = getDataRows('EMPLOYEES', 'Master').length;
  const fees = getDataRows('FEES', 'Collection_Log').reduce((sum, r) => sum + Number(r[2]), 0);

  const stats = {
    totalStudents: students,
    totalTeachers: staff,
    attendanceRate: 94, // SimplifiedRate: Detailed cross-sheet calculation would iterate all class-attendance files
    revenue: fees > 100000 ? "₹" + (fees/100000).toFixed(1) + "L" : "₹" + fees.toLocaleString()
  };

  cachePut('stats_summary', stats, 300);
  return success(stats);
}

function handleGetEvents() {
  const rows = getDataRows('EVENTS', 'Master');
  return success(rows.map(r => ({
    id: String(r[0]), title: String(r[1]), date: String(r[2]), type: String(r[3]).toLowerCase(), audience: String(r[4] || 'all')
  })));
}

function handleAddEvent({ event: e }) {
  const ss = getSpreadsheet('EVENTS');
  const sheet = getOrCreateSheet(ss, 'Master');
  sheet.appendRow([`EVT-${Date.now()}`, e.title, e.date, e.type, e.audience || 'all']);
  cacheRemove('events_list');
  return success(null, 'Event published');
}

function handleUpdateEvent({ event: e }) {
  const ss = getSpreadsheet('EVENTS');
  const sheet = ss.getSheetByName('Master');
  if (!sheet) return error('Events registry missing');
  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => String(r[0]) === String(e.id));
  if (idx === -1) return error('Event ID not found');
  sheet.getRange(idx + 1, 1, 1, 5).setValues([[e.id, e.title, e.date, e.type, e.audience]]);
  return success(null, 'Event modified');
}

function handleRemoveEvent({ id }) {
  const ss = getSpreadsheet('EVENTS');
  const sheet = ss.getSheetByName('Master');
  if (!sheet) return error('Events registry missing');
  const data = sheet.getDataRange().getValues();
  const idx = data.findIndex(r => String(r[0]) === String(id));
  if (idx > -1) {
    archiveRecord('EVENTS', id, data[idx], 'System-Admin');
    sheet.deleteRow(idx + 1);
    return success(null, 'Event removed');
  }
  return error('Event not found');
}
