import Table from "cli-table3";
import pc from "picocolors";

export type UiIcons = {
  ok: string;
  err: string;
  warn: string;
  arrow: string;
  info: string;
};

export type Ui = {
  readonly useColor: boolean;
  readonly icons: UiIcons;
  title(text: string): void;
  section(text: string): void;
  rule(): void;
  dim(text: string): string;
  success(text: string): void;
  error(text: string): void;
  warn(text: string): void;
  info(text: string): void;
  line(text?: string): void;
  table(headers: string[], rows: string[][]): string;
  printTable(headers: string[], rows: string[][]): void;
  keyValue(rows: { key: string; value: string }[]): void;
};

export type UiOptions = {
  /** When false, use ASCII fallbacks and no ANSI colors. */
  useColor: boolean;
  /** When false, prefer ASCII icon glyphs. */
  useUnicode: boolean;
};

function resolveIcons(useUnicode: boolean): UiIcons {
  if (useUnicode) {
    return {
      ok: "✓",
      err: "✖",
      warn: "⚠",
      arrow: "→",
      info: "ℹ",
    };
  }
  return {
    ok: "[ok]",
    err: "[x]",
    warn: "[!]",
    arrow: ">",
    info: "[i]",
  };
}

export function shouldUseColor(opts: {
  forceColor?: boolean;
  noColor?: boolean;
  isTTY: boolean | undefined;
}): boolean {
  if (opts.noColor || process.env.NO_COLOR) return false;
  if (opts.forceColor || process.env.FORCE_COLOR) return true;
  return opts.isTTY ?? false;
}

export function shouldUseUnicode(isTTY: boolean | undefined): boolean {
  return Boolean(isTTY) && process.env.CURSOR_KIT_ASCII_ICONS !== "1";
}

export function createUi(options: UiOptions): Ui {
  const { useColor, useUnicode } = options;
  const icons = resolveIcons(useUnicode);

  const c = {
    dim: (s: string) => (useColor ? pc.dim(s) : s),
    green: (s: string) => (useColor ? pc.green(s) : s),
    red: (s: string) => (useColor ? pc.red(s) : s),
    yellow: (s: string) => (useColor ? pc.yellow(s) : s),
    cyan: (s: string) => (useColor ? pc.cyan(s) : s),
    bold: (s: string) => (useColor ? pc.bold(s) : s),
  };

  const ruleChar = useUnicode && useColor ? "─" : "-";
  const ruleWidth = 56;

  return {
    useColor,
    icons,
    title(text: string) {
      const line = ruleChar.repeat(ruleWidth);
      console.log(c.dim(line));
      console.log(c.bold(c.cyan(text)));
      console.log(c.dim(line));
    },
    section(text: string) {
      console.log("");
      console.log(c.bold(text));
      console.log(c.dim(ruleChar.repeat(Math.min(ruleWidth, text.length + 8))));
    },
    rule() {
      console.log(c.dim(ruleChar.repeat(ruleWidth)));
    },
    dim: (text: string) => c.dim(text),
    success(text: string) {
      console.log(`${c.green(icons.ok)} ${text}`);
    },
    error(text: string) {
      console.log(`${c.red(icons.err)} ${text}`);
    },
    warn(text: string) {
      console.log(`${c.yellow(icons.warn)} ${text}`);
    },
    info(text: string) {
      console.log(`${c.cyan(icons.info)} ${text}`);
    },
    line(text = "") {
      console.log(text);
    },
    table(headers: string[], rows: string[][]): string {
      const t = new Table({
        head: useColor ? headers.map((h) => pc.bold(h)) : headers,
        style: useColor
          ? { head: [], border: [] }
          : { head: [], border: ["gray", "gray"] },
        wordWrap: true,
      });
      for (const row of rows) t.push(row);
      return t.toString();
    },
    printTable(headers: string[], rows: string[][]): void {
      console.log(this.table(headers, rows));
    },
    keyValue(rows: { key: string; value: string }[]) {
      const keyW = Math.max(12, ...rows.map((r) => r.key.length));
      for (const { key, value } of rows) {
        const k = `${key}:`.padEnd(keyW + 1);
        console.log(`${c.dim(k)} ${value}`);
      }
    },
  };
}
