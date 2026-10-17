const ACCOUNT_ROUTES = ['/profile', '/member-card', '/tasks', '/orders', '/admin', '/login', '/signup', '/forgot-password', '/reset-password']

export default function MobileTabBar({ page, session, Link, Icon }) {
  const tabs = [
    { to: '/', label: 'Home', icon: 'star', current: page === '/' },
    { to: '/menu', label: 'Menu', icon: 'cup', current: page === '/menu' },
    { to: '/rewards', label: 'Rewards', icon: 'gift', current: page === '/rewards' || page.startsWith('/rewards/') },
    { to: '/leaderboard', label: 'Board', icon: 'trophy', current: page === '/leaderboard' },
    { to: session ? '/profile' : '/login', label: session ? 'Account' : 'Log in', icon: 'user', current: ACCOUNT_ROUTES.includes(page) },
  ]
  return <nav className="mobile-tabbar" aria-label="App navigation">
    {tabs.map(tab => <Link key={tab.label} to={tab.to} aria-current={tab.current ? 'page' : undefined}><Icon name={tab.icon} size={20}/><span>{tab.label}</span></Link>)}
  </nav>
}
