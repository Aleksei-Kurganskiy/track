# track Handoff Prompt

You are continuing work on the project `track` in `C:\projects\track`.

## Context

- `track` is a compact personal task tracker.
- The main UX is already decided.
- There is an interactive mockup in `mockup.html`.
- The current mockup is an approved reference for layout and behavior.
- The task list layout is intentionally compact.

## Product goals

- live progress visibility
- elapsed time since task start
- visible pause segments in the progress bar
- universal details modal with description and event history
- minimal code and minimal abstractions
- cross-platform behavior
- Russian UI

## Hard constraints

- prefer simple universal primitives
- avoid overengineering
- avoid unnecessary frameworks or architecture
- keep the implementation small and understandable
- no mixed Russian/English user-facing UI

## Chosen app direction

- web app
- recommended stack: Vite + TypeScript + vanilla DOM + CSS + localStorage

## Already fixed UX rules

1. There are 2 task types:
   - timed
   - background

2. Timed tasks use strict OR scheduling:
   - Date
   - Plan

3. Date mode:
   - calendar date only
   - no time-of-day in MVP

4. Plan mode:
   - amount + unit
   - units:
     - minutes
     - hours
     - days
     - weeks
     - months
     - years

5. Background tasks:
   - no schedule
   - no deadline
   - no planned duration

6. Lifecycle rules:
   - start: no reason required
   - resume: no reason required
   - pause: reason required
   - complete: reason required

7. Compact task row layout:
   - exactly 2 lines per task
   - line 1: title, type badge, status badge, key metrics, actions
   - line 2: progress bar only

8. Details modal:
   - one universal modal for all task types
   - should show:
     - task title
     - task type
     - task status
     - schedule mode if applicable
     - detailed description
     - notes/context
     - last pause reason if available
     - completion reason if available
     - event history
   - should NOT duplicate compact metrics already visible in the row

9. Progress bar rules:
   - pause segment is always black
   - timed + plan mode: progress based on planned duration
   - timed + date mode: progress based on movement toward deadline date
   - background: activity strip without deadline logic

10. Russian UI labels only:
   - no English in user-facing text
   - project name `track` may stay as-is

## Important current files

- `README.md`
- `docs/mvp-notes.md`
- `docs/implementation-plan.md`
- `mockup.html`

## Current approved mockup state

- task rows are compact and acceptable
- `Детали` button opens a working popup in `mockup.html`
- creation form mockup includes `Дата / План`
- list rows now show `План ...` or `Срок ...` directly in the row
- the details modal currently focuses on description + notes + events

## What to do next

1. Read `mockup.html`, `README.md`, `docs/mvp-notes.md`, and `docs/implementation-plan.md`.
2. Use the mockup as the visual reference.
3. Start implementing the real app, not expanding the mockup further unless necessary.
4. Keep implementation minimal.
5. Prefer a small number of files.

## Recommended next implementation order

1. Initialize the real app structure
2. Move the compact list UI into real app files
3. Define Task and TaskEvent model
4. Render static tasks from data instead of hardcoded repeated HTML
5. Add create-task flow
6. Add lifecycle actions
7. Add localStorage
8. Add live ticking
9. Add progress calculations
10. Bind real task data into the details modal

## Suggested data model

- Task:
  - id
  - title
  - type: `timed` | `background`
  - status: `todo` | `active` | `paused` | `done`
  - scheduleMode: `date` | `plan` | `none`
  - deadlineDate: string | null
  - plannedAmount: number | null
  - plannedUnit: `minutes` | `hours` | `days` | `weeks` | `months` | `years` | null
  - description: string
  - notes: string
  - createdAt: number
  - history: TaskEvent[]

- TaskEvent:
  - type: `created` | `started` | `paused` | `resumed` | `completed`
  - at: number
  - reason: string | null

## Event labels in Russian

- `created` -> `Создана`
- `started` -> `Запуск`
- `paused` -> `Пауза`
- `resumed` -> `Продолжение`
- `completed` -> `Завершение`

## Implementation priority

- preserve the chosen compact UX
- preserve the universal details modal
- keep code small
- do not introduce unnecessary complexity
