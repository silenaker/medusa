import {
  AuthorizePaymentSessionDTO,
  CaptureDTO,
  Context,
  CreateCaptureDTO,
  CreatePaymentCollectionDTO,
  CreatePaymentSessionDTO,
  CreateRefundDTO,
  DAL,
  FilterablePaymentCollectionProps,
  FilterablePaymentProviderProps,
  FilterablePaymentSessionProps,
  FindConfig,
  IPaymentModuleService,
  ModuleJoinerConfig,
  ModulesSdkTypes,
  PaymentCollectionDTO,
  PaymentCollectionUpdatableFields,
  PaymentDTO,
  PaymentProviderDTO,
  PaymentProviderSessionResponse,
  PaymentSessionDTO,
  ProviderWebhookPayload,
  RefundDTO,
  RefundReasonDTO,
  UpdatePaymentCollectionDTO,
  UpdatePaymentDTO,
  UpdatePaymentSessionDTO,
  UpsertPaymentCollectionDTO,
} from "@medusajs/framework/types"
import {
  BigNumber,
  InjectManager,
  InjectTransactionManager,
  isString,
  MathBN,
  MedusaContext,
  MedusaError,
  ModulesSdkUtils,
  PaymentCollectionStatus,
  PaymentSessionStatus,
  promiseAll,
} from "@medusajs/framework/utils"
import {
  Capture,
  Payment,
  PaymentCollection,
  PaymentSession,
  Refund,
  RefundReason,
} from "@models"
import { joinerConfig } from "../joiner-config"
import { PaymentModuleOptions } from "../types"
import PaymentProviderService from "./payment-provider"

type InjectedDependencies = {
  baseRepository: DAL.RepositoryService
  paymentService: ModulesSdkTypes.IMedusaInternalService<any>
  captureService: ModulesSdkTypes.IMedusaInternalService<any>
  refundService: ModulesSdkTypes.IMedusaInternalService<any>
  paymentSessionService: ModulesSdkTypes.IMedusaInternalService<any>
  paymentCollectionService: ModulesSdkTypes.IMedusaInternalService<any>
  paymentProviderService: PaymentProviderService
}

const generateMethodForModels = {
  PaymentCollection,
  PaymentSession,
  Payment,
  Capture,
  Refund,
  RefundReason,
}

