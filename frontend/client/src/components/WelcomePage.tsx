import { Link } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';

const greetingFor = (hour: number): string => {
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 22) return 'Good evening';
  return 'Late shift';
};

interface IAction {
  to: string;
  eyebrow: string;
  title: string;
  blurb: string;
  icon: React.ReactNode;
}

const SearchGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <circle cx="11" cy="11" r="6.25" />
    <path d="m20 20-3.6-3.6" strokeLinecap="round" />
  </svg>
);

const PlusGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <circle cx="12" cy="12" r="9.25" />
    <path d="M12 7.5v9M7.5 12h9" strokeLinecap="round" />
  </svg>
);

const StethoscopeGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <path d="M6 3v6a4 4 0 0 0 8 0V3" strokeLinecap="round" />
    <path d="M10 13v2.5A4.5 4.5 0 0 0 14.5 20h0A4.5 4.5 0 0 0 19 15.5V13" strokeLinecap="round" />
    <circle cx="19" cy="11" r="2" />
  </svg>
);

const actions: IAction[] = [
  {
    to: '/owners/list',
    eyebrow: '01 / 03',
    title: 'Find an owner',
    blurb: 'Search the registry by last name and pull up their pets in one click.',
    icon: <SearchGlyph />,
  },
  {
    to: '/owners/new',
    eyebrow: '02 / 03',
    title: 'Register someone new',
    blurb: 'Add a new owner profile — address, phone, ready for their first visit.',
    icon: <PlusGlyph />,
  },
  {
    to: '/vets',
    eyebrow: '03 / 03',
    title: 'Veterinarians on shift',
    blurb: 'Browse the team and their specialties, from dentistry to dermatology.',
    icon: <StethoscopeGlyph />,
  },
];

interface IScheduleItem {
  time: string;
  pet: string;
  reason: string;
}

const schedule: IScheduleItem[] = [
  { time: '09:00', pet: 'Margot · Golden Retriever', reason: 'Annual checkup' },
  { time: '10:30', pet: 'Olive · Tabby', reason: 'Vaccination' },
  { time: '13:00', pet: 'Pip · Cockatiel', reason: 'Post-op review' },
  { time: '14:30', pet: 'Bear · Bernese', reason: 'Dental cleaning' },
  { time: '16:15', pet: 'Juno · Lop Rabbit', reason: 'New patient intake' },
];

const PawSilhouette = () => (
  <svg
    viewBox="0 0 200 200"
    aria-hidden
    className="h-full w-full"
    fill="currentColor"
  >
    <ellipse cx="100" cy="128" rx="46" ry="40" />
    <ellipse cx="56" cy="74" rx="16" ry="22" transform="rotate(-18 56 74)" />
    <ellipse cx="88" cy="52" rx="16" ry="24" transform="rotate(-6 88 52)" />
    <ellipse cx="124" cy="52" rx="16" ry="24" transform="rotate(6 124 52)" />
    <ellipse cx="156" cy="74" rx="16" ry="22" transform="rotate(18 156 74)" />
  </svg>
);

const LeafSprig = () => (
  <svg viewBox="0 0 120 200" aria-hidden className="h-full w-full" fill="currentColor">
    <path d="M60 196c0-60 8-110 40-150-30 16-44 46-46 80-2-28-12-58-38-78 22 36 28 88 28 148h16z" />
  </svg>
);

