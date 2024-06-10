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
  // Functions to open and close a modal
  function openModal($el: HTMLElement | null) {
    $el?.classList.add('is-active')
  }

  function closeModal($el: Element | null) {
    $el?.classList.remove('is-active')
  }

  function closeAllModals() {
    ;(document.querySelectorAll('.modal') || []).forEach(($modal) => {
      closeModal($modal)
    })
  }

  // Add a click event on buttons to open a specific modal
  ;(document.querySelectorAll('.js-modal-trigger') || []).forEach(($trigger) => {
    const modal = ($trigger as HTMLElement).dataset.target
    if (!modal) {
      return
    }
    const $target = document.getElementById(modal)
    $trigger.addEventListener('click', () => {
      openModal($target)
    })
  })

  // Add a click event on various child elements to close the parent modal
  ;(
    document.querySelectorAll('.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button') ||
    []
  ).forEach(($close) => {
    const $target = $close.closest('.modal')
    $close.addEventListener('click', () => {
      closeModal($target)
    })
  })
  // Add a keyboard event to close all modals
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAllModals()
    }
  })
})
