
import React, { useState, useEffect, useMemo } from 'react';
import { User, AttendanceStats, ExamResult, CalendarEvent, ScheduleEntry } from '../types';
import { sheetApi } from '../services/SheetApi';
import { 
  WisdomLogo, 
  CalendarIcon, 
  CheckCircleIcon, 
  ScrollTextIcon, 
  LayoutDashboardIcon,
  ClockIcon,
  BellIcon,
  AwardIcon,
  SunIcon,
  MoonIcon,
  XIcon,
  PencilIcon,
  SchoolIcon,
  ChevronRightIcon,
  UserIcon,
  LoaderIcon
} from '../components/Icons';
import { UserProfileModal } from '../components/UserProfileModal';
import { StudentHomeworkView } from './StudentHomeworkView';
import { StudentResultsView } from './StudentResultsView';
import { StudentScheduleView } from './StudentScheduleView';

interface StudentDashboardViewProps {
  user: User | null;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

type StudentView = 'dashboard' | 'homework' | 'results' | 'schedule';

const EventItem: React.FC<{ event: CalendarEvent }> = ({ event }) => (
    <div className="flex items-center gap-4 p-5 bg-white dark:bg-zinc-900 rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group cursor-default">
        <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 font-bold leading-none 
            ${event.type === 'sports' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400' : 
              event.type === 'academic' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'}`}>
            <span className="text-[10px] uppercase opacity-70 mb-0.5">{event.date.split(' ')[0].substring(0,3)}</span>
            <span className="text-lg tracking-tighter">{event.date.split(' ')[1]?.replace(',','')}</span>
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{event.title}</h4>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-1">{event.type} Event</p>
        </div>
    </div>
);

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({ user, onLogout, isDarkMode, onToggleTheme }) => {
  const [currentView, setCurrentView] = useState<StudentView>('dashboard');
  const [attendance, setAttendance] = useState<AttendanceStats | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const id = user.admissionNo || user.username; 
        const [attRes, eveRes, schRes] = await Promise.all([
          sheetApi.getStudentAttendance(id),
          sheetApi.getEvents(),
          user.assignedClass && user.assignedSection 
            ? sheetApi.getClassSchedule(user.assignedClass, user.assignedSection)
            : Promise.resolve({ success: false, data: [] })
        ]);

        if (attRes.success && attRes.data) setAttendance(attRes.data);
        if (eveRes.success && eveRes.data) setEvents(eveRes.data);
        if (schRes.success && schRes.data) setSchedule(schRes.data);
      } catch (error) {
        console.error("Failed to load student dashboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, currentView]);

  const todayStatus = useMemo(() => {
    if (!attendance || !attendance.recentHistory) return 'Pending';
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const record = attendance.recentHistory.find(h => h.date === todayStr);
    return record ? record.status : 'Pending';
  }, [attendance]);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return events.filter(e => {
        if (e.type === 'holiday') return false;
        if (e.audience && e.audience === 'staff') return false;
        const eventDate = new Date(e.date);
        return !isNaN(eventDate.getTime()) && eventDate >= today;
    }).slice(0, 3);
  }, [events]);

  const sortedSchedule = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];
    return schedule.filter(s => s.day === currentDay).sort((a,b) => a.timeSlot.localeCompare(b.timeSlot));
  }, [schedule]);

  const handleSetCurrentView = (view: StudentView) => {
    setCurrentView(view);
  };

  const NavItem = ({ icon: Icon, label, view, isMobile = false }: { icon: any, label: string, view: StudentView, isMobile?: boolean }) => {
    const isActive = currentView === view;
    
    if (isMobile) {
        return (
          <button 
            onClick={() => handleSetCurrentView(view)} 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-[#197fe6]' : 'text-slate-400 dark:text-slate-500'}`}
          >
              <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[9px] font-bold">{label}</span>
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
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const renderContent = () => {
    switch (currentView) {
      case 'homework':
        return <StudentHomeworkView currentUser={user!} onBack={() => handleSetCurrentView('dashboard')} />;
      case 'results':
        return <StudentResultsView currentUser={user!} onBack={() => handleSetCurrentView('dashboard')} />;
      case 'schedule':
        return <StudentScheduleView currentUser={user!} onBack={() => handleSetCurrentView('dashboard')} />;
      default:
        return (
          <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 ease-out pb-32 w-full">
            
            <div className="lg:hidden flex items-center justify-between px-6 pt-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center text-white shadow-sm overflow-hidden p-1 border dark:border-zinc-800">
                        <WisdomLogo className="w-full h-full" />
                    </div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white leading-none">Wisdom Portal</h1>
                </div>
                <button onClick={() => setShowProfileModal(true)} className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-full shadow-sm border border-slate-100 dark:border-zinc-800 overflow-hidden transition-transform active:scale-95">
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
                                  <span className="text-xs font-bold text-blue-50 tracking-wide uppercase">{todayStr}</span>
                              </div>
                              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-none">Welcome, {user?.name?.split(' ')[0]}!</h2>
                              <div className="flex items-center gap-2 text-blue-50 font-bold text-xl mt-6 bg-white/15 px-4 py-2 rounded-2xl w-fit">
                                  <SchoolIcon className="w-5 h-5" />
                                  <span>Class {user?.assignedClass}-{user?.assignedSection}</span>
                              </div>
                          </div>

                          <div className="flex gap-4 w-full md:w-auto">
                              <div className="flex-1 md:min-w-[140px] bg-white/15 backdrop-blur-md border border-white/20 p-5 rounded-3xl flex flex-col items-start gap-2 hover:bg-white/20 transition-all active:scale-[0.98]">
                                  <p className="text-2xl font-black leading-none mb-1">{loading ? '...' : (attendance?.percentage || 0) + '%'}</p>
                                  <p className="text-[9px] font-black text-blue-100 uppercase tracking-widest opacity-70">Presence</p>
                              </div>
                              <div className="flex-1 md:min-w-[140px] bg-white/15 backdrop-blur-md border border-white/20 p-5 rounded-3xl flex flex-col items-start gap-2 hover:bg-white/20 transition-all active:scale-[0.98]">
                                  <p className="text-2xl font-black leading-none mb-1 truncate max-w-[100px]">{loading ? '...' : todayStatus}</p>
                                  <p className="text-[9px] font-black text-blue-100 uppercase tracking-widest opacity-70">Status Today</p>
                              </div>
                          </div>
                      </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-6 md:px-8 mt-4">
              <div className="lg:col-span-7 space-y-8">
                  <section>
                      <div className="flex items-center justify-between px-2 mb-6">
                           <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                              <span className="w-1.5 h-7 bg-indigo-500 rounded-full"></span>
                              Current Schedule
                          </h3>
                          <button onClick={() => handleSetCurrentView('schedule')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Full Week</button>
                      </div>
                      <div className="space-y-3">
                          {loading ? (
                              <div className="flex justify-center py-10"><LoaderIcon className="w-8 h-8 animate-spin text-indigo-500/50" /></div>
                          ) : sortedSchedule.length > 0 ? (
                              sortedSchedule.map(entry => (
                                  <div key={entry.id} className="bg-white dark:bg-zinc-900 p-5 rounded-[2rem] border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center justify-between gap-4 transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-500">
                                      <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-slate-50 dark:bg-zinc-800 text-slate-400">
                                              <ClockIcon className="w-6 h-6" />
                                          </div>
                                          <div className="flex flex-col">
                                              <h4 className="font-bold text-slate-900 dark:text-white text-base truncate">{entry.subject}</h4>
                                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entry.timeSlot}</p>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{entry.teacherName || 'Faculty'}</p>
                                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Assigned</p>
                                      </div>
                                  </div>
                              ))
                          ) : (
                              <div className="p-16 text-center bg-white dark:bg-zinc-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-zinc-800 animate-in fade-in duration-700">
                                  <ClockIcon className="w-12 h-12 text-slate-200 dark:text-zinc-800 mx-auto mb-4" />
                                  <p className="text-slate-400 dark:text-zinc-600 font-bold uppercase tracking-widest text-[10px]">Rest Day / No Classes</p>
                              </div>
                          )}
                      </div>
                  </section>
              </div>

              <div className="lg:col-span-5 space-y-8">
                  <section>
                      <div className="flex items-center justify-between px-2 mb-6">
                           <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                              <span className="w-1.5 h-7 bg-rose-500 rounded-full"></span>
                              Events & Notices
                          </h3>
                      </div>
                      <div className="space-y-4">
                          {loading ? (
                             <div className="flex justify-center py-10"><LoaderIcon className="w-8 h-8 animate-spin text-rose-500/50" /></div>
                          ) : upcomingEvents.length > 0 ? (
                              upcomingEvents.map(event => <EventItem key={event.id} event={event} />)
                          ) : (
                              <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-[3rem] border border-slate-100 dark:border-zinc-800 flex flex-col items-center animate-in fade-in duration-700">
                                  <BellIcon className="w-10 h-10 text-slate-200 dark:text-zinc-800 mb-3" />
                                  <p className="text-slate-400 dark:text-zinc-600 text-[10px] font-bold uppercase tracking-widest">No New Notices</p>
                              </div>
                          )}
                      </div>
                  </section>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#f2f6fc] dark:bg-black overflow-hidden transition-colors duration-200">
      <aside className="hidden lg:flex w-[280px] flex-col bg-white dark:bg-zinc-950 m-4 rounded-[3rem] shadow-soft z-50 shrink-0 overflow-hidden border border-white/50 dark:border-zinc-800">
         <div className="p-8 pb-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-white shadow-sm overflow-hidden border dark:border-zinc-800 p-1">
                <WisdomLogo className="w-full h-full" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Wisdom</h1>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Student Portal</p>
              </div>
            </div>
         </div>
         <nav className="flex-1 px-4 space-y-2 py-6">
            <NavItem icon={LayoutDashboardIcon} label="Dashboard" view="dashboard" />
            <NavItem icon={ClockIcon} label="Schedule" view="schedule" />
            <NavItem icon={PencilIcon} label="Homework" view="homework" />
            <NavItem icon={ScrollTextIcon} label="Report Card" view="results" />
         </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-[#f2f6fc] dark:bg-black relative transition-colors duration-200">
        <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="w-full h-full">
                {renderContent()}
            </div>
        </div>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[96px] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t dark:border-zinc-800 flex items-center justify-around px-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-[2.5rem] pb-8 transition-colors duration-200">
             <NavItem icon={LayoutDashboardIcon} label="Home" view="dashboard" isMobile />
             <NavItem icon={ClockIcon} label="Schedule" view="schedule" isMobile />
             <NavItem icon={PencilIcon} label="Work" view="homework" isMobile />
             <NavItem icon={ScrollTextIcon} label="Report" view="results" isMobile />
        </nav>
      </div>

      {user && (
        <UserProfileModal 
            isOpen={showProfileModal} 
            onClose={() => setShowProfileModal(false)}
            currentUser={user}
            onLogout={onLogout}
            isDarkMode={isDarkMode}
            onToggleTheme={onToggleTheme}
        />
      )}
    </div>
  );
};
