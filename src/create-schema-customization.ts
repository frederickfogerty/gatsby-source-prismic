import * as PrismicDOM from 'prismic-dom'
import * as gatsby from 'gatsby'
import * as gqlc from 'graphql-compose'

import {
  GLOBAL_TYPE_PREFIX,
  PREVIEWABLE_NODE_ID_FIELD,
  PRISMIC_API_NON_DATA_FIELDS,
  TYPE_PATHS_KEY_TEMPLATE,
} from './constants'
import { NodeHelpers, createNodeHelpers } from './lib/nodeHelpers'
import {
  PluginOptions,
  PrismicDocumentNode,
  PrismicFieldSchema,
  PrismicFieldType,
  PrismicLinkField,
  PrismicSchema,
  PrismicSliceField,
  PrismicSliceSchema,
  PrismicSlicesFieldSchema,
  PrismicStructuredTextField,
} from './types'
import { identity } from './lib/identity'
import { listTypeName } from './lib/listTypeName'
import { pascalCase } from './lib/pascalCase'
import { sprintf } from './lib/sprintf'

type SchemaCustomizationArgs = {
  buildObjectType: gatsby.NodePluginSchema['buildObjectType']
  buildUnionType: gatsby.NodePluginSchema['buildUnionType']
  buildEnumType: gatsby.NodePluginSchema['buildEnumType']
  createTypes: gatsby.Actions['createTypes']
  pluginOptions: PluginOptions
  nodeHelpers: NodeHelpers
  globalNodeHelpers: NodeHelpers
}

interface TypePath {
  path: string[]
  type: string
  fieldType?: PrismicFieldType
}

export const createSchemaCustomization: NonNullable<
  gatsby.GatsbyNode['createSchemaCustomization']
> = async function (
  args: gatsby.CreateSchemaCustomizationArgs,
  pluginOptions: PluginOptions,
): Promise<void> {
  const nodeHelpers = createNodeHelpers({
    typePrefix: pascalCase(GLOBAL_TYPE_PREFIX, pluginOptions.typePrefix),
    fieldPrefix: GLOBAL_TYPE_PREFIX,
    createNodeId: args.createNodeId,
    createContentDigest: args.createContentDigest,
  })

  const globalNodeHelpers = createNodeHelpers({
    typePrefix: GLOBAL_TYPE_PREFIX,
    fieldPrefix: GLOBAL_TYPE_PREFIX,
    createNodeId: args.createNodeId,
    createContentDigest: args.createContentDigest,
  })

  const customizeSchemaArgs: SchemaCustomizationArgs = {
    buildObjectType: args.schema.buildObjectType,
    buildUnionType: args.schema.buildUnionType,
    buildEnumType: args.schema.buildEnumType,
    createTypes: args.actions.createTypes,
    pluginOptions,
    nodeHelpers,
    globalNodeHelpers,
  }

  let types = [] as gatsby.GatsbyGraphQLObjectType[]
  let typePaths = [] as TypePath[]

  for (const schemaID in pluginOptions.schemas) {
    const schema = pluginOptions.schemas[schemaID]

    if (schema) {
      const res = schemaToType(schemaID, schema, customizeSchemaArgs)

      types = [...types, res.type]
      typePaths = [...typePaths, ...res.typePaths]
    }
  }

  args.actions.createTypes(types)

  const baseTypes = buildBaseTypes(types, customizeSchemaArgs)

  args.actions.createTypes(baseTypes)

  const typePathsKey = sprintf(
    TYPE_PATHS_KEY_TEMPLATE,
    pluginOptions.repositoryName,
    args.createContentDigest(pluginOptions.schemas),
  )

  args.cache.set(typePathsKey, typePaths)
}

