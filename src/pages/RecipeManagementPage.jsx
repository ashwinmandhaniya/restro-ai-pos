import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Plus, Search, Filter, X, Edit3, Trash2, Eye,
  Clock, ChefHat, Flame, Leaf, DollarSign, BarChart3,
  ArrowLeft, AlertTriangle, CheckCircle2, Layers, Utensils,
  Beef, CookingPot, GlassWater, PieChart, TrendingUp,
  RefreshCw, Tag, Hash, ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import useUIStore from '@/store/uiStore'
import useRecipeStore from '@/store/recipeStore'

// ─── Constants ───
const CATEGORIES = ["Main Course", "Starter", "Appetizer", "Soup", "Salad", "Dessert", "Beverage", "Sauce/Base", "Side Dish", "Bread", "Snack", "Breakfast", "Brunch", "Thali", "Combo", "Condiment", "Other"]
const CUISINES = ["Indian", "North Indian", "South Indian", "Chinese", "Italian", "Mexican", "American", "Continental", "Thai", "Japanese", "Mediterranean", "Middle Eastern", "Lebanese", "French", "Spanish", "British", "Korean", "Vietnamese", "Fusion", "Global", "Street Food", "Fast Food", "Pan Asian", "Bakery", "Other"]
const DIFFICULTIES = ["Easy", "Medium", "Hard", "Expert"]
const UNITS = ["g", "kg", "ml", "ltr", "pcs", "tbsp", "tsp", "cup", "pinch"]
const ALLERGENS_LIST = ["Gluten", "Dairy", "Nuts", "Shellfish", "Eggs", "Soy", "Fish", "Sesame"]

const DIFF_COLOR = {
  Easy: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  Medium: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
  Hard: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400',
  Expert: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400',
}

const CAT_ICON = {
  "Main Course": Utensils, Starter: Flame, Dessert: CookingPot, Beverage: GlassWater,
  "Sauce/Base": CookingPot, "Side Dish": Layers, Bread: Utensils, Snack: Utensils, Other: Utensils,
}

// ─── Reusable input ───
const Input = ({ label, ...props }) => (
  <div>
    {label && <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</label>}
    <input
      {...props}
      className={cn(
        'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all',
        props.className
      )}
    />
  </div>
)

