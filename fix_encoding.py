import sys
import re

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'const promptHtml = `.*?`;', re.DOTALL)
replacement = '''const promptHtml = `
          <div style="text-align:center; padding: 10px;">
            <div style="font-size:40px; margin-bottom:12px;">🔔</div>
            <p style="color:var(--text-secondary); margin-bottom: 20px;">Ative as notificações para ser avisado quando suas Plantações, Animais e Recursos estiverem prontos! Nunca mais perca tempo de jogo.</p>
            <div style="display:flex; flex-direction:column; gap:10px;">
              <button id="btn-activate-push" class="btn btn-primary" style="background:var(--emerald);color:#000;font-weight:bold;padding:12px;border-radius:12px;border:none;cursor:pointer;">Ativar Notificações 24/7</button>
              <button id="btn-skip-push" class="btn btn-secondary" style="background:rgba(255,255,255,0.1);color:var(--text-tertiary);padding:12px;border-radius:12px;border:none;cursor:pointer;">Agora Não</button>
            </div>
          </div>
        `;'''

content = pattern.sub(replacement, content)
content = content.replace("'Notificaes 24/7'", "'Notificações 24/7'")
content = content.replace("'Notificaes 24/7'", "'Notificações 24/7'")

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)
