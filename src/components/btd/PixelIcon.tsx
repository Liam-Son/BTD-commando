export function PixelIcon({
  name,
  alt = "",
  className = "pixel h-5 w-5",
}: {
  name: string;
  alt?: string;
  className?: string;
}) {
  return (
    <img
      src={`/theme/icons/${name}`}
      alt={alt}
      className={className}
      width={32}
      height={32}
      draggable={false}
    />
  );
}
export const ICONS = {
  idle: "01_idle.png",
  aim: "04_aim.png",
  sniperGun: "10_sniper.png",
  ammoBox: "20_ammo_box.png",
  grenade: "21_hand_grenade.png",
  supply: "26_supply_crate.png",
  target: "32_target.png",
  radar: "34_radar.png",
  score: "35_score.png",
  acquire: "36_acquire.png",
  watch: "37_watch.png",
  reduce: "38_reduce.png",
  standDown: "39_stand_down.png",
  kill: "40_kill.png",
  alert: "41_alert.png",
  ok: "42_ok.png",
  signal: "43_signal.png",
  paperBook: "48_paper_book.png",
  opsLog: "49_ops_log.png",
  sergeant: "50_sergeant_chat.png",
  medkit: "25_medkit.png",
} as const;
