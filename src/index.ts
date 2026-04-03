import { startDaemon } from "./daemon.js"

export { startDaemon } from "./daemon.js"
export default startDaemon

if (import.meta.main) {
  startDaemon().catch((err) => {
    console.error("[copilot-presence] Fatal error:", err)
    process.exit(1)
  })
}
