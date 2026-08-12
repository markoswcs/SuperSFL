const fs = require('fs');

let content = fs.readFileSync('js/app.js', 'utf8');

const regex = /const promptHtml = `[\s\S]*?`;/m;
const replacement = `const promptHtml = \`
          <div style="text-align:center; padding: 10px;">
            <div style="font-size:40px; margin-bottom:12px;">🔔</div>
            <p style="color:var(--text-secondary); margin-bottom: 20px;">Ative as notificações para ser avisado quando suas Plantações, Animais e Recursos estiverem prontos! Nunca mais perca tempo de jogo.</p>
            <div style="display:flex; flex-direction:column; gap:10px;">
              <button id="btn-activate-push" class="btn btn-primary" style="background:var(--emerald);color:#000;font-weight:bold;padding:12px;border-radius:12px;border:none;cursor:pointer;">Ativar Notificações 24/7</button>
              <button id="btn-skip-push" class="btn btn-secondary" style="background:rgba(255,255,255,0.1);color:var(--text-tertiary);padding:12px;border-radius:12px;border:none;cursor:pointer;">Agora Não</button>
            </div>
          </div>
        \`;`;

content = content.replace(regex, replacement);
// Fix the other strings that got mangled if they did
content = content.replace(/'Notifica[^\']*?es 24\/7'/g, "'Notificações 24/7'");

fs.writeFileSync('js/app.js', content, 'utf8');
console.log('Done!');
