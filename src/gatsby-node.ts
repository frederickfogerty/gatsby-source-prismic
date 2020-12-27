import * as gatsby from 'gatsby'

import {
  DEFAULT_LANG,
  DEFAULT_IMGIX_PARAMS,
  DEFAULT_PLACEHOLDER_IMGIX_PARAMS,
  COULD_NOT_FIND_RELEASE_REF_WITH_FALLBACK,
  FETCHING_WITH_RELEASE_REF,
  GLOBAL_TYPE_PREFIX,
} from './constants'
import { fetchAllDocuments } from './lib/fetchAllDocuments'
import { getMasterRef } from './lib/getMasterRef'
import { getReleaseRef } from './lib/getReleaseRef'
import { createNodeHelpers } from './lib/nodeHelpers'
import { reportInfo } from './lib/reportInfo'
import { reportWarning } from './lib/reportWarning'
import { sprintf } from './lib/sprintf'
import { onWebhook } from './on-webhook'
import { PluginOptions } from './types'

export const pluginOptionsSchema: NonNullable<
  gatsby.GatsbyNode['pluginOptionsSchema']
> = (args) => {
  const { Joi } = args

  const schema = Joi.object({
    repositoryName: Joi.string().required(),
    accessToken: Joi.string(),
    apiEndpoint: Joi.string(),
    releaseID: Joi.string(),
    fetchLinks: Joi.array().items(Joi.string().required()),
    graphQuery: Joi.string(),
    lang: Joi.string().default(DEFAULT_LANG),
    linkResolver: Joi.function(),
    htmlSerializer: Joi.function(),
    imageImgixParams: Joi.object().default(DEFAULT_IMGIX_PARAMS),
    imagePlaceholderImgixParams: Joi.object().default(
      DEFAULT_PLACEHOLDER_IMGIX_PARAMS,
    ),
    shouldDownloadImage: Joi.function(),
    typePrefix: Joi.string(),
    webhookSecret: Joi.string(),
  }).oxor('fetchLinks', 'graphQuery')

  return schema
}

export const createSchemaCustomization: NonNullable<
  gatsby.GatsbyNode['createSchemaCustomization']
> = async (
  args: gatsby.CreateSchemaCustomizationArgs,
  pluginOptions: PluginOptions,
): Promise<void> => {
  return
}

export const sourceNodes: NonNullable<
  gatsby.GatsbyNode['sourceNodes']
> = async (
  args: gatsby.SourceNodesArgs,
  pluginOptions: PluginOptions,
): Promise<void> => {
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
          sprintf(FETCHING_WITH_RELEASE_REF, ref.label, ref.ref),
          pluginOptions.repositoryName,
          args.reporter.info,
        )
      }
    } catch {
      reportWarning(
        sprintf(
          COULD_NOT_FIND_RELEASE_REF_WITH_FALLBACK,
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
    typePrefix: pluginOptions.typePrefix ?? GLOBAL_TYPE_PREFIX,
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

  return
}
