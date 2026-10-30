import { Badge, Card } from "../../../components/common";
import { AccountPage } from "./AccountPage";

export function AboutScreen() {
  return (
    <AccountPage id="about-title" title="About LittleSteps">
      <Card as="section" aria-labelledby="about-what">
        <h2 id="about-what">What LittleSteps is</h2>
        <p>A learning companion for parents and other caregivers. It suggests simple play ideas and helps you note what you see your child do.</p>
        <p>It is not a medical tool and it is not a test. It cannot tell you if your child is developing well. For worries, talk to your pediatrician or barangay health worker.</p>
      </Card>
      <Card as="section" aria-labelledby="about-sources">
        <h2 id="about-sources">Where activities come from</h2>
        <p>Every activity shows where it comes from. Look for the source on each activity card.</p>
      </Card>
      <Card as="section" aria-labelledby="about-ai">
        <h2 id="about-ai">When AI is used</h2>
        <p><Badge kind="ai" /></p>
        <p>This label means the idea was written by AI, using only activities from our activity list. Your journal notes are never used for it.</p>
      </Card>
      <Card as="section" aria-labelledby="about-project">
        <h2 id="about-project">About this version</h2>
        <p>LittleSteps is a student course project (CIT 210 and CC 207B). This is an early version for testing.</p>
      </Card>
    </AccountPage>
  );
}
