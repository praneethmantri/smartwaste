import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '.pgdata');
const binDir = path.resolve(__dirname, 'node_modules/@embedded-postgres/windows-x64/native/bin');

try {
  execSync(`"${binDir}/pg_ctl.exe" -D "${dataDir}" stop`, { stdio: 'inherit' });
  console.log('PostgreSQL server stopped successfully.');
} catch (err) {
  console.log('PostgreSQL was not running or has already stopped.');
}
