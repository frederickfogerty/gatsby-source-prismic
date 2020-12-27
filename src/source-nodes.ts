import * as gatsby from 'gatsby'

import {
  COULD_NOT_FIND_RELEASE_REF_WITH_FALLBACK_MSG,
  FETCHING_WITH_RELEASE_REF_MSG,
  GLOBAL_TYPE_PREFIX,
} from './constants'
import { PluginOptions } from './types'
import { createNodeHelpers } from './lib/nodeHelpers'
import { fetchAllDocuments } from './lib/fetchAllDocuments'
import { getMasterRef } from './lib/getMasterRef'
import { getReleaseRef } from './lib/getReleaseRef'
import { pascalCase } from './lib/pascalCase'
import { reportInfo } from './lib/reportInfo'
import { reportWarning } from './lib/reportWarning'
import { sprintf } from './lib/sprintf'

import { onWebhook } from './on-webhook'

export const sourceNodes: NonNullable<
  gatsby.GatsbyNode['sourceNodes']
> = async function (
  args: gatsby.SourceNodesArgs,
  pluginOptions: PluginOptions,
): Promise<void> {
  if (args.webhookBody && JSON.stringify(args.webhookBody) !== '{}') {
    await onWebhook(args.webhookBody, args, pluginOptions)

    return
  }

  let ref

  if (pluginOptions.releaseID) {
    try {
      ref = await getReleaseRef(
        pluginOptions.repositoryName,
        pluginOptions.releaseID,
        {
          accessToken: pluginOptions.accessToken,
          apiEndpoint: pluginOptions.apiEndpoint,
        },
      )

      if (ref) {
        reportInfo(
          sprintf(FETCHING_WITH_RELEASE_REF_MSG, ref.label, ref.ref),
          pluginOptions.repositoryName,
          args.reporter.info,
        )
      }
    } catch {
      reportWarning(
        sprintf(
          COULD_NOT_FIND_RELEASE_REF_WITH_FALLBACK_MSG,
          pluginOptions.releaseID,
        ),
        pluginOptions.repositoryName,
        args.reporter.warn,
      )
    }
  }

  if (!ref) {
    ref = await getMasterRef(pluginOptions.repositoryName, {
      accessToken: pluginOptions.accessToken,
      apiEndpoint: pluginOptions.apiEndpoint,
    })
  }

  const nodeHelpers = createNodeHelpers({
    typePrefix: pascalCase(GLOBAL_TYPE_PREFIX, pluginOptions.typePrefix),
    fieldPrefix: GLOBAL_TYPE_PREFIX,
    createNodeId: args.createNodeId,
    createContentDigest: args.createContentDigest,
  })

  const allDocuments = await fetchAllDocuments(pluginOptions.repositoryName, {
    ref: ref.ref,
    accessToken: pluginOptions.accessToken,
    apiEndpoint: pluginOptions.apiEndpoint,
    graphQuery: pluginOptions.graphQuery,
    fetchLinks: pluginOptions.fetchLinks,
    lang: pluginOptions.lang,
  })

  for (const document of allDocuments) {
    const node = nodeHelpers.createNodeFactory(document.type)(document)

    args.actions.createNode(node)
  }
}
