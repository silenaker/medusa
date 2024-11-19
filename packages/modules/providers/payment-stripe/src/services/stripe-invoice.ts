import StripeBase from "../core/stripe-base"
import { PaymentIntentOptions, PaymentProviderKeys } from "../types"

class InvoiceProviderService extends StripeBase {
  static PROVIDER = PaymentProviderKeys.INVOICE

  constructor(_, options) {
    super(_, options)
  }

  get paymentIntentOptions(): PaymentIntentOptions {
    return {
      payment_method_types: ["card"],
    }
  }
}

export default InvoiceProviderService
