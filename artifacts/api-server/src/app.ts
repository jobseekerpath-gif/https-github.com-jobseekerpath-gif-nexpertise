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
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api", router);

// Serve EduBharat React frontend (Vite dev middleware in development, static files in production)
const possibleEdubharatPaths = [
  path.resolve(__dirname, "../../edubharat"),
  path.resolve(process.cwd(), "artifacts/edubharat"),
  path.resolve(process.cwd(), "edubharat"),
];
const edubharatPath = possibleEdubharatPaths.find((p) => fs.existsSync(p)) || possibleEdubharatPaths[0];

if (process.env["NODE_ENV"] !== "production") {
  try {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
      configFile: path.join(edubharatPath, "vite.config.ts"),
      root: edubharatPath,
    });
    app.use(vite.middlewares);

    app.use("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) return next();
      // If request has extension like .js, .css, .svg, .png etc., let vite.middlewares handle it or pass 404
      if (path.extname(req.path) !== "") {
        return next();
      }
      try {
        const url = req.originalUrl;
        const indexPath = path.resolve(edubharatPath, "index.html");
        if (!fs.existsSync(indexPath)) {
          return next();
        }
        let template = fs.readFileSync(indexPath, "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } catch (err) {
    logger.warn({ err }, "Could not start Vite dev middleware — fallback to static if available");
  }
} else {
  const possibleDistPaths = [
    path.resolve(edubharatPath, "dist/public"),
    path.resolve(process.cwd(), "artifacts/edubharat/dist/public"),
    path.resolve(process.cwd(), "artifacts/edubharat/dist"),
    path.resolve(process.cwd(), "dist/public"),
    path.resolve(process.cwd(), "dist"),
  ];
  const distPath = possibleDistPaths.find((p) => fs.existsSync(p)) || possibleDistPaths[0];

  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath, (err) => {
        if (err) next(err);
      });
    } else {
      next();
    }
  });
}

export default app;
