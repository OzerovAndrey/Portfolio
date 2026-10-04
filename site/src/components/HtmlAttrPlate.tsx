import { useState } from "react";
import "../styles/morph.css";

type Vars = Record<string, string>;
interface Labels { plateLabel: string; brandsLabel: string; changed: string; from: string; more: string; first: string }
interface Props { brands: Record<string, Vars>; labels: Labels; limit?: number }

const isColor = (v: string) => /^#[0-9a-f]{3,8}$/i.test(v);
const Val = ({ v }: { v: string }) => <>{isColor(v) && <i className="plate__swatch" style={{ "--swatch": v } as React.CSSProperties} aria-hidden="true" />}{v}</>;

/** `<html data-brand="…">`: перемикає значення атрибута й показує CSS-змінні, що змінились відносно попереднього бренду.
 *  Це ілюстрація: реальний data-brand сторінки лишається «site». Дані — із tokens/demo через білд. */
export default function HtmlAttrPlate({ brands, labels, limit = 10 }: Props) {
  const names = Object.keys(brands);
  const [current, setCurrent] = useState(names[0]);
  const [prev, setPrev] = useState<string | null>(null);
  const pick = (b: string) => { if (b !== current) { setPrev(current); setCurrent(b); } };

  const changed = prev ? Object.keys(brands[current]).filter((k) => brands[prev][k] !== brands[current][k]) : [];
  const shown = changed.slice(0, limit);

  return (
    <div className="plate">
      <div className="morph__control">
        <span className="morph__label ts-label-sm" id="plate-brand">{labels.brandsLabel}</span>
        <div className="seg" role="radiogroup" aria-labelledby="plate-brand">
          {names.map((b) => (
            <button key={b} type="button" className="seg__item ts-label-sm" role="radio" aria-checked={b === current} onClick={() => pick(b)} data-event={`attr_brand_${b}`}>{b}</button>
          ))}
        </div>
      </div>
      <span className="morph__label ts-label-sm">{labels.plateLabel}</span>
      <p className="plate__code ts-body-md-strong">
        <span className="plate__attr">&lt;html </span>data-brand="{current}"<span className="plate__attr">&gt;</span>
      </p>
      <div aria-live="polite">
        {prev ? (
          <>
            <p className="plate__hint ts-label-sm">{labels.changed}: {changed.length}</p>
            <ul className="plate__list">
              {shown.map((k) => (
                <li key={k} className="plate__row">
                  <span className="plate__name ts-body-sm-strong">{k}</span>
                  <span className="plate__values ts-body-sm-regular"><Val v={brands[prev][k]} /> → <Val v={brands[current][k]} /></span>
                </li>
              ))}
            </ul>
            {changed.length > shown.length && <p className="plate__hint ts-body-sm-regular">{labels.more.replace("{n}", String(changed.length - shown.length))}</p>}
          </>
        ) : <p className="plate__hint ts-body-sm-regular">{labels.first}</p>}
      </div>
    </div>
  );
}
