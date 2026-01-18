import Sidebar from './Sidebar'

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-neutral-50">
            <Sidebar />

            {/* Mobile spacer for top header */}
            <div className="lg:hidden h-14" />

            {/* Main content area with sidebar offset */}
            <main className="lg:ml-[280px] min-h-screen">
                {children}
            </main>
        </div>
    )
}

export default Layout
