import { Router } from "express";
import { getStats, getStatus } from "../controllers/AppController.js";
import { postNew, getMe  } from "../controllers/UsersController.js";
import { getConnect, getDisconnect} from "../controllers/AuthController.js";

const router = Router();

router
  .get('/status', getStatus)
  .get('/stats', getStats)
  .post('/users', postNew)
  .get('/users/me', getMe)
  .get('/connect', getConnect)
  .get('/disconnect', getDisconnect);

  export default router;