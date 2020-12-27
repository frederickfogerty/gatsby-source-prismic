import * as gatsby from 'gatsby'
import * as gatsbyImgix from 'gatsby-plugin-imgix'
import * as PrismicDOM from 'prismic-dom'

type UnknownRecord<K extends PropertyKey = PropertyKey> = Record<K, unknown>

export interface PluginOptions extends gatsby.PluginOptions {
  repositoryName: string
  accessToken?: string
  apiEndpoint?: string
  releaseID?: string
  graphQuery?: string
  fetchLinks?: string[]
  lang: string
  linkResolver?: (doc: PrismicDocument) => string
  htmlSerializer?: typeof PrismicDOM.HTMLSerializer
  imageImgixParams: gatsbyImgix.ImgixUrlParams
  imagePlaceholderImgixParams: gatsbyImgix.ImgixUrlParams
  shouldDownloadImage?: (args: ShouldDownloadImageArgs) => boolean
  typePrefix?: string
  webhookSecret?: string
  plugins: []
}

type ShouldDownloadImageArgs = {
  node: PrismicDocument
  key: string
  value: string
}

export type PrismicRef = {
  id: string
  ref: string
  label: string
  isMasterRef: boolean
}

export interface PrismicDocument<
  TData extends UnknownRecord<string> = UnknownRecord<string>
> {
  id: string
  uid?: string
  url?: string
  type: string
  href: string
  tags: string[]
  slugs: string[]
  lang?: string
  alternate_languages: PrismicAlternateLanguage[]
  first_publication_date: string | null
  last_publication_date: string | null
  data: TData
}

interface PrismicAlternateLanguage {
  id: string
  uid?: string
  type: string
  lang: string
}

export type PrismicWebhookBody =
  | PrismicWebhookBodyApiUpdate
  | PrismicWebhookBodyTestTrigger

export enum PrismicWebhookType {
  APIUpdate = 'api-update',
  TestTrigger = 'test-trigger',
}

interface PrismicWebhookBodyBase {
  type: PrismicWebhookType
  domain: string
  apiUrl: string
  secret: string | null
}

export interface PrismicWebhookBodyApiUpdate extends PrismicWebhookBodyBase {
  type: PrismicWebhookType.APIUpdate
  masterRef?: string
  releases: PrismicWebhookOperations<PrismicWebhookRelease>
  masks: PrismicWebhookOperations<PrismicWebhookMask>
  tags: PrismicWebhookOperations<PrismicWebhookTag>
  documents: string[]
  experiments?: PrismicWebhookOperations<PrismicWebhookExperiment>
}

export interface PrismicWebhookBodyTestTrigger extends PrismicWebhookBodyBase {
  type: PrismicWebhookType.TestTrigger
}

interface PrismicWebhookOperations<T> {
  update?: T[]
  addition?: T[]
  deletion?: T[]
}

interface PrismicWebhookMask {
  id: string
  label: string
}

interface PrismicWebhookTag {
  id: string
}

export interface PrismicWebhookRelease {
  id: string
  ref: string
  label: string
  documents: string[]
}

/**
 * @deprecated
 */
interface PrismicWebhookExperiment {
  id: string
  name: string
  variations: PrismicWebhookExperimentVariation[]
}

/**
 * @deprecated
 */
interface PrismicWebhookExperimentVariation {
  id: string
  ref: string
  label: string
}
