import { LayoutDashboard, Calendar as CalendarIcon, Users, Stethoscope, LogOut, X, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { GlobalSearch } from './GlobalSearch';

interface AdminSidebarProps {
    currentTab?: string;
    onTabChange: (tab: string) => void;
    fullName?: string;
    onLogout: () => void;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
}

export const AdminSidebar = ({
    currentTab,
    onTabChange,
    fullName,
    onLogout,
    isMobileMenuOpen,
    setIsMobileMenuOpen
}: AdminSidebarProps) => {
    const NavItems = [
        { id: 'overview', label: 'Tablero', icon: LayoutDashboard },
        { id: 'calendar', label: 'Calendario', icon: CalendarIcon },
        { id: 'patients', label: 'Pacientes', icon: Users },
    ];

    return (
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0f172a] text-slate-300 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex flex-col h-full p-6">
                {/* Logo */}
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-10 h-10 bg-sky-500/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                        <Stethoscope className="text-sky-400 w-6 h-6" />
                    </div>
                    <span className="text-white text-xl font-bold tracking-tight">MedicAdmin</span>
                </div>

                {/* Global Search */}
                <div className="mb-8 px-2">
                    <GlobalSearch />
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-2">
                    {NavItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                onTabChange(item.id);
                                setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${currentTab === item.id
                                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                                    : 'hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${currentTab === item.id ? 'text-white' : 'text-slate-400'}`} />
                            {item.label}
                        </button>
                    ))}

                    {/* Divider + Configuración */}
                    <div className="pt-2 border-t border-white/5">
                        <button
                            onClick={() => { onTabChange('settings'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                currentTab === 'settings'
                                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                                    : 'hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <Settings className={`w-5 h-5 ${currentTab === 'settings' ? 'text-white' : 'text-slate-400'}`} />
                            Configuración
                        </button>
                    </div>
                </nav>

                {/* Footer Session */}
                <div className="mt-auto pt-6 border-t border-white/5">
                    <div className="flex items-center gap-3 mb-6 px-2 text-left">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 overflow-hidden">
                            <Users className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white truncate">{fullName || 'Usuario'}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Administrador</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={onLogout}
                        className="w-full justify-start gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all border-0 shadow-none"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Cerrar Sesión</span>
                    </Button>
                </div>
            </div>

            {/* Mobile Close Button - Moved inside the sidebar area for better UI */}
            <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="lg:hidden absolute top-6 right-4 p-2 text-slate-400 hover:text-white transition-colors"
                aria-label="Cerrar menú"
            >
                <X className="w-6 h-6" />
            </button>
        </aside>
    );
};
