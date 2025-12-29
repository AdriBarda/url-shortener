import { ref } from 'vue'

export const useClipboard = () => {
  const copying = ref(false)
  const lastCopied = ref<string | null>(null)
  const error = ref<string | null>(null)
  let clearTimer: number | null = null

  const copy = async (text: string) => {
    copying.value = true
    error.value = null

    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable')
      }

      await navigator.clipboard.writeText(text)
      lastCopied.value = text

      if (clearTimer) {
        window.clearTimeout(clearTimer)
        clearTimer = null
      }
      clearTimer = window.setTimeout(() => {
        lastCopied.value = null
      }, 1500)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to copy'
      throw err
    } finally {
      copying.value = false
    }
  }

  return { copying, lastCopied, error, copy }
}
