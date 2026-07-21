import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { allowRoles } from "../../middleware/role.middleware";
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
  getPermissionMatrix,
  updatePermissionMatrix,
  getPermissionGroups,
  createPermissionGroup,
  updatePermissionGroup,
  deletePermissionGroup,
  getResourcePolicies,
  createResourcePolicy,
  updateResourcePolicy,
  deleteResourcePolicy,
  getApiPermissions,
  createApiKey,
  revokeApiKey,
  updateApiKeyScopes,
  getIAMStats,
} from "./iam.controller";

const router = Router();

// All routes require SUPER_ADMIN
router.use(authMiddleware, allowRoles("SUPER_ADMIN"));

// Stats
router.get("/stats", getIAMStats);

// Roles
router.get("/roles", getRoles);
router.get("/roles/:id", getRoleById);
router.post("/roles", createRole);
router.put("/roles/:id", updateRole);
router.delete("/roles/:id", deleteRole);

// Permissions
router.get("/permissions", getAllPermissions);

// Permission Matrix
router.get("/matrix", getPermissionMatrix);
router.put("/matrix", updatePermissionMatrix);

// Permission Groups
router.get("/groups", getPermissionGroups);
router.post("/groups", createPermissionGroup);
router.put("/groups/:id", updatePermissionGroup);
router.delete("/groups/:id", deletePermissionGroup);

// Resource Policies
router.get("/policies", getResourcePolicies);
router.post("/policies", createResourcePolicy);
router.put("/policies/:id", updateResourcePolicy);
router.delete("/policies/:id", deleteResourcePolicy);

// API Permissions / Keys
router.get("/api-keys", getApiPermissions);
router.post("/api-keys", createApiKey);
router.delete("/api-keys/:id", revokeApiKey);
router.put("/api-keys/:id/scopes", updateApiKeyScopes);

export default router;
