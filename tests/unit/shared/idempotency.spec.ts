import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createIdempotencyKeys,
  retryWhileInProgress,
} from '~/shared/api/idempotency';
import { ApiProblem } from '~/shared/api/problem';

const inProgress = () =>
  new ApiProblem({
    type: 'idempotency-request-in-progress',
    status: 409,
    title: '',
    retryAfter: 2,
  });

describe('llaves de idempotencia (REQUIREMENTS §4.4)', () => {
  afterEach(() => vi.useRealTimers());

  it('repite la llave mientras el cuerpo no cambia y la cambia con él', () => {
    const keyFor = createIdempotencyKeys();
    const first = keyFor({ expectedTotal: 74800 });
    expect(keyFor({ expectedTotal: 74800 })).toBe(first);
    const second = keyFor({ expectedTotal: 75800 });
    expect(second).not.toBe(first);
    // Volver al cuerpo anterior es otro intento.
    expect(keyFor({ expectedTotal: 74800 })).not.toBe(first);
  });

  it('reintenta tras Retry-After mientras la petición sigue en curso', async () => {
    vi.useFakeTimers();
    const call = vi
      .fn()
      .mockRejectedValueOnce(inProgress())
      .mockResolvedValueOnce('orden');
    const result = retryWhileInProgress(call);
    await vi.advanceTimersByTimeAsync(1999);
    expect(call).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toBe('orden');
    expect(call).toHaveBeenCalledTimes(2);
  });

  it('no reintenta otros errores y se rinde tras el límite', async () => {
    const other = new ApiProblem({
      type: 'total-mismatch',
      status: 409,
      title: '',
    });
    await expect(
      retryWhileInProgress(vi.fn().mockRejectedValue(other)),
    ).rejects.toBe(other);

    vi.useFakeTimers();
    const call = vi.fn().mockRejectedValue(inProgress());
    const result = retryWhileInProgress(call, 3);
    const settled = expect(result).rejects.toMatchObject({
      type: 'idempotency-request-in-progress',
    });
    await vi.advanceTimersByTimeAsync(4000);
    await settled;
    expect(call).toHaveBeenCalledTimes(3);
  });
});
