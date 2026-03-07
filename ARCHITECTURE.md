# Architecture

## Overview
EDI Hub is a Google Apps Script web application backed by Google Sheets.

The project uses a split architecture:
- server-side Apps Script in `Code.gs`
- HTML shell in `Main.html` or `Index.html`
- CSS in `styles.html`
- client-side JavaScript in `app.html`

The frontend communicates with the backend using `google.script.run`.

## File Responsibilities

### Code.gs
Server-side Apps Script only.

Responsibilities:
- Google Sheets access
- reading and writing backend data
- providing web app entry point via `doGet()`
- opening the dashboard as a Sheets modal
- loading HTML templates
- converting Drive files to Base64
- task parsing and transformation
- countdown and archive calculations
- user-specific status resolution
- caching
- logging interactions
- archiving items

### Main.html or Index.html
Main page shell only.

Responsibilities:
- page structure
- layout containers
- dropdown containers
- filter controls
- placeholders for rendered content
- including `styles.html`
- including `app.html`

This file should not contain large blocks of business logic or styling.

### styles.html
CSS only.

Responsibilities:
- layout styling
- card styling
- status tag styling
- modal styling
- responsive behaviour
- text clamping
- visual hierarchy

### app.html
Client-side JavaScript only.

Responsibilities:
- initial page load behaviour
- populating user dropdown
- handling filter changes
- requesting task data via `google.script.run`
- rendering cards dynamically
- opening and closing confirmation modals
- optimistic UI updates
- toggling expanded text
- generating front-end interactions

## Frontend-Backend Communication

The frontend calls server functions through `google.script.run`.

Typical flow:
1. User performs an action in the UI
2. JavaScript in `app.html` handles the event
3. `google.script.run` calls a function in `Code.gs`
4. The server reads or writes data
5. The result is returned to the client
6. The UI updates accordingly

## Current Server Functions

### UI and App Loading
- `onOpen()`
- `openDashboard()`
- `doGet(e)`
- `include(filename)`
- `prepareTemplate()`

### Cache Helpers
- `cacheGetJson_()`
- `cachePutJson_()`
- `cacheRemove_()`
- `clearUserTasksCache_()`

### Data and Assets
- `getBase64FromDrive(fileId)`
- `getStaffNames()`

### Status and Archive Resolution
- `getLatestStatusMapForUser_(user)`
- `getArchivedIdMap_()`

### Core Data Processing
- `getTasksForUser(user)`

### User Actions
- `logItemStatus(itemId, user, status)`
- `archiveItem(itemId, user)`

## Core Data Logic

### Personalised Status Resolution
Item status is determined in this order:
1. latest user-specific status from `Logs`
2. fallback to the global default status from `Imported_Data`

### Auto-Archive Logic
The server calculates whether an item should still be visible based on:
- target date, if one exists
- creation date, if no target date exists

Rules:
- hide 72 hours after target date
- hide 2 weeks after creation if no target date

### Sorting Logic
Items are sorted on the frontend in this order:
1. overdue items
2. urgent priority items
3. category hierarchy:
   - Deadlines
   - Tasks
   - Events
   - Information
   - Vacations
4. chronological order by relevant date

## Development Rules

### File Placement Rules
When modifying this project:
- server logic goes in `Code.gs`
- page structure goes in `Main.html` or `Index.html`
- styling goes in `styles.html`
- UI JavaScript goes in `app.html`

### Additional Rules
- Do not place browser JavaScript in `Code.gs`
- Do not place CSS in the HTML shell file
- Do not place Apps Script code in HTML files
- Prefer editing the correct file directly rather than returning loose snippets
- Prefer extending existing functions over duplicating them

## Deployment Workflow
1. Edit code locally in VS Code
2. Review AI-generated or manual changes
3. Copy final code into the Google Apps Script project
4. Save and test
5. Commit to Git
6. Deploy the updated web app