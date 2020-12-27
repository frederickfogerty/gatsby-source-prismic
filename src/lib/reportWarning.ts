import * as gatsby from 'gatsby'

import { REPORTER_TEMPLATE } from '../constants'
import { sprintf } from './sprintf'

export function reportWarning(
  message: string,
  repositoryName: string,
  warningReporter: gatsby.Reporter['warn'],
): void {
  const formattedMessage = sprintf(REPORTER_TEMPLATE, repositoryName, message)

  warningReporter(formattedMessage)
}
