const fs = require('fs');

const file = 'src/App.tsx';
let source = fs.readFileSync(file, 'utf8');

if (!source.includes("apiRequest<CafeCatalogItem[]>('/cafe/items')")) {
  throw new Error('Café loading code was not found. No changes written.');
}
if (!source.includes("activePage === 'My café'")) {
  throw new Error('Café page was not found. No changes written.');
}
if (source.includes('async function handleCafePurchase')) {
  throw new Error('Purchase handler already exists. No changes written.');
}

const handlerMarker = '  function toggleHabit(id: number) {';
const handler = [
  '  async function handleCafePurchase(itemId: string) {',
  '    setPurchasingItemId(itemId)',
  '    try {',
  "      const result = await apiRequest<{ newBeanBalance: number }>('/cafe/purchases', {",
  "        method: 'POST',",
  '        body: JSON.stringify({ itemId }),',
  '      })',
  '      if (typeof result.data?.newBeanBalance === "number") {',
  '        setBeanBalance(result.data.newBeanBalance)',
  '      }',
  "      setNotice(result.message ?? 'Your café item was purchased!')",
  '    } catch (error) {',
  "      setNotice(error instanceof Error ? error.message : 'Purchase failed. Please try again.')",
  '    } finally {',
  '      setPurchasingItemId(null)',
  '    }',
  '  }',
  ''
].join('\n');

const noticeMarker = "  const [notice, setNotice] = useState('')";
if (!source.includes(noticeMarker)) {
  throw new Error('Notice state was not found. No changes written.');
}
source = source.replace(
  noticeMarker,
  noticeMarker + "\n  const [purchasingItemId, setPurchasingItemId] = useState<string | null>(null)"
);

if (!source.includes(handlerMarker)) {
  throw new Error('Habit handler insertion point was not found. No changes written.');
}
source = source.replace(handlerMarker, handler + handlerMarker);

const startMarker = "          {activePage === 'My café' && (";
const endMarker = "          {activePage === 'Settings' && (";
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);

if (start < 0 || end < 0 || end <= start) {
  throw new Error('Could not isolate the café JSX block. No changes written.');
}

const cafePage = [
  "          {activePage === 'My café' && (",
  '            <section className="panel standalone-panel">',
  '              <div className="panel-heading">',
  '                <div><p className="eyebrow">BREWED WITH LOVE</p><h2>Your very own pixel café</h2></div>',
  '                <span className="bean-chip">{String.fromCodePoint(0x1FABD)} {beanBalance} beans</span>',
  '              </div>',
  '              <p className="panel-description">A little room to make your own. Pick out something cozy for your café.</p>',
  '              <div className="big-cafe-scene">',
  '                <div className="big-cafe-window">{String.fromCodePoint(0x2601)}<span>✦</span><i>✿</i></div>',
  '                <div className="big-cafe-shelf">📚　🪴　📚</div>',
  '                <div className="big-cafe-counter">🌿　▰ ☕ ▰　🪴</div>',
  '                <div className="big-cafe-floor" />',
  '              </div>',
  '              <h3 className="section-subtitle">A few things for your café</h3>',
  '              {cafeLoading && <p className="small-note">Loading your café shop...</p>}',
  '              {!cafeLoading && cafeItems.length === 0 && <p className="small-note">No café items are available right now. Check that the catalogue has been seeded.</p>}',
  '              <div className="shop-grid">',
  '                {cafeItems.map((item) => (',
  '                  <article className="shop-item" key={item.itemId}>',
  '                    <span>{item.icon || String.fromCodePoint(0x2726)}</span>',
  '                    <strong>{item.name}</strong>',
  '                    {item.description && <p>{item.description}</p>}',
  '                    <small>{String.fromCodePoint(0x1FABD)} {item.price} beans</small>',
  '                    <button',
  '                      className="soft-button"',
  '                      disabled={cafeLoading || purchasingItemId !== null || beanBalance < item.price}',
  '                      onClick={() => void handleCafePurchase(item.itemId)}',
  '                    >',
  '                      {purchasingItemId === item.itemId ? "Buying..." : beanBalance < item.price ? "Not enough beans" : "Buy item"}',
  '                    </button>',
  '                  </article>',
  '                ))}',
  '              </div>',
  '            </section>',
  '          )}',
  '',
  ''
].join('\n');

fs.copyFileSync(file, file + '.before-cafe-shop');
source = source.slice(0, start) + cafePage + source.slice(end);
fs.writeFileSync(file, source, 'utf8');
console.log('Café shop connected to catalogue and purchase API. Backup: App.tsx.before-cafe-shop');
