# Use Temporal with Encore's TypeScript SDK

## Requirements
- [Encore installed](https://encore.dev/docs/install)
- [Temporal CLI installed](https://github.com/temporalio/cli)

## Running locally

Start a Temporal development server:
```bash
temporal server start-dev
```
Open <http://localhost:8233/> to view Temporal's local developer dashboard.

Start the encore application:

```bash
encore run
```
Open <http://localhost:9400/> to view Encore's local developer dashboard.

## Testing

```bash
encore test
```
