export class API42Error extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`${status} – ${body}`);
    this.name = "API42Error";
    this.status = status;
    this.body = body;
  }

  get isInsufficientScope(): boolean {
    if (this.status !== 403) return false;
    try {
      const parsed = JSON.parse(this.body);
      return parsed.error === "Forbidden" || parsed.error === "insufficient_scope";
    } catch {
      return this.body.toLowerCase().includes("insufficient scope");
    }
  }

  get neededScopes(): string[] {
    try {
      const match = this.body.match(/the following scopes:\s*\[([^\]]+)\]/);
      if (match && match[1]) return match[1].split(",").map(s => s.trim());
    } catch {}
    const lower = this.body.toLowerCase();
    if (lower.includes("projects")) return ["projects"];
    if (lower.includes("forum")) return ["forum"];
    return [];
  }
}
