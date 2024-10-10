import {
  AuthorizePaymentProviderSession,
  BigNumberInput,
  CreatePaymentProviderSession,
  DAL,
  IPaymentProvider,
  PaymentProviderError,
  PaymentProviderSessionResponse,
  ProviderWebhookPayload,
  UpdatePaymentProviderSession,
} from "@medusajs/framework/types"
import {
  isPaymentProviderError,
  MedusaError,
  ModulesSdkUtils,
} from "@medusajs/framework/utils"
import { PaymentProvider } from "@models"
import { EOL } from "os"

type InjectedDependencies = {
  paymentProviderRepository: DAL.RepositoryService
  [key: `pp_${string}`]: IPaymentProvider
}

export default class PaymentProviderService extends ModulesSdkUtils.MedusaInternalService<InjectedDependencies>(
  PaymentProvider
) {
  retrieveProvider(providerId: string): IPaymentProvider {
    try {
      return this.__container__[providerId] as IPaymentProvider
    } catch (e) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Could not find a payment provider with id: ${providerId}`
      )
    }
  }

  async retrieveSession(
    providerId: string,
    paymentSessionData: PaymentProviderSessionResponse["data"]
  ): Promise<PaymentProviderSessionResponse> {
    const provider = this.retrieveProvider(providerId)
    const res = await provider.retrievePayment(paymentSessionData)

    if (isPaymentProviderError(res)) {
      this.throwPaymentProviderError(res)
    }

    return res as PaymentProviderSessionResponse
  }

  async createSession(
    providerId: string,
    data: CreatePaymentProviderSession
  ): Promise<PaymentProviderSessionResponse> {
    const provider = this.retrieveProvider(providerId)
    const res = await provider.initiatePayment(data)

    if (isPaymentProviderError(res)) {
      this.throwPaymentProviderError(res)
    }

    return res as PaymentProviderSessionResponse
  }

  async updateSession(
    providerId: string,
    data: UpdatePaymentProviderSession
  ): Promise<PaymentProviderSessionResponse> {
    const provider = this.retrieveProvider(providerId)
    const res = await provider.updatePayment(data)

    if (isPaymentProviderError(res)) {
      this.throwPaymentProviderError(res)
    }

    return res as PaymentProviderSessionResponse
  }

  async deleteSession(
    providerId: string,
    paymentSessionData: PaymentProviderSessionResponse["data"]
  ): Promise<void> {
    const provider = this.retrieveProvider(providerId)
    const res = await provider.deletePayment(paymentSessionData)

    if (isPaymentProviderError(res)) {
      this.throwPaymentProviderError(res)
    }
  }

  async authorizePayment(
    providerId: string,
    data: AuthorizePaymentProviderSession
  ): Promise<PaymentProviderSessionResponse> {
    const provider = this.retrieveProvider(providerId)
    const res = await provider.authorizePayment(data)

    if (isPaymentProviderError(res)) {
      this.throwPaymentProviderError(res)
    }

    return res as PaymentProviderSessionResponse
  }

  async capturePayment(
    providerId: string,
    paymentSessionData: PaymentProviderSessionResponse["data"],
    captureAmount?: BigNumberInput
  ): Promise<PaymentProviderSessionResponse> {
    const provider = this.retrieveProvider(providerId)
    const res = await provider.capturePayment(paymentSessionData, captureAmount)

    if (isPaymentProviderError(res)) {
      this.throwPaymentProviderError(res)
    }

    return res as PaymentProviderSessionResponse
  }

  async cancelPayment(
    providerId: string,
    paymentSessionData: PaymentProviderSessionResponse["data"]
  ): Promise<PaymentProviderSessionResponse> {
    const provider = this.retrieveProvider(providerId)
    const res = await provider.cancelPayment(paymentSessionData)

    if (isPaymentProviderError(res)) {
      this.throwPaymentProviderError(res)
    }

    return res as PaymentProviderSessionResponse
  }

  async refundPayment(
    providerId: string,
    paymentSessionData: PaymentProviderSessionResponse["data"],
    refundAmount?: BigNumberInput
  ): Promise<PaymentProviderSessionResponse> {
    const provider = this.retrieveProvider(providerId)
    const res = await provider.refundPayment(paymentSessionData, refundAmount)

    if (isPaymentProviderError(res)) {
      this.throwPaymentProviderError(res)
    }

    return res as PaymentProviderSessionResponse
  }

  async getWebhookActionAndData(
    providerId: string,
    data: ProviderWebhookPayload["payload"]
  ): Promise<PaymentProviderSessionResponse> {
    const provider = this.retrieveProvider(providerId)

    return await provider.getWebhookActionAndData(data)
  }

  private throwPaymentProviderError(errObj: PaymentProviderError) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `${errObj.error}${errObj.detail ? `:${EOL}${errObj.detail}` : ""}`,
      errObj.code
    )
  }
}
