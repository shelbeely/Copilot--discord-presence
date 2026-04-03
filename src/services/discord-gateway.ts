import type { GatewayActivity, GatewayPayload } from "../types/index.js"

const GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json"
const RECONNECT_DELAY = 5000

// Gateway opcodes
const OP_DISPATCH = 0
const OP_HEARTBEAT = 1
const OP_IDENTIFY = 2
const OP_PRESENCE_UPDATE = 3
const OP_RECONNECT = 7
const OP_INVALID_SESSION = 9
const OP_HELLO = 10
const OP_HEARTBEAT_ACK = 11

export class DiscordGatewayService {
  private ws: WebSocket | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private lastSequence: number | null = null
  private connected = false
  private destroyed = false
  private currentActivity: GatewayActivity | null = null

  constructor(private token: string) {}

  connect(): void {
    if (this.destroyed) return

    try {
      this.ws = new WebSocket(GATEWAY_URL)
    } catch (err) {
      console.error("[discord-gateway] Failed to open WebSocket:", err)
      this.scheduleReconnect()
      return
    }

    this.ws.onopen = () => {
      console.log("[discord-gateway] WebSocket opened")
    }

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data as string) as GatewayPayload
        this.handlePayload(payload)
      } catch (err) {
        console.warn("[discord-gateway] Failed to parse payload:", err)
      }
    }

    this.ws.onclose = (event: CloseEvent) => {
      console.log(`[discord-gateway] WebSocket closed (code: ${event.code})`)
      this.connected = false
      this.clearHeartbeat()
      if (!this.destroyed) {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = () => {
      console.warn("[discord-gateway] WebSocket error")
    }
  }

  private handlePayload(payload: GatewayPayload): void {
    if (payload.s != null) {
      this.lastSequence = payload.s
    }

    switch (payload.op) {
      case OP_HELLO: {
        const data = payload.d as { heartbeat_interval: number }
        // Jitter the first heartbeat to avoid thundering herd
        const jitter = Math.random()
        setTimeout(
          () => {
            this.sendHeartbeat()
            this.startHeartbeat(data.heartbeat_interval)
          },
          Math.floor(jitter * data.heartbeat_interval),
        )
        this.identify()
        break
      }

      case OP_HEARTBEAT:
        this.sendHeartbeat()
        break

      case OP_HEARTBEAT_ACK:
        break

      case OP_DISPATCH:
        if (payload.t === "READY") {
          this.connected = true
          console.log("[discord-gateway] Connected to Discord Gateway — bot presence active")
          if (this.currentActivity) {
            this.sendPresenceUpdate(this.currentActivity)
          }
        }
        break

      case OP_RECONNECT:
        console.log("[discord-gateway] Server requested reconnect")
        this.closeAndReconnect()
        break

      case OP_INVALID_SESSION:
        console.warn("[discord-gateway] Invalid session — re-identifying in 5s")
        setTimeout(() => this.identify(), 5000)
        break

      default:
        break
    }
  }

  private startHeartbeat(interval: number): void {
    this.clearHeartbeat()
    this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), interval)
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private sendHeartbeat(): void {
    this.send({ op: OP_HEARTBEAT, d: this.lastSequence })
  }

  private identify(): void {
    this.send({
      op: OP_IDENTIFY,
      d: {
        token: this.token,
        intents: 0,
        properties: {
          os: "linux",
          browser: "copilot-discord-presence",
          device: "copilot-discord-presence",
        },
      },
    })
  }

  private send(payload: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload))
    }
  }

  /** Set the bot's current activity. Queues the update until connected. */
  setActivity(name: string): void {
    const activity: GatewayActivity = { name, type: 0 }
    this.currentActivity = activity
    if (this.connected) {
      this.sendPresenceUpdate(activity)
    }
  }

  /** Clear the bot's current activity. */
  clearActivity(): void {
    this.currentActivity = null
    this.send({
      op: OP_PRESENCE_UPDATE,
      d: { since: null, activities: [], status: "online", afk: false },
    })
  }

  private sendPresenceUpdate(activity: GatewayActivity): void {
    this.send({
      op: OP_PRESENCE_UPDATE,
      d: {
        since: null,
        activities: [activity],
        status: "online",
        afk: false,
      },
    })
  }

  /** Gracefully disconnect from the Gateway. */
  disconnect(): void {
    this.destroyed = true
    this.clearHeartbeat()
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.ws?.close()
    this.ws = null
    this.connected = false
  }

  isConnected(): boolean {
    return this.connected
  }

  private closeAndReconnect(): void {
    this.clearHeartbeat()
    this.ws?.close()
    this.ws = null
    this.connected = false
    this.scheduleReconnect()
  }

  private scheduleReconnect(): void {
    if (this.destroyed) return
    if (this.reconnectTimer !== null) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, RECONNECT_DELAY)
  }
}
