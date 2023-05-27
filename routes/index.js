import { Router } from "express";
import { getStats, getStatus } from "../controllers/AppController.js";
import { postNew } from "../controllers/UsersController.js";

const router = Router();

router
  .get('/status', getStatus)
  .get('/stats', getStats)
  .post('/users', postNew);

  export default router;