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

const APP_VERSION = "v1.0.0";
const APP_COMMIT = "dev";
const APP_COPYRIGHT_YEAR = "2026";

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
  var template = HtmlService.createTemplateFromFile('Main');
  template.appVersion = APP_VERSION;
  template.appCommit = APP_COMMIT;
  template.appCopyrightYear = APP_COPYRIGHT_YEAR;
  
  // Fetch your Logo
  template.logoData = getBase64FromDrive('19mPJKHJqa1jxhncy_vMKL2Ji75bzX8Zb');

  // Fetch your 5 Category Icons + Default using your exact IDs.
  // Any missing icon gracefully falls back to Default.
  var defaultIcon = getBase64FromDrive('19Md7A0UW-9rE-85Nur3Y4x_mUKB7bhNi');
  var resolveIcon = function(fileId) {
    return getBase64FromDrive(fileId) || defaultIcon;
  };
  var iconsObject = {
    "Deadline":    resolveIcon('1XIebkiDUA26NAZIrGmffu--Alz_A7X-1'),
    "Event":       resolveIcon('1m5EFML635qlcY2RMlFZExeAyPRKQTwGH'),
    "Information": resolveIcon('1hayBHxM5IVXMfogq4Qvjplfpu-miXFdj'), 
    "Task":        resolveIcon('1-G6SGaP00pMmfClnqVaLmt1mDjcIF3gy'),
    "Vacation":    resolveIcon('1MNp7mdAjLHC7seqRfsg9DZg6piHVaA_e'),
    "Default":     defaultIcon
  };
  
  // Package them as a string to hand to the HTML safely
  template.iconsJSON = JSON.stringify(iconsObject);
  
  return template;
}

// =========================================================================
// --- KEEP YOUR OTHER HELPER FUNCTIONS EXACTLY AS THEY ARE BELOW THIS LINE ---
// function getBase64FromDrive(fileId) { ...
// function getStaffNames() { ...
// function getTasksForUser(user, options) { ...
// function logItemStatus(itemId, user, status) { ...
// --- CACHING HELPER FUNCTIONS ---
const SCRIPT_CACHE = CacheService.getScriptCache();

// --- HELPER FUNCTION ---
/**
 * Retrieves and parses a JSON string from the cache.
 * @param {string} key The cache key.
 * @returns {Object|null} The parsed object or null if not found or invalid.
 */
function cacheGetJson_(key) {
  const cached = SCRIPT_CACHE.get(key);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      Logger.log('Failed to parse cached JSON for key: ' + key);
      return null;
    }
  }
  return null;
}

/**
 * Stringifies and puts a JSON object into the cache.
 * @param {string} key The cache key.
 * @param {Object} obj The object to cache.
 * @param {number} ttlSeconds The time-to-live in seconds.
 */
function cachePutJson_(key, obj, ttlSeconds) {
  try {
    const jsonString = JSON.stringify(obj);
    SCRIPT_CACHE.put(key, jsonString, ttlSeconds);
  } catch (e) {
    Logger.log('Failed to stringify or cache object for key: ' + key);
  }
}

/**
 * Removes one or more keys from the cache.
 * @param {string|string[]} keyOrArray A single key or an array of keys.
 */
function cacheRemove_(keyOrArray) {
  if (Array.isArray(keyOrArray)) {
    SCRIPT_CACHE.removeAll(keyOrArray);
  } else {
    SCRIPT_CACHE.remove(keyOrArray);
  }
}

/**
 * Clears the task cache for a specific user.
 * @param {string} user The user's name.
 */
function clearUserTasksCache_(user) {
  if (!user) return;
  const base = "edi:tasks:" + String(user).toLowerCase().trim() + ":v3";
  cacheRemove_([base + ":noArchived", base + ":withArchived"]);
}

// =========================================================================
// --- DATA & API FUNCTIONS ---

function getBase64FromDrive(fileId) {
  try {
    var file = DriveApp.getFileById(fileId);
    var base64 = Utilities.base64Encode(file.getBlob().getBytes());
    return 'data:' + file.getMimeType() + ';base64,' + base64; 
  } catch (error) {
    Logger.log("Failed to load image ID: " + fileId + ". Error: " + error.message);
    return ''; 
  }
}

function getStaffNames() {
  const CACHE_KEY = "edi:staffNames:v1";
  const cachedNames = cacheGetJson_(CACHE_KEY);
  if (cachedNames) {
    return cachedNames;
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Data"); 
    if (!sheet) return ["Error: 'Data' sheet missing"];
    var data = sheet.getRange("B4:B200").getValues();
    var names = [];
    for (var i = 0; i < data.length; i++) {
      if (data[i][0]) {
        var nameStr = String(data[i][0]).trim();
        if (nameStr !== "") names.push(nameStr);
      }
    }
    cachePutJson_(CACHE_KEY, names, 21600); // Cache for 6 hours
    return names;
  } catch (e) { 
    Logger.log("Error in getStaffNames: " + e.message);
    return ["Error: Check Data Sheet"]; 
  }
}

