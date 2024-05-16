import { resolve } from "path";

import { appMeta } from "encore.dev";
import { api } from "encore.dev/api";
import { WorkflowClient } from "@temporalio/client";
import { Worker, bundleWorkflowCode } from "@temporalio/worker";

import { approveSignal, expense, rejectSignal } from "./internal/workflows"
import * as activities from './internal/activities';


const envName = appMeta().environment.name;
const taskQueue = `${envName}-expense`;

const workflowBundle = await bundleWorkflowCode({
  workflowsPath: resolve('./expense/internal/workflows.ts'),
});

const worker = await Worker.create({ workflowBundle, activities, taskQueue });

worker.run();


export const start = api(
  { expose: true, method: "POST", path: "/expense" },
  async (): Promise<{ expenseId: string }> => {
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

type ExpenseRequest = {
  expenseId: string;
};

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
