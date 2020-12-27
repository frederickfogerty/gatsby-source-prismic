import invariant from 'tiny-invariant'

import { COULD_NOT_FIND_MASTER_REF } from '../constants'
import { PrismicRef } from '../types'
import { getRefs, GetRefsOptions } from './getRefs'

export type GetMasterRefOptions = GetRefsOptions

export async function getMasterRef(
  repositoryName: string,
  options: GetMasterRefOptions,
): Promise<PrismicRef> {
  const refs = await getRefs(repositoryName, {
    accessToken: options.accessToken,
    apiEndpoint: options.apiEndpoint,
  })

  const masterRef = refs.find((ref) => ref.isMasterRef)
  invariant(masterRef, COULD_NOT_FIND_MASTER_REF)

  return masterRef
}
