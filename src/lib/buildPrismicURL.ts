import { DEFAULT_PRISMIC_API_ENDPOINT } from '../constants'
import { PluginOptions } from '../types'
import { sprintf } from './sprintf'

export type BuildPrismicURLOptions = {
  ref: string | undefined
  accessToken: PluginOptions['accessToken']
  apiEndpoint: PluginOptions['apiEndpoint']
  graphQuery: PluginOptions['graphQuery']
  fetchLinks: PluginOptions['fetchLinks']
  lang: PluginOptions['lang'] | undefined
}

export function buildPrismicURL(
  repositoryName: string,
  options: BuildPrismicURLOptions,
): string {
  const apiEndpoint =
    options.apiEndpoint ?? sprintf(DEFAULT_PRISMIC_API_ENDPOINT, repositoryName)

  const url = new URL(apiEndpoint)

  if (options.accessToken) {
    url.searchParams.set('access_token', options.accessToken)
  }

  if (options.ref) {
    url.searchParams.set('ref', options.ref)
  }

  if (options.fetchLinks) {
    url.searchParams.set('fetchLinks', options.fetchLinks.join(','))
  }

  if (options.graphQuery) {
    url.searchParams.set('graphQuery', options.graphQuery)
  }

  if (options.lang) {
    url.searchParams.set('lang', options.lang)
  }

  return url.toString()
}
