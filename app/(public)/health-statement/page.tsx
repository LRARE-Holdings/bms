import ProsePage from "@/components/ui/prose-page";

export const metadata = {
  title: "Health Statement | Burn Mat Studio",
};

export default function HealthStatementPage() {
  return (
    <ProsePage title="Health Statement" lastUpdated="March 2026">
      <h2>Your Responsibility</h2>
      <p>
        By booking and attending any class at Burn Mat Studio, you confirm that
        you are in good health and physically capable of participating in
        exercise. It is your responsibility to ensure that you are fit to take
        part.
      </p>

      <h2>Medical Conditions &amp; Injuries</h2>
      <p>
        You must inform your instructor before class if you have any medical
        conditions, injuries, or physical limitations that may affect your
        ability to exercise safely. This includes but is not limited to:
      </p>
      <ul>
        <li>Heart conditions or cardiovascular issues</li>
        <li>High or low blood pressure</li>
        <li>Joint, back, or spinal injuries</li>
        <li>Recent surgery or ongoing rehabilitation</li>
        <li>Asthma or respiratory conditions</li>
        <li>Diabetes</li>
        <li>Epilepsy</li>
        <li>Any condition that may be affected by heat (our Hot Pilates and Hot Yoga classes take place in a heated environment)</li>
      </ul>

      <h2>Pregnancy</h2>
      <p>
        If you are pregnant or suspect you may be pregnant, please inform your
        instructor before class. Certain exercises and heated environments may
        not be suitable during pregnancy. We recommend consulting your GP or
        midwife before attending classes.
      </p>

      <h2>Heated Classes</h2>
      <p>
        Our Hot Pilates and Hot Yoga classes are conducted in a heated studio.
        Heat can increase the risk of dehydration, dizziness, and overheating.
        Please ensure you are well hydrated before, during, and after class. If
        you feel unwell at any point during a heated class, stop immediately and
        inform your instructor. Heated classes may not be suitable for everyone
        &mdash; please consult your GP if you have any concerns.
      </p>

      <h2>During Class</h2>
      <p>
        Listen to your body at all times. If you experience pain, dizziness,
        nausea, or any discomfort during a class, stop exercising immediately
        and let your instructor know. Our instructors will offer modifications
        where possible, but you are responsible for working within your own
        limits.
      </p>

      <h2>Professional Medical Advice</h2>
      <p>
        If you are unsure whether exercise is appropriate for you, we recommend
        consulting your GP or a qualified medical professional before attending
        any classes. Our classes are not a substitute for medical advice,
        diagnosis, or treatment.
      </p>

      <h2>Assumption of Risk</h2>
      <p>
        Participation in any exercise class carries inherent risks. By
        attending classes at Burn Mat Studio, you acknowledge and accept these
        risks and agree that Burn Mat Studio, its owner, instructors, and staff
        are not liable for any injury, illness, or loss arising from your
        participation.
      </p>

      <h2>Under 18s</h2>
      <p>
        Participants must be aged 18 or over unless otherwise stated for a
        specific class (e.g. Baby &amp; Me Yoga, where an accompanying adult is
        required). A parent or guardian must provide consent for any participant
        under 18.
      </p>
    </ProsePage>
  );
}
