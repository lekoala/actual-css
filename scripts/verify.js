import { spawnSync } from 'node:child_process';

const isCi = process.argv.includes('--ci');
const steps = isCi
  ? ['check', 'check:css', 'test', 'build', 'test:visual']
  : ['check', 'check:css', 'test'];

for (const step of steps) {
  const result = spawnSync(`npm run ${step}`, {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: true,
    stdio: 'pipe'
  });

  if (result.status === 0) {
    continue;
  }

  console.error(`Verification failed at npm run ${step}`);

  if (result.stdout) {
    process.stderr.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  process.exit(result.status ?? 1);
}

console.log(isCi ? 'verify:ci passed' : 'verify passed');
