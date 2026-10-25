const fs = require('fs');

const appPath = 'src/App.tsx';
const cssPath = 'src/App.css';
const backupPath = 'src/App.tsx.before-inventory';

let app = fs.readFileSync(appPath, 'utf8');
let css = fs.readFileSync(cssPath, 'utf8');

function replaceOnce(source, oldText, newText, label) {
  const first = source.indexOf(oldText);
  if (first < 0 || source.indexOf(oldText, first + oldText.length) >= 0) {
    throw new Error(`Expected exactly one match for: ${label}`);
  }
  return source.slice(0, first) + newText + source.slice(first + oldText.length);
}

const originalApp = app;
const originalCss = css;

app = replaceOnce(app,
`type CafeCatalogItem = {
  itemId: string
  name: string
  price: number
  icon?: string
  description?: string
  repeatable?: boolean
}`,
`type CafeCatalogItem = {
  itemId: string
  name: string
  price: number
  assetKey?: string
  category?: string
  width?: number
  height?: number
  isRepeatable?: boolean
  description?: string
}

type CafeInventoryItem = {
  itemId: string
  purchasedAt?: string
  quantity: number
}`,
'catalogue and inventory types');

app = replaceOnce(app,
`const navItems = [
  { name: 'Dashboard', icon: '⌂' },
  { name: 'My habits', icon: '☑' },
  { name: 'Expenses', icon: '◈' },
  { name: 'Daily journal', icon: '▤' },
  { name: 'My café', icon: '☕' },
  { name: 'Settings', icon: '⚙' },
]`,
`const navItems = [
  { name: 'Dashboard', icon: '⌂' },
  { name: 'My habits', icon: '☑' },
  { name: 'Expenses', icon: '◈' },
  { name: 'Daily journal', icon: '▤' },
  { name: 'My café', icon: '☕' },
  { name: 'Settings', icon: '⚙' },
]

function getCafeItemIcon(item?: CafeCatalogItem) {
  const icons: Record<string, string> = {
    plant_cactus: '🌵',
    plant_fern: '🪴',
    plant_bonsai: '🌳',
    plant_sunflower: '🌻',
    table_wood: '🪵',
    chair_cushion: '🪑',
    bookshelf_tall: '📚',
    sofa_cozy: '🛋️',
    coffee_machine_deluxe: '☕',
    rug_checkered: '🟫',
    wall_art_coffee: '🖼️',
    wall_clock: '🕰️',
    chalkboard: '🪧',
    lamp_floor: '🛋️',
    lamp_fairy: '✨',
    lantern_paper: '🏮',
    companion_cat: '🐈',
    companion_plant_buddy: '🌱',
  }
  return (item?.assetKey && icons[item.assetKey]) || '✦'
}`,
'catalogue icon helper');

app = replaceOnce(app,
`  const [cafeItems, setCafeItems] = useState<CafeCatalogItem[]>([])
  const [beanBalance, setBeanBalance] = useState(0)`,
`  const [cafeItems, setCafeItems] = useState<CafeCatalogItem[]>([])
  const [cafeInventory, setCafeInventory] = useState<CafeInventoryItem[]>([])
  const [beanBalance, setBeanBalance] = useState(0)`,
'inventory state');

app = replaceOnce(app,
`      apiRequest<CafeCatalogItem[]>('/cafe/items'),
      apiRequest<{ beanBalance?: number }>('/cafe'),`,
`      apiRequest<CafeCatalogItem[]>('/cafe/items'),
      apiRequest<{
        beanBalance?: number
        layout?: { inventory?: CafeInventoryItem[] }
      }>('/cafe'),`,
'café data request types');

app = replaceOnce(app,
`        setCafeItems(itemsResult.data ?? [])
        setBeanBalance(cafeResult.data?.beanBalance ?? user.beanBalance ?? 0)`,
`        setCafeItems(itemsResult.data ?? [])
        setCafeInventory(cafeResult.data?.layout?.inventory ?? [])
        setBeanBalance(cafeResult.data?.beanBalance ?? user.beanBalance ?? 0)`,
'initial inventory load');

app = replaceOnce(app,
`  const completed = habits.filter((habit) => habit.done).length`,
`  const ownedCafeItems = cafeInventory.reduce<Array<{ itemId: string; quantity: number }>>(
    (owned, entry) => {
      const existing = owned.find((item) => item.itemId === entry.itemId)
      if (existing) existing.quantity += entry.quantity
      else owned.push({ itemId: entry.itemId, quantity: entry.quantity })
      return owned
    },
    [],
  )

  const completed = habits.filter((habit) => habit.done).length`,
'owned inventory summary');

app = replaceOnce(app,
`      const result = await apiRequest<{ newBeanBalance: number }>('/cafe/purchases', {`,
`      const result = await apiRequest<{
        newBeanBalance: number
        layout?: { inventory?: CafeInventoryItem[] }
      }>('/cafe/purchases', {`,
'purchase response type');

app = replaceOnce(app,
`      setBeanBalance(newBalance)
      setPurchaseConfirmation({`,
`      setBeanBalance(newBalance)
      if (result.data?.layout?.inventory) {
        setCafeInventory(result.data.layout.inventory)
      } else {
        const refreshedCafe = await apiRequest<{
          layout?: { inventory?: CafeInventoryItem[] }
        }>('/cafe')
        setCafeInventory(refreshedCafe.data?.layout?.inventory ?? [])
      }
      setPurchaseConfirmation({`,
'refresh inventory after purchase');

