import { EOL } from "os"

import Stripe from "stripe"

import {
  AuthorizePaymentProviderSession,
  BigNumberInput,
  CreatePaymentProviderSession,
  MedusaContainer,
  PaymentProviderError,
  PaymentProviderSessionResponse,
  PaymentSessionStatus,
  ProviderWebhookPayload,
  UpdatePaymentProviderSession,
} from "@medusajs/types"
import {
  AbstractPaymentProvider,
  isDefined,
  isPaymentProviderError,
} from "@medusajs/utils"
import { ErrorCodes, PaymentIntentOptions, StripeOptions } from "../types"
import {
  getAmountFromSmallestUnit,
  getSmallestUnit,
} from "../utils/get-smallest-unit"

abstract class StripeBase extends AbstractPaymentProvider<StripeOptions> {
  protected readonly options_: StripeOptions
  protected stripe_: Stripe
  protected container_: MedusaContainer

  static validateOptions(options: StripeOptions): void {
    if (!isDefined(options.apiKey)) {
      throw new Error("Required option `apiKey` is missing in Stripe plugin")
    }
  }

  protected constructor(container: MedusaContainer, options: StripeOptions) {
    // @ts-ignore
    super(...arguments)

    this.container_ = container
    this.options_ = options

    this.stripe_ = new Stripe(options.apiKey)
  }

  abstract get paymentIntentOptions(): PaymentIntentOptions

  get options(): StripeOptions {
    return this.options_
  }

  getPaymentIntentOptions(): PaymentIntentOptions {
    const options: PaymentIntentOptions = {}

    if (this?.paymentIntentOptions?.capture_method) {
      options.capture_method = this.paymentIntentOptions.capture_method
    }

    if (this?.paymentIntentOptions?.setup_future_usage) {
      options.setup_future_usage = this.paymentIntentOptions.setup_future_usage
    }

    if (this?.paymentIntentOptions?.payment_method_types) {
      options.payment_method_types =
        this.paymentIntentOptions.payment_method_types
    }

    return options
  }

  async initiatePayment(
    data: CreatePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    const intentRequestData = this.getPaymentIntentOptions()
    const {
      email,
      session_id,
      cart_id,
      order_id,
      customer,
      payment_description,
    } = data.context
    const { currency_code, amount, token } = data

    const description = (payment_description ??
      this.options_?.paymentDescription) as string

    const intentRequest: Stripe.PaymentIntentCreateParams = {
      description,
      amount: getSmallestUnit(amount, currency_code),
      currency: currency_code,
      payment_method: token,
      confirm: !!token,
      metadata: {
        session_id: session_id as string | null,
        cart_id: cart_id as string | null,
        order_id: order_id as string | null,
      },
      capture_method: this.options_.capture ? "automatic" : "manual",
      expand: ["latest_charge"],
      ...intentRequestData,
    }

    const automaticPaymentMethods = this.options_?.automaticPaymentMethods
    if (automaticPaymentMethods) {
      intentRequest.automatic_payment_methods =
        typeof automaticPaymentMethods === "boolean"
          ? { enabled: true }
          : automaticPaymentMethods
    }

    if (customer?.metadata?.stripe_id) {
      intentRequest.customer = customer.metadata.stripe_id as string
    } else if (this.options_.createCustomer) {
      let stripeCustomer
      try {
        stripeCustomer = await this.stripe_.customers.create({
          email,
        })
      } catch (e) {
        return this.buildError(
          "An error occurred in initiatePayment when creating a Stripe customer",
          e
        )
      }

      intentRequest.customer = stripeCustomer.id
    }

    try {
      const intent = await this.stripe_.paymentIntents.create(intentRequest)
      return {
        ...(await this.buildResponse(intent)),
        data: intent as unknown as Record<string, unknown>,
        context: intent.metadata,
      }
    } catch (e) {
      return this.buildError(
        "An error occurred in initiatePayment during the creation of the stripe payment intent",
        e
      )
    }
  }

