const fs = require('fs');

function main() {
    let code = fs.readFileSync('js/ui.js', 'utf8');

    const oldStr = 'title="Clique para copiar ID" onclick="navigator.clipboard.writeText(\\'${farmId}\\'); window.__app.showToast(\\'ID Copiada!\\'); event.stopPropagation();">#${farmId}</div>';
    
    // Using a sleek external link icon
    const newStr = 'title="Clique para visitar a Fazenda" onclick="window.open(\\'https://sunflower-land.com/play/?farmId=${farmId}\\', \\'_blank\\'); event.stopPropagation();">#${farmId} <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-left:2px; opacity:0.7;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></div>';

    if (code.includes(oldStr)) {
        code = code.replace(oldStr, newStr);
        fs.writeFileSync('js/ui.js', code);
        console.log('Successfully updated the ID pill to open the island link directly.');
    } else {
        console.log('Could not find the old string.');
    }
}

main();
