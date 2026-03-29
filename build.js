// Hugo's cleanDestinationDir deletes public/.git (the submodule link file)
// because its internal skip-logic only handles .git directories, not files.
// This script saves and restores the file around the build.

const fs = require('fs');
const { execSync } = require('child_process');

const gitFile = 'public/.git';
const backup = fs.existsSync(gitFile) ? fs.readFileSync(gitFile) : null;

try {
  execSync('hugo', { stdio: 'inherit' });
} finally {
  if (backup) fs.writeFileSync(gitFile, backup);
}
