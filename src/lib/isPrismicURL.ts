import { PRISMIC_URL_REGEX } from '../constants'

/**
 * Determines if a given URL is a valid Prismic URL.
 *
 * @param url URL to test.
 */
export function isPrismicURL(url: string): boolean {
  return PRISMIC_URL_REGEX.test(url)
}
