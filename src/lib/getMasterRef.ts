import { COULD_NOT_FIND_MASTER_REF_MSG } from '../constants'
import { PrismicRef } from '../types'
import {
  getRepositoryInfo,
  GetRepositoryInfoOptions,
} from './getRepositoryInfo'
import { invariant } from './invariant'

export type GetMasterRefOptions = GetRepositoryInfoOptions

export async function getMasterRef(
  repositoryName: string,
  options: GetMasterRefOptions,
): Promise<PrismicRef> {
  const repositoryInfo = await getRepositoryInfo(repositoryName, {
    accessToken: options.accessToken,
    apiEndpoint: options.apiEndpoint,
  })

  const masterRef = repositoryInfo.refs.find((ref) => ref.isMasterRef)
  invariant(masterRef, COULD_NOT_FIND_MASTER_REF_MSG, repositoryName)

  return masterRef
}
