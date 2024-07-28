/**
 * @schema AdminPostOrderClaimsReqSchema
 * type: object
 * description: SUMMARY
 * x-schemaName: AdminPostOrderClaimsReqSchema
 * required:
 *   - type
 *   - order_id
 *   - metadata
 * properties:
 *   type:
 *     type: string
 *     enum:
 *       - refund
 *       - replace
 *   order_id:
 *     type: string
 *     title: order_id
 *     description: The claim's order id.
 *   description:
 *     type: string
 *     title: description
 *     description: The claim's description.
 *   internal_note:
 *     type: string
 *     title: internal_note
 *     description: The claim's internal note.
 *   metadata:
 *     type: object
 *     description: The claim's metadata.
 * 
*/

