import { resolve } from "path";

import { appMeta } from "encore.dev";
import { api } from "encore.dev/api";
import { WorkflowClient } from "@temporalio/client";
import { Worker, bundleWorkflowCode } from "@temporalio/worker";

import { ExpenseStatus, approveSignal, expense, getStatus, rejectSignal } from "./internal/workflows"
import * as activities from './internal/activities';


const envName = appMeta().environment.name;
const taskQueue = `${envName}-expense`;

const workflowBundle = await bundleWorkflowCode({
  workflowsPath: resolve('./expense/internal/workflows.ts'),
});

const worker = await Worker.create({ workflowBundle, activities, taskQueue });

worker.run();


type ExpenseRequest = {
  expenseId: string;
};

export const start = api(
  { expose: true, method: "POST", path: "/expense" },
  async (): Promise<ExpenseRequest> => {
    const expenseId = Math.random().toString(36).substring(7);

    const client = new WorkflowClient();
    await client.start(expense, {
      taskQueue,
      workflowId: expenseId,
      args: [expenseId],
    });

    return { expenseId };
  }
);

export const approve = api(
  { expose: true, method: "POST", path: "/expense/approve" },
  async (request: ExpenseRequest): Promise<void> => {
    const client = new WorkflowClient();;
    await client.getHandle(request.expenseId).signal(approveSignal);
  }
);

export const reject = api(
  { expose: true, method: "POST", path: "/expense/reject" },
  async (request: ExpenseRequest): Promise<void> => {
    const client = new WorkflowClient();
    await client.getHandle(request.expenseId).signal(rejectSignal);
  }
);

export const status = api(
  { expose: true, method: "GET", path: "/expense/:expenseId" },
  async (request: ExpenseRequest): Promise<{ status: ExpenseStatus }> => {
    const client = new WorkflowClient();
    const status = await client.getHandle(request.expenseId).query(getStatus);
    return { status };
  }
);
