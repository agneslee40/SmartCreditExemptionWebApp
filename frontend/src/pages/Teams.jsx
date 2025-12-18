// src/pages/Teams.jsx
import React, { useMemo, useState } from "react";

/* ------------------ tiny inline icons (no library) ------------------ */

function IconSearch({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}



/* ------------------ UI pieces ------------------ */

function AvatarStack({ avatars = [] }) {
  return (
    <div className="flex -space-x-2">
      {avatars.slice(0, 4).map((src, idx) => (
        <img
          key={idx}
          src={src}
          alt=""
          className="h-8 w-8 rounded-full border-2 border-white object-cover"
        />
      ))}
    </div>
  );
}

function TeamCard({ team, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "relative w-full rounded-[38px] p-8 text-left transition shadow-[0_14px_40px_rgba(0,0,0,0.10)]",
        selected ? "ring-2 ring-black/25" : "hover:shadow-[0_18px_52px_rgba(0,0,0,0.12)]",
      ].join(" ")}
      style={{ backgroundColor: team.bg }}
    >
      {/* Top circle image */}
      <div className="flex justify-center">
        <div className="h-20 w-20 rounded-full bg-white/40 flex items-center justify-center shadow-[0_12px_26px_rgba(0,0,0,0.12)]">
          <img
            src={team.icon}
            alt=""
            className="h-16 w-16 rounded-full object-cover"
          />
        </div>
      </div>

      {/* Title */}
      <div className="mt-5 text-center text-xl font-extrabold text-[#0B0F2A]">
        {team.name}
      </div>

      {/* Stats capsule */}
      <div className="mt-6 mx-auto w-[80%] rounded-[26px] bg-white/55 border border-black/10 shadow-[0_12px_28px_rgba(0,0,0,0.10)] px-7 py-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-[#0B0F2A]">{team.plCount}</div>
            <div className="mt-1 text-xs font-bold text-[#0B0F2A]/70">Programme Leaders</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-[#0B0F2A]">{team.slCount}</div>
            <div className="mt-1 text-xs font-bold text-[#0B0F2A]/70">Subject Lecturers</div>
          </div>
        </div>
      </div>

      {/* Bottom-right mini avatars */}
      <div className="absolute bottom-6 right-7">
        <AvatarStack avatars={team.avatars} />
      </div>
    </button>
  );
}

