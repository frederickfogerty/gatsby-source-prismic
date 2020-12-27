import * as pc from 'pascal-case'

/**
 * Converts a collection of strings to a single Pascal cased string.
 *
 * @param parts Strings to convert into a single Pascal cased string.
 *
 * @return Pascal cased string version of `parts`.
 */
export function pascalCase(...parts: (string | null | undefined)[]): string {
  return pc.pascalCase(parts.filter((p) => p != null).join(' '), {
    transform: pc.pascalCaseTransformMerge,
  })
}
