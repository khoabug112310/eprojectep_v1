import React from 'react'
import './SkipLinks.css'

export default function SkipLinks() {
  const skipToMainContent = () => {
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      mainContent.focus()
      mainContent.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const skipToNavigation = () => {
    const navigation = document.getElementById('main-navigation')
    if (navigation) {
      navigation.focus()
      navigation.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const skipToFooter = () => {
    const footer = document.getElementById('main-footer')
    if (footer) {
      footer.focus()
      footer.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="skip-links" role="navigation" aria-label="Skip navigation links">
      <button 
        className="skip-link"
        onClick={skipToMainContent}
        type="button"
        aria-label="Skip to main content"
      >
        Skip to main content
      </button>
      <button 
        className="skip-link"
        onClick={skipToNavigation}
        type="button"
        aria-label="Skip to navigation"
      >
        Skip to navigation
      </button>
      <button 
        className="skip-link"
        onClick={skipToFooter}
        type="button"
        aria-label="Skip to footer"
      >
        Skip to footer
      </button>
    </div>
  )
}