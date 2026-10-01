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
    <section id="intel" className="mil-panel p-3 sm:p-4" aria-labelledby="intel-title">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            01 / Field intel session
          </p>
          <h2 id="intel-title" className="pixel-title mt-1 text-xl">
            Intel — context behind the dip
          </h2>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
          Visual reference library for the macro signals the Sniper board reads alongside price.
        </p>
      </div>

      <div className="space-y-4">
        {INTEL_GROUPS.map((group) => (
          <section
            key={group.title}
            className="grid gap-2 border-b border-border pb-4 last:border-0 last:pb-0 md:grid-cols-[minmax(170px,0.8fr)_minmax(0,2.8fr)] md:items-center"
            aria-label={group.title}
          >
            <h3 className="pixel-title text-lg text-primary md:hidden">{group.title}</h3>
            <img
              src={`/theme/intel/${group.panel}`}
              alt={`${group.title}. ${group.summary}`}
              className="pixel hidden h-auto w-full md:block"
              width={340}
              height={250}
              loading="lazy"
              decoding="async"
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
              {group.items.map(([label, file]) => (
                <img
                  key={file}
                  src={`/theme/intel/${file}`}
                  alt={`${group.title}: ${label}`}
                  className="pixel h-auto w-full"
                  width={200}
                  height={235}
                  loading="lazy"
                  decoding="async"
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
