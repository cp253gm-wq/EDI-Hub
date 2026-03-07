# Project Context

## Project Name
EDI Hub

## Purpose
EDI Hub is a bespoke Google Apps Script web application built for a Middle School Math department. It acts as a centralised dashboard for events, deadlines, information, tasks, and staff vacations.

The system replaces fragmented email chains and raw spreadsheet checking with a single personalised interface that allows staff to view, manage, and track relevant items in one place.

The app is connected to Google Sheets as its backend data source and can run in two ways:
1. As a modal dialog launched from a Google Sheets custom menu
2. As a standalone browser-based Google Apps Script web app

## Development Workflow
The project is developed locally in VS Code and then manually copied into the Google Apps Script editor for testing and deployment.

The local project is structured so that:
- `Code.gs` contains server-side Apps Script logic
- `Main.html` or `Index.html` contains the page shell
- `styles.html` contains CSS
- `app.html` contains client-side JavaScript

## Core System Behaviour
The app provides each user with a personalised feed of items based on:
- who the item is assigned to
- the user’s own interaction history
- item category
- target dates and countdowns
- priority level
- archive rules

The system resolves each item’s displayed status dynamically for the selected user, allowing individual staff members to track their own progress without affecting other users.

## Main Features

### 1. Dual-Platform Access
The app can be opened:
- from a custom Google Sheets menu
- from a deployed web app URL

### 2. Personalised Status Tracking
Users can mark items as:
- Seen
- Pending
- Complete

These actions are logged per user and are reversible. One user’s status changes do not affect another user’s view.

### 3. Dynamic Countdown and Overdue Tags
The app calculates time-sensitive labels such as:
- days remaining
- overdue warnings
- upcoming archive warnings

### 4. Time-Based Auto-Archiving
Items are automatically hidden when no longer relevant:
- 72 hours after a target date passes
- 2 weeks after creation if no target date exists

### 5. Manual Archiving
Users can manually archive items. Archived IDs are recorded in a dedicated archive registry.

### 6. Google Calendar Integration
Event, deadline, and vacation items can generate pre-filled Google Calendar creation links.

### 7. Filtering
Users can filter visible items by:
- category
- status

### 8. Base64 Image Injection
Icons or images stored in Google Drive are converted to Base64 on the server and injected into the HTML payload to avoid cross-origin restrictions in Google Workspace.

### 9. Confirmation Modals
Important status-changing actions trigger confirmation modals before being committed.

### 10. Server-Side Caching
The system caches staff names, user task results, and archived item data to improve performance and reduce repeated sheet reads.

## Backend Spreadsheet Structure

### Data Sheet
Used as a staff registry.
- Column B: Staff Names

### Imported_Data Sheet
Main content feed.
- Column A: Item ID
- Column B: Date Added
- Column C: Category
- Column D: Assigned To
- Column E: Priority
- Column F: Title
- Column G: Details
- Column H: Action Required
- Column I: Hyperlink
- Columns J to L: Event dates and times
- Columns M to N: Vacation dates
- Columns O to P: Deadline date and time
- Column Q: Global Default Status

### Logs Sheet
Stores user-item status interactions.
- Column A: Timestamp
- Column B: Item ID
- Column C: User
- Column D: Status

### Archive_Index Sheet
Stores manually archived items.
- Column A: Item ID
- Column B: Archive Timestamp

## User Workflow
1. User opens the app from Sheets or web URL
2. User selects their name
3. The app loads a personalised feed from Google Sheets
4. Items are sorted and rendered dynamically
5. User updates statuses or archives items
6. The backend logs those actions and clears relevant cache entries
7. The next load reflects the updated user-specific state