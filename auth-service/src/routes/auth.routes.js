import express from "express";
import * as authController from '../controllers/auth.controller.js';
import { authMiddleware } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const router = express.Router();


router.post('/register', authController.registerController)
router.post('/login', authController.loginController)
router.get("/me", authMiddleware, authController.getMeController);
router.get("/vendor-test",authMiddleware,allowRoles("VENDOR"));
router.patch("/internal/users/role",authController.updateUserRoleInternalController);
router.post("/logout", authController.logoutController);


export default router;