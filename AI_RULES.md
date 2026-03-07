# AI Editing Rules

This project is a Google Apps Script web app connected to Google Sheets.

AI assistants working on this project must follow the rules below.

## File Responsibilities

Code.gs
Server-side Apps Script only.

Handles:
- Google Sheets access
- data parsing
- caching
- archive logic
- status logging
- template preparation
- backend calculations

Main.html (or Index.html)
HTML page shell only.

Contains:
- page layout
- header
- filter controls
- containers for rendered content
- includes for styles.html and app.html

styles.html
CSS only.

Contains:
- layout styling
- card styling
- modal styling
- responsive behaviour
- text clamping rules

app.html
Client-side JavaScript only.

Handles:
- UI behaviour
- event listeners
- DOM rendering
- filtering
- confirmation modals
- calls to server functions using google.script.run

## Communication Pattern

Frontend JavaScript must call backend functions using:

google.script.run

Never attempt to access Google Sheets directly from client-side code.

## Editing Rules

When modifying the project:

- Place server logic in Code.gs
- Place UI JavaScript in app.html
- Place styling in styles.html
- Place layout markup in Main.html or Index.html

Do not mix responsibilities across files.

## Refactoring Rules

Prefer modifying existing functions rather than creating duplicates.

Avoid large blocks of inline JavaScript inside HTML templates.

Avoid placing CSS directly inside HTML files.

## Output Rules for AI Assistants

When proposing code changes:

- edit the correct file directly if possible
- avoid returning loose snippets
- maintain the current architecture
- preserve existing function names unless refactoring intentionally