const fs = require('fs')
const path = require('path')

const ROOT_DIR = './websites'
const GITHUB_REPO_URL = 'https://github.com/reuel-ai/reuel-ai.github.io/tree/main' 

const EXCLUDE_DIRS = new Set(['.git', '.github', '.vscode', 'node_modules'])

const CATEGORY_FILE = 'public/data/categories.json'
const PROJECT_FILE = 'public/data/projects.json'
const STATS_FILE = 'public/data/stats.json'

function safeReadDirSync(dir) {
  try { return fs.readdirSync(dir, { withFileTypes: true }) } 
  catch { return [] }
}

function normalizeKey(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

function normalizeLabel(name) {
  return name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function findImage(projectDir, projectName) {
  const exts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']
  for (const ext of exts) {
    const file = path.join(projectDir, `cover.${ext}`)
    if (fs.existsSync(file)) return `/${file.replace(/\\/g, '/')}`
  }
  return `https://via.placeholder.com/600x400?text=${encodeURIComponent(projectName)}`
}

function generateCategories() {
  const categories = []
  const dirs = safeReadDirSync(ROOT_DIR)
  dirs.forEach((dir) => {
    if (!dir.isDirectory() || EXCLUDE_DIRS.has(dir.name) || dir.name.startsWith('.')) return
    const categoryPath = path.join(ROOT_DIR, dir.name)
    categories.push({
      key: normalizeKey(dir.name),
      label: normalizeLabel(dir.name),
      path: categoryPath.replace(/\\/g, '/'),
    })
  })
  return categories
}

function generateProjects(categories) {
  const projects = []
  categories.forEach((category) => {
    const categoryPath = category.path
    const projectDirs = safeReadDirSync(categoryPath)
    
    projectDirs.forEach((dir) => {
      if (!dir.isDirectory() || EXCLUDE_DIRS.has(dir.name) || dir.name.startsWith('.')) return
      
      const projectDir = path.join(categoryPath, dir.name)
      const metadataFile = path.join(projectDir, 'public/data/projects.json')
      let meta = {}

      if (fs.existsSync(metadataFile)) {
        try { meta = JSON.parse(fs.readFileSync(metadataFile, 'utf8')) } 
        catch (err) { console.warn(`Unable to parse ${metadataFile}: ${err.message}`) }
      }

      const imageLink = meta.imageLink || findImage(projectDir, dir.name)
      
      const hasDemo = fs.existsSync(path.join(projectDir, 'index.html'))
      const demoLink = hasDemo ? `/${projectDir.replace(/\\/g, '/')}/` : ''

      const repoLink = `${GITHUB_REPO_URL}/${category.path}/${dir.name}`

      function inferTechnology(projectDir) {
        const tech = ['HTML5']
        if (fs.existsSync(path.join(projectDir, 'style.css'))) tech.push('CSS3')
        if (fs.existsSync(path.join(projectDir, 'tailwind.config.js'))) tech.push('Tailwind CSS')
        if (fs.existsSync(path.join(projectDir, 'bootstrap.min.css'))) tech.push('Bootstrap')
        if (fs.existsSync(path.join(projectDir, 'script.js'))) tech.push('JavaScript')
        if (fs.existsSync(path.join(projectDir, 'alpine.js'))) tech.push('Alpine.js')
        return tech
      }

      projects.push({
        id: normalizeKey(dir.name),
        name: meta.name || normalizeLabel(dir.name),
        category: category.key,
        categoryLabel: category.label,
        description: meta.description || '',
        featured: meta.featured || false,
        responsive: meta.responsive ?? true,
        difficulty: meta.difficulty || 'Beginner',
        technology: meta.technology ?? inferTechnology(projectDir),
        tags: meta.tags || [],
        imageLink,
        demoLink,
        repoLink,
        created: meta.created || '',
        updated: meta.updated || '',
      })
    })
  })
  return projects
}

function generateStats(projects) {
  const stats = {
    totalProjects: projects.length,
    featuredProjects: projects.filter((p) => p.featured).length,
    responsiveProjects: projects.filter((p) => p.responsive).length,
    technologies: [...new Set(projects.flatMap((p) => p.technology))],
    categories: {},
  }
  projects.forEach((project) => {
    stats.categories[project.category] = (stats.categories[project.category] || 0) + 1
  })
  return stats
}

function writeJson(file, data) {
  const dir = path.dirname(file)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
  console.log(`✔ Generated ${file}`)
}

function main() {
  console.log('Generating portfolio data...')
  const categories = generateCategories()
  const projects = generateProjects(categories)
  const stats = generateStats(projects)

  writeJson(CATEGORY_FILE, categories)
  writeJson(PROJECT_FILE, projects)
  writeJson(STATS_FILE, stats)

  console.log(`\nSuccess! Generated ${projects.length} projects.`)
}

main()