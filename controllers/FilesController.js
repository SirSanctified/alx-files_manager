import mongodb from "mongodb";
import { tmpdir } from 'os';
import { promisify } from 'util';
import { v4 as uuidv4 } from "uuid";
import {
  mkdir, writeFile, stat, existsSync, realpath,
} from 'fs';
import { join as joinPath } from 'path';
import Queue from 'bull';
// import { Request, Response } from 'express';
import { contentType } from 'mime-types';
import dbClient from "../utils/db.js";
import redisClient from "../utils/redis.js";


const users = dbClient.client.db().collection("users");
const files = dbClient.client.db().collection("files");
const ROOT_FOLDER_ID = 0;
const VALID_FILE_TYPES = {
  folder: 'folder',
  file: 'file',
  image: 'image',
};
const DEFAULT_ROOT_FOLDER = process.env.FOLDER_PATH || '/temp/files_manager';
const mkDirAsync = promisify(mkdir);
const writeFileAsync = promisify(writeFile);
const statAsync = promisify(stat);
const realpathAsync = promisify(realpath);
const MAX_FILES_PER_PAGE = 20;
const fileQueue = new Queue('thumbnail generation');
const NULL_ID = Buffer.alloc(24, '0').toString('utf-8');

export const postUpload = async (req, res) => {
  const token = req.headers['x-token'];
  const name = req.body ? req.body.name : null;
  const type = req.body ? req.body.type : null;
  const parentId = req.body && req.body.parentId ? req.body.parentId : ROOT_FOLDER_ID;
  const isPublic = req.body && req.body.isPublic ? req.body.isPublic : false;
  const data = req.body && req.body.data ? req.body.data : '';

  if (!token) return res.status(401).json({ "error": "Unauthorized" });
  if (!name) return res.status(400).json({ "error": "Missing name" });
  if (!type) return res.status(400).json({ "error": "Missing type" });
  if (!data && type !== VALID_FILE_TYPES.folder) return res.status(400).json({ "error": "Missing data" });
  // get userId stored in Redis
  const userId = await redisClient.get(`auth_${token}`);
  // get user with token from database
  const user = await users.findOne({ _id: new mongodb.ObjectID(userId) });
  if (!user) return res.status(401).json({ "error": "Unauthorised" });
  if (parentId) {
    const parentFile = files.findOne({ _id: new mongodb.ObjectID(parentId) });
    if (!parentFile) return res.status(400).json({ "error": "Parent not found" });
    if (parentFile && parentFile.type !== "folder") return res.status(400).json({ "error": "Parent is not a folder" });
  }
  const baseDir = `${process.env.FOLDER_PATH || ''}`.trim().length > 0
    ? process.env.FOLDER_PATH.trim()
    : joinPath(tmpdir(), DEFAULT_ROOT_FOLDER);
  // default baseDir == '/tmp/files_manager'
  // or (on Windows) '%USERPROFILE%/AppData/Local/Temp/files_manager';
  const newFile = {
    userId: new mongodb.ObjectID(userId),
    name,
    type,
    isPublic,
    parentId: (parentId === ROOT_FOLDER_ID) || (parentId === ROOT_FOLDER_ID.toString())
      ? '0'
      : new mongodb.ObjectID(parentId),
  };
  await mkDirAsync(baseDir, { recursive: true });
  if (type !== VALID_FILE_TYPES.folder) {
    const localPath = joinPath(baseDir, uuidv4());
    await writeFileAsync(localPath, Buffer.from(data, 'base64'));
    newFile.localPath = localPath;
  }
  const insertionInfo = await files.insertOne(newFile);
  const fileId = insertionInfo.insertedId.toString();
  // start thumbnail generation worker
  if (type === VALID_FILE_TYPES.image) {
    const jobName = `Image thumbnail [${userId}-${fileId}]`;
    fileQueue.add({ userId, fileId, name: jobName });
  }
  res.status(201).json({
    id: fileId,
    userId,
    name,
    type,
    isPublic,
    parentId: (parentId === ROOT_FOLDER_ID) || (parentId === ROOT_FOLDER_ID.toString())
      ? 0
      : parentId,
  });
}