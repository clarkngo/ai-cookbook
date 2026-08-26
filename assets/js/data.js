// Shared data-loading utilities. Paths are relative so the site works
// whether it's served from a domain root or a GitHub Pages project subpath.
const AICookbookData = (() => {
  function basePath() {
    // Resolve relative to this script's own location so it works from
    // both index.html and recipe.html regardless of deploy subpath.
    const scripts = document.getElementsByTagName('script');
    for (const s of scripts) {
      if (s.src && s.src.includes('/assets/js/data.js')) {
        return s.src.replace(/assets\/js\/data\.js.*$/, '');
      }
    }
    return './';
  }

  async function fetchJSON(path) {
    const res = await fetch(basePath() + path, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    return res.json();
  }

  async function getCategories() {
    return fetchJSON('data/categories.json');
  }

  async function getAllRecipes() {
    const ids = await fetchJSON('data/recipes/index.json');
    const recipes = await Promise.all(
      ids.map((id) => fetchJSON(`data/recipes/${id}.json`))
    );
    return recipes;
  }

  async function getRecipeById(id) {
    return fetchJSON(`data/recipes/${id}.json`);
  }

  return { getCategories, getAllRecipes, getRecipeById };
})();
