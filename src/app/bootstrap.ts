import 'bootstrap-icons/font/bootstrap-icons.css'
import '../styles/base.css'
import '../styles/layout.css'
import '../styles/panels.css'
import '../components'
import './eraser-app'

// Mount the root component if not declared in HTML
if (!document.querySelector('eraser-app')) {
  const app = document.createElement('eraser-app')
  document.body.appendChild(app)
}
