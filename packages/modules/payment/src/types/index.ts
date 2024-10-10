import {
  Logger,
  ModuleProviderExports,
  ModuleServiceInitializeOptions,
  PaymentModuleWebhookOptions,
} from "@medusajs/framework/types"

export type InitializeModuleInjectableDependencies = {
  logger?: Logger
}

export type PaymentModuleOptions = Partial<ModuleServiceInitializeOptions> & {
  /**
   * The webhook options that control how to handle received payment webhook events
   */
  webhook?: PaymentModuleWebhookOptions
  /**
   * Providers to be registered
   */
  providers?: {
    /**
     * The module provider to be registered
     */
    resolve: string | ModuleProviderExports
    /**
     * The id of the provider
     */
    id: string
    /**
     * key value pair of the configuration to be passed to the provider constructor
     */
    options?: Record<string, unknown>
  }[]
}
