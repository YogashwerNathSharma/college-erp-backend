import { Request, Response }
from "express";

import {

  createOrderService,

  createCustomOrderService,
  verifyPaymentService,

  getPaymentsService,

} from "./subscriptionPayment.service";

//////////////////////////////////////////////////////////////
// CREATE ORDER
//////////////////////////////////////////////////////////////

export const createOrder =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const {
        subscriptionId,
      } = req.body;

      const order =
        await createOrderService(
          subscriptionId
        );

      return res.status(200).json({

        success: true,

        data: order,

      });

    } catch (error: any) {

      return res.status(400).json({

        success: false,

        message: error.message,

      });

    }

  };

//////////////////////////////////////////////////////////////
// VERIFY PAYMENT
//////////////////////////////////////////////////////////////

export const verifyPayment =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const payment =
        await verifyPaymentService(
          req.body
        );

      return res.status(200).json({

        success: true,

        data: payment,

      });

    } catch (error: any) {

      return res.status(400).json({

        success: false,

        message: error.message,

      });

    }

  };

//////////////////////////////////////////////////////////////
// GET PAYMENTS
//////////////////////////////////////////////////////////////

export const getPayments =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const payments =
        await getPaymentsService();

      return res.status(200).json({

        success: true,

        data: payments,

      });

    } catch (error: any) {

      return res.status(400).json({

        success: false,

        message: error.message,

      });

    }

  };

//////////////////////////////////////////////////////////////
// CREATE CUSTOM ORDER (Super Admin - custom amount)
//////////////////////////////////////////////////////////////

export const createCustomOrder =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const { tenantId, amount } = req.body;

      if (!tenantId || !amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "tenantId and valid amount required",
        });
      }

      const result = await createCustomOrderService(tenantId, amount);

      return res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

  };