const Select = ({ label, options, ...props }) => (
  <div>
    {label && <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</label>}
    <div className="relative">
      <select
        {...props}
        className={cn(
          'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer pr-10',
          props.className
        )}
      >
        {options.map(o => (
          <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  </div>
)

export default function RecipeManagementPage() {
  const { addNotification } = useUIStore()
  const store = useRecipeStore()

  // ─── View state ───
  const [view, setView] = useState('list') // list | detail | form
  const [editingRecipe, setEditingRecipe] = useState(null)

  // ─── Filters ───
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')

  // ─── Form state ───
  const [form, setForm] = useState(getEmptyForm())
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  // ─── Load data ───
  useEffect(() => {
    store.fetchRecipes()
    store.fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 350)
    return () => clearTimeout(t)
  }, [search])

  // Re-fetch when filters change
  useEffect(() => {
    store.fetchRecipes({ search: searchDebounced, category: catFilter })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDebounced, catFilter])

  // ─── Helpers ───
  function getEmptyForm() {
    return {
      name: '', description: '', category: 'Main Course', cuisine: 'Indian', veg: true,
      ingredients: [{ name: '', qty: '', unit: 'g', costPerUnit: '' }],
      steps: [{ order: 1, instruction: '', durationMinutes: '' }],
      servingSize: 1, servingUnit: 'plate', prepTimeMinutes: '', cookTimeMinutes: '',
      difficulty: 'Medium', sellingPrice: '', allergens: [], notes: '',
    }
  }

  const computeFoodCost = (ingredients) =>
    ingredients.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.costPerUnit) || 0), 0)

  const totalTime = (r) => (r.prepTimeMinutes || 0) + (r.cookTimeMinutes || 0)

  // ─── Open form for create ───
  const openCreate = () => {
    setForm(getEmptyForm())
    setEditingRecipe(null)
    setView('form')
  }

  // ─── Open form for edit ───
  const openEdit = (recipe) => {
    setForm({
      name: recipe.name || '',
      description: recipe.description || '',
      category: recipe.category || 'Main Course',
      cuisine: recipe.cuisine || 'Indian',
      veg: recipe.veg !== undefined ? recipe.veg : true,
      ingredients: recipe.ingredients?.length ? recipe.ingredients.map(i => ({
        name: i.name, qty: i.qty, unit: i.unit || 'g', costPerUnit: i.costPerUnit || 0
      })) : [{ name: '', qty: '', unit: 'g', costPerUnit: '' }],
      steps: recipe.steps?.length ? recipe.steps.map(s => ({
        order: s.order, instruction: s.instruction, durationMinutes: s.durationMinutes || ''
      })) : [{ order: 1, instruction: '', durationMinutes: '' }],
      servingSize: recipe.servingSize || 1,
      servingUnit: recipe.servingUnit || 'plate',
      prepTimeMinutes: recipe.prepTimeMinutes || '',
      cookTimeMinutes: recipe.cookTimeMinutes || '',
      difficulty: recipe.difficulty || 'Medium',
      sellingPrice: recipe.sellingPrice || '',
      allergens: recipe.allergens || [],
      notes: recipe.notes || '',
    })
    setEditingRecipe(recipe)
    setView('form')
  }

  // ─── Save ───
  const handleSave = async () => {
    if (!form.name.trim()) {
      addNotification({ type: 'error', title: 'Missing Name', message: 'Recipe name is required.' })
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        ingredients: form.ingredients.filter(i => i.name.trim()),
        steps: form.steps.filter(s => s.instruction.trim()).map((s, i) => ({ ...s, order: i + 1 })),
        prepTimeMinutes: Number(form.prepTimeMinutes) || 0,
        cookTimeMinutes: Number(form.cookTimeMinutes) || 0,
        servingSize: Number(form.servingSize) || 1,
        sellingPrice: Number(form.sellingPrice) || 0,
      }

      if (editingRecipe) {
        await store.updateRecipe(editingRecipe._id, payload)
        addNotification({ type: 'success', title: 'Recipe Updated', message: `"${form.name}" saved.` })
      } else {
        await store.createRecipe(payload)
        addNotification({ type: 'success', title: 'Recipe Created', message: `"${form.name}" added.` })
      }
      store.fetchStats()
      setView('list')
    } catch {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to save recipe.' })
    }
    setSaving(false)
  }

  // ─── Delete ───
  const handleDelete = async (id) => {
    setDeleting(id)
    const ok = await store.deleteRecipe(id)
    setDeleting(null)
    if (ok) {
      addNotification({ type: 'success', title: 'Deleted', message: 'Recipe removed.' })
      store.fetchStats()
      if (view === 'detail') setView('list')
    } else {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to delete.' })
    }
  }

  // ─── View detail ───
  const openDetail = async (recipe) => {
    const full = await store.fetchRecipe(recipe._id)
    if (full) setView('detail')
  }

  // ─── Ingredient helpers ───
  const addIngredient = () => setForm(f => ({ ...f, ingredients: [...f.ingredients, { name: '', qty: '', unit: 'g', costPerUnit: '' }] }))
  const removeIngredient = (i) => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }))
  const updateIngredient = (i, field, val) => setForm(f => ({ ...f, ingredients: f.ingredients.map((ing, idx) => idx === i ? { ...ing, [field]: val } : ing) }))

  // ─── Step helpers ───
  const addStep = () => setForm(f => ({ ...f, steps: [...f.steps, { order: f.steps.length + 1, instruction: '', durationMinutes: '' }] }))
  const removeStep = (i) => setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx + 1 })) }))
  const updateStep = (i, field, val) => setForm(f => ({ ...f, steps: f.steps.map((s, idx) => idx === i ? { ...s, [field]: val } : s) }))

  // ─── Allergen toggle ───
  const toggleAllergen = (a) => setForm(f => ({
    ...f, allergens: f.allergens.includes(a) ? f.allergens.filter(x => x !== a) : [...f.allergens, a]
  }))

  const s = store.stats || {}
  const foodCostPreview = computeFoodCost(form.ingredients)

  // ═══════════════════════════════════════════
  //  DETAIL VIEW
  // ═══════════════════════════════════════════
  if (view === 'detail' && store.selectedRecipe) {
    const r = store.selectedRecipe
    const margin = r.sellingPrice ? ((r.sellingPrice - r.foodCost) / r.sellingPrice * 100).toFixed(1) : null
    return (
      <div className="space-y-6 pb-12">
        <button onClick={() => { setView('list'); store.clearSelection() }} className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700 font-semibold transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to recipes
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">{r.name}</h1>
                {r.veg ? <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 rounded-full">VEG</span>
                  : <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 dark:bg-red-500/20 text-red-600 rounded-full">NON-VEG</span>}
                <span className={cn('px-2 py-0.5 text-[10px] font-bold rounded-full', DIFF_COLOR[r.difficulty])}>{r.difficulty}</span>
              </div>
              {r.description && <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">{r.description}</p>}
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{r.category}</span>
                {r.cuisine && <span>{r.cuisine}</span>}
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{totalTime(r)} min</span>
                <span className="flex items-center gap-1"><Utensils className="w-3 h-3" />{r.servingSize} {r.servingUnit}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(r)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all border border-blue-200 dark:border-blue-500/30">
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => handleDelete(r._id)} disabled={deleting === r._id}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-all border border-red-200 dark:border-red-500/30 disabled:opacity-50">
                {deleting === r._id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Delete
              </button>
            </div>
          </div>

          {/* Cost cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 font-semibold mb-0.5">Food Cost</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">₹{(r.foodCost || 0).toFixed(2)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 font-semibold mb-0.5">Selling Price</p>
              <p className="text-lg font-bold text-emerald-600">₹{(r.sellingPrice || 0).toFixed(2)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 font-semibold mb-0.5">Profit</p>
              <p className="text-lg font-bold text-blue-600">₹{((r.sellingPrice || 0) - (r.foodCost || 0)).toFixed(2)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 font-semibold mb-0.5">Margin</p>
              <p className={cn('text-lg font-bold', margin && Number(margin) > 50 ? 'text-emerald-600' : margin && Number(margin) > 30 ? 'text-amber-600' : 'text-red-600')}>{margin ? `${margin}%` : '--'}</p>
            </div>
          </div>

          {/* Ingredients + Steps side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ingredients */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2"><Layers className="w-4 h-4 text-violet-500" /> Ingredients ({r.ingredients?.length || 0})</h3>
              <div className="space-y-2">
                {(r.ingredients || []).map((ing, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{ing.name}</span>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{ing.qty} {ing.unit}</span>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <span>₹{((ing.qty || 0) * (ing.costPerUnit || 0)).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                {(!r.ingredients || r.ingredients.length === 0) && <p className="text-xs text-slate-400">No ingredients listed.</p>}
              </div>
            </div>

            {/* Steps */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2"><CookingPot className="w-4 h-4 text-orange-500" /> Steps ({r.steps?.length || 0})</h3>
              <div className="space-y-2">
                {(r.steps || []).map((step, i) => (
                  <div key={i} className="flex gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">{step.order}</span>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{step.instruction}</p>
                      {step.durationMinutes > 0 && <p className="text-[10px] text-slate-400 mt-0.5">{step.durationMinutes} min</p>}
                    </div>
                  </div>
                ))}
                {(!r.steps || r.steps.length === 0) && <p className="text-xs text-slate-400">No steps listed.</p>}
              </div>
            </div>
          </div>

          {/* Allergens & Notes */}
          {((r.allergens && r.allergens.length > 0) || r.notes) && (
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              {r.allergens && r.allergens.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-1.5">Allergens</p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.allergens.map(a => (
                      <span key={a} className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-bold">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {r.notes && (
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-1">Chef Notes</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{r.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════
  //  FORM VIEW (Create / Edit)
  // ═══════════════════════════════════════════
  if (view === 'form') {
    return (
      <div className="space-y-6 pb-12">
        <button onClick={() => setView('list')} className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700 font-semibold transition-all">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            {editingRecipe ? 'Edit Recipe' : 'New Recipe'}
          </h1>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {editingRecipe ? 'Update' : 'Create'} Recipe
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Basic info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Recipe Name *" placeholder="e.g. Butter Chicken" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <Select label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} options={CATEGORIES} />
                <Select label="Cuisine" value={form.cuisine} onChange={e => setForm(f => ({ ...f, cuisine: e.target.value }))} options={CUISINES} />
                <Select label="Difficulty" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))} options={DIFFICULTIES} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Description</label>
                <textarea
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of the dish..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none"
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.veg} onChange={e => setForm(f => ({ ...f, veg: e.target.checked }))} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Vegetarian</span>
                </label>
              </div>
            </div>

            {/* Ingredients */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2"><Layers className="w-4 h-4 text-violet-500" /> Ingredients</h3>
                <button onClick={addIngredient} className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-all"><Plus className="w-3 h-3" /> Add</button>
              </div>
              <div className="space-y-2">
                {form.ingredients.map((ing, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <input placeholder="Ingredient name" value={ing.name} onChange={e => updateIngredient(i, 'name', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30" />
                    </div>
                    <div className="col-span-2">
                      <input type="number" placeholder="Qty" value={ing.qty} onChange={e => updateIngredient(i, 'qty', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30" />
                    </div>
                    <div className="col-span-2 relative">
                      <select value={ing.unit} onChange={e => updateIngredient(i, 'unit', e.target.value)}
                        className="w-full px-2 py-1.5 pr-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500/30 cursor-pointer">
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-1.5 pointer-events-none text-slate-400">
                        <ChevronDown className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="col-span-3">
                      <input type="number" placeholder="₹ Cost/unit" value={ing.costPerUnit} onChange={e => updateIngredient(i, 'costPerUnit', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30" />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button onClick={() => removeIngredient(i)} className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 text-slate-400 hover:text-red-500 transition-all"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 font-medium">Estimated Food Cost</span>
                <span className="text-sm font-bold text-slate-800 dark:text-white">₹{foodCostPreview.toFixed(2)}</span>
              </div>
            </div>

            {/* Steps */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2"><CookingPot className="w-4 h-4 text-orange-500" /> Preparation Steps</h3>
                <button onClick={addStep} className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-all"><Plus className="w-3 h-3" /> Add Step</button>
              </div>
              <div className="space-y-2">
                {form.steps.map((step, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="flex-shrink-0 w-6 h-6 mt-1 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                    <textarea value={step.instruction} onChange={e => updateStep(i, 'instruction', e.target.value)}
                      placeholder={`Step ${i + 1} instruction...`} rows={1}
                      className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30 resize-none" />
                    <input type="number" value={step.durationMinutes} onChange={e => updateStep(i, 'durationMinutes', e.target.value)}
                      placeholder="min" className="w-14 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-center text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30" />
                    <button onClick={() => removeStep(i)} className="p-1 mt-0.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 text-slate-400 hover:text-red-500 transition-all"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-4">
            {/* Timing & Serving */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Timing & Serving</h3>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Prep Time (min)" type="number" value={form.prepTimeMinutes} onChange={e => setForm(f => ({ ...f, prepTimeMinutes: e.target.value }))} />
                <Input label="Cook Time (min)" type="number" value={form.cookTimeMinutes} onChange={e => setForm(f => ({ ...f, cookTimeMinutes: e.target.value }))} />
                <Input label="Serving Size" type="number" value={form.servingSize} onChange={e => setForm(f => ({ ...f, servingSize: e.target.value }))} />
                <Input label="Serving Unit" placeholder="plate" value={form.servingUnit} onChange={e => setForm(f => ({ ...f, servingUnit: e.target.value }))} />
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Pricing</h3>
              <Input label="Selling Price (₹)" type="number" placeholder="0" value={form.sellingPrice} onChange={e => setForm(f => ({ ...f, sellingPrice: e.target.value }))} />
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Food Cost</span>
                <span className="font-bold text-slate-800 dark:text-white">₹{foodCostPreview.toFixed(2)}</span>
              </div>
              {Number(form.sellingPrice) > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Margin</span>
                  <span className={cn('font-bold', ((Number(form.sellingPrice) - foodCostPreview) / Number(form.sellingPrice) * 100) > 50 ? 'text-emerald-600' : 'text-amber-600')}>
                    {((Number(form.sellingPrice) - foodCostPreview) / Number(form.sellingPrice) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            {/* Allergens */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Allergens</h3>
              <div className="flex flex-wrap gap-1.5">
                {ALLERGENS_LIST.map(a => (
                  <button key={a} onClick={() => toggleAllergen(a)}
                    className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border',
                      form.allergens.includes(a)
                        ? 'bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-400'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                    )}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Chef Notes</h3>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Tips, variations, substitutions..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════
  //  LIST VIEW (default)
  // ═══════════════════════════════════════════
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Recipe Management</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Create, manage & cost your restaurant recipes</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-orange-500/20">
          <Plus className="w-4 h-4" /> New Recipe
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Total Recipes', value: s.total ?? '--', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/20' },
          { label: 'Active', value: s.active ?? '--', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/20' },
          { label: 'Avg Food Cost', value: s.avgFoodCost !== undefined ? `₹${s.avgFoodCost}` : '--', icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/20' },
          { label: 'Avg Margin', value: s.avgMargin !== undefined ? `₹${s.avgMargin}` : '--', icon: TrendingUp, color: 'text-violet-500', bg: 'bg-violet-100 dark:bg-violet-500/20' },
        ].map(k => (
          <div key={k.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{k.label}</p>
              <div className={cn('p-2 rounded-xl', k.bg)}><k.icon className={cn('w-4 h-4', k.color)} /></div>
            </div>
            <p className={cn('text-2xl font-bold', k.color)}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search recipes by name, cuisine..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setCatFilter('')} className={cn('px-3 py-2 rounded-xl text-xs font-semibold transition-all border', !catFilter ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50')}>
            All
          </button>
          {CATEGORIES.slice(0, 5).map(c => (
            <button key={c} onClick={() => setCatFilter(catFilter === c ? '' : c)}
              className={cn('px-3 py-2 rounded-xl text-xs font-semibold transition-all border',
                catFilter === c ? 'bg-orange-500 text-white border-transparent' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              )}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Recipe Grid */}
      {store.isLoading && store.recipes.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mr-2" />
          <span className="text-slate-400 font-medium">Loading recipes...</span>
        </div>
      ) : store.recipes.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-lg font-semibold text-slate-400 dark:text-slate-500">
            {search || catFilter ? 'No recipes match your filters.' : 'No recipes yet.'}
          </p>
          <p className="text-sm text-slate-400 mt-1">Click "New Recipe" to create your first recipe.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {store.recipes.map(recipe => {
              const CatIcon = CAT_ICON[recipe.category] || Utensils
              const margin = recipe.sellingPrice ? ((recipe.sellingPrice - recipe.foodCost) / recipe.sellingPrice * 100).toFixed(0) : null
              return (
                <motion.div
                  key={recipe._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden group"
                >
                  {/* Top bar */}
                  <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-500/20">
                        <CatIcon className="w-3.5 h-3.5 text-orange-500" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{recipe.category}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {recipe.veg
                        ? <span className="w-4 h-4 rounded-sm border-2 border-emerald-500 flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /></span>
                        : <span className="w-4 h-4 rounded-sm border-2 border-red-500 flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /></span>
                      }
                      <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold', DIFF_COLOR[recipe.difficulty])}>{recipe.difficulty}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 cursor-pointer" onClick={() => openDetail(recipe)}>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1 truncate group-hover:text-orange-500 transition-colors">{recipe.name}</h3>
                    {recipe.description && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{recipe.description}</p>}

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium mb-3">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {totalTime(recipe)} min</span>
                      <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {recipe.ingredients?.length || 0} items</span>
                      <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {recipe.steps?.length || 0} steps</span>
                    </div>

                    {/* Cost row */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
                      <div>
                        <p className="text-[10px] text-slate-400">Food Cost</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">₹{(recipe.foodCost || 0).toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">Sell Price</p>
                        <p className="text-sm font-bold text-emerald-600">₹{(recipe.sellingPrice || 0).toFixed(2)}</p>
                      </div>
                      {margin && (
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400">Margin</p>
                          <p className={cn('text-sm font-bold', Number(margin) > 50 ? 'text-emerald-600' : Number(margin) > 30 ? 'text-amber-600' : 'text-red-600')}>{margin}%</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                    <button onClick={() => openDetail(recipe)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-400 hover:text-blue-500 transition-all"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={() => openEdit(recipe)} className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-400 hover:text-amber-500 transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(recipe._id)} disabled={deleting === recipe._id}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all disabled:opacity-50">
                      {deleting === recipe._id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
