// GLOBAL STATE
const state = {
  projects: [],
  categories: [],
  currentView: localStorage.getItem('viewMode') || 'grid',
};

// UTILITY FUNCTIONS
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function renderTechTags(technologies, limit = 4) {
  if (!Array.isArray(technologies) || technologies.length === 0) return '';
  return technologies
    .slice(0, limit)
    .map((tech) => `<span class="px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold">${tech}</span>`)
    .join('');
}

// DATA LOADING
async function loadData() {
  try {
    const [categories, projects] = await Promise.all([
      fetch('public/data/categories.json').then((res) => res.ok ? res.json() : Promise.reject('Failed to fetch categories')),
      fetch('public/data/projects.json').then((res) => res.ok ? res.json() : Promise.reject('Failed to fetch projects')),
    ]);

    state.categories = categories;
    state.projects = projects;

    if (document.getElementById('projects-grid')) {
      populateCategoryFilter(state.categories);
      populateTechnologyFilter(state.projects);
      renderProjects(state.projects);
      initializeFilters();
      initializeViewToggle();
      initializeScrollSpy(); // New: For one-page active link highlighting
    }
  } catch (error) {
    console.error('Error loading portfolio data:', error);
    showErrorState();
  }
}

function showErrorState() {
  const grid = document.getElementById('projects-grid');
  if (grid) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-16">
        <div class="text-6xl mb-4" aria-hidden="true">⚠️</div>
        <p class="text-xl text-red-500 mb-2 font-semibold">Failed to load projects</p>
        <p class="text-sm text-gray-400">Please check your connection or try again later.</p>
      </div>`;
  }
}

// RENDER FUNCTIONS
function populateCategoryFilter(categories) {
  const select = document.getElementById('category-filter');
  if (!select) return;
  select.innerHTML = '<option value="">All Categories</option>';
  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category.key;
    option.textContent = category.label;
    select.appendChild(option);
  });
}

function populateTechnologyFilter(projects) {
  const select = document.getElementById('tech-filter');
  if (!select) return;
  const technologies = [...new Set(projects.flatMap((p) => p.technology || []))].sort();
  select.innerHTML = '<option value="">All Technologies</option>';
  technologies.forEach((tech) => {
    const option = document.createElement('option');
    option.value = tech;
    option.textContent = tech;
    select.appendChild(option);
  });
}

function createProjectCard(proj) {
  const primaryLink = proj.demoLink || proj.repoLink || '#';
  return `
    <article class="project-card group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 border border-gray-100 dark:border-gray-700 flex flex-col h-full">
      <a href="${primaryLink}" target="_blank" rel="noopener noreferrer" class="relative block overflow-hidden focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
        <img src="${proj.imageLink}" alt="Screenshot of ${proj.name}" class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
        ${proj.featured ? `<div class="absolute top-3 left-3"><span class="px-3 py-1 rounded-full bg-yellow-500 text-gray-900 text-xs font-bold shadow-lg flex items-center gap-1"><i class="fas fa-star" aria-hidden="true"></i> Featured</span></div>` : ''}
      </a>
      <div class="p-6 flex flex-col flex-1">
        <a href="${primaryLink}" target="_blank" rel="noopener noreferrer" class="block focus:outline-none focus:underline mb-2">
          <h3 class="font-bold text-xl text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-1">${proj.name}</h3>
        </a>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 flex-1">${proj.description}</p>
        <div class="flex flex-wrap gap-2 mb-4">${renderTechTags(proj.technology, 4)}</div>
        ${proj.repoLink ? `
          <div class="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
            <a href="${proj.repoLink}" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
              <i class="fab fa-github text-lg" aria-hidden="true"></i> View Source Code
            </a>
          </div>` : ''}
      </div>
    </article>`;
}

function renderProjects(projects) {
  const grid = document.getElementById('projects-grid');
  const feedback = document.getElementById('projects-feedback');
  const countEl = document.getElementById('count-number');

  if (!grid) return;
  grid.innerHTML = '';

  if (!projects || projects.length === 0) {
    if (feedback) feedback.classList.remove('hidden');
    if (countEl) countEl.textContent = '0';
    return;
  }

  if (feedback) feedback.classList.add('hidden');
  if (countEl) countEl.textContent = projects.length;
  grid.innerHTML = projects.map(createProjectCard).join('');
  
  // Re-apply view mode
  if (state.currentView === 'compact') {
    grid.className = 'grid grid-cols-1 gap-4';
  }
}

// FILTERS & VIEW TOGGLE
function initializeFilters() {
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');
  const techFilter = document.getElementById('tech-filter');
  const featuredFilter = document.getElementById('filter-featured');
  const clearBtn = document.getElementById('clear-filters');

  if (searchInput) searchInput.addEventListener('input', debounce(filterProjects, 300));
  if (categoryFilter) categoryFilter.addEventListener('change', filterProjects);
  if (techFilter) techFilter.addEventListener('change', filterProjects);
  if (featuredFilter) featuredFilter.addEventListener('change', filterProjects);
  
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (categoryFilter) categoryFilter.value = '';
      if (techFilter) techFilter.value = '';
      if (featuredFilter) featuredFilter.checked = false;
      filterProjects();
    });
  }
}

function filterProjects() {
  const search = document.getElementById('search-input')?.value.toLowerCase().trim() || '';
  const category = document.getElementById('category-filter')?.value || '';
  const technology = document.getElementById('tech-filter')?.value || '';
  const featured = document.getElementById('filter-featured')?.checked;

  let filtered = [...state.projects];
  if (search) filtered = filtered.filter((p) => p.name.toLowerCase().includes(search) || p.description.toLowerCase().includes(search) || (p.technology || []).some((t) => t.toLowerCase().includes(search)));
  if (category) filtered = filtered.filter((p) => p.category === category);
  if (technology) filtered = filtered.filter((p) => p.technology?.includes(technology));
  if (featured) filtered = filtered.filter((p) => p.featured);

  renderProjects(filtered);
}

function initializeViewToggle() {
  const gridBtn = document.getElementById('view-grid');
  const compactBtn = document.getElementById('view-compact');
  const projectsGrid = document.getElementById('projects-grid');
  if (!gridBtn || !compactBtn || !projectsGrid) return;

  function updateView(mode) {
    state.currentView = mode;
    localStorage.setItem('viewMode', mode);
    projectsGrid.className = mode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-8' : 'grid grid-cols-1 gap-4';
    
    const active = 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg';
    const inactive = 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700';
    
    gridBtn.className = `flex-1 px-4 py-3 rounded-xl transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${mode === 'grid' ? active : inactive}`;
    compactBtn.className = `flex-1 px-4 py-3 rounded-xl transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${mode === 'compact' ? active : inactive}`;
  }

  gridBtn.addEventListener('click', () => updateView('grid'));
  compactBtn.addEventListener('click', () => updateView('compact'));
  updateView(state.currentView);
}

// ONE-PAGE SCROLL SPY (Active Link Highlighting)
function initializeScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach((link) => {
          link.classList.remove('text-blue-600', 'dark:text-blue-400', 'active');
          const underline = link.querySelector('span');
          if (underline) underline.classList.remove('w-full');
          
          if (link.getAttribute('href') === `#${id}` || link.getAttribute('data-page') === id) {
            link.classList.add('text-blue-600', 'dark:text-blue-400', 'active');
            if (underline) setTimeout(() => underline.classList.add('w-full'), 100);
          }
        });
      }
    });
  }, { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' });

  sections.forEach((section) => observer.observe(section));
}

// INITIALIZATION
document.addEventListener('partialsLoaded', loadData, { once: true });
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const header = document.getElementById('header');
    if (!header || header.innerHTML.trim() !== '') loadData();
  }, 150);
});