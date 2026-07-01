/**
 * HYPA BOT — Google Apps Script
 * Receives form submissions from the website and appends them to Google Sheets.
 *
 * SPREADSHEET: https://docs.google.com/spreadsheets/d/1X9YpaAwVkNrj8urP0o44-3QxZ3G13nJOFd5nFmhagKo/edit
 *
 * Deploy as:
 *   Execute as: Me
 *   Who has access: Anyone
 */

// ─── Configuration ─────────────────────────────────────────────────────────────
const SPREADSHEET_ID = '1X9YpaAwVkNrj8urP0o44-3QxZ3G13nJOFd5nFmhagKo';
const SHEET_NAME = 'Leads'; // Change if your sheet tab has a different name

// ─── Header row definition ─────────────────────────────────────────────────────
const HEADERS = [
  'Timestamp',
  'Name',
  'Business Name',
  'Email',
  'Phone Number',
  'Selected AI Employee',
  'Biggest Business Challenge',
  'Status',
  'Notes',
];

// ─── Main POST handler ─────────────────────────────────────────────────────────
function doPost(e) {
  try {
    // Parse incoming JSON
    var payload = JSON.parse(e.postData.contents);

    // Basic validation
    if (!payload.name || !payload.email) {
      return buildResponse({ success: false, error: 'Missing required fields' }, 400);
    }

    // Open spreadsheet
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);

    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    // Create header row if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);

      // Style header row
      var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#1a1a2e');
      headerRange.setFontColor('#93c5fd');
      headerRange.setFontSize(10);

      // Set column widths
      sheet.setColumnWidth(1, 160);  // Timestamp
      sheet.setColumnWidth(2, 140);  // Name
      sheet.setColumnWidth(3, 160);  // Business Name
      sheet.setColumnWidth(4, 200);  // Email
      sheet.setColumnWidth(5, 130);  // Phone Number
      sheet.setColumnWidth(6, 180);  // Selected AI Employee
      sheet.setColumnWidth(7, 250);  // Biggest Business Challenge
      sheet.setColumnWidth(8, 120);  // Status
      sheet.setColumnWidth(9, 200);  // Notes

      // Freeze header row
      sheet.setFrozenRows(1);
    }

    // Build timestamp
    var now = new Date();
    var timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy h:mm a');

    // Append new lead row
    sheet.appendRow([
      timestamp,
      payload.name || '',
      payload.business || '',
      payload.email || '',
      payload.phone || '',
      payload.service || '',
      payload.challenge || '',
      'New',
      '',
    ]);

    // Auto-resize rows for readability (last row only)
    var lastRow = sheet.getLastRow();
    sheet.setRowHeight(lastRow, 24);

    return buildResponse({ success: true, row: lastRow });

  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return buildResponse({ success: false, error: error.toString() }, 500);
  }
}

// ─── GET handler (health check) ───────────────────────────────────────────────
function doGet(e) {
  return buildResponse({ status: 'ok', service: 'HYPA BOT Lead Capture' });
}

// ─── Response builder with CORS headers ───────────────────────────────────────
function buildResponse(data, statusCode) {
  var output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
