import { ModuleProviderExports } from "@medusajs/framework/types"
import {
  StripeBancontactService,
  StripeBlikService,
  StripeGiropayService,
  StripeIdealService,
  StripeProviderService,
  StripePrzelewy24Service,
  StripeInvoiceService,
} from "./services"

const services = [
  StripeBancontactService,
  StripeBlikService,
  StripeGiropayService,
  StripeIdealService,
  StripeProviderService,
  StripePrzelewy24Service,
  StripeInvoiceService,
]

const providerExport: ModuleProviderExports = {
  services,
}

export default providerExport
