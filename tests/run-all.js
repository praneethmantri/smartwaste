import { spawn } from 'child_process';
import http from 'http';

const checkHealth = () => {
  return new Promise((resolve) => {
    http.get('http://localhost:5000/api/health', (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
};

const main = async () => {
  let serverProcess = null;
  const isHealthy = await checkHealth();

  if (!isHealthy) {
    console.log('Starting backend test server on port 5000...');
    serverProcess = spawn('node', ['backend/src/server.js'], {
      stdio: 'inherit',
      env: { ...process.env, PORT: '5000', NODE_ENV: 'test' },
    });

    let ready = false;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (await checkHealth()) {
        ready = true;
        break;
      }
    }

    if (!ready) {
      console.error('Failed to start test server within 15 seconds.');
      if (serverProcess) serverProcess.kill();
      process.exit(1);
    }
    console.log('Backend test server is ready.\n');
  } else {
    console.log('Backend server is already running on port 5000.\n');
  }

  console.log('Running test suites: tests/escalation.test.js tests/api.test.js tests/comprehensive.test.js\n');

  const testProcess = spawn(
    'node',
    ['--test', 'tests/escalation.test.js', 'tests/api.test.js', 'tests/comprehensive.test.js'],
    { stdio: 'inherit' }
  );

  testProcess.on('exit', (code) => {
    if (serverProcess) {
      console.log('\nStopping backend test server...');
      serverProcess.kill();
    }
    process.exit(code);
  });
};

main();
