import { useEffect, useState, type RefObject } from 'react'

const DEFAULT_LABEL = 'Copy route'

interface CopyRouteButtonProps {
  text: string
  fallbackTarget: RefObject<HTMLElement | null>
}

export function CopyRouteButton({ text, fallbackTarget }: CopyRouteButtonProps) {
  const [label, setLabel] = useState(DEFAULT_LABEL)

  useEffect(() => {
    if (label === DEFAULT_LABEL) return
    const timer = setTimeout(() => setLabel(DEFAULT_LABEL), 1400)
    return () => clearTimeout(timer)
  }, [label])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setLabel('Copied ✓')
    } catch {
      // clipboard api is fussy on http - just select it instead
      const target = fallbackTarget.current
      const selection = window.getSelection()
      if (target && selection) {
        const range = document.createRange()
        range.selectNodeContents(target)
        selection.removeAllRanges()
        selection.addRange(range)
      }
      setLabel('Select and copy')
    }
  }

  return (
    <button className="copy-btn" type="button" onClick={copy} disabled={!text} aria-live="polite">
      {label}
    </button>
  )
}
