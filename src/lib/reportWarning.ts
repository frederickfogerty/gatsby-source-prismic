import * as gatsby from 'gatsby'

import { reporterMessage } from './reporterMessage'

export function reportWarning(
  message: string,
  repositoryName: string,
  warningReporter: gatsby.Reporter['warn'],
): void {
  const formattedMessage = reporterMessage(message, repositoryName)

  warningReporter(formattedMessage)
}
