import { useSearchParams } from 'react-router-dom'
import CataloguePage from '../catalogue/CataloguePage'
import ContulMeu from './ContulMeu'

const TABS = [
  { id: 'catalog', label: 'Catalog' },
  { id: 'contul-meu', label: 'Contul Meu' },
]

export default function AcasaPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') ?? 'catalog'

  function setTab(id) {
    setSearchParams({ tab: id })
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Tab bar */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="tab-bar" style={{ marginBottom: 0 }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => setTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'catalog' && <CataloguePage />}
      {activeTab === 'contul-meu' && <ContulMeu />}
    </div>
  )
}
