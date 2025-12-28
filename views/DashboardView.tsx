import React, { useState, useEffect, useMemo } from 'react';
import { User, DashboardStats, CalendarEvent, Student, UserRole } from '../types';
import { sheetApi } from '../services/SheetApi';
import { 
  LayoutDashboardIcon, 
  UsersIcon, 
  BriefcaseIcon,
  RupeeIcon, 
  RupeeBillIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  LogOutIcon,
  SchoolIcon,
  UserPlusIcon,
  LoaderIcon,
  PlusIcon,
  SearchIcon,
  WisdomLogo,
  UserIcon,
  BanknoteIcon,
  CalendarIcon,
  CheckSquareIcon,
  GraduationCapIcon,
  PencilIcon,
  TrashIcon
} from '../components/Icons';
import { AddStudentModal } from '../components/AddStudentModal';
import { EmployeeModal } from '../components/EmployeeActionModals';
import { StudentSearchModal } from '../components/StudentSearchModal';
import { CollectFeesModal } from '../components/CollectFeesModal';
import { AddEventModal } from '../components/AddEventModal';
import { EditEventModal } from '../components/EditEventModal';
import { AddExpenseModal } from '../components/ExpenseActionModals';
import { StudentsView } from './StudentsView';
import { EmployeesView } from './EmployeesView';
import { FeesView } from './FeesView';
import { ExpensesView } from './ExpensesView';
import { StaffAttendanceView } from './StaffAttendanceView';
import { UserProfileModal } from '../components/UserProfileModal';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface DashboardViewProps {
  user: User | null;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

type AdminView = 'dashboard' | 'students' | 'employees' | 'staffAttendance' | 'fees' | 'expenses' | 'users';

const QuickActionCard: React.FC<{ 
  label: string; 
  icon: React.FC<{ className?: string }>; 
  color: string;
  onClick: () => void;
}> = ({ label, icon: Icon, color, onClick }) => (
  <button 
    onClick={onClick} 
    className="group relative flex flex-col items-center justify-center p-6 h-36 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-zinc-800 hover:border-[#197fe6] dark:hover:border-zinc-700 hover:shadow-glow transition-all duration-300 active:scale-95 overflow-hidden"
  >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 ${color} bg-opacity-10 dark:bg-opacity-20 text-current`}>
          <Icon className={`w-7 h-7 ${color.replace('bg-', 'text-').replace('/10', '')}`} />
      </div>
      <span className="font-bold text-sm text-slate-600 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-zinc-100 transition-colors">{label}</span>
  </button>
);

const EventItem: React.FC<{ 
    event: CalendarEvent; 
    showAudienceBadge?: boolean;
    isAdmin?: boolean;
    onEdit?: (e: CalendarEvent) => void;
    onDelete?: (e: CalendarEvent) => void;
}> = ({ event, showAudienceBadge, isAdmin, onEdit, onDelete }) => (
    <div className="flex items-center gap-4 p-5 bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group relative overflow-hidden cursor-default">
        <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 font-bold leading-none transition-colors 
            ${event.type === 'sports' ? 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400' : 
              event.type === 'academic' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400' : 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400'}`}>
            <span className="text-[10px] uppercase opacity-70">{event.date.split(' ')[0].substring(0,3)}</span>
            <span className="text-lg tracking-tighter">{event.date.split(' ')[1]?.replace(',','')}</span>
        </div>
        <div className="flex-1 min-w-0 pr-12">
            <div className="flex items-center gap-2 mb-0.5">
                <h4 className="font-bold text-slate-900 dark:text-zinc-100 text-sm truncate">{event.title}</h4>
                {showAudienceBadge && event.audience && event.audience !== 'all' && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest ${event.audience === 'staff' ? 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                        {event.audience}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${event.type === 'sports' ? 'bg-orange-500' : event.type === 'academic' ? 'bg-blue-500' : 'bg-purple-500'}`}></span>
                <span className="text-xs text-slate-500 dark:text-zinc-500 font-medium capitalize">{event.type} Event</span>
            </div>
        </div>

        {isAdmin && (
            <div className="absolute top-1/2 -translate-y-1/2 right-4 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => onEdit?.(event)}
                    className="p-1.5 bg-slate-50 dark:bg-zinc-800 text-slate-400 hover:text-blue-500 rounded-lg transition-colors"
                    title="Edit Event"
                >
                    <PencilIcon className="w-3 h-3" />
                </button>
                <button 
                    onClick={() => onDelete?.(event)}
                    className="p-1.5 bg-slate-50 dark:bg-zinc-800 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                    title="Delete Event"
                >
                    <TrashIcon className="w-3 h-3" />
                </button>
            </div>
        )}
    </div>
);

export const DashboardView: React.FC<DashboardViewProps> = ({ user, onLogout, isDarkMode, onToggleTheme }) => {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCollectFeesOpen, setIsCollectFeesOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [selectedStudentForFees, setSelectedStudentForFees] = useState<Student | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSubViewProfileOpen, setIsSubViewProfileOpen] = useState(false);

  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;
  const isManagement = user?.role === UserRole.MANAGEMENT;

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, eventsRes] = await Promise.all([
        sheetApi.getStats(),
        sheetApi.getEvents()
      ]);
      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (eventsRes.success && eventsRes.data) setEvents(eventsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return events.filter(e => {
        if (e.type === 'holiday') return false;
        const eventDate = new Date(e.date);
        return !isNaN(eventDate.getTime()) && eventDate >= today;
    }).slice(0, 4);
  }, [events]);

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    setIsDeleting(true);
    try {
        const res = await sheetApi.removeEvent(eventToDelete.id);
        if (res.success) {
            await fetchDashboardData();
            setEventToDelete(null);
        } else {
            alert(res.message || "Failed to delete event.");
        }
    } finally {
        setIsDeleting(false);
    }
  };

  const handleSetCurrentView = (view: AdminView) => {
    setCurrentView(view);
    setIsSubViewProfileOpen(false);
  };

  const NavItem = ({ icon: Icon, label, view, isMobile = false }: { icon: any, label: string, view: AdminView, isMobile?: boolean }) => {
    const isActive = currentView === view;
    if (isManagement && (view === 'employees' || view === 'expenses' || view === 'users' || view === 'staffAttendance')) return null;

    if (isMobile) {
        return (
          <button 
            onClick={() => handleSetCurrentView(view)} 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-[#197fe6]' : 'text-slate-400 dark:text-zinc-600'}`}
          >
              <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[9px] font-bold truncate max-w-[60px]">{label}</span>
              <div className={`w-1 h-1 rounded-full bg-[#197fe6] transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>
          </button>
        );
    }
    return (
      <button 
        onClick={() => handleSetCurrentView(view)} 
        className={`flex items-center gap-4 px-6 py-4 rounded-[2rem] transition-all w-full text-left relative overflow-hidden group ${isActive ? 'bg-[#197fe6] text-white shadow-glow' : 'text-slate-500 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-900'}`}
      >
          <Icon className={`w-5 h-5 relative z-10 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 dark:text-zinc-600 group-hover:text-slate-600 dark:group-hover:text-zinc-400'}`} />
          <span className={`text-sm font-medium relative z-10 ${isActive ? 'font-bold' : ''}`}>{label}</span>
      </button>
    );
  };

  const getOptimizedPhotoUrl = (url?: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com/uc?export=view')) {
      const idMatch = url.match(/id=([^&]+)/);
      if (idMatch && idMatch[1]) return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1000`;
    }
    return url;
  };

  const photoSrc = getOptimizedPhotoUrl(user?.avatarUrl) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`;
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const renderContent = () => {
    switch (currentView) {
      case 'students':
        return <StudentsView onBack={() => handleSetCurrentView('dashboard')} onProfileViewChange={setIsSubViewProfileOpen} currentUser={user} />;
      case 'employees':
        return isManagement ? null : <EmployeesView onBack={() => handleSetCurrentView('dashboard')} onProfileViewChange={setIsSubViewProfileOpen} onMarkAttendance={() => handleSetCurrentView('staffAttendance')} currentUser={user} />;
      case 'staffAttendance':
        return isManagement ? null : <StaffAttendanceView onBack={() => handleSetCurrentView('employees')} currentUser={user} />;
      case 'fees':
        return <FeesView onBack={() => handleSetCurrentView('dashboard')} />;
      case 'expenses':
        return isManagement ? null : <ExpensesView onBack={() => handleSetCurrentView('dashboard')} currentUser={user} />;
      default:
        return (
          <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 ease-out pb-32 w-full">
            
            <div className="md:hidden flex items-center justify-between px-6 pt-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center text-white shadow-sm overflow-hidden p-1 border dark:border-zinc-800">
                        <WisdomLogo className="w-full h-full" />
                    </div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-zinc-100 leading-none">Wisdom</h1>
                </div>
                <button 
                    onClick={() => setShowProfileModal(true)}
                    className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center shadow-sm border border-slate-100 dark:border-zinc-800 active:scale-95 transition-transform overflow-hidden"
                >
                    <img src={photoSrc} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
            </div>

            <div className="px-6 md:px-8 mt-2">
                <div className="relative w-full bg-gradient-to-br from-[#197fe6] to-[#4facfe] dark:from-zinc-900 dark:to-zinc-950 dark:border dark:border-zinc-800 rounded-[3rem] p-8 text-white shadow-glow overflow-hidden group">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 dark:bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-white/15 dark:bg-zinc-800/50 backdrop-blur-md border border-white/20 dark:border-zinc-700/50 w-fit">
                                <CalendarIcon className="w-3.5 h-3.5 text-blue-100 dark:text-zinc-400" />
                                <span className="text-[10px] font-black text-blue-50 dark:text-zinc-300 tracking-widest uppercase">{todayStr}</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-none dark:text-zinc-100">Hello, {user?.name?.split(' ')[0]}</h2>
                            <p className="text-blue-100 dark:text-zinc-400 font-medium text-lg mt-2 opacity-90">
                                Management System Active
                            </p>
                        </div>

                        <div className="flex gap-4 w-full md:w-auto">
                            <div className="flex-1 md:min-w-[140px] bg-white/15 dark:bg-zinc-800/30 backdrop-blur-md border border-white/20 dark:border-zinc-700/50 p-5 rounded-3xl flex flex-col items-start gap-3 hover:bg-white/20 transition-all active:scale-[0.98]">
                                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-900 text-[#197fe6] dark:text-zinc-100 flex items-center justify-center shadow-sm">
                                    <UsersIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black leading-none mb-1 dark:text-zinc-100">{loading ? '-' : stats?.totalStudents}</p>
                                    <p className="text-[10px] font-black text-blue-100 dark:text-zinc-500 uppercase tracking-widest opacity-70">Active Students</p>
                                </div>
                            </div>
                            {!isManagement && (
                                <div className="flex-1 md:min-w-[140px] bg-white/15 dark:bg-zinc-800/30 backdrop-blur-md border border-white/20 dark:border-zinc-700/50 p-5 rounded-3xl flex flex-col items-start gap-3 hover:bg-white/20 transition-all active:scale-[0.98]">
                                    <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-900 text-[#197fe6] dark:text-zinc-100 flex items-center justify-center shadow-sm">
                                        <BriefcaseIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black leading-none mb-1 dark:text-zinc-100">{loading ? '-' : stats?.totalTeachers}</p>
                                        <p className="text-[10px] font-black text-blue-100 dark:text-zinc-500 uppercase tracking-widest opacity-70">Active Staff</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <section className="px-6 md:px-8 mt-4">
                <div className="flex items-center justify-between px-2 mb-6">
                     <h3 className="text-xl font-black text-slate-900 dark:text-zinc-100 flex items-center gap-3">
                        <span className="w-1.5 h-7 bg-[#197fe6] dark:bg-zinc-700 rounded-full"></span>
                        Quick Actions
                    </h3>
                </div>
                <div className={`grid grid-cols-2 ${isAdmin ? 'md:grid-cols-4' : 'md:grid-cols-2'} gap-5`}>
                    <QuickActionCard label="Add Student" icon={UserPlusIcon} color="bg-blue-500" onClick={() => setIsAddStudentOpen(true)} />
                    {isAdmin && <QuickActionCard label="Add Staff" icon={BriefcaseIcon} color="bg-purple-500" onClick={() => setIsAddStaffOpen(true)} />}
                    <QuickActionCard label="Collect Fees" icon={RupeeIcon} color="bg-emerald-500" onClick={() => setIsSearchOpen(true)} />
                    {isAdmin && <QuickActionCard label="Add Expense" icon={RupeeBillIcon} color="bg-red-500" onClick={() => setIsAddExpenseOpen(true)} />}
                </div>
            </section>

             <section className="pb-8 px-6 md:px-8">
                <div className="flex items-center justify-between px-2 mb-6">
                     <h3 className="text-xl font-black text-slate-900 dark:text-zinc-100 flex items-center gap-3">
                        <span className="w-1.5 h-7 bg-rose-500 dark:bg-zinc-700 rounded-full"></span>
                        Upcoming Events
                    </h3>
                    {(isAdmin || isManagement) && (
                        <button 
                            onClick={() => setIsAddEventOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 text-[#197fe6] dark:text-zinc-300 rounded-xl font-bold text-xs shadow-sm hover:shadow-md transition-all active:scale-95 border border-slate-100 dark:border-zinc-800"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span>Add Event</span>
                        </button>
                    )}
                </div>
                {loading ? (
                     <div className="flex justify-center py-20"><LoaderIcon className="w-8 h-8 animate-spin text-slate-300 dark:text-zinc-800" /></div>
                ) : upcomingEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {upcomingEvents.map(event => (
                            <EventItem 
                                key={event.id} 
                                event={event} 
                                showAudienceBadge={isAdmin} 
                                isAdmin={isAdmin}
                                onEdit={setEventToEdit}
                                onDelete={setEventToDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-[3rem] border-2 border-slate-100 dark:border-zinc-800 border-dashed flex flex-col items-center justify-center space-y-4">
                        <PlusIcon className="w-8 h-8 text-slate-200 dark:text-zinc-800" />
                        <p className="text-slate-400 dark:text-zinc-600 text-sm font-bold tracking-widest uppercase">No upcoming events.</p>
                    </div>
                )}
            </section>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#f2f6fc] dark:bg-black overflow-hidden font-sans transition-colors duration-200">
      <aside className="hidden md:flex w-[280px] flex-col bg-white dark:bg-zinc-950 m-4 rounded-[3rem] shadow-soft z-50 shrink-0 overflow-hidden border border-white/50 dark:border-zinc-800">
         <div className="p-8 pb-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-white shadow-sm overflow-hidden p-1 border dark:border-zinc-800">
                <WisdomLogo className="w-full h-full" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-zinc-100 tracking-tight leading-none">Wisdom</h1>
                <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">{isManagement ? 'Management' : 'Admin'}</p>
              </div>
            </div>
         </div>
         <nav className="flex-1 px-4 space-y-2 py-6 overflow-y-auto scrollbar-hide">
            <NavItem icon={LayoutDashboardIcon} label="Dashboard" view="dashboard" />
            <NavItem icon={UsersIcon} label="Students" view="students" />
            <NavItem icon={BriefcaseIcon} label="Staff Directory" view="employees" />
            <NavItem icon={RupeeIcon} label="Fees" view="fees" />
            <NavItem icon={RupeeBillIcon} label="Expenses" view="expenses" />
         </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-[#f2f6fc] dark:bg-black relative transition-colors duration-200">
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="w-full h-full">
              {renderContent()}
            </div>
          </div>

          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t dark:border-zinc-800 px-4 py-3 pb-8 z-50 flex justify-between items-center h-[96px]">
              <NavItem icon={LayoutDashboardIcon} label="Home" view="dashboard" isMobile />
              <NavItem icon={UsersIcon} label="Students" view="students" isMobile />
              <NavItem icon={BriefcaseIcon} label="Staff" view="employees" isMobile />
              <NavItem icon={RupeeIcon} label="Fees" view="fees" isMobile />
              <NavItem icon={RupeeBillIcon} label="Expenses" view="expenses" isMobile />
          </div>
      </div>

      <AddStudentModal isOpen={isAddStudentOpen} onClose={() => setIsAddStudentOpen(false)} onSuccess={fetchDashboardData} />
      <EmployeeModal isOpen={isAddStaffOpen} onClose={() => setIsAddStaffOpen(false)} onSuccess={fetchDashboardData} />
      
      <AddEventModal isOpen={isAddEventOpen} onClose={() => setIsAddEventOpen(false)} onSuccess={fetchDashboardData} />
      {eventToEdit && (
          <EditEventModal 
            isOpen={!!eventToEdit} 
            onClose={() => setEventToEdit(null)} 
            onSuccess={fetchDashboardData} 
            event={eventToEdit} 
          />
      )}

      <ConfirmationModal 
        isOpen={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={handleDeleteEvent}
        title="Delete Event"
        message={`Are you sure you want to delete "${eventToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Event"
        isLoading={isDeleting}
      />

      <AddExpenseModal isOpen={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} onSuccess={fetchDashboardData} user={user} />
      <StudentSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSelect={(student) => { setSelectedStudentForFees(student); setIsSearchOpen(false); setIsCollectFeesOpen(true); }} />
      {selectedStudentForFees && <CollectFeesModal isOpen={isCollectFeesOpen} onClose={() => { setIsCollectFeesOpen(false); setSelectedStudentForFees(null); fetchDashboardData(); }} student={selectedStudentForFees} />}
      {user && <UserProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} currentUser={user} onLogout={onLogout} isDarkMode={isDarkMode} onToggleTheme={onToggleTheme} />}
    </div>
  );
};