/**
 * Reads a JSON body without assuming there is one.
 *
 * These endpoints live on the Express server that wraps Next. When Express has not picked up
 * a route — most often because server.ts changed and the dev server was not restarted, since
 * tsx does not reload it — the request falls through to Next, which answers with an HTML 404
 * page. Calling response.json() on that throws `Unexpected token '<', "<!DOCTYPE "...`, which
 * tells the person staring at it nothing at all.
 */
export async function readJson<T>(response: Response): Promise<T> {
  const body = await response.text();
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error(
      response.status === 404
        ? 'خدمة استرداد كلمة المرور غير متاحة حالياً. يرجى المحاولة لاحقاً أو التواصل مع الدعم.'
        : 'استجابة غير متوقعة من الخادم. يرجى المحاولة لاحقاً.',
    );
  }
}

export async function readError(response: Response, fallback: string) {
  try {
    const payload = await readJson<{ error?: string }>(response);
    return payload.error || fallback;
  } catch (error) {
    // A non-JSON body already carries the clearer explanation from readJson; a JSON body
    // without an `error` key falls back to the caller's message.
    return error instanceof Error ? error.message : fallback;
  }
}

