import * as gatsby from 'gatsby'

import {
  DEFAULT_LANG,
  DEFAULT_IMGIX_PARAMS,
  DEFAULT_PLACEHOLDER_IMGIX_PARAMS,
  COULD_NOT_FIND_RELEASE_REF_WITH_FALLBACK_MSG,
  FETCHING_WITH_RELEASE_REF_MSG,
  GLOBAL_TYPE_PREFIX,
  MISSING_SCHEMAS_MSG,
  TYPE_PATHS_KEY_TEMPLATE,
} from './constants'
import { PluginOptions } from './types'
import { createNodeHelpers } from './lib/nodeHelpers'
import { fetchAllDocuments } from './lib/fetchAllDocuments'
import { getMasterRef } from './lib/getMasterRef'
import { getReleaseRef } from './lib/getReleaseRef'
import { getRepositoryInfo } from './lib/getRepositoryInfo'
import { reportInfo } from './lib/reportInfo'
import { reportWarning } from './lib/reportWarning'
import { reporterMessage } from './lib/reporterMessage'
import { sprintf } from './lib/sprintf'
import { pascalCase } from './lib/pascalCase'

import { onWebhook } from './on-webhook'
import { customizeSchema } from './customize-schema'

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
    schemas: Joi.object(),
    imageImgixParams: Joi.object().default(DEFAULT_IMGIX_PARAMS),
    imagePlaceholderImgixParams: Joi.object().default(
      DEFAULT_PLACEHOLDER_IMGIX_PARAMS,
    ),
    shouldDownloadImage: Joi.function(),
    typePrefix: Joi.string(),
    webhookSecret: Joi.string(),
  })
    .oxor('fetchLinks', 'graphQuery')
    .external(async (pluginOptions: PluginOptions) => {
      const repositoryInfo = await getRepositoryInfo(
        pluginOptions.repositoryName,
        {
          accessToken: pluginOptions.accessToken,
          apiEndpoint: pluginOptions.apiEndpoint,
        },
      )

      const schemaTypes = Object.keys(pluginOptions.schemas)
      const repositoryTypes = Object.keys(repositoryInfo.types)

      let missingSchemas = [] as string[]
      for (const repositoryType of repositoryTypes) {
        if (!schemaTypes.includes(repositoryType)) {
          missingSchemas = [...missingSchemas, repositoryType]
        }
      }

      if (missingSchemas.length > 0) {
        throw new Error(
          reporterMessage(
            sprintf(MISSING_SCHEMAS_MSG, missingSchemas.join(', ')),
            pluginOptions.repositoryName,
          ),
        )
      }
    })

  return schema
}

export const createSchemaCustomization: NonNullable<
  gatsby.GatsbyNode['createSchemaCustomization']
> = async (
  args: gatsby.CreateSchemaCustomizationArgs,
  pluginOptions: PluginOptions,
): Promise<void> => {
  const res = customizeSchema(args, pluginOptions)

  args.actions.createTypes(res.graphqlTypes)

  const typePathsKey = sprintf(
    TYPE_PATHS_KEY_TEMPLATE,
    pluginOptions.repositoryName,
    args.createContentDigest(pluginOptions.schemas),
  )

  args.cache.set(typePathsKey, res.typePaths)
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

  return
}