function getSignedInUserContext() {
  var fallback = {
    name: "",
    email: "",
    organisationRole: "",
    systemRole: "User"
  };

  try {
    var signedInEmail = String(Session.getActiveUser().getEmail() || "").toLowerCase().trim();
    fallback.email = signedInEmail;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Data");
    if (!sheet) return fallback;

    var rows = sheet.getRange("B4:E200").getValues(); // Name, Email, Org Role, System Role
    for (var i = 0; i < rows.length; i++) {
      var name = String(rows[i][0] || "").trim();
      var email = String(rows[i][1] || "").toLowerCase().trim();
      var organisationRole = String(rows[i][2] || "").trim();
      var systemRole = String(rows[i][3] || "").trim();
      if (!name || !email) continue;
      if (email !== signedInEmail) continue;

      return {
        name: name,
        email: email,
        organisationRole: organisationRole,
        systemRole: String(systemRole || "").toLowerCase() === "admin" ? "Admin" : "User"
      };
    }
    return fallback;
  } catch (e) {
    Logger.log("Error in getSignedInUserContext: " + e.message);
    return fallback;
  }
}

function getAuthorizationStatusForUi() {
  try {
    var authInfo = ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL);
    var status = authInfo.getAuthorizationStatus();
    var needsAuth = status === ScriptApp.AuthorizationStatus.REQUIRED;
    return {
      requiresAuthorization: needsAuth,
      authorizationUrl: authInfo.getAuthorizationUrl() || ""
    };
  } catch (e) {
    Logger.log("Error in getAuthorizationStatusForUi: " + e.message);
    return {
      requiresAuthorization: false,
      authorizationUrl: ""
    };
  }
}

function getLatestStatusMapForUser_(user) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Logs");
  var statusMap = {};

  if (!sheet || sheet.getLastRow() < 1) return statusMap;

  var userKey = String(user || "").toLowerCase().trim();

  var lastRow = sheet.getLastRow();
  var startRow = Math.max(1, lastRow - 2000 + 1);
  var numRows = lastRow - startRow + 1;

  var data = sheet.getRange(startRow, 1, numRows, 4).getValues();
  // Columns: [timestamp, itemId, user, status]

  for (var i = data.length - 1; i >= 0; i--) {
    var row = data[i];
    var itemId = row[1];
    var logUser = String(row[2] || "").toLowerCase().trim();
    var logStatus = row[3];

    if (!itemId || !logStatus) continue;
    if (logUser !== userKey) continue; // per-user

    var idStr = String(itemId).trim();
    if (!(idStr in statusMap)) {
      statusMap[idStr] = String(logStatus);
    }
  }

  return statusMap;
}

