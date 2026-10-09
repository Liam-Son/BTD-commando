import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { CommandoHeader } from "@/components/btd/CommandoHeader";
import {
  consent,
  emitData,
  getRecord,
  ownerId,
  setConsent,
  setLocalChat,
  syncDataset,
  writeData,
  restoreDatasets,
  type Dataset,
} from "@/lib/data-resilience";
import { defaultBook, loadSergeantBook } from "@/lib/sergeant";
import { loadMedic } from "@/lib/medic";
import { supabase } from "@/integrations/supabase/client";
import {
  DATASETS,
  key,
  makeBackup,
  inspectBackup,
  validateDataset,
  parseRecord,
} from "@/lib/data-resilience-core.mjs";
export const Route = createFileRoute("/data-tools")({
  head: () => ({ meta: [{ title: "Data tools | BTD Commando" }] }),
  component: DataTools,
});
function DataTools() {
  const { user, loading } = useAuth();
  const owner = ownerId(user);
  const [tick, setTick] = useState(0);
  const [notice, setNotice] = useState("");
  const [sensitiveExport, setSensitiveExport] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [versions, setVersions] = useState<Record<string, string | null>>({});
  const [cloudReady, setCloudReady] = useState(false);
  useEffect(() => {
    setPreview(null);
    setConfirmed(false);
    setCloudReady(false);
    const timer = setInterval(() => setTick((x) => x + 1), 2000);
    return () => clearInterval(timer);
  }, [owner]);
  const c = typeof window !== "undefined" ? consent(owner) : null;
  function records() {
    const out: any = {};
    for (const id of DATASETS) {
      try {
        out[id] = getRecord(owner, id);
      } catch {}
    }
    return out;
  }
  function download(text: string, name: string) {
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function exportBackup() {
    try {
      const ids = DATASETS.filter(
        (id: string) => sensitiveExport || !["medic", "chat"].includes(id),
      );
      download(
        JSON.stringify(await makeBackup(owner, records(), ids), null, 2),
        "BTD-backup-v1.json",
      );
      setNotice("Backup downloaded. Keep it securely outside this browser.");
    } catch (e) {
      setNotice(String(e));
    }
  }
  async function stageText(text: string) {
    const b = await inspectBackup(text);
    setPreview(b);
    setConfirmed(false);
    const v: Record<string, string | null> = {};
    for (const id of Object.keys(b.datasets)) {
      try {
        v[id] = getRecord(owner, id as Dataset)?.token ?? null;
      } catch {
        v[id] = "CORRUPT";
      }
    }
    setVersions(v);
  }
  async function legacyPreview() {
    try {
      const datasets: any = {};
      const raw = localStorage.getItem("btd.sergeant.v2");
      if (raw) {
        const v = JSON.parse(raw);
        if (!validateDataset("sergeant", v))
          throw Error("Legacy Sergeant invalid; original preserved");
        datasets.sergeant = v;
      }
      const medicKeys = [
        "btd.medic.checkins.v1",
        "btd.medic.logs.v1",
        "btd.medic.reminders.v1",
        "btd.medic.settings.v1",
        "btd.medic.buddy.v1",
      ];
      for (const k of medicKeys) {
        const value = localStorage.getItem(k);
        if (value) JSON.parse(value);
      }
      if (medicKeys.some((k) => localStorage.getItem(k))) datasets.medic = loadMedic(localStorage);
      const legacyCommunication: Array<readonly [Dataset, string]> = [
        ["notes", "btd.communication.notes.v1"],
        ["echo", "btd.communication.echo-log.v1"],
      ];
      for (const [id, k] of legacyCommunication) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const v = JSON.parse(raw);
          if (!validateDataset(id, v)) throw Error("Legacy " + id + " invalid; original preserved");
          datasets[id] = v;
        }
      }
      const r: any = {};
      for (const [id, data] of Object.entries(datasets)) r[id] = { data };
      await stageText(JSON.stringify(await makeBackup("guest", r, Object.keys(datasets))));
      setNotice(
        "Review legacy browser data before importing it into this scope. No cloud consent is granted by import.",
      );
    } catch (e) {
      setNotice(String(e));
    }
  }
  async function restore() {
    if (!preview || !confirmed) return;
    try {
      await restoreDatasets(owner, preview.datasets, versions);
      setPreview(null);
      setConfirmed(false);
      setNotice("Restore completed. Cloud permissions were NOT imported.");
    } catch (e) {
      setNotice(String(e));
    }
  }
  async function checkCloud() {
    try {
      if (!user) throw Error("Sign in first");
      const { error } = await (supabase as any)
        .from("btd_dataset_snapshots")
        .select("dataset,revision")
        .eq("user_id", user.id)
        .limit(1);
      if (error) throw error;
      setCloudReady(true);
      setNotice("Account cloud backend reachable. Every dataset remains off until you opt in.");
    } catch (e) {
      setCloudReady(false);
      setNotice("Cloud backend unavailable or migration not applied: " + String(e));
    }
  }
  async function recover(id: Dataset) {
    try {
      const previous = localStorage.getItem(key(owner, id) + ":previous");
      if (!previous)
        throw Error("No previous good version. Restore from an external backup instead.");
      const good = parseRecord(previous, owner, id);
      const observed = localStorage.getItem(key(owner, id));
      if (
        !window.confirm(
          "Recover " + id + " from previous local version? Current raw data is quarantined first.",
        )
      )
        return;
      if (!navigator.locks) throw Error("Recovery requires Web Locks");
      await navigator.locks.request(key(owner, id), async () => {
        if (localStorage.getItem(key(owner, id)) !== observed)
          throw Error("Data changed; review recovery again");
        if (observed)
          localStorage.setItem("btd.quarantine:" + Date.now() + ":" + owner + ":" + id, observed);
        const recovered = {
          ...good,
          revision: good.revision + 1,
          token: crypto.randomUUID(),
          dirty: true,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(key(owner, id), JSON.stringify(recovered));
        emitData();
      });
      setNotice("Previous version recovered; original retained in quarantine.");
    } catch (e) {
      setNotice(String(e));
    }
  }
  async function resolve(id: Dataset, choice: "local" | "cloud") {
    try {
      const raw = localStorage.getItem("btd.conflict:" + owner + ":" + id);
      if (!raw) throw Error("No recorded conflict");
      const remote = JSON.parse(raw).remote;
      const local = getRecord(owner, id);
      if (
        !window.confirm(
          "Resolve " + id + " conflict using " + choice + " version? Export a backup first.",
        )
      )
        return;
      if (choice === "cloud") {
        if (!remote)
          throw Error(
            "Cloud copy deleted. Export local then revoke sync or choose local to recreate.",
          );
        await writeData(owner, id, remote.payload, local?.token ?? null, {
          cloudRevision: remote.revision,
          dirty: false,
        });
      } else {
        if (!local) throw Error("No local data");
        await writeData(owner, id, local.data, local.token, {
          cloudRevision: remote?.revision ?? 0,
          dirty: true,
        });
      }
      localStorage.removeItem("btd.conflict:" + owner + ":" + id);
      setNotice("Conflict resolved explicitly.");
    } catch (e) {
      setNotice(String(e));
    }
  }
  async function removeCloud(id: Dataset) {
    if (
      !user ||
      !window.confirm(
        "Delete only your cloud " + id + " snapshot? Local copy remains; cloud sync is revoked.",
      )
    )
      return;
    setConsent(owner, id, false);
    try {
      const { error } = await (supabase as any)
        .from("btd_dataset_snapshots")
        .delete()
        .eq("user_id", owner)
        .eq("dataset", id);
      if (error) throw error;
      setNotice("Cloud copy deleted; local retained.");
    } catch (e) {
      setNotice("Deletion failed; sync remains revoked. " + String(e));
    }
  }
  return (
    <main className="min-h-screen bg-background">
      <CommandoHeader signedIn={!!user} />
      <div className="mx-auto max-w-[1100px] space-y-4 p-4">
        <section className="mil-panel p-5">
          <p className="text-xs text-primary">DATA TOOLS · version 1 · paper only</p>
          <h1 className="pixel-title text-3xl">Backup, recovery & sync</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Scope:{" "}
            {loading ? "checking account" : user ? "signed-in account" : "guest / this browser"}.
            Guest and each account have separate storage. Old browser records require reviewed
            import below. Local copies are not device-loss backups. Keep an external backup.
          </p>
          <Link to="/sergeant" className="text-xs text-primary">
            Return to paper desk
          </Link>
        </section>
        {notice && (
          <p role="status" className="mil-panel p-3 text-sm">
            {notice}
          </p>
        )}
        <section className="mil-panel space-y-3 p-5">
          <h2 className="text-lg font-bold">Full versioned backup</h2>
          <p className="text-xs text-muted-foreground">
            JSON includes full selected datasets, schema version and SHA-256 integrity checksum. No
            auth tokens, settings consent or caches. Files are plaintext, NOT encrypted; health and
            conversations are excluded by default. Backups never grant cloud permission.
          </p>
          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={sensitiveExport}
              onChange={(e) => setSensitiveExport(e.target.checked)}
            />
            Explicitly include Medic and saved chat in this plaintext export
          </label>
          <button className="mil-tab" disabled={loading} onClick={() => void exportBackup()}>
            Download backup
          </button>
          <button className="mil-tab" disabled={loading} onClick={() => void legacyPreview()}>
            Preview existing legacy browser data
          </button>
          <label className="block text-xs">
            Load backup for validation and preview
            <input
              type="file"
              accept=".json,application/json"
              className="block mt-2"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f)
                  void f
                    .text()
                    .then(stageText)
                    .catch((e) => setNotice(String(e)));
              }}
            />
          </label>
          {preview && (
            <div className="border border-warn p-3">
              <p>
                Preview: {Object.keys(preview.datasets).join(", ") || "empty"} · source{" "}
                {preview.sourceOwner === owner ? "same scope" : "different scope / guest"}. Existing
                selected datasets will be replaced.
              </p>
              <label className="block my-2">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />{" "}
                I reviewed the datasets and confirm replacement in this account/device scope.
              </label>
              <button disabled={!confirmed} onClick={() => void restore()} className="mil-tab">
                Confirm restore
              </button>
            </div>
          )}
        </section>
        <section className="mil-panel space-y-3 p-5">
          <h2 className="text-lg font-bold">Account cloud sync & offline recovery</h2>
          <p className="text-xs text-muted-foreground">
            All uploads default OFF for each account on this browser. Consent is never copied in a
            backup. Unsynced local snapshots retry when online; conflicting device changes require
            your choice. Revoking stops new sends but does not erase existing cloud copies. An
            already submitted request may finish.
          </p>
          <button className="mil-tab" disabled={!user} onClick={() => void checkCloud()}>
            Check account backend
          </button>
          <p className="text-xs">
            {typeof window !== "undefined"
              ? (sessionStorage.getItem("btd.cloud-status:" + owner) ?? "Not checked / uploads off")
              : "Checking"}
          </p>
          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={!!c?.localChat}
              onChange={(e) => {
                setLocalChat(owner, e.target.checked);
                setTick((t) => t + 1);
              }}
            />
            Save advisor conversations locally (optional; otherwise session-only)
          </label>
          {DATASETS.map((id: Dataset) => {
            let r: any = null,
              problem = "";
            try {
              if (typeof window !== "undefined") r = getRecord(owner, id);
            } catch (e) {
              problem = String(e);
            }
            const conflict =
              typeof window !== "undefined" &&
              !!localStorage.getItem("btd.conflict:" + owner + ":" + id);
            return (
              <div key={id} className="border border-border p-3">
                <p className="font-bold uppercase">
                  {id}{" "}
                  <span className="text-xs font-normal">
                    {r
                      ? "revision " +
                        r.revision +
                        (r.dirty ? " · pending local changes" : " · synchronized")
                      : "no stored record"}
                  </span>
                </p>
                <p className="text-xs text-warn">{problem}</p>
                <label className="flex gap-2 my-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!c?.datasets?.[id]}
                    disabled={
                      !user ||
                      (!cloudReady && !c?.datasets?.[id]) ||
                      (id === "chat" && !c?.localChat)
                    }
                    onChange={(e) => {
                      setConsent(owner, id, e.target.checked);
                      setTick((t) => t + 1);
                    }}
                  />
                  I explicitly allow{" "}
                  {id === "medic"
                    ? "my health/wellness data"
                    : id === "chat"
                      ? "my saved conversation data"
                      : id + " data"}{" "}
                  to upload to my account
                </label>
                <button
                  className="mil-tab"
                  disabled={!c?.datasets?.[id]}
                  onClick={() =>
                    void syncDataset(owner, id)
                      .then(() => setNotice("Sync checked"))
                      .catch((e) => setNotice(String(e)))
                  }
                >
                  Sync now
                </button>
                <button className="mil-tab" onClick={() => void recover(id)}>
                  Recover previous local version
                </button>
                <button className="mil-tab" disabled={!user} onClick={() => void removeCloud(id)}>
                  Delete cloud copy
                </button>
                {conflict && (
                  <div className="text-warn">
                    Conflict detected. Export first.
                    <button className="mil-tab" onClick={() => void resolve(id, "local")}>
                      Keep local version
                    </button>
                    <button className="mil-tab" onClick={() => void resolve(id, "cloud")}>
                      Use cloud version
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
