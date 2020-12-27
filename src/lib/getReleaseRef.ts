import { COULD_NOT_FIND_RELEASE_REF_MSG } from '../constants'
import { PrismicRef } from '../types'
import {
  getRepositoryInfo,
  GetRepositoryInfoOptions,
} from './getRepositoryInfo'
import { invariant } from './invariant'

export type GetMasterRefOptions = GetRepositoryInfoOptions

export async function getReleaseRef(
  repositoryName: string,
  releaseID: string,
  options: GetMasterRefOptions,
): Promise<PrismicRef> {
  const repositoryInfo = await getRepositoryInfo(repositoryName, {
    accessToken: options.accessToken,
    apiEndpoint: options.apiEndpoint,
  })

  const releaseRef = repositoryInfo.refs.find((ref) => ref.id === releaseID)
  invariant(releaseRef, COULD_NOT_FIND_RELEASE_REF_MSG, repositoryName)

  return releaseRef
}
