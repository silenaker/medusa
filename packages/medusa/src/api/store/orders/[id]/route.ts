import { getOrderDetailWorkflow } from "@medusajs/core-flows"
import { MedusaRequest, MedusaResponse } from "../../../../types/routing"
import { StoreGetOrdersParamsType } from "../validators"

// TODO: Do we want to apply some sort of authentication here? My suggestion is that we do
export const GET = async (
  req: MedusaRequest<StoreGetOrdersParamsType>,
  res: MedusaResponse
) => {
  const { result } = await getOrderDetailWorkflow(req.scope).run({
    input: {
      fields: req.remoteQueryConfig.fields,
      order_id: req.params.id,
    },
  })

  res.json({ order: result })
}
