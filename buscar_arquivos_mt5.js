const fs = require('fs');
const path = require('path');

function searchFiles(dir, filter) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          if (!fullPath.includes('node_modules') && !fullPath.includes('.git')) {
            results = results.concat(searchFiles(fullPath, filter));
          }
        } else {
          if (filter(file)) {
            results.push({ path: fullPath, mtime: stat.mtime, size: stat.size });
          }
        }
      } catch(e) {}
    });
  } catch(e) {}
  return results;
}

const baseDir = "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal";
const found = searchFiles(baseDir, name => name.toLowerCase().includes('fibbo_sniper'));

console.log('=== TODOS OS ARQUIVOS FIBBO_SNIPER NO MT5 ===\n');
found.forEach(f => {
  console.log(`${f.path} | MTime: ${f.mtime.toISOString()} | Size: ${f.size}`);
});