function getTasksForUser(user, options) {

  options = options || {}; // ensure options exists
  var includeArchived = options.includeArchived === true;

  const searchName = String(user).toLowerCase().trim();
  var archivedFlag = includeArchived ? "withArchived" : "noArchived";
  const CACHE_KEY = "edi:tasks:" + searchName + ":v3:" + archivedFlag;

  const cachedTasks = cacheGetJson_(CACHE_KEY);
  if (cachedTasks) {
    return cachedTasks;
  }

options = options || {};
var includeArchived = options.includeArchived === true;

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Imported_Data");
    if (!sheet) return [];
    
    var data = sheet.getDataRange().getValues();
    var latestStatusMap = getLatestStatusMapForUser_(user);
    var tasks = [];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];

      if (!row[3]) continue; 
      
      var assignedValue = String(row[3]).toLowerCase().trim();
      
      if (assignedValue.indexOf(searchName) !== -1 || assignedValue.indexOf("all") !== -1) {
        
        var idStr = String(row[0]).trim();
        var dateAdded         = row[1] || "";  // Column B
        var eventStartDate    = row[9] || "";  // Column J (Date)
        var eventEndDate      = row[10] || ""; // Column K (Date)
        var eventStartTime    = row[11] || ""; // Column L (Time)
        var eventEndTime      = row[12] || ""; // Column M (Time)
        var vacationStartDate = row[13] || ""; // Column N (Date)
        var vacationEndDate   = row[14] || ""; // Column O (Date)
        var deadlineDate      = row[15] || ""; // Column P (Date)
        var deadlineTime      = row[16] || ""; // Column Q (Time)
        var baseStatus = latestStatusMap[idStr] || row[17] || "Active";

        var rawStart = eventStartDate || vacationStartDate || deadlineDate; 
        var rawEnd = eventEndDate || vacationEndDate || deadlineDate; 
        
        var primaryStart = rawStart ? new Date(rawStart) : null;
        var primaryEnd = rawEnd ? new Date(rawEnd) : null;
        
        var activeTargetDate = primaryEnd || primaryStart; 

        var isValidDate = function(d) { return d && d instanceof Date && !isNaN(d.getTime()); };

        // Calculate DD/MM/YYYY - DD/MM/YYYY
        var displayDate = "";
        if (isValidDate(primaryStart)) {
          var sStr = Utilities.formatDate(primaryStart, Session.getScriptTimeZone(), "EEE dd/MM/yyyy");
          if (isValidDate(primaryEnd)) {
            var eStr = Utilities.formatDate(primaryEnd, Session.getScriptTimeZone(), "EEE dd/MM/yyyy");
            displayDate = (sStr === eStr) ? sStr : (sStr + " - " + eStr);
          } else {
            displayDate = sStr;
          }
        } else if (isValidDate(primaryEnd)) {
          displayDate = Utilities.formatDate(primaryEnd, Session.getScriptTimeZone(), "EEE dd/MM/yyyy");
        }

        // Calculate 72-Hour / 2-Week Archive rule
        var now = new Date();
        var msInHour = 60 * 60 * 1000;
        var ms72Hours = 72 * msInHour;
        var ms2Weeks = 14 * 24 * msInHour;

        var archiveLabel = "";
        var isArchived = false;
        var archiveSortDate = activeTargetDate;
        var categoryLower = String(row[2] || "").toLowerCase();
        var statusLower = String(baseStatus || "").toLowerCase();
        var isClosedStatus = (statusLower === "complete" || statusLower === "archived" || statusLower === "cancelled");
        var isOverdueDeadline = false;

        if (categoryLower.indexOf("deadline") !== -1 && !isClosedStatus && isValidDate(deadlineDate ? new Date(deadlineDate) : null)) {
          var dLineD = new Date(deadlineDate);
          var dLineT = deadlineTime ? new Date(deadlineTime) : null;
          var targetDeadline = new Date(dLineD.getTime());
          if (dLineT instanceof Date && !isNaN(dLineT.getTime())) {
            targetDeadline.setHours(dLineT.getHours(), dLineT.getMinutes(), 0, 0);
          } else {
            targetDeadline.setHours(23, 59, 59, 999);
          }
          isOverdueDeadline = now.getTime() > targetDeadline.getTime();
        }

        if (isValidDate(activeTargetDate) && !isOverdueDeadline) {
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
            archiveSortDate = dAddedValid;
            if (timeSinceAdded >= ms2Weeks) {
              isArchived = true;
            } else if (timeSinceAdded >= (ms2Weeks - ms72Hours)) {
              var remaining = ms2Weeks - timeSinceAdded;
              var hours = Math.ceil(remaining / msInHour);
              archiveLabel = hours > 24 ? "Archiving in " + Math.ceil(hours / 24) + " days..." : "Archiving in " + hours + " hours...";
            }
          }
        }

        // If auto-archived, only include it when requested (Archived filter / All)
if (isArchived && !includeArchived) continue;

        function makeSafe(d) { return (d instanceof Date) ? d.toISOString() : String(d); }

var resolvedStatus = isArchived ? "Archived" : baseStatus;

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
          eventEndDate: makeSafe(eventEndDate),
          eventStartTime: makeSafe(eventStartTime),
          eventEndTime: makeSafe(eventEndTime),
          vacationStartDate: makeSafe(vacationStartDate),
          vacationEndDate: makeSafe(vacationEndDate),
          deadlineDate: makeSafe(deadlineDate),
          deadlineTime: makeSafe(deadlineTime),
          status: resolvedStatus,
          displayDate: displayDate,   
          archiveLabel: archiveLabel,
          archiveSortDate: makeSafe(archiveSortDate || dateAdded)
        });
      }
    }
    
    cachePutJson_(CACHE_KEY, tasks, 60); // Cache for 60 seconds
    return tasks;
  } catch (e) {
    Logger.log('Error in getTasksForUser for ' + user + ': ' + e.message);
    return [];
  }
}

function logItemStatus(itemId, user, status) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Logs") || ss.insertSheet("Logs");
    sheet.appendRow([new Date(), itemId, user, status]);

    // Invalidate the cache for this user's tasks
    clearUserTasksCache_(user);

    return true;

  } catch (e) {
    Logger.log('Failed to log item status: ' + e.message);
    return false;
  }
}
