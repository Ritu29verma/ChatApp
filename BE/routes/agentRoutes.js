import express from 'express';
import { checkOrRegisterAgent,getAllAgents  } from '../controllers/agentController.js';

const router = express.Router();

router.post('/check-or-register', checkOrRegisterAgent);
router.get('/all-agents', getAllAgents);

export default router;