  async authorizePayment(
    data: AuthorizePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    const { id } = data.data as unknown as Stripe.PaymentIntent
    try {
      const intent = await this.stripe_.paymentIntents.confirm(id, {
        payment_method: data.token,
        expand: ["latest_charge"],
      })
      return {
        ...(await this.buildResponse(intent)),
        data: intent as unknown as Record<string, unknown>,
        context: intent.metadata,
      }
    } catch (e) {
      return this.buildError(
        "An error occurred in authorizePayment during the confirm of the stripe payment intent",
        e
      )
    }
  }

  async cancelPayment(
    paymentSessionData: PaymentProviderSessionResponse["data"]
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    const { id } = paymentSessionData as unknown as Stripe.PaymentIntent
    try {
      const intent = await this.stripe_.paymentIntents.cancel(id, {
        expand: ["latest_charge"],
      })
      return {
        ...(await this.buildResponse(intent)),
        data: intent as unknown as Record<string, unknown>,
        context: intent.metadata,
      }
    } catch (error) {
      const intent = error.payment_intent as Stripe.PaymentIntent | undefined
      if (intent?.status === "canceled") {
        return {
          ...(await this.buildResponse(intent)),
          data: intent as unknown as Record<string, unknown>,
          context: intent.metadata,
        }
      }

      return this.buildError("An error occurred in cancelPayment", error)
    }
  }

  async capturePayment(
    paymentSessionData: PaymentProviderSessionResponse["data"],
    captureAmount?: BigNumberInput
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    const { id, currency } =
      paymentSessionData as unknown as Stripe.PaymentIntent
    try {
      const intent = await this.stripe_.paymentIntents.capture(id, {
        amount_to_capture: captureAmount
          ? getSmallestUnit(captureAmount, currency)
          : undefined,
        final_capture: false,
        expand: ["latest_charge"],
      })
      return {
        ...(await this.buildResponse(intent)),
        data: intent as unknown as Record<string, unknown>,
        context: intent.metadata,
      }
    } catch (error) {
      if (error.code === ErrorCodes.PAYMENT_INTENT_UNEXPECTED_STATE) {
        const intent = error.payment_intent as Stripe.PaymentIntent | undefined
        if (intent?.status === "succeeded") {
          return {
            ...(await this.buildResponse(intent)),
            data: intent as unknown as Record<string, unknown>,
            context: intent.metadata,
          }
        }
      }

      return this.buildError("An error occurred in capturePayment", error)
    }
  }

  async deletePayment(
    paymentSessionData: PaymentProviderSessionResponse["data"]
  ): Promise<PaymentProviderError | void> {
    const res = await this.cancelPayment(paymentSessionData)
    if (isPaymentProviderError(res)) return res
  }

  async refundPayment(
    paymentSessionData: PaymentProviderSessionResponse["data"],
    refundAmount?: BigNumberInput
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    const { id, currency } =
      paymentSessionData as unknown as Stripe.PaymentIntent
    try {
      await this.stripe_.refunds.create({
        payment_intent: id,
        amount: refundAmount
          ? getSmallestUnit(refundAmount, currency)
          : undefined,
      })
      const intent = await this.stripe_.paymentIntents.retrieve(id, {
        expand: ["latest_charge"],
      })
      return {
        ...(await this.buildResponse(intent)),
        data: intent as unknown as Record<string, unknown>,
        context: intent.metadata,
      }
    } catch (e) {
      return this.buildError("An error occurred in refundPayment", e)
    }
  }

  async retrievePayment(
    paymentSessionData: PaymentProviderSessionResponse["data"]
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    const { id } = paymentSessionData as unknown as Stripe.PaymentIntent
    try {
      const intent = await this.stripe_.paymentIntents.retrieve(id, {
        expand: ["latest_charge"],
      })
      return {
        ...(await this.buildResponse(intent)),
        data: intent as unknown as Record<string, unknown>,
        context: intent.metadata,
      }
    } catch (e) {
      return this.buildError("An error occurred in retrievePayment", e)
    }
  }

