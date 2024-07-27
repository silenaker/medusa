/**
 * @schema AdminPostClaimsAddItemsReqSchema
 * type: object
 * description: SUMMARY
 * x-schemaName: AdminPostClaimsAddItemsReqSchema
 * properties:
 *   items:
 *     type: array
 *     description: The claim's items.
 *     items:
 *       type: object
 *       description: The item's items.
 *       required:
 *         - variant_id
 *         - quantity
 *       properties:
 *         variant_id:
 *           type: string
 *           title: variant_id
 *           description: The item's variant id.
 *         quantity:
 *           type: number
 *           title: quantity
 *           description: The item's quantity.
 *         unit_price:
 *           type: number
 *           title: unit_price
 *           description: The item's unit price.
 *         internal_note:
 *           type: string
 *           title: internal_note
 *           description: The item's internal note.
 *         metadata:
 *           type: object
 *           description: The item's metadata.
 * 
*/

