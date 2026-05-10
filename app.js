/* =============================================================
   HQMC ON-LINE CV SYSTEM (KKIMCV1) — app.js
   -------------------------------------------------------------
   This file implements:
     1. SCREENS: a data-driven map of every CICS-style screen.
     2. A tiny router that swaps screens in #screen-region.
     3. Keyboard handling: arrows, Enter, Escape, F1/F3/F7/F8/F12,
        digit/letter option entry, command-line submission.
     4. BMS-like attributes through CSS classes (see styles.css).
     5. Theme cycling: green -> amber -> white.
   -------------------------------------------------------------
   HOW TO EDIT CONTENT:
     * Update the SCREENS object below. Each screen has:
         { tranid, title, render(ctx), options?, help? }
     * `options` is an array of menu rows. Each row is:
         { key: "1", label: "...", tran: "PROF" }
       The `key` is what the user can type; `tran` is the
       target transaction id of another screen.
     * `render(ctx)` returns an HTMLElement (the screen body).
     * The footer status line is updated via ctx.status(...).
     * No persistence is used: do not add localStorage/cookies.
   ============================================================= */

(() => {
  "use strict";

  /* ------------------------------------------------------------------
     Small helpers
  ------------------------------------------------------------------ */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === false || v == null) continue;
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else if (k === "text") node.textContent = v;
      else if (k.startsWith("on") && typeof v === "function") {
        node.addEventListener(k.slice(2), v);
      } else if (k === "dataset") {
        for (const [dk, dv] of Object.entries(v)) node.dataset[dk] = dv;
      } else {
        node.setAttribute(k, v === true ? "" : v);
      }
    }
    for (const c of [].concat(children)) {
      if (c == null || c === false) continue;
      node.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return node;
  }

  function frag(...nodes) {
    const f = document.createDocumentFragment();
    for (const n of nodes) {
      if (n == null || n === false) continue;
      f.append(n.nodeType ? n : document.createTextNode(String(n)));
    }
    return f;
  }

  function asciiBar(pct, width = 20) {
    const filled = Math.round((pct / 100) * width);
    const empty = width - filled;
    return el("span", { class: "meter", "aria-label": `${pct} percent` }, [
      el("span", { class: "full", text: "█".repeat(filled) }),
      el("span", { class: "empty", text: "░".repeat(empty) }),
      ` ${String(pct).padStart(3)}%`,
    ]);
  }

  function titleBar(left, right) {
    return el("div", { class: "title-bar" }, [
      el("span", { class: "left", text: left }),
      el("span", { class: "right", text: right }),
    ]);
  }

  /* ------------------------------------------------------------------
     SCREENS — edit this object to change content.
  ------------------------------------------------------------------ */

  const PROFILE = {
    name: "KIM, KEONI P.",
    title: "DATA ENGINEER / DATA ARCHITECT",
    org: "MISSO-09, HQMC MANPOWER & RESERVE AFFAIRS",
    location: "QUANTICO, VA / WASHINGTON DC-BALTIMORE AREA",
    clearance: "ACTIVE — SECRET SECURITY CLEARANCE",
    email: "keoni.p.kim@gmail.com",
    summary:
      "Data engineer and analytics architect specializing in military HR systems, MCTFS administration, " +
      "large-scale personnel-data validation, and compliance automation. Builds end-to-end Python, SQL, " +
      "PySpark, Cognos, Power BI, and Databricks solutions that convert legacy mainframe records, " +
      "service requests, and operational metrics into actionable intelligence for Marine Corps leadership.",
  };

  const SKILLS = [
    { group: "LANGUAGES",   items: [
      ["PYTHON",  94], ["SQL",    92], ["PYSPARK", 82],
      ["BASH",    85], ["GO",     70], ["POWER QUERY", 76],
    ] },
    { group: "PLATFORMS",   items: [
      ["MCTFS",       96], ["TFDW",        90], ["DATABRICKS",  82],
      ["COGNOS",      90], ["POWER BI",    76], ["TABLEAU",     68],
    ] },
    { group: "DATA / BI",   items: [
      ["ETL",         90], ["DATA QUALITY",94], ["DATA GOV",    88],
      ["AUDIT TRAIL", 92], ["NO SQL",      70], ["MAINFRAME",   86],
    ] },
    { group: "TOOLING",     items: [
      ["GIT/GITHUB",  88], ["ACTIVE DIR",  80], ["MS ACCESS",   82],
      ["EXCEL",       90], ["DTS",         88], ["REPORTNET",   84],
    ] },
    { group: "LEADERSHIP",  items: [
      ["TEAM LEAD",    94], ["COMPLIANCE",  94], ["SERVICE REQ", 90],
      ["AUDITS",       92], ["MENTORING",   90], ["POLICY ADV",  86],
    ] },
  ];

  const PROJECTS = [
    {
      id: "P001",
      name: "MCTFS PEBD VALIDATION PIPELINE",
      role: "TECHNICAL LEAD / SME",
      years: "2022 — PRESENT",
      stack: ["MCTFS", "PYTHON", "SQL", "DATA QA"],
      summary:
        "Engineered a Pay Entry Base Date validation pipeline for MCTFS to improve personnel pay, " +
        "service-credit accuracy, and audit traceability across enterprise Marine Corps records.",
      detail: [
        "Assessed 170,000+ MCTFS records for accuracy and service-credit alignment.",
        "Reached 96.5% overall match and 99% accuracy in recent-year cohorts.",
        "Identified remediation targets for cleaner audit trails and more reliable pay workflows.",
      ],
    },
    {
      id: "P002",
      name: "HQMC ANALYTICS ADOPTION PROGRAM",
      role: "MISSO-09 SUPERVISOR",
      years: "2022 — PRESENT",
      stack: ["DATABRICKS", "PYSPARK", "COGNOS", "POWER BI"],
      summary:
        "Leads analytics adoption and technical upskilling for MCTFS administration, reporting, " +
        "service delivery, and enterprise personnel-data decision support.",
      detail: [
        "Leads a team of seven supporting 50+ commands, 25,000 service members, and 1,500 users.",
        "Manages 1,500+ service requests per year while pushing automation and data quality gains.",
        "Develops PySpark and SQL analytics in Total Force Data Warehouse for leadership decisions.",
      ],
    },
    {
      id: "P003",
      name: "TOTAL FORCE DATA WAREHOUSE SUPPORT",
      role: "FUNCTIONAL ANALYST / DATABASE ARCHITECT",
      years: "2021 — 2022",
      stack: ["TFDW", "SQL", "NO SQL", "ACCESS CONTROL"],
      summary:
        "Served as lead Data Management Specialist and Database Architect for the Total Force " +
        "Data Warehouse initiative, bridging stakeholder needs and secure analytics delivery.",
      detail: [
        "Architected ad-hoc and recurring SQL queries for operational and leadership insight.",
        "Designed secure account-management protocols for hundreds of TFDW users.",
        "Led manual and automated data-integrity audits, MIR ticket resolution, and sequence updates.",
      ],
    },
    {
      id: "P004",
      name: "IGMC READINESS / TRAVEL AUTOMATION",
      role: "DIRECTOR, ADMIN SUPPORT DIVISION",
      years: "2020 — 2021",
      stack: ["BUDGET", "DTS", "DATA READINESS", "TRAINING"],
      summary:
        "Managed fiscal, travel, readiness, and data-governance support for the Inspector General " +
        "of the Marine Corps while improving voucher validation and command-inspector analytics.",
      detail: [
        "Managed a $3M+ annual budget, achieved a 99% obligation rate, and secured $200K supplemental funding.",
        "Validated 1,000+ travel vouchers and supported $2M+ in disbursements.",
        "Led quarterly analytics training and readiness conferences for 80+ command inspectors.",
      ],
    },
    {
      id: "P005",
      name: "MCINCR-MCBQ IPAC OPERATIONS",
      role: "IPAC DIRECTOR",
      years: "2018 — 2020",
      stack: ["PAYROLL", "AUDIT", "DTMS", "PROCESS AUTO"],
      summary:
        "Directed enterprise personnel administration for Marine Corps Installation National Capital " +
        "Region, combining high-volume transaction control with audit analytics and workflow redesign.",
      detail: [
        "Led 115 military and civilian personnel supporting 7,500 Marines.",
        "Reported 225,000+ annual personnel transactions at 99% accuracy with a 1% rejection rate.",
        "Managed $250M+ annual payroll and supported discovery of $651,799 in audit discrepancies.",
      ],
    },
    {
      id: "P006",
      name: "MCAAT AUDIT ANALYTICS",
      role: "SENIOR ANALYST",
      years: "2017 — 2018",
      stack: ["AUDIT", "CHECKLISTS", "REPORTING", "COMPLIANCE"],
      summary:
        "Executed administrative-analysis initiatives that influenced policy determinations for pay, " +
        "entitlements, operational readiness, and standardized inspection practices.",
      detail: [
        "Managed 36+ comprehensive audits across the U.S. and Asia.",
        "Identified and helped remediate $651,799 in financial discrepancies.",
        "Created and refined 250+ targeted checklist questions for administrative excellence.",
      ],
    },
    {
      id: "P007",
      name: "DEPLOYMENT / INBOUND WORKFLOW OPTIMIZATION",
      role: "BRANCH OFFICER-IN-CHARGE",
      years: "2012 — 2014",
      stack: ["MOL REPORTNET", "MS ACCESS", "DTMS", "DOD FMR"],
      summary:
        "Led deployment entitlement and inbound travel-claim workflows in Okinawa, applying tracking, " +
        "audit discipline, and automation to improve throughput and visibility.",
      detail: [
        "Supported 15,000+ Marines and families with deployment-entitlement administration.",
        "Executed 70,000+ transactions across 2,000 unit diaries with a 97% acceptance rate.",
        "Reduced outstanding PCS travel claims by 60% in six months with digital tracking.",
      ],
    },
  ];

  const SYSTEMS = [
    ["MCTFS",          "Marine Corps Total Force System administration, validation, reporting, and service support."],
    ["TFDW",           "Total Force Data Warehouse queries, account protocols, data definitions, and audit support."],
    ["COGNOS",         "BI reports, dashboards, prompts, packages, and operational data flows."],
    ["DATABRICKS",     "PySpark / lakehouse analytics for personnel-data engineering and validation."],
    ["POWER BI",       "Leadership reporting, visualization, and operational metric presentation."],
    ["TABLEAU",        "Analytics visualization and decision-support reporting."],
    ["JUPITER / BOLT", "DoD / USMC platform integration points for governed analytics workflows."],
    ["DTS / DTMS",     "Travel authorization, document tracking, and administrative workflow optimization."],
    ["ACTIVE DIRECTORY","Secure account-management protocols, access control, and user support at scale."],
  ];

  const DOD_CONTEXT = [
    ["ROLE",        "MANPOWER INFORMATION SYSTEMS SUPPORT OFFICE (MISSO-09) SUPERVISOR"],
    ["COMMAND",     "HQMC — MANPOWER & RESERVE AFFAIRS (M&RA), QUANTICO, VA"],
    ["DOMAIN",      "MILITARY HR SYSTEMS, MCTFS, TFDW, PAY, ENTITLEMENTS, PERSONNEL ADMINISTRATION"],
    ["CLEARANCE",   "ACTIVE SECRET SECURITY CLEARANCE; CUI/PII HANDLED UNDER DOCUMENTED CONTROLS"],
    ["SCALE",       "50+ COMMANDS, 25,000 SERVICE MEMBERS, 1,500 USERS, 1,500+ SERVICE REQUESTS/YEAR"],
    ["FOCUS",       "DATA ENGINEERING, ANALYTICS ARCHITECTURE, COMPLIANCE AUTOMATION, AUDIT READINESS"],
    ["AUDIENCE",    "HQMC LEADERSHIP, COMMAND ANALYSTS, INSPECTORS, SERVICE-DESK USERS, DATA CONSUMERS"],
  ];

  const EDUCATION = [
    {
      kind: "CERT",
      title: "PYTHON FOR DATA SCIENCE, AI & DEVELOPMENT",
      org: "COURSERA",
      year: "2023",
    },
    {
      kind: "CERT",
      title: "PYTHON PROJECT FOR DATA SCIENCE",
      org: "COURSERA",
      year: "2023",
    },
    {
      kind: "CERT",
      title: "DATA VISUALIZATION AND DASHBOARDS WITH EXCEL AND COGNOS",
      org: "COURSERA",
      year: "2023",
    },
    {
      kind: "CERT",
      title: "EXCEL ESSENTIALS FOR DATA ANALYTICS",
      org: "COURSERA",
      year: "2023",
    },
    {
      kind: "CERT",
      title: "INTRODUCTION TO DATA ANALYTICS",
      org: "COURSERA",
      year: "2023",
    },
    {
      kind: "CERT",
      title: "LEARNING DATA ANALYTICS: FOUNDATIONS",
      org: "LINKEDIN",
      year: "2023",
    },
    {
      kind: "CERT",
      title: "LEARNING DATA ANALYTICS PART 2",
      org: "LINKEDIN",
      year: "2023",
    },
    {
      kind: "CERT",
      title: "DATA FLUENCY: EXPLORING AND DESCRIBING DATA",
      org: "LINKEDIN",
      year: "2023",
    },
    {
      kind: "CERT",
      title: "LEARNING EXCEL: DATA ANALYSIS",
      org: "LINKEDIN",
      year: "2023",
    },
    {
      kind: "CERT",
      title: "NON-TECHNICAL SKILLS OF EFFECTIVE DATA SCIENTISTS",
      org: "LINKEDIN",
      year: "2023",
    },
  ];

  const PF_KEYS = [
    ["F1",  "HELP — show help screen for current panel."],
    ["F3",  "EXIT / BACK — return to previous screen, or to MAIN MENU."],
    ["F7",  "PAGE UP — scroll detail panels up where applicable."],
    ["F8",  "PAGE DOWN — scroll detail panels down where applicable."],
    ["F12", "RETURN — go back to MAIN MENU."],
    ["ENTER","Activate the selected option, or run the command line."],
    ["ESC", "Same as F3 / back."],
    ["TAB", "Move focus between fields and menu rows."],
    ["1-9 / A-Z","Type an option key on a menu, then press ENTER."],
  ];

  /* ------------------------------------------------------------------
     Screen renderers
  ------------------------------------------------------------------ */

  const SCREENS = {
    /* -------------------- MAIN MENU -------------------- */
    MAIN: {
      tranid: "KKM1",
      title: "MAIN MENU",
      help: "HELP",
      options: [
        { key: "1", label: "PROFILE SUMMARY",            tran: "PROF" },
        { key: "2", label: "SKILLS MATRIX",              tran: "SKIL" },
        { key: "3", label: "WORK / PROJECT INVENTORY",   tran: "PROJ" },
        { key: "4", label: "SYSTEMS & ADMIN EXPERIENCE", tran: "SYST" },
        { key: "5", label: "DOD / PERSONNEL CONTEXT",    tran: "DODX" },
        { key: "6", label: "EDUCATION & CERTIFICATIONS", tran: "EDUC" },
        { key: "7", label: "CONTACT / TRANSMIT",         tran: "CONT" },
        { key: "H", label: "HELP / PF KEYS",             tran: "HELP" },
        { key: "X", label: "EXIT / SIGN OFF",            tran: "BYE"  },
      ],
      render(ctx) {
        const logoTpl = $("#svg-logo");
        const logo = logoTpl.content.firstElementChild.cloneNode(true);

        const wrapper = el("div", { class: "stack" }, [
          titleBar("KKIMCV1 — HQMC ON-LINE CV SYSTEM", "USERID: KKIM"),
          logo,
          el("p", { class: "bms-prot" }, [
            "WELCOME, ",
            el("span", { class: "bms-bright", text: PROFILE.name }),
            "  SELECT AN OPTION AND PRESS ENTER, OR TYPE A TRANID ON THE COMMAND LINE.",
          ]),
          buildMenu(this.options, ctx),
          el("p", { class: "bms-dim" }, [
            "TRANID EXAMPLES: ",
            el("span", { class: "bms-bright", text: "PROF" }),
            ", ",
            el("span", { class: "bms-bright", text: "SKIL" }),
            ", ",
            el("span", { class: "bms-bright", text: "PROJ" }),
            ", ",
            el("span", { class: "bms-bright", text: "HELP" }),
            ".",
          ]),
        ]);
        return wrapper;
      },
    },

    /* -------------------- PROFILE -------------------- */
    PROF: {
      tranid: "PROF",
      title: "PROFILE SUMMARY",
      render(ctx) {
        const dl = el("dl", { class: "kv" }, [
          el("dt", { text: "NAME" }),       el("dd", { text: PROFILE.name }),
          el("dt", { text: "TITLE" }),      el("dd", { text: PROFILE.title }),
          el("dt", { text: "COMMAND" }),    el("dd", { text: PROFILE.org }),
          el("dt", { text: "LOCATION" }),   el("dd", { text: PROFILE.location }),
          el("dt", { text: "CLEARANCE" }),  el("dd", { text: PROFILE.clearance }),
          el("dt", { text: "EMAIL" }),      el("dd", { class: "bms-mdt", text: PROFILE.email }),
        ]);

        return el("div", { class: "stack" }, [
          titleBar("PROF — PROFILE SUMMARY", "PAGE 01 OF 01"),
          dl,
          el("p", { class: "bms-prot bms-bright", text: "SUMMARY" }),
          el("p", { class: "bms-prot", text: PROFILE.summary }),
          el("p", { class: "bms-dim" }, [
            "USE ",
            el("span", { class: "bms-bright", text: "F3" }),
            " TO RETURN, ",
            el("span", { class: "bms-bright", text: "PROJ" }),
            " FOR PROJECTS, OR ",
            el("span", { class: "bms-bright", text: "CONT" }),
            " TO TRANSMIT A MESSAGE.",
          ]),
        ]);
      },
    },

    /* -------------------- SKILLS MATRIX -------------------- */
    SKIL: {
      tranid: "SKIL",
      title: "SKILLS MATRIX",
      render(ctx) {
        const groups = SKILLS.map((g) => {
          const rows = g.items.map(([name, pct]) =>
            el("tr", {}, [
              el("td", { class: "bms-bright", text: name }),
              el("td", {}, [asciiBar(pct, 18)]),
            ])
          );
          return el("div", {}, [
            el("p", { class: "bms-prot bms-bright", text: g.group }),
            el("table", { class: "grid-table", "aria-label": g.group }, [
              el("tbody", {}, rows),
            ]),
          ]);
        });

        return el("div", { class: "stack" }, [
          titleBar("SKIL — SKILLS MATRIX", "SCALE 0..100"),
          el("div", { class: "columns" }, groups.slice(0, 2)),
          el("div", { class: "columns" }, groups.slice(2, 4)),
          groups[4],
          el("p", { class: "bms-dim", text: "VALUES ARE SELF-ASSESSED. ADJUST IN app.js -> SKILLS." }),
        ]);
      },
    },

    /* -------------------- PROJECT LIST -------------------- */
    PROJ: {
      tranid: "PROJ",
      title: "WORK / PROJECT INVENTORY",
      render(ctx) {
        const opts = PROJECTS.map((p, i) => ({
          key: String(i + 1),
          label: `${p.id}  ${p.name}  (${p.years})`,
          tran: `PRJ${i + 1}`,
        }));
        // Register detail screens dynamically (idempotent).
        PROJECTS.forEach((p, i) => {
          const tid = `PRJ${i + 1}`;
          if (!SCREENS[tid]) SCREENS[tid] = projectDetailScreen(p, tid);
        });

        return el("div", { class: "stack" }, [
          titleBar("PROJ — PROJECT INVENTORY", `RECORDS: ${PROJECTS.length}`),
          el("p", { class: "bms-prot", text: "SELECT A PROJECT TO VIEW DETAIL." }),
          buildMenu(opts, ctx),
          el("p", { class: "bms-dim" }, [
            "F7/F8 TO PAGE • F3 TO RETURN • TRANID ",
            el("span", { class: "bms-bright", text: "PRJ1" }),
            " — ",
            el("span", { class: "bms-bright", text: `PRJ${PROJECTS.length}` }),
            " JUMPS DIRECTLY.",
          ]),
        ]);
      },
    },

    /* -------------------- SYSTEMS / ADMIN -------------------- */
    SYST: {
      tranid: "SYST",
      title: "SYSTEMS & ADMIN EXPERIENCE",
      render(ctx) {
        const rows = SYSTEMS.map(([sys, note]) =>
          el("tr", {}, [
            el("td", { class: "bms-bright", text: sys }),
            el("td", { text: note }),
          ])
        );
        return el("div", { class: "stack" }, [
          titleBar("SYST — SYSTEMS & ADMIN", "AS-OF: CURRENT"),
          el("table", { class: "grid-table", "aria-label": "Systems table" }, [
            el("thead", {}, el("tr", {}, [
              el("th", { text: "SYSTEM" }),
              el("th", { text: "NOTES" }),
            ])),
            el("tbody", {}, rows),
          ]),
          el("p", { class: "bms-prot" }, [
            "TAGS: ",
            ...["LINUX", "MACOS", "SSH", "TMUX", "ZSH", "GIT", "BASH", "PYTHON"].map(
              (t) => el("span", { class: "tag", text: t })
            ),
          ]),
        ]);
      },
    },

    /* -------------------- DOD / PERSONNEL CONTEXT -------------------- */
    DODX: {
      tranid: "DODX",
      title: "DOD / PERSONNEL CONTEXT",
      render(ctx) {
        const dl = el("dl", { class: "kv" });
        for (const [k, v] of DOD_CONTEXT) {
          dl.append(
            el("dt", { text: k }),
            el("dd", { class: k === "FOCUS" ? "bms-bright" : "", text: v })
          );
        }
        return el("div", { class: "stack" }, [
          titleBar("DODX — DOD / PERSONNEL CONTEXT", "CUI/PII: HANDLED"),
          dl,
          el("p", { class: "bms-prot" },
            "Work is conducted under documented controls for personnel data; specifics of " +
            "underlying systems are described at the appropriate level for an unclassified CV."
          ),
        ]);
      },
    },

    /* -------------------- EDUCATION & CERTS -------------------- */
    EDUC: {
      tranid: "EDUC",
      title: "EDUCATION & CERTIFICATIONS",
      render(ctx) {
        const rows = EDUCATION.map((e) =>
          el("tr", {}, [
            el("td", { class: "bms-bright bms-num", text: e.kind }),
            el("td", { text: e.title }),
            el("td", { text: e.org }),
            el("td", { class: "bms-num", text: e.year }),
          ])
        );
        return el("div", { class: "stack" }, [
          titleBar("EDUC — EDUCATION & CERTS", `RECORDS: ${EDUCATION.length}`),
          el("table", { class: "grid-table", "aria-label": "Education table" }, [
            el("thead", {}, el("tr", {}, [
              el("th", { text: "KIND" }),
              el("th", { text: "TITLE" }),
              el("th", { text: "ORG" }),
              el("th", { text: "YEAR" }),
            ])),
            el("tbody", {}, rows),
          ]),
        ]);
      },
    },

    /* -------------------- CONTACT -------------------- */
    CONT: {
      tranid: "CONT",
      title: "CONTACT / TRANSMIT",
      render(ctx) {
        const form = el("form", {
          class: "stack",
          onsubmit: (ev) => {
            ev.preventDefault();
            const data = Object.fromEntries(new FormData(ev.currentTarget).entries());
            if (!data.name || !data.message) {
              ctx.status("FIELDS NAME AND MESSAGE ARE REQUIRED.", "error");
              return;
            }
            // Mark the email field as MDT-changed for visual feedback.
            ctx.status(
              `MESSAGE QUEUED FOR ${PROFILE.email}. (DEMO ONLY — NOT TRANSMITTED.)`,
              "ok"
            );
          },
        }, [
          el("div", { class: "field" }, [
            el("label", { for: "f-name", text: "NAME" }),
            el("input", { id: "f-name", name: "name", class: "bms-unprot", required: true, maxlength: 64 }),
          ]),
          el("div", { class: "field" }, [
            el("label", { for: "f-org", text: "ORG" }),
            el("input", { id: "f-org", name: "org", class: "bms-unprot", maxlength: 64 }),
          ]),
          el("div", { class: "field" }, [
            el("label", { for: "f-email", text: "EMAIL" }),
            el("input", { id: "f-email", name: "email", class: "bms-unprot", type: "email", maxlength: 96 }),
          ]),
          el("div", { class: "field" }, [
            el("label", { for: "f-msg", text: "MESSAGE" }),
            el("textarea", { id: "f-msg", name: "message", class: "bms-unprot", rows: 4, maxlength: 600, required: true }),
          ]),
          el("p", { class: "bms-dim" }, [
            "PRESS ",
            el("span", { class: "bms-bright", text: "ENTER" }),
            " IN THE COMMAND LINE OR CLICK ",
            el("button", { type: "submit", class: "pf", text: "TRANSMIT" }),
            " TO QUEUE THE MESSAGE.",
          ]),
        ]);

        return el("div", { class: "stack" }, [
          titleBar("CONT — CONTACT / TRANSMIT", `TARGET: ${PROFILE.email}`),
          el("p", { class: "bms-prot" }, "FILL UNPROTECTED FIELDS BELOW. NO DATA LEAVES THIS PAGE."),
          form,
        ]);
      },
    },

    /* -------------------- HELP -------------------- */
    HELP: {
      tranid: "HELP",
      title: "HELP / PF KEYS",
      render(ctx) {
        const rows = PF_KEYS.map(([k, v]) =>
          el("tr", {}, [
            el("td", { class: "bms-bright", text: k }),
            el("td", { text: v }),
          ])
        );
        return el("div", { class: "stack" }, [
          titleBar("HELP — KEYS & NAVIGATION", "PRESS F3 TO RETURN"),
          el("table", { class: "grid-table", "aria-label": "PF keys" }, [
            el("thead", {}, el("tr", {}, [
              el("th", { text: "KEY" }), el("th", { text: "ACTION" }),
            ])),
            el("tbody", {}, rows),
          ]),
          el("p", { class: "bms-prot" }, [
            "VALID TRANIDS: ",
            ...["MAIN","PROF","SKIL","PROJ","SYST","DODX","EDUC","CONT","HELP"]
              .map((t) => el("span", { class: "tag", text: t })),
          ]),
          el("p", { class: "bms-dim" }, "TYPE A TRANID ON THE COMMAND LINE AND PRESS ENTER."),
        ]);
      },
    },

    /* -------------------- SIGN OFF -------------------- */
    BYE: {
      tranid: "BYE",
      title: "SESSION TERMINATED",
      render(ctx) {
        return el("div", { class: "stack" }, [
          titleBar("BYE — SESSION TERMINATED", "THANK YOU"),
          el("pre", { class: "ascii", text:
`+--------------------------------------------------+
|  SESSION ENDED.  TRANSACTIONS LOGGED.            |
|  TYPE  MAIN  AND PRESS ENTER TO RECONNECT.       |
+--------------------------------------------------+`
          }),
          el("p", { class: "bms-blink bms-bright", text: "PRESS ENTER TO RECONNECT" }),
        ]);
      },
    },
  };

  /* Build a project detail screen on demand. */
  function projectDetailScreen(project, tranid) {
    return {
      tranid,
      title: `PROJECT ${project.id}`,
      render(ctx) {
        return el("div", { class: "stack" }, [
          titleBar(`${tranid} — ${project.id} ${project.name}`, project.years),
          el("dl", { class: "kv" }, [
            el("dt", { text: "ROLE" }),    el("dd", { class: "bms-bright", text: project.role }),
            el("dt", { text: "YEARS" }),   el("dd", { text: project.years }),
            el("dt", { text: "STACK" }),   el("dd", {}, project.stack.map((s) => el("span", { class: "tag", text: s }))),
          ]),
          el("p", { class: "bms-prot bms-bright", text: "SUMMARY" }),
          el("p", { class: "bms-prot", text: project.summary }),
          el("p", { class: "bms-prot bms-bright", text: "DETAIL" }),
          el("ul", { class: "stack detail-list" },
            project.detail.map((d) => el("li", { class: "bms-prot", text: d }))
          ),
          el("p", { class: "bms-dim" }, [
            "F3 RETURN  •  F12 MAIN  •  TRANID ",
            el("span", { class: "bms-bright", text: "PROJ" }),
            " FOR INVENTORY",
          ]),
        ]);
      },
    };
  }

  /* ------------------------------------------------------------------
     Menu builder — used by MAIN and PROJ screens.
  ------------------------------------------------------------------ */

  function buildMenu(options, ctx) {
    const ul = el("ul", { class: "menu", role: "menu" });
    options.forEach((opt, i) => {
      const li = el("li", {
        role: "menuitem",
        tabindex: "0",
        "data-key": String(opt.key).toUpperCase(),
        "data-tran": opt.tran,
        "aria-selected": i === 0 ? "true" : "false",
        onclick: () => ctx.go(opt.tran),
        onkeydown: (ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            ctx.go(opt.tran);
          }
        },
        onfocus: () => ctx.selectMenuItem(li),
      }, [
        el("span", { class: "opt-key",  text: String(opt.key).toUpperCase() }),
        el("span", { class: "opt-label", text: opt.label }),
        el("span", { class: "opt-tran", text: opt.tran }),
      ]);
      ul.append(li);
    });
    return ul;
  }

  /* ------------------------------------------------------------------
     Router + keyboard handling
  ------------------------------------------------------------------ */

  const VALID_TRANIDS = () => Object.keys(SCREENS);
  const HISTORY = ["MAIN"];

  const dom = {
    region:    $("#screen-region"),
    cmdForm:   $("#cmd-form"),
    cmdInput:  $("#cmd-input"),
    status:    $("#status-line"),
    banner: {
      tran: $("#banner-tranid"),
      title: $("#banner-title"),
      date: $("#banner-date"),
      time: $("#banner-time"),
    },
  };

  function setStatus(msg, kind = "ok") {
    dom.status.textContent = msg;
    dom.status.classList.remove("is-error", "is-ok");
    dom.status.classList.add(kind === "error" ? "is-error" : "is-ok");
  }

  function selectMenuItem(li) {
    const ul = li.parentElement;
    if (!ul) return;
    $$(":scope > li", ul).forEach((x) => x.setAttribute("aria-selected", "false"));
    li.setAttribute("aria-selected", "true");
  }

  function getMenuItems() {
    return $$("#screen-region .menu > li");
  }

  function moveSelection(delta) {
    const items = getMenuItems();
    if (!items.length) return;
    const cur = items.findIndex((x) => x.getAttribute("aria-selected") === "true");
    const next = (cur + delta + items.length) % items.length;
    items[next].focus();
    selectMenuItem(items[next]);
  }

  function activateSelection() {
    const items = getMenuItems();
    const sel = items.find((x) => x.getAttribute("aria-selected") === "true");
    if (sel) {
      go(sel.dataset.tran);
      return true;
    }
    return false;
  }

  function go(tranid, { push = true, message } = {}) {
    const id = String(tranid || "").toUpperCase().trim();
    const screen = SCREENS[id];
    if (!screen) {
      setStatus(`UNKNOWN TRANID "${id}". TYPE HELP FOR OPTIONS.`, "error");
      return false;
    }

    // Update banner
    dom.banner.tran.textContent = `TRAN: ${screen.tranid || id}`;
    dom.banner.title.textContent = screen.title || id;
    document.title = `KKIMCV1 — ${screen.title || id}`;

    // Render body
    const ctx = {
      go,
      status: setStatus,
      selectMenuItem,
    };
    dom.region.replaceChildren(screen.render(ctx));

    // Focus first menu item if present, otherwise the screen region
    const firstMenu = $("#screen-region .menu > li");
    if (firstMenu) {
      firstMenu.focus({ preventScroll: true });
      selectMenuItem(firstMenu);
    } else {
      dom.region.focus({ preventScroll: true });
    }

    if (push) HISTORY.push(id);
    setStatus(message || `READY. ${screen.tranid || id} ON SCREEN.`, "ok");

    // Sync hash for shareability without persistence
    try {
      const hash = `#/${id}`;
      if (location.hash !== hash) history.replaceState(null, "", hash);
    } catch (_) { /* ignore */ }
    return true;
  }

  function back() {
    if (HISTORY.length > 1) {
      HISTORY.pop();
      const prev = HISTORY[HISTORY.length - 1];
      go(prev, { push: false, message: `RETURNED TO ${prev}.` });
    } else {
      go("MAIN", { push: false, message: "AT MAIN MENU." });
    }
  }

  /* Command-line submit: a tranid, an option key from the current menu,
     or a one-off command (HELP, EXIT, BACK, THEME, MAIN). */
  function runCommand(raw) {
    const cmd = String(raw || "").trim().toUpperCase();
    if (!cmd) {
      // Empty Enter: activate selected menu item if any.
      if (!activateSelection()) setStatus("ENTER A COMMAND OR OPTION.", "error");
      return;
    }
    if (cmd === "EXIT" || cmd === "BYE" || cmd === "LOGOFF") return go("BYE");
    if (cmd === "BACK" || cmd === "RETURN") return back();
    if (cmd === "THEME") return cycleTheme();
    if (cmd === "EFFECTS") return toggleEffects();
    if (cmd === "MAIN" || cmd === "MENU") return go("MAIN");

    // If short and matches a menu key on the current screen, activate it.
    if (/^[A-Z0-9]$/.test(cmd)) {
      const items = getMenuItems();
      const hit = items.find((x) => x.dataset.key === cmd);
      if (hit) { go(hit.dataset.tran); return; }
    }

    // Otherwise treat as a TRANID.
    if (SCREENS[cmd]) return go(cmd);

    setStatus(`UNKNOWN COMMAND "${cmd}". TRY HELP.`, "error");
  }

  /* ------------------------------------------------------------------
     Theme + effects
  ------------------------------------------------------------------ */
  const THEMES = ["green", "amber", "white"];
  function cycleTheme() {
    const cur = document.body.dataset.theme || "green";
    const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
    document.body.dataset.theme = next;
    setStatus(`THEME: ${next.toUpperCase()}`, "ok");
  }
  function toggleEffects() {
    const cur = document.body.dataset.effects === "off";
    document.body.dataset.effects = cur ? "on" : "off";
    setStatus(`EFFECTS: ${cur ? "ON" : "OFF"}`, "ok");
  }

  /* ------------------------------------------------------------------
     Wire up
  ------------------------------------------------------------------ */
  function init() {
    // Reduced motion -> turn off ambient effects by default.
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.body.dataset.effects = "off";
    }

    // Initial theme via ?theme=...
    const params = new URLSearchParams(location.search);
    const t = (params.get("theme") || "").toLowerCase();
    if (THEMES.includes(t)) document.body.dataset.theme = t;

    // Clock
    function tick() {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      dom.banner.date.textContent =
        `DATE: ${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
      dom.banner.time.textContent =
        `TIME: ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
    tick(); setInterval(tick, 1000);

    // Command form
    dom.cmdForm.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const v = dom.cmdInput.value;
      dom.cmdInput.value = "";
      runCommand(v);
    });

    // Theme button
    $("[data-theme-cycle]").addEventListener("click", cycleTheme);

    // PF buttons -> synthesize Fn keys
    $$(".pf[data-pf]").forEach((btn) => {
      btn.addEventListener("click", () => handlePF(Number(btn.dataset.pf)));
    });

    // Global keyboard
    document.addEventListener("keydown", onKey);

    // Hash routing on load
    const initial = (location.hash.replace(/^#\/?/, "") || "MAIN").toUpperCase();
    go(SCREENS[initial] ? initial : "MAIN", { push: false });

    // React to manual hash changes
    window.addEventListener("hashchange", () => {
      const id = (location.hash.replace(/^#\/?/, "") || "MAIN").toUpperCase();
      if (SCREENS[id]) go(id, { push: false });
    });

    // Click on cmd prompt -> focus input
    $(".cmd-prompt").addEventListener("click", () => dom.cmdInput.focus());
  }

  function handlePF(n) {
    switch (n) {
      case 1:  return go("HELP");
      case 3:  return back();
      case 7:  return scrollScreen(-1);
      case 8:  return scrollScreen(1);
      case 12: return go("MAIN", { message: "RETURNED TO MAIN MENU." });
    }
  }

  function scrollScreen(dir) {
    const r = dom.region;
    r.scrollBy({ top: dir * Math.max(120, r.clientHeight * 0.6), behavior: "smooth" });
    setStatus(dir > 0 ? "PAGE DOWN." : "PAGE UP.", "ok");
  }

  function onKey(ev) {
    const target = ev.target;
    const inField =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement;

    // Function keys + ESC always work
    if (ev.key === "F1")  { ev.preventDefault(); return handlePF(1); }
    if (ev.key === "F3")  { ev.preventDefault(); return handlePF(3); }
    if (ev.key === "F7")  { ev.preventDefault(); return handlePF(7); }
    if (ev.key === "F8")  { ev.preventDefault(); return handlePF(8); }
    if (ev.key === "F12") { ev.preventDefault(); return handlePF(12); }
    if (ev.key === "Escape") { ev.preventDefault(); return back(); }

    // Inside fields, leave normal typing alone (no keyboard trap).
    if (inField) return;

    // Arrow navigation among menu items
    if (ev.key === "ArrowDown" || ev.key === "ArrowRight") {
      if (getMenuItems().length) { ev.preventDefault(); moveSelection(1); }
      return;
    }
    if (ev.key === "ArrowUp" || ev.key === "ArrowLeft") {
      if (getMenuItems().length) { ev.preventDefault(); moveSelection(-1); }
      return;
    }

    // Enter on menu item activates; elsewhere submits command line.
    if (ev.key === "Enter") {
      if (getMenuItems().length && document.activeElement &&
          document.activeElement.matches(".menu > li")) {
        ev.preventDefault();
        return activateSelection();
      }
      // Fall through — let form submit handle it if focus is on input.
      return;
    }

    // Quick option-key entry on menu screens: focus the matching item.
    if (/^[a-zA-Z0-9]$/.test(ev.key)) {
      const k = ev.key.toUpperCase();
      const item = getMenuItems().find((x) => x.dataset.key === k);
      if (item) {
        item.focus();
        selectMenuItem(item);
        // Don't auto-activate; user can press Enter. Allows multi-char tranids
        // to be typed on the command line instead.
      } else {
        // Route the keystroke to the command line for tranid entry.
        if (document.activeElement !== dom.cmdInput) {
          dom.cmdInput.focus();
          // Append the character so the user can keep typing.
          dom.cmdInput.value = (dom.cmdInput.value + ev.key).toUpperCase();
          ev.preventDefault();
        }
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
