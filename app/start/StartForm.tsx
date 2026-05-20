"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { createWager } from "./actions";

export function StartForm() {
  const [outcomes, setOutcomes] = React.useState<string[]>(["", ""]);
  const [closeType, setCloseType] = React.useState<"TIMED" | "MANUAL">("MANUAL");
  const [mode, setMode] = React.useState<"PARIMUTUEL" | "EQUAL_SPLIT">("PARIMUTUEL");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function setOutcome(i: number, val: string) {
    setOutcomes((cur) => cur.map((v, idx) => (idx === i ? val : v)));
  }
  function addOutcome() {
    setOutcomes((cur) => (cur.length < 10 ? [...cur, ""] : cur));
  }
  function removeOutcome(i: number) {
    setOutcomes((cur) => (cur.length > 2 ? cur.filter((_, idx) => idx !== i) : cur));
  }

  async function action(formData: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      await createWager(formData);
      // redirect happens server-side; we never get here on success
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <Input
        type="text"
        name="question"
        label="What's the question?"
        placeholder="Will the sourdough rise higher than last time?"
        required
        maxLength={280}
      />

      <div>
        <label className="text-sm font-medium text-ink">
          Description <span className="text-ink-muted">(optional)</span>
        </label>
        <textarea
          name="description"
          rows={3}
          maxLength={2000}
          className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          placeholder="Any details, ground rules, or context you want to add."
        />
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-ink">Outcomes</legend>
        <p className="text-xs text-ink-muted mt-1">
          List 2–10 possible outcomes. The first one to come true is the winner.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {outcomes.map((v, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                name={`outcome-${i}`}
                value={v}
                onChange={(e) => setOutcome(i, e.target.value)}
                placeholder={`Outcome ${i + 1}`}
                required
                maxLength={80}
                className="h-10 flex-1 px-3 rounded-xl border border-ink/15 bg-white text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              {outcomes.length > 2 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOutcome(i)}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          ))}
          {outcomes.length < 10 ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="self-start"
              onClick={addOutcome}
            >
              + Add outcome
            </Button>
          ) : null}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-ink">Mode</legend>
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <RadioCard
            name="mode"
            value="PARIMUTUEL"
            checked={mode === "PARIMUTUEL"}
            onChange={() => setMode("PARIMUTUEL")}
            title="Pari-mutuel"
            subtitle="Bet any amount. Winners split the pool proportional to their stakes."
          />
          <RadioCard
            name="mode"
            value="EQUAL_SPLIT"
            checked={mode === "EQUAL_SPLIT"}
            onChange={() => setMode("EQUAL_SPLIT")}
            title="Equal split"
            subtitle="Everyone bets the same amount. Winners split the pool evenly."
          />
        </div>
        {mode === "EQUAL_SPLIT" ? (
          <div className="mt-3">
            <Input
              type="number"
              name="equalSplit"
              label="Buy-in ($)"
              placeholder="10"
              min={1}
              step={1}
              required
            />
          </div>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-ink">When does it close?</legend>
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <RadioCard
            name="closeType"
            value="MANUAL"
            checked={closeType === "MANUAL"}
            onChange={() => setCloseType("MANUAL")}
            title="I'll close it"
            subtitle="No more bets accepted once you click Close."
          />
          <RadioCard
            name="closeType"
            value="TIMED"
            checked={closeType === "TIMED"}
            onChange={() => setCloseType("TIMED")}
            title="Close at a specific time"
            subtitle="Bets stop being accepted automatically."
          />
        </div>
        {closeType === "TIMED" ? (
          <div className="mt-3">
            <Input
              type="datetime-local"
              name="closeAt"
              label="Close at"
              required
            />
          </div>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-ink">Privacy</legend>
        <div className="mt-3 flex flex-col gap-2">
          <CheckboxRow
            name="isPublic"
            label="Show in public feed"
            sublabel="Anyone can find this wager. Leave off to keep it link-only."
          />
          <CheckboxRow
            name="anonymousBets"
            label="Hide bettor names"
            sublabel="Show only outcome totals, not who bet what."
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-ink">Access</legend>
        <div className="mt-3 flex flex-col gap-2 text-sm">
          <label className="flex gap-2 items-start">
            <input type="radio" name="accessMode" value="OPEN" defaultChecked className="mt-1" />
            <span>
              <span className="font-medium">Open</span>
              <span className="block text-xs text-ink-muted">Anyone with the link can bet.</span>
            </span>
          </label>
          <label className="flex gap-2 items-start">
            <input type="radio" name="accessMode" value="APPROVAL_REQUIRED" className="mt-1" />
            <span>
              <span className="font-medium">Approval required</span>
              <span className="block text-xs text-ink-muted">You approve each bettor before they can join.</span>
            </span>
          </label>
        </div>
      </fieldset>

      {error ? (
        <div className="rounded-xl bg-warn/10 border border-warn/30 px-3 py-2 text-sm text-warn">
          {error}
        </div>
      ) : null}

      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? "Creating…" : "Create wager"}
      </Button>
    </form>
  );
}

function RadioCard(props: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <label
      className={`cursor-pointer rounded-xl border p-3 transition-colors ${
        props.checked
          ? "border-accent bg-accent/5"
          : "border-ink/15 bg-white hover:border-ink/30"
      }`}
    >
      <input
        type="radio"
        name={props.name}
        value={props.value}
        checked={props.checked}
        onChange={props.onChange}
        className="sr-only"
      />
      <div className="text-sm font-medium">{props.title}</div>
      <div className="text-xs text-ink-muted mt-1">{props.subtitle}</div>
    </label>
  );
}

function CheckboxRow({
  name,
  label,
  sublabel,
}: {
  name: string;
  label: string;
  sublabel: string;
}) {
  return (
    <label className="flex gap-2 items-start text-sm">
      <input type="checkbox" name={name} className="mt-1" />
      <span>
        <span className="font-medium">{label}</span>
        <span className="block text-xs text-ink-muted">{sublabel}</span>
      </span>
    </label>
  );
}
