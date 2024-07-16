import {
  AuthorizePaymentProviderSession,
  BigNumberInput,
  Context,
  CreatePaymentProviderDTO,
  CreatePaymentProviderSession,
  DAL,
  FilterablePaymentProviderProps,
  FindConfig,
  InternalModuleDeclaration,
  IPaymentProvider,
  PaymentProviderDTO,
  PaymentProviderError,
  PaymentProviderSessionResponse,
  ProviderWebhookPayload,
  UpdatePaymentProviderSession,
} from "@medusajs/types"
import {
  InjectManager,
  InjectTransactionManager,
  isPaymentProviderError,
  MedusaContext,
  MedusaError,
  ModulesSdkUtils,
} from "@medusajs/utils"
import { PaymentProvider } from "@models"
import { EOL } from "os"

type InjectedDependencies = {
  paymentProviderRepository: DAL.RepositoryService
  [key: `pp_${string}`]: IPaymentProvider
}

export default class PaymentProviderService {
  protected readonly container_: InjectedDependencies
  protected readonly paymentProviderRepository_: DAL.RepositoryService

  constructor(
    container: InjectedDependencies,

    protected readonly moduleDeclaration: InternalModuleDeclaration
  ) {
    this.container_ = container
    this.paymentProviderRepository_ = container.paymentProviderRepository
  }

  @InjectTransactionManager("paymentProviderRepository_")
  async create(
    data: CreatePaymentProviderDTO[],
    @MedusaContext() sharedContext?: Context
  ): Promise<PaymentProvider[]> {
    return await this.paymentProviderRepository_.create(data, sharedContext)
  }

  @InjectManager("paymentProviderRepository_")
  async list(
    filters?: FilterablePaymentProviderProps,
    config?: FindConfig<PaymentProviderDTO>,
    @MedusaContext() sharedContext?: Context
  ): Promise<PaymentProvider[]> {
    const queryOptions = ModulesSdkUtils.buildQuery<PaymentProvider>(
      filters,
      config
    )

    return await this.paymentProviderRepository_.find(
      queryOptions,
      sharedContext
    )
  }

  @InjectManager("paymentProviderRepository_")
  async listAndCount(
    filters: FilterablePaymentProviderProps,
    config: FindConfig<PaymentProviderDTO>,
    @MedusaContext() sharedContext?: Context
  ): Promise<[PaymentProvider[], number]> {
    const queryOptions = ModulesSdkUtils.buildQuery<PaymentProvider>(
      filters,
      config
    )

    return await this.paymentProviderRepository_.findAndCount(
      queryOptions,
      sharedContext
    )
  }

  retrieveProvider(providerId: string): IPaymentProvider {
    try {
      return this.container_[providerId] as IPaymentProvider
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
