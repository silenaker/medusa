/**
 * @enum
 *
 * The payment collection's status.
 */
export enum PaymentCollectionStatus {
  /**
   * The payment collection is pending.
   */
  PENDING = "pending",
  /**
   * The payment collection is paid.
   */
  PAID = "paid",
  /**
   * The payment collection is partially paid.
   */
  PARTIALLY_PAID = "partially_paid",
  /**
   * The payment collection is authorized.
   */
  AUTHORIZED = "authorized",
  /**
   * The payment collection is partially authorized.
   */
  PARTIALLY_AUTHORIZED = "partially_authorized",
  /**
   * The payment collection is refunded.
   */
  REFUNDED = "refunded",
  /**
   * The payment collection is refunded.
   */
  PARTIALLY_REFUNDED = "partially_refunded",
}
