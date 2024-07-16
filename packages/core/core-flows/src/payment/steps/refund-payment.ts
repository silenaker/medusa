import { BigNumberInput, IPaymentModuleService } from "@medusajs/types"
import { ModuleRegistrationName } from "@medusajs/utils"
import { StepResponse, createStep } from "@medusajs/workflows-sdk"

type StepInput = {
  payment_id: string
  refunded_by?: string
  amount?: BigNumberInput
}

export const refundPaymentStepId = "refund-payment-step"
export const refundPaymentStep = createStep(
  refundPaymentStepId,
  async (input: StepInput, { container }) => {
    const paymentModule = container.resolve<IPaymentModuleService>(
      ModuleRegistrationName.PAYMENT
    )

    const payment = await paymentModule.refundPayment(input.payment_id, {
      amount: input.amount,
      refunded_by: input.refunded_by,
    })

    return new StepResponse(payment)
  }
)
