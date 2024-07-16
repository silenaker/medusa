import { AddressDTO } from "../address"
import { CustomerDTO } from "../customer"
import { BigNumberInput, BigNumberValue } from "../totals"
import { PaymentSessionStatus } from "./common"
import { ProviderWebhookPayload } from "./mutations"

/**
 * The address of the payment.
 */
export type PaymentAddressDTO = Partial<AddressDTO>

/**
 * The customer of the payment.
 */
export type PaymentCustomerDTO = Partial<CustomerDTO>

/**
 * @interface
 *
 * Context data provided to the payment provider.
 */
export type PaymentProviderContext = Record<string, unknown> & {
  /**
   * The payment's billing address.
   */
  billing_address?: PaymentAddressDTO

  /**
   * The associated customer's email.
   */
  email?: string

  /**
   * The associated payment session's ID.
   */
  session_id?: string

  /**
   * The associated cart's ID.
   */
  cart_id?: string

  /**
   * The associated order's ID.
   */
  order_id?: string

  /**
   * The associated customer detail
   */
  customer?: PaymentCustomerDTO
}

/**
 * @interface
 *
 * The data used initiate a payment in a provider
 */
export type CreatePaymentProviderSession = {
  /**
   * A context necessary for the payment provider.
   */
  context: PaymentProviderContext

  /**
   * The amount to be authorized.
   */
  amount: BigNumberInput

  /**
   * The ISO 3 character currency code.
   */
  currency_code: string

  /*
   * The payment method token
   */
  token?: string
}

/**
 * @interface
 *
 * The attributes to update a payment in a provider.
 */
export type UpdatePaymentProviderSession = {
  /**
   * The `data` field of the payment session.
   */
  data: Record<string, unknown>

  /**
   * A context necessary for the payment provider.
   */
  context?: PaymentProviderContext

  /**
   * The amount to be authorized.
   */
  amount?: BigNumberInput

  /*
   * The payment method token
   */
  token?: string
}

/**
 * @interface
 *
 * The attributes to authorize a payment in a provider.
 */
export type AuthorizePaymentProviderSession = {
  /**
   * The `data` field of the payment session.
   */
  data: Record<string, unknown>

  /*
   * The payment method token
   */
  token?: string
}

/**
 * @interface
 *
 * The response of operations on a payment.
 */
export type PaymentProviderSessionResponse = {
  /**
   * The status of the payment, which will be stored in the payment session's `status` field.
   */
  status: PaymentSessionStatus

  /**
   * The captured amount of the payment
   */
  capturedAmount: BigNumberValue

  /**
   * The refunded amount of the payment
   */
  refundedAmount: BigNumberValue

  /**
   * The data to be stored in the `data` field of the Payment Session to be created.
   * The `data` field is useful to hold any data required by the third-party provider to process the payment or retrieve its details at a later point.
   */
  data: Record<string, unknown>

  /**
   * A context necessary for the payment provider.
   */
  context: PaymentProviderContext

  /**
   * The related event or mutation occurred on a payment.
   */
  event?: {
    /**
     * Event type that related to changes in provider payment
     */
    type: "authorize" | "capture" | "refund" | "cancel"

    /**
     * The event's details.
     */
    detail?: {
      /**
       * The amount to be changed
       */
      amount?: BigNumberValue

      /**
       * Who captured the payment. For example,
       * a user's ID.
       */
      captured_by?: string

      /**
       * Who refunded the payment. For example,
       * a user's ID.
       */
      refunded_by?: string

      /**
       * The reason to be canceled
       */
      reason?: string
    }
  }
}

/**
 * An object that is returned in case of an error.
 */
export interface PaymentProviderError {
  /**
   * The error message
   */
  error: string

  /**
   * The error code.
   */
  code?: string

  /**
   * Any additional helpful details.
   */
  detail?: any
}

export interface IPaymentProvider {
  /**
   * @ignore
   *
   * Return a unique identifier to retrieve the payment module provider
   */
  getIdentifier(): string

