import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/workflows-sdk"
import { cancelPaymentSessionStep } from "../steps"

export const cancelPaymentSessionWorkflowId = "cancel-payment-session-workflow"

/**
 * This workflow cancels one or more payment sessions.
 */
export const cancelPaymentSessionWorkflow = createWorkflow(
  cancelPaymentSessionWorkflowId,
  (input: WorkflowData<{ id: string | string[] }>) => {
    return new WorkflowResponse(cancelPaymentSessionStep(input))
  }
)
