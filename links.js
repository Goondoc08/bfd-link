/* ============================================================
   BFDLink — LINK DATA
   ------------------------------------------------------------
   THIS IS THE ONLY FILE YOU NEED TO EDIT TO ADD/FIX A LINK.
   No HTML or CSS knowledge required.

   To add a link, copy an existing block and change the values:

     { name: "Display Name",
       desc: "Short line (used by search — not shown on the tile)",
       url:  "https://example.com" },

   Optional flags you can add to any link:
     intranet: true -> shows a "City Network" badge. Baytown has no station
                       WiFi, so these pages can NEVER load on a phone. Tapping
                       one COPIES the address instead of opening it, so it can
                       be pasted on a city computer. A link that always fails
                       looks like a broken app — this doesn't.
     app:  true     -> shows an "App" badge (native app, not a website)
     webOnly: true  -> shows a "Web Only" badge — there IS a native app, but
                       nothing (confirmed scheme, verified App Link) exists
                       for a web page to open it with, so this always opens
                       the website even if the app is installed. Use this
                       instead of silently doing nothing so people don't
                       wonder why it didn't open their app.
     store: true    -> shows a "Store" badge — on a phone this tile lands on
                       the App Store / Play Store listing, not on the app
                       itself. From there you tap "Open" to launch it. No web
                       page can press that Open button for you (the OS blocks
                       cross-app automation), so the badge sets the
                       expectation instead of looking broken.
     ios:  "url"    -> alternate URL used on iPhone/iPad
     android: "url" -> alternate URL used on Android
     pinned: true   -> currently unused; reserved
     manningLive: true -> shows a "Live" badge and, on tap, opens the in-app
                       manning popup (manning.js) instead of navigating to
                       `url`. Built specifically for the one Daily Manning
                       tile — not a generic flag, don't reuse for anything
                       else without also updating manning.js's tile-tap
                       handler in index.html.
     comingSoon: true -> shows a "Coming Soon" badge and, on tap, a small
                       popup instead of navigating (there's nowhere to send
                       anyone yet). Use for a link BFD hasn't supplied — url
                       can be a placeholder ("#") since it's never followed.
     storeOnMobile: true -> on the narrow/phone layout, opens the App Store /
                       Play Store listing (needs ios/android set) with a
                       "Store" badge — same as a normal store:true tile. On
                       the wide ≥1200px desktop dashboard, opens `url`
                       instead (typically the website) with no store badge.
                       Checks actual viewport width, not phone-vs-desktop OS,
                       so a tablet in the wide dashboard layout still gets
                       the website. For an app that only makes sense as an
                       app on a phone but as a website on a desktop/MDT —
                       see the Pulsara entry below.
     scheme: "x://"       -> tries to open an installed app first (both
                             platforms), then falls back to url
     androidScheme: "..." -> same, but Android only
     iosScheme: "..."     -> same, but iOS only

   >>> ABOUT SCHEMES — READ BEFORE ADDING ONE <<<
   Only add a scheme if you have ACTUALLY CONFIRMED it opens the app on a
   real device. A wrong guess wastes ~1s before falling back, and on iOS can
   pop an "address is invalid" alert. Every app tile below currently ships
   as store/web on purpose: store IDs can be verified remotely, schemes
   cannot. They get added one at a time as each app is tested on a real
   iPhone and a real Android.

   Pearland Fire Link already proved some apps simply can't be opened from a
   web page at all — see the Pulsara note below. That's the vendor's choice,
   not a gap here.

   After editing: save, commit, push. That's it.
   ============================================================ */

const LAST_UPDATED = "2026-08-12";   // bump when you do a review pass

