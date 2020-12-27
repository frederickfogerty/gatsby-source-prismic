import { PrismicRef } from '../types'
import { buildPrismicURL, BuildPrismicURLOptions } from './buildPrismicURL'

export type GetRefsOptions = Pick<
  BuildPrismicURLOptions,
  'accessToken' | 'apiEndpoint'
>

export async function getRefs(
  repositoryName: string,
  options: GetRefsOptions,
): Promise<PrismicRef[]> {
  const url = buildPrismicURL(repositoryName, {
    ref: undefined,
    accessToken: options.accessToken,
    apiEndpoint: options.apiEndpoint,
  })

  const res = await fetch(url)
  const json = (await res.json()) as { refs: PrismicRef[] }

  return json.refs
}
