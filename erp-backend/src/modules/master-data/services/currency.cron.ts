import cron from "node-cron";
import { updateDailyRates } from "./currencyExchange.service";

cron.schedule("0 0 * * *", async () => {
  try {
    console.log("⏰ Running daily exchange rate update...");
    await updateDailyRates();
  } catch (err) {
    console.error("❌ Exchange rate update failed:", err);
  }
});
