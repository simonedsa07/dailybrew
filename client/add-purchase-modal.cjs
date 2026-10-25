const fs = require('fs');

const appPath = 'src/App.tsx';
const cssPath = 'src/App.css';
let app = fs.readFileSync(appPath, 'utf8');
let css = fs.readFileSync(cssPath, 'utf8');

const changes = [
  [
    "  const [cafeLoading, setCafeLoading] = useState(false)",
    "  const [cafeLoading, setCafeLoading] = useState(false)\n  const [purchaseConfirmation, setPurchaseConfirmation] = useState<{ name: string; price: number; balance: number } | null>(null)"
  ],
  [
`  async function handleCafePurchase(itemId: string) {
    setPurchasingItemId(itemId)
    try {
      const result = await apiRequest<{ newBeanBalance: number }>('/cafe/purchases', {
        method: 'POST',
        body: JSON.stringify({ itemId }),
      })
      if (typeof result.data?.newBeanBalance === "number") {
        setBeanBalance(result.data.newBeanBalance)
      }
      setNotice(result.message ?? 'Your café item was purchased!')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Purchase failed. Please try again.')
    } finally {
      setPurchasingItemId(null)
    }
  }`,
`  async function handleCafePurchase(itemId: string) {
    const item = cafeItems.find((entry) => entry.itemId === itemId)
    setPurchasingItemId(itemId)
    setNotice('')
    try {
      const result = await apiRequest<{ newBeanBalance: number }>('/cafe/purchases', {
        method: 'POST',
        body: JSON.stringify({ itemId }),
      })
      const newBalance = typeof result.data?.newBeanBalance === 'number'
        ? result.data.newBeanBalance
        : beanBalance - (item?.price ?? 0)

      setBeanBalance(newBalance)
      setPurchaseConfirmation({
        name: item?.name ?? 'Café item',
        price: item?.price ?? 0,
        balance: newBalance,
      })
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Purchase failed. Please try again.')
    } finally {
      setPurchasingItemId(null)
    }
  }`
  ],
  [
`          <footer className="page-footer"><span>Made with a little love and a lot of ☕</span><span>Remember: progress isn't always linear. ♡</span></footer>`,
`          {purchaseConfirmation && (
            <div className="purchase-modal-overlay" onClick={() => setPurchaseConfirmation(null)}>
              <section
                className="purchase-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="purchase-modal-title"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  className="purchase-modal-close"
                  type="button"
                  aria-label="Close confirmation"
                  onClick={() => setPurchaseConfirmation(null)}
                >
                  ×
                </button>
                <div className="purchase-modal-icon">☕</div>
                <p className="eyebrow">A LITTLE TREAT FOR YOUR CAFÉ</p>
                <h2 id="purchase-modal-title">Yay! It's yours!</h2>
                <p className="purchase-modal-item">{purchaseConfirmation.name}</p>
                <p className="purchase-modal-message">Your café is getting cozier, one little detail at a time.</p>
                <div className="purchase-modal-summary">
                  <div><span>Beans spent</span><strong>🫘 −{purchaseConfirmation.price}</strong></div>
                  <div><span>Beans remaining</span><strong>🫘 {purchaseConfirmation.balance}</strong></div>
                </div>
                <button
                  className="primary-button purchase-modal-button"
                  type="button"
                  onClick={() => setPurchaseConfirmation(null)}
                >
                  Got it! ♡
                </button>
              </section>
            </div>
          )}

          <footer className="page-footer"><span>Made with a little love and a lot of ☕</span><span>Remember: progress isn't always linear. ♡</span></footer>`
  ]
];

for (const [before, after] of changes) {
  if (!app.includes(before)) {
    throw new Error('Could not find an expected App.tsx section. No files were changed.');
  }
}

const cssMarker = '/* Daily Brew purchase confirmation modal */';
const modalCss = `
${cssMarker}
.purchase-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(42, 31, 26, 0.58);
  backdrop-filter: blur(4px);
  animation: purchase-fade-in 180ms ease-out;
}

.purchase-modal {
  position: relative;
  width: min(100%, 420px);
  padding: 34px 28px 28px;
  border: 1px solid #ead8c5;
  border-radius: 24px;
  background: #fffaf3;
  color: #503a30;
  text-align: center;
  box-shadow: 0 24px 70px rgba(35, 23, 17, 0.25);
  animation: purchase-pop-in 220ms ease-out;
}

.purchase-modal-close {
  position: absolute;
  top: 12px;
  right: 15px;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  background: #f3e8dc;
  color: #654b3d;
  font-size: 25px;
  cursor: pointer;
}

.purchase-modal-icon {
  display: grid;
  place-items: center;
  width: 68px;
  height: 68px;
  margin: 0 auto 18px;
  border-radius: 22px;
  background: #f3e4d0;
  font-size: 34px;
}

.purchase-modal h2 {
  margin: 8px 0 12px;
  color: #503a30;
}

.purchase-modal-item {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.purchase-modal-message {
  margin: 10px 0 22px;
  color: #806c5e;
  font-size: 14px;
  line-height: 1.6;
}

.purchase-modal-summary {
  display: grid;
  gap: 10px;
  padding: 15px;
  border: 1px solid #eddfd0;
  border-radius: 15px;
  background: #fdf3e7;
  text-align: left;
}

.purchase-modal-summary > div {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.purchase-modal-summary span {
  color: #806c5e;
  font-size: 13px;
}

.purchase-modal-summary strong {
  font-size: 14px;
}

.purchase-modal-button {
  width: 100%;
  margin-top: 20px;
}

@keyframes purchase-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes purchase-pop-in {
  from { opacity: 0; transform: translateY(10px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .purchase-modal-overlay,
  .purchase-modal {
    animation: none;
  }
}
`;

if (!css.includes(cssMarker)) {
  fs.copyFileSync(appPath, appPath + '.before-purchase-modal');
  fs.copyFileSync(cssPath, cssPath + '.before-purchase-modal');

  for (const [before, after] of changes) {
    app = app.replace(before, after);
  }

  css += '\n' + modalCss;
  fs.writeFileSync(appPath, app);
  fs.writeFileSync(cssPath, css);
  console.log('Purchase confirmation modal added. Backups created.');
} else {
  console.log('Modal CSS marker already exists; no files changed.');
}
