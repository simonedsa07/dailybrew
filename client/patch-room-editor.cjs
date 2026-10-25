const fs = require('fs');

const file = 'src/App.tsx';
const cssFile = 'src/App.css';
let s = fs.readFileSync(file, 'utf8');
let css = fs.readFileSync(cssFile, 'utf8');

function replaceOnce(source, oldText, newText, label) {
  const index = source.indexOf(oldText);
  if (index < 0) throw new Error('Could not find patch location: ' + label);
  return source.slice(0, index) + newText + source.slice(index + oldText.length);
}

// Backups
fs.copyFileSync(file, file + '.before-room-editor');
fs.copyFileSync(cssFile, cssFile + '.before-room-editor');

// 1. Placement type
s = replaceOnce(
  s,
  'type CafeInventoryItem = {',
  `type CafePlacement = {
  instanceId: string
  itemId: string
  slotX: number
  slotY: number
}

type CafeInventoryItem = {`,
  'café inventory type'
);

// 2. Editor state
s = replaceOnce(
  s,
  'const [cafeInventory, setCafeInventory] = useState<CafeInventoryItem[]>([])',
  `const [cafeInventory, setCafeInventory] = useState<CafeInventoryItem[]>([])
  const [cafePlacements, setCafePlacements] = useState<CafePlacement[]>([])
  const [roomTheme, setRoomTheme] = useState('cozy-brown')
  const [layoutSaving, setLayoutSaving] = useState(false)`,
  'café state'
);

// 3. Include saved layout in the initial load response type
s = replaceOnce(
  s,
  'layout?: { inventory?: CafeInventoryItem[] }',
  `layout?: {
          inventory?: CafeInventoryItem[]
          placements?: CafePlacement[]
          roomTheme?: string
        }`,
  'initial café layout response'
);

// 4. Load saved placements
s = replaceOnce(
  s,
  'setCafeInventory(cafeResult.data?.layout?.inventory ?? [])',
  `setCafeInventory(cafeResult.data?.layout?.inventory ?? [])
        setCafePlacements(cafeResult.data?.layout?.placements ?? [])
        setRoomTheme(cafeResult.data?.layout?.roomTheme ?? 'cozy-brown')`,
  'initial café layout state'
);

// 5. Editor actions
s = replaceOnce(
  s,
  '  function toggleHabit(id: number) {',
  `  function addCafePlacement(itemId: string) {
    const owned = ownedCafeItems.find((entry) => entry.itemId === itemId)
    if (!owned) return

    const alreadyPlaced = cafePlacements.filter((entry) => entry.itemId === itemId).length
    if (alreadyPlaced >= owned.quantity) {
      setNotice('All copies of this item are already in your room.')
      return
    }

    setCafePlacements((current) => [
      ...current,
      {
        instanceId: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        itemId,
        slotX: current.length % 8,
        slotY: Math.floor(current.length / 8) % 4,
      },
    ])
    setNotice('')
  }

  function moveCafePlacement(instanceId: string, dx: number, dy: number) {
    setCafePlacements((current) =>
      current.map((placement) =>
        placement.instanceId === instanceId
          ? {
              ...placement,
              slotX: Math.max(0, Math.min(7, placement.slotX + dx)),
              slotY: Math.max(0, Math.min(3, placement.slotY + dy)),
            }
          : placement,
      ),
    )
  }

  function removeCafePlacement(instanceId: string) {
    setCafePlacements((current) =>
      current.filter((placement) => placement.instanceId !== instanceId),
    )
  }

  async function saveCafeLayout() {
    setLayoutSaving(true)
    setNotice('')
    try {
      await apiRequest('/cafe/layout', {
        method: 'PUT',
        body: JSON.stringify({ roomTheme, placements: cafePlacements }),
      })
      setNotice('Your café layout has been saved! ♡')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not save your café layout.')
    } finally {
      setLayoutSaving(false)
    }
  }

  function toggleHabit(id: number) {`,
  'café editor actions'
);

// 6. Turn the room scene into a drag-and-drop area
s = replaceOnce(
  s,
  '<div className="big-cafe-scene">',
  `<div
                className="big-cafe-scene room-editor-scene"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  const instanceId = event.dataTransfer.getData('text/plain')
                  if (!instanceId) return
                  const bounds = event.currentTarget.getBoundingClientRect()
                  const slotX = Math.max(0, Math.min(7, Math.round(((event.clientX - bounds.left) / bounds.width) * 7)))
                  const slotY = Math.max(0, Math.min(3, Math.round(((event.clientY - bounds.top) / bounds.height) * 3)))
                  setCafePlacements((current) =>
                    current.map((placement) =>
                      placement.instanceId === instanceId
                        ? { ...placement, slotX, slotY }
                        : placement,
                    ),
                  )
                }}
              >`,
  'room scene'
);

