import { TYPE_PATH_DELIMITER } from '../constants'

export function serializePath(path: string[]): string {
  return path.join(TYPE_PATH_DELIMITER)
}
