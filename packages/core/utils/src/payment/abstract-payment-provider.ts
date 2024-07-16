import {
  AuthorizePaymentProviderSession,
  BigNumberInput,
  CreatePaymentProviderSession,
  IPaymentProvider,
  MedusaContainer,
  PaymentProviderError,
  PaymentProviderSessionResponse,
  ProviderWebhookPayload,
  UpdatePaymentProviderSession,
} from "@medusajs/types"

/**
 * ## Overview
 *
 * A payment provider is used to handle and process payments, such as authorizing, capturing, and refund payments.
 *
 * :::note
 *
 * This guide is a work in progress.
 *
 * :::
 *
 * ---
 *
 * ## How to Create a Payment Provider
 *
 * A payment provider is a TypeScript or JavaScript class that extends the `AbstractPaymentProvider` class imported from `@medusajsa/utils`.
 *
 * You can create the payment provider in a module or plugin, then pass that module/plugin in the Payment Module's `providers` option. You can also pass the path to the file
 * that defines the provider if it's created in the Medusa application's codebase.
 *
 * For example:
 *
 * ```ts
 * abstract class MyPayment extends AbstractPaymentProvider<MyConfigurations> {
 *   // ...
 * }
 * ```
 *
 * ---
 *
 * ## Configuration Type Parameter
 *
 * The `AbstractPaymentProvider` class accepts an optional type parameter that defines the type of configuration that your payment provider expects.
 *
 * For example:
 *
 * ```ts
 * interface MyConfigurations {
 *   apiKey: string
 * }
 *
 * abstract class MyPayment extends AbstractPaymentProvider<MyConfigurations> {
 *   // ...
 * }
 * ```
 *
 * ---
 *
 * ## Identifier Property
 *
 * The `PaymentProvider` data model has 2 properties: `id` and `is_enabled`.
 *
 * ```ts
 * class MyPaymentProvider extends AbstractPaymentProvider<MyConfigurations> {
 *   static identifier = "my-payment"
 *   // ...
 * }
 * ```
 *
 * ---
 *
 * ## PROVIDER Property
 *
 * The `PROVIDER` static property is used when registering the provider in the module's container. Typically, it would have the
 * same value as the `identifier` property.
 *
 * ```ts
 * class MyPaymentProvider extends AbstractPaymentProvider<MyConfigurations> {
 *   static PROVIDER = "my-payment"
 *   // ...
 * }
 * ```
 *
 * ---
 *
 * ## PaymentProviderError
 *
 * Before diving into the methods of the Payment Provider, you'll notice that part of the expected return signature of these method includes `PaymentProviderError`.
 *
 * ```ts
 * interface PaymentProviderError {
 *   error: string
 *   code?: string
 *   detail?: any
 * }
 * ```
 *
 * While implementing the Payment Provider's methods, if you need to inform the Payment Module that an error occurred at a certain stage,
 * return an object having the attributes defined in the `PaymentProviderError` interface.
 *
 * For example, the Stripe payment provider has the following method to create the error object, which is used within other methods:
 *
 * ```ts
 * abstract class StripeBase extends AbstractPaymentProvider {
 *   // ...
 *   protected buildError(
 *    message: string,
 *    error: Stripe.StripeRawError | PaymentProviderError | Error
 *  ): PaymentProviderError {
 *    return {
 *      error: message,
 *      code: "code" in error ? error.code : "unknown",
 *      detail: isPaymentProviderError(error)
 *        ? `${error.error}${EOL}${error.detail ?? ""}`
 *        : "detail" in error
 *        ? error.detail
 *        : error.message ?? "",
 *    }
 *  }
 *
 *   // used in other methods
 *   async retrievePayment(
 *     paymentSessionData: PaymentProviderSessionResponse["data"]
 *   ): Promise<
 *     PaymentProviderError |
 *     PaymentProviderSessionResponse["session_data"]
 *   > {
 *     try {
 *       // ...
 *     } catch (e) {
 *       return this.buildError(
 *         "An error occurred in retrievePayment",
 *         e
 *       )
 *     }
 *   }
 * }
 * ```
 *
 */
