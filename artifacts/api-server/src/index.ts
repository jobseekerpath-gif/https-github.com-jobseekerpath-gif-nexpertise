import app from "./app";
import { logger } from "./lib/logger";
import { backfillSignupGrants } from "./lib/credits";

const port = Number(process.env["PORT"] || 3000);

const server = app.listen(port, "0.0.0.0", () => {
  logger.info({ port }, `Server listening on 0.0.0.0:${port}`);

  // Background init — must never crash or delay the server.
  void backfillSignupGrants().catch((err) => {
    logger.error({ err }, "backfillSignupGrants error");
  });
});

server.on("error", (err) => {
  logger.error({ err }, "Server listen error");
});

