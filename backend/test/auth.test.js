import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { dirname } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const port = 5600 + Math.floor(Math.random() * 1000);
const url = `http://127.0.0.1:${port}`;
const __dirname = dirname(fileURLToPath(import.meta.url));
let server;

async function waitForServer() {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) return;
    } catch {
      // Waiting for port binding
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('Server did not start within 8 seconds');
}

test.before(async () => {
  server = spawn(process.execPath, ['server.js'], {
    cwd: __dirname + '/..',
    env: {
      ...process.env,
      PORT: String(port),
      MONGO_URI: '',
      MONGODB_URI: '',
      JWT_SECRET: 'test_jwt_secret_123',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  await waitForServer();
});

test.after(() => {
  if (server) {
    server.kill();
  }
});

test('POST /api/auth/signup - creates new user and returns JWT token', async () => {
  const uniqueEmail = `test_${Date.now()}@example.com`;
  const res = await fetch(`${url}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Sarah Connor',
      email: uniqueEmail,
      password: 'StrongPassword123!',
    }),
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.token);
  assert.equal(data.user.name, 'Sarah Connor');
  assert.equal(data.user.email, uniqueEmail);
  assert.equal(data.user.password, undefined); // password must NOT be exposed
});

test('POST /api/auth/signup - rejects duplicate email', async () => {
  const duplicateEmail = `duplicate_${Date.now()}@example.com`;
  await fetch(`${url}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'User One',
      email: duplicateEmail,
      password: 'Password123!',
    }),
  });

  const res = await fetch(`${url}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'User Two',
      email: duplicateEmail,
      password: 'Password456!',
    }),
  });

  assert.equal(res.status, 409);
  const data = await res.json();
  assert.equal(data.success, false);
});

test('POST /api/auth/login - authenticates registered user', async () => {
  const email = `login_${Date.now()}@example.com`;
  const password = 'SecretPassword123!';

  await fetch(`${url}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Login Test',
      email,
      password,
    }),
  });

  // Valid credentials
  const res = await fetch(`${url}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.token);
  assert.equal(data.user.email, email);

  // Invalid password
  const failRes = await fetch(`${url}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'WrongPassword!' }),
  });

  assert.equal(failRes.status, 401);
});

test('GET /api/auth/me - returns user profile with valid Bearer token', async () => {
  const email = `me_${Date.now()}@example.com`;
  const signupRes = await fetch(`${url}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Profile User',
      email,
      password: 'Password123!',
    }),
  });

  const { token } = await signupRes.json();

  const meRes = await fetch(`${url}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.equal(meRes.status, 200);
  const data = await meRes.json();
  assert.equal(data.success, true);
  assert.equal(data.user.name, 'Profile User');
  assert.equal(data.user.email, email);
});