function SelectedTeamPanel({ team }) {
  if (!team) return null;

  return (
    <aside className="w-[360px] max-w-full rounded-[38px] bg-[#EFEFEF] shadow-[0_18px_52px_rgba(0,0,0,0.16)] border border-black/10 p-7">
      <div className="text-center text-sm font-extrabold text-[#0B0F2A]/80">
        Selected Team
      </div>

      {/* Team header */}
      <div className="mt-6 flex items-center gap-4">
        <img src={team.icon} alt="" className="h-14 w-14 rounded-full object-cover" />
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-[#0B0F2A] leading-tight">
            {team.name}
          </div>
        </div>


      </div>

      {/* Programme Leader */}
      <div className="mt-8">
        <div className="text-xs font-extrabold text-[#0B0F2A]/70">Programme Leader</div>
        <div className="mt-4 flex items-center gap-3">
          <img
            src={team.programmeLeader.avatar}
            alt=""
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-[#0B0F2A]">{team.programmeLeader.name}</div>
            <div className="text-[11px] text-[#0B0F2A]/60">{team.programmeLeader.email}</div>
          </div>
        </div>
      </div>

      {/* Subject Lecturers */}
      <div className="mt-8">
        <div className="flex items-center gap-3">
          <div className="text-xs font-extrabold text-[#0B0F2A]/70">Subject Lecturers</div>

          
        </div>

        <div className="mt-4 space-y-4">
          {team.subjectLecturers.map((sl) => (
            <div key={sl.email} className="flex items-center gap-3">
              <img src={sl.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-[#0B0F2A]">{sl.name}</div>
                <div className="text-[11px] text-[#0B0F2A]/60">{sl.email}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

/* ------------------ main page ------------------ */
export default function Teams() {
  // mock data (swap to API later)
  const initialTeams = [
    {
      id: "t-eng",
      name: "Engineering",
      bg: "#B7E3F7",
      icon: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      plCount: 1,
      slCount: 1,
      avatars: [
        "https://i.pravatar.cc/100?img=1",
        "https://i.pravatar.cc/100?img=2",
      ],
      programmeLeader: {
        name: "PL Demo",
        email: "pl@sunway.edu.my",
        avatar: "https://i.pravatar.cc/100?img=1",
      },
      subjectLecturers: [
        {
          name: "SL Demo",
          email: "sl@sunway.edu.my",
          avatar: "https://i.pravatar.cc/100?img=2",
        },
      ],
    },

    {
      id: "t-cs",
      name: "Computer Science",
      bg: "#8E90C9",
      icon: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=200&q=60",
      plCount: 1,
      slCount: 3,
      avatars: [
        "https://i.pravatar.cc/100?img=12",
        "https://i.pravatar.cc/100?img=28",
        "https://i.pravatar.cc/100?img=49",
      ],
      programmeLeader: {
        name: "Dr. Alice Koo",
        email: "alice.koo@sunway.edu.my",
        avatar: "https://i.pravatar.cc/100?img=32",
      },
      subjectLecturers: [
        {
          name: "Dr. Sarveshshina",
          email: "sarveshshina@sunway.edu.my",
          avatar: "https://i.pravatar.cc/100?img=48",
        },
        {
          name: "Dr. Yong Weng Han",
          email: "wenghan.yong@sunway.edu.my",
          avatar: "https://i.pravatar.cc/100?img=14",
        },
      ],
    },
    {
      id: "t-fin",
      name: "Finance",
      bg: "#F7B5D8",
      icon: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=200&q=60",
      plCount: 1,
      slCount: 3,
      avatars: [
        "https://i.pravatar.cc/100?img=11",
        "https://i.pravatar.cc/100?img=26",
        "https://i.pravatar.cc/100?img=37",
      ],
      programmeLeader: {
        name: "Dr. Example (Finance)",
        email: "pl.finance@sunway.edu.my",
        avatar: "https://i.pravatar.cc/100?img=5",
      },
      subjectLecturers: [
        { name: "SL A", email: "sla@sunway.edu.my", avatar: "https://i.pravatar.cc/100?img=18" },
        { name: "SL B", email: "slb@sunway.edu.my", avatar: "https://i.pravatar.cc/100?img=19" },
      ],
    },
    {
      id: "t-cul",
      name: "Culinary",
      bg: "#F6E57C",
      icon: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=200&q=60",
      plCount: 1,
      slCount: 3,
      avatars: [
        "https://i.pravatar.cc/100?img=20",
        "https://i.pravatar.cc/100?img=21",
        "https://i.pravatar.cc/100?img=22",
      ],
      programmeLeader: {
        name: "Dr. Example (Culinary)",
        email: "pl.culinary@sunway.edu.my",
        avatar: "https://i.pravatar.cc/100?img=9",
      },
      subjectLecturers: [
        { name: "SL C", email: "slc@sunway.edu.my", avatar: "https://i.pravatar.cc/100?img=23" },
        { name: "SL D", email: "sld@sunway.edu.my", avatar: "https://i.pravatar.cc/100?img=24" },
      ],
    },
  ];


  const [teams, setTeams] = useState(initialTeams);
  // Demo directory (replace with API search later)
  const directoryUsers = useMemo(
    () => [
      { name: "PL Demo", email: "pl@sunway.edu.my", role: "PL", avatar: "https://i.pravatar.cc/100?img=1" },
      { name: "SL Demo", email: "sl@sunway.edu.my", role: "SL", avatar: "https://i.pravatar.cc/100?img=2" },
    ],
    []
  );

  // --- Modals state ---
  const [editOpen, setEditOpen] = useState(false);
  const [editDraftName, setEditDraftName] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [addPicked, setAddPicked] = useState(null); // {name,email,role,avatar}
  const [addRole, setAddRole] = useState("SL"); // default add SL

  const [removeOpen, setRemoveOpen] = useState(false);
  const [removePickedEmail, setRemovePickedEmail] = useState("");

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("team") || "t-eng";
  });


  const recalcCounts = (team) => ({
    ...team,
    slCount: team.subjectLecturers.length,
    plCount: team.programmeLeader ? 1 : 0,
    avatars: [
      team.programmeLeader?.avatar,
      ...team.subjectLecturers.map((x) => x.avatar),
    ].filter(Boolean),
  });

  const openEditTeamName = (team) => {
    setEditDraftName(team?.name || "");
    setEditOpen(true);
  };

  const saveTeamName = () => {
    const newName = editDraftName.trim();
    if (!newName) return;

    setTeams((prev) =>
      prev.map((t) => (t.id === selectedId ? { ...t, name: newName } : t))
    );
    setEditOpen(false);
  };

  const openAddMember = () => {
    setAddQuery("");
    setAddPicked(null);
    setAddRole("SL");
    setAddOpen(true);
  };

  const openRemoveMember = () => {
    setRemovePickedEmail("");
    setRemoveOpen(true);
  };

  const addMemberToSelectedTeam = () => {
    if (!addPicked) return;

    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== selectedId) return t;

        // Prevent duplicates by email
        const existsInSL = t.subjectLecturers.some((m) => m.email === addPicked.email);
        const isPLSame = t.programmeLeader?.email === addPicked.email;
        if (existsInSL || isPLSame) return t;

        if (addRole === "PL") {
          // Replace current PL with picked user
          const updated = { ...t, programmeLeader: addPicked };
          return recalcCounts(updated);
        }

        // Add as SL
        const updated = { ...t, subjectLecturers: [...t.subjectLecturers, addPicked] };
        return recalcCounts(updated);
      })
    );

    setAddOpen(false);
  };

  const removeMemberFromSelectedTeam = () => {
    const email = removePickedEmail;
    if (!email) return;

    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== selectedId) return t;

        // If removing PL, set to PL Demo (safe fallback)
        if (t.programmeLeader?.email === email) {
          const fallbackPL = directoryUsers.find((u) => u.role === "PL") || t.programmeLeader;
          const updated = { ...t, programmeLeader: fallbackPL };
          return recalcCounts(updated);
        }

        // Remove from SL list
        const updated = {
          ...t,
          subjectLecturers: t.subjectLecturers.filter((m) => m.email !== email),
        };
        return recalcCounts(updated);
      })
    );

    setRemoveOpen(false);
  };



  
  const visibleTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) => t.name.toLowerCase().includes(q));
  }, [teams, search]);

  const selectedTeam = teams.find((t) => t.id === selectedId) || teams[0];

  return (
    <div className="bg-white">
      {/* Header row */}
      <div className="flex items-center gap-6">
        <h1 className="text-6xl font-extrabold tracking-tight text-[#0B0F2A]">
          My Teams
        </h1>

        <div className="flex-1" />

        {/* Search + filter (like figma) */}
        <div className="flex items-center gap-4 pt-2">
          <div className="relative w-[280px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full rounded-full bg-[#EFEFEF] pl-10 pr-4 py-3 text-sm font-semibold text-[#0B0F2A] outline-none placeholder:text-[#0B0F2A]/40"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0B0F2A]/35">
              <IconSearch className="h-5 w-5" />
            </span>
          </div>

          
        </div>
      </div>

      {/* Main layout: grid + selected panel */}
      <div className="mt-10 flex items-start gap-10">
        {/* Teams grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 flex-1">
          {visibleTeams.map((t) => (
            <TeamCard
              key={t.id}
              team={t}
              selected={t.id === selectedId}
              onClick={() => setSelectedId(t.id)}
            />
          ))}
        </div>

        {/* Selected team panel */}
        <div className="hidden xl:block">
          <SelectedTeamPanel
            team={selectedTeam}
            
          />
        </div>
      </div>

      {/* Small screen: selected panel drops below */}
      <div className="xl:hidden mt-10">
        <SelectedTeamPanel
          team={selectedTeam}
         
        />
      </div>
    

    </div>
  );
}
