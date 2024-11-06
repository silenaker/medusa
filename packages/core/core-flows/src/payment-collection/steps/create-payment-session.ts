import {
  BigNumberInput,
  IPaymentModuleService,
  PaymentProviderContext,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export interface CreatePaymentSessionStepInput {
  payment_collection_id: string
  provider_id?: string
  provider_token?: string
  amount?: BigNumberInput
  context?: PaymentProviderContext
  metadata?: Record<string, unknown>
}

export const createPaymentSessionStepId = "create-payment-session"
/**
 * This step creates a payment session.
 */
export const createPaymentSessionStep = createStep(
  createPaymentSessionStepId,
  async (input: CreatePaymentSessionStepInput, { container }) => {
    const service = container.resolve<IPaymentModuleService>(Modules.PAYMENT)

    const session = await service.createPaymentSession(
      input.payment_collection_id,
      {
        provider_id: input.provider_id,
        provider_token: input.provider_token,
        amount: input.amount,
        context: input.context,
        metadata: input.metadata,
      }
    )

    return new StepResponse(session, session.id)
  },
  async (createdSession, { container }) => {
    if (!createdSession) {
      return
    }

    const service = container.resolve<IPaymentModuleService>(Modules.PAYMENT)

    await service.deletePaymentSession(createdSession)
  }
)
