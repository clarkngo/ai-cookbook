// Recipe detail page: renders recipe content and drives the live
// variable-injector preview + copy-to-clipboard buttons.
(function () {
  const params = new URLSearchParams(window.location.search);
  const recipeId = params.get('id');

  const root = document.getElementById('recipe-root');
  const notFound = document.getElementById('not-found');

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  }

  function highlightVars(template) {
    return escapeHTML(template).replace(
      /\{\{(\w+)\}\}/g,
      (_, name) => `<span class="prompt-var">{{${name}}}</span>`
    );
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

  async function copyToClipboard(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // Fallback for environments without Clipboard API permission.
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    if (btn) {
      const original = btn.textContent;
      btn.dataset.copied = 'true';
      btn.textContent = 'Copied!';
      setTimeout(() => {
        btn.dataset.copied = 'false';
        btn.textContent = original;
      }, 1500);
    }
  }

  function fillTemplate(template, values) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, name) => {
      const v = values[name];
      return v && v.trim() ? v : `{{${name}}}`;
    });
  }

  function render(recipe, category) {
    document.title = `${recipe.title} · AI Cookbook`;

    root.innerHTML = `
      <div class="mb-6 flex flex-wrap items-center gap-2">
        <span class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColorClasses(category?.color)}">
          <span>${category?.icon || ''}</span>${escapeHTML(category?.name || recipe.category)}
        </span>
        <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">${escapeHTML(recipe.difficulty)}</span>
        <span class="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">⏱ ${escapeHTML(recipe.estTime)}</span>
        <span class="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">${recipe.targetLLMs.map(escapeHTML).join(' · ')}</span>
      </div>

      <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">${escapeHTML(recipe.title)}</h1>

      <div class="flex flex-wrap gap-1.5 mb-8">
        ${recipe.tags.map((t) => `<span class="text-xs px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300">#${escapeHTML(t)}</span>`).join('')}
      </div>

      <section class="mb-10">
        <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-3">Problem / Intent</h2>
        <p class="text-slate-700 dark:text-slate-300 leading-relaxed">${escapeHTML(recipe.problem)}</p>
      </section>

      <section class="mb-10">
        <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">The Workflow</h2>
        <ol class="space-y-4">
          ${recipe.workflow
            .map(
              (w, i) => `
            <li class="flex gap-4">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-bold flex items-center justify-center text-sm">${i + 1}</div>
              <div>
                <p class="font-semibold text-slate-900 dark:text-white">${escapeHTML(w.step.replace(/^\d+\.\s*/, ''))}</p>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">${escapeHTML(w.detail)}</p>
              </div>
            </li>`
            )
            .join('')}
        </ol>
      </section>

      <section class="mb-10">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white">Prompt Template</h2>
          <button id="copy-template-btn" class="copy-btn text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Copy</button>
        </div>
        <pre class="prompt-block scroll-area overflow-x-auto font-mono-code text-sm bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-800"><code id="template-code">${highlightVars(recipe.promptTemplate)}</code></pre>
      </section>

      <section class="mb-10 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 p-5 sm:p-6">
        <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-1">🧪 Variable Injector</h2>
        <p class="text-sm text-slate-600 dark:text-slate-400 mb-5">Fill in the variables to preview your customized prompt, then copy it.</p>
        <div id="var-form" class="grid sm:grid-cols-2 gap-4 mb-5"></div>
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">Live Preview</h3>
          <button id="copy-preview-btn" class="copy-btn text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Copy customized prompt</button>
        </div>
        <pre id="preview-output" class="prompt-block scroll-area overflow-x-auto font-mono-code text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl p-5 border border-slate-200 dark:border-slate-800"></pre>
      </section>

      <section class="mb-10">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white">Expected Output / Example</h2>
          <button id="copy-example-btn" class="copy-btn text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Copy</button>
        </div>
        <pre class="prompt-block scroll-area overflow-x-auto font-mono-code text-sm bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-xl p-5 border border-slate-200 dark:border-slate-800">${escapeHTML(recipe.exampleOutput)}</pre>
      </section>

      <section class="mb-4">
        <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-3">Tips & Variations</h2>
        <ul class="space-y-2">
          ${recipe.tips.map((t) => `<li class="flex gap-2 text-sm text-slate-700 dark:text-slate-300"><span class="text-indigo-500 mt-0.5">💡</span><span>${escapeHTML(t)}</span></li>`).join('')}
        </ul>
      </section>
    `;

    // Copy buttons for static blocks.
    document.getElementById('copy-template-btn').addEventListener('click', (e) => copyToClipboard(recipe.promptTemplate, e.currentTarget));
    document.getElementById('copy-example-btn').addEventListener('click', (e) => copyToClipboard(recipe.exampleOutput, e.currentTarget));

    // Variable injector form.
    const varForm = document.getElementById('var-form');
    const values = {};
    recipe.variables.forEach((v) => { values[v.name] = v.default || ''; });

    varForm.innerHTML = recipe.variables
      .map(
        (v) => `
      <label class="block">
        <span class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">${escapeHTML(v.label)} <code class="text-xs text-indigo-500">{{${escapeHTML(v.name)}}}</code></span>
        <textarea data-var="${escapeHTML(v.name)}" rows="2" placeholder="${escapeHTML(v.placeholder)}" class="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"></textarea>
      </label>`
      )
      .join('');

    const previewOutput = document.getElementById('preview-output');

    function updatePreview() {
      previewOutput.textContent = fillTemplate(recipe.promptTemplate, values);
    }

    varForm.querySelectorAll('[data-var]').forEach((el) => {
      el.addEventListener('input', () => {
        values[el.dataset.var] = el.value;
        updatePreview();
      });
    });

    updatePreview();

    document.getElementById('copy-preview-btn').addEventListener('click', (e) => {
      copyToClipboard(fillTemplate(recipe.promptTemplate, values), e.currentTarget);
    });
  }

  async function init() {
    if (!recipeId) {
      root.classList.add('hidden');
      notFound.classList.remove('hidden');
      return;
    }
    try {
      const [recipe, categories] = await Promise.all([
        AICookbookData.getRecipeById(recipeId),
        AICookbookData.getCategories(),
      ]);
      const category = categories.find((c) => c.id === recipe.category);
      render(recipe, category);
    } catch (err) {
      root.classList.add('hidden');
      notFound.classList.remove('hidden');
      console.error(err);
    }
  }

  init();
})();
