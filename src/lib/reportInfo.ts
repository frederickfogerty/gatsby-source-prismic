import * as gatsby from 'gatsby'

import { reporterMessage } from './reporterMessage'

export function reportInfo(
  message: string,
  repositoryName: string,
  infoReporter: gatsby.Reporter['info'],
): void {
  const formattedMessage = reporterMessage(message, repositoryName)

  infoReporter(formattedMessage)
}
