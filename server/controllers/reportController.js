import PDFDocument from 'pdfkit';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import { summarize } from '../services/financeAnalyzer.js';

const fmt = (v) => `INR ${Math.round(v || 0).toLocaleString('en-IN')}`;
export const monthly = async (req, res) => {
  const now = new Date(), year = +req.query.year || now.getFullYear(), month = Math.min(12, Math.max(1, +req.query.month || now.getMonth() + 1));
  const txs = await Transaction.find({ userId: req.userId, transactionDate: { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) } }).sort({ transactionDate: -1 });
  const s = summarize(txs, await Budget.findOne({ userId: req.userId })), label = `${year}-${String(month).padStart(2, '0')}`;
  if (req.query.format !== 'pdf') return res.json({ success: true, period: { year, month }, summary: s, transactions: txs });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="finance-report-${label}.pdf"`);
  const doc = new PDFDocument({ margin: 48 });
  doc.pipe(res);
  doc.fontSize(20).text(`Finance report ${label}`).moveDown();
  doc.fontSize(12).text(`Income: ${fmt(s.totalIncome)}`).text(`Expenses: ${fmt(s.totalExpense)}`).text(`Savings: ${fmt(s.savings)}`).moveDown();
  doc.fontSize(14).text('By category').fontSize(11);
  s.categoryBreakdown.forEach((c) => doc.text(`${c.category}: ${fmt(c.amount)}`));
  doc.moveDown().fontSize(14).text('Transactions (latest 40)').fontSize(10);
  txs.slice(0, 40).forEach((t) => doc.text(`${new Date(t.transactionDate).toISOString().slice(0, 10)}  ${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}  ${t.title} (${t.category})`));
  doc.end();
};
