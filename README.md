# Expense Approval Workflow with Temporal & Encore

This project aims to test Encore's TypeScript SDK together with the Temporal SDK. We built a small expense approval workflow (inspired by [this example](https://github.com/temporalio/samples-typescript/tree/main/expense)).

## Running locally

### Start Temporal development server
If you have the [Temporal CLI installed](https://github.com/temporalio/cli), start a Temporal development server:
```bash
temporal server start-dev
```
and open <http://localhost:8233/> to view Temporal's local developer dashboard.

### Start Encore application
If you have [Encore installed](https://encore.dev/docs/install), start the encore application:
```bash
encore run
```
and open <http://localhost:9400/> to view Encore's local developer dashboard.

### Try out expense approval workflow

You can either use Encore's local developer dashboard to call the API or use cURL via the terminal (note that the following requires `jq` to be installed).

1. Create a new expense approval request
```bash
expenseId=$(curl -s -X POST "127.0.0.1:4000/expense" | jq -r ".expenseId")
echo $expenseId
```

2. Get the status of the expense approval request
```bash
curl "127.0.0.1:4000/expense/$expenseId"
```
should return `{"status":"CREATED"}`

3. Approve (or reject) the expense
```bash
curl "127.0.0.1:4000/expense/approve" -d "{\"expenseId\": \"$expenseId\"}"
```
or (`127.0.0.1:4000/expense/reject` to reject)

4. Get the status of the expense approval request
```bash
curl "127.0.0.1:4000/expense/$expenseId"
```
should return `{"status":"COMPLETED"}` (or `{"status":"REJECTED"}` respectively). If you did not approve/reject the request within 60s, it will return  `{"status":"TIMED_OUT"}`.
