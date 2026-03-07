# Feature Map

## App Launch and Template Bootstrapping

### Open dashboard from Google Sheets
Client file:
- none, triggered from Sheets UI

Server file:
- `Code.gs`

Server functions:
- `onOpen()`
- `openDashboard()`

### Open as standalone web app
Server file:
- `Code.gs`

Server functions:
- `doGet(e)`
- `prepareTemplate()`
- `include(filename)`

## User Selection and Initial Loading

### Load staff names into dropdown
Client file:
- `app.html`

Server file:
- `Code.gs`

Server functions:
- `getStaffNames()`

Client responsibilities:
- request staff list on load
- populate user dropdown

### Load personalised task feed
Client file:
- `app.html`

Server file:
- `Code.gs`

Server functions:
- `getTasksForUser(user)`

Client responsibilities:
- trigger fetch after user selection
- render returned task array

## Personalised Status Tracking

### Mark item as Seen
Client file:
- `app.html`

Server file:
- `Code.gs`

Server functions:
- `logItemStatus(itemId, user, status)`

Client responsibilities:
- trigger confirmation modal if required
- optimistic update
- re-render card state

### Mark item as Pending
Client file:
- `app.html`

Server file:
- `Code.gs`

Server functions:
- `logItemStatus(itemId, user, status)`

### Mark item as Complete
Client file:
- `app.html`

Server file:
- `Code.gs`

Server functions:
- `logItemStatus(itemId, user, status)`

### Resolve latest status per user
Server file:
- `Code.gs`

Server functions:
- `getLatestStatusMapForUser_(user)`

## Archiving

### Manual archive
Client file:
- `app.html`

Server file:
- `Code.gs`

Server functions:
- `archiveItem(itemId, user)`
- `getArchivedIdMap_()`

### Automatic archive
Server file:
- `Code.gs`

Server functions:
- `getTasksForUser(user)`

Rules:
- archive 72 hours after target date
- archive 2 weeks after creation if no target date exists

## Countdown and Time Logic

### Overdue and countdown tags
Server file:
- `Code.gs`

Server functions:
- `getTasksForUser(user)`

Client file:
- `app.html`

Client responsibilities:
- display countdown and overdue labels in rendered cards

### Pre-archive warning tags
Server file:
- `Code.gs`

Server functions:
- `getTasksForUser(user)`

## Filtering and Feed Control

### Filter by category
Client file:
- `app.html`

Client responsibilities:
- read dropdown value
- filter rendered task list

### Filter by status
Client file:
- `app.html`

Client responsibilities:
- read dropdown value
- filter rendered task list

## Rendering and UI Behaviour

### Render task cards
Client file:
- `app.html`

Likely client function:
- `renderTasks()`

Responsibilities:
- clear and rebuild task list
- render different card layouts by category
- inject tags, icons, metadata, and action buttons

### Expand and collapse long text
Client file:
- `app.html`

Likely client functions:
- `toggleText()`
- `toggleAssign()`

### Confirmation modals
Client file:
- `app.html`
- `styles.html`

Responsibilities:
- show modal overlay
- require confirmation before status-changing actions

## Calendar Integration

### Add item to Google Calendar
Client file:
- `app.html`

Server file:
- task data supplied from `Code.gs`

Responsibilities:
- build calendar creation link from item dates and times
- support both all-day and time-specific events

## Base64 Asset Injection

### Inject Drive-hosted icons/images
Server file:
- `Code.gs`

Server functions:
- `getBase64FromDrive(fileId)`
- `prepareTemplate()`

Responsibilities:
- fetch Drive image
- convert to Base64
- inject into template payload

## Caching

### Cache staff names
Server file:
- `Code.gs`

Server functions:
- `getStaffNames()`
- `cacheGetJson_()`
- `cachePutJson_()`

### Cache user task results
Server file:
- `Code.gs`

Server functions:
- `getTasksForUser(user)`
- `clearUserTasksCache_()`

### Cache archived ID map
Server file:
- `Code.gs`

Server functions:
- `getArchivedIdMap_()`

## Data Sources

### Staff registry
Sheet:
- `Data`

Purpose:
- populate staff dropdown

### Main item feed
Sheet:
- `Imported_Data`

Purpose:
- store all events, tasks, deadlines, information, and vacation items

### User interaction log
Sheet:
- `Logs`

Purpose:
- store latest user statuses historically

### Archive registry
Sheet:
- `Archive_Index`

Purpose:
- record manually archived items