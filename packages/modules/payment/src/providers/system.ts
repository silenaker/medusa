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
} from "@medusajs/framework/types"
import {
  AbstractPaymentProvider,
  BigNumber,
  MathBN,
} from "@medusajs/framework/utils"

type SystemProviderPaymentSession = {
  status: PaymentSessionStatus
  amount: BigNumberValue
  captured_amount: BigNumberValue
  refunded_amount: BigNumberValue
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
      captured_amount: new BigNumber(data.amount).valueOf(),
      refunded_amount: 0,
      currency_code: data.currency_code,
      context: data.context,
    }
    return {
      status: paymentSessionData.status,
      captured_amount: paymentSessionData.captured_amount,
      refunded_amount: paymentSessionData.refunded_amount,
      context: paymentSessionData.context,
      data: paymentSessionData,
    }
  }

  async retrievePayment(
    paymentSessionData: SystemProviderPaymentSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    return {
      status: paymentSessionData.status,
      captured_amount: paymentSessionData.captured_amount,
      refunded_amount: paymentSessionData.refunded_amount,
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
      captured_amount: paymentSessionData.captured_amount,
      refunded_amount: paymentSessionData.refunded_amount,
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
    if (amount && amount < paymentSessionData.captured_amount) {
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
      toUpdate.captured_amount = toUpdate.amount
    }
    if (context) toUpdate.context = context
    const paymentSessionData_ = { ...paymentSessionData, ...toUpdate }
    return {
      status: paymentSessionData_.status,
      captured_amount: paymentSessionData_.captured_amount,
      refunded_amount: paymentSessionData_.refunded_amount,
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
      paymentSessionData.captured_amount,
      paymentSessionData.refunded_amount
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
      paymentSessionData.refunded_amount,
      refundAmount
    )
    const isFullyRefunded = MathBN.eq(
      paymentSessionData.captured_amount,
      refundedAmount
    )
    const status = isFullyRefunded ? "refunded" : "partially_refunded"

    return {
      status,
      captured_amount: paymentSessionData.captured_amount,
      refunded_amount: refundedAmount,
      context: paymentSessionData.context,
      data: {
        ...paymentSessionData,
        status,
        refunded_amount: refundedAmount,
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
