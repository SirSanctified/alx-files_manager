import mongodb from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

class DBClient {
  constructor() {
    this.connected = false;
    const port = process.env.DB_PORT || 27017;
    const host = process.env.DB_HOST || 'localhost';
    const db = process.env.DB_DATABASE || 'files_manager';
    this.client = new mongodb.MongoClient(`mongodb://${host}:${port}/${db}`,  { useUnifiedTopology: true, family: 4 });
    try {
      this.client.connect();
      this.connected = true;
    } catch (err) {
      this.connected = false;
    }

  }

  isAlive() {
    return this.connected;;
  }

  async nbUsers() {
    return this.client.db().collection('users').countDocuments();
  }

  async nbFiles() {
    return this.client.db().collection('files').countDocuments();
  }

}

const dbClient = new DBClient();

export default dbClient;
