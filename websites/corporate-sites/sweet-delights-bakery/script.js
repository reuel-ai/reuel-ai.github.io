document.addEventListener('DOMContentLoaded', () => {
  // Set current year in footer
  const currentYearSpan = document.getElementById('current-year')
  if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear()
  }

  // Mobile menu toggle
  const mobileMenuButton = document.getElementById('mobile-menu-button')
  const mobileMenu = document.getElementById('mobile-menu')

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden')
    })

    // Close mobile menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden')
      })
    })
  }

  // Smooth scroll for nav links (Tailwind's scroll-smooth class on html handles basic smooth scroll, but this ensures offset)
  document
    .querySelectorAll('a.nav-link[href^="#"], #mobile-menu a[href^="#"]')
    .forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href')
        if (targetId === '#') {
          // Handle top of page navigation
          e.preventDefault()
          window.scrollTo({
            top: 0,
            behavior: 'smooth',
          })
          return
        }

        const targetElement = document.querySelector(targetId)
        if (targetElement) {
          e.preventDefault() // Prevent default jump

          const headerOffset = document.querySelector('header').offsetHeight
          const elementPosition = targetElement.getBoundingClientRect().top
          const offsetPosition =
            elementPosition + window.pageYOffset - headerOffset - 20 // Add a little extra padding

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          })
        }
      })
    })

  // Handle form submission (basic example - integrate with backend for real use)
  const contactForm = document.getElementById('contact-form')
  if (contactForm) {
    contactForm.addEventListener('submit', function (event) {
      event.preventDefault() // Prevent default form submission

      // Basic validation
      const name = document.getElementById('name').value.trim()
      const email = document.getElementById('email').value.trim()
      const message = document.getElementById('message').value.trim()

      if (name === '' || email === '' || message === '') {
        alert('Please fill in all required fields.')
        return
      }

      // In a real application, you would send this data to a server
      console.log('Form Submitted!')
      console.log('Name:', name)
      console.log('Email:', email)
      console.log('Subject:', document.getElementById('subject').value.trim())
      console.log('Message:', message)

      alert('Thank you for your message! We will get back to you soon.')
      contactForm.reset() // Clear the form
    })
  }

  // Intersection Observer for scroll animations
  const fadeInElements = document.querySelectorAll(
    '.animate-fade-in, .animate-fade-in-up, .animate-fade-in-down, .animate-fade-in-left, .animate-fade-in-right'
  )

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          // Optional: stop observing once visible
          observer.unobserve(entry.target)
        }
      })
    },
    {
      threshold: 0.1, // Trigger when 10% of the element is visible
    }
  )

  fadeInElements.forEach((element) => {
    observer.observe(element)
  })

  // Scrollspy-like active link highlighting
  const sections = document.querySelectorAll('section[id]')
  const navLinks = document.querySelectorAll('.nav-link')

  const highlightNavLink = () => {
    let current = ''
    sections.forEach((section) => {
      const sectionTop = section.offsetTop
      const sectionHeight = section.clientHeight
      // Adjust offset for fixed header
      if (
        pageYOffset >=
        sectionTop - document.querySelector('header').offsetHeight - 30
      ) {
        current = section.getAttribute('id')
      }
    })

    navLinks.forEach((link) => {
      link.classList.remove('active')
      if (link.getAttribute('href').includes(current)) {
        link.classList.add('active')
      }
    })
  }

  window.addEventListener('scroll', highlightNavLink)
  highlightNavLink() // Call on load to set initial active state
})
