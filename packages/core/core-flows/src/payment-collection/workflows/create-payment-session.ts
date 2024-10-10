import {
  BigNumberInput,
  PaymentProviderContext,
  PaymentSessionDTO,
} from "@medusajs/framework/types"
import { MathBN } from "@medusajs/framework/utils"
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { useRemoteQueryStep } from "../../common"
import { createPaymentSessionStep } from "../steps"

export interface CreatePaymentSessionsWorkflowInput {
  payment_collection_id: string
  provider_id: string
  provider_token?: string
  context?: PaymentProviderContext
  amount?: BigNumberInput
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
    const paymentCollection = useRemoteQueryStep({
      entry_point: "payment_collection",
      fields: [
        "id",
        "raw_amount",
        "raw_authorized_amount",
        "raw_refunded_amount",
        "currency_code",
        "payment_sessions.*",
      ],
      variables: { id: input.payment_collection_id },
      list: false,
    })

    const paymentSessionInput = transform(
      { paymentCollection, input },
      (data) => {
        const balance = MathBN.sub(
          data.paymentCollection.raw_amount,
          data.paymentCollection.raw_authorized_amount ?? 0,
          MathBN.mult(data.paymentCollection.raw_refunded_amount ?? 0, -1)
        )
        return {
          payment_collection_id: data.input.payment_collection_id,
          provider_id: data.input.provider_id,
          provider_token: data.input.provider_token,
          context: data.input.context,
          amount: MathBN.min(data.input.amount ?? balance, balance),
          currency_code: data.paymentCollection.currency_code,
          metadata: data.input.metadata,
        }
      }
    )

    return new WorkflowResponse(createPaymentSessionStep(paymentSessionInput))
  }
)
