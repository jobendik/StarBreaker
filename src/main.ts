// Application entry point: boot the game.

import "./styles/main.css";
import { loadMeta } from "./core/storage";
import { sdkLoadingStart, sdkLoadingStop } from "./core/sdk";
import { showMenu, initOverlays } from "./ui/overlays";
import { initInput } from "./input/input";
import { frame } from "./game";

sdkLoadingStart();
initOverlays();
initInput();
loadMeta();
showMenu();
sdkLoadingStop();
requestAnimationFrame(frame);
