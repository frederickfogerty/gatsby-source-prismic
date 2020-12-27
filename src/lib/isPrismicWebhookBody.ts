import { PrismicWebhookBody } from '../types'

import { isPrismicURL } from './isPrismicURL'

/**
 * Determines if some piece of data is a Prismic webhook body.
 *
 * @param webhookBody Piece of data to test.
 */
export function isPrismicWebhookBody(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  webhookBody: any,
): webhookBody is PrismicWebhookBody {
  return (
    typeof webhookBody === 'object' &&
    typeof webhookBody.apiUrl === 'string' &&
    isPrismicURL(webhookBody.apiUrl)
  )
}
