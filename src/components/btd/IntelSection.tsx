const INTEL_GROUPS = [
  {
    title: "Weather Intel",
    summary: "Monitor conditions. Assess impacts. Anticipate risk.",
    panel: "weather/weather_category_box.png",
    items: [
      ["Storm", "weather/01_storm.png"],
      ["Heat", "weather/02_heat.png"],
      ["Cold", "weather/03_cold.png"],
      ["Drought", "weather/04_drought.png"],
      ["Rain", "weather/05_rain.png"],
    ],
  },
  {
    title: "Defense Demand",
    summary: "Track procurement. Monitor capabilities. Follow the money.",
    panel: "defense/defense_category_box.png",
    items: [
      ["Contract", "defense/01_contract.png"],
      ["Fighter jet", "defense/02_fighter_jet.png"],
      ["Drone", "defense/03_drone.png"],
      ["Military vehicle", "defense/04_military_vehicle.png"],
      ["Defense budget", "defense/05_defense_budget.png"],
    ],
  },
  {
    title: "Geo Map",
    summary: "Analyze regions. Track movements. Spot opportunities.",
    panel: "geo/geo_category_box.png",
    items: [
      ["Global hotspot", "geo/01_global_hotspot.png"],
      ["Route", "geo/02_route.png"],
      ["Mountain", "geo/03_mountain.png"],
      ["Forest", "geo/04_forest.png"],
      ["Water", "geo/05_water.png"],
    ],
  },
  {
    title: "Base & Resources",
    summary: "Monitor supply chains. Track key resources. Understand markets.",
    panel: "resources/resources_category_box.png",
    items: [
      ["Oil", "resources/01_oil.png"],
      ["Wheat", "resources/02_wheat.png"],
      ["Copper", "resources/03_copper.png"],
      ["Natural gas", "resources/04_natural_gas.png"],
      ["Power and energy", "resources/05_power_energy.png"],
    ],
  },
  {
    title: "Critical Alerts",
    summary: "Surface key events. Spot emerging risks. Stay ahead.",
    panel: "alerts/alerts_category_box.png",
    items: [
      ["Siren", "alerts/01_siren.png"],
      ["Warning", "alerts/02_warning.png"],
      ["Radio alert", "alerts/03_radio_alert.png"],
      ["Breaking news", "alerts/04_breaking_news.png"],
      ["Global alert", "alerts/05_global_alert.png"],
    ],
  },
] as const;

export function IntelSection() {
  return (
    <section id="intel" className="mil-panel p-5">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Field intel
          </p>
          <h2 className="mt-1 text-xl font-bold leading-tight">
            Intel — context behind the dip
          </h2>
        </div>
        <p className="max-w-md text-[11px] leading-relaxed text-muted-foreground">
          Macro context the Sniper board reads alongside price: weather, defense demand,
          geography, resources and critical alerts.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {INTEL_GROUPS.map((group) => (
          <article
            key={group.title}
            className="rounded-sm border border-border bg-surface-2 p-3 transition-colors hover:border-primary/50"
          >
            <div className="flex items-center gap-3">
              <img
                src={`/theme/intel/${group.panel}`}
                alt=""
                width={48}
                height={48}
                draggable={false}
                className="pixel h-11 w-11 shrink-0"
              />
              <div className="min-w-0">
                <h3 className="text-sm font-semibold leading-tight">{group.title}</h3>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                  {group.summary}
                </p>
              </div>
            </div>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {group.items.map(([label, file]) => (
                <li
                  key={file}
                  className="flex items-center gap-1.5 rounded-sm border border-border bg-surface px-1.5 py-1 text-[10px] text-muted-foreground"
                >
                  <img
                    src={`/theme/intel/${file}`}
                    alt=""
                    width={20}
                    height={20}
                    draggable={false}
                    className="pixel h-4 w-4"
                  />
                  {label}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
