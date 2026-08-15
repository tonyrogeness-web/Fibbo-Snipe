const { execSync } = require('child_process');

try {
  console.log('📌 Executando auditoria de compilação e Commit do Git...');
  const status = execSync('git status', { cwd: 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper' }).toString();
  console.log(status);
  execSync('git add Fibbo_Sniper_v28.5_H2.mq5', { cwd: 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper' });
  execSync('git commit -m "AUDIT FIX: Sincronização Perfeita da Zona Magnética da Fibo com HUD (MathAbs)"', { cwd: 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper' });
  execSync('git push origin main', { cwd: 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper' });
  console.log('✅ GIT PUSH CONCLUÍDO COM SUCESSO!');
} catch (e) {
  console.log('Git output:', e.stdout ? e.stdout.toString() : e.message);
}
