"use client";
import { useActionState, useEffect, useState } from "react";
import { createMovement } from "@/app/(app)/musteriler/actions";
import {
  HAREKET_TIPLERI,
  TIP_BILGI,
  fmtGram,
  type HareketTipi,
} from "@/lib/labels";
import { SubmitButton } from "./SubmitButton";

export type ItemType = {
  id: string;
  ad: string;
  birim: "gram" | "adet";
  varsayilan_milyem: number;
  birim_gram: number | null;
};

export function MovementForm({
  customerId,
  types,
}: {
  customerId: string;
  types: ItemType[];
}) {
  const [state, action] = useActionState(createMovement, {});
  const [tip, setTip] = useState<HareketTipi>("emanet_birakma");
  const [typeId, setTypeId] = useState(types[0]?.id ?? "");
  const current = types.find((t) => t.id === typeId);
  const [milyem, setMilyem] = useState(
    String(current?.varsayilan_milyem ?? ""),
  );
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (state.ok) {
      setQty("");
      setNote("");
    }
  }, [state.ts, state.ok]);

  if (types.length === 0) {
    return (
      <p className="aside">Hareket girmek için önce ürün türü tanımlanmalı.</p>
    );
  }

  const q = Number(qty.replace(",", "."));
  const m = Number(milyem);
  const gram =
    current?.birim === "adet" ? q * (Number(current.birim_gram) || 0) : q;
  const has = q > 0 && m > 0 ? (gram * m) / 1000 : 0;

  return (
    <form action={action} className="stack">
      <input type="hidden" name="customer_id" value={customerId} />
      <input type="hidden" name="birim" value={current?.birim ?? "gram"} />

      <fieldset className="tipler">
        <legend>İşlem</legend>
        {HAREKET_TIPLERI.map((t) => (
          <label key={t} className="tip">
            <input
              type="radio"
              name="tip"
              value={t}
              checked={tip === t}
              onChange={() => setTip(t)}
            />
            <b>{TIP_BILGI[t].ad}</b>
            <small>{TIP_BILGI[t].etki}</small>
          </label>
        ))}
      </fieldset>

      <label className="field">
        <span>Ürün</span>
        <select
          name="item_type_id"
          value={typeId}
          onChange={(e) => {
            setTypeId(e.target.value);
            const next = types.find((t) => t.id === e.target.value);
            if (next) setMilyem(String(next.varsayilan_milyem));
          }}
        >
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.ad}
            </option>
          ))}
        </select>
      </label>

      <div className="row2">
        <label className="field">
          <span>{current?.birim === "adet" ? "Adet" : "Gram"}</span>
          <input
            name="miktar"
            required
            inputMode={current?.birim === "adet" ? "numeric" : "decimal"}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="num"
            placeholder={current?.birim === "adet" ? "1" : "0,00"}
          />
          {current?.birim === "adet" && (
            <em>Adet başı {fmtGram(Number(current.birim_gram))} gr</em>
          )}
        </label>
        <label className="field">
          <span>Milyem</span>
          <input
            name="milyem"
            required
            inputMode="numeric"
            value={milyem}
            onChange={(e) => setMilyem(e.target.value)}
            className="num"
          />
          <em>22 ayar 916, 14 ayar 585</em>
        </label>
      </div>

      <label className="field">
        <span>Açıklama</span>
        <input
          name="aciklama"
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      <p className="preview num" aria-live="polite">
        Has karşılığı: <strong>{fmtGram(has)} gr</strong>
      </p>

      {state.error && (
        <p className="alert" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && state.message && (
        <p className="notice" role="status">
          {state.message}
        </p>
      )}
      <div>
        <SubmitButton>Hareketi kaydet</SubmitButton>
      </div>
    </form>
  );
}
