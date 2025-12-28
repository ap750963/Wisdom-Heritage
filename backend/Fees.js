
function handleGetFeeDashboard() {
  const rows = getDataRows('FEES', 'Collection_Log');
  const month = new Date().getMonth();
  const year = new Date().getFullYear();
  let total = 0;
  const students = {};
  getDataRows('STUDENTS', 'Master').forEach(r => students[String(r[0])] = { name: r[2], class: `${r[3]}-${r[4]}` });

  const txs = rows.map(r => {
    const d = new Date(r[0]);
    if (d.getMonth() === month && d.getFullYear() === year) total += Number(r[2]);
    return { date: r[0], admissionNo: r[1], amount: Number(r[2]), mode: r[3], remarks: r[4], receiptNo: r[5], studentName: students[r[1]]?.name || 'Unknown', studentClass: students[r[1]]?.class || '' };
  });
  return success({ monthlyCollection: total, recentTransactions: txs.reverse().slice(0, 50) });
}

function handleCollectFee(d) {
  return runWithLock(() => {
    const ss = getSpreadsheet('FEES');
    const sheet = getOrCreateSheet(ss, 'Collection_Log', ['Timestamp', 'AdmissionNo', 'Amount', 'Mode', 'Remarks', 'ReceiptNo']);
    const receipt = 'FE-' + Date.now().toString().slice(-8);
    sheet.appendRow([new Date(), d.admissionNo, Number(d.amount), d.mode, d.remarks, receipt]);
    return success({ receiptNo: receipt }, 'Payment recorded');
  });
}

function handleGetStudentFees(d) {
  const rows = getDataRows('FEES', 'Collection_Log').filter(r => String(r[1]) === String(d.admissionNo));
  const history = rows.map(r => ({ date: r[0], amount: r[2], mode: r[3], remarks: r[4], receiptNo: r[5] }));
  const paid = history.reduce((s, l) => s + l.amount, 0);
  return success({ totalFees: d.totalFees, paidFees: paid, dueFees: d.totalFees - paid, history: history.reverse() });
}
