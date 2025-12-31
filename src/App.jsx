import React, { useState, useEffect } from "react";
import {
  Dumbbell,
  Play,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  Clock,
  History,
  X,
  ArrowLeft,
  AlertTriangle,
  Minus,
  Activity,
  List,
  Watch,
} from "lucide-react";

// --- ROBUST STORAGE HELPER ---
const safeGet = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    // Extra safety: If we expect an array (routines/history) but got something else, reset.
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    return parsed;
  } catch (e) {
    return fallback;
  }
};

const DEFAULT_ROUTINES = [
  {
    id: 1,
    name: "Push Day",
    exercises: [
      { name: "Bench Press", restTime: 90 },
      { name: "Overhead Press", restTime: 90 },
    ],
  },
  {
    id: 2,
    name: "Pull Day",
    exercises: [
      { name: "Deadlift", restTime: 120 },
      { name: "Pull Ups", restTime: 90 },
    ],
  },
];

export default function App() {
  // --- STATE ---
  const [view, setView] = useState("home");

  // Load data
  const [routines, setRoutines] = useState(() =>
    safeGet("routines", DEFAULT_ROUTINES)
  );
  const [history, setHistory] = useState(() => safeGet("history", []));
  const [activeWorkout, setActiveWorkout] = useState(() =>
    safeGet("activeWorkout", null)
  );

  // UI State
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    msg: "",
    action: null,
  });

  // --- PERSISTENCE EFFECTS ---
  // These run every time the specific state changes to save it.
  useEffect(
    () => localStorage.setItem("routines", JSON.stringify(routines)),
    [routines]
  );
  useEffect(
    () => localStorage.setItem("history", JSON.stringify(history)),
    [history]
  );
  useEffect(() => {
    if (activeWorkout) {
      localStorage.setItem("activeWorkout", JSON.stringify(activeWorkout));
    } else {
      localStorage.removeItem("activeWorkout");
    }
  }, [activeWorkout]);

  // --- WORKOUT TIMER ---
  useEffect(() => {
    let interval;
    if (activeWorkout) {
      interval = setInterval(() => {
        setActiveWorkout((prev) => {
          if (!prev) return null;
          return { ...prev, duration: (prev.duration || 0) + 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeWorkout?.id]);

  // --- ACTIONS ---
  const confirmAction = (title, msg, action) =>
    setConfirmModal({ isOpen: true, title, msg, action });
  const closeConfirm = () =>
    setConfirmModal({ ...confirmModal, isOpen: false });
  const executeConfirm = () => {
    if (confirmModal.action) confirmModal.action();
    closeConfirm();
  };

  const startWorkout = (routine = null) => {
    const newWorkout = {
      id: Date.now(),
      startTime: Date.now(),
      duration: 0,
      name: routine ? routine.name : "Freestyle Workout",
      exercises: routine
        ? (routine.exercises || []).map((e) => ({
            ...e,
            id: Date.now() + Math.random(),
            sets: [{ weight: "", reps: "", completed: false }],
            restTime: e.restTime || 60,
            collapsed: false,
          }))
        : [],
    };
    setActiveWorkout(newWorkout);
    setView("workout");
  };

  const finishWorkout = () => {
    if (!activeWorkout) return;
    const completed = {
      ...activeWorkout,
      endTime: Date.now(),
      date: new Date().toLocaleDateString("en-GB"),
    };
    // Use functional update to ensure history persists correctly
    setHistory((prev) => [completed, ...prev]);
    setActiveWorkout(null);
    setView("home");
  };

  const cancelWorkout = () => {
    confirmAction("Discard Workout?", "This session will be deleted.", () => {
      setActiveWorkout(null);
      setView("home");
    });
  };

  // Use functional updates (prev => ...) to fix persistence bugs
  const deleteHistoryItem = (id) =>
    confirmAction("Delete Record?", "Cannot be recovered.", () =>
      setHistory((prev) => prev.filter((h) => h.id !== id))
    );
  const deleteRoutine = (id) =>
    confirmAction("Delete Routine?", "Can be recreated later.", () =>
      setRoutines((prev) => prev.filter((r) => r.id !== id))
    );
  const addRoutine = (newRoutine) =>
    setRoutines((prev) => [...prev, newRoutine]);

  const getPreviousRecord = (exerciseName, setIndex) => {
    const lastWorkout = history.find((h) =>
      h.exercises.some((e) => e.name === exerciseName)
    );
    if (!lastWorkout) return null;
    const exercise = lastWorkout.exercises.find((e) => e.name === exerciseName);
    return exercise?.sets?.[setIndex] || null;
  };

  // --- NAV ---
  const NavBar = () => (
    <div className="fixed bottom-0 left-0 w-full bg-zinc-950 border-t border-zinc-800 flex justify-around p-4 pb-6 z-50">
      <NavBtn
        icon={<History />}
        label="History"
        active={view === "home" || view === "history-details"}
        onClick={() => setView("home")}
      />
      <NavBtn
        icon={<Dumbbell />}
        label="Workout"
        active={view === "workout"}
        onClick={() => setView("workout")}
      />
    </div>
  );
  const NavBtn = ({ icon, label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center transition-colors w-full ${
        active ? "text-blue-500" : "text-zinc-600"
      }`}
    >
      {React.cloneElement(icon, { size: 24 })}
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
  );

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-500 mb-2">
              <AlertTriangle size={24} />
              <h3 className="font-bold text-lg text-white">
                {confirmModal.title}
              </h3>
            </div>
            <p className="text-zinc-400 mb-6">{confirmModal.msg}</p>
            <div className="flex gap-3">
              <button
                onClick={closeConfirm}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={executeConfirm}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {view === "home" && (
        <HomeView
          history={history}
          startWorkout={startWorkout}
          deleteHistoryItem={deleteHistoryItem}
          viewDetails={(w) => {
            setSelectedHistory(w);
            setView("history-details");
          }}
          NavBar={NavBar}
        />
      )}
      {view === "history-details" && (
        <HistoryDetailsView
          workout={selectedHistory}
          onBack={() => setView("home")}
          NavBar={NavBar}
        />
      )}

      {view === "workout" &&
        (activeWorkout ? (
          <ActiveSession
            workout={activeWorkout}
            setWorkout={setActiveWorkout}
            onFinish={finishWorkout}
            onCancel={cancelWorkout}
            getPrev={getPreviousRecord}
            confirmAction={confirmAction}
            NavBar={NavBar}
          />
        ) : (
          <WorkoutDashboard
            routines={routines}
            addRoutine={addRoutine}
            deleteRoutine={deleteRoutine}
            startWorkout={startWorkout}
            NavBar={NavBar}
          />
        ))}
    </div>
  );
}

// ----------------------
// COMPONENTS
// ----------------------

const HomeView = ({
  history,
  startWorkout,
  deleteHistoryItem,
  viewDetails,
  NavBar,
}) => (
  <div className="p-4 pb-24">
    <h1 className="text-3xl font-bold mb-6">Activity</h1>
    <div
      onClick={() => startWorkout()}
      className="bg-blue-600 text-white p-6 rounded-2xl mb-8 flex justify-between items-center shadow-lg active:scale-95 transition-transform cursor-pointer"
    >
      <div>
        <h2 className="font-bold text-xl">Quick Start</h2>
        <p className="text-blue-200 text-sm">Start an empty session</p>
      </div>
      <div className="bg-white/20 p-3 rounded-full">
        <Play fill="white" size={24} />
      </div>
    </div>
    <h3 className="text-zinc-500 font-bold text-xs uppercase tracking-wider mb-4">
      Recent Workouts
    </h3>
    <div className="space-y-4">
      {history.length === 0 && (
        <div className="text-zinc-600 text-center py-8">
          No workouts recorded yet.
        </div>
      )}
      {history.map((w) => (
        <div
          key={w.id}
          onClick={() => viewDetails(w)}
          className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl relative group active:bg-zinc-800 transition-colors cursor-pointer"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="font-bold block">{w.name}</span>
              <span className="text-zinc-500 text-xs">{w.date}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteHistoryItem(w.id);
              }}
              className="p-2 text-zinc-600 hover:text-red-500 z-10"
            >
              <Trash2 size={18} />
            </button>
          </div>
          <div className="text-zinc-400 text-sm flex gap-4">
            <span className="flex items-center gap-1">
              <Clock size={14} /> {Math.floor((w.duration || 0) / 60)}m
            </span>
            <span className="flex items-center gap-1">
              <Dumbbell size={14} /> {w.exercises?.length || 0} Ex
            </span>
          </div>
        </div>
      ))}
    </div>
    <NavBar />
  </div>
);

const HistoryDetailsView = ({ workout, onBack, NavBar }) => (
  <div className="p-4 pb-24">
    <div className="flex items-center gap-4 mb-6">
      <button
        onClick={onBack}
        className="bg-zinc-900 p-2 rounded-full border border-zinc-800"
      >
        <ArrowLeft size={20} />
      </button>
      <div>
        <h1 className="text-xl font-bold leading-none">{workout?.name}</h1>
        <span className="text-zinc-500 text-sm">{workout?.date}</span>
      </div>
    </div>
    <div className="space-y-4">
      {workout?.exercises?.map((ex, i) => (
        <div
          key={i}
          className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
        >
          <div className="p-3 bg-zinc-800/30 border-b border-zinc-800 font-bold text-zinc-200">
            {ex.name}
          </div>
          <div className="p-3 space-y-2">
            {ex.sets.map((set, k) => (
              <div
                key={k}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-zinc-500 w-8">#{k + 1}</span>
                <span className="text-zinc-300 font-mono">
                  {set.weight || 0}kg
                </span>
                <span className="text-zinc-500">x</span>
                <span className="text-zinc-300 font-mono">
                  {set.reps || 0} reps
                </span>
                <span className="w-16 text-right">
                  {set.completed ? (
                    <span className="text-emerald-500 text-xs font-bold">
                      DONE
                    </span>
                  ) : (
                    <span className="text-zinc-600 text-xs">SKIP</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
    <NavBar />
  </div>
);

const WorkoutDashboard = ({
  routines,
  addRoutine,
  deleteRoutine,
  startWorkout,
  NavBar,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  if (isCreating)
    return (
      <RoutineCreator
        onSave={(r) => {
          addRoutine(r);
          setIsCreating(false);
        }}
        onCancel={() => setIsCreating(false)}
        NavBar={NavBar}
      />
    );

  return (
    <div className="p-4 pb-24 animate-in fade-in">
      <h1 className="text-3xl font-bold mb-6">Workout</h1>
      <div
        onClick={() => startWorkout()}
        className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl mb-8 flex justify-between items-center shadow-sm active:scale-95 transition-transform cursor-pointer group"
      >
        <div>
          <h2 className="font-bold text-xl text-blue-400 group-hover:text-blue-300">
            Quick Start
          </h2>
          <p className="text-zinc-500 text-sm">Start empty session</p>
        </div>
        <div className="bg-blue-600/10 p-3 rounded-full text-blue-500">
          <Play size={24} fill="currentColor" />
        </div>
      </div>
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-zinc-500 font-bold text-xs uppercase tracking-wider">
          Your Routines
        </h3>
      </div>
      <div className="space-y-3 mb-8">
        {routines.length === 0 && (
          <div className="text-zinc-600 text-center py-4 text-sm">
            No routines created yet.
          </div>
        )}
        {routines.map((r) => (
          <div
            key={r.id}
            className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex justify-between items-center active:bg-zinc-800 transition-colors"
          >
            <div
              className="flex-1 cursor-pointer"
              onClick={() => startWorkout(r)}
            >
              <span className="font-bold block text-white">{r.name}</span>
              <span className="text-zinc-500 text-xs">
                {r.exercises?.length || 0} Exercises
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => startWorkout(r)}
                className="bg-blue-600/20 text-blue-500 p-2 rounded-full"
              >
                <Play size={16} fill="currentColor" />
              </button>
              <button
                onClick={() => deleteRoutine(r.id)}
                className="text-zinc-600 hover:text-red-500 p-2"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => setIsCreating(true)}
        className="w-full py-4 border-2 border-dashed border-zinc-800 text-zinc-500 rounded-xl font-bold hover:border-zinc-700 hover:text-zinc-300 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={20} /> Create New Routine
      </button>
      <NavBar />
    </div>
  );
};

const RoutineCreator = ({ onSave, onCancel, NavBar }) => {
  const [name, setName] = useState("");
  const [tempEx, setTempEx] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="p-4 pb-24 animate-in slide-in-from-bottom-4 duration-300">
      {showSearch && (
        <SearchModal
          onClose={() => setShowSearch(false)}
          onAdd={(items) => setTempEx([...tempEx, ...items])}
        />
      )}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onCancel}
          className="bg-zinc-900 p-2 rounded-full border border-zinc-800"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">New Routine</h1>
      </div>
      <div className="space-y-6">
        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">
            Routine Name
          </label>
          <input
            autoFocus
            placeholder="e.g. Leg Day"
            className="w-full bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-white outline-none focus:border-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">
            Exercises
          </label>
          <div className="space-y-2 mb-4">
            {tempEx.map((ex, i) => (
              <div
                key={i}
                className="flex justify-between items-center bg-zinc-900 p-4 rounded-xl border border-zinc-800"
              >
                <span className="font-medium">{ex}</span>{" "}
                <button
                  onClick={() =>
                    setTempEx(tempEx.filter((_, idx) => idx !== i))
                  }
                  className="text-zinc-500 hover:text-red-500"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowSearch(true)}
            className="w-full py-4 border-2 border-dashed border-zinc-800 text-zinc-500 rounded-xl font-bold hover:text-white"
          >
            + Add Exercises
          </button>
        </div>
        <button
          onClick={() =>
            onSave({
              id: Date.now(),
              name,
              exercises: tempEx.map((n) => ({ name: n, restTime: 60 })),
            })
          }
          disabled={!name}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
            name ? "bg-blue-600 shadow-lg" : "bg-zinc-800 text-zinc-500"
          }`}
        >
          Save Routine
        </button>
      </div>
      <NavBar />
    </div>
  );
};

const ActiveSession = ({
  workout,
  setWorkout,
  onFinish,
  onCancel,
  getPrev,
  confirmAction,
  NavBar,
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [activeRest, setActiveRest] = useState(null);

  useEffect(() => {
    let interval;
    if (activeRest) {
      interval = setInterval(() => {
        const remaining = Math.ceil((activeRest.endTime - Date.now()) / 1000);
        if (remaining <= 0) {
          setActiveRest(null);
          if (navigator.vibrate) navigator.vibrate(200);
        } else setActiveRest((prev) => ({ ...prev, remaining }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeRest?.endTime]);

  const triggerRest = (seconds) => {
    setActiveRest({
      endTime: Date.now() + seconds * 1000,
      duration: seconds,
      remaining: seconds,
    });
  };

  const updateSet = (exId, setIdx, field, val) => {
    let justCompleted = false;
    setWorkout((prev) => {
      if (!prev) return null;
      const exercise = prev.exercises.find((e) => e.id === exId);
      if (!exercise) return prev;

      const set = exercise.sets[setIdx];
      if (field === "completed" && val === true && !set.completed)
        justCompleted = true;

      return {
        ...prev,
        exercises: prev.exercises.map((ex) => {
          if (ex.id !== exId) return ex;
          const newSets = [...ex.sets];
          newSets[setIdx] = { ...newSets[setIdx], [field]: val };
          return { ...ex, sets: newSets };
        }),
      };
    });
    // Trigger Timer Automatically
    if (justCompleted) {
      const exercise = workout.exercises.find((e) => e.id === exId);
      if (exercise) triggerRest(exercise.restTime || 60);
    }
  };

  const adjustRestPref = (exId, delta) => {
    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((e) =>
        e.id === exId
          ? { ...e, restTime: Math.max(0, (e.restTime || 60) + delta) }
          : e
      ),
    }));
  };

  const addSet = (exId) =>
    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exId
          ? {
              ...ex,
              sets: [...ex.sets, { weight: "", reps: "", completed: false }],
            }
          : ex
      ),
    }));
  const deleteSet = (exId, setIdx) =>
    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exId
          ? { ...ex, sets: ex.sets.filter((_, i) => i !== setIdx) }
          : ex
      ),
    }));
  const removeExercise = (exId) =>
    confirmAction(
      "Remove Exercise?",
      "This will remove all sets for this exercise.",
      () =>
        setWorkout((prev) => ({
          ...prev,
          exercises: prev.exercises.filter((ex) => ex.id !== exId),
        }))
    );

  const totalSets = (workout.exercises || []).reduce(
    (acc, ex) => acc + (ex.sets || []).filter((s) => s.completed).length,
    0
  );
  const totalVol = (workout.exercises || []).reduce(
    (acc, ex) =>
      acc +
      (ex.sets || []).reduce(
        (sAcc, s) =>
          s.completed
            ? sAcc + Number(s.weight || 0) * Number(s.reps || 0)
            : sAcc,
        0
      ),
    0
  );

  return (
    <div className="pb-32 font-sans relative animate-in fade-in">
      {showSearch && (
        <SearchModal
          onClose={() => setShowSearch(false)}
          onAdd={(names) => {
            const newExs = names.map((name) => ({
              id: Date.now() + Math.random(),
              name,
              sets: [{ weight: "", reps: "", completed: false }],
              restTime: 60,
              collapsed: false,
            }));
            setWorkout((prev) => ({
              ...prev,
              exercises: [...prev.exercises, ...newExs],
            }));
          }}
        />
      )}

      <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800 p-4 z-40 shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <button
            onClick={onCancel}
            className="bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-red-500 p-2 rounded-lg"
          >
            <X size={20} />
          </button>
          <h2 className="font-bold text-lg max-w-[150px] truncate text-center">
            {workout.name}
          </h2>
          <button
            onClick={onFinish}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg font-bold text-sm"
          >
            Finish
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-900 rounded p-2 text-center border border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">
              Duration
            </span>
            <div className="text-white font-mono font-medium flex items-center justify-center gap-1">
              <Clock size={12} className="text-blue-500" />{" "}
              {Math.floor((workout.duration || 0) / 60)}:
              {String((workout.duration || 0) % 60).padStart(2, "0")}
            </div>
          </div>
          <div className="bg-zinc-900 rounded p-2 text-center border border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">
              Sets
            </span>
            <div className="text-white font-mono font-medium flex items-center justify-center gap-1">
              <List size={12} className="text-emerald-500" /> {totalSets}
            </div>
          </div>
          <div className="bg-zinc-900 rounded p-2 text-center border border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">
              Volume
            </span>
            <div className="text-white font-mono font-medium flex items-center justify-center gap-1">
              <Activity size={12} className="text-purple-500" />{" "}
              {(totalVol / 1000).toFixed(1)}k
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {workout.exercises.map((ex) => (
          <div
            key={ex.id}
            className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm"
          >
            <div className="p-4 flex justify-between items-center bg-zinc-800/30 border-b border-zinc-800/50">
              <div
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() =>
                  setWorkout((prev) => ({
                    ...prev,
                    exercises: prev.exercises.map((e) =>
                      e.id === ex.id ? { ...e, collapsed: !e.collapsed } : e
                    ),
                  }))
                }
              >
                <h3 className="font-bold text-lg">{ex.name}</h3>
                {ex.collapsed ? (
                  <ChevronDown size={18} className="text-zinc-500" />
                ) : (
                  <ChevronUp size={18} className="text-zinc-500" />
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                  <button
                    onClick={() => adjustRestPref(ex.id, -15)}
                    className="p-1 text-zinc-500 hover:text-white"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-xs font-mono w-8 text-center text-blue-400">
                    {ex.restTime || 60}s
                  </span>
                  <button
                    onClick={() => adjustRestPref(ex.id, 15)}
                    className="p-1 text-zinc-500 hover:text-white"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  onClick={() => removeExercise(ex.id)}
                  className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
            {!ex.collapsed && (
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-10 text-[10px] text-zinc-500 uppercase tracking-wider text-center font-bold">
                  <div className="col-span-1">Set</div>
                  <div className="col-span-3">Prev</div>
                  <div className="col-span-2">Kg</div>
                  <div className="col-span-2">Reps</div>
                </div>
                {ex.sets.map((s, i) => {
                  const prev = getPrev(ex.name, i);
                  return (
                    <div
                      key={i}
                      className={`grid grid-cols-10 gap-2 items-center p-2 rounded-lg transition-colors ${
                        s.completed ? "bg-emerald-900/20" : ""
                      }`}
                    >
                      <div className="col-span-1 text-center font-bold text-zinc-500">
                        {i + 1}
                      </div>
                      <div className="col-span-3 text-center text-xs text-zinc-600">
                        {prev ? `${prev.weight}x${prev.reps}` : "-"}
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          inputMode="decimal"
                          placeholder="-"
                          className={`w-full bg-zinc-950 text-center p-2 rounded border outline-none ${
                            s.completed
                              ? "border-emerald-800 text-emerald-100"
                              : "border-zinc-700 text-white"
                          }`}
                          value={s.weight}
                          onChange={(e) =>
                            updateSet(ex.id, i, "weight", e.target.value)
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          inputMode="decimal"
                          placeholder="-"
                          className={`w-full bg-zinc-950 text-center p-2 rounded border outline-none ${
                            s.completed
                              ? "border-emerald-800 text-emerald-100"
                              : "border-zinc-700 text-white"
                          }`}
                          value={s.reps}
                          onChange={(e) =>
                            updateSet(ex.id, i, "reps", e.target.value)
                          }
                        />
                      </div>
                      <div className="col-span-2 flex justify-end gap-1">
                        <button
                          onClick={() =>
                            updateSet(ex.id, i, "completed", !s.completed)
                          }
                          className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                            s.completed
                              ? "bg-emerald-500 text-white shadow-lg"
                              : "bg-zinc-800 text-zinc-500"
                          }`}
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => deleteSet(ex.id, i)}
                          className="w-8 h-8 flex items-center justify-center text-zinc-700 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                <button
                  onClick={() => addSet(ex.id)}
                  className="w-full py-3 mt-2 text-sm font-bold text-blue-500 bg-blue-500/10 rounded-lg"
                >
                  + Add Set
                </button>
              </div>
            )}
          </div>
        ))}
        <button
          onClick={() => setShowSearch(true)}
          className="w-full py-4 border-2 border-dashed border-zinc-800 text-zinc-500 rounded-xl font-bold"
        >
          + Add Exercise
        </button>
        <button
          onClick={onCancel}
          className="w-full py-4 text-red-500 opacity-60 hover:opacity-100 text-sm font-bold"
        >
          Discard Workout
        </button>
      </div>

      {activeRest && (
        <div className="fixed bottom-20 left-4 right-4 bg-zinc-900 border border-zinc-700 p-4 rounded-xl shadow-2xl flex justify-between items-center animate-in slide-in-from-bottom-5 z-50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600/20 text-blue-500 p-2 rounded-full animate-pulse">
              <Watch size={24} />
            </div>
            <div>
              <span className="text-xs text-zinc-500 uppercase font-bold">
                Resting
              </span>
              <div className="text-2xl font-mono font-bold text-white">
                {activeRest.remaining}s
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setActiveRest((prev) => ({
                  ...prev,
                  endTime: prev.endTime + 15000,
                  remaining: prev.remaining + 15,
                }))
              }
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg font-bold text-sm"
            >
              +15s
            </button>
            <button
              onClick={() => setActiveRest(null)}
              className="bg-zinc-800 hover:bg-red-900/50 text-zinc-400 hover:text-red-400 p-2 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
      <NavBar />
    </div>
  );
};

const SearchModal = ({ onClose, onAdd }) => {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState([]);
  const list = [
    "Bench Press",
    "Squat",
    "Deadlift",
    "Overhead Press",
    "Pull Up",
    "Dumbbell Row",
    "Lat Pulldown",
    "Incline Bench",
    "Bicep Curl",
    "Tricep Extension",
    "Leg Press",
    "Lateral Raise",
    "Face Pull",
    "Leg Curl",
  ];
  const filtered = list.filter((x) =>
    x.toLowerCase().includes(q.toLowerCase())
  );
  const handleAdd = () => {
    onAdd(sel.length ? sel : [q]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[100] flex flex-col animate-in fade-in duration-200">
      <div className="p-4 border-b border-zinc-800 flex gap-4 items-center bg-zinc-900">
        <button onClick={onClose}>
          <ArrowLeft className="text-zinc-400" />
        </button>
        <input
          autoFocus
          placeholder="Search Exercise..."
          className="flex-1 bg-transparent outline-none text-white text-lg"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {(q || sel.length > 0) && (
          <button onClick={handleAdd} className="text-blue-500 font-bold">
            Add
          </button>
        )}
      </div>
      <div className="p-4 space-y-2 overflow-y-auto flex-1">
        {q && !filtered.includes(q) && (
          <div
            onClick={() => {
              onAdd([q]);
              onClose();
            }}
            className="p-4 border border-zinc-800 rounded-lg bg-zinc-900 flex justify-between items-center cursor-pointer"
          >
            <span>
              Create "<b>{q}</b>"
            </span>
            <Plus size={18} className="text-blue-500" />
          </div>
        )}
        {filtered.map((x) => (
          <div
            key={x}
            onClick={() =>
              setSel(sel.includes(x) ? sel.filter((s) => s !== x) : [...sel, x])
            }
            className={`p-4 border rounded-lg cursor-pointer flex justify-between items-center transition-all ${
              sel.includes(x)
                ? "border-blue-500 bg-blue-900/20 text-blue-400"
                : "border-zinc-800 bg-zinc-900"
            }`}
          >
            {x} {sel.includes(x) && <Check size={18} />}
          </div>
        ))}
      </div>
    </div>
  );
};
