import { test, expect } from '@jest/globals';
import { detectAnomalies, detectRecurring, predictExpense } from '../services/financeAnalyzer.js';

const tx = (title, amount, date, category = 'Food') => ({ _id: title + date, type: 'expense', title, amount, category, transactionDate: new Date(date) });
test('flags an outlier expense', () => {
  const list = [200, 220, 250, 230, 210, 4200].map((a, i) => tx('Meal' + i, a, `2026-10-0${i + 1}`));
  expect(detectAnomalies(list)[0].amount).toBe(4200);
});
test('detects a monthly subscription', () => {
  const list = ['2026-08-05', '2026-09-05', '2026-10-05'].map((d) => tx('Netflix', 649, d, 'Entertainment'));
  expect(detectRecurring(list)[0].amount).toBe(649);
});
test('weights recent months more', () => {
  expect(predictExpense([{ expense: 100 }, { expense: 200 }]).predictedExpense).toBe(167);
});
