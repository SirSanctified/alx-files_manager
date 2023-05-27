import { getStats, getStatus } from "../controllers/AppController.js";
import { Router } from "express";

const router = Router();

router
  .get('/status', getStatus)
  .get('/stats', getStats);

  export default router;