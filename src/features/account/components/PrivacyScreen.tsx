import { Card } from "../../../components/common";
import { PRIVACY_CONTACT } from "../content";
import { AccountPage } from "./AccountPage";

const SECTIONS: { title: string; body: string[] }[] = [
  { title: "What we collect", body: ["Your child's nickname, birth month and year (or an age range), the activities you mark as done and the notes you write. We do not ask for an exact birth date."] },
  { title: "Why we collect it", body: ["To suggest activities that suit your child's age and to keep your own record."] },
  { title: "Who can see it", body: ["Only you. Your journal notes are never sent to AI, analytics or error logs."] },
  { title: "Your rights", body: [
    "You can see, correct, delete and get a copy of your data.",
    "Today you can see and change what you entered in the app. Getting a copy and deleting are not available in the app yet. Ask the team using the contact below.",
  ] },
  { title: "How long we keep it", body: ["While your account is active. We delete it when you ask. We may later delete accounts that stay unused for a long time, but that period is only a proposal and has not been approved."] },
  { title: "If something goes wrong", body: ["If your data is put at risk, we will tell you and the National Privacy Commission within 72 hours."] },
  { title: "Contact", body: [PRIVACY_CONTACT] },
];

export function PrivacyScreen() {
  return (
    <AccountPage id="privacy-title" title="Privacy notice" subtitle="What LittleSteps does with your information, in plain words.">
      {SECTIONS.map(({ title, body }, index) => (
        <Card as="section" key={title} aria-labelledby={`privacy-${index}`}>
          <h2 id={`privacy-${index}`}>{title}</h2>
          {body.map((text) => <p key={text}>{text}</p>)}
        </Card>
      ))}
    </AccountPage>
  );
}
