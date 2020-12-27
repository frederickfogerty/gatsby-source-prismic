import * as gatsby from 'gatsby'

import {
  DEFAULT_IMGIX_PARAMS,
  DEFAULT_LANG,
  DEFAULT_PLACEHOLDER_IMGIX_PARAMS,
  MISSING_SCHEMAS_MSG,
} from './constants'
import { PluginOptions } from './types'
import { getRepositoryInfo } from './lib/getRepositoryInfo'
import { reporterMessage } from './lib/reporterMessage'
import { sprintf } from './lib/sprintf'

export const pluginOptionsSchema: NonNullable<
  gatsby.GatsbyNode['pluginOptionsSchema']
> = function (args) {
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
