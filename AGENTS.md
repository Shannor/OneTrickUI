# Project: Webapp React SPA

## Technology Stack

- **Language**: Typescript
- **UI Framework**: React
- **Style Library**: Shadcn & Tailwind
- **Build Tool**: npm
- **Testing Framework**: Testing Library
- **Architecture**: React Router Framework SSR with OpenAPI Generation.

## Setup and Build Commands

To set up and build the project, run the following commands in the terminal:

- **Install dependencies**: `npm run install`
- **Run tests**: `npm run test`
- **Format code**: Prettier
- **Lint code**: `npm run lint`
- **Generate Theme**: `npm run theme`
- **Generate API**: `npm run generate`
- **Run Dev**: `npm run start`

## General Instructions

- Prirotize Mobile design with useful breakpoints all the way up to 4k displays as well.
- All new custom UI Components, hooks and functions **must** include matching tests.
- Prioritize code readability, maintainability and composibiltiy of components.
- **Only** used named exports instead of default exports for all components and functions.
- The brand is "1 Trick", never "One Trick".
- Do not add unnecessary or useless code comments.
- Do not add comments to separate inline component sections in JSX. If a component section requires a comment to separate it, extract it into a separate composable component instead. The goal is always composability.

## Specific Instructions for this Project

- Project has a custom setup for tailwind. Check `tailwind.config.ts`
- All components and functions should be named exports and not default exports.
- Add useful meta tags to all route tsx files/components.
- This project uses generated endpoints for OpenAPI to gap data. It can be found in the `api` folder.

## Styling

- Use tailwind and breakpoints for mobile friendly designs.
- Never use cards inside of cards in design.

## Notable Libraries Used

- React
- Typescript
- Shadcn/Tailwind
- Testing-Library
- Vite

<!-- evlog:start -->
## Logging with evlog

This project uses [evlog](https://evlog.dev). Follow these rules when you add or change logging.

**One wide event per operation.** A request, a job, a user action — each produces exactly one
event carrying everything about it. Not one log line per step.

- Get the request logger with `useLogger()` inside a request handler.
- Add context as you learn it: `log.set({ user: { id, plan }, cart: { items, total } })`.
- Group related fields into objects. Never flat abbreviations like `{ uid, n, t }`.
- Never pass a raw body — `log.set({ user: body })` leaks passwords. List fields explicitly.
- Do not time anything by hand; the duration is computed when the event emits.
- `log.debug()` is for step detail and is stripped from production builds.

**Errors are structured, never bare.**

```ts
throw createError({
  message: 'Payment failed',
  status: 402,
  why: 'Card declined by the issuer',
  fix: 'Use a different payment method',
  internal: { correlationId },   // drains only — never reaches the client
})
```

Never `throw new Error(...)`. Never `console.error(e); throw e` — use `log.error(e)`.
When the same error appears in three or more places, promote it to `defineErrorCatalog()`.

**Sensitive actions get an audit trail.** Call `log.audit({ action, actor, target, outcome })`
on anything that changes permissions, money, or personal data. Audit entries are never sampled.

**Never log** passwords, tokens, API keys, full card numbers, or session JWTs. Redaction is on
in production, but it is a safety net — not a substitute for choosing the fields yourself.

Check coverage with `npx @evlog/cli map --no-write`. Diagnose setup with `npx @evlog/cli doctor`.
Deeper guidance is in the `review-logging-patterns` skill — read it before a logging change.
<!-- evlog:end -->
