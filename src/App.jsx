import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  ChevronRight,
  Dumbbell,
  Trash2,
  Activity,
  CheckCircle2,
  Circle,
  Timer,
  X,
  ArrowLeft,
  Trophy,
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Info,
  PlayCircle,
} from "lucide-react";

// --- UTILS ---
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// --- COMPONENT: EXERCISE LIBRARY (BULK SELECT) ---
function ExerciseLibrary({ onSelectMultiple, onBack }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [queue, setQueue] = useState([]);

  // Debounced API Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim().length > 1) fetchExercises();
      else setResults([]);
    }, 600);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const url = `https://www.exercisedb.dev/api/v1/exercises/search?offset=0&limit=10&q=${encodeURIComponent(
        search
      )}&threshold=0.3`;
      const res = await fetch(url);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleQueue = (ex) => {
    const exists = queue.find(
      (q) => (q.exerciseId || q.id) === (ex.exerciseId || ex.id)
    );
    if (exists)
      setQueue(
        queue.filter((q) => (q.exerciseId || q.id) !== (ex.exerciseId || ex.id))
      );
    else setQueue([...queue, ex]);
  };

  const confirmBulkAdd = () => {
    const formatted = queue.map((ex) => ({
      id: crypto.randomUUID(),
      name: ex.name,
      gifUrl: ex.gifUrl || null,
      instructions: ex.instructions || [],
      restTime: 60,
      sets: [
        {
          id: crypto.randomUUID(),
          weight: "",
          reps: "",
          isCompleted: false,
          previous: { weight: "—", reps: "—" },
        },
      ],
    }));
    onSelectMultiple(formatted);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 flex flex-col animate-in fade-in duration-300">
      <header className="max-w-2xl mx-auto w-full mb-6">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={onBack}
            className="p-3 bg-slate-900 rounded-2xl text-slate-400"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="text-right">
            <h1 className="text-xl font-black uppercase italic tracking-widest leading-none">
              Add Exercises
            </h1>
            <p className="text-[10px] text-emerald-500 font-black mt-1 uppercase tracking-tighter">
              {queue.length} Selected
            </p>
          </div>
        </div>
        <div className="relative">
          <Search
            className={`absolute left-4 top-1/2 -translate-y-1/2 ${
              loading ? "text-emerald-500 animate-spin" : "text-slate-500"
            }`}
            size={20}
          />
          <input
            autoFocus
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-5 pl-12 pr-4 font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
            placeholder="Search API or type custom name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full flex-1 overflow-y-auto space-y-3 pb-32">
        {/* CUSTOM ADD */}
        <button
          onClick={() => {
            const custom = {
              exerciseId: `c-${Date.now()}`,
              name: search || "Custom Exercise",
              instructions: ["Manual"],
            };
            toggleQueue(custom);
            setSearch("");
          }}
          className="w-full bg-emerald-500/5 border-2 border-dashed border-emerald-500/20 rounded-[2rem] p-5 flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
              <Plus size={24} strokeWidth={3} />
            </div>
            <h3 className="font-black text-lg text-white capitalize">
              {search || "Custom Exercise"}
            </h3>
          </div>
          <ChevronRight size={20} className="text-emerald-500" />
        </button>

        <div className="h-px bg-slate-900 my-4" />

        {/* API RESULTS */}
        {results.map((ex) => {
          const isSelected = queue.find((q) => q.exerciseId === ex.exerciseId);
          const isExp = expandedId === ex.exerciseId;
          return (
            <div
              key={ex.exerciseId}
              className={`bg-slate-900 border transition-all duration-300 ${
                isSelected ? "border-emerald-500" : "border-slate-800"
              } ${isExp ? "rounded-[2rem]" : "rounded-3xl"}`}
            >
              <div className="p-3 flex items-center gap-4">
                <button
                  onClick={() => toggleQueue(ex)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {isSelected ? (
                    <CheckCircle2 size={24} />
                  ) : (
                    <Circle size={24} />
                  )}
                </button>
                <div
                  className="flex-1 flex items-center gap-4 cursor-pointer"
                  onClick={() => setExpandedId(isExp ? null : ex.exerciseId)}
                >
                  <div className="w-14 h-14 bg-white rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                    {ex.gifUrl ? (
                      <img
                        src={ex.gifUrl}
                        className="w-full h-full object-contain"
                        alt=""
                      />
                    ) : (
                      <Dumbbell className="text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-sm capitalize text-white leading-tight">
                      {ex.name}
                    </h3>
                    <p className="text-[9px] text-slate-500 font-black uppercase mt-1">
                      {ex.bodyParts?.[0] || "Target"}
                    </p>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-slate-700 transition-transform ${
                      isExp ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
              {isExp && (
                <div className="px-5 pb-6 animate-in slide-in-from-top-2">
                  <div className="h-px bg-slate-800 mb-5" />
                  <img
                    src={ex.gifUrl}
                    className="w-full h-auto rounded-2xl mb-4 bg-white shadow-lg"
                    alt=""
                  />
                  <div className="space-y-2">
                    {ex.instructions?.map((s, i) => (
                      <p
                        key={i}
                        className="text-[11px] text-slate-400 leading-relaxed italic"
                      >
                        {s}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </main>

      {queue.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md animate-in slide-in-from-bottom-10">
          <button
            onClick={confirmBulkAdd}
            className="w-full bg-emerald-500 py-5 rounded-[2.5rem] shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <span className="text-slate-950 font-black tracking-widest uppercase">
              Add {queue.length} Exercises
            </span>
            <ChevronRight size={20} className="text-slate-950" />
          </button>
        </div>
      )}
    </div>
  );
}

// --- COMPONENT: WORKOUT TRACKER ---
function WorkoutTracker({ initialData, onBack, onUpdateRoutines }) {
  const [workout, setWorkout] = useState(initialData);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [expandedExIds, setExpandedExIds] = useState(
    initialData.exercises.length > 0 ? [initialData.exercises[0].id] : []
  );

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isFinished) setSessionTime((p) => p + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished]);

  useEffect(() => {
    let interval = null;
    if (isTimerActive && timeLeft > 0)
      interval = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    else if (timeLeft === 0) setIsTimerActive(false);
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft]);

  const toggleSet = (exId, setId) => {
    let rest = 0;
    const updated = workout.exercises.map((ex) => {
      if (ex.id !== exId) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s) => {
          if (s.id !== setId) return s;
          const complete = !s.isCompleted;
          if (complete) rest = ex.restTime;
          return { ...s, isCompleted: complete };
        }),
      };
    });
    setWorkout({ ...workout, exercises: updated });
    if (rest > 0) {
      setTimeLeft(rest);
      setIsTimerActive(true);
    }
  };

  const finishWorkout = () => {
    const archived = workout.exercises.map((ex) => ({
      ...ex,
      sets: ex.sets.map((s) => ({
        ...s,
        isCompleted: false,
        previous: {
          weight: s.weight || s.previous.weight,
          reps: s.reps || s.previous.reps,
        },
        weight: "",
        reps: "",
      })),
    }));
    onUpdateRoutines({ ...workout, exercises: archived });
    setIsFinished(true);
  };

  if (showLibrary)
    return (
      <ExerciseLibrary
        onBack={() => setShowLibrary(false)}
        onSelectMultiple={(exs) => {
          setWorkout({ ...workout, exercises: [...workout.exercises, ...exs] });
          setExpandedExIds([...expandedExIds, ...exs.map((e) => e.id)]);
          setShowLibrary(false);
        }}
      />
    );

  if (isFinished)
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
        <div className="bg-emerald-500 p-8 rounded-full mb-6 shadow-2xl shadow-emerald-500/20">
          <Trophy size={64} className="text-slate-950" />
        </div>
        <h1 className="text-5xl font-black text-white mb-2 italic tracking-tighter uppercase">
          Finished
        </h1>
        <p className="text-slate-400 font-bold mb-10 tracking-[0.2em] uppercase">
          {formatTime(sessionTime)} Total Time
        </p>
        <button
          onClick={onBack}
          className="bg-emerald-500 text-slate-950 px-16 py-4 rounded-[2rem] font-black tracking-widest uppercase text-xs"
        >
          Return Home
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 pb-32">
      {isTimerActive && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 px-6 py-4 rounded-[2.5rem] flex items-center gap-4 shadow-2xl border border-emerald-400 animate-in slide-in-from-bottom-10">
          <button
            onClick={() => setTimeLeft((p) => Math.max(0, p - 15))}
            className="w-10 h-10 bg-emerald-600 rounded-full font-bold active:scale-90"
          >
            -15
          </button>
          <div className="flex items-center gap-2">
            <Timer size={24} className="animate-pulse" />
            <span className="text-4xl font-black font-mono min-w-[75px] text-center">
              {timeLeft}s
            </span>
          </div>
          <button
            onClick={() => setTimeLeft((p) => p + 15)}
            className="w-10 h-10 bg-emerald-600 rounded-full font-bold active:scale-90"
          >
            +15
          </button>
          <button
            onClick={() => setTimeLeft(0)}
            className="ml-2 bg-emerald-700 p-2 rounded-full active:scale-90"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <header className="max-w-2xl mx-auto mb-8 flex justify-between items-center">
        <button
          onClick={onBack}
          className="p-3 bg-slate-900 rounded-2xl text-slate-400"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-black uppercase tracking-tighter italic leading-none">
            {workout.name}
          </h1>
          <div className="text-emerald-400 font-mono font-bold text-xs uppercase mt-1 tracking-widest">
            {formatTime(sessionTime)}
          </div>
        </div>
        <button
          onClick={finishWorkout}
          className="bg-emerald-500 text-slate-950 px-6 py-2 rounded-xl font-black text-xs tracking-widest active:scale-95 transition-transform uppercase"
        >
          Finish
        </button>
      </header>

      <main className="max-w-2xl mx-auto space-y-4">
        {workout.exercises.map((ex) => {
          const isExp = expandedExIds.includes(ex.id);
          return (
            <div
              key={ex.id}
              className={`bg-slate-900 border transition-all ${
                isExp
                  ? "border-slate-700 rounded-[2.5rem] p-6 shadow-xl"
                  : "border-slate-800 rounded-3xl p-4 shadow-sm"
              }`}
            >
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() =>
                  setExpandedExIds(
                    isExp
                      ? expandedExIds.filter((id) => id !== ex.id)
                      : [...expandedExIds, ex.id]
                  )
                }
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl overflow-hidden flex items-center justify-center border border-slate-700 shadow-inner">
                    {ex.gifUrl ? (
                      <img
                        src={ex.gifUrl}
                        className="w-full h-full object-contain"
                        alt=""
                      />
                    ) : (
                      <Dumbbell className="text-slate-300" size={24} />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white capitalize leading-tight">
                      {ex.name}
                    </h2>
                    {!isExp && (
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">
                        {ex.sets.length} Sets • {ex.restTime}s Rest
                      </p>
                    )}
                  </div>
                </div>
                {isExp ? (
                  <ChevronUp size={24} className="text-slate-600" />
                ) : (
                  <ChevronDown size={24} className="text-slate-600" />
                )}
              </div>

              {isExp && (
                <div className="mt-6 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 font-mono">
                      Rest: {ex.restTime}s
                    </span>
                    <button
                      onClick={() =>
                        setWorkout({
                          ...workout,
                          exercises: workout.exercises.map((e) =>
                            e.id === ex.id
                              ? { ...e, restTime: Math.max(0, e.restTime - 15) }
                              : e
                          ),
                        })
                      }
                      className="w-8 h-8 bg-slate-800 rounded-lg text-slate-400 font-bold active:text-white transition-colors"
                    >
                      -15
                    </button>
                    <button
                      onClick={() =>
                        setWorkout({
                          ...workout,
                          exercises: workout.exercises.map((e) =>
                            e.id === ex.id
                              ? { ...e, restTime: e.restTime + 15 }
                              : e
                          ),
                        })
                      }
                      className="w-8 h-8 bg-slate-800 rounded-lg text-slate-400 font-bold active:text-white transition-colors"
                    >
                      +15
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={() =>
                        setWorkout({
                          ...workout,
                          exercises: workout.exercises.filter(
                            (e) => e.id !== ex.id
                          ),
                        })
                      }
                      className="text-slate-700 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-12 gap-2 px-2 mb-3 text-[10px] font-black text-slate-700 uppercase tracking-widest">
                    <div className="col-span-1 text-center italic">X</div>
                    <div className="col-span-4 text-center">Previous</div>
                    <div className="col-span-3 text-center">Weight</div>
                    <div className="col-span-3 text-center">Reps</div>
                    <div className="col-span-1 text-right italic">Done</div>
                  </div>

                  <div className="space-y-2">
                    {ex.sets.map((s) => (
                      <div
                        key={s.id}
                        className={`grid grid-cols-12 gap-2 items-center p-2 rounded-2xl transition-all ${
                          s.isCompleted
                            ? "bg-emerald-500/10 border-emerald-500/20 shadow-inner"
                            : "bg-slate-800/20"
                        }`}
                      >
                        <button
                          onClick={() =>
                            setWorkout({
                              ...workout,
                              exercises: workout.exercises.map((e) =>
                                e.id === ex.id
                                  ? {
                                      ...e,
                                      sets: e.sets.filter(
                                        (set) => set.id !== s.id
                                      ),
                                    }
                                  : e
                              ),
                            })
                          }
                          className="col-span-1 text-slate-800 hover:text-red-500 flex justify-center"
                        >
                          <X size={14} />
                        </button>
                        <div className="col-span-4 text-center text-[10px] font-bold text-slate-500 bg-slate-950/50 py-2.5 rounded-xl border border-slate-800/50">
                          {s.previous.weight}kg × {s.previous.reps}
                        </div>
                        <input
                          type="number"
                          value={s.weight}
                          placeholder="0"
                          onChange={(e) =>
                            setWorkout({
                              ...workout,
                              exercises: workout.exercises.map((e) =>
                                e.id === ex.id
                                  ? {
                                      ...e,
                                      sets: e.sets.map((set) =>
                                        set.id === s.id
                                          ? { ...set, weight: e.target.value }
                                          : set
                                      ),
                                    }
                                  : e
                              ),
                            })
                          }
                          className="col-span-3 bg-slate-800 text-white rounded-xl py-2.5 text-center font-black outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <input
                          type="number"
                          value={s.reps}
                          placeholder="0"
                          onChange={(e) =>
                            setWorkout({
                              ...workout,
                              exercises: workout.exercises.map((e) =>
                                e.id === ex.id
                                  ? {
                                      ...e,
                                      sets: e.sets.map((set) =>
                                        set.id === s.id
                                          ? { ...set, reps: e.target.value }
                                          : set
                                      ),
                                    }
                                  : e
                              ),
                            })
                          }
                          className="col-span-3 bg-slate-800 text-white rounded-xl py-2.5 text-center font-black outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          className="col-span-1 flex justify-end"
                          onClick={() => toggleSet(ex.id, s.id)}
                        >
                          {s.isCompleted ? (
                            <CheckCircle2
                              size={32}
                              className="text-emerald-400"
                            />
                          ) : (
                            <Circle size={32} className="text-slate-800" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      setWorkout({
                        ...workout,
                        exercises: workout.exercises.map((e) =>
                          e.id === ex.id
                            ? {
                                ...e,
                                sets: [
                                  ...e.sets,
                                  {
                                    id: crypto.randomUUID(),
                                    weight: "",
                                    reps: "",
                                    isCompleted: false,
                                    previous: { weight: "—", reps: "—" },
                                  },
                                ],
                              }
                            : e
                        ),
                      })
                    }
                    className="w-full mt-4 py-4 border border-dashed border-slate-800 rounded-2xl text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] hover:text-slate-400 hover:bg-slate-900 transition-all"
                  >
                    + Add Set
                  </button>
                </div>
              )}
            </div>
          );
        })}
        <button
          onClick={() => setShowLibrary(true)}
          className="w-full py-12 border-2 border-dashed border-slate-800 rounded-[3rem] text-slate-500 font-black flex flex-col items-center gap-3 hover:bg-slate-900 transition-all active:scale-[0.98] shadow-xl shadow-black/40"
        >
          <BookOpen size={36} />
          <span className="uppercase tracking-[0.2em] text-[10px]">
            Library / Bulk Add
          </span>
        </button>
      </main>
    </div>
  );
}

// --- MAIN APP (ROUTINE MANAGER) ---
export default function App() {
  const [routines, setRoutines] = useState(() => {
    const saved = localStorage.getItem("forge_db_v_bulk");
    return saved ? JSON.parse(saved) : [];
  });
  const [activeId, setActiveId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(
    () => localStorage.setItem("forge_db_v_bulk", JSON.stringify(routines)),
    [routines]
  );

  if (activeId)
    return (
      <WorkoutTracker
        initialData={routines.find((r) => r.id === activeId)}
        onBack={() => setActiveId(null)}
        onUpdateRoutines={(updated) =>
          setRoutines((prev) =>
            prev.map((r) => (r.id === updated.id ? updated : r))
          )
        }
      />
    );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans selection:bg-emerald-500/30">
      <header className="max-w-xl mx-auto mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black tracking-tighter italic">FORGE</h1>
          <p className="text-emerald-500 font-black text-[10px] tracking-[0.4em] uppercase mt-1 leading-none underline decoration-emerald-500/30 underline-offset-4 decoration-2">
            V3.0 Bulk
          </p>
        </div>
        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800 shadow-2xl shadow-emerald-500/10">
          <Activity className="text-emerald-500" size={32} />
        </div>
      </header>

      <main className="max-w-xl mx-auto space-y-4">
        {routines.map((r) => (
          <div
            key={r.id}
            onClick={() => setActiveId(r.id)}
            className="group bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] flex justify-between items-center cursor-pointer hover:border-emerald-500/50 transition-all active:scale-[0.98] shadow-lg shadow-black/20"
          >
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-slate-800 rounded-[1.5rem] flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all border border-slate-700 shadow-inner">
                <Dumbbell size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white capitalize leading-tight">
                  {r.name}
                </h2>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1 leading-none">
                  {r.exercises.length} Exercises
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Delete Routine?"))
                  setRoutines(routines.filter((x) => x.id !== r.id));
              }}
              className="p-3 text-slate-800 hover:text-red-500 transition-colors"
            >
              <Trash2 size={24} />
            </button>
          </div>
        ))}

        {isCreating ? (
          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-emerald-500/20 animate-in zoom-in-95 shadow-2xl">
            <input
              autoFocus
              placeholder="Routine Name..."
              className="w-full bg-slate-800 border border-slate-800 rounded-2xl p-5 text-white font-bold outline-none mb-6 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-700 transition-all"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (!newName) return;
                  setRoutines([
                    ...routines,
                    { id: crypto.randomUUID(), name: newName, exercises: [] },
                  ]);
                  setNewName("");
                  setIsCreating(false);
                }}
                className="flex-2 bg-emerald-500 py-4 rounded-2xl font-black text-slate-950 tracking-widest uppercase text-xs hover:bg-emerald-400 active:scale-95 transition-all"
              >
                Create
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="flex-1 bg-slate-800 text-slate-400 font-black py-4 rounded-2xl tracking-widest uppercase text-xs hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full py-14 border-2 border-dashed border-slate-800 rounded-[3rem] text-slate-600 font-black flex flex-col items-center gap-3 hover:bg-slate-900 hover:border-slate-700 transition-all active:scale-[0.98] group shadow-xl shadow-black/10"
          >
            <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center group-hover:bg-emerald-500/10 transition-all">
              <Plus size={32} className="group-hover:text-emerald-500" />
            </div>
            <span className="tracking-[0.2em] uppercase text-xs">
              New Routine
            </span>
          </button>
        )}
      </main>
    </div>
  );
}
