import { Router } from "express";
import { getStats, getStatus } from "../controllers/AppController.js";
import { postNew, getMe  } from "../controllers/UsersController.js";
import { getConnect, getDisconnect} from "../controllers/AuthController.js";
import { postUpload, getShow, getIndex } from "../controllers/FilesController.js";

const router = Router();

router
  .get('/status', getStatus)
  .get('/stats', getStats)
  .post('/users', postNew)
  .get('/users/me', getMe)
  .get('/connect', getConnect)
  .get('/disconnect', getDisconnect)
  .post('/files', postUpload)
  .get('/files', getIndex)
  .get('/files/:id', getShow);

  export default router;