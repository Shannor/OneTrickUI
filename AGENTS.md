# Project: Webapp React SPA

## Technology Stack

* **Language**: Typescript
* **UI Framework**: React + Shadcn + Tailwind
* **Build Tool**: npm
* **Testing Framework**: Testing Library
* **Architecture**: React Router Framework SSR with OpenAPI Generation.

## Setup and Build Commands

To set up and build the project, run the following commands in the terminal:

* **Install dependencies**: `npm run install`
* **Run tests**: `npm run test`
* **Format code**: Prettier
* **Lint code**: `npm run lint`
* **Generate Theme**: `npm run theme`
* **Generate API**: `npm run generate`
* **Run Dev**: `npm run start`

## General Instructions

- Prirotize Mobile design with useful breakpoints all the way up to 4k displays as well.
- All new custom UI Components, hooks and functions **must** include matching tests.
- Prioritize code readability, maintainability and composibiltiy of components.
- **Only** used named exports instead of default exports for all components and functions.

## Specific Instructions for this Project

- Project has a custom setup for tailwind. Check `tailwind.config.ts`
- All components and functions should be named exports and not default exports.
- Add useful meta tags to all route tsx files/components.
- This project uses generated endpoints for OpenAPI to gap data. It can be found in the `api` folder.

## Styling 

- Use tailwind and breakpoints for mobile friendly designs.

## Notable Libraries Used

- React
- Typescript
- Shadcn/Tailwind
- Testing-Library
- Vite
