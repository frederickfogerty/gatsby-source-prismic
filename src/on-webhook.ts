import * as gatsby from 'gatsby'

import {
  WEBHOOK_SECRET_MISMATCH_MSG,
  WEBHOOK_TEST_TRIGGER_SUCCESS_MSG,
} from './constants'
import { isPrismicWebhookBodyForRepository } from './lib/isPrismicWebhookBodyForRepository'
import { isValidPrismicWebhookSecret } from './lib/isValidPrismicWebhookSecret'
import { reportError } from './lib/reportError'
import { reportInfo } from './lib/reportInfo'

import { PluginOptions, PrismicWebhookType } from './types'

export async function onWebhook(
  webhookBody: unknown,
  args: gatsby.SourceNodesArgs,
  pluginOptions: PluginOptions,
): Promise<void> {
  // If the webhook is not from Prismic, or is from Prismic but is not for this
  // plugin instance's Prismic repository, ignore it and return early.
  //
  // The webhook may still be picked up by another plugin.
  if (
    !isPrismicWebhookBodyForRepository(
      pluginOptions.repositoryName,
      webhookBody,
    )
  ) {
    // Touch all nodes to prevent garbage collection.
    for (const node of args.getNodes()) {
      args.actions.touchNode({ nodeId: node.id })
    }

    return
  }

  // If the webhook's secret does not match the secret provided to the plugin,
  // inform the user and return early.
  if (!isValidPrismicWebhookSecret(pluginOptions.webhookSecret, webhookBody)) {
    reportError(
      WEBHOOK_SECRET_MISMATCH_MSG,
      pluginOptions.repositoryName,
      args.reporter.error,
    )

    // Touch all nodes to prevent garbage collection.
    for (const node of args.getNodes()) {
      args.actions.touchNode({ nodeId: node.id })
    }

    return
  }

  // The webhook is for this plugin instance's Prismic repository.
  switch (webhookBody.type) {
    case PrismicWebhookType.APIUpdate: {
      reportInfo(
        'TODO: Handle api-update webhook',
        pluginOptions.repositoryName,
        args.reporter.info,
      )

      return
    }

    case PrismicWebhookType.TestTrigger: {
      reportInfo(
        WEBHOOK_TEST_TRIGGER_SUCCESS_MSG,
        pluginOptions.repositoryName,
        args.reporter.info,
      )

      return
    }

    default: {
      // This webhook is unsupported by the plugin.

      return
    }
  }
}
