import React, { useState, useEffect, useMemo } from 'react';
import { User, CalendarEvent } from '../types';
import { sheetApi } from '../services/SheetApi';
import { 
  LayoutDashboardIcon, 
  LoaderIcon,
  PlusIcon,
  WisdomLogo,
  UserIcon,
  ClipboardListIcon,
  CheckSquareIcon,
  CalendarIcon,
  ClockIcon,
  XIcon,
  PencilIcon,
  SchoolIcon
} from '../components/Icons';
import { TeacherAttendanceView } from './TeacherAttendanceView';
import { TeacherGradesView } from './TeacherGradesView';
import { TeacherScheduleView } from './TeacherScheduleView';
import { TeacherHomeworkView } from './TeacherHomeworkView';
import { UserProfileModal } from '../components/UserProfileModal';

interface TeacherDashboardViewProps {
  user: User | null;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

interface ScheduleEntry {
  id: string;
  day: string;
  timeSlot: string;
  subject: string;
  className: string;
}

type TeacherView = 'dashboard' | 'grades' | 'attendance' | 'schedule' | 'homework';

const EventItem: React.FC<{ event: CalendarEvent }> = ({ event }) => (
    <div className="flex items-center gap-4 p-5 bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group cursor-default">
        <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 font-bold leading-none transition-colors 
            ${event.type === 'sports' ? 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400' : 
              event.type === 'academic' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400' : 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400'}`}>
            <span className="text-[10px] uppercase opacity-70">{event.date.split(' ')[0].substring(0,3)}</span>
            <span className="text-lg tracking-tighter">{event.date.split(' ')[1]?.replace(',','')}</span>
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{event.title}</h4>
            <div className="flex items-center gap-2 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${event.type === 'sports' ? 'bg-orange-500' : event.type === 'academic' ? 'bg-blue-500' : 'bg-purple-500'}`}></span>
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium capitalize">{event.type} Event</span>
            </div>
        </div>
    </div>
);

