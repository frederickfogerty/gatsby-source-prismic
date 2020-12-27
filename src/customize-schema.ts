import * as gatsby from 'gatsby'
import * as gqlc from 'graphql-compose'
import { NodeHelpers } from './lib/nodeHelpers'

import { PluginOptions, PrismicFieldSchema, PrismicFieldType } from './types'

type CustomizeSchemaResult = {
  graphqlTypes: gatsby.GatsbyGraphQLObjectType[]
  typePaths: string[][]
}

export function customizeSchema(
  args: gatsby.CreateSchemaCustomizationArgs,
  pluginOptions: PluginOptions,
): CustomizeSchemaResult {
  let graphqlTypes = [] as gatsby.GatsbyGraphQLObjectType[]
  let typePaths = [] as string[][]

  for (const schemaID in pluginOptions.schemas) {
    const schema = pluginOptions.schemas[schemaID]
    const res = schemaToType(schema)

    graphqlTypes = [...graphqlTypes, res.graphqlType]
    typePaths = [...typePaths, ...res.typePaths]
  }

  return {
    graphqlTypes,
    typePaths,
  }
}

function fieldToType<TSource, TContext>(
  field: PrismicFieldSchema,
  buildObjectType: gatsby.NodePluginSchema['buildObjectType'],
  createTypes: gatsby.Actions['createTypes'],
  nodeHelpers: NodeHelpers,
): gqlc.ComposeFieldConfig<TSource, TContext> {
  switch (field.type) {
    case PrismicFieldType.Color:
    case PrismicFieldType.Select:
    case PrismicFieldType.Text:
    case PrismicFieldType.UID: {
      return 'String'
    }

    case PrismicFieldType.Boolean: {
      return 'Boolean'
    }

    case PrismicFieldType.Number: {
      return 'Float'
    }

    case PrismicFieldType.Date:
    case PrismicFieldType.Timestamp: {
      return {
        type: 'Date',
        extensions: { dateformat: {} },
      }
    }

    case PrismicFieldType.StructuredText: {
      const type = buildObjectType({
        name: nodeHelpers.createTypeName('StructuredTextType'),
        fields: {
          text: {
            type: 'String',
          },
        },
      })

      createTypes

      return type.config.name
    }

    default: {
      return 'JSON'
    }
  }
}

type SchemaToTypeResult = {
  graphqlType: gatsby.GatsbyGraphQLObjectType
  typePaths: string[][]
}

function schemaToType(schema: PrismicSchema): SchemaToTypeResult {}
