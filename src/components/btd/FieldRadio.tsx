import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "btd.radio.v1";
const DEFAULT_VOLUME = 0.2;

const TRACKS = [
  {
    title: "Crypto",
    src: "/audio/night-watch/crypto.mp3",
  },
  {
    title: "Dark Fog",
    src: "/audio/night-watch/dark-fog.mp3",
  },
] as const;

type RadioPreference = "on" | "off";

function getTrack(index: number) {
  return TRACKS[index] ?? TRACKS[0];
}

type SavedRadioState = {
  preference: RadioPreference;
  volume: number;
  track: number;
};

function readSavedState(): SavedRadioState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const value = JSON.parse(raw) as Partial<SavedRadioState>;
    if (value.preference !== "on" && value.preference !== "off") return null;

    const volume =
      typeof value.volume === "number" && Number.isFinite(value.volume)
        ? Math.min(1, Math.max(0, value.volume))
        : DEFAULT_VOLUME;
    const track =
      typeof value.track === "number" &&
      Number.isInteger(value.track) &&
      value.track >= 0 &&
      value.track < TRACKS.length
        ? value.track
        : 0;

    return { preference: value.preference, volume, track };
  } catch {
    return null;
  }
}

function saveState(state: SavedRadioState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The radio still works when storage is unavailable.
  }
}

