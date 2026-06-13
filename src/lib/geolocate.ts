// OwnState — accurate browser geolocation (Brick 12).
//
// A single getCurrentPosition() call often returns a coarse, network/IP-based
// fix (especially on laptops) before the GPS has refined — which is why the
// located point can land far from where the user actually is. This helper uses
// watchPosition() to keep reading for a few seconds and resolves with the most
// accurate fix it sees (or as soon as it beats a target accuracy).

export interface AccuratePositionOptions {
  /** Resolve early once a fix at least this accurate (metres) arrives. */
  desiredAccuracy?: number;
  /** Give up waiting after this long (ms) and return the best fix so far. */
  maxWait?: number;
}

export function getAccuratePosition(
  opts: AccuratePositionOptions = {}
): Promise<GeolocationPosition> {
  const desiredAccuracy = opts.desiredAccuracy ?? 30;
  const maxWait = opts.maxWait ?? 12000;

  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not available in this browser."));
      return;
    }

    let best: GeolocationPosition | null = null;
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      navigator.geolocation.clearWatch(watchId);
      fn();
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!best || pos.coords.accuracy < best.coords.accuracy) best = pos;
        // Good enough — stop early.
        if (pos.coords.accuracy <= desiredAccuracy) finish(() => resolve(pos));
      },
      (err) => finish(() => reject(err)),
      { enableHighAccuracy: true, timeout: maxWait, maximumAge: 0 }
    );

    // Time budget elapsed: hand back the best fix we managed to get.
    const timer = setTimeout(() => {
      finish(() => (best ? resolve(best) : reject(new Error("Location timed out."))));
    }, maxWait);
  });
}