export abstract class AbstractPaymentProvider<TConfig = Record<string, unknown>>
  implements IPaymentProvider
{
  /**
   * Override this static method in order for the loader to validate the options provided to the module provider.
   * @param options
   */
  static validateOptions(options: Record<any, any>): void | never {}

  /**
   * You can use the `constructor` of the provider's service to access resources in your module's container.
   *
   * You can also use the constructor to initialize your integration with the third-party provider. For example, if you use a client to connect to the third-party provider’s APIs,
   * you can initialize it in the constructor and use it in other methods in the service.
   *
   * The provider can also access the module's options as a second parameter.
   *
   * @param {MedusaContainer} container - The module's container used to resolve resources.
   * @param {Record<string, unknown>} config - The options passed to the payment module provider.
   *
   * @example
   * ```ts
   * import {
   *   AbstractPaymentProvider
   * } from "@medusajs/utils"
   * import { Logger } from "@medusajs/types"
   *
   * type InjectedDependencies = {
   *   logger: Logger
   * }
   *
   * type Options = {
   *   apiKey: string
   * }
   *
   * class MyPaymentProviderService extends AbstractPaymentProvider<
   *   Options
   * > {
   *   protected logger_: Logger
   *   protected options_: Options
   *   // Assuming you're using a client to integrate
   *   // with a third-party service
   *   protected client
   *
   *   constructor(
   *     { logger }: InjectedDependencies,
   *     options: Options
   *   ) {
   *     // @ts-ignore
   *     super(...arguments)
   *
   *     this.logger_ = logger
   *     this.options_ = options
   *
   *     // Assuming you're initializing a client
   *     this.client = new Client(options)
   *   }
   *
   *   // ...
   * }
   *
   * export default MyPaymentProviderService
   * ```
   */
  protected constructor(
    protected readonly container: MedusaContainer,
    protected readonly config: TConfig = {} as TConfig // eslint-disable-next-line @typescript-eslint/no-empty-function
  ) {}

  /**
   * @ignore
   */
  static _isPaymentProvider = true

  /**
   * @ignore
   */
  static isPaymentProvider(object): boolean {
    return object?.constructor?._isPaymentProvider
  }

  /**
   * Each payment provider has a unique identifier defined in its class.
   *
   * @example
   * class MyPaymentProviderService extends AbstractPaymentProvider<
   *   Options
   * > {
   *   static identifier = "my-payment"
   *   // ...
   * }
   * ```
   */
  public static identifier: string

  /**
   * @ignore
   *
   * Return a unique identifier to retrieve the payment plugin provider
   */
  public getIdentifier(): string {
    const ctr = this.constructor as typeof AbstractPaymentProvider

    if (!ctr.identifier) {
      throw new Error(`Missing static property "identifier".`)
    }

    return ctr.identifier
  }

  /**
   * This method is used to capture a payment. The payment is captured in one of the following scenarios:
   *
   * - The {@link authorizePayment} method returns the status `captured`, which automatically executed this method after authorization.
   * - The merchant requests to capture the payment after its associated payment session was authorized.
   * - A webhook event occurred that instructs the payment provider to capture the payment session. Learn more about handing webhook events in [this guide](https://docs.medusajs.com/v2/resources/commerce-modules/payment/webhook-events).
   *
   * In this method, use the third-party provider to capture the payment.
   *
   * @param paymentData - The `data` property of the payment. Make sure to store in it
   * any helpful identification for your third-party integration.
   * @returns The new data to store in the payment's `data` property, or an error object.
   *
   * @example
   * // other imports...
   * import {
   *   PaymentProviderError,
   *   PaymentProviderSessionResponse,
   * } from "@medusajs/types"
   *
   * class MyPaymentProviderService extends AbstractPaymentProvider<
   *   Options
   * > {
   *   async capturePayment(
   *     paymentData: Record<string, unknown>
   *   ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
   *     const externalId = paymentData.id
   *
   *     try {
   *       const newData = await this.client.capturePayment(externalId)
   *
   *       return {
   *         ...newData,
   *         id: externalId
   *       }
   *     } catch (e) {
   *       return {
   *         error: e,
   *         code: "unknown",
   *         detail: e
   *       }
   *     }
   *   }
   *
   *   // ...
   * }
   */
  abstract capturePayment(
    paymentSessionData: PaymentProviderSessionResponse["data"],
    captureAmount?: BigNumberInput
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse>

  /**
   * This method authorizes a payment session. When authorized successfully, a payment is created by the Payment
   * Module which can be later captured using the {@link capturePayment} method.
   *
   * Refer to [this guide](https://docs.medusajs.com/v2/resources/commerce-modules/payment/payment-flow#3-authorize-payment-session)
   * to learn more about how this fits into the payment flow and how to handle required actions.
   *
   * To automatically capture the payment after authorization, return the status `captured`.
   *
   * @param paymentSessionData - The `data` property of the payment session. Make sure to store in it
   * any helpful identification for your third-party integration.
   * @param context - The context in which the payment is being authorized. For example, in checkout,
   * the context has a `cart_id` property indicating the ID of the associated cart.
   * @returns Either an object of the new data to store in the created payment's `data` property and the
   * payment's status, or an error object. Make sure to set in `data` anything useful to later retrieve the session.
   *
   * @example
   * // other imports...
   * import {
   *   PaymentProviderError,
   *   PaymentProviderSessionResponse,
   *   PaymentSessionStatus
   * } from "@medusajs/types"
   *
   *
   * class MyPaymentProviderService extends AbstractPaymentProvider<
   *   Options
   * > {
   *   async authorizePayment(
   *     paymentSessionData: Record<string, unknown>,
   *     context: Record<string, unknown>
   *   ): Promise<
   *     PaymentProviderError | {
   *       status: PaymentSessionStatus
   *       data: PaymentProviderSessionResponse["data"]
   *     }
   *   > {
   *     const externalId = paymentSessionData.id
   *
   *     try {
   *       const paymentData = await this.client.authorizePayment(externalId)
   *
   *       return {
   *         data: {
   *           ...paymentData,
   *           id: externalId
   *         },
   *         status: "authorized"
   *       }
   *     } catch (e) {
   *       return {
   *         error: e,
   *         code: "unknown",
   *         detail: e
   *       }
   *     }
   *   }
   *
   *   // ...
   * }
   */
  abstract authorizePayment(
    data: AuthorizePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse>

  /**
   * This method cancels a payment.
   *
   * @param paymentData - The `data` property of the payment. Make sure to store in it
   * any helpful identification for your third-party integration.
   * @returns An error object if an error occurs, or the data received from the integration.
   *
   * @example
   * // other imports...
   * import {
   *   PaymentProviderError,
   *   PaymentProviderSessionResponse,
   * } from "@medusajs/types"
   *
   *
   * class MyPaymentProviderService extends AbstractPaymentProvider<
   *   Options
   * > {
   *   async cancelPayment(
   *     paymentData: Record<string, unknown>
   *   ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
   *     const externalId = paymentData.id
   *
   *     try {
   *       const paymentData = await this.client.cancelPayment(externalId)
   *     } catch (e) {
   *       return {
   *         error: e,
   *         code: "unknown",
   *         detail: e
   *       }
   *     }
   *   }
   *
   *   // ...
   * }
   */
  abstract cancelPayment(
    paymentSessionData: PaymentProviderSessionResponse["data"]
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse>

  /**
   * This method is used when a payment session is created. It can be used to initiate the payment
   * in the third-party session, before authorizing or capturing the payment later.
   *
   * @param context - The details of the payment session and its context.
   * @returns An object whose `data` property is set in the created payment session, or an error
   * object. Make sure to set in `data` anything useful to later retrieve the session.
   *
   * @example
   * // other imports...
   * import {
   *   PaymentProviderError,
   *   PaymentProviderSessionResponse,
   * } from "@medusajs/types"
   *
   *
   * class MyPaymentProviderService extends AbstractPaymentProvider<
   *   Options
   * > {
   *   async initiatePayment(
   *     context: CreatePaymentProviderSession
   *   ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
   *     const {
   *       amount,
   *       currency_code,
   *       context: customerDetails
   *     } = context
   *
   *     try {
   *       const response = await this.client.init(
   *         amount, currency_code, customerDetails
   *       )
   *
   *       return {
   *         ...response,
   *         data: {
   *           id: response.id
   *         }
   *       }
   *     } catch (e) {
   *       return {
   *         error: e,
   *         code: "unknown",
   *         detail: e
   *       }
   *     }
   *   }
   *
   *   // ...
   * }
   */
  abstract initiatePayment(
    data: CreatePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse>

  /**
   * This method is used when a payment session is deleted, which can only happen if it isn't authorized, yet.
   *
   * Use this to delete or cancel the payment in the third-party service.
   *
   * @param paymentSessionData - The `data` property of the payment session. Make sure to store in it
   * any helpful identification for your third-party integration.
   * @returns An error object or the response from the third-party service.
   *
   * @example
   * // other imports...
   * import {
   *   PaymentProviderError,
   *   PaymentProviderSessionResponse,
   * } from "@medusajs/types"
   *
   *
   * class MyPaymentProviderService extends AbstractPaymentProvider<
   *   Options
   * > {
   *   async deletePayment(
   *     paymentSessionData: Record<string, unknown>
   *   ): Promise<
   *     PaymentProviderError | PaymentProviderSessionResponse["data"]
   *   > {
   *     const externalId = paymentSessionData.id
   *
   *     try {
   *       await this.client.cancelPayment(externalId)
   *     } catch (e) {
   *       return {
   *         error: e,
   *         code: "unknown",
   *         detail: e
   *       }
   *     }
   *   }
   *
   *   // ...
   * }
   */
  abstract deletePayment(
    paymentSessionData: PaymentProviderSessionResponse["data"]
  ): Promise<PaymentProviderError | void>

  /**
   * This method refunds an amount of a payment previously captured.
   *
   * @param paymentData - The `data` property of the payment. Make sure to store in it
   * any helpful identification for your third-party integration.
   * @param refundAmount The amount to refund.
   * @returns The new data to store in the payment's `data` property, or an error object.
   *
   * @example
   * // other imports...
   * import {
   *   PaymentProviderError,
   *   PaymentProviderSessionResponse,
   * } from "@medusajs/types"
   *
   *
   * class MyPaymentProviderService extends AbstractPaymentProvider<
   *   Options
   * > {
   *   async refundPayment(
   *     paymentData: Record<string, unknown>,
   *     refundAmount: number
   *   ): Promise<
   *     PaymentProviderError | PaymentProviderSessionResponse["data"]
   *   > {
   *     const externalId = paymentData.id
   *
   *     try {
   *       const newData = await this.client.refund(
   *         externalId,
   *         refundAmount
   *       )
   *
   *       return {
   *         ...newData,
   *         id: externalId
   *       }
   *     } catch (e) {
   *       return {
   *         error: e,
   *         code: "unknown",
   *         detail: e
   *       }
   *     }
   *   }
   *
   *   // ...
   * }
   */
  abstract refundPayment(
    paymentSessionData: PaymentProviderSessionResponse["data"],
    refundAmount?: BigNumberInput
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse>

  /**
   * Retrieves the payment's data from the third-party service.
   *
   * @param paymentSessionData - The `data` property of the payment. Make sure to store in it
   * any helpful identification for your third-party integration.
   * @returns An object to be stored in the payment's `data` property, or an error object.
   *
   * @example
   * // other imports...
   * import {
   *   PaymentProviderError,
   *   PaymentProviderSessionResponse,
   * } from "@medusajs/types"
   *
   *
   * class MyPaymentProviderService extends AbstractPaymentProvider<
   *   Options
   * > {
   *   async retrievePayment(
   *     paymentSessionData: Record<string, unknown>
   *   ): Promise<
   *     PaymentProviderError | PaymentProviderSessionResponse["data"]
   *   > {
   *     const externalId = paymentSessionData.id
   *
   *     try {
   *       return await this.client.retrieve(externalId)
   *     } catch (e) {
   *       return {
   *         error: e,
   *         code: "unknown",
   *         detail: e
   *       }
   *     }
   *   }
   *
   *   // ...
   * }
   */
  abstract retrievePayment(
    paymentSessionData: PaymentProviderSessionResponse["data"]
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse>

  /**
   * Update a payment in the third-party service that was previously initiated with the {@link initiatePayment} method.
   *
   * @param context - The details of the payment session and its context.
   * @returns An object whose `data` property is set in the updated payment session, or an error
   * object. Make sure to set in `data` anything useful to later retrieve the session.
   *
   * @example
   * // other imports...
   * import {
   *   UpdatePaymentProviderSession,
   *   PaymentProviderError,
   *   PaymentProviderSessionResponse,
   * } from "@medusajs/types"
   *
   *
   * class MyPaymentProviderService extends AbstractPaymentProvider<
   *   Options
   * > {
   *   async updatePayment(
   *     context: UpdatePaymentProviderSession
   *   ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
   *     const {
   *       amount,
   *       currency_code,
   *       context: customerDetails,
   *       data
   *     } = context
   *     const externalId = data.id
   *
   *     try {
   *       const response = await this.client.update(
   *         externalId,
   *         {
   *           amount,
   *           currency_code,
   *           customerDetails
   *         }
   *       )
   *
   *       return {
   *         ...response,
   *         data: {
   *           id: response.id
   *         }
   *       }
   *     } catch (e) {
   *       return {
   *         error: e,
   *         code: "unknown",
   *         detail: e
   *       }
   *     }
   *   }
   *
   *   // ...
   * }
   */
  abstract updatePayment(
    data: UpdatePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse>

  /**
   * This method is executed when a webhook event is received from the third-party payment provider. Use it
   * to process the action of the payment provider.
   *
   * Learn more in [this documentation](https://docs.medusajs.com/v2/resources/commerce-modules/payment/webhook-events)
   *
   * @param data - The webhook event's data
   * @returns The webhook result. If the `action`'s value is `captured`, the payment is captured within Medusa as well.
   * If the `action`'s value is `authorized`, the associated payment session is authorized within Medusa.
   *
   * @example
   * // other imports...
   * import {
   *   BigNumber
   * } from "@medusajs/utils"
   * import {
   *   ProviderWebhookPayload,
   *   WebhookActionResult
   * } from "@medusajs/types"
   *
   *
   * class MyPaymentProviderService extends AbstractPaymentProvider<
   *   Options
   * > {
   *   async getWebhookActionAndData(
   *     payload: ProviderWebhookPayload["payload"]
   *   ): Promise<WebhookActionResult> {
   *     const {
   *       data,
   *       rawData,
   *       headers
   *     } = payload
   *
   *     try {
   *       switch(data.event_type) {
   *         case "authorized_amount":
   *           return {
   *             action: "authorized",
   *             data: {
   *               session_id: (data.metadata as Record<string, any>).session_id,
   *               amount: new BigNumber(data.amount as number)
   *             }
   *           }
   *         case "success":
   *           return {
   *             action: "captured",
   *             data: {
   *               session_id: (data.metadata as Record<string, any>).session_id,
   *               amount: new BigNumber(data.amount as number)
   *             }
   *           }
   *         default:
   *           return {
   *             action: "not_supported"
   *           }
   *       }
   *     } catch (e) {
   *       return {
   *         action: "failed",
   *         data: {
   *           session_id: (data.metadata as Record<string, any>).session_id,
   *           amount: new BigNumber(data.amount as number)
   *         }
   *       }
   *     }
   *   }
   *
   *   // ...
   * }
   */
  abstract getWebhookActionAndData(
    data: ProviderWebhookPayload["payload"]
  ): Promise<PaymentProviderSessionResponse>
}

/**
 * @ignore
 */
export function isPaymentProviderError(obj: any): obj is PaymentProviderError {
  return (
    obj &&
    typeof obj === "object" &&
    "error" in obj &&
    "code" in obj &&
    "detail" in obj
  )
}