export default class PaymentModuleService
  extends ModulesSdkUtils.MedusaService<{
    PaymentCollection: { dto: PaymentCollectionDTO }
    PaymentSession: { dto: PaymentSessionDTO }
    Payment: { dto: PaymentDTO }
    Capture: { dto: CaptureDTO }
    Refund: { dto: RefundDTO }
    RefundReason: { dto: RefundReasonDTO }
  }>(generateMethodForModels)
  implements IPaymentModuleService
{
  protected baseRepository_: DAL.RepositoryService

  protected paymentService_: ModulesSdkTypes.IMedusaInternalService<Payment>
  protected captureService_: ModulesSdkTypes.IMedusaInternalService<Capture>
  protected refundService_: ModulesSdkTypes.IMedusaInternalService<Refund>
  protected paymentSessionService_: ModulesSdkTypes.IMedusaInternalService<PaymentSession>
  protected paymentCollectionService_: ModulesSdkTypes.IMedusaInternalService<PaymentCollection>
  protected paymentProviderService_: PaymentProviderService

  constructor(
    {
      baseRepository,
      paymentService,
      captureService,
      refundService,
      paymentSessionService,
      paymentProviderService,
      paymentCollectionService,
    }: InjectedDependencies,
    protected readonly options: PaymentModuleOptions
  ) {
    // @ts-ignore
    super(...arguments)

    this.baseRepository_ = baseRepository

    this.refundService_ = refundService
    this.captureService_ = captureService
    this.paymentService_ = paymentService
    this.paymentSessionService_ = paymentSessionService
    this.paymentProviderService_ = paymentProviderService
    this.paymentCollectionService_ = paymentCollectionService
  }

  __joinerConfig(): ModuleJoinerConfig {
    return joinerConfig
  }

  // @ts-ignore
  createPaymentCollections(
    data: CreatePaymentCollectionDTO,
    sharedContext?: Context
  ): Promise<PaymentCollectionDTO>

  createPaymentCollections(
    data: CreatePaymentCollectionDTO[],
    sharedContext?: Context
  ): Promise<PaymentCollectionDTO[]>
  @InjectManager()
  async createPaymentCollections(
    data: CreatePaymentCollectionDTO | CreatePaymentCollectionDTO[],
    @MedusaContext() sharedContext?: Context
  ): Promise<PaymentCollectionDTO | PaymentCollectionDTO[]> {
    const input = Array.isArray(data) ? data : [data]

    const collections = await this.createPaymentCollections_(
      input,
      sharedContext
    )

    return await this.baseRepository_.serialize<PaymentCollectionDTO[]>(
      Array.isArray(data) ? collections : collections[0],
      {
        populate: true,
      }
    )
  }

  @InjectTransactionManager()
  async createPaymentCollections_(
    data: CreatePaymentCollectionDTO[],
    @MedusaContext() sharedContext?: Context
  ): Promise<PaymentCollection[]> {
    return await this.paymentCollectionService_.create(data, sharedContext)
  }

  // @ts-ignore
  updatePaymentCollections(
    paymentCollectionId: string,
    data: PaymentCollectionUpdatableFields,
    sharedContext?: Context
  ): Promise<PaymentCollectionDTO>
  updatePaymentCollections(
    selector: FilterablePaymentCollectionProps,
    data: PaymentCollectionUpdatableFields,
    sharedContext?: Context
  ): Promise<PaymentCollectionDTO[]>

  @InjectManager()
  async updatePaymentCollections(
    idOrSelector: string | FilterablePaymentCollectionProps,
    data: PaymentCollectionUpdatableFields,
    @MedusaContext() sharedContext?: Context
  ): Promise<PaymentCollectionDTO | PaymentCollectionDTO[]> {
    let updateData: UpdatePaymentCollectionDTO[] = []

    if (isString(idOrSelector)) {
      updateData = [
        {
          id: idOrSelector,
          ...data,
        },
      ]
    } else {
      const collections = await this.paymentCollectionService_.list(
        idOrSelector,
        {},
        sharedContext
      )

      updateData = collections.map((c) => ({
        id: c.id,
        ...data,
      }))
    }

    const result = await this.updatePaymentCollections_(
      updateData,
      sharedContext
    )

    await Promise.all(
      result.map(({ id }) =>
        this.maybeUpdatePaymentCollection_(id, sharedContext)
      )
    )

    return await this.baseRepository_.serialize<PaymentCollectionDTO[]>(
      Array.isArray(data) ? result : result[0],
      {
        populate: true,
      }
    )
  }

  @InjectManager()
  async updatePaymentCollections_(
    data: UpdatePaymentCollectionDTO[],
    @MedusaContext() sharedContext?: Context
  ): Promise<PaymentCollection[]> {
    return await this.paymentCollectionService_.update(data, sharedContext)
  }

  upsertPaymentCollections(
    data: UpsertPaymentCollectionDTO[],
    sharedContext?: Context
  ): Promise<PaymentCollectionDTO[]>
  upsertPaymentCollections(
    data: UpsertPaymentCollectionDTO,
    sharedContext?: Context
  ): Promise<PaymentCollectionDTO>

  @InjectManager()
  async upsertPaymentCollections(
    data: UpsertPaymentCollectionDTO | UpsertPaymentCollectionDTO[],
    @MedusaContext() sharedContext?: Context
  ): Promise<PaymentCollectionDTO | PaymentCollectionDTO[]> {
    const input = Array.isArray(data) ? data : [data]
    const forUpdate = input.filter(
      (collection): collection is UpdatePaymentCollectionDTO => !!collection.id
    )
    const forCreate = input.filter(
      (collection): collection is CreatePaymentCollectionDTO => !collection.id
    )

    const operations: Promise<PaymentCollection[]>[] = []

    if (forCreate.length) {
      operations.push(this.createPaymentCollections_(forCreate, sharedContext))
    }
    if (forUpdate.length) {
      operations.push(this.updatePaymentCollections_(forUpdate, sharedContext))
    }

    const result = (await promiseAll(operations)).flat()

    return await this.baseRepository_.serialize<
      PaymentCollectionDTO[] | PaymentCollectionDTO
    >(Array.isArray(data) ? result : result[0])
  }

  completePaymentCollections(
    paymentCollectionId: string,
    sharedContext?: Context
  ): Promise<PaymentCollectionDTO>
  completePaymentCollections(
    paymentCollectionId: string[],
    sharedContext?: Context
  ): Promise<PaymentCollectionDTO[]>

  @InjectManager()
  async completePaymentCollections(
    paymentCollectionId: string | string[],
    @MedusaContext() sharedContext?: Context
  ): Promise<PaymentCollectionDTO | PaymentCollectionDTO[]> {
    const input = Array.isArray(paymentCollectionId)
      ? paymentCollectionId.map((id) => ({
          id,
          completed_at: new Date(),
        }))
      : [{ id: paymentCollectionId, completed_at: new Date() }]

    // TODO: what checks should be done here? e.g. captured_amount === amount?

    const updated = await this.paymentCollectionService_.update(
      input,
      sharedContext
    )

    return await this.baseRepository_.serialize(
      Array.isArray(paymentCollectionId) ? updated : updated[0],
      { populate: true }
    )
  }

  @InjectManager()
  async createPaymentSession(
    paymentCollectionId: string,
    data: CreatePaymentSessionDTO,
    @MedusaContext() sharedContext?: Context
  ): Promise<PaymentSessionDTO> {
    let paymentSession: PaymentSession
    let res: PaymentProviderSessionResponse

    paymentSession = await this.paymentSessionService_.create(
      {
        payment_collection_id: paymentCollectionId,
        provider_id: data.provider_id,
        amount: data.amount,
        currency_code: data.currency_code,
        context: data.context,
        metadata: data.metadata,
      },
      sharedContext
    )

    try {
      res = await this.paymentProviderService_.createSession(data.provider_id, {
        context: { ...data.context, session_id: paymentSession.id },
        amount: data.amount,
        currency_code: data.currency_code,
        token: data.provider_token,
      })
    } catch (err) {
      await this.paymentSessionService_.delete(paymentSession.id, sharedContext)
      throw err
    }

    await this.handleProviderSessionResponse_(res, sharedContext)
    paymentSession = await this.paymentSessionService_.retrieve(
      paymentSession.id,
      {},
      sharedContext
    )

    return this.baseRepository_.serialize(paymentSession, { populate: true })
  }

  @InjectManager()
  async updatePaymentSession(
    data: UpdatePaymentSessionDTO,
    @MedusaContext() sharedContext?: Context
  ): Promise<PaymentSessionDTO> {
    if (
      !data.amount &&
      !data.context &&
      !data.provider_token &&
      !data.metadata
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        `The payment session update requires at least an amount, context, provider token or metadata.`
      )
    }

    const session = await this.paymentSessionService_.retrieve(data.id, {
      select: ["id", "data", "context", "provider_id", "metadata"],
    })

    await this.handleProviderSessionResponse_(
      await this.paymentProviderService_.updateSession(session.provider_id, {
        data: session.data,
        context: {
          ...session.context,
          ...data.context,
          session_id: session.id,
        },
        amount: data.amount,
        token: data.provider_token,
      }),
      sharedContext
    )

    if (data.amount || data.context || data.metadata) {
      const toUpdate: any = {}
      if (data.amount) toUpdate.amount = data.amount
      if (data.context)
        toUpdate.context = { ...session.context, ...data.context }
      if (data.metadata)
        toUpdate.metadata = { ...session.metadata, ...data.metadata }
      const updated = await this.paymentSessionService_.update(
        { id: session.id, ...toUpdate },
        sharedContext
      )
      return this.baseRepository_.serialize(updated[0], { populate: true })
    } else {
      return this.retrievePaymentSession(session.id, {}, sharedContext)
    }
  }

  @InjectManager()
  async deletePaymentSession(
    id: string,
    @MedusaContext() sharedContext?: Context
  ): Promise<void> {
    const session = await this.paymentSessionService_.retrieve(
      id,
      { select: ["id", "data", "provider_id"] },
      sharedContext
    )

    await this.paymentProviderService_.deleteSession(
      session.provider_id,
      session.data
    )

    await this.paymentSessionService_.delete(id, sharedContext)
  }

  @InjectManager()
  async authorizePaymentSession(
    id: string,
    data?: AuthorizePaymentSessionDTO,
    @MedusaContext() sharedContext?: Context
  ): Promise<PaymentDTO | void> {
    let paymentSession = await this.paymentSessionService_.retrieve(
      id,
      { select: ["data", "context", "provider_id"] },
      sharedContext
    )

    await this.handleProviderSessionResponse_(
      await this.paymentProviderService_.authorizePayment(
        paymentSession.provider_id,
        {
          data: paymentSession.data,
          context: {
            ...paymentSession.context,
            ...data?.context,
            session_id: paymentSession.id,
          },
          token: data?.provider_token,
        }
      ),
      sharedContext
    )

    paymentSession = await this.paymentSessionService_.retrieve(id, {
      relations: ["payment"],
    })
    if (paymentSession.payment) {
      return this.baseRepository_.serialize<PaymentDTO>(
        paymentSession.payment,
        { populate: true }
      )
    }
  }

  @InjectManager()
  private async authorizePaymentSession_(
    id: string,
    data?: PaymentProviderSessionResponse["data"],
    @MedusaContext() sharedContext?: Context
  ): Promise<Payment> {
    const session = await this.paymentSessionService_.retrieve(
      id,
      {
        select: [
          "id",
          "raw_amount",
          "currency_code",
          "payment_collection_id",
          "provider_id",
          "status",
        ],
        relations: ["payment"],
      },
      sharedContext
    )

    if (session.status === PaymentSessionStatus.CANCELED) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `The payment session: ${session.id} has been canceled.`
      )
    }

    if (session.payment) {
      return this.paymentService_.retrieve(
        session.payment.id,
        {},
        sharedContext
      )
    }

    await this.paymentSessionService_.update(
      {
        id,
        data,
        status: PaymentSessionStatus.AUTHORIZED,
        authorized_at: new Date(),
      },
      sharedContext
    )

    return this.paymentService_.create(
      {
        amount: session.raw_amount,
        currency_code: session.currency_code,
        payment_session: session.id,
        payment_collection_id: session.payment_collection_id,
        provider_id: session.provider_id,
        metadata: session.metadata,
        data,
      },
      sharedContext
    )
  }

  @InjectManager()
  async cancelPaymentSession(
    id: string,
    @MedusaContext() sharedContext?: Context
  ): Promise<PaymentSessionDTO> {
    const paymentSession = await this.paymentSessionService_.retrieve(
      id,
      { select: ["data", "provider_id"] },
      sharedContext
    )

    await this.handleProviderSessionResponse_(
      await this.paymentProviderService_.cancelPayment(
        paymentSession.provider_id,
        paymentSession.data
      ),
      sharedContext
    )

    return this.retrievePaymentSession(id, {}, sharedContext)
  }

  @InjectManager()
  private async cancelPaymentSession_(
    id: string,
    data?: PaymentProviderSessionResponse["data"],
    @MedusaContext() sharedContext?: Context
  ): Promise<PaymentSession> {
    const session = await this.paymentSessionService_.retrieve(
      id,
      { select: ["status"], relations: ["payment"] },
      sharedContext
    )

    if (session.status === PaymentSessionStatus.CANCELED) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `The payment session: ${session.id} has been canceled.`
      )
    }

    if (
      session.status !== PaymentSessionStatus.PENDING &&
      session.status !== PaymentSessionStatus.REQUIRES_MORE &&
      session.status !== PaymentSessionStatus.AUTHORIZED
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `The payment session: ${session.id} cannot be canceled.`
      )
    }

    if (session.payment) {
      await this.paymentService_.update(
        {
          id: session.payment.id,
          canceled_at: new Date(),
          data,
        },
        sharedContext
      )
    }

    const result = await this.paymentSessionService_.update(
      { id, data, status: PaymentSessionStatus.CANCELED },
      sharedContext
    )
    return result[0]
  }

  @InjectManager()
  // @ts-expect-error
  async listPaymentSessions(
    filters?: FilterablePaymentSessionProps,
    config?: FindConfig<PaymentSessionDTO>,
    sharedContext?: Context
  ): Promise<PaymentSessionDTO[]> {
    const sessions = await this.paymentSessionService_.list(
      filters,
      config,
      sharedContext
    )

    return await this.baseRepository_.serialize<PaymentSessionDTO[]>(sessions)
  }

  @InjectManager()
  async updatePayment(
    data: UpdatePaymentDTO,
    @MedusaContext() sharedContext?: Context
  ): Promise<PaymentDTO> {
    // NOTE: currently there is no update with the provider but maybe data could be updated
    const result = await this.paymentService_.update(data, sharedContext)

    return await this.baseRepository_.serialize<PaymentDTO>(result[0], {
      populate: true,
    })
  }

  @InjectManager()
  async capturePayment(
    paymentId: string,
    data?: CreateCaptureDTO,
    @MedusaContext() sharedContext?: Context
  ): Promise<PaymentDTO> {
    const payment = await this.paymentService_.retrieve(
      paymentId,
      { select: ["provider_id", "data"] },
      sharedContext
    )

    const res = await this.paymentProviderService_.capturePayment(
      payment.provider_id,
      payment.data!,
      data?.amount
    )
    res.event = {
      ...res.event,
      type: "capture",
      detail: {
        ...res.event?.detail,
        captured_by: data?.captured_by,
      },
    }

    await this.handleProviderSessionResponse_(res, sharedContext)

    return this.retrievePayment(paymentId, { relations: ["captures"] })
  }

  @InjectManager()
  private async capturePayment_(
    paymentId: string,
    data?: PaymentProviderSessionResponse["data"],
    { amount, captured_by }: CreateCaptureDTO = {},
    @MedusaContext() sharedContext?: Context
  ): Promise<Capture> {
    const payment = await this.paymentService_.retrieve(
      paymentId,
      {
        select: ["id", "raw_amount", "canceled_at", "captured_at"],
        relations: ["captures"],
      },
      sharedContext
    )

    if (payment.canceled_at) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `The payment: ${payment.id} has been canceled.`
      )
    }

    if (payment.captured_at) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `The payment: ${payment.id} has been captured.`
      )
    }

    const capturedAmount = payment.captures.reduce(
      (amount, { raw_amount }) => MathBN.add(amount, raw_amount),
      MathBN.convert(0)
    )
    const remainingToCapture = MathBN.sub(payment.raw_amount, capturedAmount)
    const newCaptureAmount = amount ? new BigNumber(amount) : remainingToCapture

    if (
      MathBN.lte(remainingToCapture, 0) ||
      MathBN.gt(newCaptureAmount, remainingToCapture)
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `You cannot capture more than the authorized amount subtracted by what is already captured.`
      )
    }

    if (MathBN.lte(newCaptureAmount, 0)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `You must capture amount more than 0.`
      )
    }

    // When the entire authorized amount has been captured, we return it as complete
    const totalCaptured = MathBN.convert(
      MathBN.add(capturedAmount, newCaptureAmount)
    )
    const isFullyCaptured = MathBN.gte(totalCaptured, payment.raw_amount)

    const capture = await this.captureService_.create(
      {
        payment: paymentId,
        amount: newCaptureAmount,
        created_by: captured_by,
        data,
      },
      sharedContext
    )

    await this.paymentService_.update(
      { id: paymentId, captured_at: isFullyCaptured ? new Date() : null, data },
      sharedContext
    )

    return capture
  }

  @InjectManager()
  async refundPayment(
    paymentId: string,
    data?: CreateRefundDTO,
    @MedusaContext() sharedContext?: Context
  ): Promise<PaymentDTO> {
    const payment = await this.paymentService_.retrieve(
      paymentId,
      { select: ["provider_id", "data"] },
      sharedContext
    )

    const res = await this.paymentProviderService_.refundPayment(
      payment.provider_id,
      payment.data!,
      data?.amount
    )
    res.event = {
      ...res.event,
      type: "refund",
      detail: {
        ...res.event?.detail,
        refunded_by: data?.created_by,
        reason: data?.note,
      },
    }

    await this.handleProviderSessionResponse_(res, sharedContext)

    return this.retrievePayment(paymentId, { relations: ["refunds"] })
  }

  @InjectManager()
  private async refundPayment_(
    paymentId: string,
    data?: PaymentProviderSessionResponse["data"],
    { amount, note, created_by }: CreateRefundDTO = {},
    @MedusaContext() sharedContext?: Context
  ): Promise<Refund> {
    const payment = await this.paymentService_.retrieve(
      paymentId,
      { relations: ["captures", "refunds"] },
      sharedContext
    )

    const capturedAmount = payment.captures.reduce(
      (amount, { raw_amount }) => MathBN.add(amount, raw_amount),
      MathBN.convert(0)
    )
    const refundedAmount = payment.refunds.reduce(
      (amount, { raw_amount }) => MathBN.add(amount, raw_amount),
      MathBN.convert(0)
    )
    const refundableAmount = MathBN.sub(capturedAmount, refundedAmount)
    const refundAmount = amount ? new BigNumber(amount) : refundableAmount

    if (
      MathBN.lte(refundableAmount, 0) ||
      MathBN.gt(refundAmount, refundableAmount)
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `You cannot refund more than what is captured on the payment.`
      )
    }

    if (MathBN.lte(refundAmount, 0)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `You must refund amount more than 0.`
      )
    }

    const refund = await this.refundService_.create(
      {
        payment: paymentId,
        amount: refundAmount,
        data,
        note,
        created_by,
      },
      sharedContext
    )

    await this.paymentService_.update({ id: paymentId, data }, sharedContext)

    return refund
  }

  @InjectManager()
  async cancelPayment(
    paymentId: string,
    @MedusaContext() sharedContext?: Context
  ): Promise<PaymentDTO> {
    const payment = await this.paymentService_.retrieve(
      paymentId,
      { select: ["id", "data", "provider_id"] },
      sharedContext
    )

    await this.handleProviderSessionResponse_(
      await this.paymentProviderService_.cancelPayment(
        payment.provider_id,
        payment.data!
      ),
      sharedContext
    )

    return this.retrievePayment(payment.id, {}, sharedContext)
  }

  @InjectManager()
  async processEvent(
    eventData: ProviderWebhookPayload,
    @MedusaContext() sharedContext?: Context
  ): Promise<void> {
    await this.handleProviderSessionResponse_(
      await this.paymentProviderService_.getWebhookActionAndData(
        `pp_${eventData.provider}`,
        eventData.payload
      ),
      sharedContext
    )
  }

  get webhookOptions() {
    return this.options.webhook
  }

  @InjectManager()
  async listPaymentProviders(
    filters: FilterablePaymentProviderProps = {},
    config: FindConfig<PaymentProviderDTO> = {},
    @MedusaContext() sharedContext?: Context
  ): Promise<PaymentProviderDTO[]> {
    const providers = await this.paymentProviderService_.list(
      filters,
      config,
      sharedContext
    )

    return await this.baseRepository_.serialize<PaymentProviderDTO[]>(
      providers,
      {
        populate: true,
      }
    )
  }

  @InjectManager()
  async listAndCountPaymentProviders(
    filters: FilterablePaymentProviderProps = {},
    config: FindConfig<PaymentProviderDTO> = {},
    @MedusaContext() sharedContext?: Context
  ): Promise<[PaymentProviderDTO[], number]> {
    const [providers, count] = await this.paymentProviderService_.listAndCount(
      filters,
      config,
      sharedContext
    )

    return [
      await this.baseRepository_.serialize<PaymentProviderDTO[]>(providers, {
        populate: true,
      }),
      count,
    ]
  }

  @InjectManager()
  private async maybeUpdatePaymentSession_(
    paymentSessionId: string,
    data?: PaymentProviderSessionResponse["data"],
    sharedContext?: Context
  ) {
    const paymentSession = await this.paymentSessionService_.retrieve(
      paymentSessionId,
      {
        select: ["raw_amount", "status"],
        relations: ["payment.captures", "payment.refunds"],
      },
      sharedContext
    )

    if (paymentSession.status === PaymentSessionStatus.CANCELED) return

    if (
      paymentSession.status === PaymentSessionStatus.PENDING ||
      paymentSession.status === PaymentSessionStatus.REQUIRES_MORE ||
      paymentSession.status === PaymentSessionStatus.PROCESSING
    ) {
      if (data) {
        await this.paymentSessionService_.update(
          { id: paymentSession.id, data },
          sharedContext
        )
      }
    } else {
      let status: PaymentSessionStatus = paymentSession.status

      if (paymentSession.payment!.canceled_at) {
        status = PaymentSessionStatus.CANCELED
      } else {
        const capturedAmount = paymentSession.payment!.captures.reduce(
          (amount, { raw_amount }) => MathBN.add(amount, raw_amount),
          MathBN.convert(0)
        )
        const refundedAmount = paymentSession.payment!.refunds.reduce(
          (amount, { raw_amount }) => MathBN.add(amount, raw_amount),
          MathBN.convert(0)
        )

        if (MathBN.gt(capturedAmount, 0)) {
          if (MathBN.gt(refundedAmount, 0)) {
            if (MathBN.lt(refundedAmount, capturedAmount)) {
              status = PaymentSessionStatus.PARTIALLY_REFUNDED
            } else {
              status = PaymentSessionStatus.REFUNDED
            }
          } else if (
            MathBN.lt(capturedAmount, paymentSession.payment!.raw_amount)
          ) {
            status = PaymentSessionStatus.PARTIALLY_CAPTURED
          } else {
            status = PaymentSessionStatus.CAPTURED
          }
        }
      }

      if (data || status !== paymentSession.status) {
        await this.paymentSessionService_.update(
          { id: paymentSession.id, data, status },
          sharedContext
        )
      }
    }
  }

  @InjectManager()
  private async maybeUpdatePaymentCollection_(
    paymentCollectionId: string,
    sharedContext?: Context
  ) {
    const paymentCollection = await this.paymentCollectionService_.retrieve(
      paymentCollectionId,
      {
        select: [
          "raw_amount",
          "status",
          "raw_authorized_amount",
          "raw_captured_amount",
          "raw_refunded_amount",
          "completed_at",
        ],
        relations: ["payments.captures", "payments.refunds"],
      },
      sharedContext
    )
    const payments = paymentCollection.payments.filter(
      (payment) => !payment.canceled_at
    )
    let status: PaymentCollectionStatus = paymentCollection.status

    const authorizedAmount = payments.reduce(
      (amount, { raw_amount }) => MathBN.add(amount, raw_amount),
      MathBN.convert(0)
    )
    const capturedAmount = payments
      .map(({ captures }) => captures.slice())
      .flat()
      .reduce(
        (amount, { raw_amount }) => MathBN.add(amount, raw_amount),
        MathBN.convert(0)
      )
    const refundedAmount = payments
      .map(({ refunds }) => refunds.slice())
      .flat()
      .reduce(
        (amount, { raw_amount }) => MathBN.add(amount, raw_amount),
        MathBN.convert(0)
      )
    const netCapturedAmount = MathBN.sub(capturedAmount, refundedAmount)

    if (MathBN.gt(capturedAmount, 0)) {
      if (MathBN.gt(refundedAmount, 0)) {
        if (MathBN.gt(paymentCollection.raw_amount, netCapturedAmount)) {
          if (MathBN.lt(refundedAmount, capturedAmount)) {
            if (paymentCollection.completed_at) {
              status = PaymentCollectionStatus.PARTIALLY_REFUNDED
            } else {
              status = PaymentCollectionStatus.PARTIALLY_PAID
            }
          } else {
            if (paymentCollection.completed_at) {
              status = PaymentCollectionStatus.REFUNDED
            } else {
              status = PaymentCollectionStatus.PENDING
            }
          }
        } else {
          status = PaymentCollectionStatus.PAID
        }
      } else if (MathBN.lt(capturedAmount, paymentCollection.raw_amount)) {
        status = PaymentCollectionStatus.PARTIALLY_PAID
      } else {
        status = PaymentCollectionStatus.PAID
      }
    } else if (MathBN.gt(authorizedAmount, 0)) {
      if (MathBN.lt(authorizedAmount, paymentCollection.raw_amount)) {
        status = PaymentCollectionStatus.PARTIALLY_AUTHORIZED
      } else {
        status = PaymentCollectionStatus.AUTHORIZED
      }
    }

    if (
      status !== paymentCollection.status ||
      !MathBN.eq(
        authorizedAmount,
        paymentCollection.raw_authorized_amount ?? 0
      ) ||
      !MathBN.eq(capturedAmount, paymentCollection.raw_captured_amount ?? 0) ||
      !MathBN.eq(refundedAmount, paymentCollection.raw_refunded_amount ?? 0)
    ) {
      await this.paymentCollectionService_.update(
        {
          id: paymentCollectionId,
          status,
          authorized_amount: authorizedAmount,
          captured_amount: capturedAmount,
          refunded_amount: refundedAmount,
        },
        sharedContext
      )
    }
  }

  @InjectManager()
  private async handleProviderSessionResponse_(
    {
      status,
      captured_amount,
      refunded_amount,
      data,
      context,
      event,
    }: PaymentProviderSessionResponse,
    @MedusaContext() sharedContext?: Context
  ) {
    const session_id = context.session_id
    if (!session_id) return

    switch (status) {
      case "authorized": {
        const payment = await this.authorizePaymentSession_(
          session_id,
          data,
          sharedContext
        )
        await this.maybeUpdatePaymentCollection_(payment.payment_collection_id)
        break
      }

      case "captured":
      case "partially_captured":
      case "refunded":
      case "partially_refunded": {
        const session = await this.paymentSessionService_.retrieve(
          session_id,
          {
            select: ["payment_collection_id"],
            relations: ["payment.captures", "payment.refunds"],
          },
          sharedContext
        )

        let payment = session.payment

        if (!payment) {
          const { id } = await this.authorizePaymentSession_(
            session_id,
            data,
            sharedContext
          )
          payment = await this.paymentService_.retrieve(
            id,
            {
              select: ["id", "raw_amount"],
              relations: ["captures", "refunds"],
            },
            sharedContext
          )
        }

        const _capturedAmount = payment.captures.reduce(
          (amount, { raw_amount }) => MathBN.add(amount, raw_amount),
          MathBN.convert(0)
        )
        const _refundedAmount = payment.refunds.reduce(
          (amount, { raw_amount }) => MathBN.add(amount, raw_amount),
          MathBN.convert(0)
        )

        if (MathBN.gt(captured_amount, _capturedAmount)) {
          await this.capturePayment_(
            payment.id,
            data,
            {
              amount: MathBN.sub(captured_amount, _capturedAmount),
              captured_by: event?.detail?.captured_by,
            },
            sharedContext
          )
        }
        if (MathBN.gt(refunded_amount, _refundedAmount)) {
          await this.refundPayment_(
            payment.id,
            data,
            {
              amount: MathBN.sub(refunded_amount, _refundedAmount),
              note: event?.detail?.reason,
              created_by: event?.detail?.refunded_by,
            },
            sharedContext
          )
        }
        await this.maybeUpdatePaymentSession_(session_id, data)
        await this.maybeUpdatePaymentCollection_(session.payment_collection_id)
        break
      }

      case "pending":
      case "requires_more":
      case "processing": {
        const session = await this.paymentSessionService_.retrieve(
          session_id,
          { select: ["status"] },
          sharedContext
        )
        if (
          (status === "processing" &&
            session.status !== PaymentSessionStatus.CANCELED) ||
          session.status === PaymentSessionStatus.PENDING ||
          session.status === PaymentSessionStatus.REQUIRES_MORE ||
          session.status === PaymentSessionStatus.PROCESSING
        ) {
          await this.paymentSessionService_.update(
            { id: session_id, data, status },
            sharedContext
          )
        }
        break
      }
      case "canceled": {
        const session = await this.cancelPaymentSession_(
          session_id,
          data,
          sharedContext
        )
        await this.maybeUpdatePaymentCollection_(session.payment_collection_id)
        break
      }
      default: {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Received invalid payment status: ${status}`
        )
      }
    }
  }
}
