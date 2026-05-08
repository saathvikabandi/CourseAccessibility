import fs from 'fs';

async function run() {
  console.log("Logging in...");
  const loginRes = await fetch('http://localhost:3001/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@admin.com', password: 'password' })
  });
  const loginData = await loginRes.json();
  console.log("Login res:", loginRes.status, loginData);

  if (loginData.token) {
    console.log("Adding sheet...");
    const sheetRes = await fetch('http://localhost:3001/api/admin/sheets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify({ sheet_name: 'Test', sheet_url: 'https://docs.google.com/spreadsheets/d/123/edit', is_active: true })
    });
    console.log("Sheet res:", sheetRes.status, await sheetRes.text());
  }
}

run();
