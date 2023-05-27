import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import dbClient from "../utils/db.js";
import redisClient from "../utils/redis.js";

export const getConnect = async (req, res) => {
  // get base64 authorization header
  const auth_header = req.headers["authorization"];

  const base64Str = auth_header.split(' ')[1];
  // decode base64 string
  const buff = new Buffer(base64Str, 'base64');
  // get user credentials from decoded base64
  const credentials = buff.toString('utf-8');
  const credentialsRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+:[\S]+$/
  
  if (credentialsRegex.test(credentials)) {
    const email = credentials.split(':')[0];
    const password = crypto.createHash('sha1').update(credentials.split(':')[1]).digest('hex');
    console.log('Im here');
    // get user from database with email and check if passwords are similar
    const user = await dbClient.client.db().collection("users").findOne({ email: email});
    if (!user) {
      return res.status(401).json({ "error": "Unauthorized" });
    }
    if (user.password !== password) {
      console.log('Passwords do not match')
      return res.status(401).json({ "error": "Unauthorized" });
    }
    const token = uuidv4();
    await redisClient.set(`auth_${token}`, user._id, 60 * 60 * 24);
    return res.status(200).json({ "token": token });
  } else {
    return res.status(401).json({ "error": "Unauthorized" });
  }
}

export const getDisconnect = async (req, res) => {
  const token = req.headers["X-Token"];
  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) return res.status(401).json({ "error": "Unauthorized"});
  await redisClient.del(`auth_${token}`);
  return res.sendStatus(204);
}

export const getMe = async (req, res) => {
  const token = req.headers["X-Token"];
  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) return res.status(401).json({ "error": "Unauthorized"});
  const user = dbClient.client.db().collection("users").findOne({_id: userId});
  if (user) return res.status(200).json({ "id": user._id, "email": user.email });
}