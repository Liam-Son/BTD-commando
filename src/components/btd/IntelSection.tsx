const INTEL_GROUPS = [
  {
    title: "Weather Intel",
    summary: "Monitor conditions. Assess impacts. Anticipate risk.",
    panel: "weather/weather_category_box.png",
    items: [
      ["Storm", "weather/01_storm.png", "macro"],
      ["Heat", "weather/02_heat.png", "macro"],
      ["Cold", "weather/03_cold.png", "macro"],
      ["Drought", "weather/04_drought.png", "commodities"],
      ["Rain", "weather/05_rain.png", "commodities"],
    ],
  },
  {
    title: "Defense Demand",
    summary: "Track procurement. Monitor capabilities. Follow the money.",
    panel: "defense/defense_category_box.png",
    items: [
      ["Contract", "defense/01_contract.png", "regulation"],
      ["Fighter jet", "defense/02_fighter_jet.png", "defense"],
      ["Drone", "defense/03_drone.png", "defense"],
      ["Military vehicle", "defense/04_military_vehicle.png", "defense"],
      ["Defense budget", "defense/05_defense_budget.png", "defense"],
    ],
  },
] as const;

function IntelImage({
  file,
  alt,
  className,
  width,
  height,
}: {
  file: string;
  alt: string;
  className: string;
  width: number;
  height: number;
}) {
  const base = `/theme/intel/${file.replace(/\.png$/, "")}`;
  return (
    <picture>
      <source srcSet={`${base}.avif`} type="image/avif" />
      <source srcSet={`${base}.webp`} type="image/webp" />
      <img
        src={`/theme/intel/${file}`}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
}

export function IntelSection({
  activeCategory,
  onSelectCategory,
}: {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}) {
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
            <IntelImage
              file={group.panel}
              alt={`${group.title}. ${group.summary}`}
              className="pixel hidden h-auto w-full md:block"
              width={340}
              height={250}
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
              {group.items.map(([label, file, category]) => (
                <button
                  key={file}
                  type="button"
                  aria-label={`Show ${category} intelligence for ${label}`}
                  aria-pressed={activeCategory === category}
                  onClick={() => onSelectCategory(category)}
                  className={`w-full overflow-hidden border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                    activeCategory === category
                      ? "border-primary ring-1 ring-primary"
                      : "border-transparent hover:border-primary/60"
                  }`}
                >
                  <IntelImage
                    file={file}
                    alt=""
                    className="pixel block h-auto w-full"
                    width={200}
                    height={250}
                  />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
