import {
  BigNumberInput,
  PaymentProviderContext,
  PaymentSessionDTO,
} from "@medusajs/framework/types"
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { createPaymentSessionStep } from "../steps"

export interface CreatePaymentSessionsWorkflowInput {
  payment_collection_id: string
  provider_id?: string
  provider_token?: string
  amount?: BigNumberInput
  context?: PaymentProviderContext
  metadata?: Record<string, unknown>
}

export const createPaymentSessionsWorkflowId = "create-payment-sessions"
/**
 * This workflow creates payment sessions.
 */
export const createPaymentSessionsWorkflow = createWorkflow(
  createPaymentSessionsWorkflowId,
  (
    input: WorkflowData<CreatePaymentSessionsWorkflowInput>
  ): WorkflowResponse<PaymentSessionDTO> => {
    return new WorkflowResponse(createPaymentSessionStep(input))
  }
)
