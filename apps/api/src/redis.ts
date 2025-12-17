import { createClient, type RedisClientOptions } from 'redis'

const clientSettings: RedisClientOptions = {
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT)
  }
}

export const redis = clientSettings ? createClient(clientSettings) : null

if (redis) {
  redis.on('error', (err) => console.error('[redis]', err))

  redis.connect().catch((err) => console.error('[redis] connect failed', err))
}
