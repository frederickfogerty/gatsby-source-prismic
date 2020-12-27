import * as gatsby from 'gatsby'

import { REPORTER_TEMPLATE } from '../constants'
import { sprintf } from './sprintf'

export function reportInfo(
  message: string,
  repositoryName: string,
  infoReporter: gatsby.Reporter['info'],
): void {
  const formattedMessage = sprintf(REPORTER_TEMPLATE, repositoryName, message)

  infoReporter(formattedMessage)
}
