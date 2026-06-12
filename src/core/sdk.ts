// CrazyGames SDK integration (guarded — the SDK may be absent in local/dev).

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    CrazyGames?: any;
    webkitAudioContext?: typeof AudioContext;
  }
}

const SDK: any = window.CrazyGames && window.CrazyGames.SDK ? window.CrazyGames.SDK : null;

export let sdkReady = false;

void (async function () {
  try {
    if (SDK && SDK.init) {
      await SDK.init();
      sdkReady = true;
    }
  } catch (e) {
    sdkReady = false;
  }
})();

export function sdkLoadingStart(): void {
  try {
    SDK && SDK.game && SDK.game.loadingStart && SDK.game.loadingStart();
  } catch (e) {
    /* ignore */
  }
}

export function sdkLoadingStop(): void {
  try {
    SDK && SDK.game && SDK.game.loadingStop && SDK.game.loadingStop();
  } catch (e) {
    /* ignore */
  }
}

export function sdkStart(): void {
  try {
    SDK && SDK.game && SDK.game.gameplayStart && SDK.game.gameplayStart();
  } catch (e) {
    /* ignore */
  }
}

export function sdkStop(): void {
  try {
    SDK && SDK.game && SDK.game.gameplayStop && SDK.game.gameplayStop();
  } catch (e) {
    /* ignore */
  }
}

export function sdkHappy(): void {
  try {
    SDK && SDK.game && SDK.game.happytime && SDK.game.happytime();
  } catch (e) {
    /* ignore */
  }
}

export function sdkRewarded(cb: (ok: boolean) => void): void {
  try {
    if (SDK && SDK.ad && SDK.ad.requestAd) {
      SDK.ad.requestAd("rewarded", {
        adFinished: function () {
          cb(true);
        },
        adError: function () {
          cb(false);
        },
        adStarted: function () {},
      });
    } else cb(false);
  } catch (e) {
    cb(false);
  }
}

// Midgame ads at natural breaks (run end → retry/menu), rate-limited.
let lastMidgame = 0;

export function sdkMidgame(done: () => void, runSeconds: number): void {
  const now = Date.now();
  if (!sdkReady || runSeconds < 90 || now - lastMidgame < 180000) {
    done();
    return;
  }
  try {
    if (SDK && SDK.ad && SDK.ad.requestAd) {
      lastMidgame = now;
      SDK.ad.requestAd("midgame", {
        adFinished: done,
        adError: done,
        adStarted: function () {},
      });
    } else done();
  } catch (e) {
    done();
  }
}
