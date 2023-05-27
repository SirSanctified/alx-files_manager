import dbClient from "../utils/db.js";
import crypto from 'crypto';

export const postNew = async (req, res) => {
  // get email and password from request body
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ "error": "Missing email" });
  }

  if (!password) {
    return res.status(400).json({ "error": "Missing password"});
  }

  // check if email already exists
  const user = await dbClient.client.db().collection("users").findOne({ email: email });

  if (user) {
    return res.status(400).json({ "error": "Already exists" });
  }

  // hash the password using SHA1 algorithm and save user to database
  const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

  const savedUser = await dbClient.client.db().collection("users").insertOne({
    email: email,
    password: hashedPassword
  });

  return res.status(201).json({ "id": savedUser.insertedId, "email": email });
}