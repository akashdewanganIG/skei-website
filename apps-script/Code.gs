/**
 * SKEI Leads — Google Apps Script backend for the admin dashboard.
 *
 * This single script does two jobs:
 *   1. Receives new enquiries from the public website (unchanged behaviour),
 *      stamping each with an id + "New" status.
 *   2. Serves the admin dashboard: list / update / delete leads, protected by a
 *      shared secret.
 *
 * SETUP
 *   1. Open your leads Google Sheet → Extensions → Apps Script.
 *   2. Replace the script contents with this file and Save.
 *   3. Project Settings → Script properties, add:
 *        API_SECRET   = <the same value as LEADS_API_SECRET in your .env>
 *        SHEET_NAME   = <tab name, optional — defaults to the first sheet>
 *   4. Deploy → New deployment → type "Web app":
 *        Execute as: Me
 *        Who has access: Anyone
 *      Copy the /exec URL into LEADS_SCRIPT_URL (and keep it as
 *      NEXT_PUBLIC_GOOGLE_SCRIPT_URL for the public form).
 *   5. Re-deploy (Manage deployments → edit → new version) after any change.
 */

// Columns the dashboard manages. Lead-data columns are detected from the
// sheet's header row, so your existing layout keeps working.
var MANAGED_COLUMNS = ["id", "status", "remark", "updated_at", "updated_by"];
var LEAD_FIELDS = [
  "submit_date",
  "student_name",
  "grade",
  "dob",
  "gender",
  "parent_name",
  "mobile_no",
  "email",
  "comment",
];

function getSheet_() {
  var name = PropertiesService.getScriptProperties().getProperty("SHEET_NAME");
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return (name && ss.getSheetByName(name)) || ss.getSheets()[0];
}

function getSecret_() {
  return PropertiesService.getScriptProperties().getProperty("API_SECRET") || "";
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function nowStamp_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MM-yyyy HH:mm");
}

/** Ensure header row exists and contains every required column. Returns header→index map. */
function ensureHeaders_(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var header = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  header = header.map(function (h) {
    return String(h || "").trim();
  });

  var required = LEAD_FIELDS.concat(MANAGED_COLUMNS);
  var changed = false;
  required.forEach(function (col) {
    if (header.indexOf(col) === -1) {
      header.push(col);
      changed = true;
    }
  });
  if (changed) {
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
  }

  var map = {};
  header.forEach(function (h, i) {
    if (h) map[h] = i;
  });
  return { header: header, map: map };
}

function readLeads_(sheet, info) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var width = info.header.length;
  var values = sheet.getRange(2, 1, lastRow - 1, width).getValues();
  var leads = [];
  for (var r = 0; r < values.length; r++) {
    var row = values[r];
    var idCol = info.map["id"];
    if (!row[idCol]) continue; // skip blank rows
    var obj = {};
    Object.keys(info.map).forEach(function (key) {
      obj[key] = row[info.map[key]];
    });
    leads.push(obj);
  }
  return leads;
}

function findRowById_(sheet, info, id) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var idCol = info.map["id"];
  var ids = sheet.getRange(2, idCol + 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2; // 1-based, +1 header
  }
  return -1;
}

// ---- HTTP entrypoints -------------------------------------------------------

function doGet(e) {
  var params = (e && e.parameter) || {};
  if (params.action === "list") {
    if (params.secret !== getSecret_()) return json_({ ok: false, error: "Unauthorized." });
    var sheet = getSheet_();
    var info = ensureHeaders_(sheet);
    return json_({ ok: true, leads: readLeads_(sheet, info) });
  }
  return json_({ ok: true, status: "alive" });
}

function doPost(e) {
  var body = {};
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  } catch (err) {
    return json_({ ok: false, error: "Invalid payload." });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = getSheet_();
    var info = ensureHeaders_(sheet);

    // Admin actions require the shared secret.
    if (body.action) {
      if (body.secret !== getSecret_()) return json_({ ok: false, error: "Unauthorized." });
      if (body.action === "update") return updateLead_(sheet, info, body);
      if (body.action === "delete") return deleteLead_(sheet, info, body);
      return json_({ ok: false, error: "Unknown action." });
    }

    // Otherwise: a new enquiry from the public site.
    return insertLead_(sheet, info, body);
  } finally {
    lock.releaseLock();
  }
}

// ---- Actions ----------------------------------------------------------------

function insertLead_(sheet, info, body) {
  var row = new Array(info.header.length).fill("");
  LEAD_FIELDS.forEach(function (field) {
    if (body[field] != null && info.map[field] != null) row[info.map[field]] = body[field];
  });
  row[info.map["id"]] = String(Date.now()) + "-" + Math.floor(Math.random() * 9000 + 1000);
  row[info.map["status"]] = "New";
  if (!row[info.map["submit_date"]]) {
    row[info.map["submit_date"]] = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "dd-MM-yyyy",
    );
  }
  sheet.appendRow(row);
  return json_({ ok: true });
}

function updateLead_(sheet, info, body) {
  var rowNum = findRowById_(sheet, info, body.id);
  if (rowNum === -1) return json_({ ok: false, error: "Lead not found." });

  var patch = body.patch || {};
  var allowed = LEAD_FIELDS.concat(["status", "remark"]);
  allowed.forEach(function (key) {
    if (patch[key] !== undefined && info.map[key] != null) {
      sheet.getRange(rowNum, info.map[key] + 1).setValue(patch[key]);
    }
  });
  if (info.map["updated_by"] != null) {
    sheet.getRange(rowNum, info.map["updated_by"] + 1).setValue(body.updated_by || "");
  }
  if (info.map["updated_at"] != null) {
    sheet.getRange(rowNum, info.map["updated_at"] + 1).setValue(nowStamp_());
  }

  var width = info.header.length;
  var values = sheet.getRange(rowNum, 1, 1, width).getValues()[0];
  var lead = {};
  Object.keys(info.map).forEach(function (key) {
    lead[key] = values[info.map[key]];
  });
  return json_({ ok: true, lead: lead });
}

function deleteLead_(sheet, info, body) {
  var rowNum = findRowById_(sheet, info, body.id);
  if (rowNum === -1) return json_({ ok: false, error: "Lead not found." });
  sheet.deleteRow(rowNum);
  return json_({ ok: true });
}