const LINKS = [

  /* ---------------------------------------------------------- */
  {
    category: "Response & Daily Use",
    accent: "224,74,60",
    icon: "siren",
    items: [
      {
        name: "BFD Protocols",
        desc: "Baytown FD protocols (AcidRemap)",
        url: "https://play.google.com/store/apps/details?id=com.acidremap.PPPBaytownFireDepartment",
        android: "https://play.google.com/store/apps/details?id=com.acidremap.PPPBaytownFireDepartment",
        // Baytown DOES have a public App Store listing — verified via the
        // iTunes lookup API against bundle id
        // com.acidremap.PPPBaytownFireDepartment. Worth noting because
        // Pearland's equivalent does NOT: theirs is distributed through
        // Apple's Custom Apps program (private, promo-code redemption), so
        // their tile has to point at a download page instead. Baytown gets
        // the real thing on both platforms.
        ios: "https://apps.apple.com/us/app/id981936582",
        app: true, store: true, pinned: true
      },
      {
        // Confirmed web-only (Aug 12) — no dedicated app on either store.
        name: "ESO",
        desc: "ePCR & reporting",
        url: "https://www.esosuite.net/login/baytownfd",
        pinned: true
      },
      {
        // No auto-open for Pulsara on either platform — this is a confirmed
        // dead end, not an unfinished attempt. Pearland Fire Link tested it:
        //   - "pulsara://" (a guess) tested false: fell through to the web
        //     login every time.
        //   - Pulsara's own apple-app-site-association file covers only
        //     /oauth2callback/*, not the login page linked here, so no plain
        //     https link universal-links into the app on any platform.
        //   - An Android intent: URL launching com.pulsara.stopapps by
        //     package ALSO tested false on a real device. Root cause: Chrome
        //     only launches an app component via intent: if its intent-filter
        //     declares category BROWSABLE, specifically to stop web pages
        //     from launching arbitrary app screens. A launcher icon's
        //     MAIN/LAUNCHER activity is not BROWSABLE, so Chrome silently
        //     refuses — same behavior every time, not a syntax bug.
        // Bottom line: Pulsara publishes nothing a web page can hook into to
        // open the app directly, on either platform. If that ever changes,
        // revisit — until then, storeOnMobile is the next best thing: on a
        // phone, land on the store listing (tap Open there); on the wide
        // desktop dashboard, go straight to the website instead.
        name: "Pulsara",
        desc: "Patient communication & alerts",
        url: "https://us-app.pulsara.com/user/login",
        android: "https://play.google.com/store/apps/details?id=com.pulsara.stopapps",
        ios: "https://apps.apple.com/us/app/id873184192",
        storeOnMobile: true, pinned: true
      },
      {
        name: "Bryx",
        desc: "Bryx 911 dispatch alerting",
        url: "https://play.google.com/store/apps/details?id=com.bryx.bryx911",
        android: "https://play.google.com/store/apps/details?id=com.bryx.bryx911",
        ios: "https://apps.apple.com/us/app/id813078029",
        app: true, store: true, pinned: true
      },
      {
        name: "Operative IQ",
        desc: "Front Line — inventory & equipment checks",
        url: "https://login.operativeiq.com/Login.aspx?identifier=baytown&ReturnUrl=&LoginType=",
        android: "https://play.google.com/store/apps/details?id=com.operativeiq.frontline",
        ios: "https://apps.apple.com/us/app/id1616940091",
        app: true, store: true
      },
      {
        // Still pending (Aug 12) — Chloe is tracking this down. Swap
        // comingSoon:true for a real url the moment it exists; no other
        // change needed. Moved here from Maintenance & Repairs (Aug 13) —
        // daily-use fit better than the repair-request-form cluster.
        name: "SCBA Check",
        desc: "SCBA check-in log",
        url: "#",
        comingSoon: true
      },
      {
        // Confirmed with Chloe (Aug 12) — this web link is correct as listed.
        // BFD uses it for policy management, not the separate "LexOne" app
        // that same vendor also sells; no app-store link needed.
        name: "Lexipol",
        desc: "Policy manual",
        url: "https://policy.lexipol.com/login/"
      },
      {
        // Confirmed web-only (Aug 12) — no dedicated app on either store.
        name: "Vector Solutions",
        desc: "Training platform (TargetSolutions)",
        url: "https://app.targetsolutions.com/auth/index.cfm?action=login.showlogin&customerid=37425&customerpath=baytownfd"
      }
    ]
  },

  /* ---------------------------------------------------------- */
  {
    category: "Scheduling",
    accent: "63,147,224",
    icon: "clipboard",
    items: [
      {
        // Phase 3, live (Aug 2026) — tapping this opens the in-app manning
        // popup (manning.js) instead of navigating, reading the Apps Script
        // endpoint per BFDLINK-BUILD-PLAN.md section 4 / manning-apps-script.gs.
        // `url` stays the real sheet — used as the "Open full sheet" link
        // inside that popup, and as the href JS falls back to if it can't run.
        name: "Daily Manning",
        desc: "Daily manning & activities — live",
        url: "https://docs.google.com/spreadsheets/d/1k3JfoW4H_4Lgq48PVJMfRHFbKMjRuYFboKKwMRzQ8g0/edit?gid=1220561888#gid=1220561888",
        manningLive: true, pinned: true
      },
      {
        name: "A-Shift Calendar",
        desc: "A shift calendar",
        url: "https://docs.google.com/spreadsheets/d/1geU6J4jH6ZNNec1I5faEbsIupw-smhMK_B2hFEJrnDI/edit?pli=1&gid=0#gid=0"
      },
      {
        name: "B-Shift Calendar",
        desc: "B shift calendar",
        url: "https://docs.google.com/spreadsheets/d/1FtDZWXRPnzndGal7dyUEtB7QPhroNOeDiISSstutPmk/edit?pli=1&gid=2043432352#gid=2043432352"
      },
      {
        name: "C-Shift Calendar",
        desc: "C shift calendar",
        url: "https://docs.google.com/spreadsheets/d/1bQJVVSzopOkdGwcfR2GpsH_g4mxg73uQTZJt6jqaTeI/edit?gid=0#gid=0"
      }
    ]
  },

  /* ---------------------------------------------------------- */
  {
    category: "Maintenance & Repairs",
    accent: "67,176,106",
    icon: "shield",
    items: [
      {
        // \n forces "SCBA" / "Repairs" onto two lines, matching how "SCBA
        // Cleaning" next to it naturally wraps — "Repairs" alone is short
        // enough to fit on one line otherwise, which looked mismatched
        // sitting beside a tile that wraps to two (see tileHTML in
        // index.html for how \n in a name becomes a real line break).
        name: "SCBA\nRepairs",
        desc: "SCBA repair request form",
        url: "https://docs.google.com/forms/d/e/1FAIpQLSeWaCpUEcvslsjgshhuxvEx08Exc84ndoQSY3dOtF-wCIcmHg/viewform"
      },
      {
        name: "SCBA Cleaning",
        desc: "SCBA cleaning request form",
        url: "https://docs.google.com/forms/d/e/1FAIpQLSf0-RR16rhpX8xe0-8uUt0_CvE3n6o_r9vOFDXXoMWjoDiEFw/viewform"
      },
      {
        name: "Radio Repair",
        desc: "Radio repair request form",
        url: "https://docs.google.com/forms/d/12-ATvOFS9bIMRmHwGgTx7ArX04fB4cz0dChjH7n1BNI/viewform?edit_requested=true"
      }

      /* Monthly Maintenance (policy 1100.3) becomes an in-app page in Phase 2,
         not a link — it'll be added as:
      ,{ name: "Monthly Maintenance", desc: "1100.3 — first full week", url: "maintenance.html" }
      */
    ]
  },

  /* ---------------------------------------------------------- */
  {
    category: "HR & Admin",
    accent: "240,169,43",
    icon: "badge",
    items: [
      {
        name: "Pre-Plan Viewer",
        desc: "Pre-plans — view (ArcGIS Field Maps)",
        url: "https://experience.arcgis.com/experience/a1960bc1ed4c4a9c80a1b175a137ff93",
        android: "https://play.google.com/store/apps/details?id=com.esri.fieldmaps",
        ios: "https://apps.apple.com/us/app/id1515671684",
        app: true, store: true
      },
      {
        name: "Pre-Plan Editor",
        desc: "Pre-plans — edit (ArcGIS Field Maps)",
        url: "https://experience.arcgis.com/experience/aebdf91488ba4dfb80dbb344ea8c65aa",
        android: "https://play.google.com/store/apps/details?id=com.esri.fieldmaps",
        ios: "https://apps.apple.com/us/app/id1515671684",
        app: true, store: true
      },
      {
        name: "Employee Injury",
        desc: "Injury / workers' compensation workflow",
        url: "https://baytownlife.com/210/Employee-InjuryWorkers-Compensation"
      },
      {
        name: "Vehicle / Property Damage",
        desc: "Vehicle and property damage reporting",
        url: "https://baytownlife.com/211/Vehicle-and-Property-Damage"
      },
      {
        name: "TCFP (FIDO)",
        desc: "Texas Commission on Fire Protection certifications",
        url: "https://auth.tcfp.texas.gov/account/login"
      },
      {
        name: "NREMT",
        desc: "National Registry recertification",
        url: "https://nremt.org/login"
      },
      {
        name: "TDSHS",
        desc: "Texas DSHS EMS certification",
        url: "https://vo.ras.dshs.state.tx.us/datamart/login.do"
      }
    ]
  },

  /* ---------------------------------------------------------- */
  {
    category: "Benefits & Retirement",
    accent: "168,132,220",
    icon: "heart",
    items: [
      {
        name: "Employee Self Service",
        desc: "ESS — pay, leave, personal info",
        url: "https://selfservice.baytown.org/ess/default.aspx"
      },
      {
        name: "Frontline Physicals",
        desc: "Vasana — annual physicals",
        url: "https://platform.vasana.ai/login"
      },
      {
        name: "Baytown Benefits",
        desc: "City benefits portal",
        url: "https://baytownbenefits.com/index.php/benefits/"
      },
      {
        name: "TMRS",
        desc: "Texas Municipal Retirement System — pension",
        url: "https://my.tmrs.com/login"
      },
      {
        name: "Mission Square",
        desc: "MissionSquare / ICMA — 457(b) and IRAs",
        url: "https://accountaccess.missionsquare.com/login.html",
        android: "https://play.google.com/store/apps/details?id=com.icmarc.app",
        ios: "https://apps.apple.com/us/app/id908841242",
        app: true, store: true
      },
      {
        // Confirmed (Aug 12) — use the myuhc.com member login, not the
        // HealthSafe ID page the source doc originally had. That page IS
        // still where myuhc.com sends you to sign in, so this isn't
        // removing a step, just pointing at the front door instead of a
        // mid-flow redirect target that could change without notice.
        // web + ios re-verified Aug 14, both still correct.
        //
        // android fixed AGAIN (Aug 14) — com.uhg.mobile.uhc (set on the
        // Aug 12 pass, after com.mobile.uhc was believed dead at the time)
        // now 404s itself. Re-verified in-browser: com.mobile.uhc is live
        // again right now (publisher "UNITED HEALTHCARE SERVICES, INC.",
        // 5M+ downloads, 4.6 stars) -- these UHC package IDs appear to
        // come and go, so don't assume either one is permanent; re-check
        // in-browser next time this gets reported, don't just trust this
        // comment.
        name: "Health Insurance",
        desc: "UnitedHealthcare — myuhc.com",
        url: "https://www.myuhc.com/",
        android: "https://play.google.com/store/apps/details?id=com.mobile.uhc",
        ios: "https://apps.apple.com/us/app/id1348316600",
        app: true, store: true
      },
      {
        // Resolved (Aug 12) — OnePass is its own app (fitness/wellness
        // rewards, separate from the main UHC plan app above), publisher
        // "One Pass Solutions, Inc." / Pear Health Labs. The duplicate-URL
        // issue from the source doc is gone now that this points at the
        // actual app instead of copying Health Insurance's link.
        // See the FAQ sheet for what it's for and how it relates to UHC.
        name: "OnePass",
        desc: "UHC fitness & wellness rewards",
        url: "https://play.google.com/store/apps/details?id=com.pearhealthlabs.onepass",
        android: "https://play.google.com/store/apps/details?id=com.pearhealthlabs.onepass",
        ios: "https://apps.apple.com/us/app/id6499447981",
        app: true, store: true
      },
      {
        name: "EAP",
        desc: "Employee assistance — Live and Work Well · access code cob123",
        url: "https://www.liveandworkwell.com/en/public"
      }
    ]
  },

  /* ---------------------------------------------------------- */
  {
    category: "Union Resources",
    accent: "224,135,58",
    icon: "flag",
    items: [
      {
        name: "BPFFA Portal",
        desc: "Baytown Professional Firefighters Association",
        url: "https://baytown-professional-firefighters-association.connectplus.app/login"
      },
      {
        name: "TSAFF Portal",
        desc: "Texas State Association of Fire Fighters",
        url: "https://texas-state-association-of-fire-fighters.connectplus.app/login"
      },
      {
        name: "IAFF Portal",
        desc: "International Association of Fire Fighters",
        url: "https://my.iaff.org/Web/Contacts/SignIn_withoutCreateNewAccount.aspx?WebsiteKey=7403ace1-c45e-4dbc-b9cd-d5803a7d91da&LoginRedirect=true&returnurl=%2f"
      },
      {
        // Still waiting on this document (Aug 12). Swap comingSoon:true for
        // a real url once it exists.
        name: "Peer Support",
        desc: "Peer support program",
        url: "#",
        comingSoon: true
      }
    ]
  },

  /* ---------------------------------------------------------- */
  {
    category: "Reference",
    accent: "90,184,190",
    icon: "map",
    items: [
      {
        name: "what3words",
        desc: "3-word location addressing",
        url: "https://play.google.com/store/apps/details?id=com.what3words.android",
        android: "https://play.google.com/store/apps/details?id=com.what3words.android",
        ios: "https://apps.apple.com/us/app/id657878530",
        app: true, store: true
      },
      {
        name: "IRPG",
        desc: "Incident Response Pocket Guide (2025)",
        url: "https://play.google.com/store/apps/details?id=com.irpg",
        android: "https://play.google.com/store/apps/details?id=com.irpg",
        ios: "https://apps.apple.com/us/app/id1562135017",
        app: true, store: true
      },
      {
        // These two REPLACE WISER, which was in the source doc.
        //
        // The National Library of Medicine discontinued WISER in February
        // 2023. Installed copies still open, but the chemical data has been
        // frozen since — it is no longer updated and no longer maintained.
        // A hazmat reference with stale data is worse than no tile at all,
        // so it is deliberately not listed here.
        //
        // ERG (US DOT / PHMSA) and CAMEO Chemicals (NOAA) are the current,
        // free, actively-maintained replacements and are what NLM's own
        // shutdown notice points people toward.
        //
        // android fixed (Aug 14) — gov.dot.phmsa.erg2 404s now (confirmed
        // in-browser). Reported broken by a user; gov.nih.nlm.erg2012 is
        // the correct current package (re-verified in-browser: "ERG for
        // Android", publisher PHMSA, 1M+ downloads, official USDOT ERG —
        // the odd nih.nlm namespace is just historical, not a wrong app).
        // ios re-verified Aug 14, still correct, unchanged.
        name: "ERG",
        desc: "DOT Emergency Response Guidebook — hazmat",
        url: "https://play.google.com/store/apps/details?id=gov.nih.nlm.erg2012",
        android: "https://play.google.com/store/apps/details?id=gov.nih.nlm.erg2012",
        ios: "https://apps.apple.com/us/app/id1597142669",
        app: true, store: true
      },
      {
        name: "CAMEO Chemicals",
        desc: "NOAA chemical database — hazmat response",
        url: "https://play.google.com/store/apps/details?id=gov.noaa.cameochemical",
        android: "https://play.google.com/store/apps/details?id=gov.noaa.cameochemical",
        ios: "https://apps.apple.com/us/app/id1151912682",
        app: true, store: true
      }
    ]
  },

  /* ----------------------------------------------------------
     Baytown has no station WiFi, so nothing in this section can load on a
     phone — on any network, ever. Rather than shipping tiles that always
     fail, tapping one COPIES the address so it can be pasted on a city
     computer. See the `intranet` flag at the top of this file.
     ---------------------------------------------------------- */
  {
    category: "Desktop / City Network",
    accent: "125,142,163",
    icon: "target",
    items: [
      {
        // Internal hostname on a nonstandard port. Expect a certificate
        // warning even on a city machine.
        name: "CAD",
        desc: "Computer aided dispatch",
        url: "https://cobbss76prod:1914/tx-baytown/vdxcad/web_components/bss/firebss.html",
        intranet: true
      },
      {
        // Plain http:// — a browser would refuse to navigate here from an
        // https page anyway (mixed content). Copy-only is the right handling
        // for a second reason.
        name: "HR Policy Manuals",
        desc: "City policy manual",
        url: "http://cobvision.cibaytown.net/employee-resources/policy-manual",
        intranet: true
      },
      {
        name: "Executime",
        desc: "Timekeeping (Tyler / Okta)",
        url: "https://tyler-baytowntx.okta.com/",
        intranet: true
      },
      {
        name: "IT Ticket Center",
        desc: "Track-It self service",
        url: "https://cobtrackit/TrackIt/SelfService/Account/LogIn",
        intranet: true
      },
      {
        name: "Training Request",
        desc: "FD training request form",
        url: "https://coblf12app/Forms/FDTR",
        intranet: true
      },
      {
        name: "Tuition Assistance",
        desc: "Tuition assistance application",
        url: "https://coblf12app/Forms/Tuition-Assistance",
        intranet: true
      },
      {
        // Still pending (Aug 12) — no URL yet. Guessing it lives at
        // coblf12app like its neighbors above, but not shipping a guess.
        // Once it exists, add the real url AND intranet:true (it'll behave
        // like the rest of this section — copy, not navigate).
        name: "Uniform Request",
        desc: "Uniform request form",
        url: "#",
        comingSoon: true
      }
    ]
  }
];
