import { useTranslation } from 'react-i18next';
import { Avatar, Icon } from '@cp/ui';
import { IAchievement } from '@cp/shared';
import { useAuthStore } from '../../stores/auth.store';
import { useStudentDashboard } from '../../api/student.queries';

export default function StudentDashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const name = user?.firstName ?? 'Explorer';

  const { data: dashboard, isLoading, error } = useStudentDashboard();

  if (error) {
    return (
      <div className="min-h-screen text-red-400 p-8 flex items-center justify-center font-mono">
        Error loading dashboard: {error instanceof Error ? error.message : String(error)}
        <br />
        {(error as any)?.response?.data?.message || JSON.stringify((error as any)?.response?.data)}
      </div>
    );
  }

  if (isLoading || !dashboard) {
    return (
      <div className="min-h-screen text-gray-200 p-4 md:p-8 font-sans flex items-center justify-center" style={{ backgroundColor: '#0f0f13' }}>
        <Icon name="sync" className="animate-spin text-emerald-400" size={48} />
      </div>
    );
  }

  const {
    level,
    xp,
    xpForNext,
    streak,
    gems,
    dailyQuestsCompleted,
    dailyQuestsTarget,
    activeQuests,
    enrolledCourses,
    achievements,
    leaderboard,
  } = dashboard;

  const xpPct = Math.round((xp / xpForNext) * 100);

  return (
    <div className="min-h-screen text-gray-200 p-4 md:p-8 font-sans" style={{ backgroundColor: '#0f0f13' }}>
      
      {/* ── Header Section ── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-5">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative">
              <Avatar size="lg" src={user?.avatarUrl} initials={name[0]} className="border-2 border-[#1a1a24]" />
            </div>
            <div className="absolute bottom-0 right-0 bg-emerald-500 w-4 h-4 rounded-full border-2 border-[#0f0f13]"></div>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-1">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{name}</span>!
            </h1>
            <p className="text-gray-400 text-sm md:text-base font-medium">Your journey to mastery continues today. Keep up the great work! 🚀</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
            <Icon name="notifications" size={18} className="text-gray-300" />
            <span>Alerts</span>
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 rounded-xl text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)]">
            <Icon name="play_arrow" size={18} />
            <span>Resume Quest</span>
          </button>
        </div>
      </header>

      {/* ── Top Stats Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* XP & Level Card */}
        <div className="relative overflow-hidden rounded-2xl p-5 bg-[#16161e] border border-white/5 shadow-xl group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Current Level</p>
              <h3 className="text-2xl font-black text-white">{level} <span className="text-sm font-medium text-emerald-400 ml-1">Star Scholar</span></h3>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Icon name="trending_up" size={24} />
            </div>
          </div>
          <div className="relative z-10">
            <div className="flex justify-between text-xs font-semibold mb-1.5 text-gray-400">
              <span>{xp} XP</span>
              <span>{xpForNext} XP</span>
            </div>
            <div className="h-2 w-full bg-[#0a0a0f] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full relative"
                style={{ width: `${xpPct}%` }}
              >
                <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Streak Card */}
        <div className="relative overflow-hidden rounded-2xl p-5 bg-[#16161e] border border-white/5 shadow-xl group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-colors"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Active Streak</p>
              <h3 className="text-3xl font-black text-white flex items-baseline gap-1">{streak} <span className="text-sm font-medium text-gray-400">Days</span></h3>
              <p className="text-xs text-orange-400 font-semibold mt-1 flex items-center gap-1"><Icon name="local_fire_department" size={14}/> On fire!</p>
            </div>
            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
              <Icon name="calendar_month" size={24} />
            </div>
          </div>
        </div>

        {/* Gems Card */}
        <div className="relative overflow-hidden rounded-2xl p-5 bg-[#16161e] border border-white/5 shadow-xl group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-fuchsia-500/10 rounded-full blur-2xl group-hover:bg-fuchsia-500/20 transition-colors"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Gems Earned</p>
              <h3 className="text-3xl font-black text-white flex items-baseline gap-1">{gems.toLocaleString()}</h3>
              <p className="text-xs text-fuchsia-400 font-semibold mt-1">Top 5% this week</p>
            </div>
            <div className="p-2 bg-fuchsia-500/10 rounded-lg text-fuchsia-400">
              <Icon name="diamond" size={24} />
            </div>
          </div>
        </div>

        {/* Daily Goal Card */}
        <div className="relative overflow-hidden rounded-2xl p-5 bg-[#16161e] border border-white/5 shadow-xl group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Daily Quests</p>
              <h3 className="text-2xl font-black text-white">{dailyQuestsCompleted} / {dailyQuestsTarget}</h3>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Icon name="flag" size={24} />
            </div>
          </div>
          <div className="flex gap-2 relative z-10">
            {Array.from({ length: dailyQuestsTarget }).map((_, i) => (
              <div key={i} className={`flex-1 h-2 rounded-full ${i < dailyQuestsCompleted ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-[#0a0a0f]'}`}></div>
            ))}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* ── Main Content Area ── */}
        <div className="flex flex-col gap-8 xl:col-span-2">
          
          {/* Active Quests Section */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Icon name="explore" className="text-emerald-400" /> Current Quests
              </h2>
              <button className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">View All</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {activeQuests.map((q) => (
                <div key={q.id} className={`relative group rounded-2xl bg-[#16161e] border border-white/5 p-5 hover:border-${q.colorPrefix}-500/50 transition-all duration-300 shadow-lg hover:shadow-[0_8px_30px_-12px_rgba(16,185,129,0.3)] cursor-pointer`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${q.colorPrefix}-400/20 to-cyan-500/20 border border-${q.colorPrefix}-500/20 flex items-center justify-center text-${q.colorPrefix}-400 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon name={q.icon} size={24} />
                      </div>
                      <div>
                        <h3 className={`font-bold text-white mt-1 group-hover:text-${q.colorPrefix}-400 transition-colors`}>{q.title}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mb-2 font-medium">
                    <span className="flex items-center gap-1"><Icon name="schedule" size={14}/> {q.duration}</span>
                    <span>{q.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0a0a0f] rounded-full overflow-hidden">
                    <div className={`h-full bg-${q.colorPrefix}-500 rounded-full`} style={{ width: `${q.progress}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Enrolled Courses */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Icon name="menu_book" className="text-cyan-400" /> Enrolled Courses
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {enrolledCourses.map((c) => (
                <div key={c.id} className="group rounded-2xl bg-[#16161e] border border-white/5 overflow-hidden hover:-translate-y-1 transition-all duration-300 hover:shadow-xl cursor-pointer">
                  <div className={`h-24 bg-gradient-to-r ${c.colorGradient} p-4 flex items-end justify-end relative overflow-hidden`}>
                    <Icon name={c.icon} size={64} className="text-white/20 absolute -bottom-4 -left-4 transform -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-white mb-4 line-clamp-1 group-hover:text-cyan-400 transition-colors">{c.title}</h3>
                    <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
                      <span>Progress</span>
                      <span>{c.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0a0a0f] rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${c.progress}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Sidebar Area ── */}
        <aside className="flex flex-col gap-6 xl:col-span-1">
          
          {/* Recent Achievements */}
          <div className="rounded-2xl p-6 bg-[#16161e] border border-white/5 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Icon name="emoji_events" className="text-amber-400" /> Achievements
              </h3>
              <span className="text-xs font-semibold text-gray-400">See All</span>
            </div>
            
            <div className="flex flex-col gap-4">
              {achievements.map((a) => (
                <div key={a.id} className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${a.unlocked ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-transparent border-dashed border-white/5 opacity-50 grayscale'}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${a.unlocked ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : 'bg-gray-800 text-gray-500'}`}>
                    <Icon name={a.icon} size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{a.label}</h4>
                    <p className="text-[11px] text-gray-400 font-medium leading-snug mt-0.5">{a.caption}</p>
                  </div>
                  {a.unlocked && <Icon name="check_circle" size={16} className="text-emerald-400 ml-auto" />}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Leaderboard */}
          <div className="rounded-2xl p-6 bg-gradient-to-br from-[#1c1c2a] to-[#12121b] border border-white/5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
            <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2 relative z-10">
              <Icon name="leaderboard" className="text-amber-400" /> Top Scholars
            </h3>
            <div className="flex flex-col gap-3 relative z-10">
              {leaderboard.map((u) => (
                <div key={u.rank} className={`flex items-center gap-3 p-3 rounded-xl ${u.isMe ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/5 border border-transparent'}`}>
                  <div className={`w-6 text-center font-black ${u.rank === 1 ? 'text-amber-400' : u.rank === 2 ? 'text-gray-300' : 'text-orange-400'}`}>#{u.rank}</div>
                  <Avatar size="sm" initials={u.avatarInitial} className={u.isMe ? 'border-emerald-500 border' : ''} />
                  <div className="flex-1">
                    <div className={`text-sm font-bold ${u.isMe ? 'text-emerald-400' : 'text-white'}`}>{u.name} {u.isMe && '(You)'}</div>
                  </div>
                  <div className="text-xs font-black text-gray-300">{u.points}</div>
                </div>
              ))}
            </div>
          </div>

        </aside>

      </div>
    </div>
  );
}
