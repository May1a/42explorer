import index from "./index.html";

// Minimal static-file server — all logic lives in the React frontend.
Bun.serve({
  routes: { "/*": index },
  development: process.env.NODE_ENV !== "production" && { hmr: true, console: true },
});

console.log("🚀  42 Explorer  →  http://localhost:3000");
