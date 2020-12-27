import * as gatsby from 'gatsby'

import { reporterMessage } from './reporterMessage'

export function reportError(
  message: string,
  repositoryName: string,
  errorReporter: gatsby.Reporter['error'],
): void {
  const formattedMessage = reporterMessage(message, repositoryName)

  errorReporter(formattedMessage)
}
