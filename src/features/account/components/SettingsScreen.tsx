import { Link } from "react-router-dom";
import { Button, Card, Select } from "../../../components/common";
import { PHILIPPINES_CITIES, useWeather } from "../../../services/weather";
import { useAuth } from "../../auth";
import { AccountPage } from "./AccountPage";

function NotAvailable({ id, label, children }: { id: string; label: string; children: string }) {
  // aria-disabled (not disabled) keeps the button focusable so its explanation is read out.
  return (
    <div className="account-action">
      <Button variant="secondary" aria-disabled="true" aria-describedby={id} onClick={(event) => event.preventDefault()}>{label}</Button>
      <p id={id} className="account-note">{children}</p>
    </div>
  );
}

export function SettingsScreen() {
  const { user, signOut } = useAuth();

  return (
    <AccountPage id="settings-title" title="Settings">
      <Card as="section" aria-labelledby="settings-account">
        <h2 id="settings-account">Your account</h2>
        <p className="account-note">Signed in as</p>
        <p className="account-email">{user?.email ?? "Not available"}</p>
        <Button variant="secondary" onClick={() => void signOut()}>Sign out</Button>
      </Card>

      <Card as="section" aria-labelledby="settings-children">
        <h2 id="settings-children">Children</h2>
        <p><Link to="/children">Your children</Link></p>
      </Card>

      {/* Weather for activity ideas (react #19) */}
      <WeatherSettings />

      <Card as="section" aria-labelledby="settings-data">
        <h2 id="settings-data">Your data</h2>
        <NotAvailable id="export-note" label="Download my data">
          This will give you a copy of your child's profile, activity records and notes. It is not available yet.
        </NotAvailable>
        <NotAvailable id="delete-note" label="Delete a child's records or my account">
          This will permanently remove what you choose, and you will be asked to confirm first. It is not available yet.
        </NotAvailable>
      </Card>
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
      {/* Shared Select: same label, chevron and focus ring as every other form field (react #51). */}
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