app = replaceOnce(app,
`                    <span>{item.icon || String.fromCodePoint(0x2726)}</span>`,
`                    <span>{getCafeItemIcon(item)}</span>`,
'shop item icon');

const cafeStart = app.indexOf("{activePage === 'My café' && (");
const profileStart = app.indexOf("{activePage === 'My Profile' && (", cafeStart);
if (cafeStart < 0 || profileStart < 0) {
  throw new Error('Could not locate the My Café section and following profile section.');
}

const cafeSection = app.slice(cafeStart, profileStart);
const ending = `              </div>
            </section>
          )}`;
const endAt = cafeSection.lastIndexOf(ending);
if (endAt < 0) {
  throw new Error('Could not find the end of the My Café shop grid.');
}

const inventorySection = `              </div>

              <div className="cafe-inventory-section">
                <div className="cafe-inventory-heading">
                  <div>
                    <h3 className="section-subtitle">My Items</h3>
                    <p className="small-note">Everything you have bought for your little café.</p>
                  </div>
                  <span className="cafe-inventory-count">{ownedCafeItems.length} item types</span>
                </div>
                {ownedCafeItems.length === 0 ? (
                  <div className="cafe-inventory-empty">
                    <span>🧺</span>
                    <p>Your shelves are waiting for their first little treasures.</p>
                    <small>Buy something from the shop above to see it here.</small>
                  </div>
                ) : (
                  <div className="cafe-inventory-grid">
                    {ownedCafeItems.map((ownedItem) => {
                      const item = cafeItems.find((entry) => entry.itemId === ownedItem.itemId)
                      if (!item) return null
                      return (
                        <article className="cafe-inventory-item" key={ownedItem.itemId}>
                          <span className="cafe-inventory-icon">{getCafeItemIcon(item)}</span>
                          <div className="cafe-inventory-details">
                            <strong>{item.name}</strong>
                            <small>{item.category || 'Café item'}</small>
                          </div>
                          <span className="cafe-inventory-quantity">×{ownedItem.quantity}</span>
                        </article>
                      )
                    })}
                  </div>
                )}
                <p className="cafe-inventory-hint">Next up: place your owned items in the room editor.</p>
              </div>
            </section>
          )}`;

app = app.slice(0, cafeStart) +
  cafeSection.slice(0, endAt) + inventorySection +
  app.slice(profileStart);

if (app === originalApp) throw new Error('No frontend changes were made.');

const inventoryCss = `

/* My Café inventory */
.cafe-inventory-section {
  margin-top: 28px;
  padding-top: 8px;
  border-top: 1px solid var(--line);
}
.cafe-inventory-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.cafe-inventory-heading .section-subtitle {
  margin-top: 14px;
  margin-bottom: 5px;
}
.cafe-inventory-count {
  flex-shrink: 0;
  padding: 6px 10px;
  border: 1px solid #ead9c4;
  border-radius: 20px;
  color: #876a4e;
  background: #fff8ee;
  font-size: 10px;
  font-weight: 800;
}
.cafe-inventory-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 24px 12px;
  border: 1px dashed #dfcbb5;
  border-radius: 12px;
  background: #fffaf4;
  text-align: center;
}
.cafe-inventory-empty > span {
  font-size: 29px;
}
.cafe-inventory-empty p,
.cafe-inventory-empty small {
  margin: 0;
  color: #987e67;
  font-size: 11px;
}
.cafe-inventory-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}
.cafe-inventory-item {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  padding: 12px;
  border: 1px solid #eddfcf;
  border-radius: 10px;
  background: #fffaf3;
}
.cafe-inventory-icon {
  flex-shrink: 0;
  font-size: 25px;
}
.cafe-inventory-details {
  flex: 1;
  min-width: 0;
}
.cafe-inventory-details strong,
.cafe-inventory-details small {
  display: block;
  overflow-wrap: anywhere;
}
.cafe-inventory-details strong {
  color: #66503d;
  font-size: 11px;
}
.cafe-inventory-details small {
  margin-top: 4px;
  color: #a18a73;
  font-size: 9px;
  text-transform: capitalize;
}
.cafe-inventory-quantity {
  flex-shrink: 0;
  color: #8b7053;
  font-size: 11px;
  font-weight: 800;
}
.cafe-inventory-hint {
  margin-top: 12px;
  color: #9b866f;
  font-size: 10px;
}
@media (max-width: 760px) {
  .cafe-inventory-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
`;

if (!css.includes('/* My Café inventory */')) {
  css += inventoryCss;
}

fs.copyFileSync(appPath, backupPath);
try {
  fs.writeFileSync(appPath, app, 'utf8');
  fs.writeFileSync(cssPath, css, 'utf8');
} catch (error) {
  fs.writeFileSync(appPath, originalApp, 'utf8');
  fs.writeFileSync(cssPath, originalCss, 'utf8');
  throw error;
}

console.log('Inventory milestone applied.');
console.log(`Backup created: ${backupPath}`);
