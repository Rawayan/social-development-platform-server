
import { Router } from "express";

import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// GET /api/protected
// JWT protected test endpoint

router.get("/", requireAuth, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Protected API accessed successfully.",
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
    },
  });
});

export default router;
