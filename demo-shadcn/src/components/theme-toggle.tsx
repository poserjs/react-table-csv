import * as React from 'react'
import { Button } from './ui/button'
import { Sun, Moon } from 'lucide-react'

export const ThemeToggle: React.FC = () => {
  const [dark, setDark] = React.useState<boolean>(() => document.documentElement.classList.contains('dark'))
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('demo-shadcn-theme', dark ? 'dark' : 'lite')
  }, [dark])
  React.useEffect(() => {
    const saved = localStorage.getItem('demo-shadcn-theme')
    if (saved === 'dark' || saved === 'lite') setDark(saved === 'dark')
  }, [])
  return (
    <Button variant="outline" size="icon" onClick={() => setDark(v => !v)} title={dark ? 'Switch to light' : 'Switch to dark'}>
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </Button>
  )
}

