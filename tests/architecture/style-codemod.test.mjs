import assert from 'node:assert/strict';
import { transformTsxStyles } from '../../scripts/migrate-tsx-styles.mjs';

const source = `
import { cn } from '@/lib/utils';

export function Example({ active, side }) {
  return (
    <main className="flex min-h-screen">
      <div className={cn('rounded-xl border', active && 'border-emerald-400')} />
      <button className={\`fixed top-4 \${side === 'left' ? 'left-4' : 'right-4'}\`} />
    </main>
  );
}
`;

const output = transformTsxStyles(source, 'example.tsx');

assert.match(output, /const styles = \{/);
assert.doesNotMatch(output, /className="/);
assert.doesNotMatch(output, /className=\{`/);
assert.match(output, /className=\{styles\./);
assert.match(output, /cn\(styles\./);
assert.match(output, /side === 'left' \? styles\./);
assert.match(output, /flex min-h-screen/);

console.log('style codemod checks passed');
