import { PRIVACY_CONTACT } from "../content";
import { AccountPage } from "./AccountPage";

const FAQ: { q: string; a: string }[] = [
  { q: "How do I add a child?", a: "Open Account, choose Your children, then Add a child." },
  { q: "Why is a nickname enough?", a: "We only need a name you will recognise, plus your child's birth month and year, or an age range, to suggest activities for their age. You do not need to enter a full name or exact birth date." },
  { q: "What does \"Not yet\" mean on a milestone?", a: "It means you have not seen it yet. It does not mean your child is late or behind. Children grow at their own pace. If you are worried, talk to your pediatrician or barangay health worker." },
  { q: "How do I sign out?", a: "Open Account, then Settings, then choose Sign out. You can also choose Sign out in the Account menu." },
  { q: "What if I have no internet?", a: "Some things need a connection. If something could not be loaded or saved, you will see a message and can try again when you are back online." },
  { q: "Who can I contact?", a: `${PRIVACY_CONTACT} A way to reach the team will be added here; until then there is no contact channel in the app.` },
];

export function HelpScreen() {
  return (
    <AccountPage id="help-title" title="Help and support">
      <h2 className="account-h2">Common questions</h2>
      <div className="account-faq">
        {FAQ.map(({ q, a }) => (
          <details key={q} className="ls-card">
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </AccountPage>
  );
}
