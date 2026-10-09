import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';

const pg = new EmbeddedPostgres({
  databaseDir: path.resolve('./.pgdata'),
  port: 5432,
  user: 'postgres',
  password: 'Cse@123',
  persistent: true,
  initdbFlags: ['-E', 'UTF8', '--locale=C'],
});

async function run() {
  try {
    console.log('Starting embedded PostgreSQL on port 5432...');
    await pg.start();
    console.log('Ensuring smartwaste_db database exists...');
    try {
      await pg.createDatabase('smartwaste_db');
      console.log('Created smartwaste_db database.');
    } catch (e) {
      console.log('smartwaste_db is ready.');
    }
    console.log('✓ PostgreSQL server is fully operational and accepting connections.');
    
    // Keep alive
    setInterval(() => {}, 1000 * 60 * 60);
  } catch (error) {
    console.error('PostgreSQL daemon error:', error);
    process.exit(1);
  }
}

run();