  async updatePayment(
    data: UpdatePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    const { id, currency } = data.data as unknown as Stripe.PaymentIntent
    const { context, amount, token } = data
    try {
      const toUpdate: Stripe.PaymentIntentUpdateParams = {}
      if (context) {
        toUpdate.metadata = {
          session_id: context.session_id as string | null,
          cart_id: context.cart_id as string | null,
          order_id: context.order_id as string | null,
        }
      }
      if (amount) toUpdate.amount = getSmallestUnit(amount, currency)
      if (token) toUpdate.payment_method = token
      const intent = await this.stripe_.paymentIntents.update(id, {
        ...toUpdate,
        expand: ["latest_charge"],
      })
      return {
        ...(await this.buildResponse(intent)),
        data: intent as unknown as Record<string, unknown>,
        context: intent.metadata,
      }
    } catch (e) {
      return this.buildError("An error occurred in updatePayment", e)
    }
  }

  async getWebhookActionAndData(
    data: ProviderWebhookPayload["payload"]
  ): Promise<PaymentProviderSessionResponse> {
    const event = this.constructWebhookEvent(data)
    let intent: Stripe.PaymentIntent

    if (event.data.object.object === "payment_intent") {
      intent = event.data.object
    } else if (event.data.object.object === "charge") {
      if (!event.data.object.payment_intent) {
        throw new Error(
          `Charge doesn't have a associated payment intent: ${event.type} ${event.data.object.id}.`
        )
      }
      intent = await this.stripe_.paymentIntents.retrieve(
        event.data.object.payment_intent as string,
        { expand: ["latest_charge"] }
      )
    } else if (event.data.object.object === "invoice") {
      // TODO
      throw new Error(`Unexpected event type: ${event.type}.`)
    } else {
      throw new Error(`Unexpected event type: ${event.type}.`)
    }

    return {
      ...(await this.buildResponse(intent)),
      data: intent as unknown as Record<string, unknown>,
      context: intent.metadata,
    }
  }

  /**
   * Constructs Stripe Webhook event
   * @param {object} data - the data of the webhook request: req.body
   *    ensures integrity of the webhook event
   * @return {object} Stripe Webhook event
   */
  constructWebhookEvent(data: ProviderWebhookPayload["payload"]): Stripe.Event {
    const signature = data.headers["stripe-signature"] as string

    return this.stripe_.webhooks.constructEvent(
      data.rawData as string | Buffer,
      signature,
      this.options_.webhookSecret
    )
  }

  protected buildError(
    message: string,
    error: Stripe.StripeRawError | PaymentProviderError | Error
  ): PaymentProviderError {
    return {
      error: message,
      code: "code" in error ? error.code : "unknown",
      detail: isPaymentProviderError(error)
        ? `${error.error}${EOL}${error.detail ?? ""}`
        : "detail" in error
        ? error.detail
        : error.message ?? "",
    }
  }

  protected async buildResponse(
    intent: Stripe.PaymentIntent
  ): Promise<
    Pick<
      PaymentProviderSessionResponse,
      "status" | "capturedAmount" | "refundedAmount"
    >
  > {
    let status: PaymentSessionStatus

    switch (intent.status) {
      case "requires_action": {
        status = "requires_more"
        break
      }
      case "processing": {
        status = "processing"
        break
      }
      case "requires_capture": {
        status = "authorized"
        break
      }
      case "succeeded": {
        status = "captured"
        break
      }
      case "canceled": {
        status = "canceled"
        break
      }
      default:
        status = "pending"
    }

    let capturedAmount = 0
    let refundedAmount = 0

    if (status === "authorized" || status === "captured") {
      let charge: Stripe.Charge
      if (typeof intent.latest_charge === "string") {
        charge = await this.stripe_.charges.retrieve(intent.latest_charge)
      } else {
        charge = intent.latest_charge as Stripe.Charge
      }
      const authorizedAmount = getAmountFromSmallestUnit(
        charge.amount,
        charge.currency
      )
      capturedAmount = getAmountFromSmallestUnit(
        charge.amount_captured,
        charge.currency
      )
      refundedAmount = getAmountFromSmallestUnit(
        charge.amount_refunded,
        charge.currency
      )
      if (capturedAmount > 0) {
        if (refundedAmount > 0) {
          if (capturedAmount === refundedAmount) {
            status = "refunded"
          } else {
            status = "partially_refunded"
          }
        } else if (capturedAmount < authorizedAmount) {
          status = "partially_captured"
        }
      }
    }

    return {
      status,
      capturedAmount,
      refundedAmount,
    }
  }
}

export default StripeBase
