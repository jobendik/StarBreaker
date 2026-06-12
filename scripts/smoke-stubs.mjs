// Minimal DOM/browser stubs so the game simulation can run headless in Node.
// Imported FIRST by smoke-entry.ts (import order guarantees globals exist
// before any game module evaluates).

const gradient = { addColorStop() {} };

const ctxStub = new Proxy(
  {},
  {
    get(_t, p) {
      if (p === "measureText") return () => ({ width: 0 });
      if (p === "createLinearGradient" || p === "createRadialGradient") return () => gradient;
      return () => undefined;
    },
    set() {
      return true;
    },
  },
);

function makeEl(tag = "div") {
  return {
    tag,
    children: [],
    style: {},
    dataset: {},
    classList: {
      _s: new Set(),
      add(...c) {
        c.forEach((x) => this._s.add(x));
      },
      remove(...c) {
        c.forEach((x) => this._s.delete(x));
      },
      toggle(c, f) {
        f ? this._s.add(c) : this._s.delete(c);
      },
      contains(c) {
        return this._s.has(c);
      },
    },
    addEventListener() {},
    removeEventListener() {},
    appendChild(c) {
      this.children.push(c);
      return c;
    },
    removeChild(c) {
      const i = this.children.indexOf(c);
      if (i >= 0) this.children.splice(i, 1);
    },
    remove() {},
    setAttribute() {},
    getContext() {
      return ctxStub;
    },
    offsetHeight: 0,
    width: 0,
    height: 0,
    textContent: "",
    innerHTML: "",
  };
}

const els = new Map();
globalThis.document = {
  getElementById(id) {
    if (!els.has(id)) els.set(id, makeEl());
    return els.get(id);
  },
  createElement(tag) {
    return makeEl(tag);
  },
  querySelectorAll() {
    return [];
  },
  body: makeEl("body"),
  addEventListener() {},
  hidden: false,
};

globalThis.window = globalThis;
globalThis.innerWidth = 1280;
globalThis.innerHeight = 720;
globalThis.devicePixelRatio = 1;
globalThis.addEventListener = () => {};
globalThis.matchMedia = () => ({ matches: false });
globalThis.localStorage = {
  _m: {},
  getItem(k) {
    return this._m[k] ?? null;
  },
  setItem(k, v) {
    this._m[k] = String(v);
  },
  removeItem(k) {
    delete this._m[k];
  },
};
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16);
