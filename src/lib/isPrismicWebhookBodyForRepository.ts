import { PrismicWebhookBody } from '../types'

import { isPrismicWebhookBody } from './isPrismicWebhookBody'

/**
 * Determines if some piece of data is a Prismic webhook body for a given repository.
 *
 * @param webhookBody Piece of data to test.
 * @param repositoryName Name of the repository to check the webhook body against.
 */
export function isPrismicWebhookBodyForRepository(
  repositoryName: string,
  webhookBody: unknown,
): webhookBody is PrismicWebhookBody {
  return (
    isPrismicWebhookBody(webhookBody) && webhookBody.domain === repositoryName
  )
}
