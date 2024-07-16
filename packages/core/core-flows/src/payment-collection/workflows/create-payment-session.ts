import {
  BigNumberInput,
  PaymentProviderContext,
  PaymentSessionDTO,
} from "@medusajs/types"
import { MathBN, PaymentSessionStatus } from "@medusajs/utils"
import {
  WorkflowData,
  createWorkflow,
  parallelize,
  transform,
} from "@medusajs/workflows-sdk"
import { useRemoteQueryStep } from "../../common"
import { createPaymentSessionStep } from "../steps"
import { deletePaymentSessionsWorkflow } from "./delete-payment-sessions"

interface WorkflowInput {
  payment_collection_id: string
  provider_id: string
  provider_token?: string
  data?: Record<string, unknown>
  context?: PaymentProviderContext
  amount?: BigNumberInput
}

export const createPaymentSessionsWorkflowId = "create-payment-sessions"
export const createPaymentSessionsWorkflow = createWorkflow(
  createPaymentSessionsWorkflowId,
  (input: WorkflowData<WorkflowInput>): WorkflowData<PaymentSessionDTO> => {
    const paymentCollection = useRemoteQueryStep({
      entry_point: "payment_collection",
      fields: [
        "id",
        "raw_amount",
        "raw_authorized_amount",
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
          data.paymentCollection.raw_authorized_amount || 0
        )
        return {
          payment_collection_id: data.input.payment_collection_id,
          provider_id: data.input.provider_id,
          provider_token: data.input.provider_token,
          data: data.input.data,
          context: data.input.context,
          amount: MathBN.min(data.input.amount || balance, balance),
          currency_code: data.paymentCollection.currency_code,
        }
      }
    )

    return createPaymentSessionStep(paymentSessionInput)
  }
)
