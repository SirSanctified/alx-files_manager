import { createClient } from 'redis';
class RedisClient {
  constructor () {
    this.client = createClient({
      socket: {
        host: '127.0.0.1'
      }
    });
    this.client.connect().then(() => {
      this.connected = true;
    });
    this.client.on('error', (error) => {
      console.log(`Redis client not connected to server: ${error}`);
      this.connected = false;
    });
  }

  isAlive () {
    return this.connected;
  }

  async get (key) {
    return await this.client.get(key);
  }

  async set (key, value, time) {
    await this.client.setEx(key, time, value);
  }

  async del (key) {
    await this.client.del(key);
  }
}
const redisClient = new RedisClient();

export default redisClient;
