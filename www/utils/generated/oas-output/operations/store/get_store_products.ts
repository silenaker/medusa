/**
 * @oas [get] /store/products
 * operationId: GetProducts
 * summary: List Products
 * description: Retrieve a list of products. The products can be filtered by fields
 *   such as `id`. The products can also be sorted or paginated.
 * x-authenticated: false
 * parameters:
 *   - name: expand
 *     in: query
 *     description: Comma-separated relations that should be expanded in the returned data.
 *     required: false
 *     schema:
 *       type: string
 *       title: expand
 *       description: Comma-separated relations that should be expanded in the returned data.
 *   - name: fields
 *     in: query
 *     description: Comma-separated fields that should be included in the returned
 *       data. if a field is prefixed with `+` it will be added to the default
 *       fields, using `-` will remove it from the default fields. without prefix
 *       it will replace the entire default fields.
 *     required: false
 *     schema:
 *       type: string
 *       title: fields
 *       description: Comma-separated fields that should be included in the returned
 *         data. if a field is prefixed with `+` it will be added to the default
 *         fields, using `-` will remove it from the default fields. without prefix
 *         it will replace the entire default fields.
 *   - name: offset
 *     in: query
 *     description: The number of items to skip when retrieving a list.
 *     required: false
 *     schema:
 *       type: number
 *       title: offset
 *       description: The number of items to skip when retrieving a list.
 *   - name: limit
 *     in: query
 *     description: Limit the number of items returned in the list.
 *     required: false
 *     schema:
 *       type: number
 *       title: limit
 *       description: Limit the number of items returned in the list.
 *   - name: order
 *     in: query
 *     description: The field to sort the data by. By default, the sort order is
 *       ascending. To change the order to descending, prefix the field name with
 *       `-`.
 *     required: false
 *     schema:
 *       type: string
 *       title: order
 *       description: The field to sort the data by. By default, the sort order is
 *         ascending. To change the order to descending, prefix the field name with
 *         `-`.
 *   - name: region_id
 *     in: query
 *     description: The product's region id.
 *     required: false
 *     schema:
 *       type: string
 *       title: region_id
 *       description: The product's region id.
 *   - name: $and
 *     in: query
 *     required: false
 *     schema: {}
 *   - name: $or
 *     in: query
 *     required: false
 *     schema: {}
 *   - name: variants
 *     in: query
 *     description: The product's variants.
 *     required: false
 *     schema:
 *       type: object
 *       description: The product's variants.
 *       properties:
 *         status:
 *           type: array
 *           description: The variant's status.
 *           items:
 *             type: string
 *             enum:
 *               - draft
 *               - proposed
 *               - published
 *               - rejected
 *         options:
 *           type: object
 *           description: The variant's options.
 *           required:
 *             - value
 *             - option_id
 *           properties:
 *             value:
 *               type: string
 *               title: value
 *               description: The option's value.
 *             option_id:
 *               type: string
 *               title: option_id
 *               description: The option's option id.
 *         $and: {}
 *         $or: {}
 *   - name: q
 *     in: query
 *     description: The product's q.
 *     required: false
 *     schema:
 *       type: string
 *       title: q
 *       description: The product's q.
 *   - name: id
 *     in: query
 *     required: false
 *     schema:
 *       oneOf:
 *         - type: string
 *           title: id
 *           description: The product's ID.
 *         - type: array
 *           description: The product's ID.
 *           items:
 *             type: string
 *             title: id
 *             description: The id's ID.
 *   - name: title
 *     in: query
 *     description: The product's title.
 *     required: true
 *     schema:
 *       type: string
 *       title: title
 *       description: The product's title.
 *   - name: handle
 *     in: query
 *     description: The product's handle.
 *     required: true
 *     schema:
 *       type: string
 *       title: handle
 *       description: The product's handle.
 *   - name: is_giftcard
 *     in: query
 *     description: The product's is giftcard.
 *     required: true
 *     schema:
 *       type: boolean
 *       title: is_giftcard
 *       description: The product's is giftcard.
 *   - name: category_id
 *     in: query
 *     description: The product's category id.
 *     required: true
 *     schema:
 *       type: array
 *       description: The product's category id.
 *       items:
 *         type: string
 *         title: category_id
 *         description: The category id's details.
 *   - name: sales_channel_id
 *     in: query
 *     description: The product's sales channel id.
 *     required: true
 *     schema:
 *       type: array
 *       description: The product's sales channel id.
 *       items:
 *         type: string
 *         title: sales_channel_id
 *         description: The sales channel id's details.
 *   - name: collection_id
 *     in: query
 *     description: The product's collection id.
 *     required: true
 *     schema:
 *       type: array
 *       description: The product's collection id.
 *       items:
 *         type: string
 *         title: collection_id
 *         description: The collection id's details.
 *   - name: tags
 *     in: query
 *     description: The product's tags.
 *     required: false
 *     schema:
 *       type: array
 *       description: The product's tags.
 *       items:
 *         type: string
 *         title: tags
 *         description: The tag's tags.
 *   - name: type_id
 *     in: query
 *     description: The product's type id.
 *     required: false
 *     schema:
 *       type: array
 *       description: The product's type id.
 *       items:
 *         type: string
 *         title: type_id
 *         description: The type id's details.
 *   - name: created_at
 *     in: query
 *     description: The product's created at.
 *     required: false
 *     schema:
 *       type: string
 *       description: The product's created at.
 *       required:
 *         - $eq
 *         - $ne
 *         - $in
 *         - $nin
 *         - $like
 *         - $ilike
 *         - $re
 *         - $contains
 *         - $gt
 *         - $gte
 *         - $lt
 *         - $lte
 *       properties:
 *         $eq: {}
 *         $ne: {}
 *         $in: {}
 *         $nin: {}
 *         $like: {}
 *         $ilike: {}
 *         $re: {}
 *         $contains: {}
 *         $gt: {}
 *         $gte: {}
 *         $lt: {}
 *         $lte: {}
 *       title: created_at
 *   - name: updated_at
 *     in: query
 *     description: The product's updated at.
 *     required: false
 *     schema:
 *       type: string
 *       description: The product's updated at.
 *       required:
 *         - $eq
 *         - $ne
 *         - $in
 *         - $nin
 *         - $like
 *         - $ilike
 *         - $re
 *         - $contains
 *         - $gt
 *         - $gte
 *         - $lt
 *         - $lte
 *       properties:
 *         $eq: {}
 *         $ne: {}
 *         $in: {}
 *         $nin: {}
 *         $like: {}
 *         $ilike: {}
 *         $re: {}
 *         $contains: {}
 *         $gt: {}
 *         $gte: {}
 *         $lt: {}
 *         $lte: {}
 *       title: updated_at
 *   - name: deleted_at
 *     in: query
 *     description: The product's deleted at.
 *     required: false
 *     schema:
 *       type: string
 *       description: The product's deleted at.
 *       required:
 *         - $eq
 *         - $ne
 *         - $in
 *         - $nin
 *         - $like
 *         - $ilike
 *         - $re
 *         - $contains
 *         - $gt
 *         - $gte
 *         - $lt
 *         - $lte
 *       properties:
 *         $eq: {}
 *         $ne: {}
 *         $in: {}
 *         $nin: {}
 *         $like: {}
 *         $ilike: {}
 *         $re: {}
 *         $contains: {}
 *         $gt: {}
 *         $gte: {}
 *         $lt: {}
 *         $lte: {}
 *       title: deleted_at
 *   - name: country_code
 *     in: query
 *     description: The product's country code.
 *     required: false
 *     schema:
 *       type: string
 *       title: country_code
 *       description: The product's country code.
 *   - name: province
 *     in: query
 *     description: The product's province.
 *     required: false
 *     schema:
 *       type: string
 *       title: province
 *       description: The product's province.
 *   - name: cart_id
 *     in: query
 *     description: The product's cart id.
 *     required: false
 *     schema:
 *       type: string
 *       title: cart_id
 *       description: The product's cart id.
 * x-codeSamples:
 *   - lang: Shell
 *     label: cURL
 *     source: curl '{backend_url}/store/products'
 * tags:
 *   - Products
 * responses:
 *   "400":
 *     $ref: "#/components/responses/400_error"
 *   "401":
 *     $ref: "#/components/responses/unauthorized"
 *   "404":
 *     $ref: "#/components/responses/not_found_error"
 *   "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *   "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *   "500":
 *     $ref: "#/components/responses/500_error"
 * 
*/

