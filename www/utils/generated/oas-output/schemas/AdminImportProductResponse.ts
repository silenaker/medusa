/**
 * @schema AdminImportProductResponse
 * type: object
 * description: SUMMARY
 * x-schemaName: AdminImportProductResponse
 * required:
 *   - transaction_id
 *   - summary
 * properties:
 *   transaction_id:
 *     type: string
 *     title: transaction_id
 *     description: The product's transaction id.
 *   summary:
 *     type: object
 *     description: The product's summary.
 *     required:
 *       - toCreate
 *       - toUpdate
 *     properties:
 *       toCreate:
 *         type: number
 *         title: toCreate
 *         description: The summary's tocreate.
 *       toUpdate:
 *         type: number
 *         title: toUpdate
 *         description: The summary's toupdate.
 * 
*/

