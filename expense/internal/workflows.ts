
import { defineQuery, defineSignal, proxyActivities, setHandler, sleep } from '@temporalio/workflow';
import type * as activities from './activities';
import { Duration } from '@temporalio/common';

export enum ExpenseStatus {
  CREATED = 'CREATED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  TIMED_OUT = 'TIMED_OUT',
  COMPLETED = 'COMPLETED',
}

export const approveSignal = defineSignal('approve');
export const rejectSignal = defineSignal('reject');
export const getStatus = defineQuery<ExpenseStatus>('status');

const { createExpense, payment, notifyAboutRejection } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
});

export function timeoutOrUserAction(timeout: Duration): Promise<ExpenseStatus> {
  return new Promise((resolve, reject) => {
    setHandler(approveSignal, () => resolve(ExpenseStatus.APPROVED));
    setHandler(rejectSignal, () => resolve(ExpenseStatus.REJECTED));
    sleep(timeout).then(() => resolve(ExpenseStatus.TIMED_OUT), reject);
  });
}

export async function expense(expenseId: string, timeout: Duration = '30s'): Promise<{ status: ExpenseStatus }> {
  let status = ExpenseStatus.CREATED;
  setHandler(getStatus, () => status);

  await createExpense(expenseId);

  status = await timeoutOrUserAction(timeout);
  if (status !== ExpenseStatus.APPROVED) {
    await notifyAboutRejection(expenseId);
    return { status };
  }
  await payment(expenseId);
  status = ExpenseStatus.COMPLETED;
  return { status: ExpenseStatus.COMPLETED };
}
