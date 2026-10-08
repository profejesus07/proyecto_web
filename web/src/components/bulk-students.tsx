"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { createStudentsAction, importStudentsAction, type BulkState } from "@/app/actions/students";
import { EN_TEXTO, Icon } from "@/components/icons";
import type { StudentRowIn } from "@/lib/student-import";

type Group = { code: string; name: string };
const empty = (): StudentRowIn => ({ name: "", login: "", password: "", group: "" });

/** Resultado: errores por fila, o la lista de cuentas creadas con sus credenciales. */
function Outcome({ state }: { state: BulkState }) {
  if (!state) return null;
  if (state.error) return <p role="alert" className="rounded-xl border border-[#f3c4bf] bg-[#fdecea] px-4 py-3 text-sm font-medium text-err">{state.error}</p>;
  if (state.errors?.length) {
    return (
      <div role="alert" className="space-y-2 rounded-xl border border-[#f3c4bf] bg-[#fdecea] p-4 text-sm">
        <p className="font-semibold text-err">No se creó ninguna cuenta. Corrige {state.errors.length === 1 ? "esta fila" : `estas ${state.errors.length} filas`} y vuelve a intentarlo:</p>
        <ul className="list-disc space-y-1 pl-5 text-text">
          {state.errors.map((e) => <li key={`${e.row}-${e.message}`}>{e.row ? <strong>Fila {e.row}:</strong> : null} {e.message}</li>)}
        </ul>
      </div>
    );
  }
  const rows = state.results ?? [];
  const created = rows.filter((r) => r.ok);
  function download() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [["Nombre", "Usuario o correo", "Contraseña", "Grupo"], ...created.map((r) => [r.name, r.login, r.password, r.group ?? ""])];
    const url = URL.createObjectURL(new Blob(["﻿" + lines.map((l) => l.map(esc).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "credenciales-estudiantes.csv" });
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  return (
    <section aria-label="Resultado de la carga" className="space-y-3 rounded-xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="font-semibold text-ok"><Icon name="check" className={EN_TEXTO} /> {created.length} {created.length === 1 ? "cuenta creada" : "cuentas creadas"}{rows.length > created.length ? ` · ${rows.length - created.length} con error` : ""}.</p>
        {created.length > 0 && (
          <div className="flex gap-2">
            <button type="button" onClick={download} className="btn btn-secondary btn-sm"><Icon name="download" className="size-4" /> Descargar credenciales</button>
            <button type="button" onClick={() => window.print()} className="btn btn-secondary btn-sm"><Icon name="printer" className="size-4" /> Imprimir</button>
          </div>
        )}
      </div>
      <p className="flex items-center gap-2 text-sm text-warn"><Icon name="alert" className="size-4" /> Las contraseñas solo se muestran ahora. Descárgalas o imprímelas antes de salir.</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <caption className="sr-only">Cuentas creadas</caption>
          <thead className="border-b border-line bg-[#f8f8fc] text-xs uppercase tracking-wider text-muted">
            <tr><th className="px-3 py-2">Fila</th><th className="px-3 py-2">Nombre</th><th className="px-3 py-2">Usuario o correo</th><th className="px-3 py-2">Contraseña</th><th className="px-3 py-2">Grupo</th><th className="px-3 py-2">Estado</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.row}>
                <td className="px-3 py-2 tabular-nums text-muted">{r.row}</td>
                <td className="px-3 py-2 font-medium">{r.name}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.login}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.password}</td>
                <td className="px-3 py-2">{r.group ?? "—"}</td>
                <td className="px-3 py-2">{r.ok ? <span className={`badge ${r.message ? "badge-warn" : "badge-ok"}`} title={r.message}>{r.message ? "Creada (sin grupo)" : "Creada"}</span> : <span className="badge badge-err">{r.message}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ManualForm({ groups }: { groups: Group[] }) {
  const [rows, setRows] = useState<StudentRowIn[]>(() => Array.from({ length: 5 }, empty));
  const [paste, setPaste] = useState("");
  const [state, setState] = useState<BulkState>(undefined);
  const [pending, start] = useTransition();
  const filled = rows.filter((r) => r.name.trim() || r.login.trim()).length;
  const set = (i: number, k: keyof StudentRowIn, v: string) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  // Pegar desde Excel u hoja de cálculo: una fila por línea, columnas separadas por tabulador (o ; o ,).
  function fromPaste() {
    const lines = paste.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsed = lines.map((l) => {
      const c = l.split(/\t|;|,/).map((x) => x.trim());
      return { name: c[0] ?? "", login: c[1] ?? "", password: c[2] ?? "", group: c[3] ?? "" };
    }).filter((r) => !/^nombre$/i.test(r.name));
    if (!parsed.length) return;
    setRows((rs) => [...rs.filter((r) => r.name || r.login), ...parsed]);
    setPaste("");
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <caption className="sr-only">Estudiantes para cargar</caption>
          <thead className="border-b border-line bg-[#f8f8fc] text-xs uppercase tracking-wider text-muted">
            <tr><th className="w-10 px-3 py-2">#</th><th className="px-2 py-2">Nombre</th><th className="px-2 py-2">Usuario o correo</th><th className="px-2 py-2">Contraseña (opcional)</th><th className="px-2 py-2">Grupo (opcional)</th><th className="w-10" /></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="px-3 py-1.5 tabular-nums text-muted">{i + 1}</td>
                <td className="px-2 py-1.5"><input aria-label={`Nombre del estudiante ${i + 1}`} value={r.name} onChange={(e) => set(i, "name", e.target.value)} maxLength={24} placeholder="Luna Pérez" className="input !min-h-9 !py-1.5" /></td>
                <td className="px-2 py-1.5"><input aria-label={`Usuario o correo del estudiante ${i + 1}`} value={r.login} onChange={(e) => set(i, "login", e.target.value)} placeholder="luna.perez" autoCapitalize="none" spellCheck={false} className="input !min-h-9 !py-1.5 font-mono text-sm" /></td>
                <td className="px-2 py-1.5"><input aria-label={`Contraseña del estudiante ${i + 1}`} value={r.password} onChange={(e) => set(i, "password", e.target.value)} placeholder="Se genera sola" autoComplete="off" spellCheck={false} className="input !min-h-9 !py-1.5 font-mono text-sm" /></td>
                <td className="px-2 py-1.5">
                  <select aria-label={`Grupo del estudiante ${i + 1}`} value={r.group} onChange={(e) => set(i, "group", e.target.value)} className="input !min-h-9 !py-1.5 text-sm">
                    <option value="">Sin grupo</option>
                    {groups.map((g) => <option key={g.code} value={g.code}>{g.name}</option>)}
                  </select>
                </td>
                <td className="px-2 py-1.5"><button type="button" onClick={() => setRows((rs) => rs.length > 1 ? rs.filter((_, j) => j !== i) : [empty()])} className="btn btn-ghost btn-sm !px-2" aria-label={`Quitar la fila ${i + 1}`}><Icon name="x" className="size-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setRows((rs) => [...rs, empty()])} className="btn btn-secondary btn-sm"><Icon name="plus" className="size-4" /> Agregar fila</button>
        <button type="button" onClick={() => setRows((rs) => [...rs, ...Array.from({ length: 10 }, empty)])} className="btn btn-ghost btn-sm">+10 filas</button>
        <button type="button" disabled={pending} className="btn btn-primary ml-auto"
          onClick={() => start(async () => {
            const r = await createStudentsAction(rows);
            setState(r);
            if (r?.results) setRows(Array.from({ length: 5 }, empty));
          })}>
          {pending ? "Creando cuentas…" : filled ? `Crear ${filled} ${filled === 1 ? "cuenta" : "cuentas"}` : "Crear cuentas"}
        </button>
      </div>
      <details className="rounded-xl border border-dashed border-line p-4">
        <summary className="cursor-pointer text-sm font-semibold">Pegar una lista desde Excel u hojas de cálculo</summary>
        <div className="mt-3 space-y-2">
          <label htmlFor="pegar" className="hint block">Copia las columnas Nombre, Usuario o correo, Contraseña y Código de grupo (las dos últimas opcionales) y pégalas aquí.</label>
          <textarea id="pegar" value={paste} onChange={(e) => setPaste(e.target.value)} rows={4} className="input font-mono text-sm" placeholder={"Luna Pérez\tluna.perez\tLuna2027\nTomás Ruiz\ttomas.ruiz"} />
          <button type="button" onClick={fromPaste} className="btn btn-secondary btn-sm">Agregar a la tabla</button>
        </div>
      </details>
      <Outcome state={state} />
    </div>
  );
}

function Upload() {
  const { pending } = useFormStatus();
  return <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Cargando…" : "Cargar estudiantes"}</button>;
}

function ExcelForm() {
  const [state, action] = useActionState(importStudentsAction, undefined);
  return (
    <div className="space-y-4">
      <ol className="space-y-1.5 text-sm text-muted">
        <li>1. Descarga la plantilla y escribe un estudiante por fila: nombre, usuario o correo, contraseña y, si quieres, el código de su grupo.</li>
        <li>2. Si dejas la contraseña vacía, la plataforma crea una segura.</li>
        <li>3. Sube el archivo. Si una fila tiene un error, no se crea ninguna cuenta y verás qué corregir.</li>
      </ol>
      <a href="/admin/personas/plantilla" className="btn btn-secondary btn-sm"><Icon name="download" className="size-4" /> Descargar la plantilla (.xlsx)</a>
      <form action={action} className="flex flex-wrap items-end gap-3 rounded-xl border border-line p-4">
        <label className="min-w-0 flex-1 space-y-1">
          <span className="label">Archivo de Excel con los estudiantes</span>
          <input type="file" name="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required className="input !py-2 text-sm" />
        </label>
        <Upload />
      </form>
      <Outcome state={state} />
    </div>
  );
}

/** Carga masiva de estudiantes: escribiéndolos (o pegándolos) o subiendo un Excel. */
export function BulkStudents({ groups }: { groups: Group[] }) {
  const [tab, setTab] = useState<"manual" | "excel">("manual");
  const TABS = [["manual", "Escribir o pegar"], ["excel", "Subir un Excel"]] as const;
  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Forma de cargar" className="inline-flex gap-1 rounded-xl bg-[#f0f1f6] p-1">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === k ? "bg-white text-text shadow-sm" : "text-muted hover:text-text"}`}>{label}</button>
        ))}
      </div>
      <div role="tabpanel">{tab === "manual" ? <ManualForm groups={groups} /> : <ExcelForm />}</div>
    </div>
  );
}