function schemaToType<TSource, TContext>(
  name: string,
  schema: PrismicSchema,
  args: SchemaCustomizationArgs,
): {
  type: gatsby.GatsbyGraphQLObjectType
  typePaths: TypePath[]
} {
  let typePaths = [] as TypePath[]

  const fieldSchemas = collectSchemaFields(schema)
  const res = toFieldConfigMap<TSource, TContext>([name], fieldSchemas, args)
  typePaths = [...typePaths, ...res.typePaths]

  const rootFields = {} as gqlc.ComposeFieldConfigMap<TSource, TContext>
  const dataFields = {} as gqlc.ComposeFieldConfigMap<TSource, TContext>

  for (const fieldID in res.fieldConfigMap) {
    const fieldConfig = res.fieldConfigMap[fieldID]
    if (!fieldConfig) {
      continue
    }

    if (PRISMIC_API_NON_DATA_FIELDS.includes(fieldID)) {
      rootFields[fieldID] = fieldConfig
    } else {
      dataFields[fieldID] = fieldConfig
    }
  }

  const dataType = args.buildObjectType({
    name: args.nodeHelpers.createTypeName(name, 'DataType'),
    fields: dataFields,
  })

  args.createTypes(dataType)

  typePaths = [
    ...typePaths,
    buildTypePath([name, 'data'], dataType.config.name),
  ]

  const type = args.buildObjectType({
    name: args.nodeHelpers.createTypeName(name),
    fields: {
      ...rootFields,
      [args.nodeHelpers.createFieldName('id') as 'id']: 'ID!',
      data: dataType.config.name,
      dataRaw: {
        type: 'JSON!',
        resolve: identity,
      },
      first_publication_date: {
        type: 'Date!',
        extensions: { dateformat: {} },
      },
      href: 'String!',
      lang: 'String!',
      last_publication_date: {
        type: 'Date!',
        extensions: { dateformat: {} },
      },
      tags: '[String!]!',
      type: 'String!',
      url: {
        type: 'String',
        resolve: (source: PrismicDocumentNode) => {
          if (args.pluginOptions.linkResolver) {
            return args.pluginOptions.linkResolver(source)
          }

          return undefined
        },
      },
      [PREVIEWABLE_NODE_ID_FIELD]: {
        type: 'ID!',
        resolve: (source: PrismicDocumentNode) => {
          return source[args.nodeHelpers.createFieldName('id')]
        },
      },
    },
    interfaces: ['Node'],
    extensions: { infer: false },
  })

  args.createTypes(type)

  typePaths = [...typePaths, buildTypePath([name], type.config.name)]

  return { type, typePaths }
}

function collectSchemaFields(
  schema: PrismicSchema,
): Record<string, PrismicFieldSchema> {
  const fields = {} as Record<string, PrismicFieldSchema>

  for (const tabID in schema) {
    Object.assign(fields, schema[tabID])
  }

  return fields
}

