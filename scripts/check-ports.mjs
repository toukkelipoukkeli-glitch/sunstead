import net from "node:net"

const ports = [
  { label: "Aiden API", port: Number(process.env.PORT ?? 8787) },
  { label: "Control room", port: Number(process.env.VITE_PORT ?? 5173) }
]

const checkPort = (port) =>
  new Promise((resolve) => {
    const server = net.createServer()

    server.once("error", (error) => {
      resolve({
        available: false,
        reason: error.code === "EADDRINUSE" ? "already in use" : error.message
      })
    })

    server.once("listening", () => {
      server.close(() => resolve({ available: true }))
    })

    server.listen({ port, host: "0.0.0.0" })
  })

const blocked = []

for (const item of ports) {
  if (!Number.isInteger(item.port) || item.port <= 0) {
    blocked.push({ ...item, reason: "invalid port" })
    continue
  }

  const result = await checkPort(item.port)
  if (!result.available) {
    blocked.push({ ...item, reason: result.reason })
  }
}

if (blocked.length > 0) {
  console.error("Demo ports are not ready:")
  for (const item of blocked) {
    console.error(`- ${item.label} port ${item.port}: ${item.reason}`)
  }
  console.error("Stop the old dev server or set PORT/VITE_PORT intentionally before running npm run dev.")
  process.exit(1)
}
