# STARBREAKER — CrazyGames Submission Answers

Use these answers when filling in the CrazyGames developer portal submission form
(developer.crazygames.com → Add game → HTML5).

---

## Upload

- **Upload type:** Upload the **contents of this folder** (an HTML5 game folder).
  CrazyGames accepts a folder upload or a `.zip` of the folder — this folder is
  provided **unzipped** as requested. The platform reads `index.html` as the entry
  point and serves the rest of the files alongside it.
- **Entry point:** `index.html` (uses relative `./assets/...` paths, so it runs
  from any host path).
- **Initial download size:** ~5.3 MB  (limit: 50 MB) ✅
- **Total file count:** 24 game files + 4 markdown docs  (limit: 1500) ✅
- **SDK:** CrazyGames HTML5 **SDK v3** is loaded from
  `https://sdk.crazygames.com/crazygames-sdk-v3.js` and initialised on startup.

> The four `.md` files in this folder are documentation for you and are ignored by
> the platform. You may delete them before zipping if you prefer a clean upload.

---

## Does your game save progress?  *

**☑ Yes, using LocalStorage (refer to Automatic Progress Save)**

The game persists meta-progression (cores/currency, best score, unlocked ships,
weapons and skins, upgrades, daily-mission state, and audio/UI settings) to
`localStorage` under the key `starbreaker_meta_v2`. This is compatible with
CrazyGames **Automatic Progress Save**, which transparently syncs LocalStorage to
the logged-in CrazyGames user and across devices — no code change required.

- ❌ *No, the game does not need progress save* — incorrect, it does save.
- ❌ *Yes, using the Data Module from the CrazyGames SDK* — not used (we rely on
  LocalStorage + Automatic Progress Save instead).
- ❌ *Yes, linked to a game account on the game's backend* — there is no custom
  backend.

---

## Game options

| Option | Answer | Notes |
|---|:---:|---|
| **The game supports mobile devices** | ☑ **Yes** | Responsive canvas, mobile viewport meta, and a touch virtual-joystick (drag to move) with an on-screen ⚡ dash button. Plays in portrait or landscape. |
| **The game is an online multiplayer game** | ☐ **No** | Single-player only. No networking, no rooms, no other players. |
| **The game supports CrazyGames muting audio through SDK** | ☑ **Yes** | The game reads `SDK.game.settings.muteAudio` on init and registers `SDK.game.addSettingsChangeListener(...)`. When CrazyGames requests a mute, the master audio gain is set to 0 without overwriting the player's own mute preference. |

---

## Qualitative metadata

- **Game title:** STARBREAKER
- **Genre:** Arcade · Survival · Shoot-'em-up (bullet-heaven / survivor-like)
- **Short description & controls:** see `GAME-DESCRIPTION.md` and `CONTROLS.md`.
- **Lands directly in gameplay:** the main menu loads instantly; pressing
  **LAUNCH** drops straight into a run (no long pre-roll).
- **Orientation:** both portrait and landscape supported.

---

## SDK integration checklist (already implemented)

- ✅ `SDK.init()` on load
- ✅ `game.loadingStart()` / `game.loadingStop()` around asset loading
- ✅ `game.gameplayStart()` on run start / resume / revive; `game.gameplayStop()`
  on pause / death / menu
- ✅ `game.happytime()` on milestones (level-ups, evolutions, boss kills)
- ✅ Rewarded ads (`ad.requestAd("rewarded", …)`) for revives
- ✅ Midgame ads (`ad.requestAd("midgame", …)`) at natural breaks, rate-limited
- ✅ Audio muting via `game.settings.muteAudio` + `addSettingsChangeListener`
