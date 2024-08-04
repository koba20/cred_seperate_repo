import Redis from "ioredis";

export default class RedisClient {
  public static instance: RedisClient;

  private client: Redis;

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl);
  }

  public static getInstance(url: string): RedisClient {
    if (!this.instance) {
      this.instance = new RedisClient(url);
    }
    return this.instance;
  }

  async set(key: string, value: string): Promise<string> {
    return await this.client.set(key, value);
  }

  async getUserSocket(userId: string): Promise<string | null> {
    const socket = await this.client.get(userId);
    if (socket) {
      return socket;
    }
    return null;
  }

  async delete(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }
  async quit(): Promise<void> {
    await this.client.quit();
  }
}
