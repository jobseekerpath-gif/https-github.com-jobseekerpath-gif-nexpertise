import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import passport from "passport";
import router from "./routes";
import { logger } from "./lib/logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawDbUrl = process.env["DATABASE_URL"];
const isPgUrl = Boolean(
  rawDbUrl &&
    (rawDbUrl.startsWith("postgres://") || rawDbUrl.startsWith("postgresql://"))
);

const PgSession = connectPgSimple(session);

const app: Express = express();

// Behind Replit's proxy — trust X-Forwarded-* so req.ip is the real client IP
// (used for admin visibility) and secure cookies work correctly in production.
app.set("trust proxy", true);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(cors({ origin: true, credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", 1);

const sessionStore = isPgUrl
  ? new PgSession({
      conString: rawDbUrl,
      createTableIfMissing: true,
      tableName: "user_sessions",
    })
  : undefined;

app.use(
  session({
    store: sessionStore,
    secret: process.env["SESSION_SECRET"] ?? "edubharat-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env["NODE_ENV"] === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Synchronize req.session.userId, Passport req.user, and req.session.passport
app.use((req, _res, next) => {
  if (req.session) {
    const passportUserId = (req.session as any).passport?.user;
    const reqUserId = (req.user as any)?.id;
    const effectiveUserId = req.session.userId || reqUserId || passportUserId;

    if (effectiveUserId) {
      req.session.userId = effectiveUserId;
      if (!(req.session as any).passport) {
        (req.session as any).passport = { user: effectiveUserId };
      }
    }
  }
  next();
});

app.use("/api", router);

// Serve EduBharat React frontend (Vite dev middleware in development, static files in production)
const possibleEdubharatPaths = [
  path.resolve(__dirname, "../../edubharat"),
  path.resolve(process.cwd(), "artifacts/edubharat"),
  path.resolve(process.cwd(), "edubharat"),
];
const edubharatPath = possibleEdubharatPaths.find((p) => fs.existsSync(p)) || possibleEdubharatPaths[0];

let viteDevServer: any = null;

if (process.env["NODE_ENV"] !== "production") {
  try {
    const { createServer: createViteServer } = await import("vite");
    viteDevServer = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "custom",
      configFile: path.join(edubharatPath, "vite.config.ts"),
      root: edubharatPath,
    });
    app.use(viteDevServer.middlewares);
  } catch (err) {
    logger.warn({ err }, "Could not start Vite dev middleware — fallback to static if available");
  }
}

const possibleDistPaths = [
  path.resolve(edubharatPath, "dist/public"),
  path.resolve(process.cwd(), "artifacts/edubharat/dist/public"),
  path.resolve(process.cwd(), "artifacts/edubharat/dist"),
  path.resolve(process.cwd(), "dist/public"),
  path.resolve(process.cwd(), "dist"),
];
const distPath = possibleDistPaths.find((p) => fs.existsSync(path.join(p, "index.html"))) || possibleDistPaths[0];

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

app.use(async (req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return next();
  }
  if (req.originalUrl.startsWith("/api")) {
    return next();
  }

  if (path.extname(req.path) !== "") {
    return next();
  }

  if (viteDevServer) {
    try {
      const url = req.originalUrl;
      const indexPath = path.resolve(edubharatPath, "index.html");
      if (fs.existsSync(indexPath)) {
        let template = fs.readFileSync(indexPath, "utf-8");
        template = await viteDevServer.transformIndexHtml(url, template);
        return res.status(200).set({ "Content-Type": "text/html" }).send(template);
      }
    } catch (e) {
      if (viteDevServer?.ssrFixStacktrace) {
        viteDevServer.ssrFixStacktrace(e as Error);
      }
      return next(e);
    }
  }

  const distIndexPath = path.join(distPath, "index.html");
  if (fs.existsSync(distIndexPath)) {
    return res.sendFile(distIndexPath);
  }

  const rootIndexPath = path.join(edubharatPath, "index.html");
  if (fs.existsSync(rootIndexPath)) {
    return res.sendFile(rootIndexPath);
  }

  next();
});

export default app;
