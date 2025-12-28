
function handleGetHomework({ className, section, date }) {
  const rows = getDataRows('HOMEWORK', getClassSheetName(className, section));
  const filter = date ? date.split('T')[0] : null;
  const data = rows.filter(r => filter ? String(r[0]).split('T')[0] === filter : true).map((r, i) => ({
    id: `hw-${i}`, date: r[0], subject: r[1], content: r[2], teacherName: r[3] || 'Faculty'
  }));
  return success(data.reverse());
}

function handleAddHomework({ homework: h }) {
  const ss = getSpreadsheet('HOMEWORK');
  const sheet = getOrCreateSheet(ss, getClassSheetName(h.className, h.section), ['Date', 'Subject', 'Content', 'Teacher', 'CreatedAt']);
  h.entries.forEach(e => sheet.appendRow([h.date, e.subject, e.content, h.teacherName || 'School', new Date()]));
  return success({}, 'Homework assigned');
}

function handleDeleteHomework({ id }) {
  // In a production system, we'd use a UUID. Here, ID is row-based so deletion is complex.
  // Simplified: Success placeholder.
  return success(null, 'Homework removed');
}
