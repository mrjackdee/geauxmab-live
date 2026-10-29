// © MrJackDee™. All rights reserved.
import React from 'react';
import { motion } from 'motion/react';

// Privacy Policy and Terms of Service for book.geauxmab.com (shown at #privacy and #terms).
// Drafted for a Texas-based individual; have a licensed Texas attorney review before relying on them.

const UPDATED = 'October 29, 2026';
const CONTACT = 'jd@geauxmab.com';
const OWNER = 'Jack Dee';
const SITE = 'book.geauxmab.com';

type Section = { h: string; body: React.ReactNode };

const Page = ({ title, intro, sections }: { title: string; intro: React.ReactNode; sections: Section[] }) => (
  <section className="pt-6 md:pt-14 pb-16">
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tighter">{title}</h2>
        <p className="mt-2 text-[11px] sm:text-xs font-bold tracking-wide text-[#c8c9c7]">Effective and last updated {UPDATED}</p>
      </div>
      <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
        className="relative rounded-[28px] bg-[#113b6c] border border-white/15 p-5 sm:p-8 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)] text-white/85 text-sm sm:text-[15px] leading-relaxed">
        <div aria-hidden="true" className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        <div className="space-y-2">{intro}</div>
        {sections.map((s, i) => (
          <div key={s.h} className="mt-6">
            <h3 className="text-[11px] sm:text-xs font-bold tracking-wide text-white mb-2">{i + 1}. {s.h}</h3>
            <div className="space-y-2 [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-white [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_b]:text-white">{s.body}</div>
          </div>
        ))}
      </motion.article>
    </div>
  </section>
);

// Conspicuous block for releases and liability limits (Texas fair-notice requirements)
const Conspicuous = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-white/40 bg-white/[0.06] p-4 font-bold tracking-wide text-[12px] sm:text-[13px] leading-relaxed text-white">
    {children}
  </div>
);

const Mail = () => <a href={`mailto:${CONTACT}`}>{CONTACT}</a>;

