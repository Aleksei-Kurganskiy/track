# track Implementation Plan

## Purpose

This document is a durable implementation plan for the `track` project.
It is written so that any model or engineer can continue work with minimal ambiguity.

Project goal:
`track` is a compact personal task tracker with live progress, visible pauses, elapsed time, and a details modal with task description and event history.

Core constraints:
- keep the code minimal
- prefer universal primitives over abstractions
- preserve cross-platform behavior
- start as a web app
- avoid unnecessary frameworks and architecture

Current status:
- product concept is defined
- a static interactive mockup exists in `mockup.html`
- the compact 2-line task row layout is already chosen
- the details modal concept is already chosen

## Product Rules

## 1. Task types

There are 2 task types:

1. Timed task
2. Background task

Timed task:
- has a scheduling mode
- participates in deadline/plan-driven progress logic

Background task:
- has no deadline
- has no planned duration
- still tracks activity, pauses, completion, and history

## 2. Scheduling mode

Timed tasks use exactly one scheduling mode:

1. Date
2. Plan

This is strict OR logic.

Date mode:
- user selects a calendar date only
- no time-of-day in MVP

Plan mode:
- user enters an amount
- user selects a unit:
  - minutes
  - hours
  - days
  - weeks
  - months
  - years

Do not allow both Date and Plan simultaneously in MVP.

## 3. Task lifecycle

Statuses:
- todo
- active
- paused
- done

Allowed actions:
- start
- pause
- resume
- complete
- delete

Rules:
- `start` requires no comment
- `resume` requires no comment
- `pause` requires a mandatory reason
- `complete` requires a mandatory reason

## 4. Progress bar behavior

General rule:
- every task row is exactly 2 lines in list view
- line 1: title, badges, key info, actions
- line 2: progress bar only

Pause visualization:
- pauses must be visible on the progress bar
- pause segment color is always black

Timed task, Plan mode:
- progress is calculated from planned duration
- work segment grows with active time
- pause segment grows with paused time
- remaining segment is unfilled
- pauses consume the available planned time

Timed task, Date mode:
- progress is calculated from time moving toward the selected date
- work and pause segments are still visible
- bar reflects advancement toward deadline
- no manual counting of days by user

Background task:
- no deadline
- no planned duration
- bar is a timeline-like activity strip
- work segment uses a neutral color
- pause segment is black

## 5. Details modal

There is exactly one universal details modal in MVP.

The modal shows:
- task title
- task type
- task status
- schedule mode if applicable
- detailed description
- context/notes
- last pause reason if available
- completion reason if available
- event history

The modal does NOT duplicate:
- quick metrics already visible in the task row
- compact row-level progress labels

## UX Decisions Already Fixed

## Compact task row

Chosen pattern:
- two-line row
- line 1:
  - title
  - task type badge
  - status badge
  - schedule information
  - start/elapsed/progress summary
  - action buttons
- line 2:
  - full-width bar

## Language

UI language is Russian.
Do not use mixed Russian/English labels in user-facing text.

Keep as-is:
- project name `track`
- technical internals in code may stay English

Translate user-facing UI:
- task type badges
- schedule labels
- status labels
- action labels
- event labels
- modal labels

## Recommended Tech Stack

Keep implementation minimal:

- Vite
- TypeScript
- Vanilla DOM
- CSS
- localStorage

Do not add at MVP stage:
- React
- server
- database
- routing
- UI framework
- state manager
- drag and drop
- analytics layer
- authentication

Recommended file structure:

- `index.html`
- `src/main.ts`
- `src/styles.css`
- `src/model.ts`
- `src/storage.ts`
- `src/time.ts`
- `src/ui.ts`

Possible alternative:
- keep even fewer files at first
- `main.ts`
- `styles.css`

Prefer fewer files if code stays understandable.

## Data Model

## Task