function toFieldConfig<TSource, TContext>(
  path: string[],
  schema: PrismicFieldSchema,
  args: SchemaCustomizationArgs,
): {
  type: gqlc.ComposeFieldConfig<TSource, TContext>
  typePaths: TypePath[]
} {
  switch (schema.type) {
    case PrismicFieldType.Color:
    case PrismicFieldType.Select:
    case PrismicFieldType.Text:
    case PrismicFieldType.UID: {
      const type = 'String'

      return {
        type,
        typePaths: [buildTypePath(path, type)],
      }
    }

    case PrismicFieldType.Boolean: {
      const type = 'Boolean'

      return {
        type,
        typePaths: [buildTypePath(path, type)],
      }
    }

    case PrismicFieldType.Number: {
      const type = 'Float'

      return {
        type,
        typePaths: [buildTypePath(path, type)],
      }
    }

    case PrismicFieldType.Date:
    case PrismicFieldType.Timestamp: {
      const type = {
        type: 'Date',
        extensions: { dateformat: {} },
      }

      return {
        type,
        typePaths: [buildTypePath(path, type.type)],
      }
    }

    case PrismicFieldType.StructuredText: {
      const type = args.buildObjectType({
        name: args.nodeHelpers.createTypeName('StructuredTextType'),
        fields: {
          text: {
            type: 'String',
            resolve: (source: PrismicStructuredTextField) =>
              PrismicDOM.RichText.asText(source),
          },
          html: {
            type: 'String',
            resolve: (source: PrismicStructuredTextField) =>
              PrismicDOM.RichText.asHtml(
                source,
                args.pluginOptions.linkResolver,
                args.pluginOptions.htmlSerializer,
              ),
            raw: {
              type: 'JSON',
              resolve: identity,
            },
          },
        },
      })

      args.createTypes(type)

      return {
        type: type.config.name,
        typePaths: [buildTypePath(path, type.config.name)],
      }
    }

    case PrismicFieldType.GeoPoint: {
      const type = args.buildObjectType({
        name: args.nodeHelpers.createTypeName('GeoPointType'),
        fields: {
          longitude: 'Float',
          latitude: 'Float',
        },
      })

      args.createTypes(type)

      return {
        type: type.config.name,
        typePaths: [buildTypePath(path, type.config.name)],
      }
    }

    case PrismicFieldType.Embed: {
      const type = args.buildObjectType({
        name: args.nodeHelpers.createTypeName('EmbedType'),
        extensions: {
          infer: true,
        },
      })

      args.createTypes(type)

      return {
        type: type.config.name,
        typePaths: [buildTypePath(path, type.config.name)],
      }
    }

    case PrismicFieldType.Image: {
      const type = 'JSON'

      return {
        type,
        typePaths: [buildTypePath(path, type)],
      }
    }

    case PrismicFieldType.Link: {
      const type = args.buildObjectType({
        name: args.nodeHelpers.createTypeName('LinkType'),
        fields: {
          link_type: args.globalNodeHelpers.createTypeName('LinkTypes'),
          isBroken: 'Boolean',
          url: {
            type: 'String',
            resolve: (source: PrismicLinkField) => {
              return PrismicDOM.Link.url(
                source,
                args.pluginOptions.linkResolver,
              )
            },
          },
          target: 'String',
          size: 'Int',
          id: 'ID',
          type: 'String',
          tags: '[String]',
          lang: 'String',
          slug: 'String',
          uid: 'String',
          document: {
            type: args.nodeHelpers.createTypeName('AllDocumentTypes'),
            resolve: (source: PrismicLinkField) => {
              if (
                source.link_type === 'Document' &&
                !source.isBroken &&
                source.id
              ) {
                return args.nodeHelpers.createNodeId(source.id)
              }

              return undefined
            },
          },
          raw: {
            type: 'JSON',
            resolve: identity,
          },
        },
      })

      args.createTypes(type)

      return {
        type: type.config.name,
        typePaths: [buildTypePath(path, type.config.name)],
      }
    }

    case PrismicFieldType.Group: {
      const res = toFieldConfigMap(path, schema.config.fields, args)
      const type = args.buildObjectType({
        name: args.nodeHelpers.createTypeName(...path, 'GroupType'),
        fields: res.fieldConfigMap,
      })

      args.createTypes(type)

      const typeName = listTypeName(type.config.name)

      return {
        type: typeName,
        typePaths: [
          ...res.typePaths,
          buildTypePath(path, typeName, PrismicFieldType.Group),
        ],
      }
    }

    case PrismicFieldType.Slices: {
      const [types, sliceTypePaths] = toSliceTypes(
        path,
        schema.config.choices,
        args,
      )
      let typeNames = [] as string[]

      for (const type of types) {
        args.createTypes(type)
        typeNames = [...typeNames, type.config.name]
      }

      const type = args.buildUnionType({
        name: args.nodeHelpers.createTypeName(...path, 'SlicesType'),
        types: typeNames,
        resolveType: (source: PrismicSliceField) => {
          return args.nodeHelpers.createTypeName(...path, source.slice_type)
        },
      })

      args.createTypes(type)

      const typeName = listTypeName(type.config.name)

      return {
        type: typeName,
        typePaths: [
          ...sliceTypePaths,
          buildTypePath(path, typeName, PrismicFieldType.Slices),
        ],
      }
    }

    default: {
      const type = 'JSON'

      return {
        type,
        typePaths: [buildTypePath(path, type)],
      }
    }
  }
}

