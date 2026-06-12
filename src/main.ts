// Application entry point: boot the game.

import "./styles/main.css";
import { loadMeta } from "./core/storage";
import { showMenu, initOverlays } from "./ui/overlays";
import { initInput } from "./input/input";
import { frame } from "./game";

initOverlays();
initInput();
loadMeta();
showMenu();
requestAnimationFrame(frame);
