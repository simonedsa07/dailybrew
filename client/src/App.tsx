import { useEffect, useState, useCallback, useMemo } from 'react'
import AuthScreen from './AuthScreen'
import { apiRequest } from './lib/api'
import './App.css'

type Habit = {
  _id: string
  name: string
  description?: string
  icon: string
  category: string
  frequency: 'daily' | 'weekdays' | 'weekends' | 'custom'
  scheduledDays?: number[]
  isActive: boolean
  isScheduledToday?: boolean
  isCompletedToday?: boolean
  completionId?: string
  currentStreak?: number
}

type Transaction = {
  _id: string
  type: 'income' | 'expense'
  description: string
  amount: number
  category: string
  transactionDate: string
  notes?: string
  paymentMethod?: string
}

type CafeCatalogItem = {
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

type CafePlacement = {
  instanceId: string
  itemId: string
  slotX: number
  slotY: number
}

type CafeInventoryItem = {
  itemId: string
  purchasedAt?: string
  quantity: number
}

type DailyJournalEntry = {
  _id?: string
  date: string
  mood?: string
  note?: string
  gratitude?: string
  waterIntake?: number
}

type AuthUser = {
  id: string
  name: string
  email: string
  beanBalance?: number
  preferences?: {
    currency?: string
    waterTarget?: number
    monthlyBudget?: number
    theme?: 'default' | 'dark' | 'sakura'
  }
  createdAt?: string
}

type DashboardData = {
  user: {
    name: string
    beanBalance: number
    preferences?: {
      currency?: string
      waterTarget?: number
      monthlyBudget?: number
      theme?: string
    }
  }
  habits: {
    all: Array<{
      _id: string
      name: string
      icon: string
      category: string
      frequency: string
      isActive: boolean
      isScheduledToday: boolean
      isCompletedToday: boolean
      completionId?: string
      currentStreak: number
    }>
    scheduledToday: number
    completedToday: number
  }
  finance: {
    month: string
    totalExpenses: number
    totalIncome: number
    net: number
    categoryTotals: Record<string, number>
    overallBudget: number | null
    remainingBudget: number | null
    recentTransactions: Transaction[]
  }
  journal: {
    mood?: string
    note?: string
    waterIntake?: number
    gratitude?: string
  } | null
  today: string
}

const moods = [
  { name: 'Lovely', icon: '🥰' },
  { name: 'Good', icon: '😊' },
  { name: 'Okay', icon: '😌' },
  { name: 'Tired', icon: '🥱' },
  { name: 'Low', icon: '🌧️' },
]

const expenseCategories = [
  { name: 'Food & drinks', icon: '☕' },
  { name: 'Transport', icon: '🚗' },
  { name: 'Shopping', icon: '🍰' },
  { name: 'Bills', icon: '🧾' },
  { name: 'Entertainment', icon: '🎬' },
  { name: 'Other', icon: '✦' },
]

const habitIcons = ['💧', '📚', '🌱', '🌷', '🧘', '🚶', '🍎', '✍️', '☕', '✨']

const navItems = [
  { name: 'Dashboard', icon: '⌂' },
  { name: 'My habits', icon: '☑' },
  { name: 'Expenses', icon: '◈' },
  { name: 'Daily journal', icon: '▤' },
  { name: 'My café', icon: '☕' },
  { name: 'My Profile', icon: '👤' },
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
}

function getCategoryIcon(categoryName: string) {
  const found = expenseCategories.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
  )
  return found ? found.icon : '🧾'
}