export function FieldRadio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const pendingPlayRef = useRef(false);
  const desiredPlayRef = useRef(false);
  const playRequestRef = useRef(0);
  const resumeAttemptedRef = useRef(false);
  const trackIndexRef = useRef(0);

  const [hydrated, setHydrated] = useState(false);
  const [preference, setPreference] = useState<RadioPreference | null>(null);
  const [activated, setActivated] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [trackIndex, setTrackIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [status, setStatus] = useState("Awaiting orders");

  const attemptPlay = useCallback(async (audio: HTMLAudioElement) => {
    const requestId = ++playRequestRef.current;
    desiredPlayRef.current = true;
    pendingPlayRef.current = true;
    setMediaError(false);
    setStatus("Tuning…");

    try {
      await audio.play();
      // The playing event is the source of truth for the playing UI.
    } catch (error) {
      if (requestId !== playRequestRef.current || !desiredPlayRef.current) return;

      pendingPlayRef.current = false;
      setIsPlaying(false);
      if (error instanceof DOMException && error.name !== "NotAllowedError") {
        setMediaError(true);
        setStatus("Signal lost. Tap radio to retry");
      } else {
        setStatus("Tap radio to resume");
      }
    }
  }, []);

  useEffect(() => {
    const saved = readSavedState();
    if (saved) {
      setPreference(saved.preference);
      setActivated(saved.preference === "on");
      setVolume(saved.volume);
      setTrackIndex(saved.track);
      trackIndexRef.current = saved.track;
      setStatus(saved.preference === "on" ? "Restoring channel…" : "Silent");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || preference !== "on" || resumeAttemptedRef.current) return;

    const audio = audioRef.current;
    if (!audio) return;

    resumeAttemptedRef.current = true;
    audio.volume = volume;
    audio.src = getTrack(trackIndexRef.current).src;
    audio.load();
    void attemptPlay(audio);
  }, [attemptPlay, hydrated, preference, volume]);

  if (!hydrated) return null;

  const track = getTrack(trackIndex);

  function persist(nextPreference: RadioPreference, nextVolume = volume, nextTrack = trackIndex) {
    saveState({
      preference: nextPreference,
      volume: nextVolume,
      track: nextTrack,
    });
  }

  function enableAndPlay() {
    const audio = audioRef.current;
    if (!audio) return;

    resumeAttemptedRef.current = true;
    setPreference("on");
    setActivated(true);
    persist("on");
    audio.volume = volume;

    if (mediaError || audio.getAttribute("src") !== track.src) {
      audio.src = track.src;
      audio.load();
    }

    void attemptPlay(audio);
  }

  function staySilent() {
    const audio = audioRef.current;
    desiredPlayRef.current = false;
    pendingPlayRef.current = false;
    playRequestRef.current += 1;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setPreference("off");
    setActivated(false);
    setIsPlaying(false);
    setMediaError(false);
    setStatus("Silent");
    persist("off");
  }

  function pauseByUser(audio: HTMLAudioElement) {
    desiredPlayRef.current = false;
    pendingPlayRef.current = false;
    playRequestRef.current += 1;
    audio.pause();
    setPreference("off");
    setIsPlaying(false);
    setStatus("Paused");
    persist("off");
  }

  function handlePrimaryAction() {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying || pendingPlayRef.current || !audio.paused) {
      pauseByUser(audio);
      return;
    }

    enableAndPlay();
  }

  function changeTrack(nextTrack: number, forcePlay = false) {
    const normalizedTrack =
      Number.isInteger(nextTrack) && nextTrack >= 0 && nextTrack < TRACKS.length ? nextTrack : 0;
    const next = getTrack(normalizedTrack);
    const audio = audioRef.current;
    const shouldContinue = Boolean(
      forcePlay || (audio && (!audio.paused || pendingPlayRef.current)),
    );

    trackIndexRef.current = normalizedTrack;
    setTrackIndex(normalizedTrack);
    if (preference) persist(preference, volume, normalizedTrack);

    desiredPlayRef.current = false;
    pendingPlayRef.current = false;
    playRequestRef.current += 1;

    if (!audio || !activated) {
      setStatus(`Channel selected · ${next.title}`);
      return;
    }

    audio.src = next.src;
    audio.load();

    if (shouldContinue && preference === "on") {
      void attemptPlay(audio);
    } else {
      setIsPlaying(false);
      setMediaError(false);
      setStatus(`Ready · ${next.title}`);
    }
  }

  function handleVolumeChange(nextVolume: number) {
    const normalized = Math.min(1, Math.max(0, nextVolume));
    setVolume(normalized);
    if (audioRef.current) audioRef.current.volume = normalized;
    if (preference) persist(preference, normalized);
  }

  return (
    <aside
      data-testid="field-radio"
      aria-label="Night Watch field radio"
      className="fixed z-50 flex w-64 max-w-[calc(100vw-1.5rem)] flex-col items-stretch gap-2 text-foreground"
      style={{
        bottom: "max(0.75rem, env(safe-area-inset-bottom))",
        right: "max(0.75rem, env(safe-area-inset-right))",
      }}
    >
      {preference === null ? (
        <div className="mil-panel px-3 py-2 shadow-xl">
          <p className="pixel-title text-sm text-primary">Night Watch</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Low-volume field music. Your choice stays on this device.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={enableAndPlay}
              className="min-h-9 flex-1 border border-primary bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
            >
              Enter hideout · sound on
            </button>
            <button
              type="button"
              onClick={staySilent}
              className="min-h-9 border border-border bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
            >
              Stay silent
            </button>
          </div>
        </div>
      ) : null}

      {expanded ? (
        <div id="night-watch-controls" className="mil-panel p-3 shadow-xl">
          <div className="mb-3 border-b border-border pb-2">
            <p className="pixel-title text-sm text-primary">Night Watch</p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{status}</p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="night-watch-volume" className="pixel-title text-sm text-primary">
              Volume
            </label>
            <span className="tabular text-xs text-muted-foreground">
              {Math.round(volume * 100)}%
            </span>
          </div>
          <input
            id="night-watch-volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(event) => handleVolumeChange(Number(event.target.value))}
            className="mt-1 w-full accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          <label
            htmlFor="night-watch-track"
            className="pixel-title mt-3 block text-sm text-primary"
          >
            Track
          </label>
          <div className="mt-1 flex gap-2">
            <select
              id="night-watch-track"
              value={trackIndex}
              onChange={(event) => changeTrack(Number(event.target.value))}
              className="min-h-10 min-w-0 flex-1 border border-border bg-input px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {TRACKS.map((item, index) => (
                <option key={item.src} value={index}>
                  {item.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => changeTrack((trackIndex + 1) % TRACKS.length)}
              className="min-h-10 border border-primary/60 bg-secondary px-3 text-xs font-semibold text-primary transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
              aria-label="Select next Night Watch track"
            >
              Next
            </button>
          </div>

          <p className="mt-3 border-t border-border pt-2 text-[11px] leading-relaxed text-muted-foreground">
            “Crypto” and “Dark Fog” by Kevin MacLeod ({" "}
            <a
              href="https://incompetech.com/"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              incompetech.com
            </a>
            ), licensed under{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              CC BY 4.0
            </a>
            .
            <a
              href="/audio/night-watch/LICENSE.md"
              target="_blank"
              rel="noreferrer"
              className="mt-1 block text-primary underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Track sources &amp; credits
            </a>
          </p>
        </div>
      ) : null}

      <div className="mil-panel ml-auto flex min-h-12 w-[5.5rem] overflow-hidden shadow-xl">
        <button
          type="button"
          onClick={handlePrimaryAction}
          aria-label={isPlaying ? "Pause Night Watch radio" : "Play Night Watch radio"}
          aria-pressed={isPlaying}
          className="relative flex w-12 shrink-0 items-center justify-center transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none"
        >
          <img
            src="/theme/icons/28_radio.png"
            alt=""
            width={32}
            height={32}
            draggable={false}
            className="pixel h-8 w-8 object-contain"
          />
          <span
            aria-hidden="true"
            className={
              isPlaying
                ? "absolute right-1 top-1 h-2 w-2 bg-up"
                : "absolute right-1 top-1 h-2 w-2 bg-muted-foreground/50"
            }
          />
          <span className="sr-only">Night Watch</span>
          <span aria-live="polite" className="sr-only">
            {status}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-label={expanded ? "Close Night Watch controls" : "Open Night Watch controls"}
          aria-expanded={expanded}
          aria-controls="night-watch-controls"
          className="w-10 shrink-0 border-l border-border text-lg text-primary transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none"
        >
          <span aria-hidden="true">{expanded ? "×" : "⋮"}</span>
        </button>
      </div>

      <audio
        ref={audioRef}
        data-testid="field-radio-audio"
        preload="none"
        onPlaying={() => {
          if (!desiredPlayRef.current) return;
          pendingPlayRef.current = false;
          setIsPlaying(true);
          setMediaError(false);
          setStatus(`Transmitting · ${getTrack(trackIndexRef.current).title}`);
        }}
        onPause={() => {
          setIsPlaying(false);
          if (!pendingPlayRef.current && !desiredPlayRef.current) setStatus("Paused");
        }}
        onWaiting={() => {
          if (desiredPlayRef.current) setStatus("Tuning…");
        }}
        onEnded={() => changeTrack((trackIndexRef.current + 1) % TRACKS.length, true)}
        onError={() => {
          if (!desiredPlayRef.current) return;
          pendingPlayRef.current = false;
          setIsPlaying(false);
          setMediaError(true);
          setStatus("Signal lost. Tap radio to retry");
        }}
      />
    </aside>
  );
}
