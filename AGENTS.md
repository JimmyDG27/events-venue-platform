# AGENTS.md
> Rules for how Claude Code should behave throughout this project.
> Read this file alongside CLAUDE.md before starting any work.

---

## General Behavior

- Always read `CLAUDE.md` and `execution-pipeline-phase1.md` at the start of every session before doing anything
- Work on one task at a time — do not jump ahead to the next task without confirmation
- If unsure between two approaches, stop and present both options with pros/cons before proceeding
- Never make assumptions about ambiguous requirements — ask first
- Keep responses concise and actionable — avoid over-explaining unless asked

---

## Before Starting Any Task

- Confirm which task from `execution-pipeline-phase1.md` you are working on
- Mark it as `🟡 In Progress` in the pipeline file immediately
- State clearly what you are about to do before doing it

---

## File & Code Rules

- Never delete files without explicit user confirmation
- Never overwrite existing files without showing a diff or summary of changes first
- Always create `.env.example` alongside any `.env` changes — never commit secrets
- Follow the project structure defined in `CLAUDE.md` — do not create folders outside of it without asking
- All new API endpoints must include input validation (Zod)
- All new code must follow ESLint and Prettier rules — run linter before marking done

---

## Testing Rules

- Every completed backend task must have unit or integration tests before being marked done
- Every completed frontend task must have component tests before being marked done
- Always run existing tests before and after making changes — do not break passing tests
- If a test fails unexpectedly, stop and report it before continuing

---

## Git Rules

- Commit after each completed task with a descriptive message in this format:
  ```
  feat(0.1): initialize monorepo with Next.js and NestJS
  ```
- Never commit directly to `main` — always use a feature branch per task:
  ```
  task/0.1-monorepo-setup
  task/1.2-venues-api
  ```
- Never commit `.env` files, secrets, or API keys

---

## Pipeline Update Rules

- When starting a task: mark as `🟡 In Progress`
- When finishing a task: mark as `✅ Done` and add a short summary (1-2 sentences) of what was done, what files were created, and any decisions made
- Update the Progress Tracker table in `execution-pipeline-phase1.md` at the end of each phase

---

## Communication Rules

- Ask before any irreversible action (delete, overwrite, deploy, install global packages)
- If a task is blocked by a dependency, stop and explain what is needed before continuing
- If something unexpected happens (test failure, missing dependency, ambiguous requirement), report it immediately and wait for instruction
- Always confirm with the user before moving to the next phase