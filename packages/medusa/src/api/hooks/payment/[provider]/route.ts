import { ModuleRegistrationName, PaymentWebhookEvents } from "@medusajs/utils"

import { MedusaRequest, MedusaResponse } from "../../../../types/routing"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { provider } = req.params

    const options =
      req.scope.resolve(ModuleRegistrationName.PAYMENT).webhookOptions || {}

    const event = {
      provider,
      payload: { data: req.body, rawData: req.rawBody, headers: req.headers },
    }

    const eventBus = req.scope.resolve(ModuleRegistrationName.EVENT_BUS)

    // we delay the processing of the event to avoid a conflict caused by a race condition
    await eventBus.emit(
      {
        name: PaymentWebhookEvents.WebhookReceived,
        data: event,
      },
      {
        delay: options.delay ?? 5000,
        attempts: options.retries ?? 3,
      }
    )
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`)
    return
  }

  res.sendStatus(200)
}
