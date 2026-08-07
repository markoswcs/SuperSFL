const fs = require('fs');
let app = fs.readFileSync('js/app.js', 'utf8');

if (!app.includes("btn-refresh")) {
  app = app.replace(
    /document\.addEventListener\('visibilitychange', \(\) => \{/g,
    `$('#btn-refresh')?.addEventListener('click', () => {
    const icon = $('#btn-refresh svg');
    if(icon) { icon.style.animation = 'spin 1s linear infinite'; }
    refreshData(true).then(() => {
      if(icon) { icon.style.animation = 'none'; }
    });
  });

  document.addEventListener('visibilitychange', () => {`
  );
  fs.writeFileSync('js/app.js', app);
  console.log('Fixed btn-refresh binding');
}
