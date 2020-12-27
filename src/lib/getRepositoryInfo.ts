import fetch from 'cross-fetch'

import { COULD_NOT_FETCH_REPOSITORY_INFO_MSG } from '../constants'
import { PrismicRepositoryInfo } from '../types'
import { buildPrismicURL, BuildPrismicURLOptions } from './buildPrismicURL'
import { invariant } from './invariant'
import { sprintf } from './sprintf'

export type GetRepositoryInfoOptions = Pick<
  BuildPrismicURLOptions,
  'accessToken' | 'apiEndpoint'
>

export async function getRepositoryInfo(
  repositoryName: string,
  options: GetRepositoryInfoOptions,
): Promise<PrismicRepositoryInfo> {
  const url = buildPrismicURL(repositoryName, {
    ref: undefined,
    accessToken: options.accessToken,
    apiEndpoint: options.apiEndpoint,
    graphQuery: undefined,
    fetchLinks: undefined,
    lang: undefined,
  })

  const res = await fetch(url)
  const json = (await res.json()) as PrismicRepositoryInfo | { error: string }

  if ('error' in json) {
    invariant(
      false,
      sprintf(COULD_NOT_FETCH_REPOSITORY_INFO_MSG, json.error),
      repositoryName,
    )
  }

  return json
}
