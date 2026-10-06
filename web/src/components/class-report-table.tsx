"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";

export interface ReportColumn { course: string; missions: { id: string; label: string; title: string; boss: boolean }[] }
export interface ReportCell { score: number; attempts: number; completed: boolean }
export interface ReportRow {
  id: string;
  name: string;
  title: string | null;
  avatar: React.ReactNode;
  rankKey: string;
  rankColor: string;
  xp: number;
  lastSeen: string;
  /** Días sin entrar (null = nunca). */
  inactiveDays: number | null;
  streak: number;
  done: number;
  total: number;
  cells: Record<string, ReportCell | null>;
  /** Página de detalle del estudiante. */
  href?: string;
  action?: React.ReactNode;
}

type Filter = "todos" | "apoyo" | "inactivos";
type Sort = "nombre" | "avance" | "actividad";

const needsSupport = (r: ReportRow) => r.inactiveDays === null || r.inactiveDays >= 7 || Object.values(r.cells).some((c) => c && !c.completed);
const inactive = (r: ReportRow) => r.inactiveDays === null || r.inactiveDays >= 7;

/** Tabla del informe de la clase: búsqueda, filtros, orden y exportación a CSV (Excel). */
export function ClassReportTable({ columns, rows, passMark, fileName, editable }: { columns: ReportColumn[]; rows: ReportRow[]; passMark: number; fileName: string; editable: boolean }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");
  const [sort, setSort] = useState<Sort>("nombre");
  const missions = columns.flatMap((c) => c.missions);

  const shown = useMemo(() => {
    const words = q.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").split(/\s+/).filter(Boolean);
    const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
    const list = rows.filter((r) => words.every((w) => norm(r.name).includes(w)) && (filter === "todos" || (filter === "apoyo" ? needsSupport(r) : inactive(r))));
    const by: Record<Sort, (a: ReportRow, b: ReportRow) => number> = {
      nombre: (a, b) => a.name.localeCompare(b.name, "es"),
      avance: (a, b) => b.done - a.done || a.name.localeCompare(b.name, "es"),
      actividad: (a, b) => (a.inactiveDays ?? 9999) - (b.inactiveDays ?? 9999),
    };
    return [...list].sort(by[sort]);
  }, [rows, q, filter, sort]);

  function exportCsv() {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const head = ["Estudiante", "Rango", "XP", "Última actividad", "Misiones superadas", "Avance %", ...missions.map((m) => `${m.label} · ${m.title}`)];
    const lines = rows.map((r) => [r.name, r.rankKey, r.xp, r.lastSeen, `${r.done}/${r.total}`, r.total ? Math.round((r.done / r.total) * 100) : 0,
      ...missions.map((m) => { const c = r.cells[m.id]; return c ? `${c.score}%` : ""; })]);
    // BOM + «;» para que Excel en español lo abra con tildes y en columnas.
    const csv = "﻿" + [head, ...lines].map((l) => l.map(esc).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `${fileName}.csv` });
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const counts: Record<Filter, number> = { todos: rows.length, apoyo: rows.filter(needsSupport).length, inactivos: rows.filter(inactive).length };
  const FILTERS: [Filter, string][] = [["todos", "Todos"], ["apoyo", "Necesitan apoyo"], ["inactivos", "Sin actividad esta semana"]];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <label htmlFor="buscar-est" className="sr-only">Buscar estudiante</label>
          <input id="buscar-est" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar estudiante" className="input !min-h-9 !pl-9 text-sm" />
        </div>
        <div role="group" aria-label="Filtrar estudiantes" className="flex flex-wrap gap-1">
          {FILTERS.map(([f, label]) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${filter === f ? "bg-[#15103f] text-white" : "text-muted hover:bg-[#eef0f5] hover:text-text"}`}>
              {label} <span className={filter === f ? "text-white/70" : "text-muted"}>{counts[f]}</span>
            </button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-2 text-sm text-muted">Ordenar por
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="input !min-h-9 !w-auto !py-1 text-sm">
            <option value="nombre">Nombre</option>
            <option value="avance">Avance</option>
            <option value="actividad">Actividad reciente</option>
          </select>
        </label>
        <button type="button" onClick={exportCsv} className="btn btn-secondary btn-sm"><Icon name="download" className="size-4" /> Exportar a Excel</button>
      </div>

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <caption className="sr-only">Avance de cada estudiante. Cada casilla muestra la mejor nota de la misión.</caption>
          <thead className="border-b border-line bg-[#f8f8fc] text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-[#f8f8fc] px-4 py-3">Estudiante</th>
              <th scope="col" className="px-3 py-3">Avance</th>
              <th scope="col" className="px-3 py-3">Última vez</th>
              {columns.map((c) => (
                <th key={c.course} scope="colgroup" colSpan={c.missions.length} className="border-l border-line px-3 py-3 text-center">{c.course}</th>
              ))}
              {editable && <th scope="col" className="px-3 py-3"><span className="sr-only">Acciones</span></th>}
            </tr>
            <tr>
              <th className="sticky left-0 z-10 bg-[#f8f8fc]" />
              <th colSpan={2} />
              {columns.flatMap((c) => c.missions.map((m, i) => (
                <th key={m.id} scope="col" title={m.title} className={`px-1 pb-2 text-center font-semibold normal-case ${i === 0 ? "border-l border-line" : ""}`}>
                  {m.boss ? <Icon name="crown" className="mx-auto size-4 text-[#a86a00]" /> : m.label}<span className="sr-only">{m.title}</span>
                </th>
              )))}
              {editable && <th />}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.length === 0 && (
              <tr><td colSpan={3 + missions.length + (editable ? 1 : 0)} className="px-4 py-8 text-center text-muted">Ningún estudiante coincide con el filtro.</td></tr>
            )}
            {shown.map((r) => {
              const pct = r.total ? Math.round((r.done / r.total) * 100) : 0;
              return (
                <tr key={r.id} className="group hover:bg-[#fafafd]">
                  <th scope="row" className="sticky left-0 z-10 bg-white px-4 py-3 font-semibold group-hover:bg-[#fafafd]">
                    <span className="flex items-center gap-2.5">
                      {r.avatar}
                      <span className="min-w-0">
                        {r.href ? <Link href={r.href} className="block truncate hover:text-[#4a22c9] hover:underline">{r.name}</Link> : <span className="block truncate">{r.name}</span>}
                        <span className="flex items-center gap-1.5 text-xs font-normal text-muted">
                          <span className="rounded px-1 text-[0.65rem] font-extrabold text-[#14123b]" style={{ background: r.rankColor }}>{r.rankKey}</span>
                          {r.xp} XP{r.title && <> · «{r.title}»</>}
                        </span>
                      </span>
                    </span>
                  </th>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-[#eceef4]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Avance de ${r.name}`}>
                        <span className="block h-full rounded-full bg-[#4a22c9]" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="tabular-nums text-muted">{r.done}/{r.total}</span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className={`badge ${r.inactiveDays === null || r.inactiveDays >= 7 ? "badge-warn" : r.inactiveDays <= 1 ? "badge-ok" : "badge-muted"}`}>{r.lastSeen}</span>
                    {r.streak > 1 && <span className="ml-1.5 inline-flex items-center gap-0.5 text-xs text-muted"><Icon name="flame" className="size-3.5 text-[#c2410c]" />{r.streak}</span>}
                  </td>
                  {columns.flatMap((c) => c.missions.map((m, i) => {
                    const cell = r.cells[m.id];
                    const tone = !cell ? "bg-[#f1f2f6] text-[#9a9cb3]" : cell.completed ? "bg-[#e7f6ee] text-[#0f6b3a]" : "bg-[#fff4d6] text-[#8a5a00]";
                    const label = !cell ? "Sin intentar" : `${cell.score}% en ${cell.attempts} ${cell.attempts === 1 ? "intento" : "intentos"}${cell.completed ? "" : ` (aún no llega al ${passMark}%)`}`;
                    return (
                      <td key={m.id} className={`px-1 py-2 text-center ${i === 0 ? "border-l border-line" : ""}`}>
                        <span title={label} className={`inline-block min-w-11 rounded-md px-1.5 py-1 text-xs font-semibold tabular-nums ${tone}`}>{cell ? `${cell.score}%` : "—"}<span className="sr-only">: {label}</span></span>
                      </td>
                    );
                  }))}
                  {editable && <td className="px-3 py-2 text-right">{r.action}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="flex flex-wrap gap-4 text-xs text-muted">
        <span><span className="mr-1 inline-block size-3 rounded-sm bg-[#cdebd9] align-middle" />Superada ({passMark}% o más)</span>
        <span><span className="mr-1 inline-block size-3 rounded-sm bg-[#ffe7a8] align-middle" />Intentada, aún sin superar</span>
        <span><span className="mr-1 inline-block size-3 rounded-sm bg-[#e4e6ee] align-middle" />Sin intentar</span>
      </p>
    </div>
  );
}
