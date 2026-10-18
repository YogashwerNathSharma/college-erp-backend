import { Request, Response } from "express";
import {
  getRolesService,
  getRoleByIdService,
  createRoleService,
  updateRoleService,
  deleteRoleService,
  getAllPermissionsService,
  getPermissionMatrixService,
  updatePermissionMatrixService,
  getPermissionGroupsService,
  createPermissionGroupService,
  updatePermissionGroupService,
  deletePermissionGroupService,
  getResourcePoliciesService,
  createResourcePolicyService,
  updateResourcePolicyService,
  deleteResourcePolicyService,
  getApiPermissionsService,
  createApiKeyService,
  revokeApiKeyService,
  updateApiKeyScopesService,
  getIAMStatsService,
} from "./iam.service";

// ══════════════════════════════════════════════════════════
// 📊 IAM STATS
// ══════════════════════════════════════════════════════════

export const getIAMStats = async (req: Request, res: Response) => {
  try {
    const stats = await getIAMStatsService();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// 🎭 ROLES
// ══════════════════════════════════════════════════════════

export const getRoles = async (req: Request, res: Response) => {
  try {
    const { search, parentRole } = req.query;
    const roles = await getRolesService({
      search: search as string,
      parentRole: parentRole as string,
    });
    res.json({ success: true, data: roles });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRoleById = async (req: Request, res: Response) => {
  try {
    const role = await getRoleByIdService(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: "Role not found" });
    res.json({ success: true, data: role });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createRole = async (req: Request, res: Response) => {
  try {
    const role = await createRoleService(req.body);
    res.status(201).json({ success: true, data: role });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const role = await updateRoleService(req.params.id, req.body);
    res.json({ success: true, data: role });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteRole = async (req: Request, res: Response) => {
  try {
    await deleteRoleService(req.params.id);
    res.json({ success: true, message: "Role deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// 🔐 PERMISSIONS
// ══════════════════════════════════════════════════════════

export const getAllPermissions = async (req: Request, res: Response) => {
  try {
    const permissions = await getAllPermissionsService();
    res.json({ success: true, data: permissions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// 📋 PERMISSION MATRIX
// ══════════════════════════════════════════════════════════

export const getPermissionMatrix = async (req: Request, res: Response) => {
  try {
    const matrix = await getPermissionMatrixService();
    res.json({ success: true, data: matrix });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePermissionMatrix = async (req: Request, res: Response) => {
  try {
    const result = await updatePermissionMatrixService(req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// 📦 PERMISSION GROUPS
// ══════════════════════════════════════════════════════════

export const getPermissionGroups = async (req: Request, res: Response) => {
  try {
    const groups = await getPermissionGroupsService();
    res.json({ success: true, data: groups });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPermissionGroup = async (req: Request, res: Response) => {
  try {
    const group = await createPermissionGroupService(req.body);
    res.status(201).json({ success: true, data: group });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePermissionGroup = async (req: Request, res: Response) => {
  try {
    const group = await updatePermissionGroupService(req.params.id, req.body);
    res.json({ success: true, data: group });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePermissionGroup = async (req: Request, res: Response) => {
  try {
    await deletePermissionGroupService(req.params.id);
    res.json({ success: true, message: "Permission group deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// 🏗️ RESOURCE POLICIES
// ══════════════════════════════════════════════════════════

export const getResourcePolicies = async (req: Request, res: Response) => {
  try {
    const policies = await getResourcePoliciesService();
    res.json({ success: true, data: policies });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createResourcePolicy = async (req: Request, res: Response) => {
  try {
    const policy = await createResourcePolicyService(req.body);
    res.status(201).json({ success: true, data: policy });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateResourcePolicy = async (req: Request, res: Response) => {
  try {
    const policy = await updateResourcePolicyService(req.params.id, req.body);
    res.json({ success: true, data: policy });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteResourcePolicy = async (req: Request, res: Response) => {
  try {
    await deleteResourcePolicyService(req.params.id);
    res.json({ success: true, message: "Resource policy deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// 🔑 API PERMISSIONS / KEYS
// ══════════════════════════════════════════════════════════

export const getApiPermissions = async (req: Request, res: Response) => {
  try {
    const keys = await getApiPermissionsService();
    res.json({ success: true, data: keys });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createApiKey = async (req: Request, res: Response) => {
  try {
    const key = await createApiKeyService(req.body);
    res.status(201).json({ success: true, data: key });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const revokeApiKey = async (req: Request, res: Response) => {
  try {
    await revokeApiKeyService(req.params.id);
    res.json({ success: true, message: "API key revoked" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateApiKeyScopes = async (req: Request, res: Response) => {
  try {
    const key = await updateApiKeyScopesService(req.params.id, req.body.scopes);
    res.json({ success: true, data: key });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
