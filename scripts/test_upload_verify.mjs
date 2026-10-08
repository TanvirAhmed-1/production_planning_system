import fs from 'fs';

async function testUploadAndVerify() {
  const filePath = './Birichina- Month of October Sign off Production Plan- 26th October.xlsx';
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const formData = new FormData();
  formData.append('file', blob, 'Birichina_Verified_SignOff_Plan.xlsx');

  const res = await fetch('http://localhost:3000/api/excel/import', {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    return;
  }

  const result = await res.json();
  
  if (result.verification) {
    result.verification.checks.forEach(c => {
    });
  }
}

testUploadAndVerify().catch(() => {});
