import * as PrismicDOM from 'prismic-dom'
import * as gatsby from 'gatsby'
import * as gatsbyImgix from 'gatsby-plugin-imgix'

export type UnknownRecord<K extends PropertyKey = PropertyKey> = Record<
  K,
  unknown
>

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
  schemas: Record<string, PrismicSchema>
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

export interface TypePath {
  path: string
  type: string
  fieldType?: PrismicFieldType
}

export interface PrismicRepositoryInfo {
  refs: PrismicRef[]
  types: Record<string, string>
  languages: PrismicLanguage[]
  tags: string[]
}

interface PrismicLanguage {
  id: string
  name: string
}

export interface PrismicRef {
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

export interface PrismicDocumentNode<
  TData extends UnknownRecord<string> = UnknownRecord<string>
> extends PrismicDocument<TData>,
    gatsby.Node {
  prismicId: string
}

interface PrismicAlternateLanguage {
  id: string
  uid?: string
  type: string
  lang: string
}

export interface PrismicSchema {
  [tabName: string]: PrismicTabSchema
}

interface PrismicTabSchema {
  [fieldName: string]: PrismicFieldSchema
}

export type PrismicFieldSchema =
  | PrismicStandardFieldSchema
  | PrismicGroupFieldSchema
  | PrismicSlicesFieldSchema

export enum PrismicFieldType {
  Boolean = 'Boolean',
  Color = 'Color',
  Date = 'Date',
  Embed = 'Embed',
  GeoPoint = 'GeoPoint',
  Image = 'Image',
  Link = 'Link',
  Number = 'Number',
  Select = 'Select',
  StructuredText = 'StructuredText',
  Text = 'Text',
  Timestamp = 'Timestamp',
  UID = 'UID',
  Group = 'Group',
  Slice = 'Slice',
  Slices = 'Slices',
}

interface PrismicStandardFieldSchema {
  type: Exclude<PrismicFieldType, 'Group' | 'Slice' | 'Slices'>
  config: {
    label?: string
    placeholder?: string
  }
}

interface PrismicGroupFieldSchema {
  type: PrismicFieldType.Group
  config: {
    label?: string
    placeholder?: string
    fields: Record<string, PrismicStandardFieldSchema>
  }
}

export interface PrismicSliceSchema {
  type: PrismicFieldType.Slice
  'non-repeat': Record<string, PrismicStandardFieldSchema>
  repeat: Record<string, PrismicStandardFieldSchema>
}

export interface PrismicSlicesFieldSchema {
  type: PrismicFieldType.Slices
  config: {
    labels?: Record<string, string[]>
    choices: Record<string, PrismicSliceSchema>
  }
}

interface PrismicStructuredTextFieldItem {
  type: string
  text: string
  spans: { [key: string]: unknown }
}

export type PrismicStructuredTextField = PrismicStructuredTextFieldItem[]

export interface PrismicLinkField {
  link_type: 'Any' | 'Document' | 'Media' | 'Web'
  isBroken: boolean
  url?: string
  target?: string
  size?: number
  id?: string
  type?: string
  tags?: string[]
  lang?: string
  slug?: string
  uid?: string
}

export interface PrismicSliceField {
  slice_type: string
  slice_label: string
  items: UnknownRecord[]
  primary: UnknownRecord
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
