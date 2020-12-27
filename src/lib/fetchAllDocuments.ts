import fetch from 'cross-fetch'

import { QUERY_PAGE_SIZE } from '../constants'
import { PrismicDocument } from '../types'
import { buildPrismicURL, BuildPrismicURLOptions } from './buildPrismicURL'

interface PagedReponse<T> {
  total_pages: number
  results: T[]
}

type FetchAllDocumentsOptions = BuildPrismicURLOptions

export async function fetchAllDocuments(
  repositoryName: string,
  options: FetchAllDocumentsOptions,
): Promise<PrismicDocument[]> {
  return aggregateFetchAllDocuments(repositoryName, options)
}

async function aggregateFetchAllDocuments(
  repositoryName: string,
  options: FetchAllDocumentsOptions,
  page = 1,
  documents: PrismicDocument[] = [],
): Promise<PrismicDocument[]> {
  const baseURL = buildPrismicURL(repositoryName, {
    ref: options.ref,
    apiEndpoint: options.apiEndpoint,
    accessToken: options.accessToken,
    graphQuery: options.graphQuery,
    fetchLinks: options.fetchLinks,
    lang: options.lang,
  })

  const url = new URL(baseURL)
  url.pathname = `${url.pathname}/documents/search`
  url.searchParams.set('q', '[]')
  url.searchParams.set('page', page.toString())
  url.searchParams.set('pageSize', QUERY_PAGE_SIZE.toString())

  const res = await fetch(url.toString())
  const json = (await res.json()) as PagedReponse<PrismicDocument>

  if (page < json.total_pages) {
    const nextPageDocuments = await aggregateFetchAllDocuments(
      repositoryName,
      options,
      page + 1,
      documents,
    )

    return [...documents, ...nextPageDocuments]
  }

  return [...documents, ...json.results]
}
