const { execSync } = require('child_process');

try {
  console.log('📌 Executando Commit e Push da melhoria visual da borda verde do card...');
  execSync('git add Fibbo_Sniper_v28.5_H2.mq5', { cwd: 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper' });
  execSync('git commit -m "UI IMPROVEMENT: Borda do card de Falso Rompimento agora fica Verde Neon quando 100% OK (PRONTO)"', { cwd: 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper' });
  execSync('git push origin main', { cwd: 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper' });
  console.log('✅ GIT PUSH CONCLUÍDO COM SUCESSO!');
} catch (e) {
  console.log('Git output:', e.stdout ? e.stdout.toString() : e.message);
}
