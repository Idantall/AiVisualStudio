import { useState, useEffect } from "react"

interface TypewriterOptions {
  words: string[]
  typeSpeed?: number
  deleteSpeed?: number
  delayBetweenWords?: number
}

export function useTypewriter({ words, typeSpeed = 100, deleteSpeed = 50, delayBetweenWords = 2000 }: TypewriterOptions) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentText, setCurrentText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)

  useEffect(() => {
    if (words.length === 0) return

    const currentWord = words[currentWordIndex]

    const timer = setTimeout(() => {
      if (isWaiting) {
        setIsWaiting(false)
        setIsDeleting(true)
        return
      }

      if (isDeleting) {
        if (currentText === "") {
          setIsDeleting(false)
          setCurrentWordIndex((prev) => (prev + 1) % words.length)
        } else {
          setCurrentText(currentWord.substring(0, currentText.length - 1))
        }
      } else {
        if (currentText === currentWord) {
          setIsWaiting(true)
        } else {
          setCurrentText(currentWord.substring(0, currentText.length + 1))
        }
      }
    }, isWaiting ? delayBetweenWords : isDeleting ? deleteSpeed : typeSpeed)

    return () => clearTimeout(timer)
  }, [currentText, currentWordIndex, isDeleting, isWaiting, words, typeSpeed, deleteSpeed, delayBetweenWords])

  return { text: currentText, isDeleting }
}