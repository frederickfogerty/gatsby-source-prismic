import * as gatsby from 'gatsby'

import { REPORTER_TEMPLATE } from '../constants'
import { sprintf } from './sprintf'

export function reportError(
  message: string,
  repositoryName: string,
  errorReporter: gatsby.Reporter['error'],
): void {
  const formattedMessage = sprintf(REPORTER_TEMPLATE, repositoryName, message)

  errorReporter(formattedMessage)
}
