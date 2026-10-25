const fs = require('fs');

const file = 'src/App.tsx';
let source = fs.readFileSync(file, 'utf8');

const typeMarker = 'const initialHabits: Habit[] = [';
const typeBlock = [
  'type CafeCatalogItem = {',
  '  itemId: string',
  '  name: string',
  '  price: number',
  '  icon?: string',
  '  description?: string',
  '  repeatable?: boolean',
  '}',
  ''
].join('\n');

const stateMarker = "  const [notice, setNotice] = useState('')";
const stateBlock = [
  "  const [cafeItems, setCafeItems] = useState<CafeCatalogItem[]>([])",
  '  const [beanBalance, setBeanBalance] = useState(0)',
  '  const [cafeLoading, setCafeLoading] = useState(false)',
  ''
].join('\n');

if (!source.includes(typeMarker)) {
  throw new Error('Could not find the habits type insertion point. No changes written.');
}
if (!source.includes(stateMarker)) {
  throw new Error('Could not find the notice state. No changes written.');
}
if (source.includes('type CafeCatalogItem =')) {
  throw new Error('CafeCatalogItem already exists. No changes written.');
}

source = source.replace(typeMarker, typeBlock + typeMarker);
source = source.replace(stateMarker, stateMarker + '\n' + stateBlock);

const effectMarker = "  const [cafeLoading, setCafeLoading] = useState(false)";
const effectBlock = [
  '',
  '  useEffect(() => {',
  '    if (!user) return',
  '    let active = true',
  '    setCafeLoading(true)',
  '    Promise.all([',
  "      apiRequest<CafeCatalogItem[]>('/cafe/items'),",
  "      apiRequest<{ beanBalance?: number }>('/cafe'),",
  '    ])',
  '      .then(([itemsResult, cafeResult]) => {',
  '        if (!active) return',
  '        setCafeItems(itemsResult.data ?? [])',
  '        setBeanBalance(cafeResult.data?.beanBalance ?? user.beanBalance ?? 0)',
  '      })',
  '      .catch((error) => {',
  "        if (active) setNotice(error instanceof Error ? error.message : 'Could not load café data.')",
  '      })',
  '      .finally(() => {',
  '        if (active) setCafeLoading(false)',
  '      })',
  '    return () => { active = false }',
  '  }, [user?.id])'
].join('\n');

source = source.replace(effectMarker, effectMarker + effectBlock);

fs.copyFileSync(file, file + '.before-cafe-api');
fs.writeFileSync(file, source, 'utf8');
console.log('Café state and loading added. Backup: App.tsx.before-cafe-api');
