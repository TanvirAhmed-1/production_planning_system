async function testApi() {
  const res = await fetch('http://localhost:3000/api/analytics/dashboard');
  if (!res.ok) {
    return;
  }
  const data = await res.json();
  
  const unitBreakdown = {};
  data.linePerformance.forEach(l => {
    unitBreakdown[l.unitCode] = (unitBreakdown[l.unitCode] || 0) + 1;
  });


  data.unitPerformance.forEach(u => {
  });
}

testApi().catch(() => {});
