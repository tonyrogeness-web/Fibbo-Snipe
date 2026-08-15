const { execSync } = require('child_process');

try {
  console.log('📌 Executando Commit e Push da Sincronização 100% Blue Guardian Watermark HUD...');
  execSync('git add Fibbo_Sniper_v28.5_H2.mq5', { cwd: 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper' });
  execSync('git commit -m "BLUE GUARDIAN HUD: Sincronização 100% com o High Watermark e Peak Drawdown do Dashboard (#506138)"', { cwd: 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper' });
  execSync('git push origin main', { cwd: 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper' });
  console.log('✅ GIT PUSH CONCLUÍDO COM SUCESSO!');
} catch (e) {
  console.log('Git output:', e.stdout ? e.stdout.toString() : e.message);
}