const ScheduleItem: React.FC<{ entry: ScheduleEntry }> = ({ entry }) => (
    <div className="flex items-center gap-4 p-5 bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group cursor-default">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center shrink-0">
            <ClockIcon className="w-6 h-6 text-orange-500" />
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{entry.subject}</h4>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{entry.timeSlot}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-700"></span>
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest text-[9px]">Class {entry.className}</span>
            </div>
        </div>
    </div>
);

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({ user, onLogout, isDarkMode, onToggleTheme }) => {
  const [currentView, setCurrentView] = useState<TeacherView>('dashboard');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const [eventsRes, attendanceRes] = await Promise.all([
        sheetApi.getEvents(),
        user?.assignedClass && user?.assignedSection 
          ? sheetApi.getAttendanceData({
              class: user.assignedClass,
              section: user.assignedSection,
              date: dateStr,
              role: user.role,
              assignedClass: user.assignedClass,
              assignedSection: user.assignedSection
            })
          : Promise.resolve({ success: false, data: null })
      ]);

      if (eventsRes.success && eventsRes.data) setEvents(eventsRes.data);
      
      if (attendanceRes.success && attendanceRes.data) {
          const studs = attendanceRes.data.students || [];
          const p = studs.filter((s: any) => s.status === 'Present').length;
          const a = studs.filter((s: any) => s.status === 'Absent').length;
          setAttendanceStats({ present: p, absent: a, total: studs.length });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    if (!user?.employeeId) return;
    setLoadingSchedule(true);
    try {
      const res = await sheetApi.getTeacherSchedule(user.employeeId);
      if (res.success && res.data) {
        setSchedule(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchDashboardData();
      fetchSchedule();
    }
  }, [user, currentView]);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return events.filter(e => {
        if (e.type === 'holiday') return false;
        if (e.audience && e.audience === 'students') return false;
        const eventDate = new Date(e.date);
        return !isNaN(eventDate.getTime()) && eventDate >= today;
    }).slice(0, 4);
  }, [events]);

  const handleSetCurrentView = (view: TeacherView) => {
    setCurrentView(view);
  };

  const NavItem = ({ icon: Icon, label, view, isMobile = false }: { icon: any, label: string, view: TeacherView, isMobile?: boolean }) => {
    const isActive = currentView === view;
    
    if (isMobile) {
        return (
          <button 
            onClick={() => handleSetCurrentView(view)} 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-[#197fe6]' : 'text-slate-400 dark:text-slate-500'}`}
          >
              <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] font-bold">{label}</span>
              <div className={`w-1 h-1 rounded-full bg-[#197fe6] transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>
          </button>
        );
    }
    return (
      <button 
        onClick={() => handleSetCurrentView(view)} 
        className={`flex items-center gap-4 px-6 py-4 rounded-[2rem] transition-all w-full text-left relative overflow-hidden group ${isActive ? 'bg-[#197fe6] text-white shadow-glow' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
      >
          <Icon className={`w-5 h-5 relative z-10 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
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
  const todayClasses = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];
    return schedule.filter(item => item.day === currentDay).sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  }, [schedule]);

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const renderContent = () => {
    switch (currentView) {
      case 'attendance':
        return <TeacherAttendanceView currentUser={user} onBack={() => handleSetCurrentView('dashboard')} />;
      case 'grades':
        return <TeacherGradesView currentUser={user} onBack={() => handleSetCurrentView('dashboard')} />;
      case 'schedule':
        return <TeacherScheduleView currentUser={user} onBack={() => handleSetCurrentView('dashboard')} />;
      case 'homework':
        return <TeacherHomeworkView currentUser={user} onBack={() => handleSetCurrentView('dashboard')} />;
      default:
        return (
          <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 ease-out pb-32 w-full">
            
            <div className="md:hidden flex items-center justify-between px-6 pt-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center text-white shadow-sm overflow-hidden p-1 border dark:border-zinc-800">
                        <WisdomLogo className="w-full h-full" />
                    </div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white leading-none">Wisdom Portal</h1>
                </div>
                <button 
                    onClick={() => setShowUserModal(true)}
                    className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center shadow-sm border border-slate-100 dark:border-zinc-800 active:scale-95 transition-transform overflow-hidden"
                >
                    <img src={photoSrc} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
            </div>

            <div className="px-6 md:px-8 mt-2">
                <div className="relative w-full bg-gradient-to-br from-[#197fe6] to-[#4facfe] dark:from-zinc-900 dark:to-zinc-950 dark:border dark:border-zinc-800 rounded-[3rem] p-8 text-white shadow-glow overflow-hidden group">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 w-fit">
                                <CalendarIcon className="w-3.5 h-3.5 text-blue-100" />
                                <span className="text-[10px] font-black text-blue-50 tracking-widest uppercase">{todayStr}</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-none">Hello, {user?.name?.split(' ')[0]}</h2>
                            <p className="text-blue-100 font-medium text-lg mt-2 opacity-90">
                                Have a productive day at Wisdom Heritage.
                            </p>
                            <div className="flex items-center gap-2 mt-6 text-[10px] font-black text-blue-50 uppercase tracking-[0.2em] bg-white/15 px-3 py-1.5 rounded-xl w-fit">
                                <SchoolIcon className="w-3.5 h-3.5" />
                                <span>Class {user?.assignedClass}-{user?.assignedSection}</span>
                            </div>
                        </div>

                        <div className="flex gap-4 w-full md:w-auto">
                            <div className="flex-1 md:min-w-[130px] bg-white/15 backdrop-blur-md border border-white/20 p-5 rounded-3xl flex flex-col items-start gap-1 hover:bg-white/20 transition-all active:scale-[0.98]">
                                <p className="text-2xl font-black leading-none mb-1 text-white">{loading ? '-' : attendanceStats.present}</p>
                                <p className="text-[9px] font-black text-blue-100 uppercase tracking-widest opacity-70">Present Today</p>
                            </div>
                            <div className="flex-1 md:min-w-[130px] bg-white/15 backdrop-blur-md border border-white/20 p-5 rounded-3xl flex flex-col items-start gap-1 hover:bg-white/20 transition-all active:scale-[0.98]">
                                <p className="text-2xl font-black leading-none mb-1 text-white">{loading ? '-' : attendanceStats.absent}</p>
                                <p className="text-[9px] font-black text-blue-100 uppercase tracking-widest opacity-70">Absent Today</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

             <section className="px-6 md:px-8 mt-4">
                <div className="flex items-center justify-between px-2 mb-6">
                     <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="w-1.5 h-7 bg-orange-500 rounded-full"></span>
                        Today's Sessions
                    </h3>
                    <button onClick={() => handleSetCurrentView('schedule')} className="text-xs font-black text-[#197fe6] hover:underline uppercase tracking-widest">
                        Full Timetable
                    </button>
                </div>
                
                {loadingSchedule ? (
                     <div className="flex justify-center py-20"><LoaderIcon className="w-8 h-8 animate-spin text-slate-300 dark:text-zinc-800" /></div>
                ) : todayClasses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {todayClasses.map(entry => <ScheduleItem key={entry.id} entry={entry} />)}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-[3rem] border-2 border-slate-100 dark:border-zinc-800 border-dashed flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-slate-300 dark:text-zinc-700">
                            <ClockIcon className="w-8 h-8" />
                        </div>
                        <p className="text-slate-400 dark:text-zinc-500 text-sm font-bold tracking-widest uppercase">No classes for today.</p>
                    </div>
                )}
            </section>

             <section className="pb-8 px-6 md:px-8">
                <div className="flex items-center justify-between px-2 mb-6">
                     <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="w-1.5 h-7 bg-rose-500 rounded-full"></span>
                        Upcoming Events
                    </h3>
                </div>
                
                {loading ? (
                     <div className="flex justify-center py-20"><LoaderIcon className="w-8 h-8 animate-spin text-slate-300 dark:text-zinc-800" /></div>
                ) : upcomingEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {upcomingEvents.map(event => <EventItem key={event.id} event={event} />)}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-100 dark:border-zinc-800">
                        <p className="text-slate-400 dark:text-zinc-500 text-sm font-bold tracking-widest uppercase">No Upcoming Events</p>
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
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-white shadow-sm overflow-hidden p-1 border dark:border-zinc-800">
                <WisdomLogo className="w-full h-full" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Wisdom</h1>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Teacher Panel</p>
              </div>
            </div>
         </div>
         <nav className="flex-1 px-4 space-y-2 py-6 overflow-y-auto scrollbar-hide">
            <NavItem icon={LayoutDashboardIcon} label="Dashboard" view="dashboard" />
            <NavItem icon={PencilIcon} label="Homework" view="homework" />
            <NavItem icon={ClipboardListIcon} label="Grades" view="grades" />
            <NavItem icon={CheckSquareIcon} label="Attendance" view="attendance" />
            <NavItem icon={CalendarIcon} label="Schedule" view="schedule" />
         </nav>
         
         <div className="p-4 border-t border-slate-50 dark:border-zinc-800">
            <button 
              onClick={() => setShowUserModal(true)}
              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all w-full text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden shrink-0 border-2 border-white dark:border-zinc-700 shadow-sm transition-transform group-hover:scale-110">
                 <img src={photoSrc} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="min-w-0">
                 <p className="text-sm font-black text-slate-900 dark:text-white truncate transition-colors group-hover:text-[#197fe6]">{user?.name}</p>
                 <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Profile Settings</p>
              </div>
            </button>
         </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-[#f2f6fc] dark:bg-black relative transition-colors duration-200">
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="w-full h-full">
              {renderContent()}
            </div>
          </div>

          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t dark:border-zinc-800 px-4 py-3 pb-8 z-50 flex justify-between items-center h-[96px]">
              <NavItem icon={LayoutDashboardIcon} label="Home" view="dashboard" isMobile />
              <NavItem icon={PencilIcon} label="Homework" view="homework" isMobile />
              <NavItem icon={ClipboardListIcon} label="Grades" view="grades" isMobile />
              <NavItem icon={CheckSquareIcon} label="Attendance" view="attendance" isMobile />
              <NavItem icon={CalendarIcon} label="Schedule" view="schedule" isMobile />
          </div>
      </div>

      {user && (
        <UserProfileModal 
            isOpen={showUserModal} 
            onClose={() => setShowUserModal(false)}
            currentUser={user}
            onLogout={onLogout}
            isDarkMode={isDarkMode}
            onToggleTheme={onToggleTheme}
        />
      )}
    </div>
  );
};