  /**
   * This methods sends a request to the third-party provider to initialize the payment. It's called when the payment session is created.
   *
   * For example, in the Stripe provider, this method is used to create a Payment Intent for the customer.
   *
   * @param {CreatePaymentProviderSession} data - The data necessary to initiate the payment.
   * @returns {Promise<PaymentProviderError | PaymentProviderSessionResponse>} Either the payment's status and data or an error object.
   */
  initiatePayment(
    data: CreatePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse>

  /**
   * This method is used to update a payment associated with a session in the third-party provider.
   *
   * @param {UpdatePaymentProviderSession} data - The data related to the update.
   * @returns {Promise<PaymentProviderError | PaymentProviderSessionResponse>} Either the payment's status and data or an error object.
   */
  updatePayment(
    data: UpdatePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse>

  /**
   * This method is called before a payment session is deleted. It's used to perform any actions necessary before the deletion.
   *
   * @param {Record<string, unknown>} paymentSessionData - The `data` field of the Payment Session.
   * @returns {Promise<PaymentProviderError | void>}  Either an error object or null if successful.
   */
  deletePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentProviderError | void>

  /**
   * This method is called when a payment session should be authorized.
   * You can interact with a third-party provider and perform the necessary actions to authorize the payment.
   *
   * Refer to [this guide](https://docs.medusajs.com/experimental/payment/payment-flow/#3-authorize-payment-session)
   * to learn more about how this fits into the payment flow and how to handle required actions.
   *
   * @param {AuthorizePaymentProviderSession} data - The data related to authorize.
   * @returns {Promise<PaymentProviderError | PaymentProviderSessionResponse>} Either the payment's status and data or an error object.
   */
  authorizePayment(
    data: AuthorizePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse>

  /**
   * This method is called when a payment should be captured. The payment is captured in one of the following scenarios:
   *
   * - The payment provider supports automatically capturing the payment after authorization.
   * - The merchant requests to capture the payment after its associated payment session was authorized.
   * - A webhook event occurred that instructs the payment provider to capture the payment session. Learn more about handing webhook events in [this guide](https://docs.medusajs.com/experimental/payment/webhook-events/)
   *
   * In this method, you can interact with the third-party provider and perform any actions necessary to capture the payment.
   *
   * @param {Record<string, unknown>} paymentSessionData - The `data` field of the Payment Session.
   * @param {BigNumberInput} captureAmount - The amount to capture.
   * @returns {Promise<PaymentProviderError | PaymentProviderSessionResponse>} Either the payment's status and data or an error object.
   */
  capturePayment(
    paymentSessionData: Record<string, unknown>,
    captureAmount?: BigNumberInput
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse>

  /**
   * This method is called when a payment should be refunded. This is typically triggered manually by the merchant.
   *
   * In this method, you can interact with the third-party provider and perform any actions necessary to refund the payment.
   *
   * @param {Record<string, unknown>} paymentSessionData - The `data` field of the Payment Session.
   * @param {BigNumberInput} refundAmount - The amount to refund.
   * @returns {Promise<PaymentProviderError | PaymentProviderSessionResponse>} Either the payment's status and data or an error object.
   */
  refundPayment(
    paymentSessionData: Record<string, unknown>,
    refundAmount?: BigNumberInput
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse>

  /**
   * This method is used to provide a uniform way of retrieving the payment information from the third-party provider.
   *
   * For example, in Stripe’s payment provider this method is used to retrieve the payment intent details from Stripe.
   *
   * @param {Record<string, unknown>} paymentSessionData - The `data` field of the Payment Session.
   * @returns {Promise<PaymentProviderError | PaymentProviderSessionResponse>} Either the payment's status and data or an error object.
   */
  retrievePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse>

  /**
   * This method is called when a payment is canceled.
   *
   * In this method, you can interact with the third-party provider and perform any actions necessary to cancel the payment.
   *
   * @param {Record<string, unknown>} paymentSessionData - The `data` field of the Payment Session.
   * @returns {Promise<PaymentProviderError | PaymentProviderSessionResponse>} Either the payment's status and data or an error object.
   */
  cancelPayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse>

  getWebhookActionAndData(
    data: ProviderWebhookPayload["payload"]
  ): Promise<PaymentProviderSessionResponse>
}
