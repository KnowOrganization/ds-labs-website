"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Cluster, ResourceCard, Universe } from "@/lib/types";
import { isFileVideo } from "@/lib/video";
import { copyText } from "@/lib/clipboard";
import { initStudio, type StudioEngine } from "./engine";

export interface StudioFeatures {
  search: boolean;
  minimap: boolean;
  follow: boolean;
}

interface Props {
  universe: Universe;
  features: StudioFeatures;
}

export default function Studio({ universe, features }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<StudioEngine | null>(null);
  const [selected, setSelected] = useState<ResourceCard | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clusterById = useMemo(() => {
    const m = new Map<string, Cluster>();
    universe.clusters.forEach((c) => m.set(c.id, c));
    return m;
  }, [universe]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const engine = initStudio({
      root,
      universe,
      onOpenCard: (card) => {
        setSelected(card);
        engine.centerOnCard(card);
      },
      onCloseCard: () => setSelected(null),
    });
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [universe]);

  useEffect(() => {
    setCopied(false);
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, [selected]);

  function closeDetail() {
    setSelected(null);
    engineRef.current?.clearActive();
  }

  function onCopyPrompt() {
    if (!selected) return;
    void copyText(selected.prompt).then((ok) => {
      if (!ok) return;
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1500);
    });
  }

  const cluster = selected ? clusterById.get(selected.cluster) : null;

  return (
    <div className="studio" ref={rootRef}>
      {/* stage */}
      <div id="viewport">
        <canvas id="bg-canvas" />
        <div id="world" />
      </div>

      {/* HUD */}
      <header className="topbar">
        <div className="brand-mark fade-in">
          <span className="star" />
          DS&nbsp;LABS<span className="muted">&nbsp;/ resource studio</span>
        </div>
        <div className="top-right">
          {features.search && (
            <label className="search-wrap fade-in">
              <span className="ico">⌕</span>
              <input
                id="search"
                type="text"
                placeholder="search the studio…"
                autoComplete="off"
                spellCheck={false}
              />
              <span id="search-count" />
            </label>
          )}
          {features.follow && (
            <a
              className="pill-btn fade-in"
              href="https://instagram.com/dslabs"
              target="_blank"
              rel="noopener noreferrer"
            >
              Follow<span className="full">&nbsp;@dslabs</span>
            </a>
          )}
        </div>
      </header>

      <nav className="warp-bar fade-in">
        <div className="chips">
          <button className="home-btn">
            <span className="home-ico" />
            Home
          </button>
          <span className="sep" />
          {/* cluster chips injected by the engine */}
        </div>
      </nav>

      <div className="controls fade-in">
        <div className="stack">
          <button className="overview-btn" aria-label="Overview" title="See everything">
            ⊹
          </button>
        </div>
      </div>

      {features.minimap && (
        <div className="minimap fade-in">
          <span className="mini-view" />
        </div>
      )}

      <div className="explore-hint">
        <span className="k">drag</span> to roam · <span className="k">scroll</span> to zoom
      </div>

      {/* detail overlay */}
      <div className={`detail${selected ? " open" : ""}`}>
        <div className="detail-scrim" onClick={closeDetail} />
        {selected && cluster && (
          <aside
            className="detail-panel"
            style={{ ["--accent" as string]: cluster.color }}
          >
            <div className="d-top">
              <span className="d-kick">{cluster.kicker}</span>
              <button className="d-close" aria-label="Close" onClick={closeDetail}>
                ✕
              </button>
            </div>
            <h2 className="d-title">{selected.title}</h2>

            {selected.mediaUrl && (
              <div className={selected.mediaKind === "image" ? "d-media" : "d-video"}>
                {selected.mediaKind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="d-media-img"
                    src={selected.mediaUrl}
                    alt={selected.title}
                  />
                ) : isFileVideo(selected.mediaUrl) ? (
                  <video
                    className="d-video-el"
                    src={selected.mediaUrl}
                    title={selected.title}
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <iframe
                    src={selected.mediaUrl}
                    title={selected.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </div>
            )}

            <div className="d-prompt">
              <span className="lbl">The prompt</span>
              <pre className="d-prompt-text">{selected.prompt}</pre>
              <button className="d-copy" type="button" onClick={onCopyPrompt}>
                {copied ? "✓ Copied" : "Copy prompt"}
              </button>
            </div>

            <div className="d-comment">
              <span className="lbl">How to unlock</span>
              <div className="cmt">
                <span className="bubble">
                  💬 comment “<span className="d-word">{selected.word}</span>”
                </span>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