function getTodayString() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getCurrentMonthString() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function formatDisplayDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function App() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [activePage, setActivePage] = useState('Dashboard')

  // Global state
  const [beanBalance, setBeanBalance] = useState(0)
  const [notice, setNotice] = useState('')

  // Dashboard data
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)

  // Habits state
  const [habits, setHabits] = useState<Habit[]>([])
  const [habitsLoading, setHabitsLoading] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitCategory, setNewHabitCategory] = useState('General')
  const [newHabitIcon, setNewHabitIcon] = useState('🌸')

  // Expenses & Budgets state
  const [expenses, setExpenses] = useState<Transaction[]>([])
  const [expensesLoading, setExpensesLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString())
  const [newExpenseName, setNewExpenseName] = useState('')
  const [newExpenseAmount, setNewExpenseAmount] = useState('')
  const [newExpenseCategory, setNewExpenseCategory] = useState('Food & drinks')
  const [budget, setBudget] = useState('8000')
  const [savingBudget, setSavingBudget] = useState(false)

  // Journal state
  const [mood, setMood] = useState('')
  const [journal, setJournal] = useState('')
  const [water, setWater] = useState(4)
  const [waterTarget, setWaterTarget] = useState(8)
  const [journalLoading, setJournalLoading] = useState(false)
  const [pastEntries, setPastEntries] = useState<DailyJournalEntry[]>([])

  // Café state
  const [cafeItems, setCafeItems] = useState<CafeCatalogItem[]>([])
  const [cafeInventory, setCafeInventory] = useState<CafeInventoryItem[]>([])
  const [cafePlacements, setCafePlacements] = useState<CafePlacement[]>([])
  const [roomTheme, setRoomTheme] = useState('cozy-brown')
  const [cafeLoading, setCafeLoading] = useState(false)
  const [purchasingItemId, setPurchasingItemId] = useState<string | null>(null)
  const [layoutSaving, setLayoutSaving] = useState(false)
  const [purchaseConfirmation, setPurchaseConfirmation] = useState<{
    name: string
    price: number
    balance: number
  } | null>(null)

  // Profile / Settings state
  const [profileName, setProfileName] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)

  // 1. Session Restoration
  useEffect(() => {
    let active = true
    apiRequest<AuthUser>('/auth/me')
      .then((result) => {
        if (active && result.data) {
          setUser(result.data)
          setBeanBalance(result.data.beanBalance ?? 0)
          setProfileName(result.data.name || '')
          if (result.data.preferences?.monthlyBudget) {
            setBudget(String(result.data.preferences.monthlyBudget))
          }
          if (result.data.preferences?.waterTarget) {
            setWaterTarget(result.data.preferences.waterTarget)
          }
        }
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setAuthLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  // 2. Fetch Dashboard Summary
  const refreshDashboard = useCallback(async () => {
    if (!user) return
    setDashboardLoading(true)
    try {
      const res = await apiRequest<DashboardData>('/dashboard/summary')
      if (res.data) {
        setDashboard(res.data)
        if (typeof res.data.user.beanBalance === 'number') {
          setBeanBalance(res.data.user.beanBalance)
        }
        if (res.data.journal) {
          if (res.data.journal.mood) {
            const m = res.data.journal.mood
            setMood(m.charAt(0).toUpperCase() + m.slice(1))
          }
          if (res.data.journal.note !== undefined) {
            setJournal(res.data.journal.note)
          }
          if (typeof res.data.journal.waterIntake === 'number') {
            setWater(res.data.journal.waterIntake)
          }
        }
        if (res.data.finance.overallBudget !== null) {
          setBudget(String(res.data.finance.overallBudget))
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setDashboardLoading(false)
    }
  }, [user])

  // 3. Fetch Habits
  const refreshHabits = useCallback(async () => {
    if (!user) return
    setHabitsLoading(true)
    try {
      const [habitsRes, dashRes] = await Promise.all([
        apiRequest<Habit[]>('/habits'),
        apiRequest<DashboardData>('/dashboard/summary'),
      ])

      const dashHabitMap = new Map(
        (dashRes.data?.habits.all ?? []).map((h) => [h._id, h]),
      )

      const merged = (habitsRes.data ?? []).map((h) => {
        const dInfo = dashHabitMap.get(h._id)
        return {
          ...h,
          isScheduledToday: dInfo ? dInfo.isScheduledToday : true,
          isCompletedToday: dInfo ? dInfo.isCompletedToday : false,
          completionId: dInfo?.completionId,
          currentStreak: dInfo?.currentStreak ?? 0,
        }
      })
      setHabits(merged)
      if (typeof dashRes.data?.user.beanBalance === 'number') {
        setBeanBalance(dashRes.data.user.beanBalance)
      }
    } catch (err) {
      console.error('Failed to load habits:', err)
    } finally {
      setHabitsLoading(false)
    }
  }, [user])

  // 4. Fetch Expenses
  const refreshExpenses = useCallback(
    async (month: string) => {
      if (!user) return
      setExpensesLoading(true)
      try {
        const startDate = `${month}-01`
        const endDate = `${month}-31`
        const [transRes, budgetRes] = await Promise.all([
          apiRequest<Transaction[]>(
            `/transactions?startDate=${startDate}&endDate=${endDate}&limit=100`,
          ),
          apiRequest<Array<{ month: string; overallLimit: number }>>('/budgets'),
        ])
        setExpenses(transRes.data ?? [])

        const monthBudget = (budgetRes.data ?? []).find((b) => b.month === month)
        if (monthBudget) {
          setBudget(String(monthBudget.overallLimit))
        }
      } catch (err) {
        console.error('Failed to load expenses:', err)
      } finally {
        setExpensesLoading(false)
      }
    },
    [user],
  )

  // 5. Fetch Journal
  const refreshJournal = useCallback(async () => {
    if (!user) return
    setJournalLoading(true)
    try {
      const today = getTodayString()
      const [todayRes, listRes] = await Promise.all([
        apiRequest<DailyJournalEntry>(`/daily-entries/${today}`),
        apiRequest<DailyJournalEntry[]>('/daily-entries'),
      ])
      if (todayRes.data) {
        if (todayRes.data.mood) {
          const m = todayRes.data.mood
          setMood(m.charAt(0).toUpperCase() + m.slice(1))
        }
        setJournal(todayRes.data.note || '')
        if (typeof todayRes.data.waterIntake === 'number') {
          setWater(todayRes.data.waterIntake)
        }
      }
      setPastEntries(listRes.data ?? [])
    } catch (err) {
      console.error('Failed to load journal:', err)
    } finally {
      setJournalLoading(false)
    }
  }, [user])

  // 6. Fetch Café Data
  const refreshCafe = useCallback(async () => {
    if (!user) return
    setCafeLoading(true)
    try {
      const [itemsRes, cafeRes] = await Promise.all([
        apiRequest<CafeCatalogItem[]>('/cafe/items'),
        apiRequest<{
          beanBalance?: number
          layout?: {
            inventory?: CafeInventoryItem[]
            placements?: CafePlacement[]
            roomTheme?: string
          }
        }>('/cafe'),
      ])
      setCafeItems(itemsRes.data ?? [])
      setCafeInventory(cafeRes.data?.layout?.inventory ?? [])
      setCafePlacements(cafeRes.data?.layout?.placements ?? [])
      setRoomTheme(cafeRes.data?.layout?.roomTheme ?? 'cozy-brown')
      if (typeof cafeRes.data?.beanBalance === 'number') {
        setBeanBalance(cafeRes.data.beanBalance)
      }
    } catch (err) {
      console.error('Failed to load café:', err)
    } finally {
      setCafeLoading(false)
    }
  }, [user])

  // Trigger data fetches on page changes
  useEffect(() => {
    if (!user) return
    if (activePage === 'Dashboard') {
      void refreshDashboard()
    } else if (activePage === 'My habits') {
      void refreshHabits()
    } else if (activePage === 'Expenses') {
      void refreshExpenses(selectedMonth)
    } else if (activePage === 'Daily journal') {
      void refreshJournal()
    } else if (activePage === 'My café') {
      void refreshCafe()
    }
  }, [user, activePage, refreshDashboard, refreshHabits, refreshExpenses, refreshJournal, refreshCafe, selectedMonth])

  // Initial load of common data
  useEffect(() => {
    if (user) {
      void refreshDashboard()
      void refreshHabits()
      void refreshCafe()
    }
  }, [user, refreshDashboard, refreshHabits, refreshCafe])

  async function handleLogout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setUser(null)
      setActivePage('Dashboard')
    }
  }

  // ---- Habit Handlers ----
  async function handleToggleHabit(habit: Habit) {
    const today = getTodayString()
    try {
      if (habit.isCompletedToday && habit.completionId) {
        await apiRequest(`/habits/${habit._id}/completions/${habit.completionId}`, {
          method: 'DELETE',
        })
        setNotice(`Marked "${habit.name}" as undone.`)
      } else {
        const res = await apiRequest<{
          beansEarned: number
          data: { _id: string; completionDate: string }
          alreadyCompleted: boolean
        }>(`/habits/${habit._id}/completions`, {
          method: 'POST',
          body: JSON.stringify({ date: today }),
        })
        const earned = res.data?.beansEarned ?? 0
        if (earned > 0) {
          setBeanBalance((prev) => prev + earned)
          setNotice(`Completed "${habit.name}"! +${earned} beans earned! 🫘`)
        } else {
          setNotice(`Completed "${habit.name}"! ♡`)
        }
      }
      await refreshHabits()
      await refreshDashboard()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not update habit.')
    }
  }

  async function handleAddHabit() {
    if (!newHabitName.trim()) return
    try {
      await apiRequest<Habit>('/habits', {
        method: 'POST',
        body: JSON.stringify({
          name: newHabitName.trim(),
          category: newHabitCategory,
          icon: newHabitIcon,
          frequency: 'daily',
        }),
      })
      setNewHabitName('')
      setNotice('Your new habit is ready 🌱')
      await refreshHabits()
      await refreshDashboard()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not add habit.')
    }
  }

  async function handleDeleteHabit(id: string) {
    try {
      await apiRequest(`/habits/${id}`, { method: 'DELETE' })
      setNotice('Habit removed.')
      await refreshHabits()
      await refreshDashboard()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not delete habit.')
    }
  }

  // ---- Expense Handlers ----
  async function handleAddExpense() {
    const amount = Number(newExpenseAmount)
    if (!newExpenseName.trim() || !Number.isFinite(amount) || amount <= 0) {
      setNotice('Enter an expense name and a valid positive amount.')
      return
    }
    const today = getTodayString()
    try {
      await apiRequest<Transaction>('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type: 'expense',
          description: newExpenseName.trim(),
          amount,
          category: newExpenseCategory,
          transactionDate: today,
        }),
      })
      setNewExpenseName('')
      setNewExpenseAmount('')
      setNotice('Expense added to your list ☕')
      await refreshExpenses(selectedMonth)
      await refreshDashboard()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not add expense.')
    }
  }

  async function handleDeleteExpense(id: string) {
    try {
      await apiRequest(`/transactions/${id}`, { method: 'DELETE' })
      setNotice('Expense removed.')
      await refreshExpenses(selectedMonth)
      await refreshDashboard()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not delete expense.')
    }
  }

  async function handleSaveBudget() {
    const budgetNum = Number(budget)
    if (isNaN(budgetNum) || budgetNum < 0) {
      setNotice('Please enter a valid non-negative budget amount.')
      return
    }
    setSavingBudget(true)
    try {
      await apiRequest(`/budgets/${selectedMonth}`, {
        method: 'PUT',
        body: JSON.stringify({ overallLimit: budgetNum, categoryLimits: [] }),
      })
      await apiRequest('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ preferences: { monthlyBudget: budgetNum } }),
      })
      setNotice(`Monthly budget set to ₹${budgetNum.toLocaleString('en-IN')}! 🐷`)
      await refreshDashboard()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not save budget.')
    } finally {
      setSavingBudget(false)
    }
  }

  // ---- Journal Handlers ----
  async function handleSaveJournal() {
    const today = getTodayString()
    try {
      const res = await apiRequest<{
        data: DailyJournalEntry
        beansEarned?: number
      }>(`/daily-entries/${today}`, {
        method: 'PUT',
        body: JSON.stringify({
          mood: mood ? mood.toLowerCase() : undefined,
          note: journal,
          waterIntake: water,
        }),
      })
      const earned = res.data?.beansEarned ?? 0
      if (earned > 0) {
        setBeanBalance((prev) => prev + earned)
        setNotice(
          `Check-in saved! +${earned} beans earned for today's gentle check-in! 🫘`,
        )
      } else {
        setNotice('Your gentle thoughts have been saved ♡')
      }
      await refreshJournal()
      await refreshDashboard()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not save journal entry.')
    }
  }

  // ---- Café Handlers ----
  const ownedCafeItems = useMemo(() => {
    return cafeInventory.reduce<Array<{ itemId: string; quantity: number }>>(
      (owned, entry) => {
        const existing = owned.find((item) => item.itemId === entry.itemId)
        if (existing) existing.quantity += entry.quantity
        else owned.push({ itemId: entry.itemId, quantity: entry.quantity })
        return owned
      },
      [],
    )
  }, [cafeInventory])

  async function handleCafePurchase(itemId: string) {
    const item = cafeItems.find((entry) => entry.itemId === itemId)
    setPurchasingItemId(itemId)
    setNotice('')
    try {
      const result = await apiRequest<{
        newBeanBalance: number
        layout?: { inventory?: CafeInventoryItem[] }
      }>('/cafe/purchases', {
        method: 'POST',
        body: JSON.stringify({ itemId }),
      })
      const newBalance =
        typeof result.data?.newBeanBalance === 'number'
          ? result.data.newBeanBalance
          : beanBalance - (item?.price ?? 0)

      setBeanBalance(newBalance)
      if (result.data?.layout?.inventory) {
        setCafeInventory(result.data.layout.inventory)
      } else {
        const refreshedCafe = await apiRequest<{
          layout?: { inventory?: CafeInventoryItem[] }
        }>('/cafe')
        setCafeInventory(refreshedCafe.data?.layout?.inventory ?? [])
      }
      setPurchaseConfirmation({
        name: item?.name ?? 'Café item',
        price: item?.price ?? 0,
        balance: newBalance,
      })
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'Purchase failed. Please try again.',
      )
    } finally {
      setPurchasingItemId(null)
    }
  }

  function addCafePlacement(itemId: string) {
    const owned = ownedCafeItems.find((entry) => entry.itemId === itemId)
    if (!owned) return

    const alreadyPlaced = cafePlacements.filter(
      (entry) => entry.itemId === itemId,
    ).length
    if (alreadyPlaced >= owned.quantity) {
      setNotice('All copies of this item are already in your room.')
      return
    }

    setCafePlacements((current) => [
      ...current,
      {
        instanceId:
          Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
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
      setNotice(
        error instanceof Error
          ? error.message
          : 'Could not save your café layout.',
      )
    } finally {
      setLayoutSaving(false)
    }
  }

  // ---- Settings Handler ----
  async function handleSaveSettings() {
    setSavingSettings(true)
    try {
      const budgetNum = Number(budget) || 0
      await Promise.all([
        apiRequest('/users/profile', {
          method: 'PATCH',
          body: JSON.stringify({
            name: profileName.trim() || user?.name,
            preferences: {
              monthlyBudget: budgetNum,
              waterTarget: waterTarget,
            },
          }),
        }),
        apiRequest(`/budgets/${selectedMonth}`, {
          method: 'PUT',
          body: JSON.stringify({ overallLimit: budgetNum, categoryLimits: [] }),
        }),
      ])
      if (user) {
        setUser({
          ...user,
          name: profileName.trim() || user.name,
          preferences: {
            ...user.preferences,
            monthlyBudget: budgetNum,
            waterTarget: waterTarget,
          },
        })
      }
      setNotice('Your preferences have been saved to your account! ☕')
      await refreshDashboard()
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : 'Could not save preferences.',
      )
    } finally {
      setSavingSettings(false)
    }
  }

  // Calculations
  const completedHabitsCount = habits.filter((h) => h.isCompletedToday).length
  const totalHabitsCount = habits.length
  const habitProgressPercent = totalHabitsCount
    ? Math.round((completedHabitsCount / totalHabitsCount) * 100)
    : 0

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const budgetAmount = Number(budget) || 0
  const remainingBudget = budgetAmount - totalSpent

  if (authLoading) {
    return (
      <main className="auth-shell">
        <p>Preparing your cozy space...</p>
      </main>
    )
  }

  if (!user) {
    return <AuthScreen onAuthenticated={setUser} />
  }

  function pageTitle() {
    if (activePage === 'Dashboard') return 'Your little corner of calm.'
    if (activePage === 'My habits') return 'Small steps still count.'
    if (activePage === 'Expenses') return 'Know where your money goes.'
    if (activePage === 'Daily journal') return 'A little space for you.'
    if (activePage === 'My café') return 'Your café, your cozy rules.'
    if (activePage === 'My Profile') return 'A little space that belongs to you.'
    return 'Make yourself at home.'
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => {
            setActivePage('Dashboard')
            setNotice('')
          }}
        >
          <span className="brand-cup">☕</span>
          <span>
            <strong>daily brew</strong>
            <small>your daily dose of cozy</small>
          </span>
        </button>

        <div className="side-label">YOUR LITTLE WORLD</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${activePage === item.name ? 'active' : ''}`}
              onClick={() => {
                setActivePage(item.name)
                setNotice('')
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.name}</span>
              {item.name === 'My café' && <span className="nav-sparkle">✦</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <div className="sidebar-cafe">
          <div className="mini-cafe-art" aria-hidden="true">
            <span>☁</span>
            <span>🪴</span>
            <span>☕</span>
          </div>
          <p className="pixel-label">A GENTLE REMINDER</p>
          <p className="reminder">You don't have to bloom every day.</p>
          <span className="tiny-sparkles">✳ ✦ ✳</span>
        </div>
        <button
          className="profile-button"
          onClick={() => {
            setActivePage('My Profile')
            setNotice('')
          }}
        >
          <span className="avatar">
            {(user.name || 'U').charAt(0).toUpperCase()}
          </span>
          <span className="profile-copy">
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </span>
          <span className="profile-dots">···</span>
        </button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            My space <span>/</span> <strong>{activePage}</strong>
          </div>
          <div className="topbar-right">
            <span className="date-chip">☀ {formatDisplayDate()}</span>
            <span className="bean-chip">
              🫘 <strong>{beanBalance}</strong> beans
            </span>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">A FRESH LITTLE START ✿</p>
              <h1>
                {activePage === 'Dashboard' ? (
                  <>
                    A little hello,
                    <br />
                    <span>you lovely human.</span>
                  </>
                ) : (
                  pageTitle()
                )}
              </h1>
              <p className="welcome-subtitle">
                {activePage === 'Dashboard'
                  ? 'Take a breath, grab a pretend latte, and see how your day is going.'
                  : 'There is no rush. Let’s take it one little step at a time.'}
              </p>
            </div>
            <div
              className="hero-art"
              aria-label="Cozy pixel-inspired coffee illustration"
            >
              <div className="art-sun" />
              <span className="art-star star-one">✦</span>
              <span className="art-star star-two">✳</span>
              <span className="art-leaf">🌿</span>
              <div className="art-window">
                <div className="window-cross" />
              </div>
              <div className="art-shelf" />
              <div className="art-pot">🪴</div>
              <div className="art-cup">
                <span>♡</span>
                <i />
              </div>
              <div className="art-book">▤</div>
            </div>
          </section>

          {notice && (
            <div className="notice" role="status">
              <span>✿</span> {notice}
              <button onClick={() => setNotice('')} aria-label="Dismiss message">
                ×
              </button>
            </div>
          )}

          {/* ================= DASHBOARD ================= */}
          {activePage === 'Dashboard' && (
            <>
              <section className="stats-grid">
                <article className="stat-card stat-habits">
                  <div className="stat-top">
                    <span className="stat-icon">🌱</span>
                    <span className="stat-tag">TODAY</span>
                  </div>
                  <p className="stat-label">Little habits done</p>
                  <div className="stat-number">
                    {dashboard?.habits.completedToday ?? completedHabitsCount}
                    <span> / {dashboard?.habits.scheduledToday ?? totalHabitsCount}</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill sage-fill"
                      style={{ width: `${habitProgressPercent}%` }}
                    />
                  </div>
                  <p className="stat-foot">
                    {habitProgressPercent === 100
                      ? 'Look at you go! ✨'
                      : 'Every little step counts.'}
                  </p>
                </article>

                <article className="stat-card stat-spending">
                  <div className="stat-top">
                    <span className="stat-icon">🪙</span>
                    <span className="stat-tag">THIS MONTH</span>
                  </div>
                  <p className="stat-label">Little things spent</p>
                  <div className="stat-number">
                    ₹
                    {(
                      dashboard?.finance.totalExpenses ?? totalSpent
                    ).toLocaleString('en-IN')}
                  </div>
                  <p className="stat-foot">
                    Across{' '}
                    {dashboard?.finance.recentTransactions?.length ??
                      expenses.length}{' '}
                    recent spends
                  </p>
                </article>

                <article className="stat-card stat-budget">
                  <div className="stat-top">
                    <span className="stat-icon">🐷</span>
                    <span className="stat-tag">YOUR BUDGET</span>
                  </div>
                  <p className="stat-label">Still in your pocket</p>
                  <div className="stat-number">
                    ₹
                    {(
                      dashboard?.finance.remainingBudget ?? remainingBudget
                    ).toLocaleString('en-IN')}
                  </div>
                  <p className="stat-foot">
                    {(dashboard?.finance.remainingBudget ?? remainingBudget) >= 0
                      ? 'You are doing just fine.'
                      : 'You are over your budget.'}
                  </p>
                </article>

                <article className="stat-card stat-beans">
                  <div className="stat-top">
                    <span className="stat-icon">☕</span>
                    <span className="stat-tag">CAFÉ WALLET</span>
                  </div>
                  <p className="stat-label">Coffee beans</p>
                  <div className="stat-number">
                    {beanBalance} <span>beans</span>
                  </div>
                  <p className="stat-foot">Your next cozy upgrade awaits.</p>
                </article>
              </section>

              <section className="dashboard-grid">
                {/* Habits Widget */}
                <article className="panel habits-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">YOUR DAILY RITUALS</p>
                      <h2>
                        Today's little habits <span>✿</span>
                      </h2>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => setActivePage('My habits')}
                    >
                      See all ↗
                    </button>
                  </div>
                  <div className="habit-progress-caption">
                    <span>A little progress</span>
                    <strong>
                      {completedHabitsCount} of {totalHabitsCount}
                    </strong>
                  </div>
                  <div className="progress-track wide">
                    <div
                      className="progress-fill sage-fill"
                      style={{ width: `${habitProgressPercent}%` }}
                    />
                  </div>

                  {dashboardLoading && (
                    <p className="small-note">Gathering your daily rituals...</p>
                  )}

                  {!dashboardLoading && habits.length === 0 && (
                    <div className="empty-state">
                      <span>🌱</span>
                      <p>No habits added yet. Plant your first little ritual!</p>
                    </div>
                  )}

                  <div className="habit-list">
                    {habits.slice(0, 5).map((habit) => (
                      <button
                        key={habit._id}
                        className={`habit-row ${habit.isCompletedToday ? 'habit-done' : ''}`}
                        onClick={() => void handleToggleHabit(habit)}
                      >
                        <span className="habit-icon green">{habit.icon}</span>
                        <span className="habit-copy">
                          <strong>{habit.name}</strong>
                          <small>
                            {habit.frequency} · {habit.category}
                          </small>
                        </span>
                        {habit.currentStreak ? (
                          <span className="streak-badge">
                            🔥 {habit.currentStreak}
                          </span>
                        ) : null}
                        <span
                          className={`habit-check ${habit.isCompletedToday ? 'checked' : ''}`}
                        >
                          {habit.isCompletedToday ? '✓' : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    className="soft-button full-button"
                    onClick={() => setActivePage('My habits')}
                  >
                    + Manage my habits
                  </button>
                </article>

                {/* Mood Check-In Widget */}
                <article className="panel mood-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">A MOMENT FOR YOU</p>
                      <h2>How's your heart?</h2>
                    </div>
                    <span className="heading-doodle">♡</span>
                  </div>
                  <p className="panel-description">
                    There are no wrong answers. Just check in with yourself.
                  </p>
                  <div className="mood-options">
                    {moods.map((item) => (
                      <button
                        key={item.name}
                        className={`mood-option ${mood === item.name ? 'selected' : ''}`}
                        onClick={() => setMood(item.name)}
                        aria-pressed={mood === item.name}
                      >
                        <span>{item.icon}</span>
                        <small>{item.name}</small>
                      </button>
                    ))}
                  </div>
                  <label className="field-label" htmlFor="journal-note">
                    A tiny thought for today
                  </label>
                  <textarea
                    id="journal-note"
                    className="journal-input"
                    value={journal}
                    onChange={(event) => setJournal(event.target.value)}
                    placeholder="What's on your mind, sunshine?"
                    rows={3}
                  />
                  <button
                    className="primary-button full-button"
                    onClick={() => void handleSaveJournal()}
                  >
                    Save my check-in ♡ (+3 beans)
                  </button>
                </article>

                {/* Expenses Widget */}
                <article className="panel expenses-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">MONEY, GENTLY</p>
                      <h2>Recent little spends</h2>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => setActivePage('Expenses')}
                    >
                      View all ↗
                    </button>
                  </div>

                  {expenses.length === 0 ? (
                    <div className="empty-state">
                      <span>☕</span>
                      <p>No expenses recorded this month yet.</p>
                    </div>
                  ) : (
                    <div className="expense-list">
                      {expenses.slice(0, 4).map((expense) => (
                        <div className="expense-row" key={expense._id}>
                          <span className="expense-icon">
                            {getCategoryIcon(expense.category)}
                          </span>
                          <span className="expense-copy">
                            <strong>{expense.description}</strong>
                            <small>{expense.category}</small>
                          </span>
                          <strong className="expense-amount">
                            −₹{expense.amount.toLocaleString('en-IN')}
                          </strong>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="spending-summary">
                    <span>Spent so far</span>
                    <strong>₹{totalSpent.toLocaleString('en-IN')}</strong>
                  </div>
                </article>

                {/* Café Preview Widget */}
                <article className="panel cafe-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">YOUR HAPPY PLACE</p>
                      <h2>The little café</h2>
                    </div>
                    <span className="cafe-badge">OPEN ♡</span>
                  </div>
                  <div className={`cafe-scene theme-${roomTheme}`}>
                    <div className="cafe-cloud">☁</div>
                    <div className="cafe-window-art">
                      <span>✦</span>
                      <span>✿</span>
                    </div>
                    <div className="cafe-shelf-art">
                      <span>📚</span>
                      <span>🪴</span>
                      <span>✨</span>
                    </div>
                    <div className="cafe-counter">
                      <span className="counter-plant">🌿</span>
                      <span className="counter-machine">
                        ☕<small>☕</small>
                      </span>
                      <span className="counter-cup">☕</span>
                    </div>
                    <div className="cafe-floor" />
                  </div>
                  <div className="cafe-bottom">
                    <p>
                      <strong>Your cozy corner is waiting.</strong>
                      <small>
                        {ownedCafeItems.length} items owned · {cafePlacements.length} placed
                      </small>
                    </p>
                    <button
                      className="round-arrow"
                      onClick={() => setActivePage('My café')}
                      aria-label="Visit your café"
                    >
                      ↗
                    </button>
                  </div>
                </article>
              </section>
            </>
          )}

          {/* ================= MY HABITS ================= */}
          {activePage === 'My habits' && (
            <section className="panel standalone-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">ONE DAY AT A TIME</p>
                  <h2>My habit garden 🌷</h2>
                </div>
                <span className="stat-tag">
                  {completedHabitsCount}/{totalHabitsCount} DONE
                </span>
              </div>
              <p className="panel-description">
                Tap a habit to complete it and earn beans (+5 beans per habit, +10 bonus when all are done).
              </p>

              <div className="add-row">
                <input
                  value={newHabitName}
                  onChange={(event) => setNewHabitName(event.target.value)}
                  onKeyDown={(event) =>
                    event.key === 'Enter' && void handleAddHabit()
                  }
                  placeholder="Add a little habit (e.g., Morning stretch)..."
                  aria-label="New habit name"
                />
                <select
                  value={newHabitIcon}
                  onChange={(event) => setNewHabitIcon(event.target.value)}
                  aria-label="Habit icon"
                >
                  {habitIcons.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
                <select
                  value={newHabitCategory}
                  onChange={(event) => setNewHabitCategory(event.target.value)}
                  aria-label="Habit category"
                >
                  <option value="General">General</option>
                  <option value="Health">Health</option>
                  <option value="Mindfulness">Mindfulness</option>
                  <option value="Learning">Learning</option>
                  <option value="Self-care">Self-care</option>
                </select>
                <button
                  className="primary-button"
                  onClick={() => void handleAddHabit()}
                >
                  + Add habit
                </button>
              </div>

              {habitsLoading && <p className="small-note">Loading habits...</p>}

              {!habitsLoading && habits.length === 0 && (
                <div className="empty-state">
                  <span>🌷</span>
                  <p>Your habit garden is waiting for its first seeds.</p>
                </div>
              )}

              <div className="habit-list full-habit-list">
                {habits.map((habit) => (
                  <div className="habit-row-container" key={habit._id}>
                    <button
                      className={`habit-row ${habit.isCompletedToday ? 'habit-done' : ''}`}
                      onClick={() => void handleToggleHabit(habit)}
                    >
                      <span className="habit-icon green">{habit.icon}</span>
                      <span className="habit-copy">
                        <strong>{habit.name}</strong>
                        <small>
                          {habit.frequency} · {habit.category}
                        </small>
                      </span>
                      {habit.currentStreak ? (
                        <span className="streak-badge">
                          🔥 {habit.currentStreak} day streak
                        </span>
                      ) : null}
                      <span
                        className={`habit-check ${habit.isCompletedToday ? 'checked' : ''}`}
                      >
                        {habit.isCompletedToday ? '✓' : ''}
                      </span>
                    </button>
                    <button
                      className="delete-button"
                      type="button"
                      onClick={() => void handleDeleteHabit(habit._id)}
                      aria-label={`Delete ${habit.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ================= EXPENSES ================= */}
          {activePage === 'Expenses' && (
            <section className="panel standalone-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">MONEY, GENTLY</p>
                  <h2>My little expense book</h2>
                </div>
                <span className="stat-tag">INR · ₹</span>
              </div>

              <div className="expense-total-card">
                <span>Total spent in {selectedMonth}</span>
                <strong>₹{totalSpent.toLocaleString('en-IN')}</strong>
                <small>
                  {expenses.length} recorded transactions · Synced with MongoDB
                </small>
              </div>

              <div className="budget-editor">
                <label htmlFor="budget">Monthly budget (₹)</label>
                <input
                  id="budget"
                  type="number"
                  min="0"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                />
                <button
                  className="soft-button"
                  type="button"
                  disabled={savingBudget}
                  onClick={() => void handleSaveBudget()}
                >
                  {savingBudget ? 'Saving...' : 'Update budget'}
                </button>
                <span>
                  Remaining:{' '}
                  <strong
                    style={{
                      color: remainingBudget >= 0 ? '#436d4e' : '#b24a3b',
                    }}
                  >
                    ₹{remainingBudget.toLocaleString('en-IN')}
                  </strong>
                </span>
              </div>

              <div className="filter-row">
                <label htmlFor="month-filter"><strong>Viewing month:</strong></label>
                <input
                  id="month-filter"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>

              <h3 className="section-subtitle">Add a little spend</h3>
              <div className="add-row expense-add-row">
                <input
                  value={newExpenseName}
                  onChange={(event) => setNewExpenseName(event.target.value)}
                  placeholder="What did you spend on? (e.g. Iced coffee)"
                  aria-label="Expense description"
                />
                <input
                  value={newExpenseAmount}
                  onChange={(event) => setNewExpenseAmount(event.target.value)}
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Amount ₹"
                  aria-label="Expense amount"
                />
                <select
                  value={newExpenseCategory}
                  onChange={(event) => setNewExpenseCategory(event.target.value)}
                  aria-label="Expense category"
                >
                  {expenseCategories.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                <button
                  className="primary-button"
                  onClick={() => void handleAddExpense()}
                >
                  + Add
                </button>
              </div>

              {expensesLoading && <p className="small-note">Loading expenses...</p>}

              {!expensesLoading && expenses.length === 0 && (
                <div className="empty-state">
                  <span>☕</span>
                  <p>No spends logged for {selectedMonth}.</p>
                </div>
              )}

              <div className="expense-list full-expense-list">
                {expenses.map((expense) => (
                  <div className="expense-row" key={expense._id}>
                    <span className="expense-icon">
                      {getCategoryIcon(expense.category)}
                    </span>
                    <span className="expense-copy">
                      <strong>{expense.description}</strong>
                      <small>
                        {expense.category} · {expense.transactionDate}
                      </small>
                    </span>
                    <strong className="expense-amount">
                      ₹{expense.amount.toLocaleString('en-IN')}
                    </strong>
                    <button
                      className="delete-button"
                      onClick={() => void handleDeleteExpense(expense._id)}
                      aria-label={`Delete ${expense.description}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ================= DAILY JOURNAL ================= */}
          {activePage === 'Daily journal' && (
            <section className="panel standalone-panel journal-page">
              <p className="eyebrow">A SOFT PLACE TO LAND</p>
              <h2>Dear little diary... ✿</h2>
              <p className="panel-description">
                You don't have to make sense of everything. Just start wherever you are. (+3 beans awarded on your first daily check-in!)
              </p>

              {journalLoading && (
                <p className="small-note">Gathering your diary thoughts...</p>
              )}

              <label className="field-label" htmlFor="journal-page-mood">
                How are you feeling?
              </label>
              <div className="mood-options">
                {moods.map((item) => (
                  <button
                    key={item.name}
                    className={`mood-option ${mood === item.name ? 'selected' : ''}`}
                    onClick={() => setMood(item.name)}
                  >
                    <span>{item.icon}</span>
                    <small>{item.name}</small>
                  </button>
                ))}
              </div>

              <div className="settings-row" style={{ margin: '18px 0', padding: '12px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
                <span>
                  <strong>Hydration tracker</strong>
                  <small>Glasses of water drank today</small>
                </span>
                <div className="water-control">
                  <button onClick={() => setWater(Math.max(0, water - 1))}>−</button>
                  <strong>{water} glasses</strong>
                  <button onClick={() => setWater(Math.min(20, water + 1))}>+</button>
                </div>
              </div>

              <label className="field-label" htmlFor="journal-page-note">
                What's on your mind today?
              </label>
              <textarea
                id="journal-page-note"
                className="journal-input journal-big"
                value={journal}
                onChange={(event) => setJournal(event.target.value)}
                placeholder="Write about the little things, the big feelings, or absolutely nothing in particular..."
              />
              <button
                className="primary-button"
                onClick={() => void handleSaveJournal()}
              >
                Keep this little moment ♡
              </button>

              {pastEntries.length > 0 && (
                <div style={{ marginTop: '30px' }}>
                  <h3 className="section-subtitle">Past journal entries</h3>
                  <div className="journal-history-list">
                    {pastEntries.slice(0, 5).map((entry) => (
                      <article className="journal-history-card" key={entry._id || entry.date}>
                        <div className="journal-history-header">
                          <span>📅 {entry.date}</span>
                          <span>{entry.mood ? `Feeling ${entry.mood} ♡` : ''} · 💧 {entry.waterIntake ?? 0} glasses</span>
                        </div>
                        {entry.note ? <p style={{ fontSize: '12px', color: 'var(--ink)', margin: 0, whiteSpace: 'pre-wrap' }}>{entry.note}</p> : <small style={{ color: '#a28b75' }}>No note written</small>}
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ================= MY CAFÉ ================= */}
          {activePage === 'My café' && (
            <section className="panel standalone-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">BREWED WITH LOVE</p>
                  <h2>Your very own pixel café</h2>
                </div>
                <span className="bean-chip">🫘 {beanBalance} beans</span>
              </div>
              <p className="panel-description">
                A little room to make your own. Pick out something cozy from the shop below and place it in your café.
              </p>

              {/* Room Scene */}
              <div
                className={`big-cafe-scene room-editor-scene theme-${roomTheme}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  const instanceId = event.dataTransfer.getData('text/plain')
                  if (!instanceId) return
                  const bounds = event.currentTarget.getBoundingClientRect()
                  const slotX = Math.max(
                    0,
                    Math.min(
                      7,
                      Math.round(
                        ((event.clientX - bounds.left) / bounds.width) * 7,
                      ),
                    ),
                  )
                  const slotY = Math.max(
                    0,
                    Math.min(
                      3,
                      Math.round(
                        ((event.clientY - bounds.top) / bounds.height) * 3,
                      ),
                    ),
                  )
                  setCafePlacements((current) =>
                    current.map((placement) =>
                      placement.instanceId === instanceId
                        ? { ...placement, slotX, slotY }
                        : placement,
                    ),
                  )
                }}
              >
                <div className="big-cafe-window">
                  ☁<span>✦</span>
                  <i>✿</i>
                </div>
                <div className="big-cafe-shelf">📚 🪴 📚</div>
                <div className="big-cafe-counter">🌿 ☕ 🪴</div>
                <div className="big-cafe-floor" />
                <div className="room-placement-layer">
                  {cafePlacements.map((placement) => {
                    const item = cafeItems.find(
                      (entry) => entry.itemId === placement.itemId,
                    )
                    if (!item) return null
                    return (
                      <button
                        type="button"
                        className="room-placement"
                        key={placement.instanceId}
                        draggable
                        title={`${item.name} — drag to move`}
                        aria-label={`${item.name}, placed in your café`}
                        style={{
                          left: `${(placement.slotX / 7) * 100}%`,
                          top: `${(placement.slotY / 3) * 100}%`,
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

              {/* Theme Picker */}
              <div className="room-theme-picker">
                <label htmlFor="cafe-room-theme">Choose your café mood</label>
                <select
                  id="cafe-room-theme"
                  value={roomTheme}
                  onChange={(event) => setRoomTheme(event.target.value)}
                >
                  <option value="cozy-brown">☕ Cozy Brown</option>
                  <option value="sakura">🌸 Sakura Dreams</option>
                  <option value="midnight-cafe">🌙 Midnight Café</option>
                </select>
                <p className="small-note">
                  Choose a look, then save your layout to keep it.
                </p>
              </div>

              {/* Room Editor Controls */}
              <div className="room-editor-controls">
                <div className="room-editor-heading">
                  <div>
                    <h3 className="section-subtitle">Arrange your café</h3>
                    <p className="small-note">
                      Place items from your inventory, then drag them around or use the arrows.
                    </p>
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
                  <p className="small-note">
                    Your room is ready. Choose "Place" beside an item in My Items to decorate it.
                  </p>
                ) : (
                  <div className="room-placement-list">
                    {cafePlacements.map((placement) => {
                      const item = cafeItems.find(
                        (entry) => entry.itemId === placement.itemId,
                      )
                      if (!item) return null
                      return (
                        <div
                          className="room-placement-row"
                          key={placement.instanceId}
                        >
                          <span className="room-placement-name">
                            {getCafeItemIcon(item)} {item.name}
                          </span>
                          <div className="room-placement-actions">
                            <button
                              type="button"
                              aria-label={`Move ${item.name} left`}
                              onClick={() =>
                                moveCafePlacement(placement.instanceId, -1, 0)
                              }
                            >
                              ←
                            </button>
                            <button
                              type="button"
                              aria-label={`Move ${item.name} up`}
                              onClick={() =>
                                moveCafePlacement(placement.instanceId, 0, -1)
                              }
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              aria-label={`Move ${item.name} down`}
                              onClick={() =>
                                moveCafePlacement(placement.instanceId, 0, 1)
                              }
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              aria-label={`Move ${item.name} right`}
                              onClick={() =>
                                moveCafePlacement(placement.instanceId, 1, 0)
                              }
                            >
                              →
                            </button>
                            <button
                              type="button"
                              className="room-remove-button"
                              onClick={() =>
                                removeCafePlacement(placement.instanceId)
                              }
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Shop Grid */}
              <h3 className="section-subtitle">A few things for your café</h3>
              {cafeLoading && (
                <p className="small-note">Loading your café catalog...</p>
              )}
              {!cafeLoading && cafeItems.length === 0 && (
                <p className="small-note">
                  No café items are available right now. Check that the catalog has been seeded.
                </p>
              )}
              <div className="shop-grid">
                {cafeItems.map((item) => (
                  <article className="shop-item" key={item.itemId}>
                    <span>{getCafeItemIcon(item)}</span>
                    <strong>{item.name}</strong>
                    {item.description && <p>{item.description}</p>}
                    <small>🫘 {item.price} beans</small>
                    <button
                      className="soft-button"
                      disabled={
                        cafeLoading ||
                        purchasingItemId !== null ||
                        beanBalance < item.price ||
                        (!item.isRepeatable &&
                          ownedCafeItems.some((o) => o.itemId === item.itemId))
                      }
                      onClick={() => void handleCafePurchase(item.itemId)}
                    >
                      {purchasingItemId === item.itemId
                        ? 'Buying...'
                        : !item.isRepeatable &&
                            ownedCafeItems.some((o) => o.itemId === item.itemId)
                          ? 'Owned'
                          : beanBalance < item.price
                            ? 'Not enough beans'
                            : 'Buy item'}
                    </button>
                  </article>
                ))}
              </div>

              {/* Owned Inventory */}
              <div className="cafe-inventory-section">
                <div className="cafe-inventory-heading">
                  <div>
                    <h3 className="section-subtitle">My Items</h3>
                    <p className="small-note">
                      Everything you have bought for your little café.
                    </p>
                  </div>
                  <span className="cafe-inventory-count">
                    {ownedCafeItems.length} item types
                  </span>
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
                      const item = cafeItems.find(
                        (entry) => entry.itemId === ownedItem.itemId,
                      )
                      if (!item) return null
                      const placedCount = cafePlacements.filter(
                        (entry) => entry.itemId === ownedItem.itemId,
                      ).length
                      return (
                        <article
                          className="cafe-inventory-item"
                          key={ownedItem.itemId}
                        >
                          <span className="cafe-inventory-icon">
                            {getCafeItemIcon(item)}
                          </span>
                          <div className="cafe-inventory-details">
                            <strong>{item.name}</strong>
                            <small>{item.category || 'Café item'}</small>
                          </div>
                          <span className="cafe-inventory-quantity">
                            ×{ownedItem.quantity}
                          </span>
                          <button
                            type="button"
                            className="soft-button inventory-place-button"
                            disabled={placedCount >= ownedItem.quantity}
                            onClick={() => addCafePlacement(ownedItem.itemId)}
                          >
                            {placedCount >= ownedItem.quantity
                              ? 'All placed'
                              : 'Place'}
                          </button>
                        </article>
                      )
                    })}
                  </div>
                )}
                <p className="cafe-inventory-hint">
                  Your items stay yours in inventory when you remove them from the room.
                </p>
              </div>
            </section>
          )}

          {/* ================= PROFILE ================= */}
          {activePage === 'My Profile' && (
            <section className="panel standalone-panel">
              <p className="eyebrow">YOUR LITTLE CORNER</p>
              <h2>My profile ☕</h2>
              <p className="panel-description">
                A little space that belongs to you.
              </p>
              <div className="profile-detail-card">
                <span className="avatar profile-large-avatar">
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </span>
                <div>
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                </div>
              </div>
              <div className="settings-row">
                <span>
                  <strong>Account name</strong>
                  <small>The name linked to your Daily Brew account.</small>
                </span>
                <strong>{user.name}</strong>
              </div>
              <div className="settings-row">
                <span>
                  <strong>Email address</strong>
                  <small>Your account login email.</small>
                </span>
                <strong>{user.email}</strong>
              </div>
              <div className="settings-row">
                <span>
                  <strong>Café beans</strong>
                  <small>Your current bean balance.</small>
                </span>
                <strong>🫘 {beanBalance}</strong>
              </div>
              <div className="settings-row">
                <span>
                  <strong>Items collected</strong>
                  <small>Decorations in your inventory.</small>
                </span>
                <strong>{ownedCafeItems.length} items</strong>
              </div>
              <button
                className="soft-button"
                type="button"
                onClick={() => setActivePage('Settings')}
              >
                Open settings →
              </button>
            </section>
          )}

          {/* ================= SETTINGS ================= */}
          {activePage === 'Settings' && (
            <section className="panel standalone-panel">
              <p className="eyebrow">YOUR SPACE, YOUR PACE</p>
              <h2>A few little preferences ⚙</h2>
              <p className="panel-description">
                Personalize your Daily Brew experience.
              </p>

              <div className="settings-row">
                <span>
                  <strong>Account name</strong>
                  <small>What should we call you?</small>
                </span>
                <input
                  aria-label="Account name"
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                />
              </div>

              <div className="settings-row">
                <span>
                  <strong>Monthly budget (₹)</strong>
                  <small>Set the amount you want to keep an eye on.</small>
                </span>
                <input
                  aria-label="Monthly budget"
                  type="number"
                  min="0"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                />
              </div>

              <div className="settings-row">
                <span>
                  <strong>Daily water goal</strong>
                  <small>How many glasses would feel good today?</small>
                </span>
                <div className="water-control">
                  <button onClick={() => setWaterTarget(Math.max(1, waterTarget - 1))}>
                    −
                  </button>
                  <strong>{waterTarget} glasses</strong>
                  <button onClick={() => setWaterTarget(Math.min(20, waterTarget + 1))}>
                    +
                  </button>
                </div>
              </div>

              <div className="settings-row">
                <span>
                  <strong>Your current mood</strong>
                  <small>You can change this whenever you like.</small>
                </span>
                <strong>{mood || 'Not checked in yet'}</strong>
              </div>

              <button
                className="primary-button"
                type="button"
                disabled={savingSettings}
                onClick={() => void handleSaveSettings()}
                style={{ marginTop: '12px', width: '100%' }}
              >
                {savingSettings ? 'Saving...' : 'Save preferences ♡'}
              </button>

              <button
                className="auth-submit"
                type="button"
                onClick={() => void handleLogout()}
                style={{ marginTop: '20px', width: '100%' }}
              >
                Log out
              </button>
            </section>
          )}

          {/* Purchase Confirmation Modal */}
          {purchaseConfirmation && (
            <div
              className="purchase-modal-overlay"
              onClick={() => setPurchaseConfirmation(null)}
            >
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
                <p className="purchase-modal-item">
                  {purchaseConfirmation.name}
                </p>
                <p className="purchase-modal-message">
                  Your café is getting cozier, one little detail at a time.
                </p>
                <div className="purchase-modal-summary">
                  <div>
                    <span>Beans spent</span>
                    <strong>🫘 −{purchaseConfirmation.price}</strong>
                  </div>
                  <div>
                    <span>Beans remaining</span>
                    <strong>🫘 {purchaseConfirmation.balance}</strong>
                  </div>
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

          <footer className="page-footer">
            <span>Made with a little love and a lot of ☕</span>
            <span>Remember: progress isn't always linear. ♡</span>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
