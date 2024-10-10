import {
  BigNumberInput,
  IPaymentModuleService,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export type CapturePaymentStepInput = {
  payment_id: string
  captured_by?: string
  amount?: BigNumberInput
}

export const capturePaymentStepId = "capture-payment-step"
/**
 * This step captures a payment.
 */
export const capturePaymentStep = createStep(
  capturePaymentStepId,
  async (input: CapturePaymentStepInput, { container }) => {
    const paymentModule = container.resolve<IPaymentModuleService>(
      Modules.PAYMENT
    )

    const payment = await paymentModule.capturePayment(input.payment_id, {
      amount: input.amount,
      captured_by: input.captured_by,
    })

    return new StepResponse(payment)
  }
)
