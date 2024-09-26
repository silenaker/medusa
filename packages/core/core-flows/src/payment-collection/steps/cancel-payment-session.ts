import {
  IPaymentModuleService,
  Logger,
  PaymentSessionDTO,
} from "@medusajs/types"
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  promiseAll,
} from "@medusajs/utils"
import { createStep, StepResponse } from "@medusajs/workflows-sdk"

export type CancelPaymentSessionStepInput = {
  id: string | string[]
}

export const cancelPaymentSessionStepId = "cancel-payment-session-step"

/**
 * This step cancels one or more payment sessions.
 */
export const cancelPaymentSessionStep = createStep(
  cancelPaymentSessionStepId,
  async (input: CancelPaymentSessionStepInput, { container }) => {
    const logger = container.resolve<Logger>(ContainerRegistrationKeys.LOGGER)
    const paymentModule = container.resolve<IPaymentModuleService>(
      ModuleRegistrationName.PAYMENT
    )
    const ids = Array.isArray(input.id) ? input.id : [input.id]
    const sessions = await promiseAll(
      ids.map((id) =>
        paymentModule.cancelPaymentSession(id).catch((e) => {
          logger.error(
            `Error was thrown trying to cancel payment session - ${id} - ${e}`
          )
        })
      )
    )

    return new StepResponse(
      Array.isArray(input.id)
        ? (sessions.filter(Boolean) as PaymentSessionDTO[])
        : sessions[0]
    )
  }
)
