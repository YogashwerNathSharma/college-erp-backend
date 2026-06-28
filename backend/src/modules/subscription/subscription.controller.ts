import { Request, Response } from "express";

import {
  createPlanService,
  getPlansService,
  getSinglePlanService,
  updatePlanService,
  deletePlanService,

  assignSubscriptionService,
  getSubscriptionsService,
  getTenantActiveSubscriptionService,

  cancelSubscriptionService,
  renewSubscriptionService,

} from "./subscription.service";

//////////////////////////////////////////////////////////////
// CREATE PLAN
//////////////////////////////////////////////////////////////

export const createPlan = async (
  req: Request,
  res: Response
) => {

  try {

    const plan =
      await createPlanService(
        req.body
      );

    return res.status(201).json({
      success: true,
      data: plan,
    });

  } catch (error: any) {

    return res.status(400).json({
      success: false,
      message: error.message,
    });

  }

};

//////////////////////////////////////////////////////////////
// GET PLANS
//////////////////////////////////////////////////////////////

export const getPlans = async (
  req: Request,
  res: Response
) => {

  try {

    const plans =
      await getPlansService();

    return res.status(200).json({
      success: true,
      data: plans,
    });

  } catch (error: any) {

    return res.status(400).json({
      success: false,
      message: error.message,
    });

  }

};

//////////////////////////////////////////////////////////////
// GET SINGLE PLAN
//////////////////////////////////////////////////////////////

export const getSinglePlan = async (
  req: Request,
  res: Response
) => {

  try {

    const plan =
      await getSinglePlanService(
        String(req.params.id)
      );

    return res.status(200).json({
      success: true,
      data: plan,
    });

  } catch (error: any) {

    return res.status(404).json({
      success: false,
      message: error.message,
    });

  }

};

//////////////////////////////////////////////////////////////
// UPDATE PLAN
//////////////////////////////////////////////////////////////

export const updatePlan = async (
  req: Request,
  res: Response
) => {

  try {

    const plan =
      await updatePlanService(
        String(req.params.id),
        req.body
      );

    return res.status(200).json({
      success: true,
      data: plan,
    });

  } catch (error: any) {

    return res.status(400).json({
      success: false,
      message: error.message,
    });

  }

};

//////////////////////////////////////////////////////////////
// DELETE PLAN
//////////////////////////////////////////////////////////////

export const deletePlan = async (
  req: Request,
  res: Response
) => {

  try {

    const plan =
      await deletePlanService(
        String(req.params.id)
      );

    return res.status(200).json({
      success: true,
      data: plan,
    });

  } catch (error: any) {

    return res.status(400).json({
      success: false,
      message: error.message,
    });

  }

};

//////////////////////////////////////////////////////////////
// ASSIGN SUBSCRIPTION
//////////////////////////////////////////////////////////////

export const assignSubscription =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const {
        tenantId,
        planId,
      } = req.body;

      const subscription =
        await assignSubscriptionService(
          tenantId,
          planId
        );

      return res.status(201).json({
        success: true,
        data: subscription,
      });

    } catch (error: any) {

      return res.status(400).json({
        success: false,
        message: error.message,
      });

    }

  };

//////////////////////////////////////////////////////////////
// GET SUBSCRIPTIONS
//////////////////////////////////////////////////////////////

export const getSubscriptions =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const subscriptions =
        await getSubscriptionsService();

      return res.status(200).json({
        success: true,
        data: subscriptions,
      });

    } catch (error: any) {

      return res.status(400).json({
        success: false,
        message: error.message,
      });

    }

  };

//////////////////////////////////////////////////////////////
// GET TENANT SUBSCRIPTION
//////////////////////////////////////////////////////////////

export const getTenantSubscription =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const subscription =
        await getTenantActiveSubscriptionService(
          String(((req as any).tenantId || req.user?.tenantId))
        );

      return res.status(200).json({
        success: true,
        data: subscription,
      });

    } catch (error: any) {

      return res.status(400).json({
        success: false,
        message: error.message,
      });

    }

  };

//////////////////////////////////////////////////////////////
// CANCEL SUBSCRIPTION
//////////////////////////////////////////////////////////////

export const cancelSubscription =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const subscription =
        await cancelSubscriptionService(
          String(req.params.id)
        );

      return res.status(200).json({
        success: true,
        data: subscription,
      });

    } catch (error: any) {

      return res.status(400).json({
        success: false,
        message: error.message,
      });

    }

  };

//////////////////////////////////////////////////////////////
// RENEW SUBSCRIPTION
//////////////////////////////////////////////////////////////

export const renewSubscription =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const subscription =
        await renewSubscriptionService(
          String(req.params.id)
        );

      return res.status(201).json({
        success: true,
        data: subscription,
      });

    } catch (error: any) {

      return res.status(400).json({
        success: false,
        message: error.message,
      });

    }

  };