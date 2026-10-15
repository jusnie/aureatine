import { MENU_SECTIONS } from './menuData'
import './menu.css'

function MenuItem({ item }) {
  return <li className="menu-item">
    <div className="menu-item-main">
      <h3>{item.name}</h3>
      {item.description && <p>{item.description}</p>}
      {item.allergens?.length > 0 && <ul className="menu-allergens" aria-label="Allergens">{item.allergens.map(allergen => <li key={allergen}>{allergen}</li>)}</ul>}
    </div>
    {typeof item.price === 'number' && <span className="menu-price">₱{item.price.toLocaleString()}</span>}
  </li>
}

export default function MenuPage() {
  return <section className="menu-page shell" aria-labelledby="menu-title">
    <header className="menu-header">
      <span className="section-label">WHAT'S ON</span>
      <h1 id="menu-title">Menu</h1>
    </header>
    {MENU_SECTIONS.map(section => <section key={section.id} className="menu-section" aria-labelledby={`menu-${section.id}`}>
      <div className="menu-section-heading">
        <h2 id={`menu-${section.id}`}>{section.title}</h2>
        {section.intro && <p>{section.intro}</p>}
      </div>
      {section.items.length > 0
        ? <ul className="menu-list">{section.items.map(item => <MenuItem key={item.name} item={item}/>)}</ul>
        : <div className="menu-empty"><span className="little-pill">COMING SOON</span><p>Our first shake lineup is being confirmed. Flavors, ingredients, allergen details, and prices will appear here once the menu is final.</p></div>}
    </section>)}
  </section>
}