function buildSliceChoiceType(
  path: string[],
  schema: PrismicSliceSchema,
  args: SchemaCustomizationArgs,
): [type: gatsby.GatsbyGraphQLObjectType, typePaths: TypePath[]] {
  const fields = {} as Record<'primary' | 'items', string>
  let typePaths = [] as TypePath[]

  if (Object.keys(schema['non-repeat']).length > 0) {
    const res = toFieldConfigMap(path, schema['non-repeat'], args)
    const type = args.buildObjectType({
      name: args.nodeHelpers.createTypeName(...path, 'PrimaryType'),
      fields: res.fieldConfigMap,
    })

    args.createTypes(type)

    const typeName = type.config.name

    fields.primary = typeName

    typePaths = [
      ...typePaths,
      ...res.typePaths,
      buildTypePath([...path, 'primary'], typeName),
    ]
  }

  if (Object.keys(schema.repeat).length > 0) {
    const res = toFieldConfigMap(path, schema.repeat, args)
    const type = args.buildObjectType({
      name: args.nodeHelpers.createTypeName(...path, 'ItemType'),
      fields: res.fieldConfigMap,
    })

    args.createTypes(type)

    const typeName = listTypeName(type.config.name)

    fields.items = typeName

    typePaths = [
      ...typePaths,
      ...res.typePaths,
      buildTypePath([...path, 'items'], typeName),
    ]
  }

  const type = args.buildObjectType({
    name: args.nodeHelpers.createTypeName(...path),
    fields: {
      ...fields,
      slice_type: 'String!',
      slice_label: 'String',
    },
  })

  typePaths = [...typePaths, buildTypePath(path, type.config.name)]

  return [type, typePaths]
}

function toSliceTypes(
  path: string[],
  choices: PrismicSlicesFieldSchema['config']['choices'],
  args: SchemaCustomizationArgs,
): [types: gatsby.GatsbyGraphQLObjectType[], typePaths: TypePath[]] {
  let types = [] as gatsby.GatsbyGraphQLObjectType[]
  let typePaths = [] as TypePath[]

  for (const choiceID in choices) {
    const schema = choices[choiceID]

    if (schema) {
      const [choiceType, choiceTypePaths] = buildSliceChoiceType(
        [...path, choiceID],
        schema,
        args,
      )

      types = [...types, choiceType]
      typePaths = [...typePaths, ...choiceTypePaths]
    }
  }

  return [types, typePaths]
}

function toFieldConfigMap<TSource, TContext>(
  path: string[],
  fields: Record<string, PrismicFieldSchema>,
  args: SchemaCustomizationArgs,
): {
  fieldConfigMap: gqlc.ComposeFieldConfigMap<TSource, TContext>
  typePaths: TypePath[]
} {
  const fieldConfigMap = {} as gqlc.ComposeFieldConfigMap<TSource, TContext>
  let typePaths = [] as TypePath[]

  for (const fieldID in fields) {
    const schema = fields[fieldID]

    if (schema) {
      const res = toFieldConfig<TSource, TContext>(
        [...path, fieldID],
        schema,
        args,
      )

      fieldConfigMap[fieldID] = res.type

      typePaths = [...typePaths, ...res.typePaths]
    }
  }

  return { fieldConfigMap, typePaths }
}

function buildTypePath(
  path: string[],
  type: string,
  fieldType?: PrismicFieldType,
): TypePath {
  return { path, type, fieldType }
}

function buildBaseTypes(
  allDocumentTypes: gatsby.GatsbyGraphQLObjectType[],
  args: SchemaCustomizationArgs,
): gatsby.GatsbyGraphQLType[] {
  let allDocumentTypeNames = [] as string[]
  for (const type of allDocumentTypes) {
    allDocumentTypeNames = [...allDocumentTypeNames, type.config.name]
  }

  const AllDocumentTypes = args.buildUnionType({
    name: args.nodeHelpers.createTypeName('AllDocumentTypes'),
    types: allDocumentTypeNames,
  })

  const LinkTypes = args.buildEnumType({
    name: args.globalNodeHelpers.createTypeName('LinkTypes'),
    values: {
      Any: {},
      Document: {},
      Media: {},
      Web: {},
    },
  })

  return [AllDocumentTypes, LinkTypes]
}
