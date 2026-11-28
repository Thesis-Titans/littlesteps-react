import { Badge, Card } from "../../../components/common";
import { PUBLISHED_FRAMEWORKS } from "../content";
import { AccountPage } from "./AccountPage";

/** Product overview, non-diagnostic reminder, and published early childhood framework citations. */
export function AboutScreen() {
  return (
    <AccountPage id="about-title" title="About LittleSteps">
      <Card as="section" aria-labelledby="about-what">
        <h2 id="about-what">What LittleSteps is</h2>
        <p>
          LittleSteps — Play Planning and Observation Companion for Caregivers of Young Children. It helps parents and caregivers find simple everyday play ideas and note small moments at home.
        </p>
        <p>
          It is not a medical tool and it is not a test. It cannot tell you if your child is developing well. If you have concerns, talk to your pediatrician or barangay health worker.
        </p>
      </Card>

      <Card as="section" aria-labelledby="about-sources">
        <h2 id="about-sources">Where activities come from</h2>
        <p>
          Activities and milestone prompts are grounded in published pediatric and early childhood frameworks:
        </p>
        <ul className="account-links-list">
          {PUBLISHED_FRAMEWORKS.map((framework) => (
            <li key={framework.url}>
              <a
                href={framework.url}
                target="_blank"
                rel="noopener noreferrer"
                className="account-external-link"
              >
                <span>{framework.title}</span>
                <span className="account-link-domain">{framework.domain} ↗</span>
              </a>
            </li>
          ))}
        </ul>
      </Card>

      <Card as="section" aria-labelledby="about-ai">
        <h2 id="about-ai">When AI is used</h2>
        <p>
          <Badge kind="ai" />
        </p>
        <p>
          This label means the play idea was shaped by AI using only our curated activity list and the preferences you chose. Your private journal notes are never sent to AI.
        </p>
      </Card>

      <Card as="section" aria-labelledby="about-project">
        <h2 id="about-project">About this project</h2>
        <p>
          Created by the Thesis Titans team (BSIT-3A, West Visayas State University) for CIT 210 and CC 207B.
        </p>
      </Card>
    </AccountPage>
  );
}
