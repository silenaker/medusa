import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { authorizePaymentSessionStep } from "../steps"

export const authorizePaymentSessionWorkflowId =
  "authorize-payment-session-workflow"

/**
 * This workflow authorizes a payment session.
 */
export const authorizePaymentSessionWorkflow = createWorkflow(
  authorizePaymentSessionWorkflowId,
  (input: WorkflowData<{ id: string; provider_token?: string }>) => {
    return new WorkflowResponse(authorizePaymentSessionStep(input))
  }
)
