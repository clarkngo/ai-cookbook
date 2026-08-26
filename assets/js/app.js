// Index page: renders category filters, tag filters, search, and recipe cards.
(function () {
  let allRecipes = [];
  let allCategories = [];
  let categoryById = {};
  let activeCategory = 'all';
  let activeTags = new Set();
  let searchTerm = '';

  const grid = document.getElementById('recipe-grid');
  const emptyState = document.getElementById('empty-state');
  const categoryFilters = document.getElementById('category-filters');
  const tagFilters = document.getElementById('tag-filters');
  const searchInput = document.getElementById('search-input');
  const resultsCount = document.getElementById('results-count');

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function difficultyColor(difficulty) {
    switch (difficulty) {
      case 'Beginner': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'Intermediate': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      case 'Advanced': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  }

  function categoryColorClasses(color) {
    const map = {
      sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
      violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
      amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
      emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    };
    return map[color] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  }

  function allTags() {
    const set = new Set();
    allRecipes.forEach((r) => r.tags.forEach((t) => set.add(t)));
    return [...set].sort();
  }

  function renderCategoryFilters() {
    const chips = [{ id: 'all', name: 'All Recipes', icon: '📚' }, ...allCategories];
    categoryFilters.innerHTML = chips
      .map((c) => {
        const isActive = activeCategory === c.id;
        return `<button data-cat="${c.id}" class="tag-chip ${isActive ? 'active' : ''} px-3 py-1.5 rounded-full text-sm font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 transition-colors">
          <span class="mr-1">${c.icon}</span>${escapeHTML(c.name)}
        </button>`;
      })
      .join('');

    categoryFilters.querySelectorAll('[data-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        renderCategoryFilters();
        renderRecipes();
      });
    });
  }

  function renderTagFilters() {
    tagFilters.innerHTML = allTags()
      .map((tag) => {
        const isActive = activeTags.has(tag);
        return `<button data-tag="${escapeHTML(tag)}" class="tag-chip ${isActive ? 'active' : ''} px-2.5 py-1 rounded-full text-xs font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400 transition-colors">#${escapeHTML(tag)}</button>`;
      })
      .join('');

    tagFilters.querySelectorAll('[data-tag]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tag = btn.dataset.tag;
        if (activeTags.has(tag)) activeTags.delete(tag);
        else activeTags.add(tag);
        renderTagFilters();
        renderRecipes();
      });
    });
  }

  function matchesFilters(recipe) {
    if (activeCategory !== 'all' && recipe.category !== activeCategory) return false;
    if (activeTags.size > 0 && ![...activeTags].every((t) => recipe.tags.includes(t))) return false;
    if (searchTerm) {
      const haystack = `${recipe.title} ${recipe.problem} ${recipe.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  }

  function renderRecipes() {
    const filtered = allRecipes.filter(matchesFilters);
    resultsCount.textContent = `${filtered.length} recipe${filtered.length === 1 ? '' : 's'}`;

    if (filtered.length === 0) {
      grid.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }
    emptyState.classList.add('hidden');

    grid.innerHTML = filtered
      .map((r) => {
        const cat = categoryById[r.category];
        return `
        <a href="recipe.html?id=${encodeURIComponent(r.id)}" class="recipe-card fade-in group block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-300 dark:hover:border-indigo-700">
          <div class="flex items-center justify-between mb-3">
            <span class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColorClasses(cat?.color)}">
              <span>${cat?.icon || ''}</span>${escapeHTML(cat?.name || r.category)}
            </span>
            <span class="text-xs font-semibold px-2 py-1 rounded-full ${difficultyColor(r.difficulty)}">${escapeHTML(r.difficulty)}</span>
          </div>
          <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">${escapeHTML(r.title)}</h3>
          <p class="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">${escapeHTML(r.problem)}</p>
          <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
            <span>⏱ ${escapeHTML(r.estTime)}</span>
            <span>${r.targetLLMs.map(escapeHTML).join(' · ')}</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${r.tags.slice(0, 4).map((t) => `<span class="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">#${escapeHTML(t)}</span>`).join('')}
          </div>
        </a>`;
      })
      .join('');
  }

  async function init() {
    try {
      [allCategories, allRecipes] = await Promise.all([
        AICookbookData.getCategories(),
        AICookbookData.getAllRecipes(),
      ]);
      categoryById = Object.fromEntries(allCategories.map((c) => [c.id, c]));
      renderCategoryFilters();
      renderTagFilters();
      renderRecipes();
    } catch (err) {
      grid.innerHTML = `<div class="col-span-full text-center text-rose-500 py-12">Failed to load recipes: ${escapeHTML(err.message)}</div>`;
      console.error(err);
    }
  }

  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    renderRecipes();
  });

  init();
})();
