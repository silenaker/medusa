import {
  IPaymentModuleService,
  Logger,
  PaymentProviderContext,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export type AuthorizePaymentSessionStepInput = {
  id: string
  provider_token?: string
  context?: PaymentProviderContext
}

export const authorizePaymentSessionStepId = "authorize-payment-session-step"
/**
 * This step authorizes a payment session.
 */
export const authorizePaymentSessionStep = createStep(
  authorizePaymentSessionStepId,
  async (input: AuthorizePaymentSessionStepInput, { container }) => {
    const paymentModule = container.resolve<IPaymentModuleService>(
      Modules.PAYMENT
    )
    const payment = await paymentModule.authorizePaymentSession(input.id, {
      provider_token: input.provider_token,
      context: input.context,
    })
    return new StepResponse(payment)
  },
  // If payment or any other part of complete cart fails post payment step, we cancel any payments made
  async (payment, { container }) => {
    if (!payment) {
      return
    }

    const logger = container.resolve<Logger>(ContainerRegistrationKeys.LOGGER)
    const paymentModule = container.resolve<IPaymentModuleService>(
      Modules.PAYMENT
    )

    try {
      await paymentModule.cancelPayment(payment.id)
    } catch (e) {
      logger.error(
        `Error was thrown trying to cancel payment - ${payment.id} - ${e}`
      )
    }
  }
)
