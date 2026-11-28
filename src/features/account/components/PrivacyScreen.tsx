import { Card } from "../../../components/common";
import { PRIVACY_CONTACT } from "../content";
import { AccountPage } from "./AccountPage";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "What we collect",
    body: [
      "Your child's nickname, birth month and year (or an age range), the activities you mark as done, saved storybooks, and the notes you write. We do not ask for an exact birth date or photos.",
    ],
  },
  {
    title: "Why we collect it",
    body: [
      "To suggest play ideas that suit your child's age and to keep your own record.",
    ],
  },
  {
    title: "Who can see it",
    body: [
      "Only you. Your journal notes are never sent to AI, analytics, or error logs.",
    ],
  },
  {
    title: "Your rights",
    body: [
      "Under the Data Privacy Act (RA 10173), you have the right to see, correct, download, and delete your data.",
      "You can view and edit child details in Your children, and download a copy of your data or permanently delete your account from Settings.",
    ],
  },
  {
    title: "How long we keep it",
    body: [
      "Your information stays in your account while it is active. When you delete your account in Settings, your profile, child records, plans, observations, saved books, and journal notes are permanently removed.",
    ],
  },
  {
    title: "If something goes wrong",
    body: [
      "If your data is put at risk, we will notify you and the National Privacy Commission as soon as possible and aim to do so within 72 hours.",
    ],
  },
  {
    title: "Contact",
    body: [PRIVACY_CONTACT],
  },
];

/** Plain-language privacy notice explaining data minimization and caregiver rights. */
export function PrivacyScreen() {
  return (
    <AccountPage
      id="privacy-title"
      title="Privacy notice"
      subtitle="What LittleSteps does with your information, in plain words."
    >
      {SECTIONS.map(({ title, body }, index) => (
        <Card as="section" key={title} aria-labelledby={`privacy-${index}`}>
          <h2 id={`privacy-${index}`}>{title}</h2>
          {body.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </Card>
      ))}
    </AccountPage>
  );
}
