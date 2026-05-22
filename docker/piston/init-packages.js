/**
 * Piston auto-install script.
 * Runs AFTER the Piston API is listening, installs required language
 * runtimes if they are not already present, then exits.
 *
 * Called from entrypoint.sh as a one-shot init task.
 */
const http = require('http');

const PISTON_HOST = 'localhost';
const PISTON_PORT = 2000;

// ── Languages to install ────────────────────────────────────────────
const REQUIRED_PACKAGES = [
  { language: 'gcc', version: '10.2.0' },     // provides c, c++, d, fortran
  { language: 'python', version: '3.10.0' },
  { language: 'java', version: '15.0.2' },
];

// ── Helpers ─────────────────────────────────────────────────────────

function httpGet(path) {
  return new Promise((resolve, reject) => {
    http
      .get(`http://${PISTON_HOST}:${PISTON_PORT}${path}`, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(`Bad JSON from GET ${path}: ${data}`));
          }
        });
      })
      .on('error', reject);
  });
}

function httpPost(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(
      {
        hostname: PISTON_HOST,
        port: PISTON_PORT,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(data));
      },
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForApi(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await httpGet('/api/v2/runtimes');
      return;
    } catch {
      process.stdout.write('.');
      await sleep(1000);
    }
  }
  throw new Error('Piston API did not become ready in time');
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log('[init-packages] Waiting for Piston API...');
  await waitForApi();
  console.log('\n[init-packages] Piston API is ready.');

  // Fetch currently installed runtimes
  const runtimes = await httpGet('/api/v2/runtimes');
  const installed = new Set(runtimes.map((r) => `${r.language}@${r.version}`));

  for (const pkg of REQUIRED_PACKAGES) {
    // gcc package provides multiple runtimes (c, c++, d, fortran)
    // Check if the main language is already available
    const checkKey =
      pkg.language === 'gcc'
        ? `c++@${pkg.version}`
        : `${pkg.language}@${pkg.version}`;

    if (installed.has(checkKey)) {
      console.log(`[init-packages] ✅ ${pkg.language}@${pkg.version} already installed`);
      continue;
    }

    console.log(`[init-packages] 📦 Installing ${pkg.language}@${pkg.version} ...`);
    try {
      await httpPost('/api/v2/packages', pkg);
      console.log(`[init-packages] ✅ ${pkg.language}@${pkg.version} installed`);
    } catch (err) {
      console.error(`[init-packages] ❌ Failed to install ${pkg.language}@${pkg.version}:`, err.message);
    }
  }

  console.log('[init-packages] All packages ready.');
}

main().catch((err) => {
  console.error('[init-packages] Fatal:', err.message);
  process.exit(1);
});