s = replaceOnce(
  s,
  '                <div className="big-cafe-floor" />\n              </div>\n              <h3 className="section-subtitle">A few things for your café</h3>',
  `                <div className="big-cafe-floor" />
                <div className="room-placement-layer">
                  {cafePlacements.map((placement) => {
                    const item = cafeItems.find((entry) => entry.itemId === placement.itemId)
                    if (!item) return null
                    return (
                      <button
                        type="button"
                        className="room-placement"
                        key={placement.instanceId}
                        draggable
                        title={item.name + ' — drag to move'}
                        aria-label={item.name + ', placed in your café'}
                        style={{
                          left: (placement.slotX / 7) * 100 + '%',
                          top: (placement.slotY / 3) * 100 + '%',
                        }}
                        onDragStart={(event) => {
                          event.dataTransfer.setData('text/plain', placement.instanceId)
                          event.dataTransfer.effectAllowed = 'move'
                        }}
                      >
                        <span>{getCafeItemIcon(item)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="room-editor-controls">
                <div className="room-editor-heading">
                  <div>
                    <h3 className="section-subtitle">Arrange your café</h3>
                    <p className="small-note">Place items from your inventory, then drag them around or use the arrows.</p>
                  </div>
                  <button
                    className="primary-button"
                    type="button"
                    disabled={layoutSaving}
                    onClick={() => void saveCafeLayout()}
                  >
                    {layoutSaving ? 'Saving...' : 'Save layout ♡'}
                  </button>
                </div>

                {cafePlacements.length === 0 ? (
                  <p className="small-note">Your room is ready. Choose Place beside an item in My Items to decorate it.</p>
                ) : (
                  <div className="room-placement-list">
                    {cafePlacements.map((placement) => {
                      const item = cafeItems.find((entry) => entry.itemId === placement.itemId)
                      if (!item) return null
                      return (
                        <div className="room-placement-row" key={placement.instanceId}>
                          <span className="room-placement-name">{getCafeItemIcon(item)} {item.name}</span>
                          <div className="room-placement-actions">
                            <button type="button" aria-label={'Move ' + item.name + ' left'} onClick={() => moveCafePlacement(placement.instanceId, -1, 0)}>←</button>
                            <button type="button" aria-label={'Move ' + item.name + ' up'} onClick={() => moveCafePlacement(placement.instanceId, 0, -1)}>↑</button>
                            <button type="button" aria-label={'Move ' + item.name + ' down'} onClick={() => moveCafePlacement(placement.instanceId, 0, 1)}>↓</button>
                            <button type="button" aria-label={'Move ' + item.name + ' right'} onClick={() => moveCafePlacement(placement.instanceId, 1, 0)}>→</button>
                            <button type="button" className="room-remove-button" onClick={() => removeCafePlacement(placement.instanceId)}>Remove</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                <p className="small-note">Changes are saved to your account only when you press Save layout.</p>
              </div>

              <h3 className="section-subtitle">A few things for your café</h3>`,
  'room editor controls'
);

// 7. Add Place buttons to owned inventory items
s = replaceOnce(
  s,
  '<span className="cafe-inventory-quantity">×{ownedItem.quantity}</span>',
  `<span className="cafe-inventory-quantity">×{ownedItem.quantity}</span>
                          <button
                            type="button"
                            className="soft-button inventory-place-button"
                            disabled={cafePlacements.filter((entry) => entry.itemId === ownedItem.itemId).length >= ownedItem.quantity}
                            onClick={() => addCafePlacement(ownedItem.itemId)}
                          >
                            {cafePlacements.filter((entry) => entry.itemId === ownedItem.itemId).length >= ownedItem.quantity ? 'All placed' : 'Place'}
                          </button>`,
  'inventory Place button'
);

// Replace the old hint
s = s.replace(
  '<p className="cafe-inventory-hint">Next up: place your owned items in the room editor.</p>',
  '<p className="cafe-inventory-hint">Your items stay yours when you remove them from the room.</p>'
);

// 8. Editor styles
css += `

/* Café room editor */
.room-editor-scene {
  isolation: isolate;
}

.room-placement-layer {
  position: absolute;
  inset: 12px 12px 28px;
  z-index: 5;
  pointer-events: none;
}

.room-placement {
  position: absolute;
  transform: translate(-50%, -50%);
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  padding: 0;
  border: 2px solid #b78662;
  border-radius: 8px;
  background: #fff5e8;
  box-shadow: 0 3px 0 #b78662;
  font-size: 25px;
  cursor: grab;
  pointer-events: auto;
  touch-action: none;
}

.room-placement:active {
  cursor: grabbing;
}

.room-editor-controls {
  margin: 20px 0 28px;
  padding: 16px;
  border: 1px solid #e8d5c1;
  border-radius: 14px;
  background: #fffaf3;
}

.room-editor-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.room-placement-list {
  display: grid;
  gap: 8px;
}

.room-placement-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 10px;
  border: 1px solid #efdfcf;
  border-radius: 10px;
  background: #fff;
}

.room-placement-name {
  min-width: 0;
  overflow-wrap: anywhere;
  font-weight: 600;
}

.room-placement-actions {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.room-placement-actions button {
  min-width: 30px;
  min-height: 30px;
  border: 1px solid #ddc4ac;
  border-radius: 7px;
  background: #fff7ec;
  color: #674a35;
  cursor: pointer;
}

.room-placement-actions .room-remove-button {
  padding: 0 9px;
}

.inventory-place-button {
  grid-column: 1 / -1;
  justify-self: start;
}

@media (max-width: 600px) {
  .room-placement-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .room-editor-heading {
    align-items: flex-start;
  }
}
`;

fs.writeFileSync(file, s, 'utf8');
fs.writeFileSync(cssFile, css, 'utf8');
console.log('Room editor patch applied. Backups created with .before-room-editor suffix.');
