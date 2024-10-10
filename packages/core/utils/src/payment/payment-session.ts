/**
 * @enum
 *
 * The status of a payment session.
 */
export enum PaymentSessionStatus {
  /**
   * The payment is authorized.
   */
  AUTHORIZED = "authorized",
  /**
   * The payment is captured.
   */
  CAPTURED = "captured",
  /**
   * The payment is partially captured.
   */
  PARTIALLY_CAPTURED = "partially_captured",
  /**
   * The payment is refunded.
   */
  REFUNDED = "refunded",
  /**
   * The payment is refunded.
   */
  PARTIALLY_REFUNDED = "partially_refunded",
  /**
   * The payment is pending.
   */
  PENDING = "pending",
  /**
   * The payment requires an action.
   */
  REQUIRES_MORE = "requires_more",
  /**
   * The payment is canceled.
   */
  CANCELED = "canceled",
  /**
   * The payment is being processing.
   */
  PROCESSING = "processing",
}