const WelcomePage = () => {
  const { user } = useAuth();
  const greeting = greetingFor(new Date().getHours());
  const name = user?.username ?? 'friend';
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="text-spring-brown">
      {/* ─────────────────────────  HERO  ───────────────────────── */}
      <section className="relative isolate overflow-hidden rounded-3xl border border-spring-brown/15 bg-paper px-6 py-14 shadow-[0_30px_60px_-30px_rgba(52,48,45,0.25)] sm:px-12 sm:py-20 lg:px-16 lg:py-24">
        {/* dotted-grid backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,rgba(52,48,45,0.10)_1px,transparent_0)] [background-size:14px_14px] opacity-70"
        />
        {/* paper-edge gradient */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-transparent via-paper-deep/50 to-paper-deep/80"
        />
        {/* organic paw silhouette */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-10 h-[340px] w-[340px] text-spring-green/30 sm:h-[420px] sm:w-[420px] lg:h-[520px] lg:w-[520px] [animation:welcome-drift_14s_ease-in-out_infinite]"
        >
          <PawSilhouette />
        </div>
        {/* leaf sprig accent */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-8 right-32 hidden h-32 w-20 text-spring-dark-green/70 [transform:rotate(-12deg)] md:block"
        >
          <LeafSprig />
        </div>

        <div className="relative max-w-3xl">
          <p
            className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-spring-dark-green opacity-0 [animation:welcome-rise_700ms_ease-out_forwards]"
          >
            <span aria-hidden className="inline-block h-px w-10 bg-spring-dark-green" />
            Spring PetClinic · Est. 2003
          </p>

          <h1
            className="mt-7 font-serif text-[2.75rem] leading-[1.02] tracking-tight text-spring-brown opacity-0 [animation:welcome-rise_700ms_ease-out_120ms_forwards] sm:text-6xl lg:text-[5.25rem]"
            style={{ fontVariationSettings: "'opsz' 96" }}
          >
            {greeting},
            <br />
            <span className="italic font-medium text-spring-dark-green">{name}</span>
            <span className="text-spring-green">.</span>
          </h1>

          <p className="mt-8 max-w-xl text-lg leading-relaxed text-spring-brown/80 opacity-0 [animation:welcome-rise_700ms_ease-out_240ms_forwards]">
            It's <span className="font-display font-bold uppercase tracking-wide text-spring-brown">{today}</span>.
            Check in on owners, schedule today's visits, and keep the clinic humming.
            Everything you need to take care of the four-legged regulars.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4 opacity-0 [animation:welcome-rise_700ms_ease-out_360ms_forwards]">
            <Link
              to="/owners/list"
              className="group inline-flex items-center gap-3 rounded-full bg-spring-brown px-7 py-3.5 font-display text-xs uppercase tracking-[0.18em] text-paper transition-colors hover:bg-spring-dark-green focus:bg-spring-dark-green focus:outline-none"
            >
              Find an owner
              <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              to="/owners/new"
              className="group inline-flex items-center gap-3 rounded-full border border-spring-brown/40 bg-transparent px-7 py-3.5 font-display text-xs uppercase tracking-[0.18em] text-spring-brown transition-colors hover:border-spring-dark-green hover:text-spring-dark-green focus:border-spring-dark-green focus:outline-none"
            >
              Register someone new
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────  QUICK ACTIONS  ───────────────────────── */}
      <section className="mt-16 sm:mt-20">
        <div className="mb-8 flex items-baseline justify-between gap-6">
          <h2 className="font-serif text-3xl tracking-tight text-spring-brown sm:text-4xl">
            Pick up where you left off
          </h2>
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.28em] text-spring-grey sm:inline">
            ¶ three ways in
          </span>
        </div>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {actions.map((action) => (
            <li key={action.to}>
              <Link
                to={action.to}
                className="group relative flex h-full flex-col gap-5 overflow-hidden border-2 border-spring-brown bg-paper p-7 transition-[transform,box-shadow] duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0_0_var(--color-spring-green)] focus:-translate-x-1 focus:-translate-y-1 focus:shadow-[10px_10px_0_0_var(--color-spring-green)] focus:outline-none"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-spring-grey">
                    {action.eyebrow}
                  </span>
                  <span className="h-9 w-9 text-spring-dark-green transition-transform duration-300 group-hover:rotate-[-8deg]">
                    {action.icon}
                  </span>
                </div>

                <div className="mt-auto">
                  <h3 className="font-serif text-2xl leading-tight text-spring-brown">
                    {action.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-spring-brown/70">
                    {action.blurb}
                  </p>
                </div>

                <span
                  aria-hidden
                  className="flex items-center gap-2 font-display text-[11px] uppercase tracking-[0.22em] text-spring-dark-green"
                >
                  Enter
                  <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ─────────────────────────  TODAY · DAILY BRIEF  ───────────────────────── */}
      <section className="mt-20 grid grid-cols-1 gap-10 lg:grid-cols-5 lg:items-start">
        <div className="lg:col-span-2">
          <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-spring-dark-green">
            <span aria-hidden className="inline-block h-px w-8 bg-spring-dark-green" />
            No. 003 · Daily brief
          </p>
          <h2 className="mt-4 font-serif text-4xl leading-[1.08] tracking-tight text-spring-brown sm:text-5xl">
            A quiet morning,
            <br />
            <span className="italic text-spring-dark-green">before the rush.</span>
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-spring-brown/75">
            Five appointments on the books today — mostly routine, one new intake. Margot is back for her annual, and Juno (a very small rabbit) is meeting us for the first time.
          </p>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.22em] text-spring-grey">
            * sample roster · wire to your scheduling api
          </p>
        </div>

        <div className="relative lg:col-span-3">
          {/* receipt-style ticket */}
          <div className="relative border-2 border-spring-brown bg-paper">
            {/* perforation top */}
            <div
              aria-hidden
              className="absolute inset-x-0 -top-px h-1 bg-[repeating-linear-gradient(to_right,var(--color-spring-brown)_0_6px,transparent_6px_12px)]"
            />
            <div className="flex items-center justify-between border-b border-dashed border-spring-brown/40 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="inline-block h-2 w-2 rounded-full bg-spring-green" />
                <span className="font-display text-xs uppercase tracking-[0.22em] text-spring-brown">
                  PetClinic Daily
                </span>
              </div>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-spring-grey">
                {today}
              </span>
            </div>

            <ol className="divide-y divide-dashed divide-spring-brown/30">
              {schedule.map((item, idx) => (
                <li
                  key={item.time}
                  className="grid grid-cols-[auto_1fr_auto] items-baseline gap-4 px-6 py-4 sm:gap-6"
                >
                  <span className="font-mono text-sm tabular-nums text-spring-brown">
                    {item.time}
                  </span>
                  <span className="truncate">
                    <span className="font-serif text-lg italic text-spring-brown">
                      {item.pet}
                    </span>
                    <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.22em] text-spring-grey">
                      · {item.reason}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-spring-dark-green">
                    Rm {idx + 1}
                  </span>
                </li>
              ))}
            </ol>

            <div className="flex items-center justify-between border-t border-dashed border-spring-brown/40 px-6 py-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-spring-grey">
                Total · {schedule.length} appointments
              </span>
              <span className="font-display text-xs uppercase tracking-[0.22em] text-spring-dark-green">
                Doors open 08:30
              </span>
            </div>
            {/* perforation bottom */}
            <div
              aria-hidden
              className="absolute inset-x-0 -bottom-px h-1 bg-[repeating-linear-gradient(to_right,var(--color-spring-brown)_0_6px,transparent_6px_12px)]"
            />
          </div>

          {/* decorative stamp */}
          <div
            aria-hidden
            className="absolute -right-3 -top-5 hidden rotate-[8deg] border-2 border-spring-dark-green bg-paper px-3 py-1 font-display text-[10px] uppercase tracking-[0.22em] text-spring-dark-green shadow-[3px_3px_0_0_rgba(95,161,52,0.25)] sm:block"
          >
            Filed · today
          </div>
        </div>
      </section>

      {/* ─────────────────────────  CLOSING  ───────────────────────── */}
      <section className="mt-20 border-t border-spring-brown/15 pt-12">
        <p className="max-w-3xl font-serif text-2xl leading-snug text-spring-brown/70 sm:text-3xl">
          <span aria-hidden className="mr-1 align-top font-serif text-4xl italic text-spring-dark-green">
            “
          </span>
          Better care begins with knowing the names —
          <span className="italic text-spring-dark-green"> of the pet, of the owner, of the doctor.</span>
        </p>
        <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.28em] text-spring-grey">
          — house principle, posted at the front desk
        </p>
      </section>
    </div>
  );
};

export default WelcomePage;