```ts
type TaskType = "timed" | "background"
type TaskStatus = "todo" | "active" | "paused" | "done"
type ScheduleMode = "date" | "plan" | "none"

type Task = {
  id: string
  title: string
  type: TaskType
  status: TaskStatus
  scheduleMode: ScheduleMode
  deadlineDate: string | null
  plannedAmount: number | null
  plannedUnit: "minutes" | "hours" | "days" | "weeks" | "months" | "years" | null
  description: string
  notes: string
  createdAt: number
  history: TaskEvent[]
}
```

## Task event

```ts
type TaskEventType = "created" | "started" | "paused" | "resumed" | "completed"

type TaskEvent = {
  type: TaskEventType
  at: number
  reason: string | null
}
```

## Rules

Timed task:
- `scheduleMode` is `date` or `plan`
- if `date`, `deadlineDate` is required
- if `plan`, `plannedAmount` and `plannedUnit` are required

Background task:
- `scheduleMode = "none"`
- no deadline
- no planned amount
- no planned unit

## Derived State

Do not store these permanently unless necessary.
Compute them from task data and history.

```ts
type DerivedTask = {
  firstStartedAt: number | null
  activeDurationMs: number
  pausedDurationMs: number
  elapsedMs: number
  progressRatio: number
  isOverdue: boolean
  lastPauseReason: string | null
  completionReason: string | null
}
```

Rules:
- `elapsedMs` begins at first `start`
- pauses still consume time for timed tasks
- active and paused durations are separated for bar rendering

## Rendering Rules

## Timed task, Plan mode row

Line 1:
- title
- badge: `Со сроком`
- badge: status
- `План: X`
- `Старт: ...`
- `Прошло: ...`
- `Прогресс: ...`
- `Просрочка: ...`
- buttons

Line 2:
- progress bar

## Timed task, Date mode row

Line 1:
- title
- badge: `Со сроком`
- badge: status
- `Срок: DD.MM.YYYY`
- `Старт: ...`
- `Прошло: ...`
- `Прогресс: ...`
- `Просрочка: ...`
- buttons

Line 2:
- progress bar

## Background task row

Line 1:
- title
- badge: `Фоновая`
- badge: status
- `Работа: ...`
- `Паузы: ...`
- `Всего: ...`
- buttons

Line 2:
- activity bar

## Storage Rules

Use `localStorage`.

Suggested key:
- `track.tasks.v1`

Storage requirements:
- load tasks on startup
- save immediately after changes
- survive page reloads
- gracefully handle empty or malformed state

If malformed:
- fail safely
- fall back to empty state

## Implementation Phases

## Phase 1. Convert mockup into app skeleton

Goal:
turn `mockup.html` into the first real application structure

Tasks:
- create Vite app or minimal static setup
- move HTML into `index.html`
- move CSS into `src/styles.css`
- move behavior into `src/main.ts`
- preserve compact list layout
- preserve details modal behavior

Definition of done:
- app runs locally
- existing mockup visuals are preserved closely

## Phase 2. Build core model

Tasks:
- define Task types
- define TaskEvent types
- define schedule mode logic
- define helper functions for validation and event processing

Definition of done:
- data model is stable enough for UI wiring

## Phase 3. Implement static in-memory state

Tasks:
- build initial state array in memory
- render list from state instead of hardcoded markup
- render one details modal from selected task

Definition of done:
- UI renders from data, not static handwritten rows

## Phase 4. Implement task creation

Tasks:
- add create-task modal or inline form
- support task type:
  - timed
  - background
- for timed tasks:
  - support Date/Plan toggle
- validate:
  - title required
  - timed task must have exactly one schedule mode filled
  - background task must not require date/plan

Definition of done:
- user can create valid tasks in all supported modes

## Phase 5. Implement start/pause/resume/complete

Tasks:
- add action handlers
- create event entries in history
- require reason for pause
- require reason for complete
- allow start and resume without reason

Definition of done:
- task lifecycle works from UI

## Phase 6. Implement localStorage

