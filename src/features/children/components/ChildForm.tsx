import { useId, useRef, useState, type FormEvent } from "react";
import { Button, InlineAlert, Select, TextField } from "../../../components/common";
import {
  MONTHS, bandOptions, birthOutOfRange, initialValues, mapApiError, prepareSubmit, yearOptions,
  type AgeMode, type FieldErrors, type FormValues
} from "../form";
import { ageBandLabel, type Child, type CreateChildInput, type UpdateChildInput } from "../types";

type ChildFormProps = {
  /** Present when editing. */
  child?: Child;
  online: boolean;
  /** Add: gets the full input. Edit: gets only what changed. Should reject with the API error. */
  onSubmit: (input: CreateChildInput & UpdateChildInput) => Promise<void>;
  onCancel?: () => void;
};

const AGE_MODES = [
  { value: "birth", label: "Birth month and year" },
  { value: "band", label: "Age range" }
];
const MONTH_OPTIONS = [{ value: "", label: "Choose a month" }, ...MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))];

export function ChildForm({ child, online, onSubmit, onCancel }: ChildFormProps) {
  const [values, setValues] = useState<FormValues>(() => initialValues(child));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const formAlert = useRef<HTMLDivElement>(null);
  const set = (patch: Partial<FormValues>) => setValues((v) => ({ ...v, ...patch }));

  const fail = (next: FieldErrors) => {
    setErrors(next);
    setSaving(false);
    // Move to the first problem so keyboard and screen reader users land on it.
    requestAnimationFrame(() => (formAlert.current ?? form.current?.querySelector<HTMLElement>('[aria-invalid="true"]'))?.focus());
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const prepared = prepareSubmit(values, child);
    if ("errors" in prepared) return fail(prepared.errors);
    const input = prepared.input;
    if (!input) return onCancel?.(); // Nothing changed.
    setSaving(true);
    setErrors({});
    try {
      await onSubmit(input);
    } catch (error) {
      fail(mapApiError(error));
    }
  }

  const ageErrorId = `${useId()}-age`;
  const ageProps = errors.age ? { "aria-invalid": true, "aria-describedby": ageErrorId } : {};
  const years = [{ value: "", label: "Choose a year" }, ...yearOptions().map((y) => ({ value: y, label: y }))];
  return (
    <form ref={form} className="child-form" onSubmit={handleSubmit} noValidate>
      {errors.form && <InlineAlert ref={formAlert} tabIndex={-1} kind="error" title="We couldn't save this.">{errors.form}</InlineAlert>}
      <TextField
        label="Nickname"
        hint="A nickname is enough. You don't need a real name or an exact birth date."
        autoComplete="off"
        value={values.nickname}
        error={errors.nickname}
        onChange={(e) => set({ nickname: e.target.value })}
      />
      <Select
        label="How would you like to share their age?"
        options={AGE_MODES}
        value={values.mode}
        onChange={(e) => set({ mode: e.target.value as AgeMode })}
      />
      {values.mode === "birth" && birthOutOfRange(child) && child ? (
        <p className="child-form-age-fixed">
          Birth month and year: {MONTHS[Number(child.birthMonthYear?.slice(5)) - 1]} {child.birthMonthYear?.slice(0, 4)} ·{" "}
          {ageBandLabel(child.ageBand)}. To change it, choose an age range above.
        </p>
      ) : values.mode === "birth" ? (
        <fieldset className="child-form-age">
          <legend className="ls-field-label">Birth month and year</legend>
          <div className="child-form-row">
            <Select label="Month" options={MONTH_OPTIONS} value={values.month} {...ageProps}
              onChange={(e) => set({ month: e.target.value })} />
            <Select label="Year" options={years} value={values.year} {...ageProps}
              onChange={(e) => set({ year: e.target.value })} />
          </div>
          {errors.age && <p id={ageErrorId} className="ls-field-message">{errors.age}</p>}
        </fieldset>
      ) : (
        <Select
          label="Age range"
          options={[{ value: "", label: "Choose an age range" }, ...bandOptions]}
          value={values.band}
          error={errors.age}
          onChange={(e) => set({ band: e.target.value })}
        />
      )}
      {!online && <InlineAlert kind="offline" title="You're offline.">Reconnect to save changes.</InlineAlert>}
      <div className="child-form-actions">
        <Button type="submit" busy={saving} disabled={!online}>{child ? "Save changes" : "Add child"}</Button>
        {onCancel && <Button variant="secondary" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
