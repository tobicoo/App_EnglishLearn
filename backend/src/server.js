require("dotenv").config();

const app = require("./app");
const { getHeartRefillIntervalSeconds } = require("./services/settingsService");

const port = Number(process.env.PORT) || 3000;

async function startServer() {
  await getHeartRefillIntervalSeconds();
  app.listen(port, "0.0.0.0", () => {
    console.log(`Express API listening on http://localhost:${port}`);
  });
}

startServer();
