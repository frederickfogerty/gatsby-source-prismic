import invariant from 'tiny-invariant'

import { COULD_NOT_FIND_RELEASE_REF } from '../constants'
import { PrismicRef } from '../types'
import { getRefs, GetRefsOptions } from './getRefs'

export type GetMasterRefOptions = GetRefsOptions

export async function getReleaseRef(
  repositoryName: string,
  releaseID: string,
  options: GetMasterRefOptions,
): Promise<PrismicRef> {
  const refs = await getRefs(repositoryName, {
    accessToken: options.accessToken,
    apiEndpoint: options.apiEndpoint,
  })

  const releaseRef = refs.find((ref) => ref.id === releaseID)
  invariant(releaseRef, COULD_NOT_FIND_RELEASE_REF)

  return releaseRef
}
