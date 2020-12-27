import { reporterMessage } from './reporterMessage'

export function invariant(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  condition: any,
  message: string,
  repositoryName: string,
): asserts condition {
  if (condition) {
    return
  }

  const formattedMessage = reporterMessage(message, repositoryName)

  throw new Error(formattedMessage)
}
