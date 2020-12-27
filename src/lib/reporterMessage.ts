import { REPORTER_TEMPLATE } from '../constants'
import { sprintf } from './sprintf'

export function reporterMessage(
  message: string,
  repositoryName: string,
): string {
  return sprintf(REPORTER_TEMPLATE, repositoryName, message)
}
