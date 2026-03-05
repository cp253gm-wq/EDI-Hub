/**
 * ============================================================================
 * EDI Hub (Events, Deadlines, and Information)
 * ============================================================================
 * Architecture: Dual-Platform Google Apps Script Application
 * - Standalone Web App (via doGet)
 * - Google Sheets Modal Dashboard (via onOpen / openDashboard)
 *
 * Backend: Code.gs (Server-side logic, Google Sheets & Drive API interactions)
 * Frontend: Index.html (Client-side UI, HTML/CSS/JS)
 *
 * Communication:
 * Frontend calls backend functions asynchronously using `google.script.run`.
 * Key operations: getTasksForUser(), toggleStatus(), logItemStatus().
 *
 * Data Source: Master Google Spreadsheet
 * - 'Data' Sheet: Handles Staff Names / User Authentication.
 * - 'Imported_Data' Sheet: The core engine containing all dashboard items.
 *
 * Purpose: A centralized, priority-sorted command center for the CIA FIRST 
 * MS Math department. Tracks individual progress on Deadlines, Events, Tasks, 
 * Information, and Vacations, featuring real-time countdowns and Google 
 * Calendar integration.
 * ============================================================================
 */

// --- 1. SHEETS MENU SETUP (Keeps the Pop-up working) ---
function onOpen() {
  SpreadsheetApp.getUi().createMenu(' 🚀  EDI Hub')
      .addItem('Open Dashboard', 'openDashboard')
      .addToUi();
}

function openDashboard() {
  
  var template = prepareTemplate(); // Fetches data using the helper function below
  
  // Evaluate and open the dialog in Sheets
  var html = template.evaluate()
      .setWidth(1400)
      .setHeight(800)
      .setTitle('EDI Hub');
      
  SpreadsheetApp.getUi().showModalDialog(html, ' ');
}

// --- 2. WEB APP SETUP (Enables the standalone URL) ---
function doGet(e) {
  var template = prepareTemplate(); // Fetches the exact same data!
  
  // Evaluate and return the HTML for the standalone browser
  return template.evaluate()
      .setTitle('EDI Hub')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// --- 3. HELPER FUNCTION TO LOAD DATA (Used by both doors!) ---
function prepareTemplate() {
  var template = HtmlService.createTemplateFromFile('Index');
  
  // Fetch your Logo
  template.logoData = getBase64FromDrive('19mPJKHJqa1jxhncy_vMKL2Ji75bzX8Zb');
  
  // Fetch your 5 Category Icons + Default using your exact IDs
  var iconsObject = {
    "Deadline":    getBase64FromDrive('1XIebkiDUA26NAZIrGmffu--Alz_A7X-1'),
    "Event":       getBase64FromDrive('1m5EFML635qlcY2RMlFZExeAyPRKQTwGH'),
    "Information": getBase64FromDrive('1hayBHxM5IVXMfogq4Qvjplfpu-miXFdj'), 
    "Task":        getBase64FromDrive('1-G6SGaP00pMmfClnqVaLmt1mDjcIF3gy'),
    "Vacation":    getBase64FromDrive('1MNp7mdAjLHC7seqRfsg9DZg6piHVaA_e'),
    "Default":     getBase64FromDrive('19Md7A0UW-9rE-85Nur3Y4x_mUKB7bhNi')
  };
  
  // Package them as a string to hand to the HTML safely
  template.iconsJSON = JSON.stringify(iconsObject);
  
  return template;
}

// =========================================================================
// --- KEEP YOUR OTHER HELPER FUNCTIONS EXACTLY AS THEY ARE BELOW THIS LINE ---
// function getBase64FromDrive(fileId) { ...
// function getStaffNames() { ...
// function getTasksForUser(user) { ...
// function logItemStatus(itemId, user, status) { ...

// --- HELPER FUNCTION ---
function getBase64FromDrive(fileId) {
  try {
    var file = DriveApp.getFileById(fileId);
    var base64 = Utilities.base64Encode(file.getBlob().getBytes());
    return 'data:' + file.getMimeType() + ';base64,' + base64; 
  } catch (error) {
    Logger.log("Failed to load image ID: " + fileId);
    return ''; 
  }
}

function getStaffNames() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Data"); 
    if (!sheet) return ["Error: 'Data' sheet missing"];
    var data = sheet.getRange("B3:B200").getValues();
    var names = [];
    for (var i = 0; i < data.length; i++) {
      if (data[i][0]) {
        var nameStr = String(data[i][0]).trim();
        if (nameStr !== "") names.push(nameStr);
      }
    }
    return names;
  } catch (e) { 
    return ["Error: Check Data Sheet"]; 
  }
}

