import './style.scss'

// declare var stage;
document.addEventListener('DOMContentLoaded', () => {
  // Get all "navbar-burger" elements
  const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0)

  // Add a click event on each of them
  $navbarBurgers.forEach((el) => {
    const target = el.dataset.target
    const $target = document.getElementById(target)

    el.addEventListener('click', () => {
      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      el.classList.toggle('is-active')
      $target?.classList.toggle('is-active')
      const menuDisplay = document?.getElementById('icon-menu')?.style.display
      document.getElementById('icon-menu')!.style.display = menuDisplay === 'inline' ? 'none' : 'inline'
    })
  })
})
