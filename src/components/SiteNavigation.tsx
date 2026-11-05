import { Link, NavLink } from 'react-router-dom'

export default function SiteNavigation() {
  return (
    <header className="studio-header">
      <nav aria-label="Main navigation" className="studio-nav">
        <Link aria-label="Collective Edit home" className="studio-mark" to="/">
          <span aria-hidden="true" className="studio-mark__symbol">C</span>
          <span>COLLECTIVE<br />EDIT</span>
        </Link>
        <div className="studio-nav__primary">
          <NavLink end to="/">Latest</NavLink>
          <NavLink to="/works">Works</NavLink>
        </div>
        <div className="studio-nav__secondary">
          <NavLink to="/services">Services</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </div>
      </nav>
    </header>
  )
}