function getTasksForUser(user) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Imported_Data");
    if (!sheet) return [];
    
    var data = sheet.getDataRange().getValues();
    var tasks = [];
    var searchName = String(user).toLowerCase().trim();

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[3]) continue; 
      
      var assignedValue = String(row[3]).toLowerCase().trim();
      
      if (assignedValue.indexOf(searchName) !== -1 || assignedValue.indexOf("all") !== -1) {
        
        var dateAdded         = row[1] || "";  // Column B
        var eventStartDate    = row[9] || "";  // Column J (Date)
        var eventStartTime    = row[10] || ""; // Column K (Time)
        var eventEndTime      = row[11] || ""; // Column L (Time)
        var vacationStartDate = row[12] || ""; // Column M (Date)
        var vacationEndDate   = row[13] || ""; // Column N (Date)
        var deadlineDate      = row[14] || ""; // Column O (Date)
        var deadlineTime      = row[15] || ""; // Column P (Time)

        var rawStart = eventStartDate || vacationStartDate || deadlineDate; 
        var rawEnd = vacationEndDate || deadlineDate; 
        
        var primaryStart = rawStart ? new Date(rawStart) : null;
        var primaryEnd = rawEnd ? new Date(rawEnd) : null;
        
        var activeTargetDate = primaryEnd || primaryStart; 

        var isValidDate = function(d) { return d && d instanceof Date && !isNaN(d.getTime()); };

        // Calculate DD/MM/YYYY - DD/MM/YYYY
        var displayDate = "";
        if (isValidDate(primaryStart)) {
          var sStr = Utilities.formatDate(primaryStart, Session.getScriptTimeZone(), "dd/MM/yyyy");
          if (isValidDate(primaryEnd)) {
            var eStr = Utilities.formatDate(primaryEnd, Session.getScriptTimeZone(), "dd/MM/yyyy");
            displayDate = (sStr === eStr) ? sStr : (sStr + " - " + eStr);
          } else {
            displayDate = sStr;
          }
        } else if (isValidDate(primaryEnd)) {
          displayDate = Utilities.formatDate(primaryEnd, Session.getScriptTimeZone(), "dd/MM/yyyy");
        }

        // Calculate 72-Hour / 2-Week Archive rule
        var now = new Date();
        var msInHour = 60 * 60 * 1000;
        var ms72Hours = 72 * msInHour;
        var ms2Weeks = 14 * 24 * msInHour;

        var archiveLabel = "";
        var isArchived = false;

        if (isValidDate(activeTargetDate)) {
          var timeSinceExpiry = now.getTime() - activeTargetDate.getTime();
          if (timeSinceExpiry >= ms72Hours) {
            isArchived = true;
          } else if (timeSinceExpiry > 0) {
            var remaining = ms72Hours - timeSinceExpiry;
            var hours = Math.ceil(remaining / msInHour);
            archiveLabel = hours > 24 ? "Archiving in " + Math.ceil(hours / 24) + " days..." : "Archiving in " + hours + " hours...";
          }
        } else if (dateAdded) {
          var dAddedValid = new Date(dateAdded);
          if (isValidDate(dAddedValid)) {
            var timeSinceAdded = now.getTime() - dAddedValid.getTime();
            if (timeSinceAdded >= ms2Weeks) {
              isArchived = true;
            } else if (timeSinceAdded >= (ms2Weeks - ms72Hours)) {
              var remaining = ms2Weeks - timeSinceAdded;
              var hours = Math.ceil(remaining / msInHour);
              archiveLabel = hours > 24 ? "Archiving in " + Math.ceil(hours / 24) + " days..." : "Archiving in " + hours + " hours...";
            }
          }
        }

        // Drop the task entirely if it hit the archive deadline
        if (isArchived) continue;

        function makeSafe(d) { return (d instanceof Date) ? d.toISOString() : String(d); }

        tasks.push({
          id: row[0],
          dateAdded: makeSafe(dateAdded), 
          category: row[2] || "",
          assignedTo: row[3],
          priority: row[4] || "",
          title: row[5] || "",
          details: row[6] || "",
          actionReq: row[7] || "",
          link: row[8] || "", 
          eventStartDate: makeSafe(eventStartDate),
          eventEndDate: "",                       // <-- FIXED: No longer crashes looking for missing variable
          eventStartTime: makeSafe(eventStartTime),
          eventEndTime: makeSafe(eventEndTime),   // <-- FIXED: Properly mapped to Column L instead of ""
          vacationStartDate: makeSafe(vacationStartDate),
          vacationEndDate: makeSafe(vacationEndDate),
          deadlineDate: makeSafe(deadlineDate),
          deadlineTime: makeSafe(deadlineTime),
          status: row[16] || "Active",
          displayDate: displayDate,   
          archiveLabel: archiveLabel  
        });
      }
    }
    return tasks;
  } catch (e) {
    return [];
  }
}

function logItemStatus(itemId, user, status) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Logs") || ss.insertSheet("Logs");
  sheet.appendRow([new Date(), itemId, user, status]);
  return true;
}