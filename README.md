# EDI Hub – Google Apps Script Web App

This project is a web application built using Google Apps Script and connected to Google Sheets.

The app is developed locally in VS Code and then copied into the Google Apps Script editor for deployment.

Development workflow:
1. Code is written and edited locally in VS Code.
2. AI tools may modify files directly in the workspace.
3. Finished code is copied into the Google Apps Script project.
4. The script is tested, committed to Git, and deployed as a web app.

---

# Architecture

The project follows a simple separation between server-side Apps Script and client-side code.

Code.gs  
Server-side logic written in Google Apps Script. Responsible for:
- Accessing Google Sheets
- Reading and writing data
- Handling business logic
- Providing functions called by the frontend via `google.script.run`
- Web app entry point (`doGet()`)

Index.html  
Main HTML shell of the web app. Responsible for:
- Page layout
- Loading CSS and JavaScript files
- Including HTML fragments used by the interface

styles.html  
Contains all CSS styling for the interface.

app.html  
Contains all client-side JavaScript responsible for:
- User interface behaviour
- Event listeners
- DOM updates
- Calling server functions using `google.script.run`

---

# Client–Server Communication

The frontend communicates with the Apps Script backend using:

google.script.run

Example flow:

User action → JavaScript function in app.html →  
google.script.run → server function in Code.gs →  
data returned to frontend → UI updated.

---

# Development Rules

To maintain a clean architecture:

- Server-side logic must remain in `Code.gs`.
- Client-side JavaScript must remain in `app.html`.
- CSS must remain in `styles.html`.
- `Index.html` should only contain page structure and includes.
- Avoid duplicating functions across files.

---

# Deployment

The code in this repository mirrors the Apps Script project.  
Once changes are complete, the updated code is manually copied into the Apps Script editor and deployed as a web app.