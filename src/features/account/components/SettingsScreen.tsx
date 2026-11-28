import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Card,
  ConfirmDialog,
  InlineAlert,
  Select,
  SuccessNotice,
} from "../../../components/common";
import { failureKind } from "../../../services/offline";
import { PHILIPPINES_CITIES, useWeather } from "../../../services/weather";
import { useAuth } from "../../auth";
import { localDate } from "../../today/logic";
import { deleteAccount, exportAccountData } from "../api";
import { AccountPage } from "./AccountPage";

function triggerJsonDownload(data: Record<string, unknown>, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Account settings screen with sign-out, city weather preferences, and RA 10173 data controls. */
export function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [dataError, setDataError] = useState<{ kind: "offline" | "error"; message: string } | null>(
    null
  );

  const handleExport = async () => {
    setExporting(true);
    setDataError(null);
    setNotice(undefined);
    try {
      const payload = await exportAccountData();
      triggerJsonDownload(payload, `littlesteps-export-${localDate()}.json`);
      setNotice("Your LittleSteps data export has been downloaded.");
    } catch (error) {
      const offline = failureKind(error, navigator.onLine) === "offline";
      setDataError({
        kind: offline ? "offline" : "error",
        message: offline
          ? "You're offline. Reconnect to download a copy of your data."
          : "We couldn't prepare your data export right now. Please try again.",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDataError(null);
    try {
      await deleteAccount();
      setConfirmDeleteOpen(false);
      await signOut();
    } catch (error) {
      setConfirmDeleteOpen(false);
      const offline = failureKind(error, navigator.onLine) === "offline";
      setDataError({
        kind: offline ? "offline" : "error",
        message: offline
          ? "You're offline. Reconnect to delete your account."
          : "We couldn't delete your account right now. Please try again.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AccountPage id="settings-title" title="Settings">
      <SuccessNotice message={notice} onClose={() => setNotice(undefined)} />

      <Card as="section" aria-labelledby="settings-account">
        <h2 id="settings-account">Your account</h2>
        <p className="account-note">Signed in as</p>
        <p className="account-email">{user?.email ?? "Not available"}</p>
        <Button variant="secondary" onClick={() => void signOut()}>
          Sign out
        </Button>
      </Card>

      <Card as="section" aria-labelledby="settings-children">
        <h2 id="settings-children">Children</h2>
        <p>
          <Link to="/children">Your children</Link>
        </p>
      </Card>

      <WeatherSettings />

      <Card as="section" aria-labelledby="settings-data">
        <h2 id="settings-data">Your data</h2>

        {dataError && (
          <InlineAlert
            kind={dataError.kind}
            title={dataError.kind === "offline" ? "You're offline." : "Action could not finish"}
          >
            <p>{dataError.message}</p>
          </InlineAlert>
        )}

        <div className="account-action">
          <Button
            variant="secondary"
            busy={exporting}
            onClick={() => void handleExport()}
          >
            {exporting ? "Preparing download…" : "Download my data"}
          </Button>
          <p className="account-note">
            Downloads a copy of your child profiles, activity plans, milestone notes, saved books, and journal notes.
          </p>
        </div>

        <div className="account-action">
          <Button
            variant="danger"
            disabled={deleting}
            onClick={() => setConfirmDeleteOpen(true)}
          >
            Delete my account
          </Button>
          <p className="account-note">
            Permanently removes your account and all saved child profiles, plans, observations, and journal notes.
          </p>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete your account?"
        confirmLabel={deleting ? "Deleting…" : "Delete my account"}
        destructive
        onConfirm={() => void handleDeleteAccount()}
        onCancel={() => setConfirmDeleteOpen(false)}
      >
        <p>
          This permanently removes your account, child profiles, plans, milestone observations, saved books, and private journal notes. This cannot be undone.
        </p>
      </ConfirmDialog>
    </AccountPage>
  );
}

function WeatherSettings() {
  const { cityName, updateCity } = useWeather();

  return (
    <Card as="section" aria-labelledby="settings-weather">
      <h2 id="settings-weather">Weather for activity ideas</h2>
      <p className="account-note">
        Optional. Pick a nearby city to show gentle play hints like &ldquo;Rain likely this afternoon · Indoor ideas&rdquo;.
      </p>
      <Select
        className="settings-weather-city"
        label="City"
        value={cityName}
        onChange={(e) => updateCity(e.target.value)}
        options={[
          { value: "", label: "Off (no weather hints)" },
          ...PHILIPPINES_CITIES.map((c) => ({ value: c.name, label: c.name })),
        ]}
        hint="Weather data by Open-Meteo.com. No location data is stored beyond your chosen city."
      />
    </Card>
  );
}
