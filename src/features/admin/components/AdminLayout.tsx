import { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { Menu, Stethoscope } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AdminLayoutProps {
    children: React.ReactNode;
    currentTab?: string;
    onTabChange?: (tab: string) => void;
    title?: string;
    subtitle?: string;
    headerActions?: React.ReactNode;
}

export const AdminLayout = ({ 
    children, 
    currentTab, 
    onTabChange, 
    title = "Panel", 
    subtitle = "Gestión integral de tu consulta médica",
    headerActions
}: AdminLayoutProps) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { fullName, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const handleTabChange = (tab: string) => {
        if (onTabChange) {
            onTabChange(tab);
        } else {
            // If we're not on the dashboard, navigate there with the tab
            navigate(`/admin?tab=${tab}`);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50/50 font-sans overflow-hidden">
            <AdminSidebar 
                currentTab={currentTab}
                onTabChange={handleTabChange}
                fullName={fullName || ''}
                onLogout={handleLogout}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
            />

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 p-4 lg:p-10 transition-all duration-300 max-h-screen overflow-y-auto w-full">
                {/* Mobile Header Toolbar */}
                <div className="lg:hidden flex justify-between items-center mb-8">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm active:scale-95 transition-all"
                    >
                        <Menu className="w-6 h-6 text-slate-600" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-[#0f172a] rounded-lg flex items-center justify-center">
                            <Stethoscope className="text-white w-5 h-5" />
                        </div>
                        <span className="text-slate-900 font-bold tracking-tight">MedicAdmin</span>
                    </div>
                </div>

                {/* Content Header (Actions) */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-10">
                    <div className="animate-fade-in lg:animate-slide-up">
                        <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0f172a] tracking-tight capitalize">
                            {title}
                        </h2>
                        <p className="text-slate-500 mt-2 text-lg font-medium">{subtitle}</p>
                    </div>

                    <div id="admin-layout-actions" className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                        {headerActions}
                    </div>
                </div>

                {children}
            </main>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
};
