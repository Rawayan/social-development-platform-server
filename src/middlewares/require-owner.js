
export function requireOwner({
  resourceKey = "resource",
  ownerField = "creatorId",
} = {}) {
  return (req, res, next) => {
    const resource = req[resourceKey];

    if (!resource) {
      return res.status(500).json({
        success: false,
        message: "Resource must be loaded before ownership check",
      });
    }

    const ownerId = resource[ownerField];

    if (
      !ownerId ||
      String(ownerId) !== String(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to modify this resource",
      });
    }

    next();
  };
}
