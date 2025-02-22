import express from 'express';
import { checkOrRegisterUser, getAllUsers  } from '../controllers/usercontroller.js';

const router = express.Router();

router.post('/check-or-register', checkOrRegisterUser);
router.get('/getUsers', getAllUsers )

export default router;