Tasks:
- persist tasks after each mutation
- restore tasks on page load

Definition of done:
- state survives refresh

## Phase 7. Implement time calculations

Tasks:
- compute first start time
- compute elapsed time
- compute active time
- compute paused time
- compute completion and pause reasons from history

Definition of done:
- list metrics are data-driven and correct enough for MVP

## Phase 8. Implement live ticking

Tasks:
- add 1-second update loop
- rerender time-sensitive fields
- rerender progress bars

Definition of done:
- time visibly updates every second

## Phase 9. Implement progress bar logic

Tasks:
- Plan mode:
  - compute progress by planned duration
- Date mode:
  - compute progress by advancing toward deadline
- Background:
  - compute activity strip
- render pause segments black

Definition of done:
- bars reflect actual task state

## Phase 10. Implement details modal data binding

Tasks:
- open modal for clicked task
- populate:
  - title
  - type
  - status
  - schedule mode label
  - description
  - notes
  - last pause reason
  - completion reason
  - event history

Definition of done:
- details modal is universal and task-specific

## Phase 11. Polish MVP

Tasks:
- clean labels
- improve empty states
- improve focus/close behavior for modal
- ensure keyboard close with Escape
- ensure mobile layout is acceptable
- verify no layout regressions in compact rows

Definition of done:
- app is stable enough for real daily use

## Specific UI Components To Build

## Task row
Responsibilities:
- render task summary in 2 lines
- render appropriate buttons by status
- open details modal
- trigger pause/complete reason flow

## Progress bar
Responsibilities:
- render work segment
- render pause segment
- render remaining segment or neutral background

## Create task form
Responsibilities:
- collect base task data
- support timed/background types
- support Date/Plan toggle
- validate and create Task object

## Reason modal
Responsibilities:
- ask for pause reason
- ask for completion reason

## Details modal
Responsibilities:
- display expanded task information
- display history
- close cleanly

## Event Label Mapping

UI labels:
- `created` -> `Создана`
- `started` -> `Запуск`
- `paused` -> `Пауза`
- `resumed` -> `Продолжение`
- `completed` -> `Завершение`

## Validation Rules

Create task:
- title must not be empty
- background task ignores schedule fields
- timed task must choose Date or Plan
- Date mode requires valid date
- Plan mode requires amount > 0 and unit

Pause:
- reason required

Complete:
- reason required

Delete:
- allowed in MVP
- no reason required

## Risks And Simplifications

## Risk 1. Date-mode progress ambiguity
Date-mode progress can mean different things.

MVP simplification:
- progress reflects time moving toward deadline
- do not mix with estimated effort if Plan mode is absent

## Risk 2. Long-duration units
Months and years are fuzzy in milliseconds.

MVP simplification:
- treat them as calendar-like coarse units only for plan entry
- choose one deterministic conversion rule in code and document it
- acceptable first rule:
  - month = 30 days
  - year = 365 days

## Risk 3. Too much abstraction
Project can get overengineered quickly.

MVP simplification:
- keep logic mostly in a few straightforward modules
- avoid clever patterns

## Acceptance Criteria For MVP

The MVP is done when:

- user can create:
  - timed tasks in Date mode
  - timed tasks in Plan mode
  - background tasks
- user can:
  - start
  - pause with reason
  - resume
  - complete with reason
- list rows stay compact and readable
- details modal opens and shows:
  - description
  - notes
  - event history
- progress bars update every second
- pause segments are black
- state persists in localStorage
- UI remains Russian-language

## First Commands / Workflow After Resuming

1. Inspect current files
2. Decide whether to keep `mockup.html` as prototype reference only or split into app files immediately
3. Initialize chosen frontend structure
4. Move compact row layout into real app UI
5. Build data model and static render
6. Iterate toward lifecycle and persistence

## Suggested Immediate Next Action

When implementation resumes:
- start with Phase 1 and Phase 2 together
- avoid further expanding the mockup before the real app structure exists
