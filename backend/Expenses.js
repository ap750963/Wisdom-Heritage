
function handleGetExpenses() {
  const rows = getDataRows('EXPENSES', 'Main_Ledger');
  const month = new Date().getMonth();
  const year = new Date().getFullYear();
  let total = 0;
  const items = rows.map(r => {
    const d = new Date(r[0]);
    if (d.getMonth() === month && d.getFullYear() === year) total += Number(r[4]);
    return { date: r[0], receiptNumber: r[1], category: r[2], title: r[3], amount: Number(r[4]), paymentMode: r[5], reference: r[6], remarks: r[7], approvedBy: r[8] };
  });
  return success({ monthlyExpenses: total, recentExpenses: items.reverse().slice(0, 50) });
}

function handleAddExpense({ expense: e }) {
  const ss = getSpreadsheet('EXPENSES');
  const sheet = getOrCreateSheet(ss, 'Main_Ledger', ['Date', 'ReceiptNo', 'Category', 'Purpose', 'Amount', 'Mode', 'Ref', 'Remarks', 'ApprovedBy']);
  const receipt = 'EX-' + Date.now().toString().slice(-8);
  sheet.appendRow([e.date, receipt, e.category, e.title, Number(e.amount), e.paymentMode, e.reference, e.remarks, e.approvedBy]);
  return success({ receiptNumber: receipt }, 'Expense saved');
}

function handleGetNextExpenseReceiptNumber() {
  return success('EX-' + Date.now().toString().slice(-8));
}
