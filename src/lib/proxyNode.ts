import * as PrismicDOM from 'prismic-dom'

import {
  PluginOptions,
  PrismicFieldType,
  TypePath,
  UnknownRecord,
} from '../types'
import { serializePath } from './serializePath'

type ProxyDocumentArgs = {
  pluginOptions: PluginOptions
}

export function proxyDocument<T extends UnknownRecord>(
  path: string[],
  target: T,
  typePaths: TypePath[],
  args: ProxyDocumentArgs,
): T {
  return new Proxy(target, {
    get(target, prop, receiver) {
      const defaultResponse = Reflect.get(target, prop, receiver)

      if (typeof prop !== 'string') {
        return defaultResponse
      }

      const typePath = typePaths.find(
        (typePath) => typePath.path === serializePath([...path, prop]),
      )

      if (!typePath) {
        return defaultResponse
      }

      const value = target[prop]

      switch (typePath.fieldType) {
        case PrismicFieldType.StructuredText: {
          return {
            text: PrismicDOM.RichText.asText(value),
            html: PrismicDOM.RichText.asHtml(
              value,
              args.pluginOptions.linkResolver,
              args.pluginOptions.htmlSerializer,
            ),
            raw: value,
          }
        }

        default: {
          return defaultResponse
        }
      }
    },
  })
}