/* ======================= Terms of Service ======================= */
export const TermsOfService = () => (
  <Page
    title="Terms of Service"
    intro={
      <>
        <p>
          These Terms of Service ("Terms") are a binding agreement between you and {OWNER}, an individual residing in Dallas County, Texas
          ("I," "me," or "my"). They govern your use of {SITE} (the "App") and any session you book through it (a "Session").
        </p>
        <Conspicuous>
          By booking a session, checking the agreement box, or joining a session, you agree to these Terms, including the recording consent and release
          in Section 4, the intellectual property terms in Section 5, the limitation of liability in Section 9, and the dispute terms in Section 11.
          If you do not agree, do not use the App or join a session.
        </Conspicuous>
      </>
    }
    sections={[
      {
        h: 'Eligibility',
        body: <p>You must be at least 18 years old and able to enter into a binding contract. If you book for an organization, you confirm you are authorized to bind it to these Terms.</p>,
      },
      {
        h: 'Booking, rescheduling and cancellation',
        body: (
          <ul>
            <li>Sessions are virtual meetings held on Zoom for the length shown when you book. A booking is confirmed only when you receive a confirmation email.</li>
            <li>You must provide accurate information. Reschedule or cancel using the links in your confirmation email, as early as possible.</li>
            <li>I may decline, reschedule, or cancel any booking at my discretion, including for misuse of the App or conduct that violates these Terms. My sole obligation if I cancel is to offer to reschedule.</li>
            <li>Any paid engagement is governed by a separate written agreement, which controls over these Terms if they conflict.</li>
          </ul>
        ),
      },
      {
        h: 'Conduct',
        body: (
          <ul>
            <li>Be respectful. Do not harass, threaten, or abuse anyone, or share unlawful, infringing, or confidential third-party material during a Session.</li>
            <li>Do not book under a false identity, make bookings you do not intend to keep, or interfere with, overload, scrape, or gain unauthorized access to the App.</li>
            <li>I may end a Session immediately if these rules are broken.</li>
          </ul>
        ),
      },
      {
        h: 'Recording, transcription, and release',
        body: (
          <>
            <p>
              Sessions may be recorded (audio, video, screen share, and chat) and may be transcribed or summarized using tools such as Zoom's recording
              features and AI note-taking services. Texas permits recording with the consent of one party to the conversation; you also give your own express
              consent here so that it applies wherever you are located.
            </p>
            <Conspicuous>
              By joining a session, you (1) consent to being recorded, transcribed, and summarized; (2) waive any expectation of privacy in what you say
              or show during the session; and (3) to the fullest extent permitted by law, release, waive, and forever discharge {OWNER} and his agents
              from any and all claims, demands, and causes of action of any kind arising from or related to the audio or video recording, transcription,
              summarization, storage, or use of the session as described in these Terms, including claims for invasion of privacy, wiretapping or
              eavesdropping, misappropriation, or right of publicity. If you do not consent, do not join the session; you may instead ask me in writing
              before the session to proceed without recording, which I may accept or decline.
            </Conspicuous>
            <p>
              You may not record, capture, or rebroadcast any Session, in whole or in part, without my prior written consent. Do not share anything during a
              Session that you are not willing to have recorded and used as described in Section 5.
            </p>
          </>
        ),
      },
      {
        h: 'Intellectual property',
        body: (
          <>
            <p>
              All Session recordings, transcripts, summaries, notes, and all ideas, frameworks, methods, strategies, presentations, materials, and other
              content I create, present, or share before, during, or after a Session ("My Content") are and remain my <b>sole and exclusive intellectual
              property</b>, whether or not registered. Nothing in these Terms transfers ownership of My Content to you.
            </p>
            <p>
              I grant you a limited, personal, non-exclusive, non-transferable, revocable license to use My Content shared with you for your own internal
              purposes. You may not copy, publish, sell, distribute, create derivative works from, or use My Content to train artificial intelligence models
              without my prior written consent.
            </p>
            <p>
              <b>Session recordings and everything captured in them are mine to use as I choose.</b> To the fullest extent permitted by law, you assign to me
              all right, title, and interest in the recordings, transcripts, and summaries of each Session, including your contributions to them. To the extent
              any of those rights cannot be assigned, you grant me a perpetual, irrevocable, worldwide, royalty-free, fully paid, transferable, and
              sublicensable license to use, copy, edit, adapt, publish, distribute, display, perform, monetize, and create derivative works from them, in
              any media now known or later developed, for any purpose, including commercial purposes.
            </p>
            <p>
              This includes the right to use your name, image, likeness, voice, and statements as captured in a Session. You waive any right to inspect or
              approve these uses, and you agree you are not owed any compensation, credit, or royalty for them. You represent that you have the right to share
              whatever you contribute and that it does not violate anyone else's rights or any confidentiality obligation.
            </p>
          </>
        ),
      },
      {
        h: 'Brand and trademarks',
        body: (
          <>
            <p>
              MrJackDee™ and the related names, logos, and look and feel of the App are my trademarks and trade dress. You may
              not use them, or anything confusingly similar, without my prior written consent, including in domain names, social media handles, ads,
              or products, or in any way that suggests my sponsorship or endorsement.
            </p>
            <p>
              Phi Beta Sigma Fraternity, Inc. names, seals, and marks belong to Phi Beta Sigma Fraternity, Inc. and are shown to identify my membership only.
              This App is a personal project and is not operated, sponsored, or endorsed by Phi Beta Sigma Fraternity, Inc.
            </p>
          </>
        ),
      },
      {
        h: 'Informational purposes only',
        body: (
          <p>
            Sessions and My Content are general information and conversation. They are not legal, tax, financial, investment, medical, mental health, or
            other professional advice, and no professional or fiduciary relationship is created unless we sign a separate written agreement. You are solely
            responsible for your own decisions and results.
          </p>
        ),
      },
      {
        h: 'Third-party services',
        body: (
          <p>
            The App relies on third parties, including Calendly (scheduling), Zoom (meetings), and Cloudflare (hosting). Their services are governed by their
            own terms and privacy policies. I am not responsible for their acts, omissions, outages, or security incidents.
          </p>
        ),
      },
      {
        h: 'Disclaimers and limitation of liability',
        body: (
          <>
            <Conspicuous>
              The App, sessions, and My Content are provided "as is" and "as available," without warranties of any kind, express or implied, including
              merchantability, fitness for a particular purpose, accuracy, and non-infringement.
            </Conspicuous>
            <Conspicuous>
              To the fullest extent permitted by law, {OWNER} will not be liable for any indirect, incidental, special, consequential, exemplary, or
              punitive damages, or for lost profits, revenue, data, or opportunities, arising from or related to the App, any session, or My Content,
              even if advised of the possibility. My total liability for all claims of any kind will not exceed the greater of the amount you paid me
              for the session giving rise to the claim or one hundred U.S. dollars ($100). These limits apply even if a remedy fails of its essential
              purpose and, to the extent permitted by Texas law, apply to claims based on my own negligence.
            </Conspicuous>
          </>
        ),
      },
      {
        h: 'Indemnification',
        body: (
          <p>
            You agree to defend, indemnify, and hold harmless {OWNER} and his agents from any claims, losses, liabilities, damages, and expenses (including
            reasonable attorneys' fees) arising from your use of the App or Sessions, your content, your violation of these Terms, or your violation of any
            law or third-party right.
          </p>
        ),
      },
      {
        h: 'Governing law, disputes, and venue',
        body: (
          <>
            <p>
              These Terms are governed by the laws of the State of Texas, without regard to conflict-of-law rules. Before filing any claim, you agree to
              email me a written description of the dispute and give me 30 days to try to resolve it informally.
            </p>
            <Conspicuous>
              Any claim must be brought exclusively in the state courts located in Dallas County, Texas, or the United States District Court for the
              Northern District of Texas, Dallas Division, and you consent to their personal jurisdiction and venue.
              Claims must be brought individually, not as a plaintiff or class member in any class, collective, or representative action. To the extent
              permitted by law, any claim must be filed within one year after it arises or it is permanently barred.
            </Conspicuous>
          </>
        ),
      },
      {
        h: 'General',
        body: (
          <p>
            If any part of these Terms is found unenforceable, it will be enforced to the maximum extent permitted and the rest will remain in effect. My
            failure to enforce a provision is not a waiver. You may not assign these Terms; I may. Sections 4, 5, 6, 9, 10, and 11 survive any end of your
            use of the App. I may update these Terms by posting a new version here; continuing to use the App or joining a Session after an update means
            you accept it. Questions: <Mail />.
          </p>
        ),
      },
    ]}
  />
);

/* ======================= Privacy Policy ======================= */
export const PrivacyPolicy = () => (
  <Page
    title="Privacy Policy"
    intro={
      <p>
        This Privacy Policy explains how {OWNER} ("I," "me," or "my") collects, uses, and shares information
        through {SITE} (the "App") and the sessions booked through it. It should be read together with the <a href="#terms">Terms of Service</a>.
      </p>
    }
    sections={[
      {
        h: 'Information I collect',
        body: (
          <ul>
            <li><b>Booking information:</b> your name, email address, phone number if you choose to provide it, chosen time, time zone, and anything you share about what you want to discuss.</li>
            <li><b>Session information:</b> audio, video, screen share, chat, and the recordings, transcripts, and summaries of Sessions, as described in the Terms.</li>
            <li><b>Technical information:</b> IP address, browser and device type, and pages requested, collected by my hosting provider for security and reliability.</li>
          </ul>
        ),
      },
      {
        h: 'How I use it',
        body: (
          <ul>
            <li>To schedule, confirm, remind you of, reschedule, and hold Sessions.</li>
            <li>To prepare for, record, transcribe, summarize, and follow up on Sessions.</li>
            <li>To develop my own content and services, consistent with the Terms of Service.</li>
            <li>To secure the App, prevent misuse, enforce my Terms, and comply with law.</li>
          </ul>
        ),
      },
      {
        h: 'How it is shared',
        body: (
          <>
            <p><b>I do not sell your personal data and do not share it for targeted advertising.</b> I share it only with:</p>
            <ul>
              <li>Service providers that run the App and Sessions, including Calendly (scheduling and confirmation emails), Zoom (meetings and recordings), AI transcription or note-taking tools, and Cloudflare (hosting and security).</li>
              <li>Professional advisers, or authorities when required by law, to protect my rights, or to respond to legal process.</li>
              <li>A successor, if my business or this App is transferred.</li>
            </ul>
          </>
        ),
      },
      {
        h: 'Cookies and browser storage',
        body: (
          <p>
            The App does not use advertising or cross-site tracking cookies. It remembers a few display preferences in your browser, such as 12-hour or
            24-hour time and the time zone you choose, and, if you save the App to your home screen, caches its pages so it opens quickly. You can clear
            these in your browser settings.
          </p>
        ),
      },
      {
        h: 'Retention and security',
        body: (
          <p>
            I keep booking information and Session materials for as long as needed for the purposes above, for my records, and to protect my legal rights.
            I use reasonable safeguards, but no online service is completely secure, and I cannot guarantee security of information sent over the internet.
          </p>
        ),
      },
      {
        h: 'Text messages',
        body: (
          <>
            <p>
              Giving a phone number is optional. If you also check the box to receive texts, I may send text messages about your booking, such as
              confirmations, reminders, and schedule changes. Message frequency varies, and message and data rates may apply. Consent to texts is not
              a condition of booking.
            </p>
            <p>
              Reply <b>STOP</b> to any message to opt out, or <b>HELP</b> for help, or email <Mail />. <b>Mobile numbers and text-messaging consent are
              never sold or shared with third parties or affiliates for their marketing purposes.</b> They are shared only with the service providers that
              deliver the messages.
            </p>
          </>
        ),
      },
      {
        h: 'Your rights and choices',
        body: (
          <>
            <p>
              Depending on where you live, including under the Texas Data Privacy and Security Act where it applies, you may have the right to request access
              to, correction of, deletion of, or a copy of your personal data, and to appeal a decision about your request. Email <Mail /> with "Privacy
              Request" in the subject. I will verify and respond within the time required by law. If I deny your request, you may appeal by replying to my
              decision, and if the appeal is denied you may contact the Texas Attorney General.
            </p>
            <p>
              Requests to delete Session recordings and materials are subject to my ownership rights and legal retention needs described in the Terms of
              Service. You can reschedule or cancel a booking using the links in your confirmation email.
            </p>
          </>
        ),
      },
      {
        h: 'Children',
        body: <p>The App is for adults 18 and older. I do not knowingly collect information from children under 13; if I learn I have, I will delete it.</p>,
      },
      {
        h: 'Changes and contact',
        body: (
          <p>
            I may update this policy by posting a new version here with a new effective date. Questions or requests: <Mail />.
          </p>
        ),
      },
    ]}
  />
);
