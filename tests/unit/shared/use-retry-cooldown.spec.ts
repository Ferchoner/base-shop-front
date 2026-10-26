import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope } from 'vue';
import { ApiProblem } from '~/shared/api/problem';
import { useRetryCooldown } from '~/shared/ui/use-retry-cooldown';

describe('useRetryCooldown (REQUIREMENTS §4.1)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('espera lo que dice Retry-After y luego libera', () => {
    const scope = effectScope();
    const cooldown = scope.run(() => useRetryCooldown())!;
    cooldown.track(
      new ApiProblem({
        type: 'rate-limit-exceeded',
        status: 429,
        title: '',
        retryAfter: 3,
      }),
    );
    expect(cooldown.waiting.value).toBe(true);
    expect(cooldown.remaining.value).toBe(3);
    vi.advanceTimersByTime(3000);
    expect(cooldown.waiting.value).toBe(false);
    scope.stop();
  });

  it('ignora los demás errores', () => {
    const scope = effectScope();
    const cooldown = scope.run(() => useRetryCooldown())!;
    cooldown.track(
      new ApiProblem({ type: 'not-found', status: 404, title: '' }),
    );
    cooldown.track(new Error('otro'));
    expect(cooldown.waiting.value).toBe(false);
    scope.stop();
  });
});
