// Paste this script at https://script.google.com -> New Project -> Deploy -> Web App
// Execute as: Me | Who has access: Anyone
// Copy the Web App URL and paste it in Render Environment Variables as EMAIL_WEBHOOK_URL

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    MailApp.sendEmail({
      to: data.to,
      subject: data.subject,
      body: data.text || '',
      htmlBody: data.html || '',
      name: 'UrbanCart'
    });
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
