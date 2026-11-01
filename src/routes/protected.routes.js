
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Protected API accessed successfully",
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
    },
  });
});

export default router;


import { Router } from "express";

import healthRoutes from "./health.routes.js";
import protectedRoutes from "./protected.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/protected", protectedRoutes);

export default router;
