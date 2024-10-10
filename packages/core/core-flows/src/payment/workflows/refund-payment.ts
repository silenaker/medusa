import { BigNumberInput } from "@medusajs/framework/types"
import { PaymentEvents } from "@medusajs/framework/utils"
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common"
import { refundPaymentStep } from "../steps/refund-payment"

export const refundPaymentWorkflowId = "refund-payment-workflow"
/**
 * This workflow refunds a payment.
 */
export const refundPaymentWorkflow = createWorkflow(
  refundPaymentWorkflowId,
  (
    input: WorkflowData<{
      payment_id: string
      created_by?: string
      amount?: BigNumberInput
      note?: string
    }>
  ) => {
    const payment = refundPaymentStep(input)

    emitEventStep({
      eventName: PaymentEvents.REFUNDED,
      data: { id: payment.id },
    })

    return new WorkflowResponse(payment)
  }
)
