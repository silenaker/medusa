import {
  AuthorizePaymentProviderSession,
  BigNumberInput,
  BigNumberValue,
  CreatePaymentProviderSession,
  PaymentProviderContext,
  PaymentProviderError,
  PaymentProviderSessionResponse,
  PaymentSessionStatus,
  ProviderWebhookPayload,
  UpdatePaymentProviderSession,
} from "@medusajs/types"
import { AbstractPaymentProvider, BigNumber, MathBN } from "@medusajs/utils"

type SystemProviderPaymentSession = {
  status: PaymentSessionStatus
  amount: BigNumberValue
  capturedAmount: BigNumberValue
  refundedAmount: BigNumberValue
  currency_code: string
  context: PaymentProviderContext
}

export class SystemProviderService extends AbstractPaymentProvider {
  static identifier = "system"
  static PROVIDER = "system"

  async initiatePayment(
    data: CreatePaymentProviderSession
  ): Promise<PaymentProviderSessionResponse> {
    const paymentSessionData: SystemProviderPaymentSession = {
      status: "captured",
      amount: new BigNumber(data.amount).valueOf(),
      capturedAmount: new BigNumber(data.amount).valueOf(),
      refundedAmount: 0,
      currency_code: data.currency_code,
      context: data.context,
    }
    return {
      status: paymentSessionData.status,
      capturedAmount: paymentSessionData.capturedAmount,
      refundedAmount: paymentSessionData.refundedAmount,
      context: paymentSessionData.context,
      data: paymentSessionData,
    }
  }

  async retrievePayment(
    paymentSessionData: SystemProviderPaymentSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    return {
      status: paymentSessionData.status,
      capturedAmount: paymentSessionData.capturedAmount,
      refundedAmount: paymentSessionData.refundedAmount,
      context: paymentSessionData.context,
      data: paymentSessionData,
    }
  }

  async authorizePayment({
    data,
  }: AuthorizePaymentProviderSession): Promise<
    PaymentProviderError | PaymentProviderSessionResponse
  > {
    const paymentSessionData = data as SystemProviderPaymentSession
    return {
      status: paymentSessionData.status,
      capturedAmount: paymentSessionData.capturedAmount,
      refundedAmount: paymentSessionData.refundedAmount,
      context: paymentSessionData.context,
      data: paymentSessionData,
    }
  }

  async updatePayment({
    data,
    context,
    amount,
  }: UpdatePaymentProviderSession): Promise<
    PaymentProviderError | PaymentProviderSessionResponse
  > {
    const paymentSessionData = data as SystemProviderPaymentSession
    if (amount && amount < paymentSessionData.capturedAmount) {
      return {
        error:
          "You cannot update payment amount less than the captured amount, please use refund",
        code: "",
        detail: "",
      }
    }
    const toUpdate: Partial<SystemProviderPaymentSession> = {}
    if (amount) {
      toUpdate.amount = new BigNumber(amount).valueOf()
      toUpdate.capturedAmount = toUpdate.amount
    }
    if (context) toUpdate.context = context
    const paymentSessionData_ = { ...paymentSessionData, ...toUpdate }
    return {
      status: paymentSessionData_.status,
      capturedAmount: paymentSessionData_.capturedAmount,
      refundedAmount: paymentSessionData_.refundedAmount,
      context: paymentSessionData_.context,
      data: paymentSessionData_,
    }
  }

  async deletePayment(
    paymentSessionData: SystemProviderPaymentSession
  ): Promise<PaymentProviderError | void> {}

  async capturePayment(
    paymentSessionData: SystemProviderPaymentSession,
    captureAmount?: BigNumberInput
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    // already captured when payment was created
    return {
      error:
        "You cannot capture more than the authorized amount subtracted by what is already captured.",
      code: "",
      detail: "",
    }
  }

  async refundPayment(
    paymentSessionData: SystemProviderPaymentSession,
    amount?: BigNumberInput
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    const refundableAmount = MathBN.sub(
      paymentSessionData.capturedAmount,
      paymentSessionData.refundedAmount
    )
    const refundAmount = amount ? new BigNumber(amount) : refundableAmount

    if (
      MathBN.eq(refundableAmount, 0) ||
      MathBN.gt(refundAmount, refundableAmount)
    ) {
      return {
        error: "You cannot refund more than what is captured on the payment.",
        code: "",
        detail: "",
      }
    }

    if (MathBN.lte(refundAmount, 0)) {
      return {
        error: "You must refund amount more than 0.",
        code: "",
        detail: "",
      }
    }

    const refundedAmount = MathBN.add(
      paymentSessionData.refundedAmount,
      refundAmount
    )
    const isFullyRefunded = MathBN.eq(
      paymentSessionData.capturedAmount,
      refundedAmount
    )
    const status = isFullyRefunded ? "refunded" : "partially_refunded"

    return {
      status,
      capturedAmount: paymentSessionData.capturedAmount,
      refundedAmount,
      context: paymentSessionData.context,
      data: {
        ...paymentSessionData,
        status,
        refundedAmount,
      },
    }
  }

  async cancelPayment(
    paymentSessionData: SystemProviderPaymentSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    return {
      error: "Captured payment cannot be canceled, please use refund",
      code: "",
      detail: "",
    }
  }

  async getWebhookActionAndData(
    data: ProviderWebhookPayload["payload"]
  ): Promise<PaymentProviderSessionResponse> {
    throw new Error("Not supported")
  }
}

export default SystemProviderService
