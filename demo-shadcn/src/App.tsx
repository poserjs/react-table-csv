import React from 'react'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader } from './components/ui/card'
import { ThemeToggle } from './components/theme-toggle'
import Dash0 from './pages/Dash0'
import Dash1 from '../../demo/src/Dash1'
import Dash2 from '../../demo/src/Dash2'
import Dash3 from './pages/Dash3'
import Dash4 from './pages/Dash4'
import { ReactDuckDBContainer, useDuckDB } from '@poserjs/react-table-csv'

const useHashRoute = () => {
  const [route, setRoute] = React.useState<string>(() => window.location.hash || '#/dash0')
  React.useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/dash0')
    window.addEventListener('hashchange', onHash)
    if (!window.location.hash) window.location.hash = '#/dash0'
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return route.replace(/^#/, '')
}

const AppInner: React.FC = () => {
  const route = useHashRoute()
  const [collapsed, setCollapsed] = React.useState(false)
  const container = useDuckDB()

  const content = React.useMemo(() => {
    switch (route) {
      case '/dash1':
        return <Dash1 />
      case '/dash2':
        return <Dash2 />
      case '/dash3':
        return <Dash3 dbContainer={container} />
      case '/dash4':
        return <Dash4 dbContainer={container} />
      case '/dash0':
      default:
        return <Dash0 />
    }
  }, [route, container])

  const NavLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => {
    const active = '#'+route === href
    return (
      <a href={href} className={`rounded-md px-3 py-2 text-sm ${active ? 'bg-primary text-white' : 'text-foreground hover:bg-muted'}`}>
        {children}
      </a>
    )
  }

  return (
    <div className="min-h-screen flex">
      {!collapsed && (
        <aside className="w-60 border-r bg-background p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">ReactTableCSV Demos</div>
            <Button variant="outline" size="icon" onClick={() => setCollapsed(true)} title="Collapse">«</Button>
          </div>
          <nav className="flex flex-col gap-1">
            <NavLink href="#/dash0">Dash 0 · Local CSV/JSON</NavLink>
            <NavLink href="#/dash1">Dash 1 · Dashboard</NavLink>
            <NavLink href="#/dash2">Dash 2 · NoSQL</NavLink>
            <NavLink href="#/dash3">Dash 3 · DuckDB Page 1</NavLink>
            <NavLink href="#/dash4">Dash 4 · DuckDB Page 2</NavLink>
          </nav>
        </aside>
      )}
      {collapsed && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCollapsed(false)}
          className="m-2 fixed left-2 top-2 z-10"
          title="Expand navigation"
        >»</Button>
      )}

      <main className="flex-1 min-w-0 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">React Table CSV · shadcn/ui Demo</h1>
          <ThemeToggle />
        </div>
        <Card>
          <CardHeader>
            <div className="text-sm text-muted-foreground">Use the left navigation to switch demos</div>
          </CardHeader>
          <CardContent>
            {content}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

const App: React.FC = () => (
  <ReactDuckDBContainer dbs={{ cities: { dbURL: 'http://localhost:5173/cities.duckdb' } }}>
    <AppInner />
  </ReactDuckDBContainer>
)

export default App

