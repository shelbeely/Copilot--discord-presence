import { startBotDaemon } from "./bot-daemon.js"
import { startDaemon } from "./daemon.js"
import { runInit } from "./init.js"

export { startBotDaemon } from "./bot-daemon.js"
export { startDaemon } from "./daemon.js"
export { runInit } from "./init.js"
export default startDaemon

if (import.meta.main) {
  const args = process.argv.slice(2)
  if (args.includes("init")) {
    runInit().catch((err) => {
      console.error("[copilot-presence] Fatal error:", err)
      process.exit(1)
    })
  } else if (args.includes("--bot") || process.env.COPILOT_BOT_MODE === "true") {
    startBotDaemon().catch((err) => {
      console.error("[copilot-presence] Fatal error:", err)
      process.exit(1)
    })
  } else {
    startDaemon().catch((err) => {
      console.error("[copilot-presence] Fatal error:", err)
      process.exit(1)
    })
  }
}
